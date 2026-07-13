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
    route: "publications",
    title: content.publications.metadata.title,
    description: content.publications.metadata.description,
  });
}

export default async function PublicSitePublicationsLocalePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const content = getPublicSiteContent(locale);
  const publicationMeta =
    locale === "en"
      ? [
          "Editorial · Events",
          "Guide · Full day",
          "Comparison · Bungalows",
        ]
      : [
          "Editorial · Eventos",
          "Guia · Full day",
          "Comparativa · Bungalows",
        ];
  const publicationCopy =
    locale === "en"
      ? [
          "How a more intimate celebration can feel aligned with Wakaya's calm and tropical setting.",
          "A shorter visit with access to Wakaya's landscape, facilities, and hospitality.",
          "A faster read to understand category, atmosphere, and fit before sending the final request.",
        ]
      : [
          "Como una celebracion mas intima puede mantenerse alineada con la calma y el entorno tropical de Wakaya.",
          "Una visita corta para disfrutar del paisaje, las instalaciones y la hospitalidad de Wakaya.",
          "Una lectura rapida para entender categoria, atmosfera y elegir mejor antes de enviar tu solicitud.",
        ];

  return (
    <>
      <PageHero
        eyebrow={content.publications.hero.eyebrow}
        title={content.publications.hero.title}
        breadcrumb={`${content.labels.breadcrumbHome} / ${content.publications.hero.eyebrow}`}
        copy={content.publications.hero.copy}
        image="https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png"
      />

      <section className={styles.pageSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionSubtitle}>{content.publications.sectionEyebrow}</span>
          <h2>{content.publications.sectionTitle}</h2>
          <p>{content.publications.sectionCopy}</p>
        </div>

        <div className={styles.publicationGrid}>
          {[
            ...content.publications.items,
            {
              slug: "que-bungalow-encaja",
              title:
                locale === "en"
                  ? "Which bungalow fits your stay best"
                  : "Que bungalow encaja mejor con tu plan",
            },
          ].map((publication, index) => (
            <article key={publication.slug} className={styles.publicationCard}>
              <span className={styles.publicationMeta}>
                {publicationMeta[index] ?? publicationMeta[publicationMeta.length - 1]}
              </span>
              <strong>{publication.title}</strong>
              <p>{publicationCopy[index] ?? publicationCopy[publicationCopy.length - 1]}</p>
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
