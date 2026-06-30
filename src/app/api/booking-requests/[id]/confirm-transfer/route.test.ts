import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

async function loadRoute() {
  requirePermissionMock.mockResolvedValue({
    authenticated: true,
    roles: ["admin"],
    subject: "user-reception-1",
  });
  return import("./route");
}

describe("POST /api/booking-requests/[id]/confirm-transfer", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("converts a proof-received request into a confirmed reservation", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/booking-requests/request-1/confirm-transfer", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer valid" },
        body: JSON.stringify({ actorId: "user-reception-1", reason: "proof validated" }),
      }),
      { params: Promise.resolve({ id: "request-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      bookingRequest: { status: "converted_to_reservation" },
      reservation: { status: "confirmed", channel: "web" },
    });
  });
});
