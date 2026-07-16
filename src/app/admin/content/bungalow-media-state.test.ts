import { describe, expect, it } from "vitest";

import {
  removeBungalowHero,
  reorderBungalowGallery,
  replaceBungalowHero,
} from "./bungalow-media-state";

describe("bungalow media state", () => {
  it("reorders gallery assets without touching the hero", () => {
    const current = {
      heroAssetId: "asset_hero",
      galleryAssetIds: ["asset_a", "asset_b", "asset_c"],
    };

    expect(reorderBungalowGallery(current, 1, 0)).toEqual({
      heroAssetId: "asset_hero",
      galleryAssetIds: ["asset_b", "asset_a", "asset_c"],
    });
  });

  it("replaces and removes only the hero reference", () => {
    const current = {
      heroAssetId: "asset_old",
      galleryAssetIds: ["asset_a"],
    };

    expect(replaceBungalowHero(current, "asset_new")).toEqual({
      heroAssetId: "asset_new",
      galleryAssetIds: ["asset_a"],
    });
    expect(removeBungalowHero(current)).toEqual({
      heroAssetId: null,
      galleryAssetIds: ["asset_a"],
    });
  });
});
