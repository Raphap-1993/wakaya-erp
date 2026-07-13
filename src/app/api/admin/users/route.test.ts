import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, listUsersMock, createUserMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  listUsersMock: vi.fn(),
  createUserMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/backoffice-auth/store", () => ({
  backofficeAuthStore: {
    listUsers: listUsersMock,
    createUser: createUserMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    listUsersMock.mockReset();
    createUserMock.mockReset();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("returns the persisted backoffice users", async () => {
    listUsersMock.mockResolvedValue([
      {
        id: "user-1",
        email: "reservas@wakayaecolodge.com",
        name: "Reservas Wakaya",
        roles: ["admin"],
        active: true,
        lastLoginAt: "2026-07-02T10:00:00.000Z",
      },
    ]);

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/users"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].email).toBe("reservas@wakayaecolodge.com");
  });

  it("forces dynamic rendering to avoid stale operational user data", async () => {
    const routeModule = await loadRoute();

    expect(routeModule.dynamic).toBe("force-dynamic");
  });
});

describe("POST /api/admin/users", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    listUsersMock.mockReset();
    createUserMock.mockReset();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("creates a persisted backoffice user", async () => {
    createUserMock.mockResolvedValue({
      id: "user-2",
      email: "operaciones@wakayaecolodge.com",
      name: "Operaciones Wakaya",
      roles: ["editor"],
      active: true,
      lastLoginAt: null,
    });

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "operaciones@wakayaecolodge.com",
          name: "Operaciones Wakaya",
          password: "editor-pass-123",
          roles: ["editor"],
          active: true,
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createUserMock).toHaveBeenCalledWith({
      email: "operaciones@wakayaecolodge.com",
      name: "Operaciones Wakaya",
      password: "editor-pass-123",
      roles: ["editor"],
      active: true,
    });
    expect(body.user.id).toBe("user-2");
  });
});
