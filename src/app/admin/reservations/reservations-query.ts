export type ReservationsMonitorQuery = {
  status?: string;
  channel?: string;
  responsibleId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  selected?: string;
};

const QUERY_KEYS = ["status", "channel", "responsibleId", "date", "startDate", "endDate", "selected"] as const;

function readQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }
  return value?.trim() || undefined;
}

export function normalizeReservationsMonitorQuery(
  query: Partial<Record<(typeof QUERY_KEYS)[number], string | string[] | undefined>>,
): ReservationsMonitorQuery {
  const normalized: ReservationsMonitorQuery = {};

  for (const key of QUERY_KEYS) {
    const value = readQueryValue(query[key]);
    if (value) {
      normalized[key] = value;
    }
  }

  return normalized;
}

export function buildReservationsMonitorHref(query: ReservationsMonitorQuery): string {
  const params = new URLSearchParams();

  for (const key of QUERY_KEYS) {
    const value = query[key];
    if (value) {
      params.set(key, value);
    }
  }

  const suffix = params.toString();
  return suffix ? `/admin/reservations?${suffix}` : "/admin/reservations";
}
