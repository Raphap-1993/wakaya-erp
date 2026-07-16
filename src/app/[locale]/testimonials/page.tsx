import { PageHero } from "@/components/public-site/page-hero";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
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
  const copy = corporate.content.testimonials;

  return buildLocalizedPublicMetadata({
    locale,
    route: "testimonials",
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords:
      locale === "en"
        ? ["wakaya testimonials", "guest reviews", "wakaya guests"]
        : ["testimonios wakaya", "huespedes wakaya", "opiniones wakaya"],
    image: resolvePublicSiteMedia(corporate.siteMedia.testimonialsHero),
  });
}

export default async function PublicSiteTestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const corporate = await getPublishedCorporateView(locale);
  const copy = corporate.content.testimonials;

  return (
    <>
      <PageHero
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        breadcrumb={`${locale === "en" ? "Home" : "Inicio"} / ${copy.hero.title}`}
        copy={copy.hero.copy}
        image={resolvePublicSiteMedia(corporate.siteMedia.testimonialsHero)}
      />

      <section className={styles.pageSection}>
        <div className={styles.sectionHeader}>
          <h2>{copy.introTitle}</h2>
          {copy.introCopy ? <p>{copy.introCopy}</p> : null}
        </div>

        <div className={styles.companyQuoteGrid}>
          {copy.items.map((item) => (
            <article key={`${item.author}-${item.country}`} className={styles.quoteCard}>
              <div className={styles.companyQuoteHeader}>
                <img
                  className={styles.companyQuotePortrait}
                  src={item.image}
                  alt={`${item.author} · ${item.country}`}
                />
                <div className={styles.companyQuoteMeta}>
                  <strong>{item.author}</strong>
                  <span>{item.country}</span>
                </div>
              </div>
              <p>{item.quote}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
