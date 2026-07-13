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

describe("POST /api/integrations/otas/booking/recover", () => {
  beforeEach(() => {
    requireOtaJobPermissionMock.mockReset();
    syncOtaProviderMock.mockReset();
  });

  it("triggers a recovery Booking sync for authorized admins or internal jobs", async () => {
    requireOtaJobPermissionMock.mockResolvedValue({ subject: "ota-job" });
    syncOtaProviderMock.mockResolvedValue({
      providerKey: "booking_com",
      mode: "recovery",
      imported: 2,
      acknowledged: 0,
      skipped: 0,
      pendingMapping: 1,
      conflicts: 1,
      failures: 0,
      startedAt: "2026-07-09T22:30:00.000Z",
      finishedAt: "2026-07-09T22:30:15.000Z",
    });

    const response = await POST(new Request("http://localhost/api/integrations/otas/booking/recover", { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(syncOtaProviderMock).toHaveBeenCalledWith("booking_com", "recovery", "ota-job");
    expect(body.result.mode).toBe("recovery");
  });
});
