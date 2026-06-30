import { NextResponse } from "next/server";

import { failureResponse, readJsonBody } from "@/lib/reservations/http";
import { reservationCreateSchema } from "@/lib/reservations/schemas";
import { nextReservationNumber } from "@/lib/reservations/numbering";
import { reservationStore } from "@/lib/reservations/store";

function asObjectRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

export async function POST(request: Request) {
  try {
    const rawBody = await readJsonBody<unknown>(request);
    const existingReservations = await reservationStore.list();
    const number = nextReservationNumber(existingReservations);
    const parsed = reservationCreateSchema.parse({
      ...asObjectRecord(rawBody),
      number,
      channel: "web",
    });

    const result = await reservationStore.create({
      ...parsed,
      channel: "web",
      responsibleId: null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return failureResponse(error);
  }
}
