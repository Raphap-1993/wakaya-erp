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
  const copy = (await getPublishedCorporateView(locale)).content.policies;

  return buildLocalizedPublicMetadata({
    locale,
    route: "hotelPolicies",
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords:
      locale === "en"
        ? ["wakaya policies", "wakaya terms", "wakaya privacy", "pucallpa lodge terms"]
        : ["politicas wakaya", "terminos wakaya", "privacidad wakaya", "pucallpa lodge"],
    image: publicCompanyAssets.aboutNature,
  });
}

export default async function PublicSiteHotelPoliciesPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const copy = (await getPublishedCorporateView(locale)).content.policies;

  return (
    <>
      <PageHero
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        breadcrumb={`${locale === "en" ? "Home" : "Inicio"} / ${copy.hero.title}`}
        copy={copy.hero.copy}
        image={publicCompanyAssets.aboutNature}
      />

      <section className={styles.pageSection}>
        <div className={styles.sectionHeader}>
          <h2>{copy.termsTitle}</h2>
          <p>{copy.termsCopy}</p>
        </div>

        <div className={styles.publicationGrid}>
          {copy.termsSections.map((item) => (
            <article key={item.id} id={item.id} className={styles.publicationCard}>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.pageSection}>
        <div className={styles.sectionHeader}>
          <h2>{copy.privacyTitle}</h2>
          <p>{copy.privacyCopy}</p>
        </div>

        <div className={styles.publicationGrid}>
          {copy.privacySections.map((item) => (
            <article key={item.id} id={item.id} className={styles.publicationCard}>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
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
