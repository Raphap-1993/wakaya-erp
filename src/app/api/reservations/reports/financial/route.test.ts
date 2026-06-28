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

describe("GET /api/reservations/reports/financial", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("returns the financial summary in JSON", async () => {
    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/reservations/reports/financial"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.totalReservations).toBeGreaterThan(0);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items[0]).toHaveProperty("balanceCents");
  });

  it("exports the financial report as CSV", async () => {
    const { GET } = await loadRoute();
    const response = await GET(
      new Request("http://localhost/api/reservations/reports/financial?format=csv&status=confirmed"),
    );
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(csv).toContain("number,status,paymentStatus");
  });
});
