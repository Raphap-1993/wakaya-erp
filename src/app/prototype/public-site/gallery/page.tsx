import PublicSiteGalleryLocalePage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/gallery/page";
import { PROTOTYPE_PUBLIC_SITE_LOCALE } from "../prototype-public-site";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}

export default function PublicSiteGalleryPage() {
  return PublicSiteGalleryLocalePage({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}
