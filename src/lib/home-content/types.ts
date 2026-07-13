import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";

export const HOME_HEADING_SIZES = ["regular", "large", "display"] as const;
export const HOME_BODY_SIZES = ["small", "regular", "large"] as const;
export const HOME_HEADING_WEIGHTS = ["regular", "medium", "semibold"] as const;
export const HOME_BODY_WEIGHTS = ["regular", "medium", "semibold"] as const;
export const HOME_SIZE_ADJUST_MIN_PX = -8;
export const HOME_SIZE_ADJUST_MAX_PX = 8;
export const HOME_SIZE_ADJUST_STEP_PX = 0.5;
export const HOME_WEIGHT_VALUE_MIN = 350;
export const HOME_WEIGHT_VALUE_MAX = 650;
export const HOME_WEIGHT_VALUE_STEP = 10;
export const HOME_INTERNAL_ROUTE_KEYS = ["about", "bungalows", "contact", "services"] as const;
export const HOME_SECTION_TYPES = [
  "booking-band",
  "stats",
  "story",
  "bungalows",
  "quote-band",
  "experiences",
  "testimonials",
  "closing-cta",
] as const;
export const HOME_CTA_STYLES = ["primary", "secondary", "link"] as const;

export type HeadingSizePreset = (typeof HOME_HEADING_SIZES)[number];
export type BodySizePreset = (typeof HOME_BODY_SIZES)[number];
export type HeadingWeightPreset = (typeof HOME_HEADING_WEIGHTS)[number];
export type BodyWeightPreset = (typeof HOME_BODY_WEIGHTS)[number];
export type HomeInternalRouteKey = (typeof HOME_INTERNAL_ROUTE_KEYS)[number];
export type HomeSectionType = (typeof HOME_SECTION_TYPES)[number];
export type HomeCtaStyle = (typeof HOME_CTA_STYLES)[number];

export type LocalizedField<T> = Record<PublicSiteLocale, T>;
export type LocalizedText = LocalizedField<string>;
export type LocalizedTextList = LocalizedField<string[]>;
export type HomeVisibleCount = 2 | 3 | 4;

export type HomeTextStyle = {
  headingSize: HeadingSizePreset;
  bodySize: BodySizePreset;
  eyebrowSize?: BodySizePreset;
  headingSizeAdjustPx?: number;
  bodySizeAdjustPx?: number;
  eyebrowSizeAdjustPx?: number;
  subtitleSize?: BodySizePreset;
  subtitleSizeAdjustPx?: number;
  labelSize?: BodySizePreset;
  labelSizeAdjustPx?: number;
  ctaSize?: BodySizePreset;
  ctaSizeAdjustPx?: number;
  headingWeight?: HeadingWeightPreset;
  headingWeightValue?: number;
  bodyWeight?: BodyWeightPreset;
  bodyWeightValue?: number;
  eyebrowWeight?: BodyWeightPreset;
  eyebrowWeightValue?: number;
  subtitleWeight?: BodyWeightPreset;
  subtitleWeightValue?: number;
  labelWeight?: BodyWeightPreset;
  labelWeightValue?: number;
  ctaWeight?: BodyWeightPreset;
  ctaWeightValue?: number;
};

export type HomeNavigationStyle = {
  linkSize?: BodySizePreset;
  linkSizeAdjustPx?: number;
  linkWeight?: BodyWeightPreset;
  linkWeightValue?: number;
  ctaSize?: BodySizePreset;
  ctaSizeAdjustPx?: number;
  ctaWeight?: BodyWeightPreset;
  ctaWeightValue?: number;
};

export type HomeNavigationSettings = {
  style?: HomeNavigationStyle;
};

export type InternalCtaDestination = {
  kind: "internal";
  value: HomeInternalRouteKey;
};

export type ExternalCtaDestination = {
  kind: "external";
  value: string;
};

export type PhoneCtaDestination = {
  kind: "phone";
  value: string;
};

export type WhatsappCtaDestination = {
  kind: "whatsapp";
  value: string;
};

export type CtaDestination =
  | InternalCtaDestination
  | ExternalCtaDestination
  | PhoneCtaDestination
  | WhatsappCtaDestination;

export type HomeCta = {
  id: string;
  label: LocalizedText;
  destination: CtaDestination;
  style: HomeCtaStyle;
};

export type HomeSlideContent = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  copy?: string;
  scrollLabel?: string;
};

export type HomeSlide = {
  id: string;
  visible: boolean;
  order: number;
  image: string;
  content: LocalizedField<HomeSlideContent>;
  primaryCta: HomeCta;
  secondaryCta?: HomeCta | null;
  style: HomeTextStyle;
};

export type BookingBandContent = {
  title: LocalizedText;
  helper: LocalizedText;
  checkInLabel: LocalizedText;
  checkOutLabel: LocalizedText;
  guestsLabel: LocalizedText;
  roomLabel: LocalizedText;
  allCategoriesLabel: LocalizedText;
  guestOptions: LocalizedTextList;
  submitHint: LocalizedText;
};

export type HomeStatItem = {
  value: string;
  label: LocalizedText;
};

export type StorySectionContent = {
  eyebrow: LocalizedText;
  title: LocalizedText;
  paragraphs: LocalizedTextList;
  quote: LocalizedText;
  quoteSource: LocalizedText;
  image: string;
};

export type BungalowSectionContent = {
  eyebrow: LocalizedText;
  title: LocalizedText;
  detailLabel: LocalizedText;
  visibleCount: HomeVisibleCount;
};

export type QuoteBandContent = {
  quote: LocalizedText;
  source: LocalizedText;
  image: string;
};

export type ExperienceItem = {
  eyebrow: LocalizedText;
  title: LocalizedText;
  copy: LocalizedText;
  price: string;
  duration: LocalizedText;
  image: string;
};

export type LegacyExperiencesSectionContent = {
  eyebrow: LocalizedText;
  title: LocalizedText;
  items: ExperienceItem[];
};

export type ExperiencesSectionContent = {
  eyebrow: LocalizedText;
  title: LocalizedText;
  visibleCount: HomeVisibleCount;
};

export type TestimonialItem = {
  name: string;
  origin: LocalizedText;
  quote: LocalizedText;
};

export type ClosingSectionContent = {
  eyebrow: LocalizedText;
  title: LocalizedText;
  image: string;
};

export type HomeSectionBase<TType extends HomeSectionType, TContent> = {
  id: string;
  type: TType;
  visible: boolean;
  order: number;
  style: HomeTextStyle;
  content: TContent;
  ctas: HomeCta[];
};

export type BookingBandSection = HomeSectionBase<"booking-band", BookingBandContent>;
export type StatsSection = HomeSectionBase<"stats", { items: HomeStatItem[] }>;
export type StorySection = HomeSectionBase<"story", StorySectionContent>;
export type BungalowsSection = HomeSectionBase<"bungalows", BungalowSectionContent>;
export type QuoteBandSection = HomeSectionBase<"quote-band", QuoteBandContent>;
export type ExperiencesSection = HomeSectionBase<"experiences", ExperiencesSectionContent> & {
  experienceIds: string[];
};
export type TestimonialsSection = HomeSectionBase<"testimonials", { eyebrow: LocalizedText; title: LocalizedText; items: TestimonialItem[] }>;
export type ClosingCtaSection = HomeSectionBase<"closing-cta", ClosingSectionContent>;

export type LegacyExperiencesSection = HomeSectionBase<"experiences", LegacyExperiencesSectionContent>;

export type HomeSection =
  | BookingBandSection
  | StatsSection
  | StorySection
  | BungalowsSection
  | QuoteBandSection
  | ExperiencesSection
  | TestimonialsSection
  | ClosingCtaSection;

export type HomeSectionInput =
  | BookingBandSection
  | StatsSection
  | StorySection
  | BungalowsSection
  | QuoteBandSection
  | ExperiencesSection
  | LegacyExperiencesSection
  | TestimonialsSection
  | ClosingCtaSection;

export type HomeContentDocumentV1 = {
  version: 1;
  slider: {
    autoplayMs: number;
    slides: HomeSlide[];
  };
  sections: HomeSectionInput[];
};

export type HomeContentDocument = {
  schemaVersion: 2;
  navigation?: HomeNavigationSettings;
  slider: {
    autoplayMs: number;
    slides: HomeSlide[];
  };
  sections: HomeSection[];
};

export type HomeContentDocumentInput = HomeContentDocument | HomeContentDocumentV1;

export type ResolvedHomeCta = {
  id: string;
  label: string;
  href: string;
  style: HomeCtaStyle;
};

export type LocalizedHomeSlideView = {
  id: string;
  order: number;
  image: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  copy?: string;
  scrollLabel?: string;
  primaryCta: ResolvedHomeCta;
  secondaryCta?: ResolvedHomeCta | null;
  style: HomeTextStyle;
};

export type LocalizedBookingBandContent = {
  title: string;
  helper: string;
  checkInLabel: string;
  checkOutLabel: string;
  guestsLabel: string;
  roomLabel: string;
  allCategoriesLabel: string;
  guestOptions: string[];
  submitHint: string;
};

export type LocalizedStatsContent = {
  items: Array<{
    value: string;
    label: string;
  }>;
};

export type LocalizedStoryContent = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  quote: string;
  quoteSource: string;
  image: string;
};

export type LocalizedBungalowsContent = {
  eyebrow: string;
  title: string;
  detailLabel: string;
  visibleCount: HomeVisibleCount;
};

export type LocalizedQuoteBandContent = {
  quote: string;
  source: string;
  image: string;
};

export type LocalizedExperiencesContent = {
  eyebrow: string;
  title: string;
  visibleCount: HomeVisibleCount;
  experienceIds: string[];
};

export type LocalizedTestimonialsContent = {
  eyebrow: string;
  title: string;
  items: Array<{
    name: string;
    origin: string;
    quote: string;
  }>;
};

export type LocalizedClosingContent = {
  eyebrow: string;
  title: string;
  image: string;
};

export type LocalizedHomeSectionBase<TType extends HomeSectionType, TContent> = {
  id: string;
  type: TType;
  order: number;
  style: HomeTextStyle;
  content: TContent;
  ctas: ResolvedHomeCta[];
};

export type LocalizedBookingBandSectionView = LocalizedHomeSectionBase<"booking-band", LocalizedBookingBandContent>;
export type LocalizedStatsSectionView = LocalizedHomeSectionBase<"stats", LocalizedStatsContent>;
export type LocalizedStorySectionView = LocalizedHomeSectionBase<"story", LocalizedStoryContent>;
export type LocalizedBungalowsSectionView = LocalizedHomeSectionBase<"bungalows", LocalizedBungalowsContent>;
export type LocalizedQuoteBandSectionView = LocalizedHomeSectionBase<"quote-band", LocalizedQuoteBandContent>;
export type LocalizedExperiencesSectionView = LocalizedHomeSectionBase<"experiences", LocalizedExperiencesContent>;
export type LocalizedTestimonialsSectionView = LocalizedHomeSectionBase<"testimonials", LocalizedTestimonialsContent>;
export type LocalizedClosingSectionView = LocalizedHomeSectionBase<"closing-cta", LocalizedClosingContent>;

export type LocalizedHomeSectionView =
  | LocalizedBookingBandSectionView
  | LocalizedStatsSectionView
  | LocalizedStorySectionView
  | LocalizedBungalowsSectionView
  | LocalizedQuoteBandSectionView
  | LocalizedExperiencesSectionView
  | LocalizedTestimonialsSectionView
  | LocalizedClosingSectionView;

export type LocalizedHomeView = {
  navigation?: HomeNavigationSettings;
  autoplayMs: number;
  slides: LocalizedHomeSlideView[];
  sections: LocalizedHomeSectionView[];
};

export type HomeContentRevisionRecord = {
  revisionVersion: number;
  document: HomeContentDocument;
  updatedAt: string;
  updatedByUserId: string | null;
  restoredFromVersion: number | null;
  source: "default" | "published";
};
