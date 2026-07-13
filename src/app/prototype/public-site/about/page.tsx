import PublicSiteAboutLocalePage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/about/page";
import { PROTOTYPE_PUBLIC_SITE_LOCALE } from "../prototype-public-site";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}

export default function PublicSiteAboutPage() {
  return PublicSiteAboutLocalePage({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}
