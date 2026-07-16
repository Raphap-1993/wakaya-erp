import { z } from "zod";

import {
  HOME_BODY_SIZES,
  HOME_BODY_WEIGHTS,
  HOME_CTA_STYLES,
  HOME_HEADING_SIZES,
  HOME_HEADING_WEIGHTS,
  HOME_INTERNAL_ROUTE_KEYS,
  HOME_SIZE_ADJUST_MAX_PX,
  HOME_SIZE_ADJUST_MIN_PX,
  HOME_WEIGHT_VALUE_MAX,
  HOME_WEIGHT_VALUE_MIN,
  type BodySizePreset,
  type BodyWeightPreset,
  type HeadingSizePreset,
  type HeadingWeightPreset,
  type HomeContentDocument,
  type HomeContentDocumentInput,
  type HomeCtaStyle,
  type HomeInternalRouteKey,
  type HomeVisibleCount,
} from "./types";

const DEFAULT_HOME_EXPERIENCE_IDS = ["exp_01", "exp_06", "exp_07"] as const;

const LEGACY_EXPERIENCE_IDS_BY_TITLE: Record<string, string> = {
  "kayak en el rio": "exp_01",
  "kayak en el río": "exp_01",
  "kayak on the river": "exp_01",
  "full day en la laguna": "exp_02",
  "full day at the lagoon": "exp_02",
  "avistamiento de aves": "exp_03",
  "bird watching": "exp_03",
  "gastronomia local": "exp_04",
  "gastronomía local": "exp_04",
  "local gastronomy": "exp_04",
  "zona de juegos": "exp_05",
  "play area": "exp_05",
  "fotografia en la selva": "exp_06",
  "fotografía en la selva": "exp_06",
  "jungle photography": "exp_06",
  "bodas y celebraciones": "exp_07",
  "bodas & celebraciones": "exp_07",
  "weddings and celebrations": "exp_07",
  "weddings & celebrations": "exp_07",
  "piscina y relax": "exp_08",
  "piscina & relax": "exp_08",
  "pool and relax": "exp_08",
  "pool & relax": "exp_08",
};

const localeTextSchema = z.object({
  en: z.string().trim().min(1, "required"),
  es: z.string().trim().min(1, "required"),
});

const localeTextListSchema = z.object({
  en: z.array(z.string().trim().min(1, "required")).min(1, "required"),
  es: z.array(z.string().trim().min(1, "required")).min(1, "required"),
});

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().length === 0 ? undefined : value;
}

const optionalTrimmedStringSchema: z.ZodType<string | undefined> = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().min(1).optional(),
);

function isSafePublicImageLocation(value: string) {
  if (/^\/media\/[a-zA-Z0-9][a-zA-Z0-9._-]*(?:\/[a-zA-Z0-9][a-zA-Z0-9._-]*)*$/.test(value)) {
    return true;
  }

  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function publicImageLocationSchema(message: "invalid_slide_image" | "invalid_section_image") {
  return z.string().trim().refine(isSafePublicImageLocation, message);
}

const visibleCountSchema = z.union([z.literal(2), z.literal(3), z.literal(4)]);

const headingSizeSchema = z.custom<HeadingSizePreset>(
  (value) => HOME_HEADING_SIZES.includes(value as HeadingSizePreset),
  "invalid_heading_size",
);

const bodySizeSchema = z.custom<BodySizePreset>(
  (value) => HOME_BODY_SIZES.includes(value as BodySizePreset),
  "invalid_body_size",
);

const headingWeightSchema = z.custom<HeadingWeightPreset>(
  (value) => HOME_HEADING_WEIGHTS.includes(value as HeadingWeightPreset),
  "invalid_heading_weight",
);

const bodyWeightSchema = z.custom<BodyWeightPreset>(
  (value) => HOME_BODY_WEIGHTS.includes(value as BodyWeightPreset),
  "invalid_body_weight",
);

const sizeAdjustSchema = z
  .number()
  .min(HOME_SIZE_ADJUST_MIN_PX, "invalid_size_adjust")
  .max(HOME_SIZE_ADJUST_MAX_PX, "invalid_size_adjust");

const weightValueSchema = z
  .number()
  .int("invalid_weight_value")
  .min(HOME_WEIGHT_VALUE_MIN, "invalid_weight_value")
  .max(HOME_WEIGHT_VALUE_MAX, "invalid_weight_value");

const homeTextStyleSchema = z.object({
  headingSize: headingSizeSchema,
  bodySize: bodySizeSchema,
  eyebrowSize: bodySizeSchema.optional(),
  headingSizeAdjustPx: sizeAdjustSchema.optional(),
  bodySizeAdjustPx: sizeAdjustSchema.optional(),
  eyebrowSizeAdjustPx: sizeAdjustSchema.optional(),
  subtitleSize: bodySizeSchema.optional(),
  subtitleSizeAdjustPx: sizeAdjustSchema.optional(),
  labelSize: bodySizeSchema.optional(),
  labelSizeAdjustPx: sizeAdjustSchema.optional(),
  ctaSize: bodySizeSchema.optional(),
  ctaSizeAdjustPx: sizeAdjustSchema.optional(),
  headingWeight: headingWeightSchema.optional(),
  headingWeightValue: weightValueSchema.optional(),
  bodyWeight: bodyWeightSchema.optional(),
  bodyWeightValue: weightValueSchema.optional(),
  eyebrowWeight: bodyWeightSchema.optional(),
  eyebrowWeightValue: weightValueSchema.optional(),
  subtitleWeight: bodyWeightSchema.optional(),
  subtitleWeightValue: weightValueSchema.optional(),
  labelWeight: bodyWeightSchema.optional(),
  labelWeightValue: weightValueSchema.optional(),
  ctaWeight: bodyWeightSchema.optional(),
  ctaWeightValue: weightValueSchema.optional(),
});

const homeNavigationStyleSchema = z.object({
  linkSize: bodySizeSchema.optional(),
  linkSizeAdjustPx: sizeAdjustSchema.optional(),
  linkWeight: bodyWeightSchema.optional(),
  linkWeightValue: weightValueSchema.optional(),
  ctaSize: bodySizeSchema.optional(),
  ctaSizeAdjustPx: sizeAdjustSchema.optional(),
  ctaWeight: bodyWeightSchema.optional(),
  ctaWeightValue: weightValueSchema.optional(),
});

const homeNavigationSchema = z.object({
  style: homeNavigationStyleSchema.optional(),
});

const internalRouteSchema = z.custom<HomeInternalRouteKey>(
  (value) => HOME_INTERNAL_ROUTE_KEYS.includes(value as HomeInternalRouteKey),
  "invalid_internal_route",
);

const ctaStyleSchema = z.custom<HomeCtaStyle>(
  (value) => HOME_CTA_STYLES.includes(value as HomeCtaStyle),
  "invalid_cta_style",
);

const ctaDestinationSchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("internal"),
      value: internalRouteSchema,
    }),
    z.object({
      kind: z.literal("external"),
      value: z.string().trim().min(1, "invalid_cta_destination"),
    }),
    z.object({
      kind: z.literal("phone"),
      value: z.string().trim().min(1, "invalid_cta_destination"),
    }),
    z.object({
      kind: z.literal("whatsapp"),
      value: z.string().trim().min(1, "invalid_cta_destination"),
    }),
  ])
  .superRefine((destination, ctx) => {
    if (destination.kind === "external") {
      try {
        const url = new URL(destination.value);
        if (!["http:", "https:"].includes(url.protocol)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "invalid_cta_destination",
            path: ["value"],
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "invalid_cta_destination",
          path: ["value"],
        });
      }
    }

    if (destination.kind === "phone" && !/^\+?[0-9][0-9\s-]{5,}$/.test(destination.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "invalid_cta_destination",
        path: ["value"],
      });
    }

    if (destination.kind === "whatsapp" && !/^\+?[0-9]{7,15}$/.test(destination.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "invalid_cta_destination",
        path: ["value"],
      });
    }
  });

const homeCtaSchema = z.object({
  id: z.string().trim().min(1, "invalid_cta_id"),
  label: localeTextSchema,
  destination: ctaDestinationSchema,
  style: ctaStyleSchema,
});

const homeSlideContentSchema = z.object({
  eyebrow: z.string().trim().min(1, "required"),
  title: z.string().trim().min(1, "required"),
  subtitle: optionalTrimmedStringSchema,
  copy: optionalTrimmedStringSchema,
  scrollLabel: optionalTrimmedStringSchema,
});

export const homeContentSlideSchema = z.object({
  id: z.string().trim().min(1, "invalid_slide_id"),
  visible: z.boolean(),
  order: z.number().int().positive("invalid_slide_order"),
  image: publicImageLocationSchema("invalid_slide_image"),
  content: z.object({
    en: homeSlideContentSchema,
    es: homeSlideContentSchema,
  }),
  primaryCta: homeCtaSchema,
  secondaryCta: homeCtaSchema.nullish(),
  style: homeTextStyleSchema,
});

const bookingBandSectionSchema = z.object({
  id: z.string().trim().min(1, "invalid_section_id"),
  type: z.literal("booking-band"),
  visible: z.boolean(),
  order: z.number().int().positive("invalid_section_order"),
  style: homeTextStyleSchema,
  content: z.object({
    title: localeTextSchema,
    helper: localeTextSchema,
    checkInLabel: localeTextSchema,
    checkOutLabel: localeTextSchema,
    guestsLabel: localeTextSchema,
    roomLabel: localeTextSchema,
    allCategoriesLabel: localeTextSchema,
    guestOptions: localeTextListSchema,
    submitHint: z.object({
      en: z.string().trim(),
      es: z.string().trim(),
    }),
  }),
  ctas: z.array(homeCtaSchema),
});

const statsSectionSchema = z.object({
  id: z.string().trim().min(1, "invalid_section_id"),
  type: z.literal("stats"),
  visible: z.boolean(),
  order: z.number().int().positive("invalid_section_order"),
  style: homeTextStyleSchema,
  content: z.object({
    items: z.array(
      z.object({
        value: z.string().trim().min(1, "required"),
        label: localeTextSchema,
      }),
    ),
  }),
  ctas: z.array(homeCtaSchema),
});

const storySectionSchema = z.object({
  id: z.string().trim().min(1, "invalid_section_id"),
  type: z.literal("story"),
  visible: z.boolean(),
  order: z.number().int().positive("invalid_section_order"),
  style: homeTextStyleSchema,
  content: z.object({
    eyebrow: localeTextSchema,
    title: localeTextSchema,
    paragraphs: localeTextListSchema,
    quote: localeTextSchema,
    quoteSource: localeTextSchema,
    image: publicImageLocationSchema("invalid_section_image"),
  }),
  ctas: z.array(homeCtaSchema),
});

const bungalowsSectionSchema = z.object({
  id: z.string().trim().min(1, "invalid_section_id"),
  type: z.literal("bungalows"),
  visible: z.boolean(),
  order: z.number().int().positive("invalid_section_order"),
  style: homeTextStyleSchema,
  content: z.object({
    eyebrow: localeTextSchema,
    title: localeTextSchema,
    detailLabel: localeTextSchema,
    visibleCount: visibleCountSchema,
  }),
  ctas: z.array(homeCtaSchema),
});

const quoteBandSectionSchema = z.object({
  id: z.string().trim().min(1, "invalid_section_id"),
  type: z.literal("quote-band"),
  visible: z.boolean(),
  order: z.number().int().positive("invalid_section_order"),
  style: homeTextStyleSchema,
  content: z.object({
    quote: localeTextSchema,
    source: localeTextSchema,
    image: publicImageLocationSchema("invalid_section_image"),
  }),
  ctas: z.array(homeCtaSchema),
});

const legacyExperienceItemSchema = z.object({
  eyebrow: localeTextSchema,
  title: localeTextSchema,
  copy: localeTextSchema,
  price: z.string().trim().min(1, "required"),
  duration: localeTextSchema,
  image: publicImageLocationSchema("invalid_section_image"),
});

const legacyExperiencesSectionSchema = z.object({
  id: z.string().trim().min(1, "invalid_section_id"),
  type: z.literal("experiences"),
  visible: z.boolean(),
  order: z.number().int().positive("invalid_section_order"),
  style: homeTextStyleSchema,
  content: z.object({
    eyebrow: localeTextSchema,
    title: localeTextSchema,
    items: z.array(legacyExperienceItemSchema).min(1, "required"),
  }),
  ctas: z.array(homeCtaSchema),
});

const experiencesSectionSchema = z.object({
  id: z.string().trim().min(1, "invalid_section_id"),
  type: z.literal("experiences"),
  visible: z.boolean(),
  order: z.number().int().positive("invalid_section_order"),
  style: homeTextStyleSchema,
  content: z.object({
    eyebrow: localeTextSchema,
    title: localeTextSchema,
    visibleCount: visibleCountSchema,
  }),
  experienceIds: z.array(z.string().trim().min(1, "required")).min(1, "required"),
  ctas: z.array(homeCtaSchema),
});

const testimonialsSectionSchema = z.object({
  id: z.string().trim().min(1, "invalid_section_id"),
  type: z.literal("testimonials"),
  visible: z.boolean(),
  order: z.number().int().positive("invalid_section_order"),
  style: homeTextStyleSchema,
  content: z.object({
    eyebrow: localeTextSchema,
    title: localeTextSchema,
    items: z.array(
      z.object({
        name: z.string().trim().min(1, "required"),
        origin: localeTextSchema,
        quote: localeTextSchema,
      }),
    ),
  }),
  ctas: z.array(homeCtaSchema),
});

const closingSectionSchema = z.object({
  id: z.string().trim().min(1, "invalid_section_id"),
  type: z.literal("closing-cta"),
  visible: z.boolean(),
  order: z.number().int().positive("invalid_section_order"),
  style: homeTextStyleSchema,
  content: z.object({
    eyebrow: localeTextSchema,
    title: localeTextSchema,
    image: publicImageLocationSchema("invalid_section_image"),
  }),
  ctas: z.array(homeCtaSchema),
});

const homeContentSectionV2Schema = z.discriminatedUnion("type", [
  bookingBandSectionSchema,
  statsSectionSchema,
  storySectionSchema,
  bungalowsSectionSchema,
  quoteBandSectionSchema,
  experiencesSectionSchema,
  testimonialsSectionSchema,
  closingSectionSchema,
]);

export const homeContentSectionSchema = z.union([
  bookingBandSectionSchema,
  statsSectionSchema,
  storySectionSchema,
  bungalowsSectionSchema,
  quoteBandSectionSchema,
  legacyExperiencesSectionSchema,
  experiencesSectionSchema,
  testimonialsSectionSchema,
  closingSectionSchema,
]);

const homeContentDocumentV1Schema = z.object({
  version: z.literal(1),
  slider: z.object({
    autoplayMs: z.number().int().min(2500, "invalid_autoplay_ms").max(12000, "invalid_autoplay_ms"),
    slides: z.array(homeContentSlideSchema).min(1, "visible_slide_required"),
  }),
  sections: z.array(homeContentSectionSchema).min(1, "required"),
});

export const homeContentV2Schema = z
  .object({
    schemaVersion: z.literal(2),
    navigation: homeNavigationSchema.optional(),
    slider: z.object({
      autoplayMs: z.number().int().min(2500, "invalid_autoplay_ms").max(12000, "invalid_autoplay_ms"),
      slides: z.array(homeContentSlideSchema).min(1, "visible_slide_required"),
    }),
    sections: z.array(homeContentSectionV2Schema).min(1, "required"),
  })
  .superRefine((document, ctx) => {
    if (!document.slider.slides.some((slide) => slide.visible)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "visible_slide_required",
        path: ["slider", "slides"],
      });
    }

    const sectionTypes = new Set<string>();
    for (const [index, section] of document.sections.entries()) {
      if (sectionTypes.has(section.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "duplicate_section_type",
          path: ["sections", index, "type"],
        });
      }
      sectionTypes.add(section.type);
    }
  });

function normalizeLegacyLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clampVisibleCount(count: number): HomeVisibleCount {
  if (count <= 2) return 2;
  if (count >= 4) return 4;
  return 3;
}

function resolveLegacyExperienceIds(items: Array<{ title: { es: string; en: string } }>): string[] {
  const ids = items
    .map((item) => {
      const byEs = LEGACY_EXPERIENCE_IDS_BY_TITLE[normalizeLegacyLabel(item.title.es)];
      if (byEs) return byEs;
      return LEGACY_EXPERIENCE_IDS_BY_TITLE[normalizeLegacyLabel(item.title.en)] ?? null;
    })
    .filter((value): value is string => Boolean(value));

  const uniqueIds = Array.from(new Set(ids));
  return uniqueIds.length > 0 ? uniqueIds : [...DEFAULT_HOME_EXPERIENCE_IDS];
}

function migrateSection(
  section: z.infer<typeof homeContentSectionSchema>,
): z.infer<typeof homeContentV2Schema>["sections"][number] {
  if (section.type !== "experiences") {
    return structuredClone(
      section,
    ) as z.infer<typeof homeContentV2Schema>["sections"][number];
  }

  if ("content" in section && "items" in section.content) {
    return {
      id: section.id,
      type: section.type,
      visible: section.visible,
      order: section.order,
      style: structuredClone(section.style),
      content: {
        eyebrow: structuredClone(section.content.eyebrow),
        title: structuredClone(section.content.title),
        visibleCount: clampVisibleCount(section.content.items.length),
      },
      experienceIds: resolveLegacyExperienceIds(section.content.items),
      ctas: structuredClone(section.ctas),
    };
  }

  if ("experienceIds" in section) {
    return {
      ...structuredClone(section),
      experienceIds: Array.from(new Set(section.experienceIds)),
    };
  }

  return {
    id: section.id,
    type: "experiences",
    visible: section.visible,
    order: section.order,
    style: structuredClone(section.style),
    content: {
      eyebrow: structuredClone(section.content.eyebrow),
      title: structuredClone(section.content.title),
      visibleCount: 3,
    },
    experienceIds: [...DEFAULT_HOME_EXPERIENCE_IDS],
    ctas: structuredClone(section.ctas),
  };
}

export function migrateHomeV1ToV2(input: HomeContentDocumentInput): HomeContentDocument {
  if ("schemaVersion" in input && input.schemaVersion === 2) {
    return homeContentV2Schema.parse(input);
  }

  return homeContentV2Schema.parse({
    schemaVersion: 2,
    navigation: "navigation" in input ? structuredClone(input.navigation) : undefined,
    slider: structuredClone(input.slider),
    sections: input.sections.map((section) => migrateSection(section)),
  });
}

const homeContentInputSchema = z.union([homeContentDocumentV1Schema, homeContentV2Schema]);

export const homeContentDocumentSchema = homeContentInputSchema
  .transform((document) => homeContentV2Schema.parse(migrateHomeV1ToV2(document)));
