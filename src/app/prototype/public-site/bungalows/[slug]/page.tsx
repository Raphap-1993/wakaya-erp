import LocalizedBungalowDetailPage, {
  generateMetadata as generateLocalizedMetadata,
  generateStaticParams as generateLocalizedStaticParams,
} from "@/app/[locale]/bungalows/[slug]/page";
import { PROTOTYPE_PUBLIC_SITE_LOCALE } from "../../prototype-public-site";

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export function generateStaticParams() {
  return generateLocalizedStaticParams()
    .filter((item) => item.locale === PROTOTYPE_PUBLIC_SITE_LOCALE)
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Pick<PageProps, "params">) {
  const resolvedParams = await params;

  return generateLocalizedMetadata({
    params: {
      locale: PROTOTYPE_PUBLIC_SITE_LOCALE,
      slug: resolvedParams.slug,
    },
  });
}

export async function defaultExportAdapter({ params, searchParams }: PageProps) {
  const resolvedParams = await params;

  return LocalizedBungalowDetailPage({
    params: {
      locale: PROTOTYPE_PUBLIC_SITE_LOCALE,
      slug: resolvedParams.slug,
    },
    searchParams,
  });
}

export { defaultExportAdapter as default };
