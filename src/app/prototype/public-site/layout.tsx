import type { Metadata } from "next";
import type { ReactNode } from "react";

import LocalizedPublicSiteLayout from "@/app/[locale]/layout";
import { publicSiteMetadataBase } from "@/components/public-site/public-site-metadata";
import { PROTOTYPE_PUBLIC_SITE_LOCALE } from "./prototype-public-site";

export const metadata: Metadata = {
  metadataBase: publicSiteMetadataBase,
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PublicSiteLayout({ children }: { children: ReactNode }) {
  return LocalizedPublicSiteLayout({
    children,
    params: { locale: PROTOTYPE_PUBLIC_SITE_LOCALE },
  });
}
