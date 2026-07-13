import { describe, expect, it } from "vitest";
import { buildReservationInfoChips, getReservationBalanceCents } from "./reservation-info-chips";

describe("reservation-info-chips", () => {
  it("builds the expected chip set for a reservation with balance", () => {
    const chips = buildReservationInfoChips({
      status: "pending_review",
      paymentStatus: "partial",
      channel: "web",
      amountTotalCents: 48_000,
      amountPaidCents: 12_000,
      bungalowName: "Bungalow Suite",
    });

    expect(chips.map((chip) => chip.key)).toEqual(["status", "payment", "channel", "balance", "bungalow"]);
    expect(chips[0]).toMatchObject({ value: "Pendiente de revisión", tone: "statusPendingReview" });
    expect(chips[1]).toMatchObject({ value: "Parcial", tone: "paymentPartial" });
    expect(chips[3]).toMatchObject({ value: "S/ 360.00", tone: "statusPendingReview" });
  });

  it("returns a zero balance when the reservation is fully paid", () => {
    expect(
      getReservationBalanceCents({
        status: "paid",
        paymentStatus: "paid",
        channel: "ota",
        amountTotalCents: 48_000,
        amountPaidCents: 48_000,
      }),
    ).toBe(0);
  });
});
