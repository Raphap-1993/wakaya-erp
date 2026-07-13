import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminPageAccessMock,
} = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

import AdminBungalowEditPage from "./page";

describe("AdminBungalowEditPage", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("redirects legacy bungalow editing traffic to the content hub selection", async () => {
    try {
      await AdminBungalowEditPage({
        params: { id: "bungalow-familiar" },
      });
      throw new Error("expected redirect");
    } catch (error) {
      expect(requireAdminPageAccessMock).toHaveBeenCalledWith(
        "/admin/bungalows/bungalow-familiar",
        "content:write",
      );
      expect((error as Error & { digest?: string }).digest).toBe(
        "NEXT_REDIRECT;replace;/admin/content?tab=bungalows&bungalowId=bungalow-familiar;307;",
      );
    }
  });
});
