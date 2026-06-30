import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStatusSchema } from "@/lib/reservations/schemas";
import { reservationStore } from "@/lib/reservations/store";
import type { ReservationAction } from "@/lib/reservations/types";

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
  const auth = await requirePermission(request, "reservation:approve");
  if (isResponse(auth)) return auth;

  try {
    const id = await readId(context);
    const body = reservationStatusSchema.parse(await readJsonBody<unknown>(request));

    const reservation = await reservationStore.transition(id, {
      action: body.action,
      actorId: auth.subject ?? body.actorId ?? "system",
      reason: body.reason,
    });

    return jsonResponse({ reservation });
  } catch (error) {
    return failureResponse(error);
  }
}
