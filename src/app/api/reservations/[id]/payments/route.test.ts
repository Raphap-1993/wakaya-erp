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

describe("POST /api/reservations/[id]/payments", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("records a partial payment", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-1/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amountPaidCents: 12000,
          actorId: "user-reception-1",
          reason: "partial payment at reception",
        }),
      }),
      { params: { id: "reservation-demo-1" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.amountPaidCents).toBe(12000);
    expect(body.reservation.paymentStatus).toBe("partial");
  });

  it("accepts form submissions from the admin monitor", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-1/payments", {
        method: "POST",
        body: new URLSearchParams({
          amountPaidCents: "6000",
          actorId: "user-reception-1",
          reason: "payment form submission",
        }),
      }),
      { params: { id: "reservation-demo-1" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.amountPaidCents).toBe(6000);
  });

  it("rejects invalid payment payloads", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/reservations/reservation-demo-1/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amountPaidCents: 0,
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
