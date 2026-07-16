import { FigmaPageHero } from "@/components/public-site/figma-page-hero";
import styles from "@/components/public-site/figma-public-pages.module.css";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getLocalizedPublicGallery } from "@/lib/content/public-content";
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
  const copy = site.content.gallery;

  return buildLocalizedPublicMetadata({
    locale,
    route: "gallery",
    title: copy.metadata.title,
    description: copy.metadata.description,
    keywords:
      locale === "en"
        ? ["wakaya gallery", "amazon lodge images", "pucallpa ecolodge"]
        : ["galería wakaya", "ecolodge amazónico", "pucallpa"],
    image: resolvePublicSiteMedia(site.media.galleryHero),
  });
}

export default async function PublicSiteGalleryLocalePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const site = await getPublishedPublicSiteView(locale);
  const copy = site.content.gallery;
  const images = await getLocalizedPublicGallery(locale);

  return (
    <>
      <FigmaPageHero
        meta={`${copy.hero.eyebrow} · Wakaya Ecolodge`}
        title={copy.hero.title}
        copy={copy.hero.copy}
        image={resolvePublicSiteMedia(site.media.galleryHero)}
      />

      <section className={styles.section}>
        <div className={styles.galleryGrid}>
          {images.map((image) => (
            <article key={image.id} className={styles.galleryTile}>
              <div className={styles.galleryTileImage}>
                <img src={image.image} alt={image.alt} />
              </div>
              <div className={styles.galleryTileLabel}>{image.caption}</div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
