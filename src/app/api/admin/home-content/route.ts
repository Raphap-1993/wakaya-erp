import { z } from "zod";

import { homeContentDocumentSchema } from "@/lib/home-content/schema";
import { homeContentStore } from "@/lib/home-content/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

const publishPayloadSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  document: homeContentDocumentSchema,
});

export async function GET(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  const [item, revisions] = await Promise.all([
    homeContentStore.getPublished(),
    homeContentStore.listRevisions(10),
  ]);

  return Response.json({ item, revisions });
}

export async function PUT(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = publishPayloadSchema.parse(await request.json());
    const item = await homeContentStore.publish({
      document: payload.document,
      expectedVersion: payload.expectedVersion,
      actorId: auth.subject ?? null,
    });
    const revisions = await homeContentStore.listRevisions(10);
    return Response.json({ item, revisions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "invalid_home_content_payload",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "home_content_version_conflict") {
      return Response.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof Error && error.message === "home_content_store_not_ready") {
      return Response.json({ error: error.message }, { status: 503 });
    }

    throw error;
  }
}
