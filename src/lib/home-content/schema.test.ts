import { describe, expect, it } from "vitest";

import { DEFAULT_HOME_CONTENT } from "./default-content";
import { homeContentDocumentSchema, homeContentV2Schema, migrateHomeV1ToV2 } from "./schema";

describe("homeContentDocumentSchema", () => {
  it("accepts the bilingual default home v2", () => {
    expect(homeContentDocumentSchema.parse(DEFAULT_HOME_CONTENT)).toEqual(DEFAULT_HOME_CONTENT);
  });

  it("migrates a legacy v1 experiences section into v2 ids", () => {
    const legacyInput = {
      version: 1 as const,
      slider: structuredClone(DEFAULT_HOME_CONTENT.slider),
      sections: DEFAULT_HOME_CONTENT.sections.map((section) => {
        if (section.type !== "experiences") {
          return structuredClone(section);
        }

        return {
          ...section,
          content: {
            eyebrow: structuredClone(section.content.eyebrow),
            title: structuredClone(section.content.title),
            items: [
              {
                eyebrow: { es: "2-3 h", en: "2-3 h" },
                title: { es: "Kayak en el rio", en: "Kayak on the river" },
                copy: { es: "Legacy ES", en: "Legacy EN" },
                price: "S/ 45",
                duration: { es: "Kayak", en: "Kayak" },
                image: "https://example.com/legacy.webp",
              },
            ],
          },
        };
      }),
    };

    const migrated = migrateHomeV1ToV2(legacyInput);
    const experiencesSection = migrated.sections.find((section) => section.type === "experiences");

    expect(homeContentV2Schema.parse(migrated).schemaVersion).toBe(2);
    expect(experiencesSection?.experienceIds).toEqual(["exp_01"]);
    expect(experiencesSection?.content.visibleCount).toBe(2);
  });

  it("rejects a home without a visible slide", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    input.slider.slides.forEach((slide) => {
      slide.visible = false;
    });

    expect(() => homeContentDocumentSchema.parse(input)).toThrow("visible_slide_required");
  });

  it("rejects unsafe CTA protocols", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    input.slider.slides[0].primaryCta.destination = {
      kind: "external",
      value: "javascript:alert(1)",
    };

    expect(() => homeContentDocumentSchema.parse(input)).toThrow("invalid_cta_destination");
  });

  it("rejects display typography for body copy", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    (input.sections[0].style as { headingSize: string; bodySize: string }).bodySize = "display";

    expect(() => homeContentDocumentSchema.parse(input)).toThrow("invalid_body_size");
  });

  it("accepts safe fine-grained typography overrides for slider, sections and menu", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    input.navigation = {
      style: {
        linkSize: "regular",
        linkSizeAdjustPx: -1.5,
        linkWeight: "regular",
        linkWeightValue: 400,
        ctaSize: "regular",
        ctaSizeAdjustPx: 1,
        ctaWeight: "semibold",
        ctaWeightValue: 580,
      },
    };
    input.slider.slides[0].style.subtitleSizeAdjustPx = -1.5;
    input.slider.slides[0].style.subtitleWeightValue = 410;
    input.sections[0].style.bodySizeAdjustPx = 2;
    input.sections[0].style.bodyWeightValue = 480;

    expect(homeContentDocumentSchema.parse(input)).toEqual(input);
  });

  it("rejects out-of-range fine-grained typography overrides", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    input.navigation = {
      style: {
        linkSize: "regular",
        linkWeight: "regular",
        linkWeightValue: 200,
      },
    };

    expect(() => homeContentDocumentSchema.parse(input)).toThrow("invalid_weight_value");
  });

  it("accepts empty optional slide fields and normalizes them away", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    input.slider.slides[1].content.es.subtitle = "";
    input.slider.slides[1].content.es.copy = "";
    input.slider.slides[1].content.es.scrollLabel = "   ";

    const parsed = homeContentDocumentSchema.parse(input);

    expect(parsed.slider.slides[1].content.es.subtitle).toBeUndefined();
    expect(parsed.slider.slides[1].content.es.copy).toBeUndefined();
    expect(parsed.slider.slides[1].content.es.scrollLabel).toBeUndefined();
  });
});
