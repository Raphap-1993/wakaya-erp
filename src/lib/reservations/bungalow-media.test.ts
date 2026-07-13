import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  getPublicMediaUrl,
  optimizeAndStoreUploadedBungalowImage,
  readStoredPublicMedia,
} from "@/lib/reservations/bungalow-media";

async function createLargeJpegFile(name = "suite.jpg") {
  const sharp = (await import("sharp")).default;
  const buffer = await sharp({
    create: {
      width: 2400,
      height: 1600,
      channels: 3,
      background: { r: 214, g: 226, b: 240 },
    },
  })
    .jpeg({ quality: 94 })
    .toBuffer();

  return new File([buffer], name, { type: "image/jpeg" });
}

describe("bungalow-media", () => {
  let mediaRoot: string | null = null;

  afterEach(async () => {
    delete process.env.WAKAYA_MEDIA_STORAGE_PATH;

    if (mediaRoot) {
      await rm(mediaRoot, { recursive: true, force: true });
      mediaRoot = null;
    }
  });

  it("optimizes and stores a hero upload as webp under public media path", async () => {
    mediaRoot = await mkdtemp(join(tmpdir(), "wakaya-media-"));
    process.env.WAKAYA_MEDIA_STORAGE_PATH = mediaRoot;

    const file = await createLargeJpegFile();
    const result = await optimizeAndStoreUploadedBungalowImage(file, {
      bungalowId: "bungalow-suite",
      kind: "hero",
    });

    expect(result.url).toMatch(/^\/media\/bungalows\/bungalow-suite\/hero-/);
    expect(result.url.endsWith(".webp")).toBe(true);
    expect(result.width).toBeLessThanOrEqual(1600);
    expect(result.height).toBeLessThanOrEqual(1600);
    expect(result.bytes).toBeGreaterThan(0);

    const stored = await readStoredPublicMedia(result.url.replace("/media/", "").split("/"));

    expect(stored.contentType).toBe("image/webp");
    expect(stored.buffer.byteLength).toBe(result.bytes);
  });

  it("derives public media urls without exposing local filesystem paths", () => {
    expect(getPublicMediaUrl(["bungalows", "bungalow-suite", "hero-file.webp"])).toBe(
      "/media/bungalows/bungalow-suite/hero-file.webp",
    );
  });

  it("rejects unsupported uploads before storage", async () => {
    mediaRoot = await mkdtemp(join(tmpdir(), "wakaya-media-"));
    process.env.WAKAYA_MEDIA_STORAGE_PATH = mediaRoot;

    const file = new File([Buffer.from("fake")], "suite.pdf", { type: "application/pdf" });

    await expect(
      optimizeAndStoreUploadedBungalowImage(file, {
        bungalowId: "bungalow-suite",
        kind: "gallery",
      }),
    ).rejects.toThrowError("invalid_media_type");
  });
});
