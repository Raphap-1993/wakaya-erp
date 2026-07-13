import { describe, expect, it } from "vitest";

import {
  buildOccupancyConflictResolutionPlan,
  buildRequestConflictPolicy,
  buildReservationConflictRecommendations,
  detectRequestConflicts,
} from "./conflicts";

describe("request conflicts", () => {
  it("detects overlap between a web request and an existing operational stay", () => {
    const result = detectRequestConflicts(
      {
        requestedCheckIn: "2026-07-10",
        requestedCheckOut: "2026-07-12",
        requestedBungalowType: "bungalow-matrimonial",
      },
      [
        {
          reservationId: "reservation-1",
          bungalowId: "bungalow-matrimonial",
          status: "confirmed",
          startDate: "2026-07-11",
          endDate: "2026-07-13",
        },
      ],
    );

    expect(result).toMatchObject({
      hasConflict: true,
      conflictType: "date_overlap",
      overlappingReservationIds: ["reservation-1"],
    });
  });

  it("suggests reprogramming the web request first when the overlap comes from an OTA reservation", () => {
    const policy = buildRequestConflictPolicy(
      {
        requestedCheckIn: "2026-07-10",
        requestedCheckOut: "2026-07-12",
        requestedBungalowType: "bungalow-family",
      },
      {
        reservationId: "reservation-ota-1",
        reservationNumber: "RESERVATION-2026-OTA-1",
        bungalowId: "bungalow-family",
        channel: "ota",
        status: "ota_imported_confirmed",
        paymentStatus: "pending",
        sourceRequestId: null,
        startDate: "2026-07-10",
        endDate: "2026-07-12",
      },
    );

    expect(policy.title).toContain("OTA");
    expect(policy.tone).toBe("contact_and_reprogram");
    expect(policy.anchorSide).toBe("reservation");
    expect(policy.detail).toContain("reprogram");
  });

  it("marks the OTA as anchor and the linked web reservation as the first candidate to move inside a blocked cell", () => {
    const recommendations = buildReservationConflictRecommendations([
      {
        reservationId: "reservation-ota-1",
        number: "RESERVATION-OTA-1",
        channel: "ota",
        status: "ota_imported_confirmed",
        paymentStatus: "pending",
        sourceRequestId: null,
      },
      {
        reservationId: "reservation-web-1",
        number: "RESERVATION-WEB-1",
        channel: "web",
        status: "confirmed",
        paymentStatus: "partial",
        sourceRequestId: "request-web-1",
      },
    ]);

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0]).toMatchObject({
      reservationId: "reservation-ota-1",
      tone: "anchor",
    });
    expect(recommendations[1]).toMatchObject({
      reservationId: "reservation-web-1",
      tone: "move",
    });
  });

  it("builds an OTA-first resolution plan when OTA and web reservations collide", () => {
    const plan = buildOccupancyConflictResolutionPlan([
      {
        reservationId: "reservation-ota-1",
        number: "RESERVATION-OTA-1",
        channel: "ota",
        status: "ota_imported_confirmed",
        paymentStatus: "pending",
        sourceRequestId: null,
      },
      {
        reservationId: "reservation-web-1",
        number: "RESERVATION-WEB-1",
        channel: "web",
        status: "confirmed",
        paymentStatus: "partial",
        sourceRequestId: "request-web-1",
      },
    ]);

    expect(plan).toMatchObject({
      tone: "ota_vs_web",
      anchorReservationId: "reservation-ota-1",
      moveFirstReservationId: "reservation-web-1",
      contactReservationId: "reservation-web-1",
    });
    expect(plan.title).toContain("OTA");
    expect(plan.summary).toContain("cliente web");
  });

  it("builds a web-first resolution plan when the web reservation has stronger commitment than the OTA", () => {
    const plan = buildOccupancyConflictResolutionPlan([
      {
        reservationId: "reservation-web-1",
        number: "RESERVATION-WEB-1",
        channel: "web",
        status: "checked_in",
        paymentStatus: "paid",
        sourceRequestId: "request-web-1",
      },
      {
        reservationId: "reservation-ota-1",
        number: "RESERVATION-OTA-1",
        channel: "ota",
        status: "ota_imported_confirmed",
        paymentStatus: "pending",
        sourceRequestId: null,
      },
    ]);

    expect(plan).toMatchObject({
      tone: "web_vs_ota",
      anchorReservationId: "reservation-web-1",
      moveFirstReservationId: "reservation-ota-1",
    });
    expect(plan.summary).toContain("OTA");
  });
});
