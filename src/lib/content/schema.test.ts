import { describe, expect, it } from "vitest";

import { experienceSchema } from "./schema";
import type { ExperienceInput } from "./types";

const validExperience: ExperienceInput = {
  id: "exp_01",
  slug: "paseo-laguna",
  visible: true,
  featuredOnHome: true,
  sortOrder: 1,
  iconKey: "lagoon",
  localeContent: {
    es: {
      title: "Paseo por la laguna",
      summary: "Un recorrido corto al atardecer.",
      body: "Explora la laguna con guía local y retorno al lodge.",
      duration: "45 min",
      priceLabel: "S/ 120",
      ctaLabel: "Reservar experiencia",
      included: ["Guía local"],
      recommendations: ["Reservar con anticipación"],
    },
    en: {
      title: "Lagoon tour",
      summary: "A short sunset ride.",
      body: "Explore the lagoon with a local guide and return to the lodge.",
      duration: "45 min",
      priceLabel: "PEN 120",
      ctaLabel: "Book experience",
      included: ["Local guide"],
      recommendations: ["Book in advance"],
    },
  },
  cardAssetId: "asset_card_01",
  heroAssetId: "asset_hero_01",
  galleryAssetIds: ["asset_gallery_01"],
};

describe("experienceSchema", () => {
  it("accepts a complete bilingual experience", () => {
    expect(experienceSchema.parse(validExperience)).toEqual(validExperience);
  });

  it("rejects incomplete english content", () => {
    const incompleteEnglishExperience = structuredClone(validExperience);
    incompleteEnglishExperience.localeContent.en.summary = "";

    expect(() => experienceSchema.parse(incompleteEnglishExperience)).toThrow();
  });

  it("rejects invalid slugs", () => {
    const invalidSlugExperience = structuredClone(validExperience);
    invalidSlugExperience.slug = "Paseo Laguna";

    expect(() => experienceSchema.parse(invalidSlugExperience)).toThrow("invalid_slug");
  });
});
