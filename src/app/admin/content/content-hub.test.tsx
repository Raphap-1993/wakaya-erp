import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { ContentMediaAsset } from "@/lib/content/media/content-media-service";
import {
  applyContentHubMediaAsset,
  ContentHub,
  rememberMediaAsset,
} from "./content-hub";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/app/admin/home/home-editor", () => ({
  HomeEditor: ({
    mediaMetadata,
    onMediaAssetCreated,
  }: {
    mediaMetadata?: Record<string, { assetId: string; originalFilename: string }>;
    onMediaAssetCreated?: (asset: ContentMediaAsset) => void;
  }) => (
    <div
      data-home-media-metadata={JSON.stringify(mediaMetadata)}
      data-home-media-callback={String(typeof onMediaAssetCreated === "function")}
    >
      Mock home editor
    </div>
  ),
}));
vi.mock("@/app/admin/content/corporate-content-editor", () => ({
  CorporateContentEditor: () => <div>Mock corporate editor</div>,
}));

const baseProps = {
  initialHomeItem: {
    revisionVersion: 3,
    document: { schemaVersion: 2 as const, slider: { autoplayMs: 4000, slides: [] }, sections: [] },
    updatedAt: "2026-07-10T00:00:00.000Z",
    updatedByUserId: "admin-user-1",
    restoredFromVersion: null,
    source: "published" as const,
  },
  initialHomeRevisions: [],
  initialExperiences: [],
  initialGallery: {
    id: "global" as const,
    version: 1,
    updatedBy: "admin-user-1",
    updatedAt: "2026-07-10T00:00:00.000Z",
    items: [],
  },
  initialBungalows: [
    {
      bungalow: {
        id: "bungalow-family",
        name: "Bungalow Familiar",
        code: "FAMILY",
        active: true,
        capacity: 4,
      },
      publicContent: {
        bungalowId: "bungalow-family",
        revisionVersion: 1,
        featuredOnHome: true,
        sortOrder: 1,
        heroImageUrl: "",
        galleryUrls: [],
        nightlyRatePen: 350,
        areaSqm: 55,
        localeContent: {
          es: {
            displayName: "Bungalow Familiar",
            displayEyebrow: "Wakaya",
            displayDescription: "Descripción",
            displayTagline: "Tagline",
            displayLongDescription: "Long",
            displayHighlights: ["A"],
            displayAmenities: ["B"],
            displayIncluded: ["C"],
          },
          en: {
            displayName: "Family bungalow",
            displayEyebrow: "Wakaya",
            displayDescription: "Description",
            displayTagline: "Tagline",
            displayLongDescription: "Long",
            displayHighlights: ["A"],
            displayAmenities: ["B"],
            displayIncluded: ["C"],
          },
        },
        heroAssetId: null,
        galleryAssetIds: [],
        updatedAt: "2026-07-10T00:00:00.000Z",
      },
    },
  ],
  initialBungalowId: "bungalow-family",
};

const mediaMetadataFixture = {
  asset_card: {
    assetId: "asset_card",
    originalFilename: "experiencia-card.jpg",
  },
  asset_hero: {
    assetId: "asset_hero",
    originalFilename: "experiencia-hero.png",
  },
  asset_gallery: {
    assetId: "asset_gallery",
    originalFilename: "galeria-rio.jpeg",
  },
  asset_bungalow_hero: {
    assetId: "asset_bungalow_hero",
    originalFilename: "bungalow-portada.jpg",
  },
  asset_bungalow_gallery: {
    assetId: "asset_bungalow_gallery",
    originalFilename: "bungalow-interior.webp",
  },
};

const experienceFixture = {
  id: "experience-river",
  slug: "rio-wakaya",
  visible: true,
  featuredOnHome: true,
  sortOrder: 1,
  iconKey: "spark",
  localeContent: {
    es: {
      title: "Río Wakaya",
      summary: "Resumen",
      body: "Detalle",
      duration: "2 horas",
      priceLabel: "Consultar",
      ctaLabel: "Reservar",
      included: ["Guía"],
      recommendations: ["Repelente"],
    },
    en: {
      title: "Wakaya river",
      summary: "Summary",
      body: "Detail",
      duration: "2 hours",
      priceLabel: "Ask us",
      ctaLabel: "Book",
      included: ["Guide"],
      recommendations: ["Repellent"],
    },
  },
  cardAssetId: "asset_card",
  heroAssetId: "asset_hero",
  galleryAssetIds: [],
  version: 1,
  deletedAt: null,
};

function countMediaPreviewTriggers(html: string) {
  return html.match(/aria-haspopup="dialog"/g)?.length ?? 0;
}

describe("ContentHub", () => {
  it("starts with a daily content worklist instead of opening a large editor", () => {
    const html = renderToStaticMarkup(<ContentHub {...baseProps} initialTab="overview" />);

    expect(html).toContain("¿Qué quieres gestionar?");
    expect(html).toContain('href="/admin/content?tab=home"');
    expect(html).toContain('href="/admin/content?tab=company"');
    expect(html).toContain('href="/admin/content?tab=experiences"');
    expect(html).toContain('href="/admin/content?tab=gallery"');
    expect(html).toContain('href="/admin/content?tab=bungalows"');
    expect(html).toContain("Editar Home");
    expect(html).toContain("Gestionar páginas");
    expect(html).not.toContain("Mock home editor");
  });

  it("renders the unified editorial tabs", () => {
    const html = renderToStaticMarkup(<ContentHub {...baseProps} initialTab="home" />);

    expect(html).toContain("Contenido público");
    expect(html).toContain("Home");
    expect(html).toContain("Experiencias");
    expect(html).toContain("Galería");
    expect(html).toContain("Bungalows");
    expect(html).toContain(">Páginas</button>");
    expect(html).toContain("Mock home editor");
  });

  it("passes hydrated media metadata and the remember callback to Home", () => {
    const html = renderToStaticMarkup(
      <ContentHub
        {...baseProps}
        initialTab="home"
        initialMediaMetadata={{
          asset_home_01: {
            assetId: "asset_home_01",
            originalFilename: "Selva Wakaya.jpg",
          },
        }}
      />,
    );

    expect(html).toContain("Selva Wakaya.jpg");
    expect(html).toContain('data-home-media-callback="true"');
  });

  it("remembers a newly uploaded asset in a plain metadata map", () => {
    const asset = {
      id: "asset_home_02",
      originalFilename: "gallery01.jpg",
      status: "ready",
      master: {
        url: "/media/assets/asset_home_02/master.webp",
        width: 2400,
        height: 1600,
        format: "webp",
        quality: 95,
        nearLossless: true,
      },
      variants: {},
    } satisfies ContentMediaAsset;

    expect(
      rememberMediaAsset(
        {
          asset_home_01: {
            assetId: "asset_home_01",
            originalFilename: "Selva Wakaya.jpg",
          },
        },
        asset,
      ),
    ).toEqual({
      asset_home_01: {
        assetId: "asset_home_01",
        originalFilename: "Selva Wakaya.jpg",
      },
      asset_home_02: {
        assetId: "asset_home_02",
        originalFilename: "gallery01.jpg",
      },
    });
  });

  it("remembers uploaded metadata before applying the asset to its ContentHub field", () => {
    const asset = {
      id: "asset_gallery_new",
      originalFilename: "galeria-nueva.jpg",
      status: "ready",
      master: {
        url: "/media/assets/asset_gallery_new/master.webp",
        width: 2400,
        height: 1600,
        format: "webp",
        quality: 95,
        nearLossless: true,
      },
      variants: {},
    } satisfies ContentMediaAsset;
    const calls: string[] = [];
    applyContentHubMediaAsset(
      asset,
      (createdAsset) => calls.push(`remember:${createdAsset.originalFilename}`),
      (createdAsset) => calls.push(`apply:${createdAsset.id}`),
    );

    expect(calls).toEqual([
      "remember:galeria-nueva.jpg",
      "apply:asset_gallery_new",
    ]);
  });

  it("shows clickable filenames and the correct card and hero previews for experiences", () => {
    const html = renderToStaticMarkup(
      <ContentHub
        {...baseProps}
        initialTab="experiences"
        initialExperiences={[experienceFixture]}
        initialMediaMetadata={mediaMetadataFixture}
      />,
    );

    expect(html).toContain("experiencia-card.jpg");
    expect(html).toContain("experiencia-hero.png");
    expect(html).toContain('src="/media/assets/asset_card/card.webp"');
    expect(html).toContain('src="/media/assets/asset_hero/heroDesktop.webp"');
    expect(countMediaPreviewTriggers(html)).toBe(2);
    expect(html).not.toContain("Imagen asociada");
  });

  it("shows the global Gallery filename with its detail preview and inline image", () => {
    const html = renderToStaticMarkup(
      <ContentHub
        {...baseProps}
        initialTab="gallery"
        initialGallery={{
          ...baseProps.initialGallery,
          items: [
            {
              id: "gallery_01",
              assetId: "asset_gallery",
              visible: true,
              sortOrder: 1,
              localeContent: {
                es: { alt: "Río", caption: "Río Wakaya" },
                en: { alt: "River", caption: "Wakaya river" },
              },
            },
          ],
        }}
        initialMediaMetadata={mediaMetadataFixture}
      />,
    );

    expect(html).toContain("galeria-rio.jpeg");
    expect(html).toContain('src="/media/assets/asset_gallery/detail.webp"');
    expect(countMediaPreviewTriggers(html)).toBe(1);
    expect(html).not.toContain("Imagen asociada");
  });

  it("shows managed Bungalow hero and gallery filenames without removing order or remove actions", () => {
    const html = renderToStaticMarkup(
      <ContentHub
        {...baseProps}
        initialTab="bungalows"
        initialBungalows={[
          {
            ...baseProps.initialBungalows[0],
            publicContent: {
              ...baseProps.initialBungalows[0].publicContent,
              heroAssetId: "asset_bungalow_hero",
              heroImageUrl:
                "/media/assets/asset_bungalow_hero/heroDesktop.webp",
              galleryAssetIds: ["asset_bungalow_gallery"],
            },
          },
        ]}
        initialMediaMetadata={mediaMetadataFixture}
      />,
    );

    expect(html).toContain("bungalow-portada.jpg");
    expect(html).toContain("bungalow-interior.webp");
    expect(html).toContain(
      'src="/media/assets/asset_bungalow_hero/heroDesktop.webp"',
    );
    expect(html).toContain(
      'src="/media/assets/asset_bungalow_gallery/detail.webp"',
    );
    expect(html).toContain("Subir orden");
    expect(html).toContain("Bajar orden");
    expect(html).toContain("Quitar");
    expect(countMediaPreviewTriggers(html)).toBe(2);
  });

  it("uses safe URL basenames for legacy Bungalow hero and gallery previews", () => {
    const html = renderToStaticMarkup(
      <ContentHub
        {...baseProps}
        initialTab="bungalows"
        initialBungalows={[
          {
            ...baseProps.initialBungalows[0],
            publicContent: {
              ...baseProps.initialBungalows[0].publicContent,
              heroAssetId: null,
              heroImageUrl: "https://legacy.wakaya.test/hero/portada.jpg?rev=2",
              galleryAssetIds: [],
              galleryUrls: [
                "https://legacy.wakaya.test/bungalows/BF_2.jpg?x=1",
              ],
            },
          },
        ]}
        initialMediaMetadata={mediaMetadataFixture}
      />,
    );

    expect(html).toContain("portada.jpg");
    expect(html).toContain("BF_2.jpg");
    expect(html).toContain(
      'src="https://legacy.wakaya.test/hero/portada.jpg?rev=2"',
    );
    expect(html).toContain(
      'src="https://legacy.wakaya.test/bungalows/BF_2.jpg?x=1"',
    );
    expect(html).toContain(">Reemplazar</button>");
    expect(countMediaPreviewTriggers(html)).toBe(2);
  });

  it("keeps Pages free of media preview dialog triggers", () => {
    const html = renderToStaticMarkup(
      <ContentHub
        {...baseProps}
        initialTab="company"
        initialMediaMetadata={mediaMetadataFixture}
      />,
    );

    expect(html).toContain(">Páginas</button>");
    expect(countMediaPreviewTriggers(html)).toBe(0);
  });

  it("keeps public bungalow editing separate from aggregate capacity", () => {
    const html = renderToStaticMarkup(<ContentHub {...baseProps} initialTab="bungalows" />);

    expect(html).toContain("Área m²");
    expect(html).toContain("Descripción larga");
    expect(html).toContain("Galería del bungalow");
    expect(html).toContain("Cupos de bungalows");
    expect(html).toContain('href="/admin/bungalow-capacity"');
    expect(html).not.toContain("Inventario del bungalow");
    expect(html).not.toContain("FAM-01");
    expect(html).not.toContain("FAMILY");
    expect(html).toContain("Hasta 4 huéspedes");
  });

  it("uses an operational gallery fallback instead of exposing the internal item id", () => {
    const html = renderToStaticMarkup(
      <ContentHub
        {...baseProps}
        initialTab="gallery"
        initialGallery={{
          ...baseProps.initialGallery,
          items: [
            {
              id: "gallery_01",
              assetId: "asset-internal-01",
              visible: true,
              sortOrder: 1,
              localeContent: {
                es: { alt: "Piscina", caption: "" },
                en: { alt: "Pool", caption: "" },
              },
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Imagen sin título");
    expect(html).not.toContain("gallery_01");
    expect(html).not.toContain(">asset-internal-01<");
  });
});
