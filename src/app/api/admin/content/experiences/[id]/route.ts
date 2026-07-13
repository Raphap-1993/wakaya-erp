import { z } from "zod";

import { contentStore } from "@/lib/content/store";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

const experienceUpdateSchema = z.object({
  expectedVersion: z.coerce.number().int().positive(),
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

const archivePayloadSchema = z.object({
  expectedVersion: z.coerce.number().int().positive(),
});

async function readId(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await params;
  return resolved.id;
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
    const experience = await contentStore.getExperienceById(await readId(context.params));
    if (!experience) {
      throw new Error("content_not_found");
    }
    return jsonResponse({ experience });
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
    const id = await readId(context.params);
    const current = await contentStore.getExperienceById(id);
    if (!current) {
      throw new Error("content_not_found");
    }

    const payload = experienceUpdateSchema.parse(await request.json());
    const experience = await contentStore.updateExperience(id, {
      id,
      slug: payload.slug,
      visible: payload.visible,
      featuredOnHome: payload.featuredOnHome,
      sortOrder: payload.sortOrder,
      iconKey: payload.iconKey,
      localeContent: payload.content,
      cardAssetId: payload.cardAssetId,
      heroAssetId: payload.heroAssetId,
      galleryAssetIds: payload.galleryAssetIds,
      expectedVersion: payload.expectedVersion,
    });

    return jsonResponse({ experience });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "invalid_payload", issues: error.issues }, 400);
    }
    return failureResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = archivePayloadSchema.parse(await request.json());
    const experience = await contentStore.archiveExperience(await readId(context.params), payload.expectedVersion);
    return jsonResponse({ experience });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "invalid_payload", issues: error.issues }, 400);
    }
    return failureResponse(error);
  }
}
