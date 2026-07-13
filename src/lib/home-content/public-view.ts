import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicRoute } from "@/components/public-site/public-site-routes";

import { homeContentDocumentSchema } from "./schema";
import type {
  CtaDestination,
  HomeContentDocument,
  HomeContentDocumentInput,
  HomeCta,
  HomeSection,
  LocalizedBookingBandSectionView,
  LocalizedBungalowsSectionView,
  LocalizedClosingSectionView,
  LocalizedExperiencesSectionView,
  LocalizedHomeSectionView,
  LocalizedHomeSlideView,
  LocalizedHomeView,
  LocalizedQuoteBandSectionView,
  ResolvedHomeCta,
  LocalizedStatsSectionView,
  LocalizedStorySectionView,
  LocalizedTestimonialsSectionView,
} from "./types";

function resolveDestination(locale: PublicSiteLocale, destination: CtaDestination): string {
  switch (destination.kind) {
    case "internal":
      return getPublicRoute(locale, destination.value);
    case "phone":
      return `tel:${destination.value}`;
    case "whatsapp":
      return `https://wa.me/${destination.value.replace(/[^0-9]/g, "")}`;
    case "external":
      return destination.value;
  }
}

function resolveCta(locale: PublicSiteLocale, cta: HomeCta): ResolvedHomeCta {
  return {
    id: cta.id,
    label: cta.label[locale],
    href: resolveDestination(locale, cta.destination),
    style: cta.style,
  };
}

function toSectionView(locale: PublicSiteLocale, section: HomeSection): LocalizedHomeSectionView {
  switch (section.type) {
    case "booking-band":
      return {
        id: section.id,
        type: section.type,
        order: section.order,
        style: section.style,
        content: {
          title: section.content.title[locale],
          helper: section.content.helper[locale],
          checkInLabel: section.content.checkInLabel[locale],
          checkOutLabel: section.content.checkOutLabel[locale],
          guestsLabel: section.content.guestsLabel[locale],
          roomLabel: section.content.roomLabel[locale],
          allCategoriesLabel: section.content.allCategoriesLabel[locale],
          guestOptions: section.content.guestOptions[locale],
          submitHint: section.content.submitHint[locale],
        },
        ctas: section.ctas.map((cta) => resolveCta(locale, cta)),
      } satisfies LocalizedBookingBandSectionView;
    case "stats":
      return {
        id: section.id,
        type: section.type,
        order: section.order,
        style: section.style,
        content: {
          items: section.content.items.map((item) => ({
            value: item.value,
            label: item.label[locale],
          })),
        },
        ctas: section.ctas.map((cta) => resolveCta(locale, cta)),
      } satisfies LocalizedStatsSectionView;
    case "story":
      return {
        id: section.id,
        type: section.type,
        order: section.order,
        style: section.style,
        content: {
          eyebrow: section.content.eyebrow[locale],
          title: section.content.title[locale],
          paragraphs: section.content.paragraphs[locale],
          quote: section.content.quote[locale],
          quoteSource: section.content.quoteSource[locale],
          image: section.content.image,
        },
        ctas: section.ctas.map((cta) => resolveCta(locale, cta)),
      } satisfies LocalizedStorySectionView;
    case "bungalows":
      return {
        id: section.id,
        type: section.type,
        order: section.order,
        style: section.style,
        content: {
          eyebrow: section.content.eyebrow[locale],
          title: section.content.title[locale],
          detailLabel: section.content.detailLabel[locale],
          visibleCount: section.content.visibleCount,
        },
        ctas: section.ctas.map((cta) => resolveCta(locale, cta)),
      } satisfies LocalizedBungalowsSectionView;
    case "quote-band":
      return {
        id: section.id,
        type: section.type,
        order: section.order,
        style: section.style,
        content: {
          quote: section.content.quote[locale],
          source: section.content.source[locale],
          image: section.content.image,
        },
        ctas: section.ctas.map((cta) => resolveCta(locale, cta)),
      } satisfies LocalizedQuoteBandSectionView;
    case "experiences":
      return {
        id: section.id,
        type: section.type,
        order: section.order,
        style: section.style,
        content: {
          eyebrow: section.content.eyebrow[locale],
          title: section.content.title[locale],
          visibleCount: section.content.visibleCount,
          experienceIds: [...section.experienceIds],
        },
        ctas: section.ctas.map((cta) => resolveCta(locale, cta)),
      } satisfies LocalizedExperiencesSectionView;
    case "testimonials":
      return {
        id: section.id,
        type: section.type,
        order: section.order,
        style: section.style,
        content: {
          eyebrow: section.content.eyebrow[locale],
          title: section.content.title[locale],
          items: section.content.items.map((item) => ({
            name: item.name,
            origin: item.origin[locale],
            quote: item.quote[locale],
          })),
        },
        ctas: section.ctas.map((cta) => resolveCta(locale, cta)),
      } satisfies LocalizedTestimonialsSectionView;
    case "closing-cta":
      return {
        id: section.id,
        type: section.type,
        order: section.order,
        style: section.style,
        content: {
          eyebrow: section.content.eyebrow[locale],
          title: section.content.title[locale],
          image: section.content.image,
        },
        ctas: section.ctas.map((cta) => resolveCta(locale, cta)),
      } satisfies LocalizedClosingSectionView;
  }
}

function toSlideView(locale: PublicSiteLocale, document: HomeContentDocument): LocalizedHomeSlideView[] {
  return document.slider.slides
    .filter((slide) => slide.visible)
    .sort((left, right) => left.order - right.order)
    .map((slide) => ({
      id: slide.id,
      order: slide.order,
      image: slide.image,
      eyebrow: slide.content[locale].eyebrow,
      title: slide.content[locale].title,
      subtitle: slide.content[locale].subtitle,
      copy: slide.content[locale].copy,
      scrollLabel: slide.content[locale].scrollLabel,
      primaryCta: resolveCta(locale, slide.primaryCta),
      secondaryCta: slide.secondaryCta ? resolveCta(locale, slide.secondaryCta) : null,
      style: slide.style,
    }));
}

function toSectionViews(locale: PublicSiteLocale, document: HomeContentDocument): LocalizedHomeSectionView[] {
  return document.sections
    .filter((section) => section.visible)
    .sort((left, right) => left.order - right.order)
    .map((section) => toSectionView(locale, section));
}

export function toLocalizedHomeView(input: HomeContentDocumentInput, locale: PublicSiteLocale): LocalizedHomeView {
  const document = homeContentDocumentSchema.parse(input);

  return {
    navigation: document.navigation ? structuredClone(document.navigation) : undefined,
    autoplayMs: document.slider.autoplayMs,
    slides: toSlideView(locale, document),
    sections: toSectionViews(locale, document),
  };
}
