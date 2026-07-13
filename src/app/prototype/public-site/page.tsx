import LocalizedPublicHomePage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/page";
import { PROTOTYPE_PUBLIC_SITE_LOCALE } from "./prototype-public-site";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}

export default function PublicSitePrototypePage() {
  return LocalizedPublicHomePage({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}
