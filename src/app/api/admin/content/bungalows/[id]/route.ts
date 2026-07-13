import { z } from "zod";

import { contentStore } from "@/lib/content/store";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

const bungalowPayloadSchema = z.object({
  expectedVersion: z.coerce.number().int().nonnegative(),
  featuredOnHome: z.boolean(),
  sortOrder: z.coerce.number().int().nonnegative(),
  nightlyRatePen: z.coerce.number().int().positive(),
  areaSqm: z.coerce.number().int().positive(),
  heroImageUrl: z.string().trim().min(1).optional(),
  galleryUrls: z.array(z.string().trim().min(1)).optional().default([]),
  localeContent: z.object({
    es: z.object({
      displayName: z.string().trim().min(1),
      displayEyebrow: z.string().trim().min(1),
      displayDescription: z.string().trim().min(1),
      displayTagline: z.string().trim().min(1),
      displayLongDescription: z.string().trim().min(1),
      displayHighlights: z.array(z.string().trim().min(1)),
      displayAmenities: z.array(z.string().trim().min(1)),
      displayIncluded: z.array(z.string().trim().min(1)),
    }),
    en: z.object({
      displayName: z.string().trim().min(1),
      displayEyebrow: z.string().trim().min(1),
      displayDescription: z.string().trim().min(1),
      displayTagline: z.string().trim().min(1),
      displayLongDescription: z.string().trim().min(1),
      displayHighlights: z.array(z.string().trim().min(1)),
      displayAmenities: z.array(z.string().trim().min(1)),
      displayIncluded: z.array(z.string().trim().min(1)),
    }),
  }),
  heroAssetId: z.string().trim().min(1).nullable(),
  galleryAssetIds: z.array(z.string().trim().min(1)).default([]),
});

async function readId(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await params;
  return resolved.id;
}

function heroUrlFromAssetId(assetId: string | null) {
  return assetId ? `/media/assets/${assetId}/heroDesktop.webp` : "";
}

function galleryUrlsFromAssetIds(assetIds: string[]) {
  return assetIds.map((assetId) => `/media/assets/${assetId}/detail.webp`);
}

function resolveHeroImageUrl(payload: z.infer<typeof bungalowPayloadSchema>) {
  if (payload.heroAssetId) {
    return heroUrlFromAssetId(payload.heroAssetId);
  }

  return payload.heroImageUrl?.trim() ?? "";
}

function resolveGalleryUrls(payload: z.infer<typeof bungalowPayloadSchema>) {
  if (payload.galleryAssetIds.length > 0) {
    return galleryUrlsFromAssetIds(payload.galleryAssetIds);
  }

  return payload.galleryUrls;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const item = await reservationStore.getBungalowPublicContent(await readId(context.params));
    if (!item) {
      throw new Error("content_not_found");
    }
    return jsonResponse({ item });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = bungalowPayloadSchema.parse(await request.json());
    const item = await contentStore.updateBungalowContent(await readId(context.params), {
      expectedVersion: payload.expectedVersion,
      featuredOnHome: payload.featuredOnHome,
      sortOrder: payload.sortOrder,
      heroImageUrl: resolveHeroImageUrl(payload),
      galleryUrls: resolveGalleryUrls(payload),
      nightlyRatePen: payload.nightlyRatePen,
      areaSqm: payload.areaSqm,
      localeContent: payload.localeContent,
      heroAssetId: payload.heroAssetId,
      galleryAssetIds: payload.galleryAssetIds,
    });
    return jsonResponse({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "invalid_payload", issues: error.issues }, 400);
    }
    return failureResponse(error);
  }
}
