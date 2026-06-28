import type { ReservationChannel, ReservationPaymentStatus, ReservationStatus } from "@/lib/reservations/types";
import { formatMoneyCents, PAYMENT_STATUS_LABELS, paymentTone, STATUS_LABELS, statusTone } from "./reservations-monitor-shared";

export type ReservationChipTone =
  | "statusPendingReview"
  | "statusConfirmed"
  | "statusPaid"
  | "statusCancelled"
  | "paymentPending"
  | "paymentPartial"
  | "paymentPaid";

export interface ReservationInfoChip {
  key: string;
  label: string;
  value: string;
  tone?: ReservationChipTone;
}

export interface ReservationInfoChipSource {
  status: ReservationStatus;
  channel: ReservationChannel;
  paymentStatus?: ReservationPaymentStatus | null;
  amountTotalCents?: number | null;
  amountPaidCents?: number | null;
  bungalowName?: string | null;
}

export function getReservationBalanceCents(source: ReservationInfoChipSource): number {
  return Math.max((source.amountTotalCents ?? 0) - (source.amountPaidCents ?? 0), 0);
}

export function buildReservationInfoChips(source: ReservationInfoChipSource): ReservationInfoChip[] {
  const balanceCents = getReservationBalanceCents(source);
  const paymentStatus = source.paymentStatus ?? "pending";

  const chips: ReservationInfoChip[] = [
    {
      key: "status",
      label: "Estado",
      value: STATUS_LABELS[source.status],
      tone: (statusTone(source.status) || undefined) as ReservationChipTone | undefined,
    },
    {
      key: "payment",
      label: "Cobro",
      value: PAYMENT_STATUS_LABELS[paymentStatus],
      tone: paymentTone(paymentStatus) as ReservationChipTone,
    },
    {
      key: "channel",
      label: "Canal",
      value: source.channel.toUpperCase(),
    },
    {
      key: "balance",
      label: "Saldo",
      value: formatMoneyCents(balanceCents),
      tone: balanceCents > 0 ? "statusPendingReview" : "statusPaid",
    },
  ];

  if (source.bungalowName) {
    chips.push({
      key: "bungalow",
      label: "Bungalow",
      value: source.bungalowName,
    });
  }

  return chips;
}
