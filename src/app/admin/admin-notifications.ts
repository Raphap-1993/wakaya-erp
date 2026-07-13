import type { BookingRequest, Reservation } from "@/lib/reservations/types";
import { reservationStore } from "@/lib/reservations/store";

export type AdminNotificationTone = "critical" | "warning" | "info";

export type AdminNotificationItem = {
  id: string;
  tone: AdminNotificationTone;
  title: string;
  detail: string;
  href: string;
  count: number;
};

export type AdminNotifications = {
  total: number;
  items: AdminNotificationItem[];
};

type RequestConflictEntry = {
  requestId: string;
  requestPublicRef: string;
  total: number;
};

function sameDay(left: string, right: string) {
  return left === right;
}

export function buildAdminNotifications(input: {
  reservations: Reservation[];
  bookingRequests: BookingRequest[];
  requestConflictEntries: RequestConflictEntry[];
  today: string;
}): AdminNotifications {
  const items: AdminNotificationItem[] = [];
  const degradedSync = input.bookingRequests.filter((item) => item.syncStatus === "degraded");
  const proofReceived = input.bookingRequests.filter((item) => item.status === "proof_received");
  const arrivalsToday = input.reservations.filter(
    (item) => (item.status === "confirmed" || item.status === "assigned") && sameDay(item.startDate, input.today),
  );
  const departuresToday = input.reservations.filter(
    (item) => item.status === "checked_in" && sameDay(item.endDate, input.today),
  );

  if (input.requestConflictEntries.length > 0) {
    const [firstConflict] = input.requestConflictEntries;
    items.push({
      id: "request-conflicts",
      tone: "critical",
      title: "Conflictos web vs OTA",
      detail:
        input.requestConflictEntries.length === 1
          ? `${firstConflict.requestPublicRef} quedó bloqueada por cruce de fechas con una reserva ya aprobada.`
          : `${input.requestConflictEntries.length} solicitudes web quedaron bloqueadas por cruces con reservas operativas.`,
      href: `/admin/reservations/requests/${firstConflict.requestId}`,
      count: input.requestConflictEntries.reduce((sum, item) => sum + item.total, 0),
    });
  }

  if (degradedSync.length > 0) {
    items.push({
      id: "degraded-sync",
      tone: "critical",
      title: "Sync degradado",
      detail:
        degradedSync.length === 1
          ? `${degradedSync[0].publicRef} necesita reconciliar el hilo con Zoho antes de seguir.`
          : `${degradedSync.length} solicitudes tienen el hilo de correo desalineado.`,
      href: "/admin/reservations/requests",
      count: degradedSync.length,
    });
  }

  if (proofReceived.length > 0) {
    items.push({
      id: "proof-received",
      tone: "warning",
      title: "Comprobantes por confirmar",
      detail:
        proofReceived.length === 1
          ? `${proofReceived[0].publicRef} ya tiene comprobante y espera confirmación manual.`
          : `${proofReceived.length} solicitudes web ya tienen comprobante y esperan conversión a reserva.`,
      href: "/admin/reservations/requests",
      count: proofReceived.length,
    });
  }

  if (arrivalsToday.length > 0) {
    items.push({
      id: "arrivals-today",
      tone: "info",
      title: "Check-in de hoy",
      detail:
        arrivalsToday.length === 1
          ? `${arrivalsToday[0].number} debe registrar ingreso hoy.`
          : `${arrivalsToday.length} reservas requieren check-in hoy.`,
      href: "/admin/reservations",
      count: arrivalsToday.length,
    });
  }

  if (departuresToday.length > 0) {
    items.push({
      id: "departures-today",
      tone: "info",
      title: "Check-out de hoy",
      detail:
        departuresToday.length === 1
          ? `${departuresToday[0].number} debe cerrar salida hoy.`
          : `${departuresToday.length} reservas requieren check-out hoy.`,
      href: "/admin/reservations",
      count: departuresToday.length,
    });
  }

  return {
    total: items.reduce((sum, item) => sum + item.count, 0),
    items,
  };
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function loadAdminNotifications(): Promise<AdminNotifications> {
  const [reservations, bookingRequests] = await Promise.all([
    reservationStore.list(),
    reservationStore.listBookingRequests(),
  ]);

  const requestViews = await Promise.all(
    bookingRequests.map(async (request) => ({
      requestId: request.id,
      requestPublicRef: request.publicRef,
      total: (await reservationStore.getBookingRequestThreadView(request.id))?.conflicts.length ?? 0,
    })),
  );

  return buildAdminNotifications({
    reservations,
    bookingRequests,
    requestConflictEntries: requestViews.filter((item) => item.total > 0),
    today: todayDate(),
  });
}
