import { describe, expect, it, vi } from "vitest";

const { getPublishedMock } = vi.hoisted(() => ({ getPublishedMock: vi.fn() }));

vi.mock("./store", () => ({
  corporateContentStore: { getPublished: getPublishedMock },
}));

import { DEFAULT_CORPORATE_CONTENT } from "./default-content";
import { getPublishedCorporateView } from "./public-view";

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
});
