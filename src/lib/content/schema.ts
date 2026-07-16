import { z } from "zod";

const localizedTextSchema = z.string().trim().min(1, "required");
const localizedListSchema = z.array(localizedTextSchema).min(1, "required");

const experienceLocaleContentSchema = z.object({
  title: localizedTextSchema,
  summary: localizedTextSchema,
  body: localizedTextSchema,
  duration: localizedTextSchema,
  priceLabel: localizedTextSchema,
  ctaLabel: localizedTextSchema,
  included: localizedListSchema,
  recommendations: localizedListSchema,
});

export const experienceSchema = z.object({
  id: z.string().trim().min(1, "required"),
  slug: z
    .string()
    .trim()
    .min(1, "required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalid_slug"),
  visible: z.boolean(),
  featuredOnHome: z.boolean(),
  sortOrder: z.coerce.number().int().nonnegative("required"),
  iconKey: localizedTextSchema,
  localeContent: z.object({
    es: experienceLocaleContentSchema,
    en: experienceLocaleContentSchema,
  }),
  cardAssetId: z.string().trim().min(1, "required").nullable(),
  heroAssetId: z.string().trim().min(1, "required").nullable(),
  galleryAssetIds: z.array(z.string().trim().min(1, "required")),
});

const galleryLocaleContentSchema = z.object({
  alt: localizedTextSchema,
  caption: localizedTextSchema,
});

export const galleryItemSchema = z.object({
  id: z.string().trim().min(1, "required"),
  assetId: z.string().trim().min(1, "required"),
  visible: z.boolean(),
  sortOrder: z.coerce.number().int().nonnegative("required"),
  localeContent: z.object({
    es: galleryLocaleContentSchema,
    en: galleryLocaleContentSchema,
  }),
});

const bungalowLocaleContentSchema = z.object({
  displayName: localizedTextSchema,
  displayEyebrow: localizedTextSchema,
  displayDescription: localizedTextSchema,
  displayTagline: localizedTextSchema,
  displayLongDescription: localizedTextSchema,
  displayHighlights: z.array(localizedTextSchema),
  displayAmenities: z.array(localizedTextSchema),
  displayIncluded: z.array(localizedTextSchema),
});

export const bungalowContentUpdateSchema = z.object({
  expectedVersion: z.coerce.number().int().nonnegative("required"),
  featuredOnHome: z.boolean(),
  sortOrder: z.coerce.number().int().nonnegative("required"),
  heroImageUrl: z.string().trim(),
  galleryUrls: z.array(z.string().trim().min(1, "required")),
  nightlyRatePen: z.coerce.number().int().positive("required"),
  areaSqm: z.coerce.number().int().positive("required"),
  localeContent: z.object({
    es: bungalowLocaleContentSchema,
    en: bungalowLocaleContentSchema,
  }),
  heroAssetId: z.string().trim().min(1, "required").nullable().optional(),
  galleryAssetIds: z.array(z.string().trim().min(1, "required")).optional(),
});
