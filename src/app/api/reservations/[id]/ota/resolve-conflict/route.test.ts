import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, resolveOtaReservationConflictMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  resolveOtaReservationConflictMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    resolveOtaReservationConflict: resolveOtaReservationConflictMock,
  },
}));

import { POST } from "./route";

describe("POST /api/reservations/[id]/ota/resolve-conflict", () => {
  beforeEach(() => {
    requirePermissionMock.mockReset();
    resolveOtaReservationConflictMock.mockReset();
  });

  it("resolves one OTA availability conflict for approvers", async () => {
    requirePermissionMock.mockResolvedValue({ subject: "approver-1" });
    resolveOtaReservationConflictMock.mockResolvedValue({
      reservation: { id: "reservation-ota-2" },
      syncHealth: "synced",
      conflicts: [],
    });

    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-ota-2/ota/resolve-conflict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes: "Se liberó una unidad y se reintenta el sync." }),
      }),
      {
        params: { id: "reservation-ota-2" },
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(resolveOtaReservationConflictMock).toHaveBeenCalledWith(
      "reservation-ota-2",
      "approver-1",
      "Se liberó una unidad y se reintenta el sync.",
    );
    expect(body.syncHealth).toBe("synced");
  });
});
