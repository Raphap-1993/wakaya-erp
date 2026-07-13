import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, createCompatibilityHomeMediaMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  createCompatibilityHomeMediaMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/content/media/content-media-service", () => ({
  contentMediaService: {
    createCompatibilityHomeMedia: createCompatibilityHomeMediaMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("POST /api/admin/home-content/media", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    createCompatibilityHomeMediaMock.mockReset();

    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });

    createCompatibilityHomeMediaMock.mockResolvedValue({
      media: {
        url: "/media/home/slide-hero-optimized.webp",
        width: 1600,
        height: 900,
        bytes: 188000,
        format: "webp",
      },
      asset: {
        id: "asset_home_01",
      },
    });
  });

  it("uploads an optimized home image for the editor", async () => {
    const formData = new FormData();
    formData.set("file", new File([Buffer.from("fake-image")], "hero.jpg", { type: "image/jpeg" }));
    formData.set("slot", "slide-hero");

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/admin/home-content/media", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();

    expect(requirePermissionMock).toHaveBeenCalledWith(expect.any(Request), "content:write");
    expect(createCompatibilityHomeMediaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.any(File),
        slot: "slide-hero",
        actorId: "admin-user-1",
      }),
    );
    expect(response.status).toBe(200);
    expect(body.media.url).toBe("/media/home/slide-hero-optimized.webp");
  });
});
