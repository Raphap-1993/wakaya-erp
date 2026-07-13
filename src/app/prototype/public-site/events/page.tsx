import PublicSiteEventsLocalePage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/events/page";
import { PROTOTYPE_PUBLIC_SITE_LOCALE } from "../prototype-public-site";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}

export default function PublicSiteEventsPage() {
  return PublicSiteEventsLocalePage({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}
