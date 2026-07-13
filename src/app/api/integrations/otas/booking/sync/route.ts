import { requireOtaJobPermission } from "@/lib/integrations/otas/job-auth";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

function isResponse(value: Response | Awaited<ReturnType<typeof requireOtaJobPermission>>): value is Response {
  return value instanceof Response;
}

export async function POST(request: Request) {
  const auth = await requireOtaJobPermission(request, "reservation:approve");
  if (isResponse(auth)) return auth;

  try {
    const result = await reservationStore.syncOtaProvider("booking_com", "incremental", auth.subject ?? "system");
    return jsonResponse({ result });
  } catch (error) {
    return failureResponse(error);
  }
}
