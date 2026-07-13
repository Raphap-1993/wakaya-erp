import type { PublicSiteLocale } from "./public-site-locale";

export type PublicRouteKey =
  | "home"
  | "about"
  | "faq"
  | "testimonials"
  | "bungalows"
  | "services"
  | "events"
  | "gallery"
  | "publications"
  | "contact"
  | "hotelPolicies"
  | "petFriendly"
  | "complaintsBook";

const PUBLIC_ROUTE_SEGMENTS: Record<PublicRouteKey, string> = {
  home: "",
  about: "about",
  faq: "faq",
  testimonials: "testimonials",
  bungalows: "bungalows",
  services: "services",
  events: "events",
  gallery: "gallery",
  publications: "publications",
  contact: "contact",
  hotelPolicies: "hotel-policies",
  petFriendly: "pet-friendly",
  complaintsBook: "complaints-book",
};

export function getPublicRoute(locale: PublicSiteLocale, key: PublicRouteKey): string {
  const segment = PUBLIC_ROUTE_SEGMENTS[key];
  return segment ? `/${locale}/${segment}` : `/${locale}`;
}

export function getPublicBungalowDetailRoute(locale: PublicSiteLocale, slug: string, search?: URLSearchParams): string {
  const base = `${getPublicRoute(locale, "bungalows")}/${slug}`;
  const query = search?.toString();
  return query ? `${base}?${query}` : base;
}

export function getPrototypeRoute(key: PublicRouteKey): string {
  const segment = PUBLIC_ROUTE_SEGMENTS[key];
  return segment ? `/prototype/public-site/${segment}` : "/prototype/public-site";
}

export function swapPublicLocaleInPathname(pathname: string, locale: PublicSiteLocale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return `/${locale}`;
  }

  if (segments[0] === "es" || segments[0] === "en") {
    segments[0] = locale;
    return `/${segments.join("/")}`;
  }

  return getPublicRoute(locale, "home");
}
