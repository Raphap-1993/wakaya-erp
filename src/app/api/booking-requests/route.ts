import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

export async function GET(request: Request) {
  const auth = await requirePermission(request, "reservation:read");
  if (isResponse(auth)) return auth;

  try {
    const items = await reservationStore.listBookingRequests();
    return jsonResponse({ items, total: items.length });
  } catch (error) {
    return failureResponse(error);
  }
}
