import { describe, expect, it } from "vitest";

import { createInMemoryCapacityStore } from "./store";
import type { CapacityReservationCommitment } from "./types";

const actorId = "user-admin-1";

function commitment(id: string): CapacityReservationCommitment {
  return {
    id,
    bungalowId: "bungalow-suite",
    checkIn: "2026-08-10",
    checkOut: "2026-08-12",
    status: "confirmed",
  };
}

describe("in-memory bungalow capacity store", () => {
  it("seeds the five approved category totals", async () => {
    const store = createInMemoryCapacityStore();
    const capacities = await store.listCapacities();

    expect(capacities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bungalowId: "bungalow-family", totalUnits: 5 }),
        expect.objectContaining({ bungalowId: "bungalow-matrimonial", totalUnits: 4 }),
        expect.objectContaining({ bungalowId: "bungalow-individual", totalUnits: 5 }),
        expect.objectContaining({ bungalowId: "bungalow-suite", totalUnits: 2 }),
        expect.objectContaining({ bungalowId: "bungalow-triple", totalUnits: 1 }),
      ]),
    );
    expect(capacities.reduce((sum, item) => sum + item.totalUnits, 0)).toBe(17);
  });

  it("updates totals with optimistic versioning", async () => {
    const store = createInMemoryCapacityStore();

    const updated = await store.updateCapacity("bungalow-suite", {
      totalUnits: 3,
      expectedVersion: 1,
      actorId,
      reservations: [],
    });

    expect(updated).toMatchObject({ totalUnits: 3, version: 2, updatedBy: actorId });
    await expect(
      store.updateCapacity("bungalow-suite", {
        totalUnits: 4,
        expectedVersion: 1,
        actorId,
        reservations: [],
      }),
    ).rejects.toThrow("capacity_version_conflict");
  });

  it("does not reduce a total below confirmed commitments", async () => {
    const store = createInMemoryCapacityStore();

    await expect(
      store.updateCapacity("bungalow-suite", {
        totalUnits: 1,
        expectedVersion: 1,
        actorId,
        reservations: [commitment("reservation-1"), commitment("reservation-2")],
      }),
    ).rejects.toMatchObject({
      code: "capacity_below_commitments",
      minimumRequired: 2,
      conflictDates: ["2026-08-10", "2026-08-11"],
    });
  });

  it("does not expose operational block mutations", () => {
    const store = createInMemoryCapacityStore() as unknown as Record<string, unknown>;

    expect(store.createBlock).toBeUndefined();
    expect(store.cancelBlock).toBeUndefined();
    expect(store.listBlocks).toBeUndefined();
  });
});
