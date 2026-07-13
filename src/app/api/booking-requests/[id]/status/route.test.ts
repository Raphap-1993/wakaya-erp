import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, transitionBookingRequestMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  transitionBookingRequestMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    transitionBookingRequest: transitionBookingRequestMock,
  },
}));

async function loadRoute() {
  requirePermissionMock.mockResolvedValue({
    authenticated: true,
    roles: ["editor"],
    subject: "user-reception-1",
  });
  return import("./route");
}

describe("POST /api/booking-requests/[id]/status", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    transitionBookingRequestMock.mockReset();
  });

  it("marks an awaiting-transfer request as proof received from the backoffice", async () => {
    transitionBookingRequestMock.mockResolvedValue({
      id: "request-1",
      publicRef: "WR-2026-0001",
      status: "proof_received",
    });

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/booking-requests/request-1/status", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer valid" },
        body: JSON.stringify({
          action: "mark_proof_received",
          reason: "comprobante revisado en back office",
        }),
      }),
      { params: Promise.resolve({ id: "request-1" }) },
    );

    expect(response.status).toBe(200);
    expect(transitionBookingRequestMock).toHaveBeenCalledWith("request-1", {
      action: "mark_proof_received",
      actorId: "user-reception-1",
      reason: "comprobante revisado en back office",
    });
    await expect(response.json()).resolves.toMatchObject({
      bookingRequest: {
        id: "request-1",
        status: "proof_received",
      },
    });
  });
});
