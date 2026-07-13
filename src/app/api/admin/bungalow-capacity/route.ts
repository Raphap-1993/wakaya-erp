import { z } from "zod";

import { calculateCapacityAvailability } from "@/lib/bungalow-capacity/availability";
import { bungalowCapacityStore } from "@/lib/bungalow-capacity/store";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import { requirePermission } from "@/middleware/authn";

const querySchema = z
  .object({
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date"),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date"),
  })
  .refine((value) => value.checkIn < value.checkOut, {
    message: "invalid_range",
    path: ["checkOut"],
  });

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

export async function GET(request: Request) {
  const auth = await requirePermission(request, "inventory:manage");
  if (isResponse(auth)) return auth;

  try {
    const url = new URL(request.url);
    const range = querySchema.parse({
      checkIn: url.searchParams.get("checkIn"),
      checkOut: url.searchParams.get("checkOut"),
    });
    const [capacities, reservations, bungalows] = await Promise.all([
      bungalowCapacityStore.listCapacities(),
      reservationStore.list(),
      reservationStore.listBungalows(),
    ]);
    const bungalowById = new Map(bungalows.map((bungalow) => [bungalow.id, bungalow]));
    const commitments = reservations.map((reservation) => ({
      id: reservation.id,
      bungalowId: reservation.bungalowId,
      checkIn: reservation.startDate,
      checkOut: reservation.endDate,
      status: reservation.status,
    }));

    const items = capacities.map((capacity) => {
      const bungalow = bungalowById.get(capacity.bungalowId);
      const availability = calculateCapacityAvailability({
        capacity,
        reservations: commitments,
        checkIn: range.checkIn,
        checkOut: range.checkOut,
      });
      return {
        ...availability,
        displayName: bungalow?.name ?? capacity.bungalowId,
        guestCapacity: bungalow?.capacity ?? null,
        version: capacity.version,
        updatedBy: capacity.updatedBy,
        updatedAt: capacity.updatedAt,
      };
    });

    return jsonResponse({ items });
  } catch (error) {
    return failureResponse(error);
  }
}
