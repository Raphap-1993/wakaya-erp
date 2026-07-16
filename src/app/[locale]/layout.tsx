import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { PlayFooter } from "@/components/public-site/play-footer";
import { PlayHeader } from "@/components/public-site/play-header";
import { isPublicSiteLocale, listPublicSiteLocales } from "@/components/public-site/public-site-locale";
import { publicSiteMetadataBase } from "@/components/public-site/public-site-metadata";
import { getPublicRoute, type PublicRouteKey } from "@/components/public-site/public-site-routes";
import styles from "@/components/public-site/public-site-theme.module.css";
import { corporateContentStore } from "@/lib/corporate-content/store";
import { resolvePublicSiteMedia } from "@/lib/corporate-content/public-site-media";
import { homeContentStore } from "@/lib/home-content/store";
import { toLocalizedHomeView } from "@/lib/home-content/public-view";
import type { PublicSiteContent } from "./public-site-content";

const FOOTER_NAV_KEYS = [
  "home",
  "bungalows",
  "services",
  "gallery",
  "publications",
  "contact",
] as const satisfies readonly PublicRouteKey[];

export const metadata: Metadata = {
  metadataBase: publicSiteMetadataBase,
};

export function generateStaticParams() {
  return listPublicSiteLocales().map((locale) => ({ locale }));
}

function buildNav(
  locale: ReturnType<typeof listPublicSiteLocales>[number],
  content: PublicSiteContent,
  keys?: readonly PublicRouteKey[],
  respectVisibility = true,
) {
  const allowedKeys = keys ? new Set(keys) : null;

  return content.labels.nav
    .filter((item) =>
      (!respectVisibility || item.visible !== false) &&
      (!allowedKeys || allowedKeys.has(item.key as PublicRouteKey)),
    )
    .map((item) => ({
      key: item.key,
      label: item.label,
      href: getPublicRoute(locale, item.key as PublicRouteKey),
    }));
}

export default async function LocalizedPublicSiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  if (!isPublicSiteLocale(locale)) {
    notFound();
  }

  const [publishedHome, publishedCorporate] = await Promise.all([
    homeContentStore.getPublished(),
    corporateContentStore.getPublished(),
  ]);
  const content = publishedCorporate.document.publicSite.locales[locale];
  const home = toLocalizedHomeView(publishedHome.document, locale);
  const corporateContact = publishedCorporate.document.contact;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <PlayHeader
          locale={locale}
          brandSmall={content.site.brandSmall}
          brandName={content.site.brandName}
          ctaLabel={content.labels.reserveNow}
          localeSwitchLabel={content.labels.languageSwitchLabel}
          navItems={buildNav(locale, content)}
          navigationStyle={home.navigation?.style}
          logoUrl={resolvePublicSiteMedia(publishedCorporate.document.publicSite.media.logo)}
        />
        {children}
      </div>
      <PlayFooter
        locale={locale}
        introCopy={content.labels.footerIntro}
        exploreLabel={content.labels.footerExplore}
        contactLabel={content.labels.footerContact}
        contactItems={[
          corporateContact.address[locale],
          corporateContact.hours[locale],
        ]}
        contactEmail={corporateContact.reservationsEmail}
        contactPhones={corporateContact.phones}
        footerNav={buildNav(locale, content, FOOTER_NAV_KEYS, false)}
        logoUrl={resolvePublicSiteMedia(publishedCorporate.document.publicSite.media.logo)}
      />
    </main>
  );
}
