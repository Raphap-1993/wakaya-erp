import { beforeEach, describe, expect, it, vi } from "vitest";

const { headersMock, redirectMock, authenticateMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
  redirectMock: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  authenticateMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/middleware/authn", () => ({
  authenticate: authenticateMock,
}));

describe("requireAdminPageAccess", () => {
  beforeEach(() => {
    headersMock.mockReset();
    redirectMock.mockClear();
    authenticateMock.mockReset();
    headersMock.mockResolvedValue(new Headers({ cookie: "wakaya_backoffice_session=session-1" }));
  });

  it("redirects unauthenticated requests to the login form with the original path", async () => {
    authenticateMock.mockResolvedValue({
      authenticated: false,
      roles: [],
      reason: "missing_bearer",
    });

    const { requireAdminPageAccess } = await import("./require-admin-page-access");

    await expect(requireAdminPageAccess("/admin/reservations", "reservation:read")).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fadmin%2Freservations",
    );
  });

  it("redirects authenticated users without permission to the explicit forbidden surface", async () => {
    authenticateMock.mockResolvedValue({
      authenticated: true,
      roles: ["viewer"],
      subject: "viewer-user-1",
      claims: { email: "viewer@wakaya.local" },
    });

    const { requireAdminPageAccess } = await import("./require-admin-page-access");

    await expect(requireAdminPageAccess("/admin/users", "admin:users")).rejects.toThrow(
      "NEXT_REDIRECT:/admin/forbidden?from=%2Fadmin%2Fusers",
    );
  });

  it("returns the auth context when the role has the required permission", async () => {
    authenticateMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
      claims: { email: "admin@wakaya.local" },
    });

    const { requireAdminPageAccess } = await import("./require-admin-page-access");

    await expect(requireAdminPageAccess("/admin/users", "admin:users")).resolves.toMatchObject({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });
});
