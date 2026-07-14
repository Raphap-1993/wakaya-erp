import { describe, expect, it } from "vitest";

import {
  collectAdminMediaAssetIds,
  extractManagedAssetId,
  fallbackMediaFilename,
  resolveAdminMediaDescriptor,
  toAdminMediaMetadataMap,
} from "./admin-media-metadata";

describe("admin media metadata", () => {
  it("extracts asset IDs only from exact managed media paths", () => {
    expect(extractManagedAssetId("/media/assets/asset_123/heroDesktop.webp")).toBe(
      "asset_123",
    );
    expect(extractManagedAssetId("/media/assets/asset_123/master.webp")).toBe(
      "asset_123",
    );
    expect(
      extractManagedAssetId("/media/assets/asset_123/custom.variant-2.webp"),
    ).toBe("asset_123");
    expect(extractManagedAssetId("/media/assets/asset_123/_hero.webp")).toBe(
      "asset_123",
    );
    expect(extractManagedAssetId("/media/assets/asset_123/-hero.webp")).toBe(
      "asset_123",
    );
    expect(extractManagedAssetId("https://cdn.example.com/hero.jpg")).toBeNull();
    expect(extractManagedAssetId("/media/assets/asset_123/nested/detail.webp")).toBeNull();
    expect(extractManagedAssetId("/media/assets/asset_123/detail.jpg")).toBeNull();
    expect(extractManagedAssetId("/media/assets/asset_123/detail")).toBeNull();
    expect(
      extractManagedAssetId("https://wakaya.example/media/assets/asset_123/detail.webp"),
    ).toBeNull();
    expect(extractManagedAssetId("/media/assets/asset_123/detail.webp?size=2")).toBeNull();
    expect(extractManagedAssetId("/media/assets/asset_123/detail.webp#preview")).toBeNull();
    expect(extractManagedAssetId("/media/assets/asset_123/detail.WEBP")).toBeNull();
    expect(extractManagedAssetId("/media/assets/asset_123/.webp")).toBeNull();
  });

  it("derives a safe filename fallback without query or fragment", () => {
    expect(fallbackMediaFilename("https://cdn.example.com/photos/selva.jpg?x=1#preview")).toBe(
      "selva.jpg",
    );
    expect(fallbackMediaFilename("/media/assets/asset_1/selva%20rio.webp")).toBe(
      "selva rio.webp",
    );
    expect(fallbackMediaFilename("https://cdn.example.com/")).toBe("imagen.webp");
    expect(fallbackMediaFilename("/photos/%E0%A4%A.jpg")).toBe("%E0%A4%A.jpg");
  });

  it("sanitizes separators and controls reintroduced while decoding", () => {
    expect(
      fallbackMediaFilename(
        "/photos/folder%2Fprivate%5Cselva%00%E2%80%AE%20%20Cafe%CC%81.jpg",
      ),
    ).toBe("selva Café.jpg");
    expect(fallbackMediaFilename("/photos/%00%E2%80%AE%20")).toBe("imagen.webp");
  });

  it("collects trimmed raw and managed IDs with stable deduplication", () => {
    expect(
      collectAdminMediaAssetIds([
        " asset_1 ",
        "",
        "   ",
        "/media/assets/asset_2/detail.webp",
        "asset_1",
        "__proto__",
        "constructor",
        "__proto__",
        "https://cdn.example.com/external.jpg",
      ]),
    ).toEqual(["asset_1", "asset_2", "__proto__", "constructor"]);
  });

  it("indexes reserved property names without prototype contamination", () => {
    const metadata = toAdminMediaMetadataMap([
      { assetId: "__proto__", originalFilename: "primero.jpg" },
      { assetId: "constructor", originalFilename: "constructor.png" },
      { assetId: "__proto__", originalFilename: "ultimo.jpg" },
    ]);

    expect(Object.getPrototypeOf(metadata)).toBe(Object.prototype);
    expect(Object.hasOwn(metadata, "__proto__")).toBe(true);
    expect(Object.hasOwn(metadata, "constructor")).toBe(true);
    expect(metadata.__proto__).toEqual({
      assetId: "__proto__",
      originalFilename: "ultimo.jpg",
    });
    expect(metadata.constructor).toEqual({
      assetId: "constructor",
      originalFilename: "constructor.png",
    });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("resolves a managed descriptor with its original filename", () => {
    expect(
      resolveAdminMediaDescriptor("/media/assets/asset_2/detail.webp", {
        asset_2: { assetId: "asset_2", originalFilename: "Selva original.png" },
      }),
    ).toEqual({
      assetId: "asset_2",
      originalFilename: "Selva original.png",
      previewUrl: "/media/assets/asset_2/detail.webp",
    });
  });

  it("falls back to the managed URL basename for blank metadata", () => {
    expect(
      resolveAdminMediaDescriptor("/media/assets/asset_2/detail.webp", {
        asset_2: { assetId: "asset_2", originalFilename: "   " },
      }),
    ).toEqual({
      assetId: "asset_2",
      originalFilename: "detail.webp",
      previewUrl: "/media/assets/asset_2/detail.webp",
    });
  });

  it("returns a usable fallback descriptor for legacy external URLs", () => {
    expect(resolveAdminMediaDescriptor("https://cdn.example.com/selva.jpg?x=1", {})).toEqual({
      assetId: null,
      originalFilename: "selva.jpg",
      previewUrl: "https://cdn.example.com/selva.jpg?x=1",
    });
  });
});
