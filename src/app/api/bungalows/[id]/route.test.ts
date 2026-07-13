import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requirePermissionMock,
  getBungalowMock,
  getBungalowPublicContentMock,
  updateBungalowMock,
  updateBungalowPublicContentMock,
} = vi.hoisted(() => ({
  requirePermissionMock: vi.fn(),
  getBungalowMock: vi.fn(),
  getBungalowPublicContentMock: vi.fn(),
  updateBungalowMock: vi.fn(),
  updateBungalowPublicContentMock: vi.fn(),
}));

vi.mock("@/middleware/authn", () => ({
  requirePermission: requirePermissionMock,
}));

vi.mock("@/lib/reservations/store", () => ({
  reservationStore: {
    getBungalow: getBungalowMock,
    getBungalowPublicContent: getBungalowPublicContentMock,
    updateBungalow: updateBungalowMock,
    updateBungalowPublicContent: updateBungalowPublicContentMock,
  },
}));

const PUBLIC_CONTENT_PAYLOAD = {
  featuredOnHome: true,
  sortOrder: 1,
  heroImageUrl: "https://cdn.wakaya.test/bungalows/familiar/hero.jpg",
  heroAssetId: "asset_hero_familiar",
  galleryAssetIds: ["asset_gallery_familiar_01", "asset_gallery_familiar_02"],
  galleryUrls: [
    "https://cdn.wakaya.test/bungalows/familiar/gallery-1.jpg",
    "https://cdn.wakaya.test/bungalows/familiar/gallery-2.jpg",
  ],
  nightlyRatePen: 350,
  areaSqm: 55,
  localeContent: {
    es: {
      displayName: "Bungalow Familiar",
      displayEyebrow: "Wakaya Ecolodge · Pucallpa",
      displayDescription: "Dos habitaciones independientes y terraza amplia.",
      displayTagline: "El bungalow ideal para familias",
      displayLongDescription: "Una categoría amplia para familias con niños y estadías largas.",
      displayHighlights: ["Dos dormitorios", "Vista a piscina"],
      displayAmenities: ["WiFi", "Aire acondicionado"],
      displayIncluded: ["Desayuno", "Toallas"],
    },
    en: {
      displayName: "Family Bungalow",
      displayEyebrow: "Wakaya Ecolodge · Pucallpa",
      displayDescription: "Two separate bedrooms and a wide terrace.",
      displayTagline: "The ideal bungalow for families",
      displayLongDescription: "A spacious category for families and longer stays.",
      displayHighlights: ["Two bedrooms", "Pool view"],
      displayAmenities: ["WiFi", "Air conditioning"],
      displayIncluded: ["Breakfast", "Towels"],
    },
  },
} as const;

async function loadRoute() {
  return import("./route");
}

describe("GET /api/bungalows/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getBungalowMock.mockReset();
    getBungalowPublicContentMock.mockReset();
    updateBungalowMock.mockReset();
    updateBungalowPublicContentMock.mockReset();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("returns one persisted bungalow", async () => {
    getBungalowMock.mockResolvedValue({
      id: "bungalow-familiar",
      code: "FAMILIAR",
      name: "Bungalow Familiar",
      active: true,
      capacity: 4,
    });
    getBungalowPublicContentMock.mockResolvedValue({
      bungalowId: "bungalow-familiar",
      updatedAt: "2026-07-02T12:00:00.000Z",
      ...PUBLIC_CONTENT_PAYLOAD,
    });

    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/bungalows/bungalow-familiar"), {
      params: { id: "bungalow-familiar" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.bungalow.name).toBe("Bungalow Familiar");
    expect(body.bungalow.publicContent.heroImageUrl).toBe(PUBLIC_CONTENT_PAYLOAD.heroImageUrl);
    expect(body.bungalow.publicContent.localeContent.es.displayEyebrow).toBe("Wakaya Ecolodge · Pucallpa");
  });
});

describe("PUT /api/bungalows/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requirePermissionMock.mockReset();
    getBungalowMock.mockReset();
    getBungalowPublicContentMock.mockReset();
    updateBungalowMock.mockReset();
    updateBungalowPublicContentMock.mockReset();
    requirePermissionMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
  });

  it("updates one persisted bungalow", async () => {
    getBungalowPublicContentMock.mockResolvedValue({
      bungalowId: "bungalow-familiar",
      updatedAt: "2026-07-02T12:00:00.000Z",
      ...PUBLIC_CONTENT_PAYLOAD,
    });
    updateBungalowMock.mockResolvedValue({
      id: "bungalow-familiar",
      code: "FAMILIAR",
      name: "Bungalow Familiar Premium",
      active: false,
      capacity: 5,
    });
    updateBungalowPublicContentMock.mockResolvedValue({
      bungalowId: "bungalow-familiar",
      updatedAt: "2026-07-02T12:00:00.000Z",
      ...PUBLIC_CONTENT_PAYLOAD,
      featuredOnHome: false,
      nightlyRatePen: 420,
    });

    const { PUT } = await loadRoute();
    const response = await PUT(
      new Request("http://localhost/api/bungalows/bungalow-familiar", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: "FAMILIAR",
          name: "Bungalow Familiar Premium",
          active: false,
          capacity: 5,
          publicContent: {
            ...PUBLIC_CONTENT_PAYLOAD,
            featuredOnHome: false,
            nightlyRatePen: 420,
          },
        }),
      }),
      {
        params: { id: "bungalow-familiar" },
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateBungalowMock).toHaveBeenCalledWith("bungalow-familiar", {
      code: "FAMILIAR",
      name: "Bungalow Familiar Premium",
      active: false,
      capacity: 5,
    });
    expect(updateBungalowPublicContentMock).toHaveBeenCalledWith("bungalow-familiar", {
      ...PUBLIC_CONTENT_PAYLOAD,
      featuredOnHome: false,
      nightlyRatePen: 420,
    });
    expect(body.bungalow.active).toBe(false);
    expect(body.bungalow.publicContent.featuredOnHome).toBe(false);
  });
});
