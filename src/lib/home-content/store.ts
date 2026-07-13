import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { Pool, PoolClient } from "pg";

import { getPool } from "@/lib/reservations/postgres";

import { DEFAULT_HOME_CONTENT } from "./default-content";
import { homeContentDocumentSchema } from "./schema";
import type { HomeContentDocument, HomeContentRevisionRecord } from "./types";

type PublishHomeContentInput = {
  document: HomeContentDocument;
  expectedVersion: number;
  actorId: string | null;
  restoredFromVersion?: number | null;
};

type PersistedFallbackSnapshot = {
  revisions: Array<{
    revisionVersion: number;
    document: HomeContentDocument;
    updatedAt: string;
    updatedByUserId: string | null;
    restoredFromVersion: number | null;
  }>;
};

export interface HomeContentStoreLike {
  getPublished(): Promise<HomeContentRevisionRecord>;
  listRevisions(limit?: number): Promise<HomeContentRevisionRecord[]>;
  publish(input: PublishHomeContentInput): Promise<HomeContentRevisionRecord>;
  restore(version: number, actorId: string | null, expectedVersion: number): Promise<HomeContentRevisionRecord>;
}

const FALLBACK_STORAGE_PATH = ".data/wakaya-home-content.snapshot.json";
const DEFAULT_UPDATED_AT = new Date(0).toISOString();
const MEMORY_REVISIONS = new Map<string, PersistedFallbackSnapshot["revisions"]>();

function cloneDocument(document: HomeContentDocument): HomeContentDocument {
  return structuredClone(document);
}

function defaultRecord(): HomeContentRevisionRecord {
  return {
    revisionVersion: 0,
    document: cloneDocument(DEFAULT_HOME_CONTENT),
    updatedAt: DEFAULT_UPDATED_AT,
    updatedByUserId: null,
    restoredFromVersion: null,
    source: "default",
  };
}

function normalizeRecord(
  value: PersistedFallbackSnapshot["revisions"][number],
): HomeContentRevisionRecord {
  return {
    revisionVersion: value.revisionVersion,
    document: homeContentDocumentSchema.parse(value.document),
    updatedAt: value.updatedAt,
    updatedByUserId: value.updatedByUserId,
    restoredFromVersion: value.restoredFromVersion,
    source: "published",
  };
}

function serializeRecord(record: HomeContentRevisionRecord): PersistedFallbackSnapshot["revisions"][number] {
  return {
    revisionVersion: record.revisionVersion,
    document: cloneDocument(record.document),
    updatedAt: record.updatedAt,
    updatedByUserId: record.updatedByUserId,
    restoredFromVersion: record.restoredFromVersion,
  };
}

function resolveFallbackStoragePath(): string | null {
  const configured = process.env.WAKAYA_HOME_CONTENT_PATH?.trim();
  if (configured) {
    return configured;
  }

  return process.env.NODE_ENV === "test" ? null : FALLBACK_STORAGE_PATH;
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function isMissingRelationError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "42P01",
  );
}

function readPersistedSnapshot(storagePath: string): PersistedFallbackSnapshot | null {
  try {
    if (!existsSync(storagePath)) {
      return null;
    }

    const raw = readFileSync(storagePath, "utf8").trim();
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as PersistedFallbackSnapshot;
  } catch {
    return null;
  }
}

function writePersistedSnapshot(storagePath: string, snapshot: PersistedFallbackSnapshot) {
  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, JSON.stringify(snapshot, null, 2));
}

class FallbackHomeContentStore implements HomeContentStoreLike {
  private storagePath = resolveFallbackStoragePath();

  private readRecords(): HomeContentRevisionRecord[] {
    if (!this.storagePath) {
      return (MEMORY_REVISIONS.get("test") ?? []).map(normalizeRecord);
    }

    const fromMemory = MEMORY_REVISIONS.get(this.storagePath);
    if (fromMemory) {
      return fromMemory.map(normalizeRecord);
    }

    const persisted = readPersistedSnapshot(this.storagePath);
    const revisions = persisted?.revisions ?? [];
    MEMORY_REVISIONS.set(this.storagePath, revisions);
    return revisions.map(normalizeRecord);
  }

  private writeRecords(records: HomeContentRevisionRecord[]) {
    const serialized = records
      .slice()
      .sort((left, right) => right.revisionVersion - left.revisionVersion)
      .map((record) => serializeRecord(record));

    if (!this.storagePath) {
      MEMORY_REVISIONS.set("test", serialized);
      return;
    }

    MEMORY_REVISIONS.set(this.storagePath, serialized);
    writePersistedSnapshot(this.storagePath, { revisions: serialized });
  }

  async getPublished(): Promise<HomeContentRevisionRecord> {
    return this.readRecords()[0] ?? defaultRecord();
  }

  async listRevisions(limit = 10): Promise<HomeContentRevisionRecord[]> {
    return this.readRecords().slice(0, limit);
  }

  async publish(input: PublishHomeContentInput): Promise<HomeContentRevisionRecord> {
    const document = homeContentDocumentSchema.parse(input.document);
    const records = this.readRecords();
    const currentVersion = records[0]?.revisionVersion ?? 0;

    if (input.expectedVersion !== currentVersion) {
      throw new Error("home_content_version_conflict");
    }

    const nextRecord: HomeContentRevisionRecord = {
      revisionVersion: currentVersion + 1,
      document,
      updatedAt: new Date().toISOString(),
      updatedByUserId: input.actorId,
      restoredFromVersion: input.restoredFromVersion ?? null,
      source: "published",
    };

    this.writeRecords([nextRecord, ...records]);
    return nextRecord;
  }

  async restore(version: number, actorId: string | null, expectedVersion: number): Promise<HomeContentRevisionRecord> {
    const records = this.readRecords();
    const source = records.find((record) => record.revisionVersion === version);
    if (!source) {
      throw new Error("home_content_revision_not_found");
    }

    return this.publish({
      document: source.document,
      expectedVersion,
      actorId,
      restoredFromVersion: version,
    });
  }
}

function mapRowToRecord(row: {
  version: number;
  document: HomeContentDocument;
  created_at: string | Date;
  published_by_user_id: string | null;
  restored_from_version: number | null;
}): HomeContentRevisionRecord {
  return {
    revisionVersion: row.version,
    document: homeContentDocumentSchema.parse(row.document),
    updatedAt: typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString(),
    updatedByUserId: row.published_by_user_id,
    restoredFromVersion: row.restored_from_version,
    source: "published",
  };
}

class PostgresHomeContentStore implements HomeContentStoreLike {
  constructor(private readonly pool: Pool) {}

  private async insertRevision(
    client: PoolClient,
    input: PublishHomeContentInput,
  ): Promise<HomeContentRevisionRecord> {
    const inserted = await client.query<{
      version: number;
      document: HomeContentDocument;
      created_at: string;
      published_by_user_id: string | null;
      restored_from_version: number | null;
    }>(
      `
        insert into home_content_revision (
          document,
          published_by_user_id,
          restored_from_version
        )
        values ($1::jsonb, $2, $3)
        returning version, document, created_at, published_by_user_id, restored_from_version
      `,
      [JSON.stringify(input.document), input.actorId, input.restoredFromVersion ?? null],
    );

    return mapRowToRecord(inserted.rows[0]);
  }

  async getPublished(): Promise<HomeContentRevisionRecord> {
    try {
      const result = await this.pool.query<{
        version: number;
        document: HomeContentDocument;
        created_at: string;
        published_by_user_id: string | null;
        restored_from_version: number | null;
      }>(
        `
          select version, document, created_at, published_by_user_id, restored_from_version
          from home_content_revision
          order by version desc
          limit 1
        `,
      );

      return result.rows[0] ? mapRowToRecord(result.rows[0]) : defaultRecord();
    } catch (error) {
      if (isMissingRelationError(error)) {
        return defaultRecord();
      }
      throw error;
    }
  }

  async listRevisions(limit = 10): Promise<HomeContentRevisionRecord[]> {
    try {
      const result = await this.pool.query<{
        version: number;
        document: HomeContentDocument;
        created_at: string;
        published_by_user_id: string | null;
        restored_from_version: number | null;
      }>(
        `
          select version, document, created_at, published_by_user_id, restored_from_version
          from home_content_revision
          order by version desc
          limit $1
        `,
        [limit],
      );

      return result.rows.map((row) => mapRowToRecord(row));
    } catch (error) {
      if (isMissingRelationError(error)) {
        return [];
      }
      throw error;
    }
  }

  async publish(input: PublishHomeContentInput): Promise<HomeContentRevisionRecord> {
    const document = homeContentDocumentSchema.parse(input.document);
    const client = await this.pool.connect();

    try {
      await client.query("begin");
      const current = await client.query<{ version: number }>(
        `
          select version
          from home_content_revision
          order by version desc
          limit 1
          for update
        `,
      );
      const currentVersion = current.rows[0]?.version ?? 0;

      if (input.expectedVersion !== currentVersion) {
        throw new Error("home_content_version_conflict");
      }

      const created = await this.insertRevision(client, {
        ...input,
        document,
      });
      await client.query("commit");
      return created;
    } catch (error) {
      await client.query("rollback");
      if (isMissingRelationError(error)) {
        throw new Error("home_content_store_not_ready");
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async restore(version: number, actorId: string | null, expectedVersion: number): Promise<HomeContentRevisionRecord> {
    const client = await this.pool.connect();

    try {
      await client.query("begin");
      const current = await client.query<{ version: number }>(
        `
          select version
          from home_content_revision
          order by version desc
          limit 1
          for update
        `,
      );
      const currentVersion = current.rows[0]?.version ?? 0;
      if (expectedVersion !== currentVersion) {
        throw new Error("home_content_version_conflict");
      }

      const source = await client.query<{ document: HomeContentDocument }>(
        `
          select document
          from home_content_revision
          where version = $1
        `,
        [version],
      );
      if (!source.rows[0]) {
        throw new Error("home_content_revision_not_found");
      }

      const created = await this.insertRevision(client, {
        document: homeContentDocumentSchema.parse(source.rows[0].document),
        expectedVersion,
        actorId,
        restoredFromVersion: version,
      });
      await client.query("commit");
      return created;
    } catch (error) {
      await client.query("rollback");
      if (isMissingRelationError(error)) {
        throw new Error("home_content_store_not_ready");
      }
      throw error;
    } finally {
      client.release();
    }
  }
}

const fallbackStore = new FallbackHomeContentStore();

function activeStore(): HomeContentStoreLike {
  return hasDatabaseUrl() ? new PostgresHomeContentStore(getPool()) : fallbackStore;
}

export const homeContentStore: HomeContentStoreLike = {
  getPublished() {
    return activeStore().getPublished();
  },
  listRevisions(limit?: number) {
    return activeStore().listRevisions(limit);
  },
  publish(input: PublishHomeContentInput) {
    return activeStore().publish(input);
  },
  restore(version: number, actorId: string | null, expectedVersion: number) {
    return activeStore().restore(version, actorId, expectedVersion);
  },
};
