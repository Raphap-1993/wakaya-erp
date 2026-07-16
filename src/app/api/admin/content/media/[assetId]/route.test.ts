import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, deleteAssetMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  deleteAssetMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/content/media/content-media-service", () => ({
  contentMediaService: {
    deleteAsset: deleteAssetMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("DELETE /api/admin/content/media/[assetId]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    deleteAssetMock.mockReset();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("deletes an unused managed asset", async () => {
    deleteAssetMock.mockResolvedValue({
      deleted: true,
      assetId: "asset_01",
      cleanupPending: false,
    });

    const { DELETE } = await loadRoute();
    const response = await DELETE(
      new Request("http://localhost/api/admin/content/media/asset_01", {
        method: "DELETE",
      }),
      { params: { assetId: "asset_01" } },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      deleted: true,
      assetId: "asset_01",
      cleanupPending: false,
    });
    expect(deleteAssetMock).toHaveBeenCalledWith("asset_01");
  });

  it("returns 409 while the asset is referenced", async () => {
    deleteAssetMock.mockRejectedValue(new Error("asset_in_use"));

    const { DELETE } = await loadRoute();
    const response = await DELETE(
      new Request("http://localhost/api/admin/content/media/asset_01", {
        method: "DELETE",
      }),
      { params: { assetId: "asset_01" } },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "asset_in_use" });
  });
});
