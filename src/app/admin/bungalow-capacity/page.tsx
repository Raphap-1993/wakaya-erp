import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import { calculateCapacityAvailability } from "@/lib/bungalow-capacity/availability";
import { bungalowCapacityStore } from "@/lib/bungalow-capacity/store";
import { addDays } from "@/lib/reservations/date-utils";
import { reservationStore } from "@/lib/reservations/store";

import { BungalowCapacityWorkbench } from "./capacity-workbench";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminBungalowCapacityPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  await requireAdminPageAccess("/admin/bungalow-capacity", "inventory:manage");
  const query = (await searchParams) ?? {};
  const today = new Date().toISOString().slice(0, 10);
  const checkIn = single(query.checkIn) || today;
  const requestedCheckOut = single(query.checkOut) || addDays(checkIn, 1);
  const checkOut = requestedCheckOut > checkIn ? requestedCheckOut : addDays(checkIn, 1);

  const [capacities, reservations, bungalows] = await Promise.all([
    bungalowCapacityStore.listCapacities(),
    reservationStore.list(),
    reservationStore.listBungalows(),
  ]);
  const bungalowById = new Map(bungalows.map((bungalow) => [bungalow.id, bungalow]));
  const commitments = reservations.map((reservation) => ({
    id: reservation.id,
    bungalowId: reservation.bungalowId,
    checkIn: reservation.startDate,
    checkOut: reservation.endDate,
    status: reservation.status,
  }));
  const items = capacities.map((capacity) => {
    const bungalow = bungalowById.get(capacity.bungalowId);
    return {
      ...calculateCapacityAvailability({
        capacity,
        reservations: commitments,
        checkIn,
        checkOut,
      }),
      displayName: bungalow?.name ?? capacity.bungalowId,
      guestCapacity: bungalow?.capacity ?? null,
      version: capacity.version,
      updatedAt: capacity.updatedAt,
    };
  });

  return (
    <BungalowCapacityWorkbench
      initialCheckIn={checkIn}
      initialCheckOut={checkOut}
      initialItems={items}
    />
  );
}
