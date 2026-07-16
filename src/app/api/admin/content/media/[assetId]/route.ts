import { contentMediaService } from "@/lib/content/media/content-media-service";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

async function readAssetId(
  params: Promise<{ assetId: string }> | { assetId: string },
) {
  const resolved = await params;
  return resolved.assetId;
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ assetId: string }> | { assetId: string };
  },
) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const result = await contentMediaService.deleteAsset(
      await readAssetId(context.params),
    );
    return jsonResponse(result);
  } catch (error) {
    return failureResponse(error);
  }
}
