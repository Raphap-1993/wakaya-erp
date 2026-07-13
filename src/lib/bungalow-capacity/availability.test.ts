import { describe, expect, it } from "vitest";

import {
  assertCapacityCanCoverCommitments,
  calculateCapacityAvailability,
  isCapacityBlockingStatus,
} from "./availability";
import type { CapacityReservationCommitment } from "./types";

type LegacyCapacityBlock = {
  id: string;
  bungalowId: string;
  quantity: number;
  checkIn: string;
  checkOut: string;
  reasonCode: string;
  notes: string | null;
  status: "active" | "cancelled";
  createdBy: string | null;
  createdAt: string;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  legacyUnitBlockId: string | null;
};

const capacity = {
  bungalowId: "bungalow-suite",
  totalUnits: 2,
  version: 1,
  updatedBy: "user-admin-1",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

function reservation(
  id: string,
  checkIn: string,
  checkOut: string,
  status: CapacityReservationCommitment["status"] = "confirmed",
): CapacityReservationCommitment {
  return {
    id,
    bungalowId: capacity.bungalowId,
    checkIn,
    checkOut,
    status,
  };
}

function block(overrides: Partial<LegacyCapacityBlock> = {}): LegacyCapacityBlock {
  return {
    id: "block-1",
    bungalowId: capacity.bungalowId,
    quantity: 1,
    checkIn: "2026-08-10",
    checkOut: "2026-08-12",
    reasonCode: "maintenance",
    notes: null,
    status: "active",
    createdBy: "user-admin-1",
    createdAt: "2026-07-12T00:00:00.000Z",
    cancelledBy: null,
    cancelledAt: null,
    cancelReason: null,
    legacyUnitBlockId: null,
    ...overrides,
  };
}

describe("bungalow capacity availability", () => {
  it("only treats committed reservation states as capacity blocking", () => {
    expect(isCapacityBlockingStatus("pending_review")).toBe(false);
    expect(isCapacityBlockingStatus("confirmed")).toBe(true);
    expect(isCapacityBlockingStatus("ota_imported_confirmed")).toBe(true);
    expect(isCapacityBlockingStatus("cancelled")).toBe(false);
  });

  it("uses checkout as an exclusive boundary", () => {
    const result = calculateCapacityAvailability({
      capacity,
      reservations: [reservation("reservation-1", "2026-08-10", "2026-08-12")],
      checkIn: "2026-08-12",
      checkOut: "2026-08-13",
    });

    expect(result.availableUnitsForStay).toBe(2);
    expect(result.nights).toEqual([
      expect.objectContaining({ date: "2026-08-12", confirmedUnits: 0, availableUnits: 2 }),
    ]);
  });

  it("ignores pending requests and returns the first critical night", () => {
    const result = calculateCapacityAvailability({
      capacity,
      reservations: [
        reservation("pending", "2026-08-10", "2026-08-13", "pending_review"),
        reservation("confirmed-1", "2026-08-11", "2026-08-13"),
        reservation("confirmed-2", "2026-08-12", "2026-08-13"),
      ],
      checkIn: "2026-08-10",
      checkOut: "2026-08-13",
    });

    expect(result.availableUnitsForStay).toBe(0);
    expect(result.criticalDate).toBe("2026-08-12");
    expect(result.confirmedOnCriticalDate).toBe(2);
    expect(result).not.toHaveProperty("blockedOnCriticalDate");
  });

  it("ignores legacy blocks even when their historical status is active", () => {
    const result = calculateCapacityAvailability({
      capacity,
      reservations: [],
      blocks: [block({ quantity: 1 })],
      checkIn: "2026-08-10",
      checkOut: "2026-08-12",
    } as Parameters<typeof calculateCapacityAvailability>[0] & { blocks: LegacyCapacityBlock[] });

    expect(result.availableUnitsForStay).toBe(2);
    expect(result).not.toHaveProperty("blockedOnCriticalDate");
    expect(result.nights.every((night) => !("blockedUnits" in night))).toBe(true);
  });

  it("allows two simultaneous confirmations for Doble and reports the third as sold out", () => {
    const result = calculateCapacityAvailability({
      capacity,
      reservations: [
        reservation("reservation-1", "2026-08-10", "2026-08-12"),
        reservation("reservation-2", "2026-08-10", "2026-08-12"),
      ],
      checkIn: "2026-08-10",
      checkOut: "2026-08-12",
    });

    expect(result.availableUnitsForStay).toBe(0);
    expect(result.canAcceptOneMore).toBe(false);
  });

  it("rejects a total below commitments with minimum and conflicting dates", () => {
    expect(() =>
      assertCapacityCanCoverCommitments({
        bungalowId: capacity.bungalowId,
        proposedTotalUnits: 1,
        reservations: [
          reservation("reservation-1", "2026-08-10", "2026-08-12"),
          reservation("reservation-2", "2026-08-11", "2026-08-13"),
        ],
        blocks: [block({ checkIn: "2026-08-11", checkOut: "2026-08-13" })],
      } as Parameters<typeof assertCapacityCanCoverCommitments>[0] & { blocks: LegacyCapacityBlock[] }),
    ).toThrow(
      expect.objectContaining({
        code: "capacity_below_commitments",
        minimumRequired: 2,
        conflictDates: ["2026-08-11"],
      }),
    );
  });
});
