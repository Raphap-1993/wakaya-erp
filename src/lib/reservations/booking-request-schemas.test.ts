import { describe, expect, it } from "vitest";
import { bookingRequestCreateSchema } from "@/lib/reservations/schemas";

describe("booking request schema", () => {
  it("accepts the public request payload without reservation-only fields", () => {
    const parsed = bookingRequestCreateSchema.parse({
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      guestPhone: "+51987654321",
      requestedCheckIn: "2026-07-10",
      requestedCheckOut: "2026-07-12",
      requestedGuests: 2,
      requestedBungalowType: "bungalow-matrimonial",
    });

    expect(parsed.requestedBungalowType).toBe("bungalow-matrimonial");
  });
});
