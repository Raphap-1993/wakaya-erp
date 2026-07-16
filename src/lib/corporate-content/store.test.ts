import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_CORPORATE_CONTENT } from "./default-document";
import {
  __resetCorporateContentStoreForTests,
  corporateContentStore,
} from "./store";

describe("corporateContentStore fallback revisions", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    __resetCorporateContentStoreForTests();
  });

  it("starts from the complete default document", async () => {
    const published = await corporateContentStore.getPublished();

    expect(published.revisionVersion).toBe(0);
    expect(published.source).toBe("default");
    expect(published.document.locales.es.policies.termsSections.length).toBeGreaterThan(10);
  });

  it("publishes, detects stale versions and restores without rewriting history", async () => {
    const firstDraft = structuredClone(DEFAULT_CORPORATE_CONTENT);
    firstDraft.contact.hours.es = "Lun–Dom · 8:00 — 20:00";
    const first = await corporateContentStore.publish({
      document: firstDraft,
      expectedVersion: 0,
      actorId: "admin-1",
    });

    const secondDraft = structuredClone(first.document);
    secondDraft.contact.hours.es = "Lun–Dom · 7:00 — 20:00";
    const second = await corporateContentStore.publish({
      document: secondDraft,
      expectedVersion: 1,
      actorId: "admin-2",
    });

    await expect(
      corporateContentStore.publish({
        document: firstDraft,
        expectedVersion: 1,
        actorId: "admin-stale",
      }),
    ).rejects.toThrow("corporate_content_version_conflict");

    const restored = await corporateContentStore.restore(1, "admin-3", 2);
    const revisions = await corporateContentStore.listRevisions();

    expect(second.revisionVersion).toBe(2);
    expect(restored.revisionVersion).toBe(3);
    expect(restored.restoredFromVersion).toBe(1);
    expect(restored.document.contact.hours.es).toBe("Lun–Dom · 8:00 — 20:00");
    expect(revisions.map((revision) => revision.revisionVersion)).toEqual([3, 2, 1]);
    expect(revisions.every((revision) => !("document" in revision))).toBe(true);
  });
});
