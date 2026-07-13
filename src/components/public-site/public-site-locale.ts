import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n";

export const publicSiteLocales = locales;

export type PublicSiteLocale = (typeof publicSiteLocales)[number];

export function isPublicSiteLocale(value: string): value is PublicSiteLocale {
  return isLocale(value);
}

export function getPublicSiteLocale(value: string | undefined): PublicSiteLocale {
  if (value && isPublicSiteLocale(value)) {
    return value;
  }

  return defaultLocale;
}

export function listPublicSiteLocales(): PublicSiteLocale[] {
  return [...publicSiteLocales];
}
