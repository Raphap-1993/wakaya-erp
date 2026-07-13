import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, updateCapacityMock, listReservationsMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  updateCapacityMock: vi.fn(),
  listReservationsMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({ requirePermission: requirePermissionMock }));
vi.mock("@/lib/bungalow-capacity/store", () => ({
  bungalowCapacityStore: { updateCapacity: updateCapacityMock },
}));
vi.mock("@/lib/reservations/store", () => ({
  reservationStore: { list: listReservationsMock },
}));

describe("PUT /api/admin/bungalow-capacity/:bungalowTypeId", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    updateCapacityMock.mockReset();
    listReservationsMock.mockReset();
    requirePermissionMock.mockResolvedValue({ authenticated: true, roles: ["admin"], subject: "user-admin-1" });
    listReservationsMock.mockResolvedValue([]);
  });

  it("updates the total with version and authenticated actor", async () => {
    updateCapacityMock.mockResolvedValue({ bungalowId: "bungalow-suite", totalUnits: 3, version: 2 });
    const { PUT } = await import("./route");
    const request = new Request("http://localhost/api/admin/bungalow-capacity/bungalow-suite", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ totalUnits: 3, expectedVersion: 1 }),
    });
    const response = await PUT(request, { params: Promise.resolve({ bungalowTypeId: "bungalow-suite" }) });

    expect(updateCapacityMock).toHaveBeenCalledWith("bungalow-suite", {
      totalUnits: 3,
      expectedVersion: 1,
      actorId: "user-admin-1",
      reservations: [],
    });
    expect(response.status).toBe(200);
  });

  it("returns minimum and dates for an incompatible reduction", async () => {
    updateCapacityMock.mockRejectedValue(
      Object.assign(new Error("capacity_below_commitments"), {
        code: "capacity_below_commitments",
        minimumRequired: 2,
        conflictDates: ["2026-08-10"],
      }),
    );
    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/admin/bungalow-capacity/bungalow-suite", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ totalUnits: 1, expectedVersion: 1 }),
      }),
      { params: Promise.resolve({ bungalowTypeId: "bungalow-suite" }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "capacity_below_commitments",
      minimumRequired: 2,
      conflictDates: ["2026-08-10"],
    });
  });
});
