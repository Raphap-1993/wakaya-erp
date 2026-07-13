import PublicSitePublicationsLocalePage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/publications/page";
import { PROTOTYPE_PUBLIC_SITE_LOCALE } from "../prototype-public-site";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}

export default function PublicSitePublicationsPage() {
  return PublicSitePublicationsLocalePage({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}
