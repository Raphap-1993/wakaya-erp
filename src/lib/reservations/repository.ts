import type {
  Bungalow,
  Reservation,
  ReservationAssignmentInput,
  ReservationAudit,
  ReservationCreateInput,
  ReservationListFilters,
  ReservationPaymentInput,
  ReservationStatusChangeInput,
  ReservationUpdateInput,
} from "@/lib/reservations/types";

export interface ReservationDetail extends Reservation {
  bungalow: Bungalow | null;
  auditCount: number;
}

export interface ReservationListItem extends Reservation {
  bungalow: Bungalow | null;
}

export interface CreateReservationResult {
  reservation: Reservation;
  occupancy: Array<{
    id: string;
    reservationId: string;
    bungalowId: string;
    date: string;
    source: Reservation["channel"];
    status: "provisional" | "confirmed" | "released";
    createdAt: string;
  }>;
  audit: ReservationAudit;
}

export interface ReservationStoreLike {
  list(filters?: ReservationListFilters): ReservationListItem[];
  get(id: string): ReservationDetail | null;
  getBungalow(id: string): Bungalow | null;
  listBungalows(): Bungalow[];
  getAuditTrail(reservationId: string): ReservationAudit[];
  create(input: ReservationCreateInput): CreateReservationResult;
  update(reservationId: string, input: ReservationUpdateInput): ReservationDetail;
  assign(reservationId: string, input: ReservationAssignmentInput): ReservationDetail;
  transition(reservationId: string, input: ReservationStatusChangeInput): ReservationDetail;
  recordPayment(reservationId: string, input: ReservationPaymentInput): ReservationDetail;
}

export interface ReservationServiceLike {
  list(filters?: ReservationListFilters): Promise<ReservationListItem[]>;
  get(id: string): Promise<ReservationDetail | null>;
  getBungalow(id: string): Promise<Bungalow | null>;
  listBungalows(): Promise<Bungalow[]>;
  getAuditTrail(reservationId: string): Promise<ReservationAudit[]>;
  create(input: ReservationCreateInput): Promise<CreateReservationResult>;
  update(reservationId: string, input: ReservationUpdateInput): Promise<ReservationDetail>;
  assign(reservationId: string, input: ReservationAssignmentInput): Promise<ReservationDetail>;
  transition(reservationId: string, input: ReservationStatusChangeInput): Promise<ReservationDetail>;
  recordPayment(reservationId: string, input: ReservationPaymentInput): Promise<ReservationDetail>;
}
