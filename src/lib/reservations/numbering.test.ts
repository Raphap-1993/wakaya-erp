import { describe, expect, it } from "vitest";

import { nextReservationNumber } from "./numbering";

describe("nextReservationNumber", () => {
  it("increments the highest reservation number for the current year", () => {
    const year = new Date().getFullYear();

    expect(
      nextReservationNumber([
        { number: `RESERVATION-${year}-0001` },
        { number: `RESERVATION-${year}-0007` },
        { number: "RESERVATION-2025-9999" },
      ]),
    ).toBe(`RESERVATION-${year}-0008`);
  });
});
