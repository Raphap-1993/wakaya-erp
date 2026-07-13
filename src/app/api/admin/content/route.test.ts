import { beforeEach, describe, expect, it, vi } from "vitest";

const { requirePermissionMock, listExperiencesMock, getGalleryMock, listBungalowsMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  listExperiencesMock: vi.fn(),
  getGalleryMock: vi.fn(),
  listBungalowsMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/content/store", () => ({
  contentStore: {
    listExperiences: listExperiencesMock,
    getGallery: getGalleryMock,
  },
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    listBungalows: listBungalowsMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("GET /api/admin/content", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    listExperiencesMock.mockReset();
    getGalleryMock.mockReset();
    listBungalowsMock.mockReset();

    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
    listExperiencesMock.mockResolvedValue([{ id: "exp_01" }, { id: "exp_02" }]);
    getGalleryMock.mockResolvedValue({ items: Array.from({ length: 18 }, (_, index) => ({ id: `gallery_${index}` })) });
    listBungalowsMock.mockResolvedValue([{ id: "bungalow-double" }, { id: "bungalow-family" }]);
  });

  it("returns tab summary and counts", async () => {
    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/content"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tabs).toEqual(["home", "experiences", "gallery", "bungalows", "company"]);
    expect(body.counts).toEqual({
      experiences: 2,
      galleryItems: 18,
      bungalowTypes: 2,
    });
  });
});
