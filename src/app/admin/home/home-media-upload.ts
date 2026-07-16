import type { ContentMediaAsset } from "@/lib/content/media/content-media-service";
import type { MediaCropSpec } from "@/lib/content/media/image-optimizer";

export type HomeMediaSlot = "hero" | "detail";
export type HomeMediaCropPayload = Partial<
  Record<"desktop" | "mobile" | "standard", MediaCropSpec>
>;

export function buildHomeMediaUploadFormData(
  file: File,
  slot: HomeMediaSlot,
  crops: HomeMediaCropPayload,
) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("slot", slot);
  formData.set("crops", JSON.stringify(crops));
  return formData;
}

export function resolveHomeMediaUrl(asset: ContentMediaAsset, slot: HomeMediaSlot) {
  const variant = slot === "hero" ? asset.variants.heroDesktop : asset.variants.detail;
  if (!variant?.url) {
    throw new Error("media_processing_failed");
  }
  return variant.url;
}
