import { describe, expect, it } from "vitest";

import { DEFAULT_CORPORATE_CONTENT } from "./default-content";
import {
  corporateContentDocumentSchema,
  parseStoredCorporateContentDocument,
} from "./schema";

describe("corporateContentDocumentSchema", () => {
  it("accepts the complete bilingual legacy import", () => {
    expect(corporateContentDocumentSchema.parse(DEFAULT_CORPORATE_CONTENT)).toEqual(
      DEFAULT_CORPORATE_CONTENT,
    );
  });

  it("keeps the detailed legacy rules instead of generic summaries", () => {
    const es = DEFAULT_CORPORATE_CONTENT.locales.es;
    const termText = es.policies.termsSections.map((section) => section.copy).join(" ");
    const privacyText = es.policies.privacySections.map((section) => section.copy).join(" ");

    expect(es.policies.termsSections.length).toBeGreaterThanOrEqual(12);
    expect(es.policies.privacySections.length).toBeGreaterThanOrEqual(13);
    expect(termText).toContain("24 horas");
    expect(termText).toContain("48 horas");
    expect(termText).toContain("50%");
    expect(termText).toContain("30 días");
    expect(es.policies.termsSections.map((section) => section.id)).toEqual(
      expect.arrayContaining(["reservations", "payments", "cancellations"]),
    );
    expect(privacyText).toContain("Ley N.º 29733");
    expect(privacyText).toContain("administracion@wakayaecolodge.com");
    expect(privacyText).not.toContain("Ley N° 27086");
  });

  it("keeps verified contact data and internal discrepancies separate", () => {
    expect(DEFAULT_CORPORATE_CONTENT.contact.phones).toEqual([
      "+51 961 508 813",
      "+51 977 419 468",
    ]);
    expect(DEFAULT_CORPORATE_CONTENT.contact.whatsapp).toBe("+51 961 508 813");
    expect(DEFAULT_CORPORATE_CONTENT.contact.hours.es).toBe("Lun–Dom · 7:00 — 20:00");
    expect(DEFAULT_CORPORATE_CONTENT.internal.notes.join(" ")).toContain("25 %");
  });

  it("preserves the complete scraped wording as an internal source archive", () => {
    const terms = DEFAULT_CORPORATE_CONTENT.internal.legacyPages.find(
      (page) => page.slug === "terms",
    );
    const about = DEFAULT_CORPORATE_CONTENT.internal.legacyPages.find(
      (page) => page.slug === "aboutus",
    );

    expect(terms?.headings).toHaveLength(19);
    expect(terms?.paragraphs).toHaveLength(20);
    expect(terms?.paragraphs.join(" ")).toContain("derecho de retención y prenda");
    expect(terms?.paragraphs.join(" ")).toContain("recargo de 25%");
    expect(about?.paragraphs.join(" ")).toContain("laguna natural de 4,000 mt2");
  });

  it("rejects a document with an empty localized required field", () => {
    const input = structuredClone(DEFAULT_CORPORATE_CONTENT);
    input.locales.en.policies.termsSections[0].title = "";

    expect(() => corporateContentDocumentSchema.parse(input)).toThrow("required");
  });

  it("rejects duplicate public section ids", () => {
    const input = structuredClone(DEFAULT_CORPORATE_CONTENT);
    input.locales.es.policies.termsSections[1].id =
      input.locales.es.policies.termsSections[0].id;

    expect(() => corporateContentDocumentSchema.parse(input)).toThrow("duplicate_section_id");
  });

  it("reserves the public footer anchors", () => {
    const input = structuredClone(DEFAULT_CORPORATE_CONTENT);
    input.locales.es.policies.termsSections = input.locales.es.policies.termsSections.filter(
      (section) => section.id !== "payments",
    );

    expect(() => corporateContentDocumentSchema.parse(input)).toThrow("required_policy_anchor");
  });

  it("rejects ids duplicated between terms and privacy", () => {
    const input = structuredClone(DEFAULT_CORPORATE_CONTENT);
    input.locales.es.policies.privacySections[0].id = "reservations";

    expect(() => corporateContentDocumentSchema.parse(input)).toThrow("duplicate_section_id");
  });

  it("migrates the temporary legacy payments anchor when reading stored revisions", () => {
    const input = structuredClone(DEFAULT_CORPORATE_CONTENT);
    for (const locale of ["es", "en"] as const) {
      const payments = input.locales[locale].policies.termsSections.find(
        (section) => section.id === "payments",
      );
      if (payments) payments.id = "rates-payments";
    }

    expect(() => corporateContentDocumentSchema.parse(input)).toThrow("required_policy_anchor");
    expect(
      parseStoredCorporateContentDocument(input).locales.es.policies.termsSections.some(
        (section) => section.id === "payments",
      ),
    ).toBe(true);
  });
});
