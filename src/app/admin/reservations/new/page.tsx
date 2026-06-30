import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authenticate } from "@/middleware/authn";
import { hasPermission } from "@/lib/rbac";
import { nextReservationNumber } from "@/lib/reservations/numbering";
import { reservationStore } from "@/lib/reservations/store";
import { ReservationEditorForm } from "../reservation-editor-form";
import { createReservationEditorValues } from "../reservation-editor-values";

export default async function NewReservationPage() {
  const requestHeaders = new Headers();
  const currentHeaders = await headers();
  currentHeaders.forEach((value, key) => requestHeaders.set(key, value));
  const auth = await authenticate(new Request("http://localhost/admin/reservations/new", { headers: requestHeaders }));
  if (!auth.authenticated || !hasPermission(auth.roles, "reservation:write")) {
    notFound();
  }

  const [bungalows, reservations] = await Promise.all([
    reservationStore.listBungalows(),
    reservationStore.list(),
  ]);
  const initialValues = {
    ...createReservationEditorValues(),
    number: nextReservationNumber(reservations),
  };

  return (
    <ReservationEditorForm
      mode="create"
      actionHref="/api/reservations"
      backHref="/admin/reservations"
      bungalows={bungalows}
      initialValues={initialValues}
    />
  );
}
