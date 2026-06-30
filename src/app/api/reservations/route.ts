import { NextResponse } from "next/server";
import { requirePermission } from "@/middleware/authn";
import {
  failureResponse,
  jsonResponse,
  readJsonBody,
} from "@/lib/reservations/http";
import { reservationCreateSchema } from "@/lib/reservations/schemas";
import { reservationStore } from "@/lib/reservations/store";
import type { ReservationChannel, ReservationStatus } from "@/lib/reservations/types";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

export async function GET(request: Request) {
  const auth = await requirePermission(request, "reservation:read");
  if (isResponse(auth)) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const channel = url.searchParams.get("channel") ?? undefined;
  const responsibleId = url.searchParams.get("responsibleId") ?? undefined;
  const date = url.searchParams.get("date") ?? undefined;
  const startDate = url.searchParams.get("startDate") ?? undefined;
  const endDate = url.searchParams.get("endDate") ?? undefined;

  const items = await reservationStore.list({
    status: status ? (status as ReservationStatus) : undefined,
    channel: channel ? (channel as ReservationChannel) : undefined,
    responsibleId,
    date,
    startDate,
    endDate,
  });

  return jsonResponse({ items, total: items.length });
}

export async function POST(request: Request) {
  const auth = await requirePermission(request, "reservation:write");
  if (isResponse(auth)) return auth;

  try {
    const rawBody = await readJsonBody<unknown>(request);
    const parsed = reservationCreateSchema.parse(rawBody);

    const result = await reservationStore.create({
      ...parsed,
      responsibleId: parsed.responsibleId ?? auth.subject ?? null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return failureResponse(error);
  }
}
