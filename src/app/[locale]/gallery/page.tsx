import { FigmaPageHero } from "@/components/public-site/figma-page-hero";
import styles from "@/components/public-site/figma-public-pages.module.css";
import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";
import { getLocalizedPublicGallery } from "@/lib/content/public-content";
import { buildLocalizedPublicMetadata } from "../public-site-metadata";

type GalleryCopy = {
  metaTitle: string;
  metaDescription: string;
  heroMeta: string;
  heroTitle: string;
  heroCopy: string;
};

const GALLERY_HERO = "https://wakayaecolodge.com/es/images/wakaya/gallery/gallery06.jpg";

function getGalleryCopy(locale: PublicSiteLocale): GalleryCopy {
  if (locale === "en") {
    return {
      metaTitle: "Gallery | Wakaya Ecolodge",
      metaDescription: "A visual journey through Wakaya and its tropical landscape.",
      heroMeta: "Images · Wakaya Ecolodge",
      heroTitle: "Gallery",
      heroCopy: "The beauty of Wakaya in images",
    };
  }

  return {
    metaTitle: "Galería | Wakaya Ecolodge",
    metaDescription: "Un recorrido visual por Wakaya y su paisaje tropical.",
    heroMeta: "Imágenes · Wakaya Ecolodge",
    heroTitle: "Galería",
    heroCopy: "La belleza de Wakaya en imágenes",
  };
}

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
  const copy = getGalleryCopy(locale);

  return buildLocalizedPublicMetadata({
    locale,
    route: "gallery",
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords:
      locale === "en"
        ? ["wakaya gallery", "amazon lodge images", "pucallpa ecolodge"]
        : ["galería wakaya", "ecolodge amazónico", "pucallpa"],
    image: GALLERY_HERO,
  });
}

export default async function PublicSiteGalleryLocalePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const locale = await readLocale(params);
  const copy = getGalleryCopy(locale);
  const images = await getLocalizedPublicGallery(locale);

  return (
    <>
      <FigmaPageHero
        meta={copy.heroMeta}
        title={copy.heroTitle}
        copy={copy.heroCopy}
        image={GALLERY_HERO}
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
