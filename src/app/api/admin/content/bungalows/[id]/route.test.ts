import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requirePermissionMock,
  getBungalowPublicContentMock,
  updateBungalowContentMock,
} = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getBungalowPublicContentMock: vi.fn(),
  updateBungalowContentMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    getBungalowPublicContent: getBungalowPublicContentMock,
  },
}));

vi.mock("@/lib/content/store", () => ({
  contentStore: {
    updateBungalowContent: updateBungalowContentMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("/api/admin/content/bungalows/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getBungalowPublicContentMock.mockReset();
    updateBungalowContentMock.mockReset();

    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("loads one bungalow content record", async () => {
    getBungalowPublicContentMock.mockResolvedValue({ bungalowId: "bungalow-family", revisionVersion: 3 });

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/admin/content/bungalows/bungalow-family"), {
      params: { id: "bungalow-family" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.item.bungalowId).toBe("bungalow-family");
  });

  it("updates bungalow content using asset ids instead of manual urls", async () => {
    updateBungalowContentMock.mockResolvedValue({ bungalowId: "bungalow-family", revisionVersion: 4 });

    const { PUT } = await loadRoute();
    const response = await PUT(
      new Request("http://localhost/api/admin/content/bungalows/bungalow-family", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: 3,
          featuredOnHome: true,
          sortOrder: 1,
          nightlyRatePen: 350,
          areaSqm: 55,
          localeContent: {
            es: {
              displayName: "Bungalow Familiar",
              displayEyebrow: "Wakaya",
              displayDescription: "Descripción",
              displayTagline: "Tagline",
              displayLongDescription: "Long",
              displayHighlights: ["A"],
              displayAmenities: ["B"],
              displayIncluded: ["C"],
            },
            en: {
              displayName: "Family bungalow",
              displayEyebrow: "Wakaya",
              displayDescription: "Description",
              displayTagline: "Tagline",
              displayLongDescription: "Long",
              displayHighlights: ["A"],
              displayAmenities: ["B"],
              displayIncluded: ["C"],
            },
          },
          heroAssetId: "asset_hero_01",
          galleryAssetIds: ["asset_gallery_01", "asset_gallery_02"],
        }),
      }),
      { params: { id: "bungalow-family" } },
    );

    expect(response.status).toBe(200);
    expect(updateBungalowContentMock).toHaveBeenCalledWith(
      "bungalow-family",
      expect.objectContaining({
        heroImageUrl: "/media/assets/asset_hero_01/heroDesktop.webp",
        galleryUrls: [
          "/media/assets/asset_gallery_01/detail.webp",
          "/media/assets/asset_gallery_02/detail.webp",
        ],
      }),
    );
  });

  it("preserves legacy media urls when the bungalow has not been migrated to asset ids yet", async () => {
    updateBungalowContentMock.mockResolvedValue({ bungalowId: "bungalow-family", revisionVersion: 4 });

    const { PUT } = await loadRoute();
    const response = await PUT(
      new Request("http://localhost/api/admin/content/bungalows/bungalow-family", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: 3,
          featuredOnHome: true,
          sortOrder: 1,
          nightlyRatePen: 350,
          areaSqm: 55,
          heroImageUrl: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg",
          galleryUrls: ["https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_2.jpg"],
          localeContent: {
            es: {
              displayName: "Bungalow Familiar",
              displayEyebrow: "Wakaya",
              displayDescription: "Descripción",
              displayTagline: "Tagline",
              displayLongDescription: "Long",
              displayHighlights: ["A"],
              displayAmenities: ["B"],
              displayIncluded: ["C"],
            },
            en: {
              displayName: "Family bungalow",
              displayEyebrow: "Wakaya",
              displayDescription: "Description",
              displayTagline: "Tagline",
              displayLongDescription: "Long",
              displayHighlights: ["A"],
              displayAmenities: ["B"],
              displayIncluded: ["C"],
            },
          },
          heroAssetId: null,
          galleryAssetIds: [],
        }),
      }),
      { params: { id: "bungalow-family" } },
    );

    expect(response.status).toBe(200);
    expect(updateBungalowContentMock).toHaveBeenCalledWith(
      "bungalow-family",
      expect.objectContaining({
        heroImageUrl: "https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg",
        galleryUrls: ["https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_2.jpg"],
        heroAssetId: null,
        galleryAssetIds: [],
      }),
    );
  });
});
