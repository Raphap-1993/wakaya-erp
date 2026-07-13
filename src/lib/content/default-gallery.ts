import type { PublicSiteLocale } from "@/components/public-site/public-site-locale";

export type DefaultGalleryItem = {
  id: string;
  image: string;
  alt: Record<PublicSiteLocale, string>;
  caption: Record<PublicSiteLocale, string>;
  visible: boolean;
  sortOrder: number;
};

export const DEFAULT_PUBLIC_GALLERY: DefaultGalleryItem[] = Array.from({ length: 18 }, (_, index) => {
  const imageNumber = String(index + 1).padStart(2, "0");
  const label = `Wakaya · ${index + 1}`;

  return {
    id: `gallery-${imageNumber}`,
    image: `https://wakayaecolodge.com/es/images/wakaya/gallery/gallery${imageNumber}.jpg`,
    alt: {
      es: `Galería Wakaya ${index + 1}`,
      en: `Wakaya gallery ${index + 1}`,
    },
    caption: {
      es: label,
      en: label,
    },
    visible: true,
    sortOrder: index + 1,
  };
});

export function getLocalizedDefaultGallery(locale: PublicSiteLocale) {
  return DEFAULT_PUBLIC_GALLERY.filter((item) => item.visible)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({
      id: item.id,
      image: item.image,
      alt: item.alt[locale],
      caption: item.caption[locale],
      sortOrder: item.sortOrder,
    }));
}
