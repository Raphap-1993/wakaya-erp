import type { Metadata } from 'next';

import {
  defaultPublicSiteLocale,
  getPublicSiteCopy,
  publicSiteLocaleMetadata,
  publicSitePaths,
  resolvePublicSiteLocale,
  type PublicSiteLocale,
  type PublicSitePageKey,
} from './public-site-copy';

const defaultImage =
  'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png';

type BuildPublicMetadataArgs = {
  title: string;
  description: string;
  path: string;
  keywords?: readonly string[];
  image?: string;
  locale?: PublicSiteLocale | string;
  localePaths?: Partial<Record<PublicSiteLocale, string>>;
  appendDefaultKeywords?: boolean;
};

export const publicSiteMetadataBase = new URL('https://wakayaecolodge.com');

function dedupeKeywords(keywords: readonly string[]) {
  const uniqueKeywords = new Map<string, string>();

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      continue;
    }

    uniqueKeywords.set(normalizedKeyword.toLowerCase(), normalizedKeyword);
  }

  return [...uniqueKeywords.values()];
}

function getPublicPageKeyFromPath(path: string): PublicSitePageKey | undefined {
  if (path === publicSitePaths.home) {
    return 'home';
  }

  if (path === publicSitePaths.about) {
    return 'about';
  }

  if (path === publicSitePaths.contact) {
    return 'contact';
  }

  if (path === publicSitePaths.bungalows) {
    return 'bungalows';
  }

  if (path.startsWith(`${publicSitePaths.bungalows}/`)) {
    return 'bungalowDetail';
  }

  return undefined;
}

function getDefaultPageKeywords(pageKey: PublicSitePageKey, locale: PublicSiteLocale) {
  const copy = getPublicSiteCopy(locale);

  switch (pageKey) {
    case 'home':
      return copy.seo.homeKeywords;
    case 'about':
      return copy.seo.aboutKeywords;
    case 'contact':
      return copy.seo.contactKeywords;
    case 'bungalows':
      return copy.seo.bungalowsKeywords;
    case 'bungalowDetail':
      return copy.seo.bungalowDetailKeywords;
    default:
      return [];
  }
}

export function getPublicMetadataKeywords(
  path: string,
  locale: PublicSiteLocale | string = defaultPublicSiteLocale,
  keywords: readonly string[] = [],
) {
  const resolvedLocale = resolvePublicSiteLocale(locale);
  const pageKey = getPublicPageKeyFromPath(path);

  if (!pageKey) {
    return dedupeKeywords(keywords);
  }

  return dedupeKeywords([
    ...getDefaultPageKeywords(pageKey, resolvedLocale),
    ...keywords,
  ]);
}

export function buildPublicAlternates({
  path,
  localePaths,
}: Pick<BuildPublicMetadataArgs, 'path' | 'localePaths'>): Metadata['alternates'] {
  const alternates: NonNullable<Metadata['alternates']> = {
    canonical: path,
  };

  if (!localePaths) {
    return alternates;
  }

  const languageEntries = Object.entries(localePaths).filter(
    (entry): entry is [PublicSiteLocale, string] => typeof entry[1] === 'string' && entry[1].length > 0,
  );

  if (languageEntries.length > 0) {
    alternates.languages = Object.fromEntries(languageEntries);
  }

  return alternates;
}

export function buildPublicMetadata({
  title,
  description,
  path,
  keywords = [],
  image = defaultImage,
  locale: requestedLocale = defaultPublicSiteLocale,
  localePaths,
  appendDefaultKeywords = true,
}: BuildPublicMetadataArgs): Metadata {
  const locale = resolvePublicSiteLocale(requestedLocale);
  const localeMeta = publicSiteLocaleMetadata[locale];
  const siteName = getPublicSiteCopy(locale).brand.siteName;
  const resolvedKeywords = appendDefaultKeywords
    ? getPublicMetadataKeywords(path, locale, keywords)
    : dedupeKeywords(keywords);

  return {
    title,
    description,
    keywords: resolvedKeywords,
    alternates: buildPublicAlternates({ path, localePaths }),
    openGraph: {
      type: 'website',
      locale: localeMeta.ogLocale,
      alternateLocale: localeMeta.alternateLocale,
      siteName,
      title,
      description,
      url: path,
      images: [
        {
          url: image,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
