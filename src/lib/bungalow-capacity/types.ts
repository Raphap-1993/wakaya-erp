import type { ReservationStatus } from "@/lib/reservations/types";

export interface BungalowCapacityRecord {
  bungalowId: string;
  totalUnits: number;
  version: number;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CapacityReservationCommitment {
  id: string;
  bungalowId: string | null;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
}

export interface CapacityNightSummary {
  date: string;
  totalUnits: number;
  confirmedUnits: number;
  availableUnits: number;
}

export interface CapacityAvailabilitySummary {
  bungalowTypeId: string;
  totalUnits: number;
  availableUnitsForStay: number;
  criticalDate: string;
  confirmedOnCriticalDate: number;
  canAcceptOneMore: boolean;
  nights: CapacityNightSummary[];
}

export class CapacityBelowCommitmentsError extends Error {
  readonly code = "capacity_below_commitments";

  constructor(
    readonly minimumRequired: number,
    readonly conflictDates: string[],
  ) {
    super("capacity_below_commitments");
    this.name = "CapacityBelowCommitmentsError";
  }
}

export interface UpdateCapacityInput {
  totalUnits: number;
  expectedVersion: number;
  actorId: string;
  reservations?: ReadonlyArray<CapacityReservationCommitment>;
}
