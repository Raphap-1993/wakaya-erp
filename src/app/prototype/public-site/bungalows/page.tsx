import LocalizedBungalowsPage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/bungalows/page";
import { PROTOTYPE_PUBLIC_SITE_LOCALE } from "../prototype-public-site";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}

export default function BungalowsPage({ searchParams }: PageProps) {
  return LocalizedBungalowsPage({
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
    searchParams,
  });
}
