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
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
    if (files.length === 0) {
      throw new Error("invalid_media_payload");
    }

    const uploaded = await Promise.all(
      files.map((file) =>
        contentMediaService.createCompatibilityBungalowMedia({
          file,
          kind: "gallery",
          actorId: auth.subject ?? null,
        }),
      ),
    );
    const media = uploaded.map((item) => item.media);
    const galleryAssetIds = [
      ...(current.galleryAssetIds ?? []),
      ...uploaded.map((item) => item.asset.id),
    ];

    const publicContent = await reservationStore.updateBungalowPublicContent(bungalowId, {
      featuredOnHome: current.featuredOnHome,
      sortOrder: current.sortOrder,
      heroImageUrl: current.heroImageUrl,
      galleryUrls: [...current.galleryUrls, ...media.map((item) => item.url)],
      nightlyRatePen: current.nightlyRatePen,
      areaSqm: current.areaSqm,
      localeContent: current.localeContent,
      heroAssetId: current.heroAssetId,
      galleryAssetIds,
      expectedVersion: current.revisionVersion,
    });

    return jsonResponse({ publicContent, files: media });
  } catch (error) {
    return failureResponse(error);
  }
}
