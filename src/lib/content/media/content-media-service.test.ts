import type { Pool, PoolClient } from "pg";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

import { ContentMediaService } from "./content-media-service";
import type { MediaStorage } from "./media-storage";

async function createPngFile(name: string) {
  const buffer = await sharp({
    create: {
      width: 240,
      height: 240,
      channels: 4,
      background: { r: 25, g: 104, b: 79, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  return new File([buffer], name, { type: "image/png" });
}

function createStorage(
  events: string[] = [],
  options: { failRemoveFor?: string; failWriteFor?: string; removeFailure?: Error } = {},
) {
  const write = vi.fn(async (pathSegments: string[]) => {
    events.push(`write:${pathSegments.at(-1)}`);
    if (pathSegments.at(-1) === options.failWriteFor) {
      throw new Error("storage_write_failed");
    }
    return {
      storageKey: pathSegments.join("/"),
      absolutePath: `/tmp/${pathSegments.join("/")}`,
    };
  });
  const read = vi.fn(async (_pathSegments: string[]) => Buffer.alloc(0));
  const remove = vi.fn(async (pathSegments: string[]) => {
    events.push(`remove:${pathSegments.at(-1)}`);
    if (pathSegments.at(-1) === options.failRemoveFor) {
      throw options.removeFailure ?? new Error("storage_remove_failed");
    }
  });
  const storage = { write, read, remove } satisfies MediaStorage;

  return {
    storage,
    write,
    remove,
  };
}

function classifyQuery(sql: unknown) {
  const normalized = String(sql).replace(/\s+/g, " ").trim().toLowerCase();
  if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
    return normalized;
  }
  if (normalized.startsWith("insert into media_asset")) {
    return "asset";
  }
  if (normalized.startsWith("insert into media_variant")) {
    return "variant";
  }
  return `query:${normalized}`;
}

function createPool(options: {
  events?: string[];
  failOn?: "begin" | "asset" | "variant" | "commit";
  failure?: Error;
  connectFailure?: Error;
  rollbackFailure?: Error;
  releaseFailure?: Error;
} = {}) {
  const events = options.events ?? [];
  const query = vi.fn(async (sql: unknown) => {
    const operation = classifyQuery(sql);
    events.push(operation);
    if (operation === "rollback" && options.rollbackFailure) {
      throw options.rollbackFailure;
    }
    if (operation === options.failOn) {
      throw options.failure ?? new Error("database_failure");
    }
    return { rows: [], rowCount: 0 };
  }) as unknown as PoolClient["query"];
  const release = vi.fn(() => {
    events.push("release");
    if (options.releaseFailure) {
      throw options.releaseFailure;
    }
  });
  const client = {
    query,
    release,
  } as unknown as PoolClient;
  const connect = vi.fn(async () => {
    if (options.connectFailure) {
      throw options.connectFailure;
    }
    return client;
  });

  return {
    pool: {
      connect,
    } as unknown as Pool,
    connect,
    query,
    release,
    events,
  };
}

function createFailureLogger() {
  const error = vi.fn();
  return {
    logger: { error },
    error,
  };
}

describe("ContentMediaService", () => {
  it("loads sorted metadata with one exact batch query", async () => {
    const { storage } = createStorage();
    const query = vi.fn().mockResolvedValue({
      rows: [
        { id: "asset_1", original_filename: "uno.jpg" },
        { id: "asset_2", original_filename: "dos.png" },
      ],
      rowCount: 2,
    });
    const service = new ContentMediaService(storage, { query } as unknown as Pool);

    const result = await service.listAssetMetadata(["asset_2", "asset_1", "asset_2"]);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      "select id, original_filename from media_asset where id = any($1::text[]) order by id asc",
      [["asset_1", "asset_2"]],
    );
    expect(result).toEqual([
      { assetId: "asset_1", originalFilename: "uno.jpg" },
      { assetId: "asset_2", originalFilename: "dos.png" },
    ]);
  });

  it("returns no metadata when no pool is configured", async () => {
    const { storage } = createStorage();

    await expect(new ContentMediaService(storage, null).listAssetMetadata(["asset_1"]))
      .resolves.toEqual([]);
  });

  it("skips the metadata query when no asset IDs are provided", async () => {
    const { storage } = createStorage();
    const query = vi.fn();

    await expect(
      new ContentMediaService(storage, { query } as unknown as Pool).listAssetMetadata([]),
    ).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });

  it("maps historical null filenames to an empty string", async () => {
    const { storage } = createStorage();
    const query = vi.fn().mockResolvedValue({
      rows: [{ id: "asset_legacy", original_filename: null }],
      rowCount: 1,
    });
    const service = new ContentMediaService(storage, { query } as unknown as Pool);

    await expect(service.listAssetMetadata(["asset_legacy"])).resolves.toEqual([
      { assetId: "asset_legacy", originalFilename: "" },
    ]);
  });

  it("does not silence metadata query errors when a pool is configured", async () => {
    const { storage } = createStorage();
    const missingRelation = Object.assign(new Error("relation media_asset does not exist"), {
      code: "42P01",
    });
    const query = vi.fn().mockRejectedValue(missingRelation);
    const service = new ContentMediaService(storage, { query } as unknown as Pool);

    await expect(service.listAssetMetadata(["asset_1"])).rejects.toBe(missingRelation);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("returns and persists the normalized original filename", async () => {
    const events: string[] = [];
    const { storage } = createStorage(events);
    const { pool, query, release } = createPool({ events });
    const { logger, error: logError } = createFailureLogger();
    const service = new ContentMediaService(storage, pool, logger);
    const file = await createPngFile("C:\\fakepath\\Selva   Wakaya.PNG");

    const result = await service.createAsset({
      file,
      slot: "detail",
      actorId: "admin-user-1",
    });

    expect(result.asset.originalFilename).toBe("Selva Wakaya.PNG");

    const assetInsert = vi.mocked(query).mock.calls.find(([sql]) =>
      String(sql).includes("insert into media_asset"),
    );
    expect(assetInsert).toBeDefined();

    const [sql, rawValues] = assetInsert!;
    const normalizedSql = String(sql).replace(/\s+/g, " ").trim();
    const insertShape = normalizedSql.match(
      /insert into media_asset \(([^)]+)\) values \(([^)]+)\)/i,
    );
    expect(insertShape).toBeDefined();

    const columns = insertShape![1].split(",").map((column) => column.trim());
    const placeholders = insertShape![2].split(",").map((placeholder) => placeholder.trim());
    expect(columns).toHaveLength(11);
    expect(columns[4]).toBe("original_filename");
    expect(placeholders).toEqual(Array.from({ length: 11 }, (_, index) => `$${index + 1}`));
    expect(placeholders[4]).toBe("$5");
    expect(Array.isArray(rawValues)).toBe(true);
    const values = rawValues as unknown[];
    expect(values).toHaveLength(11);
    expect(values[4]).toBe("Selva Wakaya.PNG");
    expect(String(sql)).toMatch(/original_filename\s*=\s*excluded\.original_filename/i);
    expect(events).toEqual([
      "write:master.webp",
      "write:detail.webp",
      "write:thumb.webp",
      "begin",
      "asset",
      "variant",
      "variant",
      "commit",
      "release",
    ]);
    expect(release).toHaveBeenCalledOnce();
    expect(logError).not.toHaveBeenCalled();
  });

  it("cleans the attempted key and previous writes when storage fails mid-pipeline", async () => {
    const events: string[] = [];
    const { storage, remove } = createStorage(events, { failWriteFor: "detail.webp" });
    const service = new ContentMediaService(storage, null);
    const file = await createPngFile("selva.png");

    await expect(service.createAsset({ file, slot: "detail" })).rejects.toThrow(
      "storage_write_failed",
    );

    expect(remove.mock.calls.map(([pathSegments]) => pathSegments.at(-1))).toEqual([
      "detail.webp",
      "master.webp",
    ]);
  });

  it("does not canonicalize Sharp processing failures as database failures", async () => {
    const { storage, write, remove } = createStorage();
    const { pool, connect } = createPool();
    const service = new ContentMediaService(storage, pool);
    const invalidImage = new File([Buffer.from("not-an-image")], "invalid.png", {
      type: "image/png",
    });

    let thrown: unknown;
    try {
      await service.createAsset({ file: invalidImage, slot: "detail" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).not.toBe("media_persistence_failed");
    expect(connect).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("does not remove committed media if releasing the client fails after commit", async () => {
    const events: string[] = [];
    const { storage, remove } = createStorage(events);
    const releaseFailure = Object.assign(
      new Error("release failed at /var/lib/postgresql after SELECT secret"),
      { code: "RELEASE_FAILED" },
    );
    const { pool } = createPool({
      events,
      releaseFailure,
    });
    const { logger, error: logError } = createFailureLogger();
    const service = new ContentMediaService(storage, pool, logger);
    const file = await createPngFile("selva.png");

    const result = await service.createAsset({ file, slot: "detail" });

    expect(result.asset.status).toBe("ready");
    expect(events.slice(-2)).toEqual(["commit", "release"]);
    expect(remove).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledOnce();
    expect(logError).toHaveBeenCalledWith("media_secondary_failure", {
      operation: "release",
      phase: "after_commit",
      assetId: result.asset.id,
      errorClass: "Error",
      errorCode: "RELEASE_FAILED",
    });
    expect(JSON.stringify(logError.mock.calls)).not.toContain("/var/lib/postgresql");
    expect(JSON.stringify(logError.mock.calls)).not.toContain("SELECT secret");
  });

  it("keeps filesystem-only uploads working when no pool is configured", async () => {
    const { storage, write, remove } = createStorage();
    const service = new ContentMediaService(storage, null);
    const file = await createPngFile("selva.png");

    const result = await service.createAsset({ file, slot: "detail" });

    expect(result.asset.originalFilename).toBe("selva.png");
    expect(result.asset.variants.detail?.url).toMatch(
      /^\/media\/assets\/asset_[a-f0-9]+\/detail\.webp$/,
    );
    expect(write).toHaveBeenCalledTimes(3);
    expect(remove).not.toHaveBeenCalled();
  });

  it("rolls back and removes every written object before rethrowing a persistence error", async () => {
    const events: string[] = [];
    const { storage, write, remove } = createStorage(events);
    const missingRelation = Object.assign(new Error("relation media_asset does not exist"), {
      code: "42P01",
    });
    const { pool, release } = createPool({
      events,
      failOn: "asset",
      failure: missingRelation,
    });
    const service = new ContentMediaService(storage, pool);
    const file = await createPngFile("selva.png");

    let thrown: unknown;
    try {
      await service.createAsset({ file, slot: "detail" });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({
      message: "media_persistence_failed",
      code: "42P01",
    });
    expect((thrown as Error).cause).toBe(missingRelation);

    const writtenPaths = write.mock.calls.map(([pathSegments]) => pathSegments);
    const removedPaths = remove.mock.calls.map(([pathSegments]) => pathSegments);
    expect(removedPaths).toEqual([...writtenPaths].reverse());
    expect(events).toEqual([
      "write:master.webp",
      "write:detail.webp",
      "write:thumb.webp",
      "begin",
      "asset",
      "rollback",
      "release",
      "remove:thumb.webp",
      "remove:detail.webp",
      "remove:master.webp",
    ]);
    expect(release).toHaveBeenCalledOnce();
  });

  it("keeps cleanup best-effort and preserves the persistence cause if one removal fails", async () => {
    const events: string[] = [];
    const removeFailure = Object.assign(
      new Error("remove failed at /tmp/private/assets/secret/thumb.webp"),
      { code: "REMOVE_FAILED" },
    );
    const { storage, write, remove } = createStorage(events, {
      failRemoveFor: "thumb.webp",
      removeFailure,
    });
    const persistenceError = Object.assign(new Error("duplicate key violates constraint"), {
      code: "23505",
    });
    const rollbackFailure = Object.assign(
      new Error("rollback failed: SELECT * FROM media_asset"),
      { code: "ROLLBACK_FAILED" },
    );
    const releaseFailure = Object.assign(new Error("release failed at /var/lib/postgresql"), {
      code: "RELEASE_FAILED",
    });
    const { pool } = createPool({
      events,
      failOn: "variant",
      failure: persistenceError,
      rollbackFailure,
      releaseFailure,
    });
    const { logger, error: logError } = createFailureLogger();
    const service = new ContentMediaService(storage, pool, logger);
    const file = await createPngFile("selva.png");

    let thrown: unknown;
    try {
      await service.createAsset({ file, slot: "detail" });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({
      message: "media_persistence_failed",
      code: "23505",
    });
    expect((thrown as Error).cause).toBe(persistenceError);

    const assetId = write.mock.calls[0][0][1];
    expect(remove).toHaveBeenCalledTimes(3);
    expect(events.slice(-6)).toEqual([
      "variant",
      "rollback",
      "release",
      "remove:thumb.webp",
      "remove:detail.webp",
      "remove:master.webp",
    ]);
    expect(logError.mock.calls).toEqual([
      [
        "media_secondary_failure",
        {
          operation: "rollback",
          phase: "transaction_failed",
          assetId,
          errorClass: "Error",
          errorCode: "ROLLBACK_FAILED",
        },
      ],
      [
        "media_secondary_failure",
        {
          operation: "release",
          phase: "transaction_failed",
          assetId,
          errorClass: "Error",
          errorCode: "RELEASE_FAILED",
        },
      ],
      [
        "media_secondary_failure",
        {
          operation: "remove",
          phase: "compensation",
          assetId,
          storageKey: `assets/${assetId}/thumb.webp`,
          errorClass: "Error",
          errorCode: "REMOVE_FAILED",
        },
      ],
    ]);
    const serializedLogs = JSON.stringify(logError.mock.calls);
    expect(serializedLogs).not.toContain("duplicate key");
    expect(serializedLogs).not.toContain("SELECT * FROM media_asset");
    expect(serializedLogs).not.toContain("/var/lib/postgresql");
    expect(serializedLogs).not.toContain("/tmp/private");
  });

  it.each([
    {
      label: "connecting to the pool",
      poolOptions: {
        connectFailure: Object.assign(new Error("remaining connection slots are reserved"), {
          code: "53300",
        }),
      },
      expectedEvents: [
        "write:master.webp",
        "write:detail.webp",
        "write:thumb.webp",
        "remove:thumb.webp",
        "remove:detail.webp",
        "remove:master.webp",
      ],
    },
    {
      label: "starting the transaction",
      poolOptions: {
        failOn: "begin" as const,
        failure: Object.assign(new Error("database is starting up"), { code: "57P03" }),
      },
      expectedEvents: [
        "write:master.webp",
        "write:detail.webp",
        "write:thumb.webp",
        "begin",
        "rollback",
        "release",
        "remove:thumb.webp",
        "remove:detail.webp",
        "remove:master.webp",
      ],
    },
    {
      label: "committing the transaction",
      poolOptions: {
        failOn: "commit" as const,
        failure: Object.assign(new Error("serialization failure"), { code: "40001" }),
      },
      expectedEvents: [
        "write:master.webp",
        "write:detail.webp",
        "write:thumb.webp",
        "begin",
        "asset",
        "variant",
        "variant",
        "commit",
        "rollback",
        "release",
        "remove:thumb.webp",
        "remove:detail.webp",
        "remove:master.webp",
      ],
    },
  ])("canonicalizes a database failure while $label", async ({ poolOptions, expectedEvents }) => {
    const events: string[] = [];
    const { storage, remove } = createStorage(events);
    const { pool } = createPool({ events, ...poolOptions });
    const service = new ContentMediaService(storage, pool);
    const file = await createPngFile("selva.png");

    let thrown: unknown;
    try {
      await service.createAsset({ file, slot: "detail" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({
      message: "media_persistence_failed",
      code: poolOptions.connectFailure?.code ?? poolOptions.failure?.code,
    });
    expect((thrown as Error).cause).toBe(
      poolOptions.connectFailure ?? poolOptions.failure,
    );
    expect(remove).toHaveBeenCalledTimes(3);
    expect(events).toEqual(expectedEvents);
  });
});
