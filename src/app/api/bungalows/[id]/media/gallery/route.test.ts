import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requirePermissionMock,
  getBungalowPublicContentMock,
  updateBungalowPublicContentMock,
  createCompatibilityBungalowMediaMock,
} = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getBungalowPublicContentMock: vi.fn(),
  updateBungalowPublicContentMock: vi.fn(),
  createCompatibilityBungalowMediaMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    getBungalowPublicContent: getBungalowPublicContentMock,
    updateBungalowPublicContent: updateBungalowPublicContentMock,
  },
}));

vi.mock("@/lib/content/media/content-media-service", () => ({
  contentMediaService: {
    createCompatibilityBungalowMedia: createCompatibilityBungalowMediaMock,
  },
}));

async function loadRoute() {
  return import("./route");
}

describe("POST /api/bungalows/[id]/media/gallery", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getBungalowPublicContentMock.mockReset();
    updateBungalowPublicContentMock.mockReset();
    createCompatibilityBungalowMediaMock.mockReset();

    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });

    getBungalowPublicContentMock.mockResolvedValue({
      bungalowId: "bungalow-suite",
      featuredOnHome: true,
      sortOrder: 3,
      heroImageUrl: "/media/bungalows/bungalow-suite/hero.webp",
      galleryUrls: ["/media/bungalows/bungalow-suite/gallery-old.webp"],
      nightlyRatePen: 280,
      areaSqm: 32,
      localeContent: {
        es: {
          displayName: "Bungalow Doble",
          displayEyebrow: "Wakaya Ecolodge · Pucallpa",
          displayDescription: "Descripcion ES",
          displayTagline: "Tagline ES",
          displayLongDescription: "Long ES",
          displayHighlights: ["A"],
          displayAmenities: ["B"],
          displayIncluded: ["C"],
        },
        en: {
          displayName: "Double Bungalow",
          displayEyebrow: "Wakaya Ecolodge · Pucallpa",
          displayDescription: "Description EN",
          displayTagline: "Tagline EN",
          displayLongDescription: "Long EN",
          displayHighlights: ["A"],
          displayAmenities: ["B"],
          displayIncluded: ["C"],
        },
      },
      updatedAt: "2026-07-02T12:00:00.000Z",
      heroAssetId: "asset_hero_01",
      galleryAssetIds: ["asset_gallery_old"],
      revisionVersion: 4,
    });
    createCompatibilityBungalowMediaMock
      .mockResolvedValueOnce({
        asset: {
          id: "asset_gallery_01",
        },
        media: {
          url: "/media/assets/asset_gallery_01/detail.webp",
          width: 1280,
          height: 853,
          bytes: 188000,
          format: "webp",
          assetId: "asset_gallery_01",
        },
      })
      .mockResolvedValueOnce({
        asset: {
          id: "asset_gallery_02",
        },
        media: {
          url: "/media/assets/asset_gallery_02/detail.webp",
          width: 1280,
          height: 853,
          bytes: 194000,
          format: "webp",
          assetId: "asset_gallery_02",
        },
      });
    updateBungalowPublicContentMock.mockImplementation(async (_id: string, input: unknown) => ({
      bungalowId: "bungalow-suite",
      updatedAt: "2026-07-06T00:00:00.000Z",
      ...(input as Record<string, unknown>),
    }));
  });

  it("optimizes uploaded gallery files and appends them to gallery urls", async () => {
    const formData = new FormData();
    formData.append("files", new File([Buffer.from("gallery-1")], "gallery-1.jpg", { type: "image/jpeg" }));
    formData.append("files", new File([Buffer.from("gallery-2")], "gallery-2.jpg", { type: "image/jpeg" }));

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/bungalows/bungalow-suite/media/gallery", {
        method: "POST",
        body: formData,
      }),
      {
        params: { id: "bungalow-suite" },
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createCompatibilityBungalowMediaMock).toHaveBeenCalledTimes(2);
    expect(updateBungalowPublicContentMock).toHaveBeenCalledWith(
      "bungalow-suite",
      expect.objectContaining({
        galleryUrls: [
          "/media/bungalows/bungalow-suite/gallery-old.webp",
          "/media/assets/asset_gallery_01/detail.webp",
          "/media/assets/asset_gallery_02/detail.webp",
        ],
        heroAssetId: "asset_hero_01",
        galleryAssetIds: ["asset_gallery_old", "asset_gallery_01", "asset_gallery_02"],
        expectedVersion: 4,
      }),
    );
    expect(body.publicContent.galleryUrls).toHaveLength(3);
  });
});
