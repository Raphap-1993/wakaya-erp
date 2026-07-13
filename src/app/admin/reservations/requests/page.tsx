import { redirect } from "next/navigation";

import { backofficeAuthStore } from "@/lib/backoffice-auth/store";
import { reservationStore } from "@/lib/reservations/store";

import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import { buildMonitorPermissions } from "../reservations-monitor-shared";
import { BookingRequestsWorkbench } from "./booking-requests-workbench";
import {
  buildRequestsWorkbenchHref,
  normalizeRequestsWorkbenchQuery,
  type RequestsWorkbenchSearchParams,
} from "./requests-workbench-query";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: RequestsWorkbenchSearchParams | Promise<RequestsWorkbenchSearchParams>;
};

export default async function RequestsAdminPage({ searchParams }: PageProps) {
  const query = normalizeRequestsWorkbenchQuery((await searchParams) ?? {});
  const auth = await requireAdminPageAccess("/admin/reservations/requests", "reservation:read");
  const permissions = buildMonitorPermissions(auth.roles);
  const users = await backofficeAuthStore.listUsers();
  const activeUsers = users.filter((item) => item.active);
  const userMap = new Map(activeUsers.map((item) => [item.id, item]));

  const rawItems = await reservationStore.listOperationsWorkbenchItems({
    lane: query.lane,
    ownerUserId: query.owner,
    query: query.query,
  });
  const items = rawItems.map((item) => ({
    ...item,
    ownerName: item.ownerUserId ? userMap.get(item.ownerUserId)?.name ?? item.ownerName ?? item.ownerUserId : null,
  }));
  const requestedSelectedId = query.selected ?? null;
  const selectedId = items.some((item) => item.id === requestedSelectedId)
    ? requestedSelectedId
    : items[0]?.id ?? null;

  if (requestedSelectedId !== selectedId) {
    redirect(
      buildRequestsWorkbenchHref({
        selected: selectedId ?? undefined,
        lane: query.lane,
        owner: query.owner,
        query: query.query,
      }),
    );
  }

  const [selectedDetail, templates, bungalows] = await Promise.all([
    selectedId ? reservationStore.getOperationThreadView(selectedId) : Promise.resolve(null),
    permissions.canWrite ? reservationStore.listQuickReplyTemplates() : Promise.resolve([]),
    reservationStore.listBungalows(),
  ]);

  return (
    <BookingRequestsWorkbench
      items={items}
      selectedDetail={selectedDetail}
      ownerOptions={activeUsers.map((user) => ({
        id: user.id,
        label: user.name,
        email: user.email,
      }))}
      templates={templates}
      bungalows={bungalows}
      permissions={permissions}
      currentUserId={auth.subject ?? null}
      query={query}
    />
  );
}
