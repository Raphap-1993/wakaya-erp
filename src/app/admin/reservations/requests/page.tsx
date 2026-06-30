import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { reservationStore } from "@/lib/reservations/store";
import { hasPermission } from "@/lib/rbac";
import { authenticate } from "@/middleware/authn";
import { BookingRequestsMonitor } from "./booking-requests-monitor";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function getSingleValue(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export default async function RequestsAdminPage({ searchParams }: PageProps) {
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));
  const auth = await authenticate(new Request("http://localhost/admin/reservations/requests", { headers: requestHeaders }));
  if (!auth.authenticated || !hasPermission(auth.roles, "reservation:read")) {
    notFound();
  }

  const resolvedSearchParams =
    searchParams instanceof Promise ? await searchParams : (searchParams ?? {});
  const items = await reservationStore.listBookingRequests();
  const selectedId = getSingleValue(resolvedSearchParams.selected) ?? items[0]?.id ?? null;

  return <BookingRequestsMonitor items={items} selectedId={selectedId} />;
}
