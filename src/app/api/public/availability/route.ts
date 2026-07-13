import { z } from "zod";

import { summarizePublicCapacityAvailability } from "@/lib/bungalow-capacity/public-availability";
import { bungalowCapacityStore } from "@/lib/bungalow-capacity/store";
import { failureResponse, jsonResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";

const publicAvailabilitySchema = z
  .object({
    bungalowTypeId: z.string().trim().min(1, "required"),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date"),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date"),
    guests: z.coerce.number().int().positive(),
  })
  .refine((value) => value.checkIn < value.checkOut, {
    message: "invalid_range",
    path: ["checkOut"],
  });

export async function POST(request: Request) {
  try {
    const payload = publicAvailabilitySchema.parse(await readJsonBody<unknown>(request));
    const [bungalows, reservations, capacities] = await Promise.all([
      reservationStore.listBungalows(),
      reservationStore.list(),
      bungalowCapacityStore.listCapacities(),
    ]);

    const bungalow = bungalows.find((item) => item.id === payload.bungalowTypeId);
    if (!bungalow) {
      throw new Error("bungalow_not_found");
    }

    return jsonResponse(
      summarizePublicCapacityAvailability({
        reservations: reservations.map((reservation) => ({
          id: reservation.id,
          bungalowId: reservation.bungalowId,
          checkIn: reservation.startDate,
          checkOut: reservation.endDate,
          status: reservation.status,
        })),
        bungalows,
        capacities,
        bungalowId: bungalow.id,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        guests: payload.guests,
      }),
    );
  } catch (error) {
    return failureResponse(error);
  }
}
