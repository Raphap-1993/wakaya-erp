import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, createAssetMock, listAssetsMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  createAssetMock: vi.fn(),
  listAssetsMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/content/media/content-media-service", () => ({
  contentMediaService: {
    createAsset: createAssetMock,
    listAssets: listAssetsMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("GET /api/admin/content/media", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    listAssetsMock.mockReset();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("lists reusable assets with a filename query", async () => {
    listAssetsMock.mockResolvedValue([
      {
        id: "asset_01",
        originalFilename: "slider.jpg",
        previewUrl: "/media/assets/asset_01/master.webp",
        createdAt: "2026-07-16T00:00:00.000Z",
      },
    ]);

    const { GET } = await loadRoute();
    const response = await GET(
      new Request("http://localhost/api/admin/content/media?q=slider&limit=20"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      assets: [expect.objectContaining({ id: "asset_01", originalFilename: "slider.jpg" })],
    });
    expect(listAssetsMock).toHaveBeenCalledWith({ query: "slider", limit: 20 });
  });
});

describe("POST /api/admin/content/media", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    createAssetMock.mockReset();
    listAssetsMock.mockReset();

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
        originalFilename: "hero.jpg",
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
    expect(body.asset.originalFilename).toBe("hero.jpg");
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

  it("returns a stable 503 response without exposing SQL persistence details", async () => {
    createAssetMock.mockRejectedValue(
      Object.assign(
        new Error("media_persistence_failed", {
          cause: new Error('relation "media_asset" does not exist'),
        }),
        { code: "42P01" },
      ),
    );
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

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: "media_persistence_failed" });
    expect(JSON.stringify(body)).not.toContain("media_asset");
  });

  it("returns the same stable 503 response for a non-42P01 database failure", async () => {
    const databaseError = Object.assign(
      new Error('duplicate key value violates unique constraint "media_asset_pkey"'),
      { code: "23505" },
    );
    createAssetMock.mockRejectedValue(
      Object.assign(new Error("media_persistence_failed", { cause: databaseError }), {
        code: "23505",
      }),
    );
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

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: "media_persistence_failed" });
    expect(JSON.stringify(body)).not.toContain("unique constraint");
    expect(JSON.stringify(body)).not.toContain("media_asset_pkey");
  });
});
