import { randomUUID } from "node:crypto";
import { createFilesystemMediaStorage } from "@/lib/content/media/filesystem-media-storage";
import { optimizeLegacyPublicImage } from "@/lib/content/media/image-optimizer";

export type StoredHomeContentMedia = {
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: "webp";
};

function sanitizeSlot(slot: string) {
  const normalized = slot.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-");
  return normalized.length > 0 ? normalized : "home-slot";
}

function buildRelativePath(slot: string) {
  return ["home", `${sanitizeSlot(slot)}-${Date.now()}-${randomUUID()}.webp`];
}

function getTargetWidth(slot: string) {
  return slot.includes("slide") || slot.includes("hero") ? 1600 : 1280;
}

function getTargetQuality(slot: string) {
  return slot.includes("slide") || slot.includes("hero") ? 82 : 80;
}

export async function uploadHomeContentImage(
  file: File,
  options: {
    slot: string;
  },
): Promise<{ media: StoredHomeContentMedia }> {
  const relativePath = buildRelativePath(options.slot);
  const media = await optimizeLegacyPublicImage(file, {
    relativePath,
    targetWidth: getTargetWidth(options.slot),
    quality: getTargetQuality(options.slot),
    storage: createFilesystemMediaStorage(),
  });

  return {
    media,
  };
}
