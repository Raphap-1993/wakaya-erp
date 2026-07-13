import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, restoreMock, listRevisionsMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  restoreMock: vi.fn(),
  listRevisionsMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/home-content/store", () => ({
  homeContentStore: {
    restore: restoreMock,
    listRevisions: listRevisionsMock,
  },
}));

import { DEFAULT_HOME_CONTENT } from "@/lib/home-content/default-content";

async function loadRoute() {
  return import("./route");
}

describe("POST /api/admin/home-content/revisions/[version]/restore", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    restoreMock.mockReset();
    listRevisionsMock.mockReset();

    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
    restoreMock.mockResolvedValue({
      revisionVersion: 4,
      document: DEFAULT_HOME_CONTENT,
      updatedAt: "2026-07-09T14:00:00.000Z",
      updatedByUserId: "admin-user-1",
      restoredFromVersion: 2,
      source: "published",
    });
    listRevisionsMock.mockResolvedValue([
      {
        revisionVersion: 4,
        document: DEFAULT_HOME_CONTENT,
        updatedAt: "2026-07-09T14:00:00.000Z",
        updatedByUserId: "admin-user-1",
        restoredFromVersion: 2,
        source: "published",
      },
    ]);
  });

  it("restores a prior revision and returns the refreshed history", async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/admin/home-content/revisions/2/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: 3,
        }),
      }),
      {
        params: { version: "2" },
      },
    );
    const body = await response.json();

    expect(requirePermissionMock).toHaveBeenCalledWith(expect.any(Request), "content:write");
    expect(response.status).toBe(200);
    expect(restoreMock).toHaveBeenCalledWith(2, "admin-user-1", 3);
    expect(body.item.restoredFromVersion).toBe(2);
  });
});
