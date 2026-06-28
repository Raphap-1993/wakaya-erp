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

describe("POST /api/reservations/[id]/status", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("confirms a pending review reservation", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-1/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          actorId: "user-reception-1",
          reason: "transfer verified",
        }),
      }),
      { params: { id: "reservation-demo-1" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.status).toBe("confirmed");
  });

  it("marks a confirmed reservation as no_show", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-2/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "mark_no_show",
          actorId: "user-reception-1",
          reason: "guest did not arrive",
        }),
      }),
      { params: { id: "reservation-demo-2" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.status).toBe("no_show");
  });

  it("cancels a checked_in reservation with administrative override", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-3/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          actorId: "user-admin-1",
          reason: "administrative override due to incident",
        }),
      }),
      { params: { id: "reservation-demo-3" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.status).toBe("cancelled");
  });

  it("accepts form submissions from the admin monitor", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-1/status", {
        method: "POST",
        body: new URLSearchParams({
          action: "confirm",
          reason: "transfer verified",
          actorId: "user-reception-1",
        }),
      }),
      { params: { id: "reservation-demo-1" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.status).toBe("confirmed");
  });

  it("rejects an invalid status payload", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-1/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "fly",
          reason: "",
        }),
      }),
      { params: { id: "reservation-demo-1" } },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_payload");
  });
});
