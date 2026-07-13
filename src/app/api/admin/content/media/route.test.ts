import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, createAssetMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  createAssetMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/content/media/content-media-service", () => ({
  contentMediaService: {
    createAsset: createAssetMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("POST /api/admin/content/media", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    createAssetMock.mockReset();

    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("creates an asset when hero crops are complete", async () => {
    createAssetMock.mockResolvedValue({
      asset: {
        id: "asset_01",
        status: "ready",
        master: { width: 3200, height: 2133, format: "webp", quality: 95, nearLossless: true },
        variants: {
          heroDesktop: { url: "/media/assets/asset_01/heroDesktop.webp", width: 1920, height: 1080, quality: 88 },
          heroMobile: { url: "/media/assets/asset_01/heroMobile.webp", width: 1080, height: 1350, quality: 88 },
        },
      },
    });

    const formData = new FormData();
    formData.set("file", new File([Buffer.from("image")], "hero.jpg", { type: "image/jpeg" }));
    formData.set("slot", "hero");
    formData.set(
      "crops",
      JSON.stringify({
        desktop: { x: 0, y: 0, width: 1, height: 1, rotation: 0 },
        mobile: { x: 0, y: 0, width: 1, height: 1, rotation: 0 },
      }),
    );

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/admin/content/media", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAssetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        slot: "hero",
        actorId: "admin-user-1",
      }),
    );
    expect(body.asset.id).toBe("asset_01");
  });

  it("rejects hero uploads without the mobile crop", async () => {
    const formData = new FormData();
    formData.set("file", new File([Buffer.from("image")], "hero.jpg", { type: "image/jpeg" }));
    formData.set("slot", "hero");
    formData.set(
      "crops",
      JSON.stringify({
        desktop: { x: 0, y: 0, width: 1, height: 1, rotation: 0 },
      }),
    );

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/admin/content/media", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toBe("media_crop_required");
  });
});
