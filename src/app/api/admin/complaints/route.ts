import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission(request, "complaint:read");
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const items = await reservationStore.listComplaints();
    return jsonResponse({ items });
  } catch (error) {
    return failureResponse(error);
  }
}
