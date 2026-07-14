import { createHash, randomUUID } from "node:crypto";

import type { Pool, PoolClient } from "pg";

import { logger, type SafeLogger } from "@/lib/logger";
import { getPool } from "@/lib/reservations/postgres";

import type { AdminMediaMetadata } from "./admin-media-metadata";
import { createFilesystemMediaStorage } from "./filesystem-media-storage";
import {
  optimizeContentImage,
  readStoredPublicMedia,
  type MediaCropSpec,
  type MediaVariantKey,
} from "./image-optimizer";
import { normalizeOriginalFilename } from "./media-filename";
import type { MediaStorage } from "./media-storage";

export type ContentMediaSlot = "hero" | "detail" | "card" | "gallery";

type MediaFailureLogger = Pick<SafeLogger, "error">;
type SecondaryFailureOperation = "remove" | "rollback" | "release";
type SecondaryFailurePhase = "after_commit" | "compensation" | "transaction_failed";

type PersistedVariant = {
  storageKey: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  quality: number;
};

export type ContentMediaAsset = {
  id: string;
  originalFilename: string;
  status: "ready";
  master: {
    url: string;
    width: number;
    height: number;
    format: "webp";
    quality: 95;
    nearLossless: true;
  };
  variants: Partial<Record<MediaVariantKey, PersistedVariant>>;
};

type PersistedAssetRow = {
  id: string;
  storage_key: string;
  checksum_sha256: string;
  mime_type: string;
  original_filename: string;
  format: "webp";
  width: number;
  height: number;
  byte_size: number;
  status: "processing" | "ready" | "failed";
  created_by: string | null;
};

type PersistedVariantRow = {
  id: string;
  asset_id: string;
  slot: MediaVariantKey;
  storage_key: string;
  format: "webp";
  width: number;
  height: number;
  quality: number;
  crop_spec: MediaCropSpec | null;
  byte_size: number;
};

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function resolveSlotVariants(slot: ContentMediaSlot): MediaVariantKey[] {
  switch (slot) {
    case "hero":
      return ["heroDesktop", "heroMobile"];
    case "detail":
      return ["detail", "thumb"];
    case "card":
      return ["card", "thumb"];
    case "gallery":
      return ["detail", "thumb"];
  }
}

function defaultCrop(): MediaCropSpec {
  return {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    rotation: 0,
  };
}

function buildFallbackCrops(slot: ContentMediaSlot): Partial<Record<MediaVariantKey, MediaCropSpec>> {
  if (slot === "hero") {
    return {
      heroDesktop: defaultCrop(),
      heroMobile: defaultCrop(),
    };
  }

  if (slot === "card") {
    return {
      card: defaultCrop(),
      thumb: defaultCrop(),
    };
  }

  return {
    detail: defaultCrop(),
    thumb: defaultCrop(),
  };
}

function buildStorageKey(assetId: string, fileName: string) {
  return ["assets", assetId, fileName];
}

function toUrl(storageKey: string) {
  return `/media/${storageKey}`;
}

async function writeVariant(
  storage: MediaStorage,
  assetId: string,
  fileName: string,
  buffer: Buffer,
  quality: number,
  dimensions: { width: number; height: number },
  writtenStoragePaths: string[][],
): Promise<PersistedVariant> {
  const pathSegments = buildStorageKey(assetId, fileName);
  writtenStoragePaths.push(pathSegments);
  const stored = await storage.write(pathSegments, buffer);
  return {
    storageKey: stored.storageKey,
    url: toUrl(stored.storageKey),
    width: dimensions.width,
    height: dimensions.height,
    bytes: buffer.byteLength,
    quality,
  };
}

function logSecondaryFailure(
  failureLogger: MediaFailureLogger,
  input: {
    operation: SecondaryFailureOperation;
    phase: SecondaryFailurePhase;
    assetId: string;
    storageKey?: string;
    error: unknown;
  },
) {
  try {
    const rawErrorCode =
      input.error && typeof input.error === "object" && "code" in input.error
        ? (input.error as { code?: unknown }).code
        : undefined;
    const errorCode =
      typeof rawErrorCode === "string" && /^[a-z0-9_.:-]{1,64}$/i.test(rawErrorCode)
        ? rawErrorCode
        : undefined;
    const errorClass =
      input.error instanceof Error ? input.error.constructor.name : typeof input.error;

    failureLogger.error("media_secondary_failure", {
      operation: input.operation,
      phase: input.phase,
      assetId: input.assetId,
      ...(input.storageKey ? { storageKey: input.storageKey } : {}),
      errorClass,
      ...(errorCode ? { errorCode } : {}),
    });
  } catch {
    // Observability must never replace the primary processing or persistence error.
  }
}

async function cleanupWrittenMedia(
  storage: MediaStorage,
  writtenStoragePaths: string[][],
  failureLogger: MediaFailureLogger,
  assetId: string,
) {
  for (const pathSegments of [...writtenStoragePaths].reverse()) {
    try {
      await storage.remove(pathSegments);
    } catch (error) {
      logSecondaryFailure(failureLogger, {
        operation: "remove",
        phase: "compensation",
        assetId,
        storageKey: pathSegments.join("/"),
        error,
      });
    }
  }
}

function toMediaPersistenceError(error: unknown) {
  const persistenceError = new Error("media_persistence_failed", { cause: error });
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return Object.assign(persistenceError, {
      code: (error as { code: string }).code,
    });
  }
  return persistenceError;
}

async function persistAsset(
  pool: Pool,
  rows: {
    asset: PersistedAssetRow;
    variants: PersistedVariantRow[];
  },
  failureLogger: MediaFailureLogger,
) {
  let client: PoolClient;
  try {
    client = await pool.connect();
  } catch (error) {
    throw toMediaPersistenceError(error);
  }
  let failed = false;
  let persistenceError: unknown;
  try {
    await client.query("begin");
    await insertAsset(client, rows.asset);
    for (const variant of rows.variants) {
      await insertVariant(client, variant);
    }
    await client.query("commit");
  } catch (error) {
    failed = true;
    persistenceError = error;
    try {
      await client.query("rollback");
    } catch (rollbackError) {
      logSecondaryFailure(failureLogger, {
        operation: "rollback",
        phase: "transaction_failed",
        assetId: rows.asset.id,
        error: rollbackError,
      });
    }
  }

  if (failed) {
    try {
      client.release();
    } catch (releaseError) {
      logSecondaryFailure(failureLogger, {
        operation: "release",
        phase: "transaction_failed",
        assetId: rows.asset.id,
        error: releaseError,
      });
    }
    throw toMediaPersistenceError(persistenceError);
  }

  try {
    client.release();
  } catch (releaseError) {
    logSecondaryFailure(failureLogger, {
      operation: "release",
      phase: "after_commit",
      assetId: rows.asset.id,
      error: releaseError,
    });
  }
}

async function insertAsset(client: Pick<PoolClient, "query">, row: PersistedAssetRow) {
  await client.query(
    `
      insert into media_asset (
        id, storage_key, checksum_sha256, mime_type, original_filename, format, width, height, byte_size, status, created_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (id) do update
      set storage_key = excluded.storage_key,
          checksum_sha256 = excluded.checksum_sha256,
          mime_type = excluded.mime_type,
          original_filename = excluded.original_filename,
          format = excluded.format,
          width = excluded.width,
          height = excluded.height,
          byte_size = excluded.byte_size,
          status = excluded.status,
          created_by = excluded.created_by,
          updated_at = now()
    `,
    [
      row.id,
      row.storage_key,
      row.checksum_sha256,
      row.mime_type,
      row.original_filename,
      row.format,
      row.width,
      row.height,
      row.byte_size,
      row.status,
      row.created_by,
    ],
  );
}

async function insertVariant(client: Pick<PoolClient, "query">, row: PersistedVariantRow) {
  await client.query(
    `
      insert into media_variant (
        id, asset_id, slot, storage_key, format, width, height, quality, crop_spec, byte_size
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
      on conflict (id) do update
      set asset_id = excluded.asset_id,
          slot = excluded.slot,
          storage_key = excluded.storage_key,
          format = excluded.format,
          width = excluded.width,
          height = excluded.height,
          quality = excluded.quality,
          crop_spec = excluded.crop_spec,
          byte_size = excluded.byte_size,
          updated_at = now()
    `,
    [
      row.id,
      row.asset_id,
      row.slot,
      row.storage_key,
      row.format,
      row.width,
      row.height,
      row.quality,
      row.crop_spec ? JSON.stringify(row.crop_spec) : null,
      row.byte_size,
    ],
  );
}

function normalizeCompatibilityMedia(
  asset: ContentMediaAsset,
  preferredVariant: MediaVariantKey,
) {
  const variant = asset.variants[preferredVariant];
  if (!variant) {
    throw new Error("media_processing_failed");
  }

  return {
    url: variant.url,
    width: variant.width,
    height: variant.height,
    bytes: variant.bytes,
    format: "webp" as const,
    assetId: asset.id,
  };
}

export class ContentMediaService {
  constructor(
    private readonly storage: MediaStorage = createFilesystemMediaStorage(),
    private readonly pool: Pool | null = hasDatabaseUrl() ? getPool() : null,
    private readonly failureLogger: MediaFailureLogger = logger,
  ) {}

  async listAssetMetadata(assetIds: string[]): Promise<AdminMediaMetadata[]> {
    const ids = [...new Set(assetIds)].sort();
    if (!this.pool || ids.length === 0) {
      return [];
    }

    const result = await this.pool.query<{
      id: string;
      original_filename: string | null;
    }>(
      "select id, original_filename from media_asset where id = any($1::text[]) order by id asc",
      [ids],
    );

    return result.rows.map((row) => ({
      assetId: row.id,
      originalFilename: row.original_filename ?? "",
    }));
  }

  async createAsset(input: {
    file: File;
    slot: ContentMediaSlot;
    crops?: Partial<Record<MediaVariantKey, MediaCropSpec>>;
    actorId?: string | null;
  }): Promise<{ asset: ContentMediaAsset }> {
    const assetId = `asset_${randomUUID().replace(/-/g, "")}`;
    const originalFilename = normalizeOriginalFilename(input.file.name, input.file.type);
    const checksumSource = Buffer.from(await input.file.arrayBuffer());
    const optimized = await optimizeContentImage(input.file, {
      requiredVariants: resolveSlotVariants(input.slot),
      crops: input.crops ?? buildFallbackCrops(input.slot),
    });
    const writtenStoragePaths: string[][] = [];

    try {
      const masterStored = await writeVariant(
        this.storage,
        assetId,
        "master.webp",
        optimized.master.buffer,
        optimized.master.quality,
        optimized.master,
        writtenStoragePaths,
      );

      const variants: Partial<Record<MediaVariantKey, PersistedVariant>> = {};
      for (const [variantKey, artifact] of Object.entries(optimized.variants) as Array<
        [MediaVariantKey, (typeof optimized.variants)[MediaVariantKey]]
      >) {
        if (!artifact) {
          continue;
        }
        variants[variantKey] = await writeVariant(
          this.storage,
          assetId,
          `${variantKey}.webp`,
          artifact.buffer,
          artifact.quality,
          artifact,
          writtenStoragePaths,
        );
      }

      if (this.pool) {
        await persistAsset(
          this.pool,
          {
            asset: {
              id: assetId,
              storage_key: masterStored.storageKey,
              checksum_sha256: createHash("sha256").update(checksumSource).digest("hex"),
              mime_type: input.file.type,
              original_filename: originalFilename,
              format: "webp",
              width: optimized.master.width,
              height: optimized.master.height,
              byte_size: optimized.master.bytes,
              status: "ready",
              created_by: input.actorId ?? null,
            },
            variants: Object.entries(variants).map(([variantKey, variant]) => ({
              id: `${assetId}_${variantKey}`,
              asset_id: assetId,
              slot: variantKey as MediaVariantKey,
              storage_key: variant.storageKey,
              format: "webp",
              width: variant.width,
              height: variant.height,
              quality: variant.quality,
              crop_spec:
                (input.crops ?? buildFallbackCrops(input.slot))[
                  variantKey as MediaVariantKey
                ] ?? null,
              byte_size: variant.bytes,
            })),
          },
          this.failureLogger,
        );
      }

      return {
        asset: {
          id: assetId,
          originalFilename,
          status: "ready",
          master: {
            url: masterStored.url,
            width: optimized.master.width,
            height: optimized.master.height,
            format: "webp",
            quality: 95,
            nearLossless: true,
          },
          variants,
        },
      };
    } catch (error) {
      await cleanupWrittenMedia(this.storage, writtenStoragePaths, this.failureLogger, assetId);
      throw error;
    }
  }

  async createCompatibilityHomeMedia(input: {
    file: File;
    slot: string;
    actorId?: string | null;
  }) {
    const slot = input.slot.includes("hero") || input.slot.includes("slide") ? "hero" : "detail";
    const result = await this.createAsset({
      file: input.file,
      slot,
      actorId: input.actorId ?? null,
    });

    return {
      media: normalizeCompatibilityMedia(result.asset, slot === "hero" ? "heroDesktop" : "detail"),
      asset: result.asset,
    };
  }

  async createCompatibilityBungalowMedia(input: {
    file: File;
    kind: "hero" | "gallery";
    actorId?: string | null;
  }) {
    const result = await this.createAsset({
      file: input.file,
      slot: input.kind === "hero" ? "hero" : "gallery",
      actorId: input.actorId ?? null,
    });

    return {
      media: normalizeCompatibilityMedia(result.asset, input.kind === "hero" ? "heroDesktop" : "detail"),
      asset: result.asset,
    };
  }

  async readPublicMedia(pathSegments: string[]) {
    return readStoredPublicMedia(pathSegments, this.storage);
  }
}

export const contentMediaService = new ContentMediaService();
