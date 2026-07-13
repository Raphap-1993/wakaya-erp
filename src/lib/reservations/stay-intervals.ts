import { addDays, compareDateOnly } from "@/lib/reservations/date-utils";

export function assertValidStayRange(startDate: string, endDate: string) {
  if (compareDateOnly(startDate, endDate) >= 0) throw new Error("invalid_stay_range");
}

export function nightsForStay(startDate: string, endDate: string): string[] {
  assertValidStayRange(startDate, endDate);
  const nights: string[] = [];
  let current = startDate;
  while (current !== endDate) {
    nights.push(current);
    current = addDays(current, 1);
  }
  return nights;
}

export function stayRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  assertValidStayRange(aStart, aEnd);
  assertValidStayRange(bStart, bEnd);
  return compareDateOnly(aStart, bEnd) < 0 && compareDateOnly(bStart, aEnd) < 0;
}
