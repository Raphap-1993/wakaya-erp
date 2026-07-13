import { z } from "zod";

import { contentStore } from "@/lib/content/store";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

const galleryPayloadSchema = z.object({
  expectedVersion: z.coerce.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.string().trim().min(1),
      assetId: z.string().trim().min(1),
      visible: z.boolean(),
      sortOrder: z.coerce.number().int().nonnegative(),
      localeContent: z.object({
        es: z.object({
          alt: z.string().trim().min(1),
          caption: z.string().trim().min(1),
        }),
        en: z.object({
          alt: z.string().trim().min(1),
          caption: z.string().trim().min(1),
        }),
      }),
    }),
  ),
});

export async function GET(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const gallery = await contentStore.getGallery();
    return jsonResponse(gallery);
  } catch (error) {
    return failureResponse(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = galleryPayloadSchema.parse(await request.json());
    const gallery = await contentStore.publishGallery({
      expectedVersion: payload.expectedVersion,
      actorId: auth.subject ?? null,
      items: payload.items,
    });
    return jsonResponse(gallery);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "invalid_payload", issues: error.issues }, 400);
    }
    return failureResponse(error);
  }
}
