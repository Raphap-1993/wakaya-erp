import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { reservationStore } from "@/lib/reservations/store";
import { authenticate } from "@/middleware/authn";
import { hasPermission } from "@/lib/rbac";
import type { ReservationChannel, ReservationStatus } from "@/lib/reservations/types";
import ReservationsMonitor from "./reservations-monitor";
import {
  buildReservationsMonitorHref,
  type ReservationsMonitorSearchParams,
  normalizeReservationsMonitorQuery,
} from "./reservations-query";

const VALID_STATUSES = new Set<ReservationStatus>([
  "pending_review",
  "ota_imported_confirmed",
  "confirmed",
  "assigned",
  "checked_in",
  "checked_out",
  "paid",
  "cancelled",
  "no_show",
]);

const VALID_CHANNELS = new Set<ReservationChannel>(["web", "ota"]);

function toReservationStatus(value?: string): ReservationStatus | undefined {
  return value && VALID_STATUSES.has(value as ReservationStatus) ? (value as ReservationStatus) : undefined;
}

function toReservationChannel(value?: string): ReservationChannel | undefined {
  return value && VALID_CHANNELS.has(value as ReservationChannel) ? (value as ReservationChannel) : undefined;
}

export default async function ReservationsAdminPage({
  searchParams,
}: {
  searchParams?: ReservationsMonitorSearchParams | Promise<ReservationsMonitorSearchParams>;
}) {
  const query = normalizeReservationsMonitorQuery((await searchParams) ?? {});
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));
  const auth = await authenticate(new Request("http://localhost/admin/reservations", { headers: requestHeaders }));
  if (!auth.authenticated || !hasPermission(auth.roles, "reservation:read")) {
    notFound();
  }

  const canonicalFilters = {
    status: toReservationStatus(query.status),
    channel: toReservationChannel(query.channel),
    responsibleId: query.responsibleId,
    date: query.date,
    startDate: query.startDate,
    endDate: query.endDate,
  };
  const items = reservationStore.list(canonicalFilters);
  const requestedSelectedId = query.selected ?? null;
  const selectedId = items.some((item) => item.id === requestedSelectedId)
    ? requestedSelectedId
    : items[0]?.id ?? null;
  type ReservationsRedirectHref = Parameters<typeof redirect>[0];

  if (
    query.status !== canonicalFilters.status ||
    query.channel !== canonicalFilters.channel ||
    requestedSelectedId !== selectedId
  ) {
    redirect(
      buildReservationsMonitorHref({
        ...canonicalFilters,
        week: query.week,
        selected: selectedId ?? undefined,
      }) as ReservationsRedirectHref,
    );
  }

  return <ReservationsMonitor items={items} selectedId={selectedId} query={query} />;
}
