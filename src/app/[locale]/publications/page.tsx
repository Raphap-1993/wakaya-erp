import type { Route } from "next";
import Link from "next/link";

import { PageHero } from "@/components/public-site/page-hero";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicRoute } from "@/components/public-site/public-site-routes";
import styles from "@/components/public-site/public-site-theme.module.css";
import { getPublishedPublicSiteView } from "@/lib/corporate-content/public-view";
import { resolvePublicSiteMedia } from "@/lib/corporate-content/public-site-media";
import { buildLocalizedPublicMetadata } from "../public-site-metadata";

async function readLocale(params: Promise<{ locale: string }> | { locale: string }): Promise<PublicSiteLocale> {
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
  const content = site.content;

  return buildLocalizedPublicMetadata({
    locale,
    route: "publications",
    title: content.publications.metadata.title,
    description: content.publications.metadata.description,
    image: resolvePublicSiteMedia(site.media.publicationsHero),
  });
}

export default async function PublicSitePublicationsLocalePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const site = await getPublishedPublicSiteView(locale);
  const content = site.content;
  return (
    <>
      <PageHero
        eyebrow={content.publications.hero.eyebrow}
        title={content.publications.hero.title}
        breadcrumb={`${content.labels.breadcrumbHome} / ${content.publications.hero.eyebrow}`}
        copy={content.publications.hero.copy}
        image={resolvePublicSiteMedia(site.media.publicationsHero)}
      />

      <section className={styles.pageSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubtitle}>{content.publications.sectionEyebrow}</span>
          <h2>{content.publications.sectionTitle}</h2>
          <p>{content.publications.sectionCopy}</p>
        </div>

        <div className={styles.publicationGrid}>
          {content.publications.items.map((publication) => (
            <article key={publication.slug} className={styles.publicationCard}>
              <span className={styles.publicationMeta}>
                {publication.meta}
              </span>
              <strong>{publication.title}</strong>
              <p>{publication.copy}</p>
              <Link href={getPublicRoute(locale, "contact") as Route}>
                {content.publications.ctaLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.pageSection}>
        <div className={styles.newsletterCard}>
          <span className={styles.sectionSubtitle}>{content.publications.ctaEyebrow}</span>
          <h2>{content.publications.ctaTitle}</h2>
          <p>{content.publications.ctaCopy}</p>
          <Link className={styles.primaryButton} href={getPublicRoute(locale, "bungalows") as Route}>
            {content.publications.ctaButton}
          </Link>
        </div>
      </section>
    </>
  );
}
