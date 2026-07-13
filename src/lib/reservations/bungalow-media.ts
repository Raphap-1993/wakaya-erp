import { randomUUID } from "node:crypto";
import { createFilesystemMediaStorage } from "@/lib/content/media/filesystem-media-storage";
import {
  buildPublicMediaUrl,
  optimizeLegacyPublicImage,
  readStoredPublicMedia as readStoredSharedMedia,
} from "@/lib/content/media/image-optimizer";

type UploadKind = "hero" | "gallery";

export type StoredBungalowMedia = {
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: "webp";
};

function getTargetWidth(kind: UploadKind) {
  return kind === "hero" ? 1600 : 1280;
}

function getTargetQuality(kind: UploadKind) {
  return kind === "hero" ? 82 : 80;
}

function buildRelativePath(bungalowId: string, kind: UploadKind) {
  return ["bungalows", bungalowId, `${kind}-${Date.now()}-${randomUUID()}.webp`];
}

export function getPublicMediaUrl(pathSegments: string[]) {
  return buildPublicMediaUrl(pathSegments);
}

export async function optimizeAndStoreUploadedBungalowImage(
  file: File,
  options: {
    bungalowId: string;
    kind: UploadKind;
  },
): Promise<StoredBungalowMedia> {
  const relativePath = buildRelativePath(options.bungalowId, options.kind);
  return optimizeLegacyPublicImage(file, {
    relativePath,
    targetWidth: getTargetWidth(options.kind),
    quality: getTargetQuality(options.kind),
    storage: createFilesystemMediaStorage(),
  });
}

export async function readStoredPublicMedia(pathSegments: string[]) {
  return readStoredSharedMedia(pathSegments, createFilesystemMediaStorage());
}
