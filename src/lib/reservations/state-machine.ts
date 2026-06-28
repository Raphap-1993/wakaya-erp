import type { ReservationAction, ReservationStatus } from "@/lib/reservations/types";

const TRANSITIONS: Record<ReservationStatus, Partial<Record<ReservationAction, ReservationStatus>>> = {
  pending_review: {
    confirm: "confirmed",
    cancel: "cancelled",
  },
  ota_imported_confirmed: {
    assign: "assigned",
    mark_no_show: "no_show",
    cancel: "cancelled",
  },
  confirmed: {
    assign: "assigned",
    mark_no_show: "no_show",
    cancel: "cancelled",
  },
  assigned: {
    check_in: "checked_in",
    mark_no_show: "no_show",
    cancel: "cancelled",
  },
  checked_in: {
    check_out: "checked_out",
    cancel: "cancelled",
  },
  checked_out: {
    mark_paid: "paid",
  },
  paid: {},
  cancelled: {},
  no_show: {},
};

export function nextReservationStatus(
  current: ReservationStatus,
  action: ReservationAction,
): ReservationStatus {
  const next = TRANSITIONS[current]?.[action];
  if (!next) {
    throw new Error("invalid_transition");
  }
  return next;
}

export function canPerformAction(
  current: ReservationStatus,
  action: ReservationAction,
): boolean {
  return Boolean(TRANSITIONS[current]?.[action]);
}
