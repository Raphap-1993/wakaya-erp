import type { Metadata } from "next";

import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { buildPublicMetadata } from "@/components/public-site/public-site-metadata";
import { getPublicBungalowDetailRoute, getPublicRoute } from "@/components/public-site/public-site-routes";

export function buildLocalizedPublicMetadata(input: {
  locale: PublicSiteLocale;
  route: Parameters<typeof getPublicRoute>[1];
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
}): Metadata {
  const path = getPublicRoute(input.locale, input.route);
  const base = buildPublicMetadata({
    title: input.title,
    description: input.description,
    path,
    keywords: input.keywords,
    image: input.image,
  });

  return {
    ...base,
    alternates: {
      canonical: path,
      languages: {
        es: getPublicRoute("es", input.route),
        en: getPublicRoute("en", input.route),
      },
    },
    openGraph: {
      ...base.openGraph,
      locale: input.locale === "es" ? "es_PE" : "en_US",
    },
  };
}

export function buildLocalizedBungalowMetadata(input: {
  locale: PublicSiteLocale;
  slug: string;
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
}): Metadata {
  const path = getPublicBungalowDetailRoute(input.locale, input.slug);
  const base = buildPublicMetadata({
    title: input.title,
    description: input.description,
    path,
    keywords: input.keywords,
    image: input.image,
  });

  return {
    ...base,
    alternates: {
      canonical: path,
      languages: {
        es: getPublicBungalowDetailRoute("es", input.slug),
        en: getPublicBungalowDetailRoute("en", input.slug),
      },
    },
    openGraph: {
      ...base.openGraph,
      locale: input.locale === "es" ? "es_PE" : "en_US",
    },
  };
}
