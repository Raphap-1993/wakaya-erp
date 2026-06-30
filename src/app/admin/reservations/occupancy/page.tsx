import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { reservationStore } from "@/lib/reservations/store";
import { authenticate } from "@/middleware/authn";
import { hasPermission } from "@/lib/rbac";
import { addDays } from "@/lib/reservations/date-utils";
import {
  buildReservationsOccupancyHref,
  normalizeReservationsMonitorQuery,
  type ReservationsMonitorSearchParams,
} from "../reservations-query";
import OccupancyView from "./occupancy-view";
import { buildOccupancyModel, getDefaultOccupancyCell, getOccupancySelectionValue, resolveWeekAnchor } from "./occupancy-utils";

export default async function ReservationsOccupancyPage({
  searchParams,
}: {
  searchParams?: ReservationsMonitorSearchParams | Promise<ReservationsMonitorSearchParams>;
}) {
  const query = normalizeReservationsMonitorQuery((await searchParams) ?? {});
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));
  const auth = await authenticate(new Request("http://localhost/admin/reservations/occupancy", { headers: requestHeaders }));
  if (!auth.authenticated || !hasPermission(auth.roles, "reservation:read")) {
    notFound();
  }

  const anchorDate = resolveWeekAnchor(query.week, query.date);
  const weekEndDate = addDays(anchorDate, 6);
  const [items, bungalows] = await Promise.all([
    reservationStore.list({
      startDate: anchorDate,
      endDate: weekEndDate,
    }),
    reservationStore.listBungalows(),
  ]);
  const auditEntries = await Promise.all(
    items.map(async (item) => [item.id, await reservationStore.getAuditTrail(item.id)] as const),
  );
  const auditsByReservationId = Object.fromEntries(auditEntries);
  const model = buildOccupancyModel(items, bungalows, {
    week: query.week,
    date: query.date ?? anchorDate,
    selected: query.selected,
  });
  const defaultCell = getDefaultOccupancyCell(model.rows);

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
    />
  );
}
