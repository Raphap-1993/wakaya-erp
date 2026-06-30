export type ReservationChannel = "web" | "ota";

export type BookingRequestStatus =
  | "request_received"
  | "awaiting_initial_email"
  | "awaiting_transfer"
  | "proof_received"
  | "needs_attention"
  | "converted_to_reservation"
  | "cancelled";

export type BookingRequestAction =
  | "mark_initial_email_sent"
  | "mark_proof_received"
  | "confirm_transfer"
  | "mark_needs_attention"
  | "cancel";

export type ReservationPaymentStatus = "pending" | "partial" | "paid";

export type ReservationStatus =
  | "pending_review"
  | "ota_imported_confirmed"
  | "confirmed"
  | "assigned"
  | "checked_in"
  | "checked_out"
  | "paid"
  | "cancelled"
  | "no_show";

export type ReservationAction =
  | "confirm"
  | "assign"
  | "check_in"
  | "check_out"
  | "mark_paid"
  | "cancel"
  | "mark_no_show";

export interface BookingRequest {
  id: string;
  publicRef: string;
  status: BookingRequestStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedGuests: number;
  requestedBungalowType: string | null;
  sourceChannel: "web_public";
  threadId: string | null;
  notes: string | null;
  lastMessageAt: string | null;
  syncStatus: "pending" | "synced" | "degraded";
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequestCreateInput {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedGuests: number;
  requestedBungalowType?: string | null;
  notes?: string;
}

export interface Reservation {
  id: string;
  number: string;
  channel: ReservationChannel;
  status: ReservationStatus;
  paymentStatus?: ReservationPaymentStatus;
  amountTotalCents?: number;
  amountPaidCents?: number;
  currencyCode?: "PEN";
  bungalowId: string | null;
  responsibleId: string | null;
  startDate: string;
  endDate: string;
  updatedAt: string;
  sourceRequestId?: string | null;
}

export interface Bungalow {
  id: string;
  code: string;
  name: string;
  active: boolean;
  capacity: number;
}

export interface ReservationOccupancy {
  id: string;
  reservationId: string;
  bungalowId: string;
  date: string;
  source: ReservationChannel;
  status: "provisional" | "confirmed" | "released";
  createdAt: string;
}

export interface ReservationAudit {
  id: string;
  reservationId: string;
  actorId: string;
  action: string;
  previousStatus: ReservationStatus;
  nextStatus: ReservationStatus;
  reason: string;
  createdAt: string;
}

export interface ReservationListFilters {
  status?: ReservationStatus;
  responsibleId?: string;
  channel?: ReservationChannel;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReservationCreateInput {
  number: string;
  channel: ReservationChannel;
  bungalowId: string | null;
  responsibleId?: string | null;
  startDate: string;
  endDate: string;
  amountTotalCents?: number;
  amountPaidCents?: number;
  sourceRequestId?: string | null;
}

export interface ReservationUpdateInput extends ReservationCreateInput {
  bungalowId: string;
  actorId: string;
  reason: string;
}

export interface ReservationAssignmentInput {
  bungalowId: string;
  actorId: string;
  reason: string;
}

export interface ReservationStatusChangeInput {
  action: ReservationAction;
  actorId: string;
  reason: string;
}

export interface ReservationPaymentInput {
  amountPaidCents: number;
  actorId: string;
  reason: string;
}
