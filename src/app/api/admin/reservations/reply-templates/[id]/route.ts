import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { quickReplyTemplateSchema } from "@/lib/reservations/schemas";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

async function readTemplateId(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await params;
  return resolved.id;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "reservation:approve");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = quickReplyTemplateSchema.parse(await readJsonBody<unknown>(request));
    const template = await reservationStore.updateQuickReplyTemplate(await readTemplateId(context.params), {
      ...payload,
      updatedByUserId: auth.subject ?? "system",
    });
    return jsonResponse({ template }, 200);
  } catch (error) {
    return failureResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "reservation:approve");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const template = await reservationStore.deactivateQuickReplyTemplate(
      await readTemplateId(context.params),
      auth.subject ?? "system",
    );
    return jsonResponse({ template }, 200);
  } catch (error) {
    return failureResponse(error);
  }
}
