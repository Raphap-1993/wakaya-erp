import { describe, expect, it } from "vitest";
import { canBlockOccupancy, nightsForReservation } from "@/lib/reservations/availability";

describe("reservations availability", () => {
  it("expands inclusive nights", () => {
    expect(nightsForReservation("2026-06-12", "2026-06-14")).toEqual([
      "2026-06-12",
      "2026-06-13",
      "2026-06-14",
    ]);
  });

  it("rejects overlapping nights for the same bungalow", () => {
    const result = canBlockOccupancy([{ bungalowId: "b1", date: "2026-06-12" }], {
      bungalowId: "b1",
      startDate: "2026-06-12",
      endDate: "2026-06-14",
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("occupancy_conflict");
    expect(result.conflicts).toEqual(["2026-06-12"]);
  });
});
