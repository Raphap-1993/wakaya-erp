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
  options: { failRemoveFor?: string; failWriteFor?: string } = {},
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
      throw new Error("storage_remove_failed");
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
  failOn?: "asset" | "variant" | "commit";
  failure?: Error;
  releaseFailure?: Error;
} = {}) {
  const events = options.events ?? [];
  const query = vi.fn(async (sql: unknown) => {
    const operation = classifyQuery(sql);
    events.push(operation);
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

  return {
    pool: {
      connect: vi.fn(async () => client),
    } as unknown as Pool,
    query,
    release,
    events,
  };
}

describe("ContentMediaService", () => {
  it("returns and persists the normalized original filename", async () => {
    const events: string[] = [];
    const { storage } = createStorage(events);
    const { pool, query, release } = createPool({ events });
    const service = new ContentMediaService(storage, pool);
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

  it("does not remove committed media if releasing the client fails after commit", async () => {
    const events: string[] = [];
    const { storage, remove } = createStorage(events);
    const { pool } = createPool({
      events,
      releaseFailure: new Error("release_failed"),
    });
    const service = new ContentMediaService(storage, pool);
    const file = await createPngFile("selva.png");

    const result = await service.createAsset({ file, slot: "detail" });

    expect(result.asset.status).toBe("ready");
    expect(events.slice(-2)).toEqual(["commit", "release"]);
    expect(remove).not.toHaveBeenCalled();
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

  it("keeps cleanup best-effort and preserves the persistence error if one removal fails", async () => {
    const events: string[] = [];
    const { storage, remove } = createStorage(events, { failRemoveFor: "thumb.webp" });
    const persistenceError = new Error("variant_insert_failed");
    const { pool } = createPool({
      events,
      failOn: "variant",
      failure: persistenceError,
    });
    const service = new ContentMediaService(storage, pool);
    const file = await createPngFile("selva.png");

    await expect(service.createAsset({ file, slot: "detail" })).rejects.toBe(
      persistenceError,
    );

    expect(remove).toHaveBeenCalledTimes(3);
    expect(events.slice(-6)).toEqual([
      "variant",
      "rollback",
      "release",
      "remove:thumb.webp",
      "remove:detail.webp",
      "remove:master.webp",
    ]);
  });
});
