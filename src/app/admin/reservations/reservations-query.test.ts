import { describe, expect, it } from "vitest";
import {
  buildReservationsMonitorHref,
  normalizeReservationsMonitorQuery,
} from "./reservations-query";

describe("reservations monitor query helpers", () => {
  it("preserves the selected reservation while filtering", () => {
    const query = normalizeReservationsMonitorQuery({
      status: "pending_review",
      channel: "web",
      responsibleId: "user-reception-1",
      date: "2026-06-15",
      selected: "reservation-demo-1",
    });

    expect(buildReservationsMonitorHref(query)).toBe(
      "/admin/reservations?status=pending_review&channel=web&responsibleId=user-reception-1&date=2026-06-15&selected=reservation-demo-1",
    );
  });

  it("drops empty query values", () => {
    const query = normalizeReservationsMonitorQuery({
      status: "  ",
      selected: "reservation-demo-2",
    });

    expect(query).toEqual({ selected: "reservation-demo-2" });
    expect(buildReservationsMonitorHref(query)).toBe(
      "/admin/reservations?selected=reservation-demo-2",
    );
  });

  it("preserves a date range query", () => {
    const query = normalizeReservationsMonitorQuery({
      startDate: "2026-06-12",
      endDate: "2026-06-15",
    });

    expect(buildReservationsMonitorHref(query)).toBe(
      "/admin/reservations?startDate=2026-06-12&endDate=2026-06-15",
    );
  });
});
