import PublicSiteServicesLocalePage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/services/page";
import { PROTOTYPE_PUBLIC_SITE_LOCALE } from "../prototype-public-site";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}

export default function PublicSiteServicesPage() {
  return PublicSiteServicesLocalePage({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}
