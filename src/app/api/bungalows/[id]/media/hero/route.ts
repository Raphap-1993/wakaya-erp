import { contentMediaService } from "@/lib/content/media/content-media-service";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

async function readBungalowId(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await params;
  return resolved.id;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "reservation:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const bungalowId = await readBungalowId(context.params);
    const current = await reservationStore.getBungalowPublicContent(bungalowId);
    if (!current) {
      throw new Error("bungalow_not_found");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error("invalid_media_payload");
    }

    const { asset, media } = await contentMediaService.createCompatibilityBungalowMedia({
      file,
      kind: "hero",
      actorId: auth.subject ?? null,
    });

    const publicContent = await reservationStore.updateBungalowPublicContent(bungalowId, {
      featuredOnHome: current.featuredOnHome,
      sortOrder: current.sortOrder,
      heroImageUrl: media.url,
      galleryUrls: current.galleryUrls,
      nightlyRatePen: current.nightlyRatePen,
      areaSqm: current.areaSqm,
      localeContent: current.localeContent,
      heroAssetId: asset.id,
      galleryAssetIds: current.galleryAssetIds,
      expectedVersion: current.revisionVersion,
    });

    return jsonResponse({ publicContent, media });
  } catch (error) {
    return failureResponse(error);
  }
}
