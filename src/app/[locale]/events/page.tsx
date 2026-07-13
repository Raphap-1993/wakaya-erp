import type { Route } from "next";
import Link from "next/link";

import { PageHero } from "@/components/public-site/page-hero";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicRoute } from "@/components/public-site/public-site-routes";
import styles from "@/components/public-site/public-site-theme.module.css";
import { getPublicSiteContent } from "../public-site-content";
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
  const content = getPublicSiteContent(locale);

  return buildLocalizedPublicMetadata({
    locale,
    route: "events",
    title: content.events.metadata.title,
    description: content.events.metadata.description,
  });
}

export default async function PublicSiteEventsLocalePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const content = getPublicSiteContent(locale);

  return (
    <>
      <PageHero
        eyebrow={content.events.hero.eyebrow}
        title={content.events.hero.title}
        breadcrumb={`${content.labels.breadcrumbHome} / ${content.events.hero.eyebrow}`}
        copy={content.events.hero.copy}
        image="https://wakayaecolodge.com/es/images/wakaya/eventos/evenos_celebraciones_familiar.jpg"
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
            <p>
              {locale === "en"
                ? "We confirm dates, capacity, and every final detail with you before closing the event proposal."
                : "Confirmamos contigo las fechas, la capacidad y cada detalle final antes de cerrar la propuesta del evento."}
            </p>
            <div className={styles.actions}>
              <Link className={styles.primaryButton} href={getPublicRoute(locale, "contact") as Route}>
                {locale === "en" ? "Request proposal" : "Solicitar propuesta"}
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
