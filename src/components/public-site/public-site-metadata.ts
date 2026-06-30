import type { Metadata } from 'next';

const siteName = 'Wakaya Ecolodge';
const defaultImage =
  'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png';

type BuildPublicMetadataArgs = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
};

export const publicSiteMetadataBase = new URL('https://wakayaecolodge.com');

export function buildPublicMetadata({
  title,
  description,
  path,
  keywords = [],
  image = defaultImage,
}: BuildPublicMetadataArgs): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      url: path,
      images: [
        {
          url: image,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
