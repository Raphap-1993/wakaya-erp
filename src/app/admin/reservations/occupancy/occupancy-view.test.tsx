import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReservationListItem } from "@/lib/reservations/store";
import type { ReservationAudit } from "@/lib/reservations/types";
import { reservationStore } from "@/lib/reservations/store";
import type { BookingRequestMonitorItem } from "../requests/booking-request-monitor-presentation";
import { OccupancySelectionDialog } from "./occupancy-selection-dialog";

const { useRouterMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
}));

import OccupancyView from "./occupancy-view";

function makeReservation(overrides: Partial<ReservationListItem>): ReservationListItem {
  return {
    id: overrides.id ?? "reservation-test",
    number: overrides.number ?? "RESERVATION-TEST-0001",
    channel: overrides.channel ?? "web",
    status: overrides.status ?? "paid",
    paymentStatus: overrides.paymentStatus ?? "paid",
    amountTotalCents: overrides.amountTotalCents ?? 12000,
    amountPaidCents: overrides.amountPaidCents ?? 12000,
    currencyCode: "PEN",
    bungalowId: overrides.bungalowId ?? "bungalow-suite",
    responsibleId: overrides.responsibleId ?? "guest-1",
    startDate: overrides.startDate ?? "2026-06-11",
    endDate: overrides.endDate ?? "2026-06-12",
    updatedAt: overrides.updatedAt ?? "2026-06-01T00:00:00.000Z",
    sourceRequestId: overrides.sourceRequestId ?? null,
    bungalow: overrides.bungalow ?? null,
  };
}

describe("OccupancyView", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
  });

  it("renders a compact occupancy toolbar above the grid", async () => {
    const items = [
      makeReservation({
        id: "reservation-paid-1",
        number: "RESERVATION-PAID-1",
        bungalowId: "bungalow-suite",
        status: "paid",
        paymentStatus: "paid",
        startDate: "2026-06-11",
        endDate: "2026-06-12",
      }),
      makeReservation({
        id: "reservation-attention-1",
        number: "RESERVATION-ATTN-1",
        bungalowId: "bungalow-family",
        status: "pending_review",
        paymentStatus: "pending",
        startDate: "2026-06-13",
        endDate: "2026-06-13",
      }),
      makeReservation({
        id: "reservation-blocked-1",
        number: "RESERVATION-BLOCK-1",
        bungalowId: "bungalow-matrimonial",
        status: "paid",
        paymentStatus: "paid",
        startDate: "2026-06-14",
        endDate: "2026-06-14",
      }),
      makeReservation({
        id: "reservation-blocked-2",
        number: "RESERVATION-BLOCK-2",
        bungalowId: "bungalow-matrimonial",
        status: "confirmed",
        paymentStatus: "paid",
        startDate: "2026-06-14",
        endDate: "2026-06-14",
      }),
    ];

    const auditsByReservationId: Record<string, ReservationAudit[]> = {
      "reservation-paid-1": [
        {
          id: "audit-1",
          reservationId: "reservation-paid-1",
          actorId: "system",
          action: "create",
          previousStatus: "paid",
          nextStatus: "paid",
          reason: "Ingreso inicial",
          createdAt: "2026-06-01T12:00:00.000Z",
        },
      ],
    };

    const html = renderToStaticMarkup(
      <OccupancyView
        items={items}
        bungalows={await reservationStore.listBungalows()}
        query={{
          week: "2026-W24",
          date: "2026-06-11",
          selected: "reservation-paid-1",
          view: "occupancy",
        }}
        auditsByReservationId={auditsByReservationId}
        linkedRequestsByReservationId={{}}
        weeklyRequestConflicts={[]}
        permissions={{ canWrite: true, canAssign: true, canApprove: true }}
      />,
    );

    expect(html).toContain("Ocupación semanal");
    expect(html).toContain("RESERVATION-PAID-1");
    expect(html).toContain("Bungalow Doble");
    expect(html).toContain("Semana anterior");
    expect(html).toContain("Semana actual");
    expect(html).toContain("Semana siguiente");
    expect(html).toContain("Conflictos activos");
    expect(html).toContain("1");
    expect(html).toContain('href="/admin/reservations/occupancy?date=2026-06-01&amp;view=occupancy&amp;week=2026-W23"');
    expect(html).toContain('href="/admin/reservations/occupancy?date=2026-06-15&amp;view=occupancy&amp;week=2026-W25"');
    expect(html).toContain("Ocupado");
    expect(html).toContain("Libre");
    expect(html).toContain("Atención");
    expect(html).toContain("Conflicto");
    expect(html).toContain("Asignar o crear");
    expect(html).not.toContain("Selección activa");
    expect(html).not.toContain("Ver reserva");
    expect(html).not.toContain("Abrir resumen");
    expect(html).not.toContain("Confirmar reserva");
    expect(html).not.toContain("Registrar pago");
    expect(html).not.toContain("Auditoría reciente");
    expect(html).not.toContain("Ingreso inicial");
    expect(html).not.toContain("Semana activa");
    expect(html).not.toContain("Fecha ancla");
    expect(html).not.toContain("Contexto activo");
    expect(html).not.toContain("Navegación temporal");
    expect(html).not.toContain("Semanas de junio de 2026");
    expect(html).not.toContain("Superficies operativas");
    expect(html).not.toContain("Abrir agenda operativa");
    expect(html).not.toContain("Roster de flujos");
    expect(html).not.toContain("Mes -");
    expect(html).not.toContain("Sem -");
    expect(html).not.toContain("Sem +");
    expect(html).not.toContain("Mes +");
    expect(html).not.toContain(">W23<");
    expect(html).not.toContain(">W24<");
    expect(html).not.toContain(">W25<");
    expect(html).not.toContain(">W26<");
    expect(html).not.toContain(">W27<");
  });

  it("keeps conflict context in the main metric and leaves the resolution inside the modal", async () => {
    const items = [
      makeReservation({
        id: "reservation-blocked-1",
        number: "RESERVATION-BLOCK-1",
        bungalowId: "bungalow-matrimonial",
        status: "paid",
        paymentStatus: "paid",
        startDate: "2026-06-14",
        endDate: "2026-06-14",
      }),
      makeReservation({
        id: "reservation-blocked-2",
        number: "RESERVATION-BLOCK-2",
        bungalowId: "bungalow-matrimonial",
        status: "confirmed",
        paymentStatus: "paid",
        startDate: "2026-06-14",
        endDate: "2026-06-14",
      }),
    ];

    const html = renderToStaticMarkup(
      <OccupancyView
        items={items}
        bungalows={await reservationStore.listBungalows()}
        query={{
          week: "2026-W24",
          date: "2026-06-14",
          selected: "reservation-blocked-1",
          view: "occupancy",
        }}
        auditsByReservationId={{}}
        linkedRequestsByReservationId={{}}
        weeklyRequestConflicts={[]}
        permissions={{ canWrite: true, canAssign: true, canApprove: true }}
      />,
    );

    expect(html).toContain("Conflicto");
    expect(html).toContain("2 reservas");
    expect(html).toContain("Conflictos activos");
    expect(html).toContain("Atención inmediata");
    expect(html).toContain("2026-06-14");
    expect(html).toContain("RESERVATION-BLOCK-1");
    expect(html).not.toContain("Conflicto operativo");
    expect(html).not.toContain("Abrir la celda para revisar alternativas");
    expect(html).not.toContain("Ver reserva");
  });

  it("renders the conflict modal as an operational resolution surface", async () => {
    const conflictingReservations = [
      makeReservation({
        id: "reservation-blocked-1",
        number: "RESERVATION-BLOCK-1",
        bungalowId: "bungalow-matrimonial",
        channel: "ota",
        status: "ota_imported_confirmed",
        paymentStatus: "pending",
        startDate: "2026-06-14",
        endDate: "2026-06-14",
      }),
      makeReservation({
        id: "reservation-blocked-2",
        number: "RESERVATION-BLOCK-2",
        bungalowId: "bungalow-matrimonial",
        status: "confirmed",
        paymentStatus: "partial",
        amountTotalCents: 18000,
        amountPaidCents: 6000,
        startDate: "2026-06-14",
        endDate: "2026-06-14",
      }),
    ];

    const html = renderToStaticMarkup(
      <OccupancySelectionDialog
        reservation={conflictingReservations[0]}
        reservationsInCell={conflictingReservations}
        bungalow={(await reservationStore.listBungalows()).find((item) => item.id === "bungalow-matrimonial") ?? null}
        bungalows={await reservationStore.listBungalows()}
        permissions={{ canWrite: true, canAssign: true, canApprove: true }}
        candidateReservations={[]}
        weekLabel="2026-W24"
        selectedDay="2026-06-14"
        selectedCellState="blocked"
        linkedRequestsByReservationId={{}}
        onClose={() => {}}
      />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain("Resolución operativa");
    expect(html).toContain("Conflicto operativo");
    expect(html).toContain("Guía de resolución");
    expect(html).toContain("Qué hacer ahora");
    expect(html).toContain("Paso 1");
    expect(html).toContain("Paso 2");
    expect(html).toContain("Paso 3");
    expect(html).toContain("Reserva que se queda");
    expect(html).toContain("Reserva a mover");
    expect(html).toContain("Alternativas activas");
    expect(html).toContain("Ver ficha completa");
    expect(html).toContain("Abrir agenda");
    expect(html).toContain("Ancla sugerida");
    expect(html).toContain("Mover primero");
    expect(html).toContain("Guardar reprogramación");
    expect(html).toContain("RESERVATION-BLOCK-1");
    expect(html).toContain("RESERVATION-BLOCK-2");
    expect(html).not.toContain("Responsable:");
    expect(html).not.toContain("Auditoría reciente");
    expect(html).not.toContain("Registrar pago");
  });

  it("renders quick assignment options when the selected cell is free", async () => {
    const candidates = [
      makeReservation({
        id: "reservation-free-1",
        number: "RESERVATION-FREE-1",
        bungalowId: null,
        status: "confirmed",
        paymentStatus: "paid",
        startDate: "2026-06-11",
        endDate: "2026-06-12",
      }),
    ];

    const html = renderToStaticMarkup(
      <OccupancySelectionDialog
        reservation={null}
        reservationsInCell={[]}
        bungalow={(await reservationStore.listBungalows()).find((item) => item.id === "bungalow-suite") ?? null}
        bungalows={await reservationStore.listBungalows()}
        permissions={{ canWrite: true, canAssign: true, canApprove: true }}
        candidateReservations={candidates}
        weekLabel="2026-W24"
        selectedDay="2026-06-11"
        selectedCellState="free"
        linkedRequestsByReservationId={{}}
        onClose={() => {}}
      />,
    );

    expect(html).toContain("Asignar reserva existente");
    expect(html).toContain("RESERVATION-FREE-1");
    expect(html).toContain("Asignar aquí");
    expect(html).toContain("Crear reserva aquí");
    expect(html).toContain("bungalowId=bungalow-suite");
    expect(html).toContain("startDate=2026-06-11");
    expect(html).toContain("endDate=2026-06-11");
  });

  it("renders client thread controls when a conflicting reservation comes from web", async () => {
    const conflictingReservation = makeReservation({
      id: "reservation-web-1",
      number: "RESERVATION-WEB-1",
      bungalowId: "bungalow-suite",
      status: "confirmed",
      paymentStatus: "partial",
      amountTotalCents: 24000,
      amountPaidCents: 12000,
      startDate: "2026-06-14",
      endDate: "2026-06-15",
      sourceRequestId: "request-web-1",
    });
    const linkedRequest: BookingRequestMonitorItem = {
      id: "request-web-1",
      publicRef: "WR-2026-0101",
      status: "needs_attention",
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      guestPhone: "+51 999 111 222",
      requestedCheckIn: "2026-06-14",
      requestedCheckOut: "2026-06-15",
      requestedGuests: 2,
      requestedBungalowType: "bungalow-suite",
      sourceChannel: "web_public",
      threadId: "thread-1",
      threadKey: "booking-request:WR-2026-0101",
      ownerUserId: "user-reception-1",
      ownerAssignedAt: "2026-06-10T09:00:00.000Z",
      notes: null,
      lastMessageAt: "2026-06-10T10:00:00.000Z",
      syncStatus: "degraded",
      createdAt: "2026-06-09T10:00:00.000Z",
      updatedAt: "2026-06-10T10:00:00.000Z",
      threadLabel: "thread-1",
      threadMessages: [
        {
          id: "message-1",
          direction: "inbound",
          author: "ada@example.com",
          summary: "Podemos mover la llegada al domingo si ya no hay cupo el sábado.",
          sentAt: "2026-06-10T10:00:00.000Z",
        },
      ],
      attachments: [
        {
          id: "attachment-1",
          name: "voucher.jpg",
          meta: "Imagen · 1.2 MB",
          status: "Recibido",
          contentType: "image/jpeg",
          kind: "image" as const,
          previewHref: "/api/booking-requests/request-1/attachments/attachment-1",
        },
      ],
      replyDraft: {
        subject: "Re: WR-2026-0101",
        bodyPreview: "Podemos ayudarte a reprogramar la reserva.",
        actionLabel: "Enviar respuesta",
      },
      syncDetail: {
        summary: "El hilo existe pero todavía requiere conciliación operativa.",
        detail: "Última sincronización: 2026-06-10T10:00:00.000Z.",
        actionLabel: "Sincronizar hilo",
      },
      conflicts: [
        {
          id: "conflict-1",
          title: "Choque de fechas con reserva existente",
          detail: "Existe una OTA confirmada sobre las mismas noches.",
          href: "/admin/reservations/occupancy?date=2026-06-14",
        },
      ],
    };
    const otaReservation = makeReservation({
      id: "reservation-ota-1",
      number: "RESERVATION-OTA-1",
      bungalowId: "bungalow-suite",
      channel: "ota",
      status: "ota_imported_confirmed",
      paymentStatus: "pending",
      amountTotalCents: 24000,
      amountPaidCents: 0,
      startDate: "2026-06-14",
      endDate: "2026-06-15",
    });

    const html = renderToStaticMarkup(
      <OccupancySelectionDialog
        reservation={conflictingReservation}
        reservationsInCell={[otaReservation, conflictingReservation]}
        bungalow={(await reservationStore.listBungalows()).find((item) => item.id === "bungalow-suite") ?? null}
        bungalows={await reservationStore.listBungalows()}
        permissions={{ canWrite: true, canAssign: true, canApprove: true }}
        candidateReservations={[]}
        weekLabel="2026-W24"
        selectedDay="2026-06-14"
        selectedCellState="blocked"
        linkedRequestsByReservationId={{ "reservation-web-1": linkedRequest }}
        onClose={() => {}}
      />,
    );

    expect(html).toContain("Guía de resolución");
    expect(html).toContain("Mantener OTA y mover web");
    expect(html).toContain("Qué hacer ahora");
    expect(html).toContain("Abrir contacto cliente");
    expect(html).toContain("Cliente a contactar");
    expect(html).toContain("Contacto cliente");
    expect(html).toContain("WR-2026-0101");
    expect(html).toContain("ada@example.com");
    expect(html).toContain("Cliente: Ada Lovelace");
    expect(html).toContain("Editar fechas");
    expect(html).toContain("Ver hilo completo");
    expect(html).toContain("Responder al cliente");
    expect(html).toContain("Sincronizar hilo");
    expect(html).toContain("Guardar cambio y reflejar en WR-2026-0101");
  });

  it("renders web request conflicts in the weekly rail", async () => {
    const linkedRequest: BookingRequestMonitorItem = {
      id: "request-web-2",
      publicRef: "WR-2026-0202",
      status: "proof_received",
      guestName: "Grace Hopper",
      guestEmail: "grace@example.com",
      guestPhone: null,
      requestedCheckIn: "2026-06-12",
      requestedCheckOut: "2026-06-14",
      requestedGuests: 2,
      requestedBungalowType: "bungalow-family",
      sourceChannel: "web_public",
      threadId: "thread-2",
      threadKey: "booking-request:WR-2026-0202",
      ownerUserId: null,
      ownerAssignedAt: null,
      notes: null,
      lastMessageAt: "2026-06-11T11:00:00.000Z",
      syncStatus: "synced",
      createdAt: "2026-06-10T11:00:00.000Z",
      updatedAt: "2026-06-11T11:00:00.000Z",
      threadLabel: "thread-2",
      threadMessages: [],
      attachments: [],
      replyDraft: {
        subject: "Re: WR-2026-0202",
        bodyPreview: "Estamos revisando tu solicitud.",
        actionLabel: "Enviar respuesta",
      },
      syncDetail: {
        summary: "El hilo está alineado con el inbox operativo.",
        detail: "Última sincronización: 2026-06-11T11:00:00.000Z.",
        actionLabel: "Re-sincronizar",
      },
      conflicts: [
        {
          id: "conflict-2",
          title: "Choque de fechas con reserva existente",
          detail: "Existe una reserva ya confirmada sobre estas noches.",
          href: "/admin/reservations/occupancy?date=2026-06-12",
        },
      ],
    };

    const html = renderToStaticMarkup(
      <OccupancyView
        items={[]}
        bungalows={await reservationStore.listBungalows()}
        query={{
          week: "2026-W24",
          date: "2026-06-12",
          selected: "bungalow-suite:2026-06-12",
          view: "occupancy",
        }}
        auditsByReservationId={{}}
        linkedRequestsByReservationId={{}}
        weeklyRequestConflicts={[linkedRequest]}
        permissions={{ canWrite: true, canAssign: true, canApprove: true }}
      />,
    );

    expect(html).toContain("WR-2026-0202");
    expect(html).toContain("Solicitud web");
    expect(html).toContain("Grace Hopper");
    expect(html).toContain("/admin/reservations/requests/request-web-2");
  });
});
