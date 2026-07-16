import { z } from "zod";

import { DEFAULT_PUBLIC_SITE_CONTENT } from "@/app/[locale]/public-site-content";
import { DEFAULT_PUBLIC_SITE_MEDIA } from "./public-site-media";
import type {
  CorporateContentDocument,
  CorporatePublicSiteContent,
  ResolvedCorporateContentDocument,
} from "./types";
import { CORPORATE_REQUIRED_TERM_SECTION_IDS } from "./types";

const requiredText = z.string().trim().min(1, "required");

const pageHeroSchema = z.object({
  eyebrow: requiredText,
  title: requiredText,
  copy: requiredText,
});

const policySectionSchema = z.object({
  id: requiredText.regex(/^[a-z0-9][a-z0-9-]*$/, "invalid_section_id"),
  title: requiredText,
  copy: requiredText,
});

function requireUniqueIds(
  items: Array<{ id: string }>,
  context: z.RefinementCtx,
) {
  const ids = new Set<string>();
  items.forEach((item, index) => {
    if (ids.has(item.id)) {
      context.addIssue({
        code: "custom",
        message: "duplicate_section_id",
        path: [index, "id"],
      });
    }
    ids.add(item.id);
  });
}

const aboutSchema = z.object({
  metaTitle: requiredText,
  metaDescription: requiredText,
  hero: pageHeroSchema,
  storyDate: requiredText,
  storyTitle: requiredText,
  storyLead: requiredText,
  storyParagraphs: z.array(requiredText).min(1, "required"),
  highlights: z.array(requiredText).min(1, "required"),
  purposeTitle: requiredText,
  purposeCopy: requiredText,
  meaningTitle: requiredText,
  meaningCopy: requiredText,
  valuesTitle: requiredText,
  valuesLead: requiredText,
  values: z.array(z.object({ title: requiredText, copy: requiredText })).min(1, "required"),
  ctaTitle: requiredText,
  ctaCopy: requiredText,
  primaryCtaLabel: requiredText,
  secondaryCtaLabel: requiredText,
});

const faqSchema = z.object({
  metaTitle: requiredText,
  metaDescription: requiredText,
  hero: pageHeroSchema,
  introTitle: requiredText,
  introCopy: z.string(),
  items: z.array(z.object({
    question: requiredText,
    answer: requiredText,
    steps: z.array(requiredText).optional(),
  })).min(1, "required"),
  ctaTitle: requiredText,
  ctaCopy: requiredText,
  ctaLabel: requiredText,
});

const testimonialsSchema = z.object({
  metaTitle: requiredText,
  metaDescription: requiredText,
  hero: pageHeroSchema,
  introTitle: requiredText,
  introCopy: z.string(),
  items: z.array(z.object({
    author: requiredText,
    country: requiredText,
    quote: requiredText,
    image: requiredText,
  })).min(1, "required"),
});

const policiesSchema = z.object({
  metaTitle: requiredText,
  metaDescription: requiredText,
  hero: pageHeroSchema,
  introTitle: requiredText,
  introCopy: z.string(),
  termsTitle: requiredText,
  termsCopy: requiredText,
  termsSections: z.array(policySectionSchema).min(1, "required").superRefine(requireUniqueIds),
  privacyTitle: requiredText,
  privacyCopy: requiredText,
  privacySections: z.array(policySectionSchema).min(1, "required").superRefine(requireUniqueIds),
  ctaTitle: requiredText,
  ctaCopy: requiredText,
  ctaLabel: requiredText,
}).superRefine((policies, context) => {
  const termIds = new Set(policies.termsSections.map((section) => section.id));
  CORPORATE_REQUIRED_TERM_SECTION_IDS.forEach((id) => {
    if (!termIds.has(id)) {
      context.addIssue({
        code: "custom",
        message: "required_policy_anchor",
        path: ["termsSections"],
      });
    }
  });

  const allIds = new Set(termIds);
  policies.privacySections.forEach((section, index) => {
    if (allIds.has(section.id)) {
      context.addIssue({
        code: "custom",
        message: "duplicate_section_id",
        path: ["privacySections", index, "id"],
      });
    }
    allIds.add(section.id);
  });
});

const localeContentSchema = z.object({
  about: aboutSchema,
  faq: faqSchema,
  testimonials: testimonialsSchema,
  policies: policiesSchema,
});

const localizedTextSchema = z.object({ es: requiredText, en: requiredText });

function hasRequiredPublicShape(value: unknown, template: unknown): boolean {
  if (typeof template === "string") {
    return typeof value === "string" &&
      (template.trim().length === 0 || value.trim().length > 0);
  }
  if (typeof template === "number" || typeof template === "boolean") {
    return typeof value === typeof template;
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(value)) return false;
    if (template.length === 0) return true;
    return value.length > 0 && value.every((item) => hasRequiredPublicShape(item, template[0]));
  }
  if (template && typeof template === "object") {
    if (!value || typeof value !== "object") return false;
    return Object.entries(template).every(([key, nestedTemplate]) =>
      hasRequiredPublicShape((value as Record<string, unknown>)[key], nestedTemplate),
    );
  }
  return true;
}

const publicSiteSchema = z.custom<CorporatePublicSiteContent>(
  (value) => {
    if (!value || typeof value !== "object" || !("locales" in value) || !("media" in value)) return false;
    const candidate = value as CorporatePublicSiteContent;
    const mediaSlots = Object.keys(DEFAULT_PUBLIC_SITE_MEDIA);
    const mediaValid = mediaSlots.every((slot) => {
      const reference = candidate.media?.[slot as keyof typeof DEFAULT_PUBLIC_SITE_MEDIA];
      return reference?.kind === "none" ||
        (reference?.kind === "asset" && reference.assetId.trim().length > 0) ||
        (reference?.kind === "external" && reference.url.trim().length > 0);
    });
    return mediaValid &&
      hasRequiredPublicShape(candidate.locales?.es, DEFAULT_PUBLIC_SITE_CONTENT.es) &&
      hasRequiredPublicShape(candidate.locales?.en, DEFAULT_PUBLIC_SITE_CONTENT.en);
  },
  "invalid_public_site_content",
);

export const corporateContentDocumentSchema: z.ZodType<CorporateContentDocument> = z.object({
  schemaVersion: z.literal(1),
  locales: z.object({ es: localeContentSchema, en: localeContentSchema }),
  publicSite: publicSiteSchema.optional(),
  contact: z.object({
    address: localizedTextSchema,
    locationNote: localizedTextSchema,
    phones: z.array(requiredText.regex(/^\+[0-9][0-9\s]{7,18}$/, "invalid_phone")).min(1, "required"),
    whatsapp: requiredText.regex(/^\+[0-9][0-9\s]{7,18}$/, "invalid_phone"),
    reservationsEmail: requiredText.email("invalid_email"),
    privacyEmail: requiredText.email("invalid_email"),
    hours: localizedTextSchema,
  }),
  internal: z.object({
    sourceLabel: requiredText,
    sourceUrls: z.array(requiredText.url("invalid_source_url")).min(1, "required"),
    notes: z.array(requiredText),
    legacyPages: z.array(z.object({
      slug: requiredText,
      title: requiredText,
      url: requiredText.url("invalid_source_url"),
      headings: z.array(requiredText),
      paragraphs: z.array(requiredText),
    })).min(1, "required"),
  }),
});

export function parseStoredCorporateContentDocument(
  input: CorporateContentDocument,
): ResolvedCorporateContentDocument {
  const migrated = structuredClone(input) as CorporateContentDocument & {
    publicSite?: CorporateContentDocument["publicSite"];
  };

  if (!migrated.publicSite) {
    migrated.publicSite = {
      locales: structuredClone(DEFAULT_PUBLIC_SITE_CONTENT),
      media: structuredClone(DEFAULT_PUBLIC_SITE_MEDIA),
    };
  } else if (!migrated.publicSite.media) {
    migrated.publicSite.media = structuredClone(DEFAULT_PUBLIC_SITE_MEDIA);
  }

  (["es", "en"] as const).forEach((locale) => {
    const sections = migrated.locales[locale].policies.termsSections;
    if (!sections.some((section) => section.id === "payments")) {
      const legacyPayments = sections.find((section) => section.id === "rates-payments");
      if (legacyPayments) {
        legacyPayments.id = "payments";
      }
    }
  });

  return corporateContentDocumentSchema.parse(migrated) as ResolvedCorporateContentDocument;
}
