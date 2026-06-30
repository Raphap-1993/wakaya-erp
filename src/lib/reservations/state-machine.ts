import type {
  BookingRequestAction,
  BookingRequestStatus,
  ReservationAction,
  ReservationStatus,
} from "@/lib/reservations/types";

const REQUEST_TRANSITIONS: Record<
  BookingRequestStatus,
  Partial<Record<BookingRequestAction, BookingRequestStatus>>
> = {
  request_received: {
    mark_initial_email_sent: "awaiting_transfer",
    cancel: "cancelled",
  },
  awaiting_initial_email: {
    mark_initial_email_sent: "awaiting_transfer",
    cancel: "cancelled",
  },
  awaiting_transfer: {
    mark_proof_received: "proof_received",
    mark_needs_attention: "needs_attention",
    cancel: "cancelled",
  },
  proof_received: {
    confirm_transfer: "converted_to_reservation",
    mark_needs_attention: "needs_attention",
    cancel: "cancelled",
  },
  needs_attention: {
    mark_proof_received: "proof_received",
    cancel: "cancelled",
  },
  converted_to_reservation: {},
  cancelled: {},
};

const RESERVATION_TRANSITIONS: Record<
  ReservationStatus,
  Partial<Record<ReservationAction, ReservationStatus>>
> = {
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

export function nextBookingRequestStatus(
  current: BookingRequestStatus,
  action: BookingRequestAction,
): BookingRequestStatus {
  const next = REQUEST_TRANSITIONS[current]?.[action];
  if (!next) {
    throw new Error("invalid_transition");
  }
  return next;
}

export function canPerformRequestAction(
  current: BookingRequestStatus,
  action: BookingRequestAction,
): boolean {
  return Boolean(REQUEST_TRANSITIONS[current]?.[action]);
}

export function nextReservationStatus(
  current: ReservationStatus,
  action: ReservationAction,
): ReservationStatus {
  const next = RESERVATION_TRANSITIONS[current]?.[action];
  if (!next) {
    throw new Error("invalid_transition");
  }
  return next;
}

export function canPerformAction(
  current: ReservationStatus,
  action: ReservationAction,
): boolean {
  return Boolean(RESERVATION_TRANSITIONS[current]?.[action]);
}
