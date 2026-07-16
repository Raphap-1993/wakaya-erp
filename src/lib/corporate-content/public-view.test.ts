import { describe, expect, it, vi } from "vitest";

const { getPublishedMock } = vi.hoisted(() => ({ getPublishedMock: vi.fn() }));

vi.mock("./store", () => ({
  corporateContentStore: { getPublished: getPublishedMock },
}));

import { DEFAULT_CORPORATE_CONTENT } from "./default-document";
import { getPublishedCorporateView, getPublishedPublicSiteView } from "./public-view";

describe("getPublishedCorporateView", () => {
  it("returns the published locale and contact without exposing the internal archive", async () => {
    const document = structuredClone(DEFAULT_CORPORATE_CONTENT);
    document.locales.es.about.storyTitle = "Historia publicada desde ERP";
    getPublishedMock.mockResolvedValue({ revisionVersion: 7, document });

    const view = await getPublishedCorporateView("es");

    expect(view.revisionVersion).toBe(7);
    expect(view.content.about.storyTitle).toBe("Historia publicada desde ERP");
    expect(view.contact.hours.es).toBe("Lun–Dom · 7:00 — 20:00");
    expect(JSON.stringify(view)).not.toContain("legacyPages");
    expect(JSON.stringify(view)).not.toContain("derecho de retención y prenda");
  });

  it("returns the persisted public page copy and asset references", async () => {
    const document = structuredClone(DEFAULT_CORPORATE_CONTENT);
    document.publicSite.locales.es.gallery.hero.title = "Galería publicada";
    document.publicSite.media.galleryHero = { kind: "asset", assetId: "asset-gallery" };
    getPublishedMock.mockResolvedValue({ revisionVersion: 8, document });

    const view = await getPublishedPublicSiteView("es");

    expect(view.content.gallery.hero.title).toBe("Galería publicada");
    expect(view.media.galleryHero).toEqual({ kind: "asset", assetId: "asset-gallery" });
  });
});
