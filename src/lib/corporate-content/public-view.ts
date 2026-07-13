import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";

import { corporateContentStore } from "./store";

export async function getPublishedCorporateView(locale: PublicSiteLocale) {
  const published = await corporateContentStore.getPublished();
  return {
    content: published.document.locales[locale],
    contact: published.document.contact,
    revisionVersion: published.revisionVersion,
  };
}
