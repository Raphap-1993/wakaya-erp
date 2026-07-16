import type { PublicCompanyContent } from "@/components/public-site/public-company-content";
import type { PublicSiteContent } from "@/app/[locale]/public-site-content";

export const CORPORATE_REQUIRED_TERM_SECTION_IDS = [
  "reservations",
  "payments",
  "cancellations",
] as const;

export type LocalizedCorporateText = {
  es: string;
  en: string;
};

export type CorporateContact = {
  address: LocalizedCorporateText;
  locationNote: LocalizedCorporateText;
  phones: string[];
  whatsapp: string;
  reservationsEmail: string;
  privacyEmail: string;
  hours: LocalizedCorporateText;
};

export type PublicSiteMediaReference =
  | { kind: "asset"; assetId: string }
  | { kind: "external"; url: string }
  | { kind: "none" };

export type PublicSiteMediaSlot =
  | "logo"
  | "aboutHero"
  | "aboutSecondary"
  | "faqHero"
  | "testimonialsHero"
  | "policiesHero"
  | "bungalowsHero"
  | "servicesHero"
  | "galleryHero"
  | "contactHero"
  | "eventsHero"
  | "publicationsHero"
  | "petFriendlyHero"
  | "complaintsHero";

export type CorporatePublicSiteContent = {
  locales: {
    es: PublicSiteContent;
    en: PublicSiteContent;
  };
  media: Record<PublicSiteMediaSlot, PublicSiteMediaReference>;
};

export type CorporateContentDocument = {
  schemaVersion: 1;
  locales: {
    es: PublicCompanyContent;
    en: PublicCompanyContent;
  };
  contact: CorporateContact;
  publicSite?: CorporatePublicSiteContent;
  internal: {
    sourceLabel: string;
    sourceUrls: string[];
    notes: string[];
    legacyPages: Array<{
      slug: string;
      title: string;
      url: string;
      headings: string[];
      paragraphs: string[];
    }>;
  };
};

export type ResolvedCorporateContentDocument = CorporateContentDocument & {
  publicSite: CorporatePublicSiteContent;
};

export type CorporateContentRevisionRecord = {
  revisionVersion: number;
  document: ResolvedCorporateContentDocument;
  updatedAt: string;
  updatedByUserId: string | null;
  restoredFromVersion: number | null;
  source: "default" | "published";
};

export type CorporateContentRevisionSummary = Omit<
  CorporateContentRevisionRecord,
  "document"
>;

export type PublishCorporateContentInput = {
  document: ResolvedCorporateContentDocument;
  expectedVersion: number;
  actorId: string | null;
  restoredFromVersion?: number | null;
};
