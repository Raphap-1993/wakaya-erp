import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { bookingRequestUpdateSchema } from "@/lib/reservations/schemas";
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
    const threadView = await reservationStore.getBookingRequestThreadView(await readId(context));
    if (!threadView) {
      return jsonResponse({ error: "booking_request_not_found" }, 404);
    }

    return jsonResponse(threadView);
  } catch (error) {
    return failureResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const auth = await requirePermission(request, "reservation:write");
  if (isResponse(auth)) return auth;

  try {
    const payload = bookingRequestUpdateSchema.parse(await readJsonBody<unknown>(request));
    const result = await reservationStore.updateBookingRequest(await readId(context), {
      actorId: payload.actorId ?? auth.subject ?? "system",
      requestedCheckIn: payload.requestedCheckIn,
      requestedCheckOut: payload.requestedCheckOut,
      requestedBungalowType: payload.requestedBungalowType ?? null,
      requestedExperienceId: payload.requestedExperienceId ?? null,
      notes: payload.notes ?? null,
      reason: payload.reason,
    });

    return jsonResponse(result, 200);
  } catch (error) {
    return failureResponse(error);
  }
}
