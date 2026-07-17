import { describe, expect, it } from "vitest";

import { buildHomeHeroStyleVars, buildHomeNavigationStyleVars, buildHomeSectionStyleVars } from "./style-resolver";

describe("home typography style resolver", () => {
  it("lets hero subtitles diverge from body typography", () => {
    const vars = buildHomeHeroStyleVars({
      headingSize: "display",
      bodySize: "small",
      subtitleSize: "large",
      headingWeight: "semibold",
      subtitleWeight: "regular",
      bodyWeight: "medium",
    });

    expect(vars["--hero-subtitle-size"]).toBe("clamp(2rem, 4.2vw, 3.15rem)");
    expect(vars["--hero-subtitle-weight"]).toBe("430");
    expect(vars["--hero-body-size"]).toBe("16px");
    expect(vars["--hero-body-weight"]).toBe("520");
  });

  it("supports fine-grained size and weight overrides for hero copy", () => {
    const vars = buildHomeHeroStyleVars({
      headingSize: "display",
      bodySize: "regular",
      subtitleSize: "regular",
      subtitleSizeAdjustPx: -1.5,
      subtitleWeightValue: 410,
      bodySizeAdjustPx: 2,
      bodyWeightValue: 480,
    });

    expect(vars["--hero-subtitle-size"]).toBe("calc(clamp(1.72rem, 3.7vw, 2.8rem) - 1.5px)");
    expect(vars["--hero-subtitle-weight"]).toBe("410");
    expect(vars["--hero-body-size"]).toBe("calc(18px + 2px)");
    expect(vars["--hero-body-weight"]).toBe("480");
  });

  it("builds section and menu typography variables from the same editorial settings", () => {
    const sectionVars = buildHomeSectionStyleVars({
      headingSize: "large",
      bodySize: "regular",
      labelSize: "small",
      ctaSize: "large",
      headingWeight: "medium",
      bodyWeight: "regular",
      ctaWeight: "semibold",
      headingSizeAdjustPx: 1,
      ctaWeightValue: 610,
    });
    const navVars = buildHomeNavigationStyleVars({
      linkSize: "regular",
      linkWeight: "regular",
      ctaSize: "large",
      ctaWeight: "semibold",
      linkSizeAdjustPx: -1.5,
      linkWeightValue: 400,
      ctaSizeAdjustPx: 1,
    });

    expect(sectionVars["--home-heading-size"]).toBe("calc(calc(clamp(2.4rem, 4vw, 4rem) + 2px) + 1px)");
    expect(sectionVars["--home-cta-size"]).toBe("15px");
    expect(sectionVars["--home-label-size"]).toBe("11px");
    expect(sectionVars["--home-cta-weight"]).toBe("610");
    expect(navVars["--nav-link-size"]).toBe("calc(16.5px - 1.5px)");
    expect(navVars["--nav-link-weight"]).toBe("400");
    expect(navVars["--nav-cta-size"]).toBe("calc(15px + 1px)");
  });
});
