import { describe, expect, it } from "vitest";

import { DEFAULT_CORPORATE_CONTENT } from "./default-document";
import {
  corporateContentDocumentSchema,
  parseStoredCorporateContentDocument,
} from "./schema";
import type { CorporateContentDocument } from "./types";

describe("public site corporate content schema", () => {
  it("rejects empty public page content before publishing", () => {
    const input = structuredClone(DEFAULT_CORPORATE_CONTENT);
    input.publicSite.locales.es.gallery.hero.title = "";

    expect(() => corporateContentDocumentSchema.parse(input)).toThrow(
      "invalid_public_site_content",
    );
  });

  it("hydrates the public site and media registry for revisions created before the CMS expansion", () => {
    const input: CorporateContentDocument = structuredClone(DEFAULT_CORPORATE_CONTENT);
    delete input.publicSite;

    const migrated = parseStoredCorporateContentDocument(input);

    expect(migrated.publicSite.locales.es.contact.hero.title).toBe("Contáctanos");
    expect(migrated.publicSite.locales.en.bungalows.hero.title).toBe("Our Bungalows");
    expect(migrated.publicSite.media.galleryHero.kind).toBe("external");
  });
});
