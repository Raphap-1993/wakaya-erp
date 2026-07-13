import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, getUserMock, updateUserMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getUserMock: vi.fn(),
  updateUserMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/backoffice-auth/store", () => ({
  backofficeAuthStore: {
    getUser: getUserMock,
    updateUser: updateUserMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("GET /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getUserMock.mockReset();
    updateUserMock.mockReset();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("returns a single backoffice user", async () => {
    getUserMock.mockResolvedValue({
      id: "user-2",
      email: "operaciones@wakayaecolodge.com",
      name: "Operaciones Wakaya",
      roles: ["editor"],
      active: true,
      lastLoginAt: null,
    });

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/users/user-2"), {
      params: Promise.resolve({ id: "user-2" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.email).toBe("operaciones@wakayaecolodge.com");
  });
});

describe("PUT /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getUserMock.mockReset();
    updateUserMock.mockReset();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("updates the stored backoffice user", async () => {
    updateUserMock.mockResolvedValue({
      id: "user-2",
      email: "operaciones@wakayaecolodge.com",
      name: "Operaciones Wakaya",
      roles: ["approver"],
      active: false,
      lastLoginAt: null,
    });

    const { PUT } = await loadRoute();
    const response = await PUT(
      new Request("http://localhost/api/admin/users/user-2", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "operaciones@wakayaecolodge.com",
          name: "Operaciones Wakaya",
          password: "new-pass-456",
          roles: ["approver"],
          active: false,
        }),
      }),
      { params: Promise.resolve({ id: "user-2" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith("user-2", {
      email: "operaciones@wakayaecolodge.com",
      name: "Operaciones Wakaya",
      password: "new-pass-456",
      roles: ["approver"],
      active: false,
    });
    expect(body.user.roles).toEqual(["approver"]);
    expect(body.user.active).toBe(false);
  });
});
