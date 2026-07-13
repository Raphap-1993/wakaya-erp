import type { Route } from "next";
import Link from "next/link";

import { PageHero } from "@/components/public-site/page-hero";
import {
  publicCompanyAssets,
} from "@/components/public-site/public-company-content";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getPublicRoute } from "@/components/public-site/public-site-routes";
import styles from "@/components/public-site/public-site-theme.module.css";
import { getPublishedCorporateView } from "@/lib/corporate-content/public-view";
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
  const copy = (await getPublishedCorporateView(locale)).content.about;

  return buildLocalizedPublicMetadata({
    locale,
    route: "about",
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords:
      locale === "en"
        ? ["wakaya story", "wakaya company", "amazon ecolodge", "pucallpa retreat"]
        : ["historia wakaya", "empresa wakaya", "ecolodge pucallpa", "naturaleza pucallpa"],
    image: publicCompanyAssets.aboutReception,
  });
}

export default async function PublicSiteAboutLocalePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const copy = (await getPublishedCorporateView(locale)).content.about;

  return (
    <>
      <PageHero
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        breadcrumb={`${locale === "en" ? "Home" : "Inicio"} / ${copy.hero.title}`}
        copy={copy.hero.copy}
        image={publicCompanyAssets.aboutReception}
      />

      <section className={styles.pageSection}>
        <div className={styles.aboutSection}>
          <div>
            <div className={styles.sectionHeader}>
              <h2>{copy.storyTitle}</h2>
              <p>{copy.storyLead}</p>
            </div>
            <span className={styles.publicationMeta}>{copy.storyDate}</span>
            {copy.storyParagraphs.map((paragraph) => (
              <p key={paragraph} className={styles.aboutLead}>
                {paragraph}
              </p>
            ))}
            <div className={styles.roomMeta}>
              {copy.highlights.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className={styles.aboutMosaic}>
            <div className={styles.aboutImageLarge}>
              <img src={publicCompanyAssets.aboutReception} alt={copy.storyTitle} />
            </div>
            <div className={styles.aboutStack}>
              <div className={styles.aboutImageSmall}>
                <img src={publicCompanyAssets.aboutNature} alt={copy.purposeTitle} />
              </div>
              <div className={styles.aboutFactCard}>
                <strong>2019</strong>
                <span>{copy.storyDate}</span>
                <p>{copy.hero.copy}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.pageSection}>
        <div className={styles.editorialGrid}>
          <article className={styles.pageCopyCard}>
            <h3>{copy.purposeTitle}</h3>
            <p>{copy.purposeCopy}</p>
          </article>
          <article className={styles.pageCopyCard}>
            <h3>{copy.meaningTitle}</h3>
            <p>{copy.meaningCopy}</p>
          </article>
        </div>
      </section>

      <section className={styles.pageSection}>
        <div className={styles.sectionHeader}>
          <h2>{copy.valuesTitle}</h2>
          <p>{copy.valuesLead}</p>
        </div>

        <div className={styles.publicationGrid}>
          {copy.values.map((value) => (
            <article key={value.title} className={styles.publicationCard}>
              <strong>{value.title}</strong>
              <p>{value.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.pageSection}>
        <div className={styles.newsletterCard}>
          <h2>{copy.ctaTitle}</h2>
          <p>{copy.ctaCopy}</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href={getPublicRoute(locale, "faq") as Route}>
              {copy.primaryCtaLabel}
            </Link>
            <Link className={styles.ghostButton} href={getPublicRoute(locale, "contact") as Route}>
              {copy.secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
