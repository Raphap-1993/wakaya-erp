import { compareDateOnly, expandDateRangeInclusive } from "@/lib/reservations/date-utils";

export interface OccupancyLike {
  bungalowId: string;
  date: string;
}

export interface BlockRequest {
  bungalowId: string;
  startDate: string;
  endDate: string;
}

export interface AvailabilityResult {
  ok: boolean;
  blockedNights: string[];
  conflicts: string[];
  reason?: "occupancy_conflict" | "invalid_range";
}

export function nightsForReservation(startDate: string, endDate: string): string[] {
  return expandDateRangeInclusive(startDate, endDate);
}

export function canBlockOccupancy(
  existingOccupancies: ReadonlyArray<OccupancyLike>,
  request: BlockRequest,
): AvailabilityResult {
  if (compareDateOnly(request.startDate, request.endDate) > 0) {
    return {
      ok: false,
      blockedNights: [],
      conflicts: [],
      reason: "invalid_range",
    };
  }

  const nights = nightsForReservation(request.startDate, request.endDate);
  const occupied = new Set(
    existingOccupancies
      .filter((occupancy) => occupancy.bungalowId === request.bungalowId)
      .map((occupancy) => occupancy.date),
  );
  const conflicts = nights.filter((night) => occupied.has(night));

  if (conflicts.length > 0) {
    return {
      ok: false,
      blockedNights: [],
      conflicts,
      reason: "occupancy_conflict",
    };
  }

  return {
    ok: true,
    blockedNights: nights,
    conflicts: [],
  };
}
