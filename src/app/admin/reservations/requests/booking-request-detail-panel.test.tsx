import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useRouterMock } = vi.hoisted(() => ({
  useRouterMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
}));

import { BookingRequestDetailPanel } from "./booking-request-detail-panel";

function createRequest() {
  return {
    id: "request-1",
    publicRef: "WR-2026-0001",
    status: "proof_received" as const,
    guestName: "Ada Lovelace",
    guestEmail: "ada@example.com",
    guestPhone: "+51987654321",
    requestedCheckIn: "2026-07-10",
    requestedCheckOut: "2026-07-12",
    requestedGuests: 2,
    requestedBungalowType: "bungalow-family",
    requestedExperienceId: "exp_02",
    sourceChannel: "web_public" as const,
    threadId: "thread-1",
    threadKey: "booking-request:WR-2026-0001",
    ownerUserId: "user-reception-1",
    ownerAssignedAt: "2026-07-01T09:10:00.000Z",
    notes: null,
    lastMessageAt: "2026-07-01T10:00:00.000Z",
    syncStatus: "pending" as const,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    threadMessages: [
      {
        id: "message-1",
        direction: "inbound",
        author: "Ada Lovelace",
        summary: "Adjunto comprobante",
        sentAt: "2026-07-01T10:00:00.000Z",
      },
    ],
    attachments: [
      {
        id: "attachment-1",
        name: "proof.pdf",
        meta: "PDF · 0.2 MB",
        status: "Recibido",
      },
    ],
    replyDraft: {
      subject: "Re: WR-2026-0001",
      bodyPreview: "Gracias por tu comprobante.",
      actionLabel: "Enviar respuesta",
    },
    syncDetail: {
      summary: "El hilo todavía no se sincroniza desde el proveedor de correo.",
      detail: "Todavía no hay un evento sincronizado.",
      actionLabel: "Sincronizar hilo",
    },
    conflicts: [
      {
        id: "conflict-1",
        title: "Conflicto OTA vs solicitud web",
        detail: "Existe una OTA confirmada en las mismas noches. Primero coordina con el cliente y luego reprograma.",
        href: "/admin/reservations/occupancy?date=2026-07-10",
      },
    ],
  };
}

describe("BookingRequestDetailPanel", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      refresh: vi.fn(),
    });
  });

  it("shows a read-only operational surface when the role cannot execute write or approval actions", () => {
    const html = renderToStaticMarkup(
      <BookingRequestDetailPanel
        request={createRequest()}
        bungalows={[]}
        permissions={{ canWrite: false, canAssign: false, canApprove: false }}
      />,
    );

    expect(html).toContain("Solo lectura");
    expect(html).toContain("Aprobación requerida");
    expect(html).not.toContain("Enviar respuesta");
    expect(html).not.toContain("Sincronizar hilo");
    expect(html).not.toContain("Marcar correo inicial enviado");
    expect(html).not.toContain("Marcar comprobante recibido");
    expect(html).not.toContain("Confirmar transferencia");
  });

  it("shows inbox and approval actions when the session has the required permissions", () => {
    const html = renderToStaticMarkup(
      <BookingRequestDetailPanel
        request={createRequest()}
        bungalows={[
          { id: "bungalow-suite", code: "SUITE", name: "Bungalow Doble", active: true, capacity: 2 },
          { id: "bungalow-family", code: "FAMILY", name: "Bungalow Familiar", active: true, capacity: 4 },
        ]}
        permissions={{ canWrite: true, canAssign: true, canApprove: true }}
      />,
    );

    expect(html).toContain("Responder por correo");
    expect(html).toContain("Sincronizar hilo");
    expect(html).toContain("Confirmar transferencia");
    expect(html).toContain("Cliente principal");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("+51987654321");
    expect(html).toContain("Datos personales");
    expect(html).toContain("Correo principal");
    expect(html).toContain("Bungalow solicitado");
    expect(html).toContain("Experiencia solicitada");
    expect(html).toContain("exp_02");
    expect(html).toContain("Operación");
    expect(html).toContain("Comunicación");
    expect(html).toContain("Conflictos");
    expect(html).toContain("Acciones rápidas");
    expect(html).toContain("Reprogramación operativa");
    expect(html).toContain("Guardar nueva propuesta");
    expect(html).toContain("Conversión operativa");
    expect(html).toContain("Atención inmediata");
    expect(html).toContain("Cliente impactado");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Conflicto crítico");
    expect(html).not.toContain("Hilo del cliente");
    expect(html).not.toContain("Adjuntos");
    expect(html).not.toContain("Reply operativo");
    expect(html).not.toContain("Sync de correo");
    expect(html).not.toContain("Conflictos operativos");
    expect(html).not.toContain("Asunto");
    expect(html).not.toContain("Motivo de confirmación");
    expect(html).not.toContain("Solo lectura");
  });
});
