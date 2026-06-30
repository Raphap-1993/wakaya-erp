import { NextResponse } from "next/server";
import { requirePermission } from "@/middleware/authn";
import { failureResponse, jsonResponse } from "@/lib/reservations/http";
import { reservationStore } from "@/lib/reservations/store";
import type { ReservationChannel, ReservationStatus } from "@/lib/reservations/types";

function isResponse(value: Response | Awaited<ReturnType<typeof requirePermission>>): value is Response {
  return value instanceof Response;
}

function readString(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function escapeCsv(value: string | number | null | undefined): string {
  const text = `${value ?? ""}`;
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: Request) {
  const auth = await requirePermission(request, "reservation:read");
  if (isResponse(auth)) return auth;

  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "json";
    const status = readString(url.searchParams.get("status"));
    const channel = readString(url.searchParams.get("channel"));
    const responsibleId = readString(url.searchParams.get("responsibleId"));
    const date = readString(url.searchParams.get("date"));
    const startDate = readString(url.searchParams.get("startDate"));
    const endDate = readString(url.searchParams.get("endDate"));

    const items = await reservationStore.list({
      status: status ? (status as ReservationStatus) : undefined,
      channel: channel ? (channel as ReservationChannel) : undefined,
      responsibleId,
      date,
      startDate,
      endDate,
    });

    const rows = items.map((item) => ({
      id: item.id,
      number: item.number,
      status: item.status,
      paymentStatus: item.paymentStatus ?? "pending",
      channel: item.channel,
      bungalow: item.bungalow?.name ?? "",
      amountTotalCents: item.amountTotalCents ?? 0,
      amountPaidCents: item.amountPaidCents ?? 0,
      balanceCents: Math.max((item.amountTotalCents ?? 0) - (item.amountPaidCents ?? 0), 0),
      currencyCode: item.currencyCode ?? "PEN",
      updatedAt: item.updatedAt,
    }));

    const summary = {
      totalReservations: rows.length,
      pendingReservations: rows.filter((row) => row.paymentStatus === "pending").length,
      partialReservations: rows.filter((row) => row.paymentStatus === "partial").length,
      paidReservations: rows.filter((row) => row.paymentStatus === "paid").length,
      balanceDueCents: rows.reduce((sum, row) => sum + row.balanceCents, 0),
    };

    if (format === "csv") {
      const header = [
        "number",
        "status",
        "paymentStatus",
        "channel",
        "bungalow",
        "amountTotalCents",
        "amountPaidCents",
        "balanceCents",
        "currencyCode",
        "updatedAt",
      ].join(",");
      const body = rows
        .map((row) =>
          [
            row.number,
            row.status,
            row.paymentStatus,
            row.channel,
            row.bungalow,
            row.amountTotalCents,
            row.amountPaidCents,
            row.balanceCents,
            row.currencyCode,
            row.updatedAt,
          ]
            .map(escapeCsv)
            .join(","),
        )
        .join("\n");
      const csv = [header, body].filter(Boolean).join("\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": 'attachment; filename="wakaya-reservations-financial-report.csv"',
        },
      });
    }

    return jsonResponse({ summary, items: rows });
  } catch (error) {
    return failureResponse(error);
  }
}
