import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";

import { corporateContentStore } from "./store";

export async function getPublishedCorporateView(locale: PublicSiteLocale) {
  const published = await corporateContentStore.getPublished();
  return {
    content: published.document.locales[locale],
    siteContent: published.document.publicSite.locales[locale],
    siteMedia: published.document.publicSite.media,
    contact: published.document.contact,
    revisionVersion: published.revisionVersion,
  };
}

export async function getPublishedPublicSiteContent(locale: PublicSiteLocale) {
  return (await corporateContentStore.getPublished()).document.publicSite.locales[locale];
}

export async function getPublishedPublicSiteView(locale: PublicSiteLocale) {
  const document = (await corporateContentStore.getPublished()).document.publicSite;
  return { content: document.locales[locale], media: document.media };
}
