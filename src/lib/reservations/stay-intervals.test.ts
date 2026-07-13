import { describe, expect, it } from "vitest";

import { nightsForStay, stayRangesOverlap } from "./stay-intervals";

describe("reservation stay intervals", () => {
  it("lists stay nights without the checkout date", () => {
    expect(nightsForStay("2026-08-10", "2026-08-12")).toEqual(["2026-08-10", "2026-08-11"]);
  });

  it("treats checkout and next check-in on the same day as non-overlapping", () => {
    expect(stayRangesOverlap("2026-08-10", "2026-08-12", "2026-08-12", "2026-08-13")).toBe(false);
  });

  it("rejects same-day stays because checkout is exclusive", () => {
    expect(() => nightsForStay("2026-08-12", "2026-08-12")).toThrow("invalid_stay_range");
  });
});
