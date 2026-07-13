import { nightsForStay } from "@/lib/reservations/stay-intervals";
import type { ReservationStatus } from "@/lib/reservations/types";

import {
  CapacityBelowCommitmentsError,
  type BungalowCapacityRecord,
  type CapacityAvailabilitySummary,
  type CapacityReservationCommitment,
} from "./types";

const CAPACITY_BLOCKING_STATUSES = new Set<ReservationStatus>([
  "ota_imported_confirmed",
  "confirmed",
  "assigned",
  "checked_in",
  "checked_out",
  "paid",
]);

export function isCapacityBlockingStatus(status: ReservationStatus): boolean {
  return CAPACITY_BLOCKING_STATUSES.has(status);
}

function addCommitmentNights(
  counts: Map<string, number>,
  checkIn: string,
  checkOut: string,
  quantity: number,
) {
  for (const night of nightsForStay(checkIn, checkOut)) {
    counts.set(night, (counts.get(night) ?? 0) + quantity);
  }
}

function reservationCounts(input: {
  bungalowId: string;
  reservations: ReadonlyArray<CapacityReservationCommitment>;
  excludeReservationId?: string | null;
}) {
  const counts = new Map<string, number>();
  for (const reservation of input.reservations) {
    if (reservation.id === input.excludeReservationId) continue;
    if (reservation.bungalowId !== input.bungalowId) continue;
    if (!isCapacityBlockingStatus(reservation.status)) continue;
    addCommitmentNights(counts, reservation.checkIn, reservation.checkOut, 1);
  }
  return counts;
}

export function calculateCapacityAvailability(input: {
  capacity: BungalowCapacityRecord;
  reservations: ReadonlyArray<CapacityReservationCommitment>;
  checkIn: string;
  checkOut: string;
  excludeReservationId?: string | null;
}): CapacityAvailabilitySummary {
  const nights = nightsForStay(input.checkIn, input.checkOut);
  const confirmedByNight = reservationCounts({
    bungalowId: input.capacity.bungalowId,
    reservations: input.reservations,
    excludeReservationId: input.excludeReservationId,
  });
  const summaries = nights.map((date) => {
    const confirmedUnits = confirmedByNight.get(date) ?? 0;
    return {
      date,
      totalUnits: input.capacity.totalUnits,
      confirmedUnits,
      availableUnits: Math.max(0, input.capacity.totalUnits - confirmedUnits),
    };
  });
  const availableUnitsForStay = Math.min(...summaries.map((night) => night.availableUnits));
  const critical = summaries.find((night) => night.availableUnits === availableUnitsForStay)!;

  return {
    bungalowTypeId: input.capacity.bungalowId,
    totalUnits: input.capacity.totalUnits,
    availableUnitsForStay,
    criticalDate: critical.date,
    confirmedOnCriticalDate: critical.confirmedUnits,
    canAcceptOneMore: availableUnitsForStay > 0,
    nights: summaries,
  };
}

export function assertCapacityCanCoverCommitments(input: {
  bungalowId: string;
  proposedTotalUnits: number;
  reservations: ReadonlyArray<CapacityReservationCommitment>;
  excludeReservationId?: string | null;
}) {
  const confirmedByNight = reservationCounts(input);
  const allDates = [...confirmedByNight.keys()].sort();
  const requiredByNight = allDates.map((date) => ({
    date,
    required: confirmedByNight.get(date) ?? 0,
  }));
  const minimumRequired = Math.max(0, ...requiredByNight.map((item) => item.required));
  const conflictDates = requiredByNight
    .filter((item) => item.required > input.proposedTotalUnits)
    .map((item) => item.date);

  if (conflictDates.length > 0) {
    throw new CapacityBelowCommitmentsError(minimumRequired, conflictDates);
  }
}
