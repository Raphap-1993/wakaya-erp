import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock, listUsersMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  listUsersMock: vi.fn(),
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

vi.mock("@/lib/backoffice-auth/store", () => ({
  backofficeAuthStore: {
    listUsers: listUsersMock,
  },
}));

import * as adminUsersPageModule from "./page";

describe("AdminUsersPage", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockReset();
    listUsersMock.mockReset();
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
    listUsersMock.mockResolvedValue([
      {
        id: "user-1",
        email: "reservas@wakayaecolodge.com",
        name: "Reservas Wakaya",
        roles: ["admin"],
        active: true,
        lastLoginAt: "2026-07-02T10:00:00.000Z",
      },
      {
        id: "user-2",
        email: "operaciones@wakayaecolodge.com",
        name: "Operaciones Wakaya",
        roles: ["editor"],
        active: false,
        lastLoginAt: null,
      },
    ]);
  });

  it("renders the persisted users list with role and status chips", async () => {
    const html = renderToStaticMarkup(await adminUsersPageModule.default());

    expect(html).toContain("Usuarios internos");
    expect(html).toContain("reservas@wakayaecolodge.com");
    expect(html).toContain("operaciones@wakayaecolodge.com");
    expect(html).toContain("admin");
    expect(html).toContain("editor");
    expect(html).toContain("Activa");
    expect(html).toContain("Inactiva");
    expect(html).toContain("Nuevo usuario");
    expect(html).toContain("Editar usuario");
  });

  it("forces dynamic rendering for the operational users roster", () => {
    expect(adminUsersPageModule.dynamic).toBe("force-dynamic");
  });
});
