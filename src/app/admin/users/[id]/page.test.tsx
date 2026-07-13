import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, requireAdminPageAccessMock, useRouterMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  requireAdminPageAccessMock: vi.fn(),
  useRouterMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: useRouterMock,
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

vi.mock("@/lib/backoffice-auth/store", () => ({
  backofficeAuthStore: {
    getUser: getUserMock,
  },
}));

import AdminUserEditPage from "./page";

describe("AdminUserEditPage", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockReset();
    getUserMock.mockReset();
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
    getUserMock.mockResolvedValue({
      id: "user-2",
      email: "operaciones@wakayaecolodge.com",
      name: "Operaciones Wakaya",
      roles: ["editor"],
      active: true,
      lastLoginAt: null,
    });
  });

  it("renders the edition form for an existing user", async () => {
    const html = renderToStaticMarkup(
      await AdminUserEditPage({ params: Promise.resolve({ id: "user-2" }) }),
    );

    expect(html).toContain("Editar usuario interno");
    expect(html).toContain("operaciones@wakayaecolodge.com");
    expect(html).toContain("Guardar cambios");
  });
});
