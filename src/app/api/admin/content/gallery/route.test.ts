import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, getGalleryMock, publishGalleryMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getGalleryMock: vi.fn(),
  publishGalleryMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/content/store", () => ({
  contentStore: {
    getGallery: getGalleryMock,
    publishGallery: publishGalleryMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("/api/admin/content/gallery", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getGalleryMock.mockReset();
    publishGalleryMock.mockReset();

    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("loads the singleton gallery", async () => {
    getGalleryMock.mockResolvedValue({ version: 3, items: [{ id: "gallery_01" }] });

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/content/gallery"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.version).toBe(3);
  });

  it("publishes the gallery ordering", async () => {
    publishGalleryMock.mockResolvedValue({ version: 4, items: [{ id: "gallery_01" }] });

    const { PUT } = await loadRoute();
    const response = await PUT(
      new Request("http://localhost/api/admin/content/gallery", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: 3,
          items: [
            {
              id: "gallery_01",
              assetId: "asset_01",
              visible: true,
              sortOrder: 1,
              localeContent: {
                es: { alt: "Laguna", caption: "Atardecer" },
                en: { alt: "Lagoon", caption: "Sunset" },
              },
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(publishGalleryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedVersion: 3,
        actorId: "admin-user-1",
      }),
    );
  });
});
