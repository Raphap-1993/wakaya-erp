import type { ReservationDetail } from "@/lib/reservations/store";

export type ReservationEditorValues = {
  number: string;
  channel: "web" | "ota";
  bungalowId: string;
  startDate: string;
  endDate: string;
  amountTotal: string;
  amountPaid: string;
};

function centsToInputValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return (value / 100).toFixed(2);
}

export function createReservationEditorValues(
  reservation?: ReservationDetail | null,
): ReservationEditorValues {
  if (!reservation) {
    return {
      number: "",
      channel: "web",
      bungalowId: "",
      startDate: "",
      endDate: "",
      amountTotal: "",
      amountPaid: "",
    };
  }

  return {
    number: reservation.number,
    channel: reservation.channel,
    bungalowId: reservation.bungalowId ?? "",
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    amountTotal: centsToInputValue(reservation.amountTotalCents),
    amountPaid: centsToInputValue(reservation.amountPaidCents),
  };
}
