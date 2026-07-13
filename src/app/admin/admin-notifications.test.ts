import { describe, expect, it } from "vitest";

import { buildAdminNotifications } from "./admin-notifications";
import type { BookingRequest, Reservation } from "@/lib/reservations/types";

function createReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: overrides.id ?? "reservation-1",
    number: overrides.number ?? "RESERVATION-2026-0001",
    channel: overrides.channel ?? "web",
    status: overrides.status ?? "confirmed",
    bungalowId: overrides.bungalowId ?? "bungalow-suite",
    responsibleId: overrides.responsibleId ?? "user-reception-1",
    startDate: overrides.startDate ?? "2026-07-06",
    endDate: overrides.endDate ?? "2026-07-07",
    updatedAt: overrides.updatedAt ?? "2026-07-06T09:00:00.000Z",
    amountTotalCents: overrides.amountTotalCents,
    amountPaidCents: overrides.amountPaidCents,
    paymentStatus: overrides.paymentStatus,
    currencyCode: overrides.currencyCode,
    sourceRequestId: overrides.sourceRequestId,
  };
}

function createBookingRequest(overrides: Partial<BookingRequest> = {}): BookingRequest {
  return {
    id: overrides.id ?? "request-1",
    publicRef: overrides.publicRef ?? "WR-2026-0001",
    status: overrides.status ?? "awaiting_transfer",
    guestName: overrides.guestName ?? "Ada Lovelace",
    guestEmail: overrides.guestEmail ?? "ada@example.com",
    guestPhone: overrides.guestPhone ?? null,
    requestedCheckIn: overrides.requestedCheckIn ?? "2026-07-10",
    requestedCheckOut: overrides.requestedCheckOut ?? "2026-07-12",
    requestedGuests: overrides.requestedGuests ?? 2,
    requestedBungalowType: overrides.requestedBungalowType ?? "bungalow-family",
    sourceChannel: overrides.sourceChannel ?? "web_public",
    threadId: overrides.threadId ?? "thread-1",
    threadKey: overrides.threadKey ?? "booking-request:WR-2026-0001",
    ownerUserId: overrides.ownerUserId ?? null,
    ownerAssignedAt: overrides.ownerAssignedAt ?? null,
    notes: overrides.notes ?? null,
    lastMessageAt: overrides.lastMessageAt ?? "2026-07-06T09:00:00.000Z",
    syncStatus: overrides.syncStatus ?? "pending",
    createdAt: overrides.createdAt ?? "2026-07-06T08:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-07-06T09:00:00.000Z",
  };
}

describe("buildAdminNotifications", () => {
  it("builds prioritized bell items for conflicts, pending proofs, sync issues, and stay actions", () => {
    const notifications = buildAdminNotifications({
      reservations: [
        createReservation({
          id: "arrival-1",
          status: "assigned",
          startDate: "2026-07-06",
          endDate: "2026-07-08",
        }),
        createReservation({
          id: "departure-1",
          status: "checked_in",
          startDate: "2026-07-04",
          endDate: "2026-07-06",
        }),
      ],
      bookingRequests: [
        createBookingRequest({
          id: "proof-1",
          publicRef: "WR-2026-0101",
          status: "proof_received",
        }),
        createBookingRequest({
          id: "sync-1",
          publicRef: "WR-2026-0102",
          syncStatus: "degraded",
          status: "awaiting_transfer",
        }),
      ],
      requestConflictEntries: [
        {
          requestId: "proof-1",
          requestPublicRef: "WR-2026-0101",
          total: 1,
        },
      ],
      today: "2026-07-06",
    });

    expect(notifications.total).toBe(5);
    expect(notifications.items.map((item) => item.title)).toEqual([
      "Conflictos web vs OTA",
      "Sync degradado",
      "Comprobantes por confirmar",
      "Check-in de hoy",
      "Check-out de hoy",
    ]);
    expect(notifications.items[0]).toMatchObject({
      tone: "critical",
      href: "/admin/reservations/requests/proof-1",
      count: 1,
    });
  });

  it("returns an empty state when there is no operational alert", () => {
    const notifications = buildAdminNotifications({
      reservations: [
        createReservation({
          status: "paid",
          startDate: "2026-07-02",
          endDate: "2026-07-03",
        }),
      ],
      bookingRequests: [
        createBookingRequest({
          status: "converted_to_reservation",
          syncStatus: "synced",
        }),
      ],
      requestConflictEntries: [],
      today: "2026-07-06",
    });

    expect(notifications.total).toBe(0);
    expect(notifications.items).toEqual([]);
  });
});
