export interface NumberedReservation {
  number: string;
}

export interface PublicBookingRequestRef {
  publicRef: string;
}

export interface PublicComplaintCode {
  publicCode: string;
}

function normalizeBookingRequestRef(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("booking-request:")) {
    return trimmed.slice("booking-request:".length);
  }

  return trimmed;
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

export function nextBookingRequestPublicRef(items: PublicBookingRequestRef[]): string {
  const year = new Date().getFullYear();
  const prefix = `WR-${year}-`;
  const currentMax = items
    .map((item) => normalizeBookingRequestRef(item.publicRef))
    .filter((publicRef) => publicRef.startsWith(prefix))
    .map((publicRef) => Number(publicRef.slice(prefix.length)))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);

  return `${prefix}${String(currentMax + 1).padStart(4, "0")}`;
}

export function nextComplaintPublicCode(items: PublicComplaintCode[]): string {
  const year = new Date().getFullYear();
  const prefix = `LRC-${year}-`;
  const currentMax = items
    .map((item) => item.publicCode.trim())
    .filter((publicCode) => publicCode.startsWith(prefix))
    .map((publicCode) => Number(publicCode.slice(prefix.length)))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);

  return `${prefix}${String(currentMax + 1).padStart(4, "0")}`;
}
