import type { Route } from "next";
import Link from "next/link";

import { PageHero } from "@/components/public-site/page-hero";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicRoute } from "@/components/public-site/public-site-routes";
import styles from "@/components/public-site/public-site-theme.module.css";
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
  const copy = site.content.petFriendly;

  return buildLocalizedPublicMetadata({
    locale,
    route: "petFriendly",
    title: copy.metadata.title,
    description: copy.metadata.description,
    image: resolvePublicSiteMedia(site.media.petFriendlyHero),
    keywords:
      locale === "en"
        ? ["pet friendly pucallpa", "wakaya pet friendly", "travel with pets"]
        : ["pet friendly pucallpa", "wakaya mascotas", "viajar con mascotas"],
  });
}

export default async function PublicSitePetFriendlyPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const site = await getPublishedPublicSiteView(locale);
  const copy = site.content.petFriendly;

  return (
    <>
      <PageHero
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        breadcrumb={`${locale === "en" ? "Home" : "Inicio"} / Pet Friendly`}
        copy={copy.hero.copy}
        image={resolvePublicSiteMedia(site.media.petFriendlyHero)}
      />

      <section className={styles.pageSection}>
        <div className={styles.editorialGrid}>
          {copy.sections.map((section) => (
            <article key={section.title} className={styles.pageCopyCard}>
              <h3>{section.title}</h3>
              <p>{section.copy}</p>
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.pageSection}>
        <div className={styles.newsletterCard}>
          <h2>{copy.ctaTitle}</h2>
          <p>{copy.ctaCopy}</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href={getPublicRoute(locale, "contact") as Route}>
              {copy.ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
