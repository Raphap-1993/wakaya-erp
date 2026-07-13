import { contentMediaService } from "@/lib/content/media/content-media-service";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const slot = String(formData.get("slot") ?? "").trim();

    if (!(file instanceof File) || !slot) {
      throw new Error("invalid_media_payload");
    }

    const result = await contentMediaService.createCompatibilityHomeMedia({
      file,
      slot,
      actorId: auth.subject ?? null,
    });
    return jsonResponse(result);
  } catch (error) {
    return failureResponse(error);
  }
}
