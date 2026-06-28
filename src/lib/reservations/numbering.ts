export interface NumberedReservation {
  number: string;
}

export function nextReservationNumber(items: NumberedReservation[]): string {
  const year = new Date().getFullYear();
  const prefix = `RESERVATION-${year}-`;
  const currentMax = items
    .map((item) => item.number)
    .filter((number) => number.startsWith(prefix))
    .map((number) => Number(number.slice(prefix.length)))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);

  return `${prefix}${String(currentMax + 1).padStart(4, "0")}`;
}
