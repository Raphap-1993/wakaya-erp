import { beforeEach, describe, expect, it, vi } from "vitest";

const { listReservationsMock, listBungalowsMock } = vi.hoisted(() => ({
  listReservationsMock: vi.fn(),
  listBungalowsMock: vi.fn(),
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    list: listReservationsMock,
    listBungalows: listBungalowsMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("POST /api/public/availability", () => {
  beforeEach(() => {
    vi.resetModules();
    listReservationsMock.mockReset();
    listBungalowsMock.mockReset();
    listBungalowsMock.mockResolvedValue([
      { id: "bungalow-suite", name: "Bungalow Doble", active: true, capacity: 2, code: "SUITE" },
      { id: "bungalow-matrimonial", name: "Bungalow Matrimonial", active: true, capacity: 2, code: "MATRIMONIAL" },
      { id: "bungalow-individual", name: "Bungalow Individual", active: true, capacity: 1, code: "INDIVIDUAL" },
      { id: "bungalow-triple", name: "Bungalow Triple", active: true, capacity: 3, code: "TRIPLE" },
      { id: "bungalow-family", name: "Bungalow Familiar", active: true, capacity: 4, code: "FAMILY" },
    ]);
  });

  it("returns an aggregate available count without exposing physical unit ids", async () => {
    listReservationsMock.mockResolvedValue([
      {
        id: "reservation-double-1",
        number: "RES-4001",
        channel: "web",
        status: "assigned",
        bungalowId: "bungalow-suite",
        sourceRequestId: "request-double-1",
        responsibleId: "user-double-1",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
        amountTotalCents: 0,
        amountPaidCents: 0,
        paymentStatus: "pending",
        currencyCode: "PEN",
        updatedAt: "2026-07-10T00:00:00.000Z",
        bungalow: null,
      },
    ]);

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/public/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowTypeId: "bungalow-suite",
          checkIn: "2026-08-10",
          checkOut: "2026-08-12",
          guests: 2,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      available: true,
      bungalowTypeId: "bungalow-suite",
      availableUnitCount: 1,
      alternatives: [],
      alternativeDates: [],
    });
    expect(JSON.stringify(body)).not.toContain("unit_");
    expect(JSON.stringify(body)).not.toContain("DOB-");
  });

  it("returns sold-out alternatives and later ranges when no unit remains", async () => {
    listReservationsMock.mockResolvedValue(
      Array.from({ length: 2 }, (_, index) => ({
        id: `reservation-double-${index + 1}`,
        number: `RES-50${index + 1}`,
        channel: "web",
        status: "assigned",
        bungalowId: "bungalow-suite",
        sourceRequestId: `request-double-${index + 1}`,
        responsibleId: `user-double-${index + 1}`,
        startDate: "2026-08-10",
        endDate: "2026-08-12",
        amountTotalCents: 0,
        amountPaidCents: 0,
        paymentStatus: "pending",
        currencyCode: "PEN",
        updatedAt: "2026-07-10T00:00:00.000Z",
        bungalow: null,
      })),
    );

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/public/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowTypeId: "bungalow-suite",
          checkIn: "2026-08-10",
          checkOut: "2026-08-12",
          guests: 2,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      available: false,
      bungalowTypeId: "bungalow-suite",
      availableUnitCount: 0,
      alternatives: [
        {
          bungalowTypeId: "bungalow-matrimonial",
          displayName: "Bungalow Matrimonial",
          capacity: 2,
          availableUnitCount: 4,
        },
        {
          bungalowTypeId: "bungalow-triple",
          displayName: "Bungalow Triple",
          capacity: 3,
          availableUnitCount: 1,
        },
        {
          bungalowTypeId: "bungalow-family",
          displayName: "Bungalow Familiar",
          capacity: 4,
          availableUnitCount: 5,
        },
      ],
      alternativeDates: [
        { checkIn: "2026-08-12", checkOut: "2026-08-14", availableUnitCount: 2 },
        { checkIn: "2026-08-13", checkOut: "2026-08-15", availableUnitCount: 2 },
        { checkIn: "2026-08-14", checkOut: "2026-08-16", availableUnitCount: 2 },
      ],
    });
  });
});
