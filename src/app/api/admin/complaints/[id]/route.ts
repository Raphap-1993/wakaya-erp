import { jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const auth = await requirePermission(request, "complaint:read");
  if (auth instanceof Response) {
    return auth;
  }

  const resolvedParams = await context.params;
  const complaint = await reservationStore.getComplaint(resolvedParams.id);

  if (!complaint) {
    return jsonResponse({ error: "complaint_not_found" }, 404);
  }

  return jsonResponse({ complaint });
}
