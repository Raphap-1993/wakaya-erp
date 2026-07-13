import { z } from "zod";

import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

const transitionSchema = z.object({
  action: z.enum(["mark_initial_email_sent", "mark_proof_received", "mark_needs_attention", "cancel"]),
  actorId: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1).optional(),
});

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

async function readId(context: { params: { id: string } | Promise<{ id: string }> }): Promise<string> {
  const params = await context.params;
  return params.id;
}

export async function POST(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const auth = await requirePermission(request, "reservation:write");
  if (isResponse(auth)) return auth;

  try {
    const payload = transitionSchema.parse(await readJsonBody<unknown>(request));
    const bookingRequest = await reservationStore.transitionBookingRequest(await readId(context), {
      action: payload.action,
      actorId: payload.actorId ?? auth.subject ?? "system",
      reason: payload.reason,
    });

    return jsonResponse({ bookingRequest }, 200);
  } catch (error) {
    return failureResponse(error);
  }
}
