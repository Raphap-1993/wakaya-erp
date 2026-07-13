import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, listBungalowsMock, createBungalowMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  listBungalowsMock: vi.fn(),
  createBungalowMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    listBungalows: listBungalowsMock,
    createBungalow: createBungalowMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("GET /api/bungalows", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    listBungalowsMock.mockReset();
    createBungalowMock.mockReset();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("returns the persisted bungalow inventory", async () => {
    listBungalowsMock.mockResolvedValue([
      {
        id: "bungalow-familiar",
        code: "FAMILIAR",
        name: "Bungalow Familiar",
        active: true,
        capacity: 4,
      },
    ]);

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/bungalows"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].code).toBe("FAMILIAR");
  });

  it("forces dynamic rendering to avoid stale inventory data", async () => {
    const routeModule = await loadRoute();

    expect(routeModule.dynamic).toBe("force-dynamic");
  });
});

describe("POST /api/bungalows", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    listBungalowsMock.mockReset();
    createBungalowMock.mockReset();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("creates a persisted bungalow", async () => {
    createBungalowMock.mockResolvedValue({
      id: "bungalow-familiar",
      code: "FAMILIAR",
      name: "Bungalow Familiar",
      active: true,
      capacity: 4,
    });

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/bungalows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: "familiar",
          name: "Bungalow Familiar",
          active: true,
          capacity: 4,
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createBungalowMock).toHaveBeenCalledWith({
      code: "familiar",
      name: "Bungalow Familiar",
      active: true,
      capacity: 4,
    });
    expect(body.bungalow.id).toBe("bungalow-familiar");
  });
});
