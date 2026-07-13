import { z } from "zod";

import { bungalowCapacityStore } from "@/lib/bungalow-capacity/store";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

const updateSchema = z.object({
  totalUnits: z.coerce.number().int().nonnegative("invalid_total_units"),
  expectedVersion: z.coerce.number().int().positive("invalid_version"),
});

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ bungalowTypeId: string }> },
) {
  const auth = await requirePermission(request, "inventory:manage");
  if (isResponse(auth)) return auth;

  try {
    const [{ bungalowTypeId }, payload, reservations] = await Promise.all([
      context.params,
      readJsonBody<unknown>(request).then((body) => updateSchema.parse(body)),
      reservationStore.list(),
    ]);
    const capacity = await bungalowCapacityStore.updateCapacity(bungalowTypeId, {
      ...payload,
      actorId: auth.subject ?? "unknown-admin",
      reservations: reservations.map((reservation) => ({
        id: reservation.id,
        bungalowId: reservation.bungalowId,
        checkIn: reservation.startDate,
        checkOut: reservation.endDate,
        status: reservation.status,
      })),
    });
    return jsonResponse({ capacity });
  } catch (error) {
    return failureResponse(error);
  }
}
