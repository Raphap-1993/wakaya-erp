import type { PublicCompanyContent } from "@/components/public-site/public-company-content";

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

export type CorporateContentDocument = {
  schemaVersion: 1;
  locales: {
    es: PublicCompanyContent;
    en: PublicCompanyContent;
  };
  contact: CorporateContact;
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

export type CorporateContentRevisionRecord = {
  revisionVersion: number;
  document: CorporateContentDocument;
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
  document: CorporateContentDocument;
  expectedVersion: number;
  actorId: string | null;
  restoredFromVersion?: number | null;
};
