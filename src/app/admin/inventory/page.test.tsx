import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminPageAccessMock } = vi.hoisted(() => ({ requireAdminPageAccessMock: vi.fn() }));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

import * as pageModule from "./page";

describe("legacy inventory route", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockReset();
    requireAdminPageAccessMock.mockResolvedValue({ authenticated: true, roles: ["admin"] });
  });

  it("redirects to aggregate bungalow capacity", async () => {
    try {
      await pageModule.default();
      throw new Error("expected redirect");
    } catch (error) {
      expect(requireAdminPageAccessMock).toHaveBeenCalledWith("/admin/inventory", "inventory:manage");
      expect((error as Error & { digest?: string }).digest).toBe(
        "NEXT_REDIRECT;replace;/admin/bungalow-capacity;307;",
      );
    }
  });

  it("remains dynamic", () => {
    expect(pageModule.dynamic).toBe("force-dynamic");
  });
});
