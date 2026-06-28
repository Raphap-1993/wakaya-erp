import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ReservationStore } from "@/lib/reservations/store";

describe("reservation store", () => {
  it("creates a web reservation with provisional occupancy", () => {
    const store = new ReservationStore();
    const result = store.create({
      number: "RESERVATION-2026-0100",
      channel: "web",
      bungalowId: "bungalow-suite",
      responsibleId: "user-reception-1",
      startDate: "2026-07-01",
      endDate: "2026-07-03",
    });

    expect(result.reservation.status).toBe("pending_review");
    expect(result.occupancy).toHaveLength(3);
    expect(store.get(result.reservation.id)?.auditCount).toBe(1);
  });

  it("blocks a conflicting reservation for the same bungalow night", () => {
    const store = new ReservationStore();
    store.create({
      number: "RESERVATION-2026-0101",
      channel: "web",
      bungalowId: "bungalow-suite",
      responsibleId: "user-reception-1",
      startDate: "2026-06-12",
      endDate: "2026-06-13",
    });

    expect(() =>
      store.create({
        number: "RESERVATION-2026-0102",
        channel: "web",
        bungalowId: "bungalow-suite",
        responsibleId: "user-reception-1",
        startDate: "2026-06-12",
        endDate: "2026-06-13",
      }),
    ).toThrow("occupancy_conflict");
  });

  it("transitions and audits a reservation", () => {
    const store = new ReservationStore();
    const created = store.create({
      number: "RESERVATION-2026-0102",
      channel: "ota",
      bungalowId: "bungalow-matrimonial",
      responsibleId: "user-reception-2",
      startDate: "2026-07-10",
      endDate: "2026-07-11",
    });

    const transitioned = store.transition(created.reservation.id, {
      action: "cancel",
      actorId: "user-admin-1",
      reason: "guest requested cancellation",
    });

    expect(transitioned.status).toBe("cancelled");
    expect(store.getAuditTrail(created.reservation.id)).toHaveLength(2);
  });

  it("marks a confirmed reservation as no_show and releases occupancy", () => {
    const store = new ReservationStore();
    const created = store.create({
      number: "RESERVATION-2026-0104",
      channel: "web",
      bungalowId: "bungalow-suite",
      responsibleId: "user-reception-4",
      startDate: "2026-07-18",
      endDate: "2026-07-19",
    });

    const confirmed = store.transition(created.reservation.id, {
      action: "confirm",
      actorId: "user-reception-4",
      reason: "confirmed before arrival",
    });

    const noShow = store.transition(confirmed.id, {
      action: "mark_no_show",
      actorId: "user-reception-4",
      reason: "guest did not arrive",
    });

    expect(noShow.status).toBe("no_show");
    expect(store.getAuditTrail(created.reservation.id)[0].action).toBe("mark_no_show");
    expect(store.get(created.reservation.id)?.bungalow).toBeNull();
  });

  it("cancels a checked_in reservation with administrative override and releases occupancy", () => {
    const store = new ReservationStore();
    const created = store.create({
      number: "RESERVATION-2026-0105",
      channel: "ota",
      bungalowId: "bungalow-family",
      responsibleId: "user-reception-5",
      startDate: "2026-07-20",
      endDate: "2026-07-21",
    });

    const assigned = store.assign(created.reservation.id, {
      bungalowId: "bungalow-family",
      actorId: "user-reception-5",
      reason: "prepared for arrival",
    });

    const checkedIn = store.transition(assigned.id, {
      action: "check_in",
      actorId: "user-reception-5",
      reason: "guest arrived",
    });

    const cancelled = store.transition(checkedIn.id, {
      action: "cancel",
      actorId: "user-admin-1",
      reason: "administrative override due to incident",
    });

    expect(cancelled.status).toBe("cancelled");
    expect(store.get(created.reservation.id)?.bungalow).toBeNull();
    expect(store.getAuditTrail(created.reservation.id)[0].action).toBe("cancel");
  });

  it("records a partial payment and keeps the reservation open", () => {
    const store = new ReservationStore();
    const created = store.create({
      number: "RESERVATION-2026-0106",
      channel: "ota",
      bungalowId: "bungalow-family",
      responsibleId: "user-reception-6",
      startDate: "2026-07-22",
      endDate: "2026-07-23",
      amountTotalCents: 24000,
      amountPaidCents: 0,
    });

    const updated = store.recordPayment(created.reservation.id, {
      amountPaidCents: 12000,
      actorId: "user-reception-6",
      reason: "partial payment recorded",
    });

    expect(updated.amountPaidCents).toBe(12000);
    expect(updated.paymentStatus).toBe("partial");
    expect(store.getAuditTrail(created.reservation.id)[0].action).toBe("register_payment");
  });

  it("rejects assigning a reservation that is still pending review", () => {
    const store = new ReservationStore();
    const created = store.create({
      number: "RESERVATION-2026-0103",
      channel: "web",
      bungalowId: "bungalow-matrimonial",
      responsibleId: "user-reception-3",
      startDate: "2026-07-15",
      endDate: "2026-07-16",
    });

    expect(() =>
      store.assign(created.reservation.id, {
        bungalowId: "bungalow-family",
        actorId: "user-reception-3",
        reason: "assign before confirmation",
      }),
    ).toThrow("invalid_transition");
  });

  it("rejects conflicting assignments across stale store instances", () => {
    const dir = mkdtempSync(join(tmpdir(), "wakaya-reservations-atomic-"));
    const dbPath = join(dir, "reservations.sqlite");

    try {
      const seed = [
        {
          id: "reservation-atomic-1",
          number: "RESERVATION-2026-0201",
          channel: "web" as const,
          status: "confirmed" as const,
          bungalowId: null,
          responsibleId: "user-reception-1",
          startDate: "2026-08-20",
          endDate: "2026-08-22",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
        {
          id: "reservation-atomic-2",
          number: "RESERVATION-2026-0202",
          channel: "web" as const,
          status: "confirmed" as const,
          bungalowId: null,
          responsibleId: "user-reception-2",
          startDate: "2026-08-20",
          endDate: "2026-08-22",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      ];

      const first = new ReservationStore({
        storagePath: dbPath,
        reservations: seed,
      });
      const stale = new ReservationStore({ storagePath: dbPath });

      first.assign("reservation-atomic-1", {
        bungalowId: "bungalow-suite",
        actorId: "user-reception-1",
        reason: "first assignment",
      });

      expect(() =>
        stale.assign("reservation-atomic-2", {
          bungalowId: "bungalow-suite",
          actorId: "user-reception-2",
          reason: "stale conflicting assignment",
        }),
      ).toThrow("occupancy_conflict");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
