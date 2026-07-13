import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";

import { DEFAULT_PUBLIC_EXPERIENCES, findDefaultExperienceBySlug } from "./default-experiences";
import { getLocalizedDefaultGallery } from "./default-gallery";
import { contentStore } from "./store";
import type { ExperienceRecord, GalleryPublication } from "./types";

export type PublicExperience = {
  id: string;
  slug: string;
  featuredOnHome: boolean;
  sortOrder: number;
  title: string;
  summary: string;
  body: string;
  duration: string;
  priceLabel: string;
  ctaLabel: string;
  icon: string;
  coverImage: string;
  heroImage: string;
  galleryImages: string[];
  included: string[];
  recommendations: string[];
};

export type PublicGalleryItem = {
  id: string;
  image: string;
  alt: string;
  caption: string;
  sortOrder: number;
};

const EXPERIENCE_ICON_MAP: Record<string, string> = {
  experience: "✦",
  spark: "✦",
  lagoon: "◔",
  kayak: "≈",
  bird: "✦",
  gastronomy: "✳",
  family: "◉",
  photo: "◈",
  celebration: "✺",
  pool: "◌",
};

function resolveExperienceIcon(iconKey: string) {
  if (!iconKey) {
    return "✦";
  }

  if (iconKey.length <= 2) {
    return iconKey;
  }

  return EXPERIENCE_ICON_MAP[iconKey] ?? "✦";
}

function mediaAssetUrl(assetId: string | null | undefined, variant: "card" | "heroDesktop" | "detail") {
  return assetId ? `/media/assets/${assetId}/${variant}.webp` : "";
}

function mapExperienceRecord(record: ExperienceRecord, locale: PublicSiteLocale): PublicExperience {
  const localized = record.localeContent[locale];
  const coverImage =
    mediaAssetUrl(record.cardAssetId, "card") ||
    mediaAssetUrl(record.heroAssetId, "heroDesktop") ||
    mediaAssetUrl(record.galleryAssetIds[0], "detail");
  const heroImage = mediaAssetUrl(record.heroAssetId, "heroDesktop") || coverImage;

  return {
    id: record.id,
    slug: record.slug,
    featuredOnHome: record.featuredOnHome,
    sortOrder: record.sortOrder,
    title: localized.title,
    summary: localized.summary,
    body: localized.body,
    duration: localized.duration,
    priceLabel: localized.priceLabel,
    ctaLabel: localized.ctaLabel,
    icon: resolveExperienceIcon(record.iconKey),
    coverImage,
    heroImage,
    galleryImages: record.galleryAssetIds.map((assetId) => mediaAssetUrl(assetId, "detail")).filter(Boolean),
    included: localized.included,
    recommendations: localized.recommendations,
  };
}

function mapDefaultExperiences(locale: PublicSiteLocale, slug?: string | null): PublicExperience[] {
  const items = slug
    ? DEFAULT_PUBLIC_EXPERIENCES.filter((item) => item.visible && item.slug === slug)
    : DEFAULT_PUBLIC_EXPERIENCES.filter((item) => item.visible);

  return items
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      featuredOnHome: item.featuredOnHome,
      sortOrder: item.sortOrder,
      title: item.localeContent[locale].title,
      summary: item.localeContent[locale].summary,
      body: item.localeContent[locale].body,
      duration: item.localeContent[locale].duration,
      priceLabel: item.localeContent[locale].priceLabel,
      ctaLabel: item.localeContent[locale].ctaLabel,
      icon: item.icon,
      coverImage: item.cardImage,
      heroImage: item.heroImage,
      galleryImages: item.galleryImages,
      included: item.included[locale],
      recommendations: item.recommendations[locale],
    }));
}

function mapGalleryPublication(gallery: GalleryPublication, locale: PublicSiteLocale): PublicGalleryItem[] {
  return gallery.items
    .filter((item) => item.visible)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({
      id: item.id,
      image: mediaAssetUrl(item.assetId, "detail"),
      alt: item.localeContent[locale].alt,
      caption: item.localeContent[locale].caption,
      sortOrder: item.sortOrder,
    }));
}

export async function listLocalizedPublicExperiences(locale: PublicSiteLocale): Promise<PublicExperience[]> {
  try {
    const experiences = await contentStore.listExperiences({ visibleOnly: true });
    if (experiences.length === 0) {
      return mapDefaultExperiences(locale);
    }

    return experiences
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((record) => mapExperienceRecord(record, locale));
  } catch {
    return mapDefaultExperiences(locale);
  }
}

export async function getLocalizedPublicExperienceBySlug(
  locale: PublicSiteLocale,
  slug: string,
): Promise<PublicExperience | null> {
  const fallback = findDefaultExperienceBySlug(slug);

  try {
    const experience = await contentStore.getExperienceBySlug(slug);
    if (!experience || !experience.visible || experience.deletedAt) {
      return fallback?.visible ? (mapDefaultExperiences(locale, slug)[0] ?? null) : null;
    }

    return mapExperienceRecord(experience, locale);
  } catch {
    if (!fallback || !fallback.visible) {
      return null;
    }

    return mapDefaultExperiences(locale, slug)[0] ?? null;
  }
}

export async function getLocalizedPublicGallery(locale: PublicSiteLocale): Promise<PublicGalleryItem[]> {
  try {
    const gallery = await contentStore.getGallery();
    if (gallery.items.length === 0) {
      return getLocalizedDefaultGallery(locale);
    }

    return mapGalleryPublication(gallery, locale);
  } catch {
    return getLocalizedDefaultGallery(locale);
  }
}
