import { randomUUID } from "node:crypto";
import { z } from "zod";

import { contentStore } from "@/lib/content/store";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

const experiencePayloadSchema = z.object({
  id: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1),
  visible: z.boolean(),
  featuredOnHome: z.boolean().default(false),
  sortOrder: z.coerce.number().int().nonnegative(),
  iconKey: z.string().trim().min(1),
  content: z.object({
    es: z.object({
      title: z.string().trim().min(1),
      summary: z.string().trim().min(1),
      body: z.string().trim().min(1),
      duration: z.string().trim().min(1),
      priceLabel: z.string().trim().min(1),
      ctaLabel: z.string().trim().min(1),
      included: z.array(z.string().trim().min(1)).min(1),
      recommendations: z.array(z.string().trim().min(1)).min(1),
    }),
    en: z.object({
      title: z.string().trim().min(1),
      summary: z.string().trim().min(1),
      body: z.string().trim().min(1),
      duration: z.string().trim().min(1),
      priceLabel: z.string().trim().min(1),
      ctaLabel: z.string().trim().min(1),
      included: z.array(z.string().trim().min(1)).min(1),
      recommendations: z.array(z.string().trim().min(1)).min(1),
    }),
  }),
  cardAssetId: z.string().trim().min(1).nullable(),
  heroAssetId: z.string().trim().min(1).nullable(),
  galleryAssetIds: z.array(z.string().trim().min(1)).default([]),
});

export async function GET(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const items = await contentStore.listExperiences({ includeArchived: true });
    return jsonResponse({ items });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = experiencePayloadSchema.parse(await request.json());
    const experience = await contentStore.createExperience({
      id: payload.id ?? `exp_${randomUUID().replace(/-/g, "").slice(0, 8)}`,
      slug: payload.slug,
      visible: payload.visible,
      featuredOnHome: payload.featuredOnHome,
      sortOrder: payload.sortOrder,
      iconKey: payload.iconKey,
      localeContent: payload.content,
      cardAssetId: payload.cardAssetId,
      heroAssetId: payload.heroAssetId,
      galleryAssetIds: payload.galleryAssetIds,
    });

    return jsonResponse({ experience }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "invalid_payload", issues: error.issues }, 400);
    }
    return failureResponse(error);
  }
}
