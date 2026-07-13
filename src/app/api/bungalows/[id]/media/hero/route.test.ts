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

describe("POST /api/bungalows/[id]/media/hero", () => {
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
      heroImageUrl: "https://old.example/hero.jpg",
      galleryUrls: ["https://old.example/gallery-1.jpg"],
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
      heroAssetId: "asset_hero_old",
      galleryAssetIds: ["asset_gallery_old"],
      revisionVersion: 2,
    });
    createCompatibilityBungalowMediaMock.mockResolvedValue({
      asset: {
        id: "asset_hero_01",
      },
      media: {
        url: "/media/assets/asset_hero_01/heroDesktop.webp",
        width: 1600,
        height: 1067,
        bytes: 248000,
        format: "webp",
        assetId: "asset_hero_01",
      },
    });
    updateBungalowPublicContentMock.mockImplementation(async (_id: string, input: unknown) => ({
      bungalowId: "bungalow-suite",
      updatedAt: "2026-07-06T00:00:00.000Z",
      ...(input as Record<string, unknown>),
    }));
  });

  it("stores an optimized hero image and updates the bungalow public content", async () => {
    const formData = new FormData();
    formData.set("file", new File([Buffer.from("fake-image")], "hero.jpg", { type: "image/jpeg" }));

    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/bungalows/bungalow-suite/media/hero", {
        method: "POST",
        body: formData,
      }),
      {
        params: { id: "bungalow-suite" },
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createCompatibilityBungalowMediaMock).toHaveBeenCalledTimes(1);
    expect(updateBungalowPublicContentMock).toHaveBeenCalledWith(
      "bungalow-suite",
      expect.objectContaining({
        heroImageUrl: "/media/assets/asset_hero_01/heroDesktop.webp",
        heroAssetId: "asset_hero_01",
        galleryAssetIds: ["asset_gallery_old"],
        expectedVersion: 2,
      }),
    );
    expect(body.publicContent.heroImageUrl).toBe("/media/assets/asset_hero_01/heroDesktop.webp");
  });
});
