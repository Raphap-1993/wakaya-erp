import { notFound } from "next/navigation";
import { reservationStore } from "@/lib/reservations/store";
import { requireAdminPageAccess } from "@/app/admin/require-admin-page-access";
import { ReservationEditorForm } from "../../reservation-editor-form";
import { createReservationEditorValues } from "../../reservation-editor-values";

export const dynamic = "force-dynamic";

async function readReservationId(params: { id: string } | Promise<{ id: string }>): Promise<string> {
  const resolved = await params;
  return resolved.id;
}

export default async function EditReservationPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const id = await readReservationId(params);
  await requireAdminPageAccess(`/admin/reservations/${id}/edit`, "reservation:write");
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
