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
    subject: "user-admin-1",
  });
  return import("./route");
}

describe("POST /api/reservations/[id]/assign", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("assigns an OTA reservation to a bungalow", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-2/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowId: "bungalow-suite",
          actorId: "user-reception-1",
          reason: "assign bungalow on arrival",
        }),
      }),
      { params: { id: "reservation-demo-2" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.status).toBe("assigned");
    expect(body.reservation.bungalowId).toBe("bungalow-suite");
  });

  it("accepts form submissions from the admin monitor", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-2/assign", {
        method: "POST",
        body: new URLSearchParams({
          bungalowId: "bungalow-suite",
          reason: "assign bungalow on arrival",
          actorId: "user-reception-1",
        }),
      }),
      { params: { id: "reservation-demo-2" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.status).toBe("assigned");
  });

  it("rejects an invalid assignment payload", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-2/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bungalowId: "",
          reason: "",
        }),
      }),
      { params: { id: "reservation-demo-2" } },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_payload");
  });
});
