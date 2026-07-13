import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminPageAccessMock,
  getPublishedMock,
  listRevisionsMock,
  getCorporatePublishedMock,
  listCorporateRevisionsMock,
  listExperiencesMock,
  getGalleryMock,
  listBungalowsMock,
  getBungalowPublicContentMock,
  listReservationsMock,
} = vi.hoisted(() => ({
  requireAdminPageAccessMock: vi.fn(),
  getPublishedMock: vi.fn(),
  listRevisionsMock: vi.fn(),
  getCorporatePublishedMock: vi.fn(),
  listCorporateRevisionsMock: vi.fn(),
  listExperiencesMock: vi.fn(),
  getGalleryMock: vi.fn(),
  listBungalowsMock: vi.fn(),
  getBungalowPublicContentMock: vi.fn(),
  listReservationsMock: vi.fn(),
}));

vi.mock("@/app/admin/require-admin-page-access", () => ({
  requireAdminPageAccess: requireAdminPageAccessMock,
}));

vi.mock("@/app/admin/content/content-hub", () => ({
  ContentHub: (props: unknown) => <pre>{JSON.stringify(props, null, 2)}</pre>,
}));

vi.mock("@/lib/home-content/store", () => ({
  homeContentStore: {
    getPublished: getPublishedMock,
    listRevisions: listRevisionsMock,
  },
}));

vi.mock("@/lib/corporate-content/store", () => ({
  corporateContentStore: {
    getPublished: getCorporatePublishedMock,
    listRevisions: listCorporateRevisionsMock,
  },
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
    getBungalowPublicContent: getBungalowPublicContentMock,
    list: listReservationsMock,
  },
}));

import AdminContentPage from "./page";

describe("AdminContentPage", () => {
  beforeEach(() => {
    requireAdminPageAccessMock.mockResolvedValue({
      authenticated: true,
      roles: ["admin"],
      subject: "admin-user-1",
    });
    getPublishedMock.mockResolvedValue({
      revisionVersion: 3,
      document: {
        schemaVersion: 2,
        slider: { autoplayMs: 4000, slides: [] },
        sections: [],
      },
      updatedAt: "2026-07-10T00:00:00.000Z",
      updatedByUserId: "admin-user-1",
      restoredFromVersion: null,
      source: "published",
    });
    listRevisionsMock.mockResolvedValue([]);
    getCorporatePublishedMock.mockResolvedValue({
      revisionVersion: 0,
      document: {
        schemaVersion: 1,
        locales: { es: {}, en: {} },
        contact: {},
        internal: {},
      },
      updatedAt: "1970-01-01T00:00:00.000Z",
      updatedByUserId: null,
      restoredFromVersion: null,
      source: "default",
    });
    listCorporateRevisionsMock.mockResolvedValue([]);
    listExperiencesMock.mockResolvedValue([]);
    getGalleryMock.mockResolvedValue({
      id: "global",
      version: 1,
      updatedBy: "admin-user-1",
      updatedAt: "2026-07-10T00:00:00.000Z",
      items: [],
    });
    listBungalowsMock.mockResolvedValue([
      { id: "bungalow-suite", name: "Bungalow Doble", active: true, capacity: 2, code: "SUITE" },
      { id: "bungalow-family", name: "Bungalow Familiar", active: true, capacity: 4, code: "FAMILY" },
    ]);
    getBungalowPublicContentMock.mockImplementation(async (bungalowId: string) => ({
      bungalowId,
      revisionVersion: 1,
      featuredOnHome: bungalowId === "bungalow-suite",
      sortOrder: bungalowId === "bungalow-suite" ? 1 : 2,
      heroImageUrl: "",
      galleryUrls: [],
      nightlyRatePen: bungalowId === "bungalow-suite" ? 350 : 420,
      areaSqm: bungalowId === "bungalow-suite" ? 55 : 70,
      localeContent: {
        es: {
          displayName: bungalowId === "bungalow-suite" ? "Bungalow Doble" : "Bungalow Familiar",
          displayEyebrow: "Wakaya",
          displayDescription: "Descripción",
          displayTagline: "Tagline",
          displayLongDescription: "Long",
          displayHighlights: ["A"],
          displayAmenities: ["B"],
          displayIncluded: ["C"],
        },
        en: {
          displayName: bungalowId === "bungalow-suite" ? "Double bungalow" : "Family bungalow",
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
      updatedAt: "2026-07-10T00:00:00.000Z",
    }));
    listReservationsMock.mockResolvedValue([
      {
        id: "reservation-double-1",
        number: "RES-9001",
        channel: "web",
        status: "assigned",
        bungalowId: "bungalow-suite",
        bungalowUnitId: "unit_dob_01",
        sourceRequestId: null,
        responsibleId: "user-1",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
        amountTotalCents: 0,
        amountPaidCents: 0,
        paymentStatus: "pending",
        currencyCode: "PEN",
        updatedAt: "2026-07-10T00:00:00.000Z",
        bungalow: null,
      },
    ]);
  });

  it("opens the editorial worklist when no module was requested", async () => {
    const html = renderToStaticMarkup(
      await AdminContentPage({ searchParams: {} }),
    );

    expect(html).toContain("&quot;initialTab&quot;: &quot;overview&quot;");
  });

  it("loads the selected bungalow without embedding the retired individual inventory", async () => {
    const html = renderToStaticMarkup(
      await AdminContentPage({
        searchParams: {
          tab: "bungalows",
          bungalowId: "bungalow-suite",
          availableFrom: "2026-08-10",
          availableTo: "2026-08-12",
        },
      }),
    );

    expect(requireAdminPageAccessMock).toHaveBeenCalledWith("/admin/content", "content:write");
    expect(html).toContain("&quot;initialTab&quot;: &quot;bungalows&quot;");
    expect(html).toContain("&quot;initialBungalowId&quot;: &quot;bungalow-suite&quot;");
    expect(html).toContain("&quot;bungalowId&quot;: &quot;bungalow-suite&quot;");
    expect(html).not.toContain("initialBungalowSnapshot");
    expect(html).not.toContain("unitId");
  });
});
