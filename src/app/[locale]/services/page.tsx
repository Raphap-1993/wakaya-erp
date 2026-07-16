import type { Route } from "next";
import Link from "next/link";

import { FigmaPageHero } from "@/components/public-site/figma-page-hero";
import { ServicesExperienceBrowser } from "@/components/public-site/services-experience-browser";
import styles from "@/components/public-site/figma-public-pages.module.css";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicRoute } from "@/components/public-site/public-site-routes";
import { listLocalizedPublicExperiences } from "@/lib/content/public-content";
import { getPublishedPublicSiteView } from "@/lib/corporate-content/public-view";
import { resolvePublicSiteMedia } from "@/lib/corporate-content/public-site-media";
import { buildLocalizedPublicMetadata } from "../public-site-metadata";

async function readLocale(
  params: Promise<{ locale: string }> | { locale: string },
): Promise<PublicSiteLocale> {
  const resolvedParams = await params;
  return resolvedParams.locale as PublicSiteLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const site = await getPublishedPublicSiteView(locale);
  const copy = site.content.services;

  return buildLocalizedPublicMetadata({
    locale,
    route: "services",
    title: copy.metadata.title,
    description: copy.metadata.description,
    keywords:
      locale === "en"
        ? ["wakaya services", "weddings", "corporate events", "restaurant", "pucallpa"]
        : ["servicios wakaya", "bodas", "eventos corporativos", "restaurante", "pucallpa"],
    image: resolvePublicSiteMedia(site.media.servicesHero),
  });
}

export default async function PublicSiteServicesLocalePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const site = await getPublishedPublicSiteView(locale);
  const copy = site.content.services;
  const experiences = await listLocalizedPublicExperiences(locale);

  return (
    <>
      <FigmaPageHero
        meta={`${copy.hero.eyebrow} · Wakaya Ecolodge`}
        title={copy.hero.title}
        copy={copy.hero.copy}
        image={resolvePublicSiteMedia(site.media.servicesHero)}
      />

      <section className={styles.section}>
        <ServicesExperienceBrowser
          locale={locale}
          experiences={experiences}
          detailLabel={copy.detailLabel}
          includesLabel={copy.includesLabel}
          recommendationsLabel={copy.recommendationsLabel}
          closeLabel={copy.closeLabel}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.ctaBand}>
          <div>
            <h2 className={styles.ctaTitle}>{copy.ctaTitle}</h2>
            <p className={styles.ctaCopy}>{copy.ctaCopy}</p>
          </div>

          <Link className={styles.buttonLink} href={getPublicRoute(locale, "contact") as Route}>
            {copy.ctaLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
