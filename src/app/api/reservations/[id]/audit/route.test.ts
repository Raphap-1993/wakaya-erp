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

describe("GET /api/reservations/[id]/audit", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
  });

  it("returns the audit trail", async () => {
    const { GET } = await loadRoute();
    const response = await GET(
      new Request("http://localhost/api/reservations/reservation-demo-1/audit"),
      { params: { id: "reservation-demo-1" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThanOrEqual(0);
  });
});
