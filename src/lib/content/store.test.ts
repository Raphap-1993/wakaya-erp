import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";

import { PostgresContentStore } from "./store";
import type { ExperienceInput, GalleryItemInput } from "./types";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

function createPool(): Pool {
  return {
    query: queryMock,
  } as unknown as Pool;
}

const validExperience: ExperienceInput = {
  id: "exp_01",
  slug: "paseo-laguna",
  visible: true,
  featuredOnHome: true,
  sortOrder: 1,
  iconKey: "lagoon",
  localeContent: {
    es: {
      title: "Paseo por la laguna",
      summary: "Un recorrido corto al atardecer.",
      body: "Explora la laguna con guía local y retorno al lodge.",
      duration: "45 min",
      priceLabel: "S/ 120",
      ctaLabel: "Reservar experiencia",
      included: ["Guía local"],
      recommendations: ["Reservar con anticipación"],
    },
    en: {
      title: "Lagoon tour",
      summary: "A short sunset ride.",
      body: "Explore the lagoon with a local guide and return to the lodge.",
      duration: "45 min",
      priceLabel: "PEN 120",
      ctaLabel: "Book experience",
      included: ["Local guide"],
      recommendations: ["Book in advance"],
    },
  },
  cardAssetId: "asset_card_01",
  heroAssetId: "asset_hero_01",
  galleryAssetIds: ["asset_gallery_01"],
};

describe("PostgresContentStore", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("creates an experience with version 1", async () => {
    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (normalized.startsWith("insert into content_experience")) {
        return {
          rows: [
            {
              id: values?.[0],
              slug: values?.[1],
              visible: values?.[2],
              featured_on_home: values?.[3],
              sort_order: values?.[4],
              icon_key: values?.[5],
              locale_content: values?.[6],
              card_asset_id: values?.[7],
              hero_asset_id: values?.[8],
              gallery_asset_ids: values?.[9],
              version: 1,
              deleted_at: null,
            },
          ],
          rowCount: 1,
        };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    const store = new PostgresContentStore(createPool());

    await expect(store.createExperience(validExperience)).resolves.toMatchObject({
      slug: "paseo-laguna",
      version: 1,
    });
  });

  it("rejects gallery publications with duplicated order values", async () => {
    const duplicatedOrder: GalleryItemInput[] = [
      {
        id: "gallery_01",
        assetId: "asset_01",
        visible: true,
        sortOrder: 1,
        localeContent: {
          es: { alt: "Vista del embarcadero", caption: "Embarcadero" },
          en: { alt: "View of the pier", caption: "Pier" },
        },
      },
      {
        id: "gallery_02",
        assetId: "asset_02",
        visible: true,
        sortOrder: 1,
        localeContent: {
          es: { alt: "Vista del bosque", caption: "Bosque" },
          en: { alt: "View of the forest", caption: "Forest" },
        },
      },
    ];

    const store = new PostgresContentStore(createPool());

    await expect(
      store.publishGallery({
        expectedVersion: 7,
        actorId: "user-content-1",
        items: duplicatedOrder,
      }),
    ).rejects.toThrow("content_order_invalid");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("updates bungalow content with optimistic versioning", async () => {
    queryMock.mockImplementation(async (sql: string, values?: unknown[]) => {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();

      if (normalized.startsWith("select revision_version")) {
        return {
          rows: [{ revision_version: 3 }],
          rowCount: 1,
        };
      }

      if (normalized.startsWith("insert into bungalow_public_content")) {
        return {
          rows: [
            {
              bungalow_id: values?.[0],
              featured_on_home: values?.[1],
              sort_order: values?.[2],
              hero_image_url: values?.[3],
              gallery_urls: values?.[4],
              nightly_rate_pen: values?.[5],
              area_sqm: values?.[6],
              locale_content: values?.[7],
              hero_asset_id: values?.[8],
              gallery_asset_ids: values?.[9],
              revision_version: values?.[10],
              updated_at: values?.[11],
            },
          ],
          rowCount: 1,
        };
      }

      throw new Error(`Unexpected query: ${normalized}`);
    });

    const store = new PostgresContentStore(createPool());

    await expect(
      store.updateBungalowContent("bungalow-family", {
        expectedVersion: 3,
        featuredOnHome: true,
        sortOrder: 1,
        heroImageUrl: "https://example.com/hero.webp",
        galleryUrls: ["https://example.com/gallery-1.webp"],
        nightlyRatePen: 350,
        areaSqm: 55,
        localeContent: {
          es: {
            displayName: "Bungalow Familiar",
            displayEyebrow: "Wakaya",
            displayDescription: "Dos habitaciones independientes.",
            displayTagline: "Familia en la selva",
            displayLongDescription: "Espacio amplio para viajar en grupo.",
            displayHighlights: ["Dos dormitorios"],
            displayAmenities: ["WiFi"],
            displayIncluded: ["Desayuno"],
          },
          en: {
            displayName: "Family bungalow",
            displayEyebrow: "Wakaya",
            displayDescription: "Two independent bedrooms.",
            displayTagline: "Family in the jungle",
            displayLongDescription: "Spacious layout for group stays.",
            displayHighlights: ["Two bedrooms"],
            displayAmenities: ["WiFi"],
            displayIncluded: ["Breakfast"],
          },
        },
        heroAssetId: "asset_hero_01",
        galleryAssetIds: ["asset_gallery_01"],
      }),
    ).resolves.toMatchObject({
      bungalowId: "bungalow-family",
      revisionVersion: 4,
    });
  });
});
