import sharp from "sharp";

import { createFilesystemMediaStorage } from "./filesystem-media-storage";
import type { MediaStorage } from "./media-storage";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_TOTAL_PIXELS = 40_000_000;
const SUPPORTED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const VARIANT_DIMENSIONS = {
  heroDesktop: { width: 1920, height: 1080, quality: 88 },
  heroMobile: { width: 1080, height: 1350, quality: 88 },
  detail: { width: 1600, height: 1200, quality: 86 },
  card: { width: 960, height: 720, quality: 86 },
  thumb: { width: 480, height: 360, quality: 84 },
} as const;

const MIN_VARIANT_SOURCE_PIXELS = {
  heroDesktop: { width: 200, height: 112 },
  heroMobile: { width: 160, height: 200 },
  detail: { width: 160, height: 160 },
  card: { width: 160, height: 160 },
  thumb: { width: 120, height: 120 },
} as const;

export type MediaVariantKey = keyof typeof VARIANT_DIMENSIONS;

export type MediaCropSpec = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
};

export type OptimizedMediaArtifact = {
  buffer: Buffer;
  format: "webp";
  width: number;
  height: number;
  bytes: number;
  quality: number;
  nearLossless?: true;
};

export type StoredPublicImage = {
  url: string;
  storageKey: string;
  width: number;
  height: number;
  bytes: number;
  format: "webp";
};

function validateUpload(file: File) {
  if (!SUPPORTED_MEDIA_TYPES.has(file.type)) {
    throw new Error("invalid_media_type");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("media_too_large");
  }
}

function validateCrop(crop: MediaCropSpec | undefined, variant: string): MediaCropSpec {
  if (!crop) {
    throw new Error(`missing_required_crop:${variant}`);
  }

  const values = [crop.x, crop.y, crop.width, crop.height];
  if (
    values.some((value) => Number.isNaN(value) || value < 0 || value > 1) ||
    crop.width <= 0 ||
    crop.height <= 0 ||
    crop.x + crop.width > 1 ||
    crop.y + crop.height > 1
  ) {
    throw new Error("invalid_crop_bounds");
  }

  return crop;
}

async function normalizeInput(file: File) {
  validateUpload(file);

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const normalized = await sharp(inputBuffer, { failOn: "error" }).rotate().toBuffer({ resolveWithObject: true });
  const width = normalized.info.width ?? 0;
  const height = normalized.info.height ?? 0;

  if (!width || !height) {
    throw new Error("media_processing_failed");
  }

  if (width * height > MAX_TOTAL_PIXELS) {
    throw new Error("media_dimensions_too_large");
  }

  return {
    buffer: normalized.data,
    width,
    height,
  };
}

async function createVariant(
  source: { buffer: Buffer; width: number; height: number },
  variant: MediaVariantKey,
  crop: MediaCropSpec,
): Promise<OptimizedMediaArtifact> {
  const left = Math.round(crop.x * source.width);
  const top = Math.round(crop.y * source.height);
  const extractWidth = Math.round(crop.width * source.width);
  const extractHeight = Math.round(crop.height * source.height);
  const target = VARIANT_DIMENSIONS[variant];
  const minimum = MIN_VARIANT_SOURCE_PIXELS[variant];

  if (extractWidth < minimum.width || extractHeight < minimum.height) {
    throw new Error("crop_source_too_small");
  }

  const output = await sharp(source.buffer, { failOn: "error" })
    .extract({
      left,
      top,
      width: extractWidth,
      height: extractHeight,
    })
    .rotate(crop.rotation)
    .resize({
      width: target.width,
      height: target.height,
      fit: "cover",
    })
    .webp({
      quality: target.quality,
      effort: 6,
    })
    .toBuffer({ resolveWithObject: true });

  if (output.info.width !== target.width || output.info.height !== target.height) {
    throw new Error("crop_source_too_small");
  }

  return {
    buffer: output.data,
    format: "webp",
    width: output.info.width,
    height: output.info.height,
    bytes: output.info.size,
    quality: target.quality,
  };
}

export async function optimizeContentImage(
  file: File,
  options: {
    requiredVariants: MediaVariantKey[];
    crops: Partial<Record<MediaVariantKey, MediaCropSpec>>;
  },
): Promise<{
  master: OptimizedMediaArtifact;
  variants: Partial<Record<MediaVariantKey, OptimizedMediaArtifact>>;
}> {
  const source = await normalizeInput(file);

  const masterOutput = await sharp(source.buffer, { failOn: "error" })
    .resize({
      width: 3200,
      height: 3200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      nearLossless: true,
      quality: 95,
      effort: 6,
    })
    .toBuffer({ resolveWithObject: true });

  const variants: Partial<Record<MediaVariantKey, OptimizedMediaArtifact>> = {};
  for (const variant of options.requiredVariants) {
    const crop = validateCrop(options.crops[variant], variant);
    variants[variant] = await createVariant(source, variant, crop);
  }

  return {
    master: {
      buffer: masterOutput.data,
      format: "webp",
      width: masterOutput.info.width,
      height: masterOutput.info.height,
      bytes: masterOutput.info.size,
      quality: 95,
      nearLossless: true,
    },
    variants,
  };
}

export async function uploadOptimizedPublicImage(
  file: File,
  options: {
    relativePath: string[];
    storage: MediaStorage;
    transform: (buffer: Buffer) => Promise<Buffer>;
  },
) {
  validateUpload(file);
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await options.transform(inputBuffer);
  const stored = await options.storage.write(options.relativePath, outputBuffer);

  return {
    storageKey: stored.storageKey,
    url: `/media/${stored.storageKey}`,
  };
}

export function buildPublicMediaUrl(pathSegments: string[]) {
  return `/media/${pathSegments.join("/")}`;
}

export async function optimizeLegacyPublicImage(
  file: File,
  options: {
    relativePath: string[];
    targetWidth: number;
    quality: number;
    storage?: MediaStorage;
  },
): Promise<StoredPublicImage> {
  const source = await normalizeInput(file);
  const output = await sharp(source.buffer, { failOn: "error" })
    .resize({
      width: options.targetWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: options.quality,
      effort: 5,
    })
    .toBuffer({ resolveWithObject: true });

  const storage = options.storage ?? createFilesystemMediaStorage();
  const stored = await storage.write(options.relativePath, output.data);

  return {
    url: buildPublicMediaUrl(options.relativePath),
    storageKey: stored.storageKey,
    width: output.info.width,
    height: output.info.height,
    bytes: output.info.size,
    format: "webp",
  };
}

export async function readStoredPublicMedia(
  pathSegments: string[],
  storage: MediaStorage = createFilesystemMediaStorage(),
) {
  let buffer: Buffer;
  try {
    buffer = await storage.read(pathSegments);
  } catch {
    const [scope, assetId, filename] = pathSegments;
    const isManagedVariantPath =
      scope === "assets" &&
      Boolean(assetId) &&
      typeof filename === "string" &&
      filename.endsWith(".webp") &&
      filename !== "master.webp";

    if (!isManagedVariantPath) {
      throw new Error("media_not_found");
    }

    try {
      // Assets are reusable across slots. Older uploads may only have the
      // variants required by their original slot, so master.webp is the
      // safe, uncropped fallback for a new slot reference.
      buffer = await storage.read(["assets", assetId, "master.webp"]);
    } catch {
      throw new Error("media_not_found");
    }
  }

  return {
    buffer,
    contentType: "image/webp",
  };
}
