import { redirect } from "next/navigation";
import { reservationStore } from "@/lib/reservations/store";
import { addDays } from "@/lib/reservations/date-utils";
import { compareDateOnly } from "@/lib/reservations/date-utils";
import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import { enrichMonitorItem, type BookingRequestMonitorItem } from "../requests/booking-request-monitor-presentation";
import {
  buildReservationsOccupancyHref,
  normalizeReservationsMonitorQuery,
  type ReservationsMonitorSearchParams,
} from "../reservations-query";
import { buildMonitorPermissions } from "../reservations-monitor-shared";
import OccupancyView from "./occupancy-view";
import { buildOccupancyModel, getDefaultOccupancyCell, getOccupancySelectionValue, resolveWeekAnchor } from "./occupancy-utils";

export const dynamic = "force-dynamic";

export default async function ReservationsOccupancyPage({
  searchParams,
}: {
  searchParams?: ReservationsMonitorSearchParams | Promise<ReservationsMonitorSearchParams>;
}) {
  const query = normalizeReservationsMonitorQuery((await searchParams) ?? {});
  const auth = await requireAdminPageAccess("/admin/reservations/occupancy", "reservation:read");

  const anchorDate = resolveWeekAnchor(query.week, query.date);
  const weekEndDate = addDays(anchorDate, 6);
  const [items, bungalows, bookingRequests] = await Promise.all([
    reservationStore.list({
      startDate: anchorDate,
      endDate: weekEndDate,
    }),
    reservationStore.listBungalows(),
    reservationStore.listBookingRequests(),
  ]);
  const auditEntries = await Promise.all(
    items.map(async (item) => [item.id, await reservationStore.getAuditTrail(item.id)] as const),
  );
  const auditsByReservationId = Object.fromEntries(auditEntries);
  const sourceRequestIds = Array.from(
    new Set(
      items
        .map((item) => item.sourceRequestId)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  );
  const linkedRequestViews = await Promise.all(
    sourceRequestIds.map(async (requestId) => {
      const detail = await reservationStore.getBookingRequestThreadView(requestId);
      if (!detail) {
        return null;
      }
      return [requestId, enrichMonitorItem(detail.bookingRequest, detail)] as const;
    }),
  );
  const linkedRequestsById = Object.fromEntries(
    linkedRequestViews.filter((entry): entry is readonly [string, BookingRequestMonitorItem] => entry !== null),
  );
  const linkedRequestsByReservationId = Object.fromEntries(
    items.flatMap((item) => {
      const requestId = item.sourceRequestId;
      if (!requestId) {
        return [];
      }
      const linkedRequest = linkedRequestsById[requestId];
      return linkedRequest ? [[item.id, linkedRequest] as const] : [];
    }),
  );
  const weeklyBookingRequestIds = bookingRequests
    .filter(
      (request) =>
        compareDateOnly(request.requestedCheckIn, weekEndDate) <= 0 &&
        compareDateOnly(request.requestedCheckOut, anchorDate) >= 0 &&
        request.status !== "converted_to_reservation" &&
        request.status !== "cancelled",
    )
    .map((request) => request.id)
    .filter((requestId) => !sourceRequestIds.includes(requestId));
  const weeklyRequestViews = await Promise.all(
    weeklyBookingRequestIds.map(async (requestId) => {
      const detail = await reservationStore.getBookingRequestThreadView(requestId);
      if (!detail || detail.conflicts.length === 0) {
        return null;
      }
      return enrichMonitorItem(detail.bookingRequest, detail);
    }),
  );
  const weeklyRequestConflicts = weeklyRequestViews.filter(
    (item): item is BookingRequestMonitorItem => item !== null,
  );
  const model = buildOccupancyModel(items, bungalows, {
    week: query.week,
    date: query.date ?? anchorDate,
    selected: query.selected,
  });
  const defaultCell = getDefaultOccupancyCell(model.rows, query.date ?? anchorDate);

  if (!query.selected && defaultCell) {
    type ReservationsRedirectHref = Parameters<typeof redirect>[0];
    redirect(
      buildReservationsOccupancyHref({
        ...query,
        date: defaultCell.date,
        selected: getOccupancySelectionValue(defaultCell),
        view: "occupancy",
      }) as ReservationsRedirectHref,
    );
  }

  return (
    <OccupancyView
      items={items}
      bungalows={bungalows}
      query={{ ...query, date: query.date ?? anchorDate }}
      auditsByReservationId={auditsByReservationId}
      linkedRequestsByReservationId={linkedRequestsByReservationId}
      weeklyRequestConflicts={weeklyRequestConflicts}
      permissions={buildMonitorPermissions(auth.roles)}
    />
  );
}
