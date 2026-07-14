import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { ContentMediaAsset } from "@/lib/content/media/content-media-service";
import { ContentHub, rememberMediaAsset } from "./content-hub";

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
