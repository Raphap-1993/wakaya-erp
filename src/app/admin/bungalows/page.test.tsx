import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock } = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

import * as adminBungalowsPageModule from "./page";

describe("AdminBungalowsPage", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockReset();
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("redirects legacy bungalow content traffic to the content hub", async () => {
    try {
      await adminBungalowsPageModule.default();
      throw new Error("expected redirect");
    } catch (error) {
      expect(requireAdminPageAccessMock).toHaveBeenCalledWith("/admin/bungalows", "content:write");
      expect((error as Error & { digest?: string }).digest).toBe(
        "NEXT_REDIRECT;replace;/admin/content?tab=bungalows;307;",
      );
    }
  });

  it("forces dynamic rendering for the bungalow roster", () => {
    expect(adminBungalowsPageModule.dynamic).toBe("force-dynamic");
  });
});
