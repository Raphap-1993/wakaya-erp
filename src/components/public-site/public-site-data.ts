import {
  defaultPublicSiteLocale,
  getPublicSiteCopy as getLocalizedPublicSiteCopy,
  publicSitePaths,
  type PublicBungalowSlug,
  type PublicSiteLocale,
  type PublicSitePathKey,
} from './public-site-copy';
import { WAKAYA_PUBLIC_BUNGALOW_CATALOG } from '@/lib/reservations/wakaya-bungalows';

export {
  defaultPublicSiteLocale,
  publicSiteLocaleMetadata,
  publicSiteLocales,
  publicSitePaths,
  resolvePublicSiteLocale,
} from './public-site-copy';

export type {
  PublicBungalowSlug,
  PublicSiteLocale,
  PublicSitePageKey,
  PublicSitePathKey,
} from './public-site-copy';

const publicNavOrder = [
  'home',
  'about',
  'bungalows',
  'services',
  'events',
  'gallery',
  'publications',
  'contact',
] as const satisfies readonly PublicSitePathKey[];

const publicBungalowCatalog = WAKAYA_PUBLIC_BUNGALOW_CATALOG.map((bungalow) => ({
  slug: bungalow.publicSlug,
  bookingRequestBungalowId: bungalow.id,
  featuredOnHome: bungalow.featuredOnHome,
  image: bungalow.image,
})) as readonly {
  slug: PublicBungalowSlug;
  bookingRequestBungalowId: string | null;
  featuredOnHome: boolean;
  image: string;
}[];

type PublicNavItem = {
  label: string;
  href: string;
};

function buildNavItems(
  locale: PublicSiteLocale | string,
  navKeys: readonly PublicSitePathKey[],
): PublicNavItem[] {
  const copy = getLocalizedPublicSiteCopy(locale);

  return navKeys.map((key) => ({
    label: copy.navLabels[key],
    href: publicSitePaths[key],
  }));
}

export function getPublicSiteCopy(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  return getLocalizedPublicSiteCopy(locale);
}

export function getPublicNav(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  return buildNavItems(locale, publicNavOrder);
}

export function getPublicFooterNav(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  const copy = getLocalizedPublicSiteCopy(locale);
  return buildNavItems(locale, copy.footerNavKeys);
}

export function getPublicFooterContact(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  const { place, domain, note } = getLocalizedPublicSiteCopy(locale).contact;

  return {
    place,
    domain,
    note,
  };
}

export function getPublicContactCopy(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  return getLocalizedPublicSiteCopy(locale).contact;
}

export function getPublicFooterCopy(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  const copy = getLocalizedPublicSiteCopy(locale);

  return {
    intro: copy.footerIntro,
    headings: copy.footerHeadings,
    bookingBullets: [...copy.bookingBullets],
    contact: copy.contact,
  };
}

export function getPublicSharedLabels(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  return getLocalizedPublicSiteCopy(locale).sharedLabels;
}

export function getPublicPageLabels(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  return getLocalizedPublicSiteCopy(locale).pageLabels;
}

export function getPublicBungalows(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  const copy = getLocalizedPublicSiteCopy(locale);

  return publicBungalowCatalog.map((bungalow) => ({
    ...bungalow,
    ...copy.bungalows[bungalow.slug],
  }));
}

export function getHomeSlides(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  return getLocalizedPublicSiteCopy(locale).homeSlides;
}

export function getTestimonials(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  return getLocalizedPublicSiteCopy(locale).testimonials;
}

export function getPublications(
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
) {
  return getLocalizedPublicSiteCopy(locale).publications;
}

export const publicNav = getPublicNav();

export const publicFooterNav = getPublicFooterNav();

export const publicBungalows = getPublicBungalows();

export const homeSlides = getHomeSlides();

export const testimonials = getTestimonials();

export const publications = getPublications();

export const footerContact = getPublicFooterContact();

export const publicFooterCopy = getPublicFooterCopy();

export const publicSharedLabels = getPublicSharedLabels();

export const publicPageLabels = getPublicPageLabels();

export function getPublicBungalowLabel(bungalow: {
  homeName?: string | undefined;
  name: string;
}) {
  return bungalow.homeName ?? bungalow.name;
}
