import { describe, expect, it } from "vitest";

import type { ContentMediaAsset } from "@/lib/content/media/content-media-service";
import type { MediaCropSpec } from "@/lib/content/media/image-optimizer";
import {
  buildHomeMediaUploadFormData,
  resolveHomeMediaUrl,
} from "./home-media-upload";

const standardCrop: MediaCropSpec = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  rotation: 0,
};

const asset: ContentMediaAsset = {
  id: "asset_home_01",
  originalFilename: "gallery01.jpg",
  status: "ready",
  master: {
    url: "/media/assets/asset_home_01/master.webp",
    width: 2400,
    height: 1600,
    format: "webp",
    quality: 95,
    nearLossless: true,
  },
  variants: {
    heroDesktop: {
      storageKey: "assets/asset_home_01/heroDesktop.webp",
      url: "/media/assets/asset_home_01/heroDesktop.webp",
      width: 1920,
      height: 1080,
      bytes: 180000,
      quality: 88,
    },
    detail: {
      storageKey: "assets/asset_home_01/detail.webp",
      url: "/media/assets/asset_home_01/detail.webp",
      width: 1600,
      height: 1200,
      bytes: 150000,
      quality: 86,
    },
  },
};

describe("Home managed media upload", () => {
  it("builds the canonical multipart payload with explicit crops", () => {
    const file = new File(["image"], "wakaya.jpg", { type: "image/jpeg" });
    const crops = {
      desktop: standardCrop,
      mobile: { ...standardCrop, width: 0.6 },
    };

    const formData = buildHomeMediaUploadFormData(file, "hero", crops);

    expect(formData.get("file")).toBe(file);
    expect(formData.get("slot")).toBe("hero");
    expect(formData.get("crops")).toBe(JSON.stringify(crops));
  });

  it("selects the public variant required by each Home slot", () => {
    expect(resolveHomeMediaUrl(asset, "hero")).toBe(
      "/media/assets/asset_home_01/heroDesktop.webp",
    );
    expect(resolveHomeMediaUrl(asset, "detail")).toBe(
      "/media/assets/asset_home_01/detail.webp",
    );
  });

  it("rejects an asset that is missing its required public variant", () => {
    expect(() => resolveHomeMediaUrl({ ...asset, variants: {} }, "hero")).toThrow(
      "media_processing_failed",
    );
  });
});
