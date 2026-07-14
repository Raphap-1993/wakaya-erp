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
    expect(extractManagedAssetId("https://cdn.example.com/hero.jpg")).toBeNull();
    expect(extractManagedAssetId("/media/assets/asset_123/nested/detail.webp")).toBeNull();
  });

  it("derives a safe filename fallback without query or fragment", () => {
    expect(fallbackMediaFilename("https://cdn.example.com/photos/selva.jpg?x=1#preview")).toBe(
      "selva.jpg",
    );
    expect(fallbackMediaFilename("/media/assets/asset_1/selva%20rio.webp")).toBe(
      "selva rio.webp",
    );
    expect(fallbackMediaFilename("https://cdn.example.com/")).toBe("imagen.webp");
    expect(() => fallbackMediaFilename("/photos/%E0%A4%A.jpg")).not.toThrow();
  });

  it("collects raw and managed asset IDs with stable deduplication", () => {
    expect(
      collectAdminMediaAssetIds([
        "asset_1",
        "/media/assets/asset_2/detail.webp",
        "asset_1",
        "https://cdn.example.com/external.jpg",
      ]),
    ).toEqual(["asset_1", "asset_2"]);
  });

  it("indexes metadata by asset ID", () => {
    expect(
      toAdminMediaMetadataMap([
        { assetId: "asset_2", originalFilename: "dos.png" },
        { assetId: "asset_1", originalFilename: "uno.jpg" },
      ]),
    ).toEqual({
      asset_2: { assetId: "asset_2", originalFilename: "dos.png" },
      asset_1: { assetId: "asset_1", originalFilename: "uno.jpg" },
    });
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
