import { describe, expect, it } from "vitest";
import {
  canPerformRequestAction,
  nextBookingRequestStatus,
  nextReservationStatus,
} from "@/lib/reservations/state-machine";

describe("booking request state machine", () => {
  it("moves a newly created request into awaiting transfer after the initial email is sent", () => {
    expect(nextBookingRequestStatus("request_received", "mark_initial_email_sent")).toBe(
      "awaiting_transfer",
    );
  });

  it("moves a proof-received request into converted once transfer is confirmed", () => {
    expect(nextBookingRequestStatus("proof_received", "confirm_transfer")).toBe(
      "converted_to_reservation",
    );
  });

  it("rejects invalid booking-request transitions", () => {
    expect(() => nextBookingRequestStatus("request_received", "confirm_transfer")).toThrow(
      "invalid_transition",
    );
  });

  it("keeps ota reservations on the confirmed -> assigned -> checked_in path", () => {
    expect(nextReservationStatus("confirmed", "assign")).toBe("assigned");
    expect(nextReservationStatus("assigned", "check_in")).toBe("checked_in");
  });

  it("exposes back office actions for booking requests", () => {
    expect(canPerformRequestAction("proof_received", "confirm_transfer")).toBe(true);
    expect(canPerformRequestAction("cancelled", "confirm_transfer")).toBe(false);
  });
});
