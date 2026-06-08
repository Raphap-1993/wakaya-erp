import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { reservationStore } from "@/lib/reservations/store";
import { authenticate } from "@/middleware/authn";
import { hasPermission } from "@/lib/rbac";
import type { ReservationChannel, ReservationStatus } from "@/lib/reservations/types";
import ReservationsMonitor from "./reservations-monitor";
import {
  buildReservationsMonitorHref,
  buildReservationsOccupancyHref,
  normalizeReservationsMonitorQuery,
} from "./reservations-query";

type SearchParams = {
  status?: string | string[];
  channel?: string | string[];
  responsibleId?: string | string[];
  date?: string | string[];
  startDate?: string | string[];
  endDate?: string | string[];
  week?: string | string[];
  selected?: string | string[];
};

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
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const query = normalizeReservationsMonitorQuery((await searchParams) ?? {});
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));
  const auth = await authenticate(new Request("http://localhost/admin/reservations", { headers: requestHeaders }));
  if (!auth.authenticated || !hasPermission(auth.roles, "reservation:read")) {
    notFound();
  }
  const permissions = {
    canAssign: hasPermission(auth.roles, "reservation:assign"),
    canApprove: hasPermission(auth.roles, "reservation:approve"),
  };

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
      }) as never,
    );
  }

  const bungalows = reservationStore.listBungalows();

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <Link
          href={buildReservationsOccupancyHref(query) as never}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "999px",
            padding: "11px 16px",
            background: "#e8ece7",
            color: "#17362f",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Ocupación
        </Link>
      </div>
      <ReservationsMonitor
        items={items}
        selectedId={selectedId}
        query={query}
        bungalows={bungalows}
        permissions={permissions}
      />
    </>
  );
}
