export type ExperienceLocaleContent = {
  title: string;
  summary: string;
  body: string;
  duration: string;
  priceLabel: string;
  ctaLabel: string;
  included: string[];
  recommendations: string[];
};

export type ExperienceLocaleMap = {
  es: ExperienceLocaleContent;
  en: ExperienceLocaleContent;
};

export type ExperienceInput = {
  id: string;
  slug: string;
  visible: boolean;
  featuredOnHome: boolean;
  sortOrder: number;
  iconKey: string;
  localeContent: ExperienceLocaleMap;
  cardAssetId: string | null;
  heroAssetId: string | null;
  galleryAssetIds: string[];
};

export type ExperienceRecord = ExperienceInput & {
  version: number;
  deletedAt: string | null;
};

export type GalleryItemLocaleContent = {
  alt: string;
  caption: string;
};

export type GalleryItemLocaleMap = {
  es: GalleryItemLocaleContent;
  en: GalleryItemLocaleContent;
};

export type GalleryItemInput = {
  id: string;
  assetId: string;
  visible: boolean;
  sortOrder: number;
  localeContent: GalleryItemLocaleMap;
};

export type PublishGalleryInput = {
  expectedVersion: number;
  actorId: string | null;
  items: GalleryItemInput[];
};

export type GalleryPublication = {
  id: "global";
  version: number;
  updatedBy: string | null;
  updatedAt: string;
  items: GalleryItemInput[];
};

export type BungalowContentLocaleContent = {
  displayName: string;
  displayEyebrow: string;
  displayDescription: string;
  displayTagline: string;
  displayLongDescription: string;
  displayHighlights: string[];
  displayAmenities: string[];
  displayIncluded: string[];
};

export type BungalowContentLocaleMap = {
  es: BungalowContentLocaleContent;
  en: BungalowContentLocaleContent;
};

export type BungalowContentUpdateInput = {
  expectedVersion: number;
  featuredOnHome: boolean;
  sortOrder: number;
  heroImageUrl: string;
  galleryUrls: string[];
  nightlyRatePen: number;
  areaSqm: number;
  localeContent: BungalowContentLocaleMap;
  heroAssetId?: string | null;
  galleryAssetIds?: string[];
};

export type BungalowContentRecord = {
  bungalowId: string;
  revisionVersion: number;
  featuredOnHome: boolean;
  sortOrder: number;
  heroImageUrl: string;
  galleryUrls: string[];
  nightlyRatePen: number;
  areaSqm: number;
  localeContent: BungalowContentLocaleMap;
  heroAssetId: string | null;
  galleryAssetIds: string[];
  updatedAt: string;
};
