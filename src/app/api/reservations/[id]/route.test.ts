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

describe("GET /api/reservations/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("returns the reservation detail", async () => {
    const { GET } = await loadRoute();
    const response = await GET(
      new Request("http://localhost/api/reservations/reservation-demo-1"),
      { params: { id: "reservation-demo-1" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.id).toBe("reservation-demo-1");
    expect(body.reservation.status).toBe("pending_review");
    expect(body.reservation.bungalowId).toBe("bungalow-suite");
  });
});

describe("PUT /api/reservations/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("updates editable fields, preserves the original number and keeps the current responsible owner", async () => {
    const { PUT, GET } = await loadRoute();
    const { GET: getAudit } = await import("./audit/route");
    const response = await PUT(
      new Request("http://localhost/api/reservations/reservation-demo-1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          number: "RESERVATION-2026-0099",
          channel: "web",
          bungalowId: "bungalow-family",
          startDate: "2026-06-20",
          endDate: "2026-06-22",
          amountTotalCents: 48000,
          amountPaidCents: 12000,
        }),
      }),
      { params: { id: "reservation-demo-1" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reservation.number).toBe("RESERVATION-2026-0001");
    expect(body.reservation.bungalowId).toBe("bungalow-family");
    expect(body.reservation.responsibleId).toBe("user-reception-1");
    expect(body.reservation.startDate).toBe("2026-06-20");
    expect(body.reservation.paymentStatus).toBe("partial");

    const detailResponse = await GET(
      new Request("http://localhost/api/reservations/reservation-demo-1"),
      { params: { id: "reservation-demo-1" } },
    );
    const detailBody = await detailResponse.json();
    expect(detailBody.reservation.number).toBe("RESERVATION-2026-0001");
    expect(detailBody.reservation.responsibleId).toBe("user-reception-1");

    const auditResponse = await getAudit(
      new Request("http://localhost/api/reservations/reservation-demo-1/audit"),
      { params: { id: "reservation-demo-1" } },
    );
    const auditBody = await auditResponse.json();
    expect(auditResponse.status).toBe(200);
    expect(auditBody.items[0].actorId).toBe("user-admin-1");
    expect(auditBody.items[0].reason).toBe("manual reservation edit");
  });
});
