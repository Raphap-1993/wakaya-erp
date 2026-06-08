export type ReservationsMonitorView = "agenda" | "occupancy";

export type ReservationsMonitorSearchParams = Partial<
  Record<
    | "status"
    | "channel"
    | "responsibleId"
    | "date"
    | "startDate"
    | "endDate"
    | "view"
    | "week"
    | "selected",
    string | string[] | undefined
  >
>;

export type ReservationsMonitorQuery = {
  status?: string;
  channel?: string;
  responsibleId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  view?: ReservationsMonitorView;
  week?: string;
  selected?: string;
};

const QUERY_KEYS = [
  "status",
  "channel",
  "responsibleId",
  "date",
  "startDate",
  "endDate",
  "view",
  "week",
  "selected",
] as const;

function readQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }
  return value?.trim() || undefined;
}

function readViewValue(value: string | string[] | undefined): ReservationsMonitorView | undefined {
  const raw = readQueryValue(value);
  return raw === "agenda" || raw === "occupancy" ? raw : undefined;
}

function appendReservationsQueryParams(params: URLSearchParams, query: ReservationsMonitorQuery): void {
  for (const key of QUERY_KEYS) {
    const value = query[key];
    if (value) {
      params.set(key, value);
    }
  }
}

export function normalizeReservationsMonitorQuery(
  query: ReservationsMonitorSearchParams,
): ReservationsMonitorQuery {
  const normalized: ReservationsMonitorQuery = {};

  for (const key of QUERY_KEYS) {
    if (key === "view") {
      const view = readViewValue(query[key]);
      if (view) {
        normalized.view = view;
      }
      continue;
    }

    const value = readQueryValue(query[key]);
    if (value) {
      normalized[key] = value as ReservationsMonitorQuery[typeof key];
    }
  }

  return normalized;
}

export function buildReservationsMonitorHref(query: ReservationsMonitorQuery): string {
  const params = new URLSearchParams();
  appendReservationsQueryParams(params, query);

  const suffix = params.toString();
  return suffix ? `/admin/reservations?${suffix}` : "/admin/reservations";
}

export function buildReservationsOccupancyHref(query: ReservationsMonitorQuery): string {
  const params = new URLSearchParams();
  appendReservationsQueryParams(params, query);
  params.set("view", "occupancy");

  const suffix = params.toString();
  return suffix ? `/admin/reservations/occupancy?${suffix}` : "/admin/reservations/occupancy";
}

export function buildReservationsFinancialReportHref(
  query: ReservationsMonitorQuery,
  format: "json" | "csv" = "json",
): string {
  const params = new URLSearchParams();
  appendReservationsQueryParams(params, query);
  params.set("format", format);

  const suffix = params.toString();
  return suffix ? `/api/reservations/reports/financial?${suffix}` : "/api/reservations/reports/financial";
}
