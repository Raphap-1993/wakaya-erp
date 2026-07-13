import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createFilesystemMediaStorage } from "./filesystem-media-storage";
import {
  type MediaCropSpec,
  optimizeContentImage,
  uploadOptimizedPublicImage,
} from "./image-optimizer";

async function createLargeJpegFile(name = "hero.jpg") {
  const sharp = (await import("sharp")).default;
  const buffer = await sharp({
    create: {
      width: 2600,
      height: 2000,
      channels: 3,
      background: { r: 214, g: 226, b: 240 },
    },
  })
    .jpeg({ quality: 94 })
    .toBuffer();

  return new File([buffer], name, { type: "image/jpeg" });
}

async function createSizedJpegFile(width: number, height: number, name = "sized-image.jpg") {
  const sharp = (await import("sharp")).default;
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 214, g: 226, b: 240 },
    },
  })
    .jpeg({ quality: 94 })
    .toBuffer();

  return new File([buffer], name, { type: "image/jpeg" });
}

async function createLandscapeJpegFile(name = "landscape-hero.jpg") {
  const sharp = (await import("sharp")).default;
  const buffer = await sharp({
    create: {
      width: 2200,
      height: 1238,
      channels: 3,
      background: { r: 208, g: 220, b: 234 },
    },
  })
    .jpeg({ quality: 94 })
    .toBuffer();

  return new File([buffer], name, { type: "image/jpeg" });
}

const dualHeroCrops: Record<string, MediaCropSpec> = {
  heroDesktop: { x: 0.08, y: 0.08, width: 0.84, height: 0.72, rotation: 0 },
  heroMobile: { x: 0.2, y: 0.06, width: 0.52, height: 0.78, rotation: 0 },
};

describe("content image optimizer", () => {
  it("creates a near-lossless master and required hero variants", async () => {
    const source = await createLargeJpegFile();

    const result = await optimizeContentImage(source, {
      requiredVariants: ["heroDesktop", "heroMobile"],
      crops: dualHeroCrops,
    });

    expect(result.master).toMatchObject({ format: "webp", quality: 95, nearLossless: true });
    expect(result.master.width).toBeLessThanOrEqual(3200);
    expect(result.variants.heroDesktop).toMatchObject({ width: 1920, height: 1080, quality: 88 });
    expect(result.variants.heroMobile).toMatchObject({ width: 1080, height: 1350, quality: 88 });
  });

  it("accepts a landscape hero when the mobile crop needs a controlled upscale", async () => {
    const source = await createLandscapeJpegFile();

    const result = await optimizeContentImage(source, {
      requiredVariants: ["heroDesktop", "heroMobile"],
      crops: {
        heroDesktop: { x: 0, y: 0.015, width: 1, height: 0.97, rotation: 0 },
        heroMobile: { x: 0.275, y: 0, width: 0.45, height: 1, rotation: 0 },
      },
    });

    expect(result.variants.heroDesktop).toMatchObject({ width: 1920, height: 1080 });
    expect(result.variants.heroMobile).toMatchObject({ width: 1080, height: 1350 });
  });

  it("accepts legacy bungalow hero photos that are smaller than the publish variants", async () => {
    const source = await createSizedJpegFile(878, 798, "legacy-bungalow.jpg");

    const result = await optimizeContentImage(source, {
      requiredVariants: ["heroDesktop", "heroMobile"],
      crops: {
        heroDesktop: { x: 0, y: 0.22, width: 1, height: 0.56, rotation: 0 },
        heroMobile: { x: 0.12, y: 0.02, width: 0.76, height: 0.95, rotation: 0 },
      },
    });

    expect(result.variants.heroDesktop).toMatchObject({ width: 1920, height: 1080 });
    expect(result.variants.heroMobile).toMatchObject({ width: 1080, height: 1350 });
  });

  it("accepts square legacy bungalow heroes from the historic media set", async () => {
    const source = await createSizedJpegFile(475, 475, "legacy-square-bungalow.jpg");

    const result = await optimizeContentImage(source, {
      requiredVariants: ["heroDesktop", "heroMobile"],
      crops: {
        heroDesktop: { x: 0, y: 0.2, width: 1, height: 0.6, rotation: 0 },
        heroMobile: { x: 0.08, y: 0, width: 0.84, height: 1, rotation: 0 },
      },
    });

    expect(result.variants.heroDesktop).toMatchObject({ width: 1920, height: 1080 });
    expect(result.variants.heroMobile).toMatchObject({ width: 1080, height: 1350 });
  });

  it("accepts legacy square gallery images for the detail variant", async () => {
    const source = await createSizedJpegFile(475, 475, "legacy-gallery.jpg");

    const result = await optimizeContentImage(source, {
      requiredVariants: ["detail"],
      crops: {
        detail: { x: 0, y: 0, width: 1, height: 1, rotation: 0 },
      },
    });

    expect(result.variants.detail).toMatchObject({ width: 1600, height: 1200 });
  });

  it("accepts legacy thumbnail gallery images that still need recorte and upscale", async () => {
    const source = await createSizedJpegFile(200, 200, "legacy-thumb-gallery.jpg");

    const result = await optimizeContentImage(source, {
      requiredVariants: ["detail"],
      crops: {
        detail: { x: 0, y: 0, width: 1, height: 1, rotation: 0 },
      },
    });

    expect(result.variants.detail).toMatchObject({ width: 1600, height: 1200 });
  });

  it("rejects missing required crops", async () => {
    const source = await createLargeJpegFile();

    await expect(
      optimizeContentImage(source, {
        requiredVariants: ["heroDesktop", "heroMobile"],
        crops: { heroDesktop: dualHeroCrops.heroDesktop },
      }),
    ).rejects.toThrow("missing_required_crop");
  });

  it("rejects crops that are too small for the target variant", async () => {
    const source = await createLargeJpegFile();

    await expect(
      optimizeContentImage(source, {
        requiredVariants: ["heroDesktop"],
        crops: {
          heroDesktop: { x: 0.48, y: 0.48, width: 0.03, height: 0.03, rotation: 0 },
        },
      }),
    ).rejects.toThrow("crop_source_too_small");
  });
});

describe("filesystem media storage", () => {
  let mediaRoot: string | null = null;

  afterEach(async () => {
    delete process.env.WAKAYA_MEDIA_STORAGE_PATH;
    if (mediaRoot) {
      await rm(mediaRoot, { recursive: true, force: true });
      mediaRoot = null;
    }
  });

  it("stores optimized media under the configured root with deterministic public path", async () => {
    mediaRoot = await mkdtemp(join(tmpdir(), "wakaya-content-media-"));
    process.env.WAKAYA_MEDIA_STORAGE_PATH = mediaRoot;

    const source = await createLargeJpegFile();
    const storage = createFilesystemMediaStorage();

    const stored = await uploadOptimizedPublicImage(source, {
      relativePath: ["content", "asset-01", "hero-desktop.webp"],
      storage,
      transform: async (buffer) => buffer,
    });

    expect(stored.url).toBe("/media/content/asset-01/hero-desktop.webp");
    expect(stored.storageKey).toBe("content/asset-01/hero-desktop.webp");
  });

  it("rejects traversal attempts when writing media", async () => {
    mediaRoot = await mkdtemp(join(tmpdir(), "wakaya-content-media-"));
    process.env.WAKAYA_MEDIA_STORAGE_PATH = mediaRoot;

    const storage = createFilesystemMediaStorage();

    await expect(storage.write(["content", "..", "escape.webp"], Buffer.from("fake"))).rejects.toThrow(
      "invalid_media_path",
    );
  });
});
