import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { quickReplyTemplateSchema } from "@/lib/reservations/schemas";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "reservation:write");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const items = await reservationStore.listQuickReplyTemplates();
    return jsonResponse({ items });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "reservation:approve");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = quickReplyTemplateSchema.parse(await readJsonBody<unknown>(request));
    const template = await reservationStore.createQuickReplyTemplate({
      ...payload,
      updatedByUserId: auth.subject ?? "system",
    });
    return jsonResponse({ template }, 201);
  } catch (error) {
    return failureResponse(error);
  }
}
