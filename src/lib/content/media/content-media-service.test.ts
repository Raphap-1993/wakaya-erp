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

function createStorage() {
  const write = vi.fn(async (pathSegments: string[]) => ({
    storageKey: pathSegments.join("/"),
    absolutePath: `/tmp/${pathSegments.join("/")}`,
  }));

  return {
    storage: {
      write,
      read: vi.fn(),
    } as unknown as MediaStorage,
    write,
  };
}

function createPool(query: PoolClient["query"]) {
  const client = {
    query,
    release: vi.fn(),
  } as unknown as PoolClient;

  return {
    pool: {
      connect: vi.fn(async () => client),
    } as unknown as Pool,
    client,
  };
}

describe("ContentMediaService", () => {
  it("returns and persists the normalized original filename", async () => {
    const { storage } = createStorage();
    const query = vi.fn(async () => ({ rows: [], rowCount: 0 })) as unknown as PoolClient["query"];
    const { pool } = createPool(query);
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

    const [sql, values] = assetInsert!;
    expect(String(sql)).toMatch(/original_filename/i);
    expect(String(sql)).toMatch(/original_filename\s*=\s*excluded\.original_filename/i);
    expect(values).toContain("Selva Wakaya.PNG");
  });

  it("keeps filesystem-only uploads working when no pool is configured", async () => {
    const { storage, write } = createStorage();
    const service = new ContentMediaService(storage, null);
    const file = await createPngFile("selva.png");

    const result = await service.createAsset({ file, slot: "detail" });

    expect(result.asset.originalFilename).toBe("selva.png");
    expect(result.asset.variants.detail?.url).toMatch(
      /^\/media\/assets\/asset_[a-f0-9]+\/detail\.webp$/,
    );
    expect(write).toHaveBeenCalledTimes(3);
  });

  it("does not hide a missing media_asset migration when a pool is configured", async () => {
    const { storage } = createStorage();
    const missingRelation = Object.assign(new Error("relation media_asset does not exist"), {
      code: "42P01",
    });
    const query = vi.fn(async (sql: unknown) => {
      if (String(sql).includes("insert into media_asset")) {
        throw missingRelation;
      }
      return { rows: [], rowCount: 0 };
    }) as unknown as PoolClient["query"];
    const { pool } = createPool(query);
    const service = new ContentMediaService(storage, pool);
    const file = await createPngFile("selva.png");

    await expect(service.createAsset({ file, slot: "detail" })).rejects.toBe(
      missingRelation,
    );
  });
});
