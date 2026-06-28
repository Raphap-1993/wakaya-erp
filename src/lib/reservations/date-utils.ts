const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function assertDateOnly(value: string): void {
  if (!DATE_ONLY.test(value)) {
    throw new Error(`invalid_date:${value}`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`invalid_date:${value}`);
  }
  const roundTrip = parsed.toISOString().slice(0, 10);
  if (roundTrip !== value) {
    throw new Error(`invalid_date:${value}`);
  }
}

export function compareDateOnly(left: string, right: string): number {
  assertDateOnly(left);
  assertDateOnly(right);
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function addDays(date: string, days: number): string {
  assertDateOnly(date);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function expandDateRangeInclusive(startDate: string, endDate: string): string[] {
  assertDateOnly(startDate);
  assertDateOnly(endDate);
  if (compareDateOnly(startDate, endDate) > 0) {
    throw new Error("invalid_date_range");
  }

  const dates: string[] = [];
  let current = startDate;
  while (true) {
    dates.push(current);
    if (current === endDate) break;
    current = addDays(current, 1);
  }
  return dates;
}
