import type { MetadataRoute } from "next";

const BASE_URL = "https://wakayaecolodge.com";

const PUBLIC_PATHS = [
  "/es",
  "/es/about",
  "/es/bungalows",
  "/es/contact",
  "/es/services",
  "/es/events",
  "/es/gallery",
  "/es/publications",
  "/en",
  "/en/about",
  "/en/bungalows",
  "/en/contact",
  "/en/services",
  "/en/events",
  "/en/gallery",
  "/en/publications",
] as const;

const BUNGALOW_SLUGS = [
  "bungalow-familiar",
  "bungalow-matrimonial",
  "bungalow-doble",
  "bungalow-triple",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const sharedEntries = PUBLIC_PATHS.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/es" || path === "/en" ? "weekly" : "monthly",
    priority: path === "/es" || path === "/en" ? 1 : path.includes("/contact") || path.includes("/bungalows") ? 0.9 : 0.7,
  })) satisfies MetadataRoute.Sitemap;

  const bungalowEntries = ["es", "en"].flatMap((locale) =>
    BUNGALOW_SLUGS.map((slug) => ({
      url: `${BASE_URL}/${locale}/bungalows/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  );

  return [...sharedEntries, ...bungalowEntries];
}
