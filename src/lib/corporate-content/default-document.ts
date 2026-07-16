import { DEFAULT_PUBLIC_SITE_CONTENT } from "@/app/[locale]/public-site-content";

import { DEFAULT_CORPORATE_CONTENT as LEGACY_DEFAULT_CORPORATE_CONTENT } from "./default-content";
import { DEFAULT_PUBLIC_SITE_MEDIA } from "./public-site-media";
import type { ResolvedCorporateContentDocument } from "./types";

export const DEFAULT_CORPORATE_CONTENT: ResolvedCorporateContentDocument = {
  ...LEGACY_DEFAULT_CORPORATE_CONTENT,
  publicSite: {
    locales: structuredClone(DEFAULT_PUBLIC_SITE_CONTENT),
    media: structuredClone(DEFAULT_PUBLIC_SITE_MEDIA),
  },
};
