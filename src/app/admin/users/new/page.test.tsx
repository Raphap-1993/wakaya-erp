import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock, useRouterMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  useRouterMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

import NewAdminUserPage from "./page";

describe("NewAdminUserPage", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockReset();
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("renders the user creation form", async () => {
    const html = renderToStaticMarkup(await NewAdminUserPage());

    expect(html).toContain("Nuevo usuario interno");
    expect(html).toContain("Correo operativo");
    expect(html).toContain("Contraseña temporal");
    expect(html).toContain("Crear usuario");
  });
});
