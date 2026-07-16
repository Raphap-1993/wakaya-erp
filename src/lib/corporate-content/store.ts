import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { Pool, PoolClient } from "pg";

import { getPool } from "@/lib/reservations/postgres";

import { DEFAULT_CORPORATE_CONTENT } from "./default-document";
import {
  corporateContentDocumentSchema,
  parseStoredCorporateContentDocument,
} from "./schema";
import type {
  CorporateContentDocument,
  CorporateContentRevisionRecord,
  CorporateContentRevisionSummary,
  PublishCorporateContentInput,
} from "./types";

type PersistedRevision = {
  revisionVersion: number;
  document: CorporateContentDocument;
  updatedAt: string;
  updatedByUserId: string | null;
  restoredFromVersion: number | null;
};

type PersistedSnapshot = { revisions: PersistedRevision[] };

export interface CorporateContentStoreLike {
  getPublished(): Promise<CorporateContentRevisionRecord>;
  listRevisions(limit?: number): Promise<CorporateContentRevisionSummary[]>;
  publish(input: PublishCorporateContentInput): Promise<CorporateContentRevisionRecord>;
  restore(
    version: number,
    actorId: string | null,
    expectedVersion: number,
  ): Promise<CorporateContentRevisionRecord>;
}

const FALLBACK_STORAGE_PATH = ".data/wakaya-corporate-content.snapshot.json";
const DEFAULT_UPDATED_AT = new Date(0).toISOString();
const MEMORY_REVISIONS = new Map<string, PersistedRevision[]>();

function cloneDocument<T extends CorporateContentDocument>(document: T): T {
  return structuredClone(document);
}

function defaultRecord(): CorporateContentRevisionRecord {
  return {
    revisionVersion: 0,
    document: cloneDocument(DEFAULT_CORPORATE_CONTENT),
    updatedAt: DEFAULT_UPDATED_AT,
    updatedByUserId: null,
    restoredFromVersion: null,
    source: "default",
  };
}

function normalizePersistedRevision(revision: PersistedRevision): CorporateContentRevisionRecord {
  return {
    ...revision,
    document: parseStoredCorporateContentDocument(revision.document),
    source: "published",
  };
}

function serializeRecord(record: CorporateContentRevisionRecord): PersistedRevision {
  return {
    revisionVersion: record.revisionVersion,
    document: cloneDocument(record.document),
    updatedAt: record.updatedAt,
    updatedByUserId: record.updatedByUserId,
    restoredFromVersion: record.restoredFromVersion,
  };
}

function summarizeRecord(
  record: CorporateContentRevisionRecord,
): CorporateContentRevisionSummary {
  return {
    revisionVersion: record.revisionVersion,
    updatedAt: record.updatedAt,
    updatedByUserId: record.updatedByUserId,
    restoredFromVersion: record.restoredFromVersion,
    source: record.source,
  };
}

function fallbackStoragePath() {
  const configured = process.env.WAKAYA_CORPORATE_CONTENT_PATH?.trim();
  if (configured) return configured;
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

function readSnapshot(path: string): PersistedSnapshot | null {
  try {
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, "utf8").trim();
    return raw ? (JSON.parse(raw) as PersistedSnapshot) : null;
  } catch {
    return null;
  }
}

function writeSnapshot(path: string, snapshot: PersistedSnapshot) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(snapshot, null, 2));
}

class FallbackCorporateContentStore implements CorporateContentStoreLike {
  private readonly storagePath = fallbackStoragePath();

  private memoryKey() {
    return this.storagePath ?? "test";
  }

  private readRecords() {
    const key = this.memoryKey();
    const cached = MEMORY_REVISIONS.get(key);
    if (cached) return cached.map(normalizePersistedRevision);

    const revisions = this.storagePath ? readSnapshot(this.storagePath)?.revisions ?? [] : [];
    MEMORY_REVISIONS.set(key, revisions);
    return revisions.map(normalizePersistedRevision);
  }

  private writeRecords(records: CorporateContentRevisionRecord[]) {
    const revisions = records
      .slice()
      .sort((left, right) => right.revisionVersion - left.revisionVersion)
      .map(serializeRecord);
    MEMORY_REVISIONS.set(this.memoryKey(), revisions);
    if (this.storagePath) writeSnapshot(this.storagePath, { revisions });
  }

  async getPublished() {
    return this.readRecords()[0] ?? defaultRecord();
  }

  async listRevisions(limit = 10) {
    return this.readRecords().slice(0, limit).map(summarizeRecord);
  }

  async publish(input: PublishCorporateContentInput) {
    const document = parseStoredCorporateContentDocument(input.document);
    const records = this.readRecords();
    const currentVersion = records[0]?.revisionVersion ?? 0;
    if (input.expectedVersion !== currentVersion) {
      throw new Error("corporate_content_version_conflict");
    }

    const created: CorporateContentRevisionRecord = {
      revisionVersion: currentVersion + 1,
      document: cloneDocument(document),
      updatedAt: new Date().toISOString(),
      updatedByUserId: input.actorId,
      restoredFromVersion: input.restoredFromVersion ?? null,
      source: "published",
    };
    this.writeRecords([created, ...records]);
    return created;
  }

  async restore(version: number, actorId: string | null, expectedVersion: number) {
    const source = this.readRecords().find((record) => record.revisionVersion === version);
    if (!source) throw new Error("corporate_content_revision_not_found");
    return this.publish({
      document: source.document,
      expectedVersion,
      actorId,
      restoredFromVersion: version,
    });
  }
}

type CorporateContentRow = {
  version: number | string;
  document: CorporateContentDocument;
  created_at: string | Date;
  published_by_user_id: string | null;
  restored_from_version: number | string | null;
};

type CorporateContentSummaryRow = Omit<CorporateContentRow, "document">;

function mapRow(row: CorporateContentRow): CorporateContentRevisionRecord {
  return {
    revisionVersion: Number(row.version),
    document: parseStoredCorporateContentDocument(row.document),
    updatedAt: typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString(),
    updatedByUserId: row.published_by_user_id,
    restoredFromVersion:
      row.restored_from_version === null ? null : Number(row.restored_from_version),
    source: "published",
  };
}

function mapSummaryRow(row: CorporateContentSummaryRow): CorporateContentRevisionSummary {
  return {
    revisionVersion: Number(row.version),
    updatedAt: typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString(),
    updatedByUserId: row.published_by_user_id,
    restoredFromVersion:
      row.restored_from_version === null ? null : Number(row.restored_from_version),
    source: "published",
  };
}

export class PostgresCorporateContentStore implements CorporateContentStoreLike {
  constructor(private readonly pool: Pool) {}

  private async insertRevision(
    client: PoolClient,
    input: PublishCorporateContentInput,
  ) {
    const result = await client.query<CorporateContentRow>(
      `
        insert into corporate_content_revision (
          document,
          published_by_user_id,
          restored_from_version
        )
        values ($1::jsonb, $2, $3)
        returning version, document, created_at, published_by_user_id, restored_from_version
      `,
      [JSON.stringify(input.document), input.actorId, input.restoredFromVersion ?? null],
    );
    return mapRow(result.rows[0]);
  }

  async getPublished() {
    try {
      const result = await this.pool.query<CorporateContentRow>(`
        select version, document, created_at, published_by_user_id, restored_from_version
        from corporate_content_revision
        order by version desc
        limit 1
      `);
      return result.rows[0] ? mapRow(result.rows[0]) : defaultRecord();
    } catch (error) {
      if (isMissingRelationError(error)) return defaultRecord();
      throw error;
    }
  }

  async listRevisions(limit = 10) {
    try {
      const result = await this.pool.query<CorporateContentSummaryRow>(
        `
          select version, created_at, published_by_user_id, restored_from_version
          from corporate_content_revision
          order by version desc
          limit $1
        `,
        [limit],
      );
      return result.rows.map(mapSummaryRow);
    } catch (error) {
      if (isMissingRelationError(error)) return [];
      throw error;
    }
  }

  async publish(input: PublishCorporateContentInput) {
    const document = parseStoredCorporateContentDocument(input.document);
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(
        "select pg_advisory_xact_lock(hashtext('corporate_content_revision'))",
      );
      const current = await client.query<{ version: number | string }>(`
        select version
        from corporate_content_revision
        order by version desc
        limit 1
        for update
      `);
      const currentVersion = Number(current.rows[0]?.version ?? 0);
      if (input.expectedVersion !== currentVersion) {
        throw new Error("corporate_content_version_conflict");
      }
      const created = await this.insertRevision(client, { ...input, document });
      await client.query("commit");
      return created;
    } catch (error) {
      await client.query("rollback");
      if (isMissingRelationError(error)) {
        throw new Error("corporate_content_store_not_ready");
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async restore(version: number, actorId: string | null, expectedVersion: number) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(
        "select pg_advisory_xact_lock(hashtext('corporate_content_revision'))",
      );
      const current = await client.query<{ version: number | string }>(`
        select version
        from corporate_content_revision
        order by version desc
        limit 1
        for update
      `);
      if (expectedVersion !== Number(current.rows[0]?.version ?? 0)) {
        throw new Error("corporate_content_version_conflict");
      }
      const source = await client.query<{ document: CorporateContentDocument }>(
        "select document from corporate_content_revision where version = $1",
        [version],
      );
      if (!source.rows[0]) throw new Error("corporate_content_revision_not_found");
      const created = await this.insertRevision(client, {
        document: parseStoredCorporateContentDocument(source.rows[0].document),
        expectedVersion,
        actorId,
        restoredFromVersion: version,
      });
      await client.query("commit");
      return created;
    } catch (error) {
      await client.query("rollback");
      if (isMissingRelationError(error)) {
        throw new Error("corporate_content_store_not_ready");
      }
      throw error;
    } finally {
      client.release();
    }
  }
}

const fallbackStore = new FallbackCorporateContentStore();

function activeStore(): CorporateContentStoreLike {
  return hasDatabaseUrl()
    ? new PostgresCorporateContentStore(getPool())
    : fallbackStore;
}

export const corporateContentStore: CorporateContentStoreLike = {
  getPublished: () => activeStore().getPublished(),
  listRevisions: (limit) => activeStore().listRevisions(limit),
  publish: (input) => activeStore().publish(input),
  restore: (version, actorId, expectedVersion) =>
    activeStore().restore(version, actorId, expectedVersion),
};

export function __resetCorporateContentStoreForTests() {
  MEMORY_REVISIONS.clear();
}
