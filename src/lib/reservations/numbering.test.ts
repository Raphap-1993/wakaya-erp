import { describe, expect, it } from "vitest";

import { nextBookingRequestPublicRef, nextReservationNumber } from "./numbering";

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

describe("nextBookingRequestPublicRef", () => {
  it("increments the highest booking request public ref for the current year", () => {
    const year = new Date().getFullYear();

    expect(
      nextBookingRequestPublicRef([
        { publicRef: `WR-${year}-0001` },
        { publicRef: `WR-${year}-0007` },
        { publicRef: "WR-2025-9999" },
      ]),
    ).toBe(`WR-${year}-0008`);
  });
});
