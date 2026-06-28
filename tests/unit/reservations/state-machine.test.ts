import { describe, expect, it } from "vitest";
import { canPerformAction, nextReservationStatus } from "@/lib/reservations/state-machine";

describe("reservations state machine", () => {
  it("allows pending_review -> confirm", () => {
    expect(nextReservationStatus("pending_review", "confirm")).toBe("confirmed");
  });

  it("allows ota_imported_confirmed -> assign", () => {
    expect(nextReservationStatus("ota_imported_confirmed", "assign")).toBe("assigned");
  });

  it("allows confirmed -> mark_no_show", () => {
    expect(nextReservationStatus("confirmed", "mark_no_show")).toBe("no_show");
  });

  it("rejects invalid transitions", () => {
    expect(() => nextReservationStatus("checked_out", "confirm")).toThrow("invalid_transition");
    expect(() => nextReservationStatus("checked_in", "mark_no_show")).toThrow("invalid_transition");
  });

  it("allows checked_in -> cancel for administrative override", () => {
    expect(nextReservationStatus("checked_in", "cancel")).toBe("cancelled");
  });

  it("reports action availability", () => {
    expect(canPerformAction("checked_out", "check_in")).toBe(false);
    expect(canPerformAction("assigned", "check_in")).toBe(true);
    expect(canPerformAction("confirmed", "mark_no_show")).toBe(true);
    expect(canPerformAction("checked_in", "mark_no_show")).toBe(false);
    expect(canPerformAction("checked_in", "cancel")).toBe(true);
  });
});
