import { beforeEach, describe, expect, it, vi } from "vitest";

const { getExperienceBySlugMock, listExperiencesMock, getGalleryMock } = vi.hoisted(() => ({
  getExperienceBySlugMock: vi.fn(),
  listExperiencesMock: vi.fn(),
  getGalleryMock: vi.fn(),
}));

vi.mock("./store", () => ({
  contentStore: {
    getExperienceBySlug: getExperienceBySlugMock,
    listExperiences: listExperiencesMock,
    getGallery: getGalleryMock,
  },
}));

import { getLocalizedPublicExperienceBySlug, listLocalizedPublicExperiences } from "./public-content";

describe("public-content fallback", () => {
  beforeEach(() => {
    getExperienceBySlugMock.mockReset();
    listExperiencesMock.mockReset();
    getGalleryMock.mockReset();
  });

  it("falls back to the approved Full Day service when persisted content is unavailable", async () => {
    getExperienceBySlugMock.mockResolvedValue(null);

    await expect(getLocalizedPublicExperienceBySlug("es", "paseo-laguna")).resolves.toMatchObject({
      slug: "paseo-laguna",
      title: "Full Day",
      ctaLabel: "Consultar servicio",
    });
  });

  it("publishes exactly Wakaya's five approved services in both locales", async () => {
    listExperiencesMock.mockRejectedValue(new Error("content_store_not_ready"));

    await expect(listLocalizedPublicExperiences("es")).resolves.toMatchObject([
      { title: "Bodas" },
      { title: "Eventos Corporativos" },
      { title: "Full Day" },
      { title: "Cenas Románticas" },
      { title: "Restaurante" },
    ]);
    await expect(listLocalizedPublicExperiences("en")).resolves.toMatchObject([
      { title: "Weddings" },
      { title: "Corporate Events" },
      { title: "Full Day" },
      { title: "Romantic Dinners" },
      { title: "Restaurant" },
    ]);
  });
});
