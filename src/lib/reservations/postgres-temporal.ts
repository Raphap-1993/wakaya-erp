export type PgDateOnlyValue = string | Date;
export type PgTimestampValue = string | Date | null;

export function normalizePgDateOnly(value: PgDateOnlyValue): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.includes("T") ? value.slice(0, 10) : value;
}

export function normalizePgTimestamp(value: PgTimestampValue): string | null {
  if (value === null) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}
