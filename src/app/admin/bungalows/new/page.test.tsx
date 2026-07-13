import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock, useRouterMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  useRouterMock: vi.fn(),
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
}));

import NewAdminBungalowPage from "./page";

describe("NewAdminBungalowPage", () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("renders the bungalow creation form", async () => {
    const html = renderToStaticMarkup(await NewAdminBungalowPage());

    expect(html).toContain("Nuevo bungalow");
    expect(html).toContain("Código interno");
    expect(html).toContain("Crear bungalow");
  });
});
