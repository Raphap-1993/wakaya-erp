import { randomUUID } from "node:crypto";
import type { ReservationAudit, ReservationStatus } from "@/lib/reservations/types";

export interface ReservationAuditInput {
  reservationId: string;
  actorId: string;
  action: string;
  previousStatus: ReservationStatus;
  nextStatus: ReservationStatus;
  reason: string;
}

export function createReservationAuditEntry(input: ReservationAuditInput): ReservationAudit {
  return {
    id: randomUUID(),
    reservationId: input.reservationId,
    actorId: input.actorId,
    action: input.action,
    previousStatus: input.previousStatus,
    nextStatus: input.nextStatus,
    reason: input.reason,
    createdAt: new Date().toISOString(),
  };
}
