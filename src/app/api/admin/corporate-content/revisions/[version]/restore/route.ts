import { z } from "zod";

import { corporateContentStore } from "@/lib/corporate-content/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

const restorePayloadSchema = z.object({ expectedVersion: z.number().int().nonnegative() });

async function readVersion(params: Promise<{ version: string }> | { version: string }) {
  const rawVersion = (await params).version;
  if (!/^[1-9]\d*$/.test(rawVersion)) {
    throw new Error("invalid_corporate_content_revision");
  }
  const version = Number(rawVersion);
  if (!Number.isSafeInteger(version)) {
    throw new Error("invalid_corporate_content_revision");
  }
  return version;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ version: string }> | { version: string } },
) {
  const auth = await requirePermission(request, "content:write");
  if (auth instanceof Response) return auth;

  try {
    const payload = restorePayloadSchema.parse(await request.json());
    const version = await readVersion(context.params);
    const item = await corporateContentStore.restore(
      version,
      auth.subject ?? null,
      payload.expectedVersion,
    );
    return Response.json({
      item,
      revisions: await corporateContentStore.listRevisions(10),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "invalid_corporate_content_restore_payload", issues: error.issues },
        { status: 400 },
      );
    }
    if (
      error instanceof Error &&
      ["invalid_corporate_content_revision", "corporate_content_revision_not_found"].includes(
        error.message,
      )
    ) {
      return Response.json({ error: error.message }, { status: 404 });
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
