import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));
import AdminHomePage from "./page";

describe("AdminHomePage", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("redirects legacy home editing traffic to the content hub", async () => {
    try {
      await AdminHomePage();
      throw new Error("expected redirect");
    } catch (error) {
      expect(requireAdminPageAccessMock).toHaveBeenCalledWith("/admin/home", "content:write");
      expect((error as Error & { digest?: string }).digest).toBe(
        "NEXT_REDIRECT;replace;/admin/content?tab=home;307;",
      );
    }
  });
});
