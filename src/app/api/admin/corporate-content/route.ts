import { isDeepStrictEqual } from "node:util";

import { z } from "zod";

import { corporateContentDocumentSchema } from "@/lib/corporate-content/schema";
import { corporateContentStore } from "@/lib/corporate-content/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

const publishPayloadSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  document: corporateContentDocumentSchema,
});

export async function GET(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) return auth;

  const [item, revisions] = await Promise.all([
    corporateContentStore.getPublished(),
    corporateContentStore.listRevisions(10),
  ]);
  return Response.json({ item, revisions });
}

export async function PUT(request: Request) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) return auth;

  try {
    const payload = publishPayloadSchema.parse(await request.json());
    const current = await corporateContentStore.getPublished();
    if (!isDeepStrictEqual(payload.document.internal, current.document.internal)) {
      return Response.json(
        { error: "corporate_content_internal_read_only" },
        { status: 400 },
      );
    }
    const item = await corporateContentStore.publish({
      document: payload.document,
      expectedVersion: payload.expectedVersion,
      actorId: auth.subject ?? null,
    });
    const revisions = await corporateContentStore.listRevisions(10);
    return Response.json({ item, revisions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "invalid_corporate_content_payload", issues: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "corporate_content_version_conflict") {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message === "corporate_content_store_not_ready") {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
