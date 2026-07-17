import type { MediaCropSpec, MediaVariantKey } from "@/lib/content/media/image-optimizer";
import { z } from "zod";

import {
  contentMediaService,
  type ContentMediaSlot,
} from "@/lib/content/media/content-media-service";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "100", 10);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 100;

  try {
    const assets = await contentMediaService.listAssets({ query, limit });
    return jsonResponse({ assets });
  } catch (error) {
    return failureResponse(error);
  }
}

const slotSchema = z.union([
  z.literal("hero"),
  z.literal("detail"),
  z.literal("card"),
  z.literal("gallery"),
]);

function readCrop(value: unknown): MediaCropSpec {
  const crop = z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    })
    .parse(value);

  return crop;
}

function parseCrops(slot: ContentMediaSlot, raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error(slot === "hero" ? "missing_required_crop:heroDesktop" : "missing_required_crop:detail");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const crops: Partial<Record<MediaVariantKey, MediaCropSpec>> = {};

  if (slot === "hero") {
    if (!("desktop" in parsed) || !parsed.desktop) {
      throw new Error("missing_required_crop:heroDesktop");
    }
    if (!("mobile" in parsed) || !parsed.mobile) {
      throw new Error("missing_required_crop:heroMobile");
    }
    crops.heroDesktop = readCrop(parsed.desktop);
    crops.heroMobile = readCrop(parsed.mobile);
    return crops;
  }

  if (!("standard" in parsed) || !parsed.standard) {
    throw new Error("missing_required_crop:detail");
  }
  const standard = readCrop(parsed.standard);
  if (slot === "card") {
    crops.card = standard;
    crops.thumb = standard;
    return crops;
  }

  crops.detail = standard;
  crops.thumb = standard;
  return crops;
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const slot = slotSchema.parse(String(formData.get("slot") ?? "").trim()) as ContentMediaSlot;

    if (!(file instanceof File)) {
      throw new Error("invalid_media_payload");
    }

    const crops = parseCrops(slot, formData.get("crops"));
    const result = await contentMediaService.createAsset({
      file,
      slot,
      crops,
      actorId: auth.subject ?? null,
    });

    return jsonResponse(result, 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ error: "invalid_payload" }, 400);
    }
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "invalid_payload", issues: error.issues }, 400);
    }
    return failureResponse(error);
  }
}
