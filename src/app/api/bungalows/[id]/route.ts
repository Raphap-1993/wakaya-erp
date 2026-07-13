import { bungalowUpdateSchema } from "@/lib/reservations/schemas";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

async function readBungalowId(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await params;
  return resolved.id;
}

function readRawPublicContent(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = (input as Record<string, unknown>).publicContent;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  return candidate as Record<string, unknown>;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "reservation:read");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const bungalowId = await readBungalowId(context.params);
    const [bungalow, publicContent] = await Promise.all([
      reservationStore.getBungalow(bungalowId),
      reservationStore.getBungalowPublicContent(bungalowId),
    ]);
    if (!bungalow) {
      throw new Error("bungalow_not_found");
    }
    return jsonResponse({ bungalow: { ...bungalow, publicContent } });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "reservation:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const bungalowId = await readBungalowId(context.params);
    const rawBody = await readJsonBody<unknown>(request);
    const payload = bungalowUpdateSchema.parse(rawBody);
    const { publicContent: publicContentInput, ...bungalowInput } = payload;
    const bungalow = await reservationStore.updateBungalow(bungalowId, bungalowInput);
    const rawPublicContent = readRawPublicContent(rawBody);
    const shouldPreserveLegacyHeroAsset = Boolean(publicContentInput && rawPublicContent && !("heroAssetId" in rawPublicContent));
    const shouldPreserveLegacyGalleryAssets = Boolean(
      publicContentInput && rawPublicContent && !("galleryAssetIds" in rawPublicContent),
    );
    const currentPublicContent =
      publicContentInput && (shouldPreserveLegacyHeroAsset || shouldPreserveLegacyGalleryAssets)
        ? await reservationStore.getBungalowPublicContent(bungalowId)
        : null;
    const nextPublicContentInput = publicContentInput
      ? {
          ...publicContentInput,
          heroAssetId: shouldPreserveLegacyHeroAsset
            ? currentPublicContent?.heroAssetId ?? null
            : publicContentInput.heroAssetId,
          galleryAssetIds: shouldPreserveLegacyGalleryAssets
            ? currentPublicContent?.galleryAssetIds ?? []
            : publicContentInput.galleryAssetIds,
        }
      : null;
    const publicContent = nextPublicContentInput
      ? await reservationStore.updateBungalowPublicContent(bungalowId, nextPublicContentInput)
      : await reservationStore.getBungalowPublicContent(bungalowId);
    return jsonResponse({ bungalow: { ...bungalow, publicContent } });
  } catch (error) {
    return failureResponse(error);
  }
}
