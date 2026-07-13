import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPoolMock, getReservationDatabaseUrlMock, queryMock } = vi.hoisted(() => {
  const queryMock = vi.fn();

  return {
    queryMock,
    getPoolMock: vi.fn(() => ({ query: queryMock })),
    getReservationDatabaseUrlMock: vi.fn(),
  };
});

vi.mock("@/lib/reservations/postgres", () => ({
  getPool: getPoolMock,
  getReservationDatabaseUrl: getReservationDatabaseUrlMock,
}));

import { buildInitialTransferEmail, queueOutboundEmail } from "@/lib/mail/email-outbox";

describe("initial transfer email", () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rowCount: 1, rows: [] });
    getReservationDatabaseUrlMock.mockReset();
    getReservationDatabaseUrlMock.mockReturnValue("postgres://wakaya");
    getPoolMock.mockClear();
  });

  it("uses reservas@wakayaecolodge.com as reply context", () => {
    const email = buildInitialTransferEmail({
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
      publicRef: "WR-2026-0001",
      requestedCheckIn: "2026-07-10",
      requestedCheckOut: "2026-07-12",
    });

    expect(email.to).toEqual(["ada@example.com"]);
    expect(email.replyTo).toBe("reservas@wakayaecolodge.com");
    expect(email.subject).toBe("Solicitud WR-2026-0001 · recibida por Reservas Wakaya");
    expect(email.threadKey).toBe("booking-request:WR-2026-0001");
    expect(email.text).toContain("Nuestro equipo de reservas ya está revisando tu solicitud");
    expect(email.text).toContain("Check-in: 2026-07-10");
    expect(email.text).toContain("Check-out: 2026-07-12");
    expect(email.text).not.toContain("instrucciones de transferencia");
    expect(email.html).toContain("Reservas Wakaya");
    expect(email.html).toContain("Estamos revisando tu solicitud");
    expect(email.html).toContain("WR-2026-0001");
    expect(email.text).toContain("+51 961 508 813");
    expect(email.text).toContain("+51 977 419 468");
    expect(email.html).not.toContain("+51 963 847 291");
    expect(email.html).not.toContain("instrucciones de transferencia");
  });

  it("persists provider delivery details without changing the queued return contract", async () => {
    const result = await queueOutboundEmail({
      eventType: "booking_request.initial_transfer_instructions",
      linkedEntityType: "booking_request",
      linkedEntityId: "request-1",
      message: {
        to: ["ada@example.com"],
        subject: "Solicitud WR-2026-0001",
        html: "<p>Hola</p>",
        text: "Hola",
        replyTo: "reservas@wakayaecolodge.com",
        idempotencyKey: "booking-request:WR-2026-0001:initial-email",
        threadKey: "booking-request:WR-2026-0001",
        attachments: [
          {
            filename: "transfer-proof.pdf",
            content: "ZmFrZQ==",
            contentType: "application/pdf",
          },
        ],
      },
      delivery: {
        status: "sent",
        provider: "zoho_mail",
        providerMessageId: "email_123",
      },
    });

    expect(result).toEqual({ status: "queued" });
    expect(queryMock).toHaveBeenCalledTimes(1);

    const [sql, values] = queryMock.mock.calls[0] as [string, unknown[]];
    const payload = JSON.parse(String(values[6])) as {
      delivery?: { provider: string; providerMessageId: string | null; status: string };
      threadKey?: string;
    };

    expect(sql).toContain("status = excluded.status");
    expect(values[5]).toBe("sent");
    expect(payload.threadKey).toBe("booking-request:WR-2026-0001");
    expect(payload.delivery).toEqual({
      status: "sent",
      provider: "zoho_mail",
      providerMessageId: "email_123",
    });
  });
});
