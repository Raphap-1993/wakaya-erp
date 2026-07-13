import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, resyncOtaReservationMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  resyncOtaReservationMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    resyncOtaReservation: resyncOtaReservationMock,
  },
}));

import { POST } from "./route";

describe("POST /api/reservations/[id]/ota/resync", () => {
  beforeEach(() => {
    requirePermissionMock.mockReset();
    resyncOtaReservationMock.mockReset();
  });

  it("re-syncs one OTA reservation for authorized admins", async () => {
    requirePermissionMock.mockResolvedValue({ subject: "admin-1" });
    resyncOtaReservationMock.mockResolvedValue({
      reservation: { id: "reservation-ota-1" },
      syncHealth: "degraded",
      conflicts: [],
    });

    const response = await POST(new Request("http://localhost/api/reservations/reservation-ota-1/ota/resync", { method: "POST" }), {
      params: { id: "reservation-ota-1" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(resyncOtaReservationMock).toHaveBeenCalledWith("reservation-ota-1", "admin-1");
    expect(body.reservation.id).toBe("reservation-ota-1");
  });
});
