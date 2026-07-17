import type { HomeNavigationStyle, HomeTextStyle } from "./types";

type StyleVars = Record<string, string>;

function formatPxDelta(delta: number) {
  const formatted = Number.isInteger(delta) ? String(delta) : String(delta).replace(/\.0+$/, "");
  return `${formatted}px`;
}

function adjustLength(value: string, delta: number | undefined) {
  if (delta === undefined || delta === 0) {
    return value;
  }

  return `calc(${value} ${delta > 0 ? "+" : "-"} ${formatPxDelta(Math.abs(delta))})`;
}

function resolveWeight(
  weight: HomeTextStyle["headingWeight"] | HomeTextStyle["bodyWeight"] | HomeNavigationStyle["linkWeight"] | undefined,
  exactWeight: number | undefined,
  fallback: number,
) {
  if (typeof exactWeight === "number") {
    return exactWeight;
  }

  switch (weight) {
    case "regular":
      return 430;
    case "medium":
      return 520;
    case "semibold":
      return 590;
    default:
      return fallback;
  }
}

function resolveHeroTitleSize(size: HomeTextStyle["headingSize"] | undefined) {
  switch (size) {
    case "regular":
      return "clamp(3.7rem, 8.2vw, 6.2rem)";
    case "large":
      return "clamp(4.2rem, 9.2vw, 7rem)";
    case "display":
    default:
      return "clamp(4.8rem, 10vw, 7.8rem)";
  }
}

function resolveHeroScale(size: HomeTextStyle["bodySize"] | undefined) {
  switch (size) {
    case "small":
      return {
        eyebrow: "12px",
        subtitle: "clamp(1.45rem, 3vw, 2.35rem)",
        body: "16px",
        label: "12px",
        cta: "13px",
      };
    case "large":
      return {
        eyebrow: "14px",
        subtitle: "clamp(2rem, 4.2vw, 3.15rem)",
        body: "20px",
        label: "13px",
        cta: "15px",
      };
    case "regular":
    default:
      return {
        eyebrow: "13px",
        subtitle: "clamp(1.72rem, 3.7vw, 2.8rem)",
        body: "18px",
        label: "12px",
        cta: "14px",
      };
  }
}

function resolveSectionHeadingScale(size: HomeTextStyle["headingSize"] | undefined) {
  switch (size) {
    case "regular":
      return {
        section: "calc(clamp(2.2rem, 3.8vw, 3.2rem) + 2px)",
        compact: "calc(1.18rem + 2px)",
        card: "calc(1.35rem + 2px)",
        feature: "calc(1.5rem + 2px)",
        stat: "calc(clamp(2rem, 3.6vw, 2.9rem) + 2px)",
        closing: "calc(clamp(2.6rem, 5.2vw, 4.8rem) + 2px)",
      };
    case "display":
      return {
        section: "calc(clamp(2.8rem, 4.6vw, 4.6rem) + 2px)",
        compact: "calc(1.5rem + 2px)",
        card: "calc(1.65rem + 2px)",
        feature: "calc(1.85rem + 2px)",
        stat: "calc(clamp(2.5rem, 4.4vw, 3.6rem) + 2px)",
        closing: "calc(clamp(3.3rem, 6.5vw, 6.2rem) + 2px)",
      };
    case "large":
    default:
      return {
        section: "calc(clamp(2.4rem, 4vw, 4rem) + 2px)",
        compact: "calc(1.35rem + 2px)",
        card: "calc(1.5rem + 2px)",
        feature: "calc(1.7rem + 2px)",
        stat: "calc(clamp(2.2rem, 4vw, 3.2rem) + 2px)",
        closing: "calc(clamp(3rem, 6vw, 5.8rem) + 2px)",
      };
  }
}

function resolveSectionScale(size: HomeTextStyle["bodySize"] | undefined) {
  switch (size) {
    case "small":
      return {
        eyebrow: "12px",
        body: "15px",
        compact: "13px",
        quote: "17px",
        input: "15px",
        label: "11px",
        fact: "11px",
        cta: "13px",
      };
    case "large":
      return {
        eyebrow: "14px",
        body: "19px",
        compact: "15px",
        quote: "20px",
        input: "18px",
        label: "13px",
        fact: "13px",
        cta: "15px",
      };
    case "regular":
    default:
      return {
        eyebrow: "13px",
        body: "17px",
        compact: "14px",
        quote: "18px",
        input: "16px",
        label: "12px",
        fact: "12px",
        cta: "14px",
      };
  }
}

function resolveNavigationScale(size: HomeNavigationStyle["linkSize"] | HomeNavigationStyle["ctaSize"] | undefined) {
  switch (size) {
    case "small":
      return {
        link: "16px",
        mobileLink: "1.7rem",
        locale: "12px",
        cta: "13px",
      };
    case "large":
      return {
        link: "19px",
        mobileLink: "2.1rem",
        locale: "13px",
        cta: "15px",
      };
    case "regular":
    default:
      return {
        link: "16.5px",
        mobileLink: "1.9rem",
        locale: "12.5px",
        cta: "14px",
      };
  }
}

export function buildHomeHeroStyleVars(style?: HomeTextStyle): StyleVars {
  const eyebrowScale = resolveHeroScale(style?.eyebrowSize ?? style?.labelSize ?? style?.bodySize);
  const subtitleScale = resolveHeroScale(style?.subtitleSize ?? style?.bodySize);
  const bodyScale = resolveHeroScale(style?.bodySize);
  const labelScale = resolveHeroScale(style?.labelSize ?? style?.bodySize);
  const ctaScale = resolveHeroScale(style?.ctaSize ?? style?.labelSize ?? style?.bodySize);

  return {
    "--hero-title-size": adjustLength(resolveHeroTitleSize(style?.headingSize), style?.headingSizeAdjustPx),
    "--hero-title-weight": String(resolveWeight(style?.headingWeight, style?.headingWeightValue, 590)),
    "--hero-eyebrow-size": adjustLength(eyebrowScale.eyebrow, style?.eyebrowSizeAdjustPx),
    "--hero-eyebrow-weight": String(resolveWeight(style?.eyebrowWeight ?? style?.bodyWeight, style?.eyebrowWeightValue, 520)),
    "--hero-subtitle-size": adjustLength(subtitleScale.subtitle, style?.subtitleSizeAdjustPx),
    "--hero-subtitle-weight": String(resolveWeight(style?.subtitleWeight ?? style?.headingWeight, style?.subtitleWeightValue, 560)),
    "--hero-body-size": adjustLength(bodyScale.body, style?.bodySizeAdjustPx),
    "--hero-body-weight": String(resolveWeight(style?.bodyWeight, style?.bodyWeightValue, 500)),
    "--hero-label-size": adjustLength(labelScale.label, style?.labelSizeAdjustPx),
    "--hero-label-weight": String(resolveWeight(style?.labelWeight ?? style?.bodyWeight, style?.labelWeightValue, 520)),
    "--hero-cta-size": adjustLength(ctaScale.cta, style?.ctaSizeAdjustPx),
    "--hero-cta-weight": String(resolveWeight(style?.ctaWeight ?? style?.headingWeight, style?.ctaWeightValue, 560)),
  };
}

export function buildHomeSectionStyleVars(style?: HomeTextStyle): StyleVars {
  const headingScale = resolveSectionHeadingScale(style?.headingSize);
  const eyebrowScale = resolveSectionScale(style?.eyebrowSize ?? style?.labelSize ?? style?.bodySize);
  const subtitleScale = resolveSectionScale(style?.subtitleSize ?? style?.bodySize);
  const bodyScale = resolveSectionScale(style?.bodySize);
  const labelScale = resolveSectionScale(style?.labelSize ?? style?.bodySize);
  const ctaScale = resolveSectionScale(style?.ctaSize ?? style?.labelSize ?? style?.bodySize);

  return {
    "--home-eyebrow-size": adjustLength(eyebrowScale.eyebrow, style?.eyebrowSizeAdjustPx),
    "--home-eyebrow-weight": String(resolveWeight(style?.eyebrowWeight ?? style?.bodyWeight, style?.eyebrowWeightValue, 520)),
    "--home-heading-size": adjustLength(headingScale.section, style?.headingSizeAdjustPx),
    "--home-heading-compact-size": adjustLength(headingScale.compact, style?.headingSizeAdjustPx),
    "--home-heading-card-size": adjustLength(headingScale.card, style?.headingSizeAdjustPx),
    "--home-heading-feature-size": adjustLength(headingScale.feature, style?.headingSizeAdjustPx),
    "--home-heading-stat-size": adjustLength(headingScale.stat, style?.headingSizeAdjustPx),
    "--home-heading-closing-size": adjustLength(headingScale.closing, style?.headingSizeAdjustPx),
    "--home-heading-weight": String(resolveWeight(style?.headingWeight, style?.headingWeightValue, 590)),
    "--home-subtitle-size": adjustLength(subtitleScale.quote, style?.subtitleSizeAdjustPx),
    "--home-subtitle-weight": String(resolveWeight(style?.subtitleWeight ?? style?.headingWeight, style?.subtitleWeightValue, 560)),
    "--home-body-size": adjustLength(bodyScale.body, style?.bodySizeAdjustPx),
    "--home-body-compact-size": adjustLength(bodyScale.compact, style?.bodySizeAdjustPx),
    "--home-body-weight": String(resolveWeight(style?.bodyWeight, style?.bodyWeightValue, 500)),
    "--home-label-size": adjustLength(labelScale.label, style?.labelSizeAdjustPx),
    "--home-label-strong-size": adjustLength(labelScale.fact, style?.labelSizeAdjustPx),
    "--home-label-weight": String(resolveWeight(style?.labelWeight ?? style?.bodyWeight, style?.labelWeightValue, 520)),
    "--home-cta-size": adjustLength(ctaScale.cta, style?.ctaSizeAdjustPx),
    "--home-cta-weight": String(resolveWeight(style?.ctaWeight ?? style?.headingWeight, style?.ctaWeightValue, 560)),
    "--home-input-size": adjustLength(bodyScale.input, style?.bodySizeAdjustPx),
  };
}

export function buildHomeNavigationStyleVars(style?: HomeNavigationStyle): StyleVars {
  const linkScale = resolveNavigationScale(style?.linkSize);
  const ctaScale = resolveNavigationScale(style?.ctaSize ?? style?.linkSize);

  return {
    "--nav-link-size": adjustLength(linkScale.link, style?.linkSizeAdjustPx),
    "--nav-link-mobile-size": adjustLength(linkScale.mobileLink, style?.linkSizeAdjustPx),
    "--nav-link-weight": String(resolveWeight(style?.linkWeight, style?.linkWeightValue, 430)),
    "--nav-locale-size": adjustLength(linkScale.locale, style?.linkSizeAdjustPx),
    "--nav-locale-weight": String(resolveWeight(style?.linkWeight, style?.linkWeightValue, 520)),
    "--nav-cta-size": adjustLength(ctaScale.cta, style?.ctaSizeAdjustPx),
    "--nav-cta-weight": String(resolveWeight(style?.ctaWeight ?? style?.linkWeight, style?.ctaWeightValue, 560)),
  };
}
