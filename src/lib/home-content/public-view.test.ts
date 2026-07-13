import { describe, expect, it } from "vitest";

import { DEFAULT_HOME_CONTENT } from "./default-content";
import { toLocalizedHomeView } from "./public-view";

describe("toLocalizedHomeView", () => {
  it("returns ordered visible slides and sections for the requested locale", () => {
    const view = toLocalizedHomeView(DEFAULT_HOME_CONTENT, "es");

    expect(view.slides.map((slide) => slide.id)).toEqual([
      "slide-hero",
      "slide-bungalows",
      "slide-closing",
    ]);
    expect(view.sections.map((section) => section.type)).toEqual([
      "booking-band",
      "story",
      "bungalows",
      "quote-band",
      "experiences",
      "testimonials",
      "closing-cta",
    ]);
    expect(view.slides[0].primaryCta.href).toBe("/es/contact");
    expect(view.sections[1].ctas[0]?.href).toBe("/es/about");
    const experiencesSection = view.sections.find((section) => section.type === "experiences");
    expect(experiencesSection?.content).toMatchObject({
      visibleCount: 3,
      experienceIds: ["exp_07", "exp_09", "exp_02"],
    });
  });

  it("filters hidden sections and resolves safe public hrefs", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    input.slider.slides[1].visible = false;
    input.sections[4].visible = false;
    input.sections[7].ctas[0].destination = {
      kind: "phone",
      value: "+51987654321",
    };

    const view = toLocalizedHomeView(input, "en");

    expect(view.slides.map((slide) => slide.id)).toEqual(["slide-hero", "slide-closing"]);
    expect(view.sections.map((section) => section.type)).toEqual([
      "booking-band",
      "story",
      "bungalows",
      "experiences",
      "testimonials",
      "closing-cta",
    ]);
    expect(view.sections.at(-1)?.ctas[0]?.href).toBe("tel:+51987654321");
  });

  it("keeps published navigation typography settings available to the public shell", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    input.navigation = {
      style: {
        linkSize: "small",
        linkWeight: "regular",
        ctaSize: "large",
        ctaWeight: "semibold",
      },
    };

    const view = toLocalizedHomeView(input, "es");

    expect(view.navigation).toEqual(input.navigation);
  });
});
