import { describe, expect, it } from "vitest";
import { bookingRequestCreateSchema, bookingRequestUpdateSchema } from "@/lib/reservations/schemas";

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

  it("normalizes blank optional form fields", () => {
    const parsed = bookingRequestCreateSchema.parse({
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      guestPhone: "",
      requestedCheckIn: "2026-07-10",
      requestedCheckOut: "2026-07-12",
      requestedGuests: 2,
      requestedBungalowType: "",
      notes: "",
    });

    expect(parsed.guestPhone).toBeUndefined();
    expect(parsed.requestedBungalowType).toBeNull();
    expect(parsed.notes).toBeUndefined();
  });

  it("rejects a reversed stay range", () => {
    expect(() =>
      bookingRequestCreateSchema.parse({
        guestName: "Ada Lovelace",
        guestEmail: "ada@example.com",
        requestedCheckIn: "2026-07-12",
        requestedCheckOut: "2026-07-10",
        requestedGuests: 2,
      }),
    ).toThrow("invalid_range");
  });

  it("rejects a same-day stay range under checkout-exclusive rules", () => {
    expect(() =>
      bookingRequestCreateSchema.parse({
        guestName: "Ada Lovelace",
        guestEmail: "ada@example.com",
        requestedCheckIn: "2026-07-12",
        requestedCheckOut: "2026-07-12",
        requestedGuests: 2,
      }),
    ).toThrow("invalid_range");
  });

  it("accepts operational rescheduling payloads for an existing request", () => {
    const parsed = bookingRequestUpdateSchema.parse({
      requestedCheckIn: "2026-07-13",
      requestedCheckOut: "2026-07-15",
      requestedBungalowType: "",
      notes: "Cliente acepta mover el check-in al domingo.",
      reason: "conflicto ota vs web",
    });

    expect(parsed.requestedCheckIn).toBe("2026-07-13");
    expect(parsed.requestedBungalowType).toBeNull();
  });

  it("accepts an optional requested experience reference", () => {
    const parsed = bookingRequestCreateSchema.parse({
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      requestedCheckIn: "2026-07-10",
      requestedCheckOut: "2026-07-12",
      requestedGuests: 2,
      requestedExperienceId: "exp_01",
    });

    expect(parsed.requestedExperienceId).toBe("exp_01");
  });
});
