import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireOtaJobPermissionMock, syncOtaProviderMock } = vi.hoisted(() => ({
  requireOtaJobPermissionMock: vi.fn(),
  syncOtaProviderMock: vi.fn(),
}));

vi.mock("@/lib/integrations/otas/job-auth", () => ({
  requireOtaJobPermission: requireOtaJobPermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    syncOtaProvider: syncOtaProviderMock,
  },
}));

import { POST } from "./route";

describe("POST /api/integrations/otas/booking/sync", () => {
  beforeEach(() => {
    requireOtaJobPermissionMock.mockReset();
    syncOtaProviderMock.mockReset();
  });

  it("triggers an incremental Booking sync for authorized admins", async () => {
    requireOtaJobPermissionMock.mockResolvedValue({ subject: "admin-1" });
    syncOtaProviderMock.mockResolvedValue({
      providerKey: "booking_com",
      mode: "incremental",
      imported: 1,
      acknowledged: 1,
      skipped: 0,
      pendingMapping: 0,
      conflicts: 0,
      failures: 0,
      startedAt: "2026-07-09T22:00:00.000Z",
      finishedAt: "2026-07-09T22:00:10.000Z",
    });

    const response = await POST(new Request("http://localhost/api/integrations/otas/booking/sync", { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(syncOtaProviderMock).toHaveBeenCalledWith("booking_com", "incremental", "admin-1");
    expect(body.result.mode).toBe("incremental");
  });
});
