import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authenticate } from "@/middleware/authn";
import { hasPermission } from "@/lib/rbac";
import { reservationStore } from "@/lib/reservations/store";
import { ReservationEditorForm } from "../../reservation-editor-form";
import { createReservationEditorValues } from "../../reservation-editor-values";

async function readReservationId(params: { id: string } | Promise<{ id: string }>): Promise<string> {
  const resolved = await params;
  return resolved.id;
}

export default async function EditReservationPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));
  const auth = await authenticate(
    new Request("http://localhost/admin/reservations/edit", { headers: requestHeaders }),
  );
  if (!auth.authenticated || !hasPermission(auth.roles, "reservation:write")) {
    notFound();
  }

  const id = await readReservationId(params);
  const reservation = await reservationStore.get(id);
  if (!reservation) {
    notFound();
  }

  const bungalows = await reservationStore.listBungalows();

  return (
    <ReservationEditorForm
      mode="edit"
      actionHref={`/api/reservations/${reservation.id}`}
      backHref={`/admin/reservations/${reservation.id}`}
      bungalows={bungalows}
      initialValues={createReservationEditorValues(reservation)}
      reservation={reservation}
    />
  );
}
