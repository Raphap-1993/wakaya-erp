import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/reservations/store")>();
  return {
    ...actual,
    reservationStore: new actual.ReservationStore({
      reservations: [
        {
          id: "reservation-demo-1",
          number: "RESERVATION-2026-0001",
          channel: "web",
          status: "pending_review",
          amountTotalCents: 36000,
          amountPaidCents: 0,
          paymentStatus: "pending",
          bungalowId: "bungalow-suite",
          responsibleId: "user-reception-1",
          startDate: "2026-06-12",
          endDate: "2026-06-14",
          updatedAt: "2026-05-29T00:00:00.000Z",
        },
        {
          id: "reservation-demo-2",
          number: "RESERVATION-2026-0002",
          channel: "ota",
          status: "ota_imported_confirmed",
          amountTotalCents: 24000,
          amountPaidCents: 24000,
          paymentStatus: "paid",
          bungalowId: "bungalow-family",
          responsibleId: "user-reception-2",
          startDate: "2026-06-15",
          endDate: "2026-06-16",
          updatedAt: "2026-05-29T00:00:00.000Z",
        },
        {
          id: "reservation-demo-3",
          number: "RESERVATION-2026-0003",
          channel: "ota",
          status: "checked_in",
          amountTotalCents: 48000,
          amountPaidCents: 12000,
          paymentStatus: "partial",
          bungalowId: "bungalow-matrimonial",
          responsibleId: "user-reception-3",
          startDate: "2026-06-17",
          endDate: "2026-06-19",
          updatedAt: "2026-05-29T00:00:00.000Z",
        },
      ],
      occupancies: [
        {
          id: "occupancy-demo-1",
          reservationId: "reservation-demo-1",
          bungalowId: "bungalow-suite",
          date: "2026-06-12",
          source: "web",
          status: "provisional",
          createdAt: "2026-05-29T00:00:00.000Z",
        },
        {
          id: "occupancy-demo-2",
          reservationId: "reservation-demo-1",
          bungalowId: "bungalow-suite",
          date: "2026-06-13",
          source: "web",
          status: "provisional",
          createdAt: "2026-05-29T00:00:00.000Z",
        },
        {
          id: "occupancy-demo-3",
          reservationId: "reservation-demo-1",
          bungalowId: "bungalow-suite",
          date: "2026-06-14",
          source: "web",
          status: "provisional",
          createdAt: "2026-05-29T00:00:00.000Z",
        },
        {
          id: "occupancy-demo-4",
          reservationId: "reservation-demo-2",
          bungalowId: "bungalow-family",
          date: "2026-06-15",
          source: "ota",
          status: "confirmed",
          createdAt: "2026-05-29T00:00:00.000Z",
        },
        {
          id: "occupancy-demo-5",
          reservationId: "reservation-demo-2",
          bungalowId: "bungalow-family",
          date: "2026-06-16",
          source: "ota",
          status: "confirmed",
          createdAt: "2026-05-29T00:00:00.000Z",
        },
        {
          id: "occupancy-demo-6",
          reservationId: "reservation-demo-3",
          bungalowId: "bungalow-matrimonial",
          date: "2026-06-17",
          source: "ota",
          status: "confirmed",
          createdAt: "2026-05-29T00:00:00.000Z",
        },
        {
          id: "occupancy-demo-7",
          reservationId: "reservation-demo-3",
          bungalowId: "bungalow-matrimonial",
          date: "2026-06-18",
          source: "ota",
          status: "confirmed",
          createdAt: "2026-05-29T00:00:00.000Z",
        },
        {
          id: "occupancy-demo-8",
          reservationId: "reservation-demo-3",
          bungalowId: "bungalow-matrimonial",
          date: "2026-06-19",
          source: "ota",
          status: "confirmed",
          createdAt: "2026-05-29T00:00:00.000Z",
        },
      ],
    }),
  };
});

async function loadRoute() {
  requirePermissionMock.mockResolvedValue({
    authenticated: true,
    roles: ["admin"],
    subject: "user-admin-1",
  });
  return import("./route");
}

describe("GET /api/reservations", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("returns the reservations list", async () => {
    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/reservations"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(3);
    expect(body.items).toHaveLength(3);
    expect(body.items[0]).toHaveProperty("bungalow");
  });

  it("filters reservations by date overlap", async () => {
    const { GET } = await loadRoute();
    const response = await GET(
      new Request("http://localhost/api/reservations?date=2026-06-15"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe("reservation-demo-2");
  });

  it("filters reservations by date range overlap", async () => {
    const { GET } = await loadRoute();
    const response = await GET(
      new Request("http://localhost/api/reservations?startDate=2026-06-13&endDate=2026-06-15"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.items).toHaveLength(2);
  });
});

describe("POST /api/reservations", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("creates a reservation and blocks provisional occupancy", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          number: "RESERVATION-2026-0200",
          channel: "web",
          bungalowId: "bungalow-matrimonial",
          responsibleId: "user-reception-3",
          startDate: "2026-07-20",
          endDate: "2026-07-21",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.reservation.status).toBe("pending_review");
    expect(body.occupancy).toHaveLength(2);
  });

  it("rejects an invalid reservation payload", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          number: "",
          channel: "web",
          bungalowId: "",
          startDate: "2026-07-20",
          endDate: "2026-07-19",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_payload");
  });
});
