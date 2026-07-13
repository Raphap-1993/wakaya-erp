import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, restoreMock, listRevisionsMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  restoreMock: vi.fn(),
  listRevisionsMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({ requirePermission: requirePermissionMock }));
vi.mock("@/lib/corporate-content/store", () => ({
  corporateContentStore: {
    restore: restoreMock,
    listRevisions: listRevisionsMock,
  },
}));

import { POST } from "./route";

describe("POST /api/admin/corporate-content/revisions/:version/restore", () => {
  beforeEach(() => {
    requirePermissionMock.mockReset();
    restoreMock.mockReset();
    listRevisionsMock.mockReset();
    requirePermissionMock.mockResolvedValue({ subject: "admin-1" });
    restoreMock.mockResolvedValue({ revisionVersion: 4, restoredFromVersion: 2 });
    listRevisionsMock.mockResolvedValue([]);
  });

  it("restores a prior revision as a new publication", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/corporate-content/revisions/2/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: 3 }),
      }),
      { params: Promise.resolve({ version: "2" }) },
    );

    expect(response.status).toBe(200);
    expect(restoreMock).toHaveBeenCalledWith(2, "admin-1", 3);
    expect((await response.json()).item.restoredFromVersion).toBe(2);
  });

  it("rejects partially numeric revision paths", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/corporate-content/revisions/2foo/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: 3 }),
      }),
      { params: Promise.resolve({ version: "2foo" }) },
    );

    expect(response.status).toBe(404);
    expect(restoreMock).not.toHaveBeenCalled();
  });
});
