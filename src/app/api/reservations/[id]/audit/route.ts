import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

async function readId(context: { params: { id: string } | Promise<{ id: string }> }): Promise<string> {
  const params = await context.params;
  return params.id;
}

export async function GET(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const auth = await requirePermission(request, "reservation:read");
  if (isResponse(auth)) return auth;

  try {
    const id = await readId(context);
    const items = await reservationStore.getAuditTrail(id);
    return jsonResponse({ items, total: items.length });
  } catch (error) {
    return failureResponse(error);
  }
}
