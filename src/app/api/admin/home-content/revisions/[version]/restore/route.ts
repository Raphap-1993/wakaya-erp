import { z } from "zod";

import { homeContentStore } from "@/lib/home-content/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

const restorePayloadSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
});

async function readVersion(params: Promise<{ version: string }> | { version: string }) {
  const resolved = await params;
  const version = Number.parseInt(resolved.version, 10);
  if (!Number.isFinite(version) || version <= 0) {
    throw new Error("invalid_home_content_revision");
  }
  return version;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ version: string }> | { version: string } },
) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = restorePayloadSchema.parse(await request.json());
    const version = await readVersion(context.params);
    const item = await homeContentStore.restore(version, auth.subject ?? null, payload.expectedVersion);
    const revisions = await homeContentStore.listRevisions(10);
    return Response.json({ item, revisions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "invalid_home_content_restore_payload",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      (error.message === "invalid_home_content_revision" ||
        error.message === "home_content_revision_not_found")
    ) {
      return Response.json({ error: error.message }, { status: 404 });
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
