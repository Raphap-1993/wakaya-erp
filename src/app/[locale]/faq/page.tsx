import type { Route } from "next";
import Link from "next/link";

import { PageHero } from "@/components/public-site/page-hero";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicRoute } from "@/components/public-site/public-site-routes";
import styles from "@/components/public-site/public-site-theme.module.css";
import { getPublishedCorporateView } from "@/lib/corporate-content/public-view";
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
  const corporate = await getPublishedCorporateView(locale);
  const copy = corporate.content.faq;

  return buildLocalizedPublicMetadata({
    locale,
    route: "faq",
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords:
      locale === "en"
        ? ["wakaya faq", "booking questions", "wakaya stay", "pucallpa lodge"]
        : ["faq wakaya", "preguntas wakaya", "reservas wakaya", "pucallpa lodge"],
    image: resolvePublicSiteMedia(corporate.siteMedia.faqHero),
  });
}

export default async function PublicSiteFaqPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const corporate = await getPublishedCorporateView(locale);
  const copy = corporate.content.faq;

  return (
    <>
      <PageHero
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        breadcrumb={`${locale === "en" ? "Home" : "Inicio"} / ${copy.hero.title}`}
        copy={copy.hero.copy}
        image={resolvePublicSiteMedia(corporate.siteMedia.faqHero)}
      />

      <section className={styles.pageSection}>
        <div className={styles.sectionHeader}>
          <h2>{copy.introTitle}</h2>
          {copy.introCopy ? <p>{copy.introCopy}</p> : null}
        </div>

        <div className={styles.publicationGrid}>
          {copy.items.map((item) => (
            <article key={item.question} className={styles.publicationCard}>
              <strong>{item.question}</strong>
              <p>{item.answer}</p>
              {item.steps?.length ? (
                <ul className={styles.eventChecklist}>
                  {item.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              ) : null}
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
