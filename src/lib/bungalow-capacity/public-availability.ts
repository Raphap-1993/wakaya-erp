import { nightsForStay } from "@/lib/reservations/stay-intervals";
import { addDays } from "@/lib/reservations/date-utils";
import type { Bungalow } from "@/lib/reservations/types";

import { calculateCapacityAvailability, isCapacityBlockingStatus } from "./availability";
import type {
  BungalowCapacityRecord,
  CapacityReservationCommitment,
} from "./types";

export interface PublicAvailabilityAlternative {
  bungalowTypeId: string;
  displayName: string;
  capacity: number;
  availableUnitCount: number;
}

export interface PublicAvailabilityAlternativeDate {
  checkIn: string;
  checkOut: string;
  availableUnitCount: number;
}

export type PublicCapacityAvailability = {
  available: boolean;
  bungalowTypeId: string;
  availableUnitCount: number;
  alternatives: PublicAvailabilityAlternative[];
  alternativeDates: PublicAvailabilityAlternativeDate[];
};

function findCapacity(capacities: ReadonlyArray<BungalowCapacityRecord>, bungalowId: string) {
  const capacity = capacities.find((item) => item.bungalowId === bungalowId);
  if (!capacity) throw new Error("bungalow_capacity_not_found");
  return capacity;
}

export function listSoldOutCapacityRanges(input: {
  capacity: BungalowCapacityRecord;
  reservations: ReadonlyArray<CapacityReservationCommitment>;
}): Array<{ startDate: string; endDate: string }> {
  const candidateNights = new Set<string>();
  for (const reservation of input.reservations) {
    if (reservation.bungalowId !== input.capacity.bungalowId || !isCapacityBlockingStatus(reservation.status)) continue;
    nightsForStay(reservation.checkIn, reservation.checkOut).forEach((night) => candidateNights.add(night));
  }
  const soldOutNights = [...candidateNights].sort().filter((night) =>
    calculateCapacityAvailability({
      capacity: input.capacity,
      reservations: input.reservations,
      checkIn: night,
      checkOut: addDays(night, 1),
    }).availableUnitsForStay === 0,
  );

  const ranges: Array<{ startDate: string; endDate: string }> = [];
  for (const night of soldOutNights) {
    const previous = ranges.at(-1);
    if (previous?.endDate === night) {
      previous.endDate = addDays(night, 1);
    } else {
      ranges.push({ startDate: night, endDate: addDays(night, 1) });
    }
  }
  return ranges;
}

export function summarizePublicCapacityAvailability(input: {
  capacities: ReadonlyArray<BungalowCapacityRecord>;
  reservations: ReadonlyArray<CapacityReservationCommitment>;
  bungalows: ReadonlyArray<Bungalow>;
  bungalowId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}): PublicCapacityAvailability {
  const requested = calculateCapacityAvailability({
    capacity: findCapacity(input.capacities, input.bungalowId),
    reservations: input.reservations,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });

  if (requested.availableUnitsForStay > 0) {
    return {
      available: true,
      bungalowTypeId: input.bungalowId,
      availableUnitCount: requested.availableUnitsForStay,
      alternatives: [],
      alternativeDates: [],
    };
  }

  const alternatives = input.bungalows
    .filter((bungalow) => bungalow.active && bungalow.id !== input.bungalowId && bungalow.capacity >= input.guests)
    .map((bungalow) => ({
      bungalow,
      availableUnitCount: calculateCapacityAvailability({
        capacity: findCapacity(input.capacities, bungalow.id),
        reservations: input.reservations,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
      }).availableUnitsForStay,
    }))
    .filter((item) => item.availableUnitCount > 0)
    .sort(
      (left, right) =>
        left.bungalow.capacity - right.bungalow.capacity || left.bungalow.name.localeCompare(right.bungalow.name),
    )
    .slice(0, 3)
    .map(({ bungalow, availableUnitCount }) => ({
      bungalowTypeId: bungalow.id,
      displayName: bungalow.name,
      capacity: bungalow.capacity,
      availableUnitCount,
    }));

  const duration = nightsForStay(input.checkIn, input.checkOut).length;
  const alternativeDates: PublicCapacityAvailability["alternativeDates"] = [];
  for (let offset = 1; offset <= 60 && alternativeDates.length < 3; offset += 1) {
    const checkIn = addDays(input.checkIn, offset);
    const checkOut = addDays(checkIn, duration);
    const availableUnitCount = calculateCapacityAvailability({
      capacity: findCapacity(input.capacities, input.bungalowId),
      reservations: input.reservations,
      checkIn,
      checkOut,
    }).availableUnitsForStay;
    if (availableUnitCount > 0) alternativeDates.push({ checkIn, checkOut, availableUnitCount });
  }

  return {
    available: false,
    bungalowTypeId: input.bungalowId,
    availableUnitCount: 0,
    alternatives,
    alternativeDates,
  };
}
