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
    route: "events",
    title: content.events.metadata.title,
    description: content.events.metadata.description,
    image: resolvePublicSiteMedia(site.media.eventsHero),
  });
}

export default async function PublicSiteEventsLocalePage({
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
        eyebrow={content.events.hero.eyebrow}
        title={content.events.hero.title}
        breadcrumb={`${content.labels.breadcrumbHome} / ${content.events.hero.eyebrow}`}
        copy={content.events.hero.copy}
        image={resolvePublicSiteMedia(site.media.eventsHero)}
      />

      <section className={styles.pageSection}>
        <div className={styles.editorialGrid}>
          <article className={styles.pageCopyCard}>
            <h3>{content.events.bodyTitle}</h3>
            <p>{content.events.bodyCopy}</p>
            <ul className={styles.eventChecklist}>
              {content.events.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className={styles.pageCopyCard}>
            <h3>{content.events.venueBadge}</h3>
            <p>{content.events.proposalCopy}</p>
            <div className={styles.actions}>
              <Link className={styles.primaryButton} href={getPublicRoute(locale, "contact") as Route}>
                {content.events.proposalCtaLabel}
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
