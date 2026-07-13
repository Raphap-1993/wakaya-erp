import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  listReservationsMock,
  listBungalowsMock,
  createBookingRequestMock,
  recordBookingRequestMessageMock,
  transitionBookingRequestMock,
  buildInitialTransferEmailMock,
  queueOutboundEmailMock,
  sendTransactionalZohoEmailMock,
} = vi.hoisted(() => ({
  listReservationsMock: vi.fn(),
  listBungalowsMock: vi.fn(),
  createBookingRequestMock: vi.fn(),
  recordBookingRequestMessageMock: vi.fn(),
  transitionBookingRequestMock: vi.fn(),
  buildInitialTransferEmailMock: vi.fn(),
  queueOutboundEmailMock: vi.fn(),
  sendTransactionalZohoEmailMock: vi.fn(),
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    list: listReservationsMock,
    listBungalows: listBungalowsMock,
    createBookingRequest: createBookingRequestMock,
    recordBookingRequestMessage: recordBookingRequestMessageMock,
    transitionBookingRequest: transitionBookingRequestMock,
  },
}));

vi.mock("@/lib/mail/email-outbox", () => ({
  buildInitialTransferEmail: buildInitialTransferEmailMock,
  queueOutboundEmail: queueOutboundEmailMock,
}));

vi.mock("@/lib/mail/zoho-client", () => ({
  sendTransactionalZohoEmail: sendTransactionalZohoEmailMock,
}));

async function loadRoute() {
  return import("./route");
}

describe("POST /api/public/booking-requests email fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    listReservationsMock.mockReset();
    listBungalowsMock.mockReset();
    createBookingRequestMock.mockReset();
    recordBookingRequestMessageMock.mockReset();
    transitionBookingRequestMock.mockReset();
    buildInitialTransferEmailMock.mockReset();
    queueOutboundEmailMock.mockReset();
    sendTransactionalZohoEmailMock.mockReset();
    listBungalowsMock.mockResolvedValue([
      { id: "bungalow-suite", name: "Bungalow Doble", active: true, capacity: 2, code: "SUITE" },
      { id: "bungalow-matrimonial", name: "Bungalow Matrimonial", active: true, capacity: 2, code: "MATRIMONIAL" },
      { id: "bungalow-triple", name: "Bungalow Triple", active: true, capacity: 3, code: "TRIPLE" },
      { id: "bungalow-family", name: "Bungalow Familiar", active: true, capacity: 4, code: "FAMILY" },
    ]);
  });

  it("keeps the booking request recorded even when Zoho fails and downgrades delivery to queued", async () => {
    listReservationsMock.mockResolvedValue([]);
    createBookingRequestMock.mockResolvedValue({
      bookingRequest: {
        id: "request-123",
        publicRef: "WR-2026-0001",
        guestName: "Ada Lovelace",
        guestEmail: "ada@example.com",
        requestedCheckIn: "2026-07-10",
        requestedCheckOut: "2026-07-12",
      },
    });
    buildInitialTransferEmailMock.mockReturnValue({
      to: ["ada@example.com"],
      subject: "Solicitud WR-2026-0001",
      replyTo: "reservas@wakayaecolodge.com",
      text: "Hola Ada",
      html: "<p>Hola Ada</p>",
      idempotencyKey: "booking-request:WR-2026-0001:initial-email",
      threadKey: "booking-request:WR-2026-0001",
    });
    sendTransactionalZohoEmailMock.mockRejectedValue(new Error("initial_email_failed"));
    queueOutboundEmailMock.mockResolvedValue({ status: "queued" });
    recordBookingRequestMessageMock.mockResolvedValue({});
    transitionBookingRequestMock.mockResolvedValue({
      id: "request-123",
      publicRef: "WR-2026-0001",
      status: "awaiting_transfer",
    });

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/public/booking-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestName: "Ada Lovelace",
          guestEmail: "ada@example.com",
          guestPhone: "+51987654321",
          requestedCheckIn: "2026-07-10",
          requestedCheckOut: "2026-07-12",
          requestedGuests: 2,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(queueOutboundEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedEntityId: "request-123",
        delivery: {
          status: "queued_without_provider",
          provider: "none",
          providerMessageId: null,
          providerThreadId: null,
          sentAt: null,
        },
      }),
    );
    expect(recordBookingRequestMessageMock).toHaveBeenCalledWith(
      "request-123",
      expect.objectContaining({
        origin: "system_outbound",
        providerMessageId: null,
      }),
    );
    expect(transitionBookingRequestMock).toHaveBeenCalledWith("request-123", {
      action: "mark_initial_email_sent",
      actorId: "system",
      reason: "initial transfer instructions queued to outbound mail",
    });
    await expect(response.json()).resolves.toMatchObject({
      bookingRequest: {
        id: "request-123",
        publicRef: "WR-2026-0001",
        status: "awaiting_transfer",
      },
      email: { status: "queued" },
      delivery: {
        status: "queued_without_provider",
        provider: "none",
        providerMessageId: null,
      },
    });
  });

  it("rejects the request with alternatives when the requested type is sold out", async () => {
    listReservationsMock.mockResolvedValue(
      Array.from({ length: 5 }, (_, index) => ({
        id: `reservation-${index + 1}`,
        number: `RES-000${index + 1}`,
        channel: "web",
        status: "assigned",
        bungalowId: "bungalow-suite",
        sourceRequestId: `request-${index + 1}`,
        responsibleId: `user-${index + 1}`,
        startDate: "2026-07-14",
        endDate: "2026-07-16",
        amountTotalCents: 0,
        amountPaidCents: 0,
        paymentStatus: "pending",
        currencyCode: "PEN",
        updatedAt: "2026-07-09T21:00:00.000Z",
        bungalow: null,
      })),
    );

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/public/booking-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestName: "Hugo",
          guestEmail: "hugo@example.com",
          guestPhone: "+51987654321",
          requestedCheckIn: "2026-07-14",
          requestedCheckOut: "2026-07-16",
          requestedGuests: 2,
          requestedBungalowType: "bungalow-suite",
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(createBookingRequestMock).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body.error).toBe("bungalow_type_unavailable");
    expect(body.alternatives).toEqual([
      expect.objectContaining({ bungalowTypeId: "bungalow-matrimonial" }),
      expect.objectContaining({ bungalowTypeId: "bungalow-triple" }),
      expect.objectContaining({ bungalowTypeId: "bungalow-family" }),
    ]);
    expect(body.alternativeDates).toContainEqual(
      expect.objectContaining({ checkIn: "2026-07-16", checkOut: "2026-07-18" }),
    );
  });
});
