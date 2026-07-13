import { contentMediaService } from "@/lib/content/media/content-media-service";
import { failureResponse } from "@/lib/reservations/http";

export const dynamic = "force-dynamic";

async function readPath(params: Promise<{ path: string[] }> | { path: string[] }) {
  const resolved = await params;
  return resolved.path;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> | { path: string[] } },
) {
  try {
    const media = await contentMediaService.readPublicMedia(await readPath(context.params));

    return new Response(new Uint8Array(media.buffer), {
      status: 200,
      headers: {
        "content-type": media.contentType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return failureResponse(error);
  }
}
