import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, listCapacitiesMock, listReservationsMock, listBungalowsMock } =
  vi.hoisted(() => ({
    requirePermissionMock: vi.fn(),
    listCapacitiesMock: vi.fn(),
    listReservationsMock: vi.fn(),
    listBungalowsMock: vi.fn(),
  }));

vi.mock("@/middleware/authn", () => ({ requirePermission: requirePermissionMock }));
vi.mock("@/lib/bungalow-capacity/store", () => ({
  bungalowCapacityStore: {
    listCapacities: listCapacitiesMock,
  },
}));
vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    list: listReservationsMock,
    listBungalows: listBungalowsMock,
  },
}));

describe("GET /api/admin/bungalow-capacity", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    listCapacitiesMock.mockReset();
    listReservationsMock.mockReset();
    listBungalowsMock.mockReset();
    requirePermissionMock.mockResolvedValue({ authenticated: true, roles: ["admin"], subject: "user-admin-1" });
    listCapacitiesMock.mockResolvedValue([
      {
        bungalowId: "bungalow-suite",
        totalUnits: 2,
        version: 1,
        updatedBy: null,
        createdAt: "2026-07-12T00:00:00.000Z",
        updatedAt: "2026-07-12T00:00:00.000Z",
      },
    ]);
    listReservationsMock.mockResolvedValue([
      {
        id: "reservation-1",
        bungalowId: "bungalow-suite",
        status: "confirmed",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
      },
    ]);
    listBungalowsMock.mockResolvedValue([
      { id: "bungalow-suite", name: "Bungalow Doble", code: "SUITE", capacity: 2, active: true },
    ]);
  });

  it("requires inventory:manage and returns the critical night breakdown", async () => {
    const { GET } = await import("./route");
    const request = new Request(
      "http://localhost/api/admin/bungalow-capacity?checkIn=2026-08-10&checkOut=2026-08-12",
    );
    const response = await GET(request);

    expect(requirePermissionMock).toHaveBeenCalledWith(request, "inventory:manage");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [
        expect.objectContaining({
          bungalowTypeId: "bungalow-suite",
          displayName: "Bungalow Doble",
          guestCapacity: 2,
          totalUnits: 2,
          availableUnitsForStay: 1,
          criticalDate: "2026-08-10",
          confirmedOnCriticalDate: 1,
          version: 1,
        }),
      ],
    });
  });

  it("returns the permission response without reading capacity", async () => {
    requirePermissionMock.mockResolvedValue(new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }));
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/admin/bungalow-capacity?checkIn=2026-08-10&checkOut=2026-08-12"),
    );

    expect(response.status).toBe(403);
    expect(listCapacitiesMock).not.toHaveBeenCalled();
  });
});
