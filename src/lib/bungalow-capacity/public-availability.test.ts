import { describe, expect, it } from "vitest";

import { WAKAYA_OPERATIONAL_BUNGALOWS } from "@/lib/reservations/wakaya-bungalows";

import {
  listSoldOutCapacityRanges,
  summarizePublicCapacityAvailability,
} from "./public-availability";
import { APPROVED_BUNGALOW_CAPACITIES } from "./seed";

const capacities = APPROVED_BUNGALOW_CAPACITIES.map((item) => ({
  ...item,
  version: 1,
  updatedBy: null,
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
}));

describe("public aggregate capacity availability", () => {
  it("returns availability without totals, block details or individual identifiers", () => {
    const result = summarizePublicCapacityAvailability({
      capacities,
      reservations: [
        {
          id: "reservation-1",
          bungalowId: "bungalow-suite",
          checkIn: "2026-08-10",
          checkOut: "2026-08-12",
          status: "confirmed",
        },
      ],
      bungalows: WAKAYA_OPERATIONAL_BUNGALOWS,
      bungalowId: "bungalow-suite",
      checkIn: "2026-08-10",
      checkOut: "2026-08-12",
      guests: 2,
    });

    expect(result).toMatchObject({ available: true, bungalowTypeId: "bungalow-suite", availableUnitCount: 1 });
    expect(JSON.stringify(result)).not.toMatch(/totalUnits|unitId|blocks|FAM-01|DOB-01/);
  });

  it("offers types and later ranges when the requested category is sold out", () => {
    const result = summarizePublicCapacityAvailability({
      capacities,
      reservations: [1, 2].map((index) => ({
        id: `reservation-${index}`,
        bungalowId: "bungalow-suite",
        checkIn: "2026-08-10",
        checkOut: "2026-08-12",
        status: "confirmed" as const,
      })),
      bungalows: WAKAYA_OPERATIONAL_BUNGALOWS,
      bungalowId: "bungalow-suite",
      checkIn: "2026-08-10",
      checkOut: "2026-08-12",
      guests: 2,
    });

    expect(result.available).toBe(false);
    expect(result.alternatives).toHaveLength(3);
    expect(result.alternativeDates).toHaveLength(3);
  });

  it("marks calendar ranges only when every physical unit is committed", () => {
    const doubleCapacity = capacities.find((item) => item.bungalowId === "bungalow-suite")!;
    const oneReservation = [{
      id: "reservation-1",
      bungalowId: "bungalow-suite",
      checkIn: "2026-08-10",
      checkOut: "2026-08-12",
      status: "confirmed" as const,
    }];

    expect(listSoldOutCapacityRanges({
      capacity: doubleCapacity,
      reservations: oneReservation,
    })).toEqual([]);

    expect(listSoldOutCapacityRanges({
      capacity: doubleCapacity,
      reservations: [
        ...oneReservation,
        { ...oneReservation[0], id: "reservation-2" },
      ],
    })).toEqual([{ startDate: "2026-08-10", endDate: "2026-08-12" }]);
  });
});
