import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_HOME_CONTENT } from "@/lib/home-content/default-content";
import type { ContentMediaAsset } from "@/lib/content/media/content-media-service";
import { completeHomeMediaUpload, HomeEditor } from "./home-editor";

describe("HomeEditor", () => {
  it("shows a focused two-column editor with secondary tools on demand", () => {
    const html = renderToStaticMarkup(
      <HomeEditor
        initialItem={{
          revisionVersion: 2,
          document: DEFAULT_HOME_CONTENT,
          updatedAt: "2026-07-09T15:00:00.000Z",
          updatedByUserId: "admin-user-1",
          restoredFromVersion: null,
          source: "published",
        }}
        initialRevisions={[
          {
            revisionVersion: 2,
            document: DEFAULT_HOME_CONTENT,
            updatedAt: "2026-07-09T15:00:00.000Z",
            updatedByUserId: "admin-user-1",
            restoredFromVersion: null,
            source: "published",
          },
        ]}
      />,
    );

    expect(html).toContain("Editor del home");
    expect(html).toContain("Wakaya Ecolodge");
    expect(html).toContain("CTA principal");
    expect(html).toContain(">Label</span>");
    expect(html).not.toContain("Label ES");
    expect(html).not.toContain("Label EN");
    expect(html).not.toContain("slide-hero");
    expect(html).toContain("Reservas");
    expect(html).toContain("Cifras");
    expect(html).toContain("Historia");
    expect(html).toContain("Última publicación");
    expect(html).toContain("Estado:");
    expect(html).not.toContain("Publica textos, CTA");
    expect(html).toContain("Ver home");
    expect(html).toContain("Vista previa");
    expect(html).toContain("Historial");
    expect(html).not.toContain("Desktop");
    expect(html).not.toContain("Mobile");
    expect(html).toContain("Subir imagen");
    expect(html).toContain("Agregar slide");
    expect(html).toContain("Eliminar slide");
    expect(html).toContain("gallery01.jpg");
    expect(html).not.toContain("Imagen asociada");
    expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(html).not.toContain("Recortes obligatorios");
    expect(html).not.toContain("URL imagen");
    expect(html).not.toContain("Preview local");
    expect(html).not.toContain("Menú público");
    expect(html).toContain("Configuración web");
    expect(html).toContain("Tamaños tipográficos");
    expect(html).toContain("Un único control de tamaño por tipo de texto.");
    expect(html).not.toContain("Opciones avanzadas");
    expect(html).toContain("Tamaño subtítulo");
    expect(html).not.toContain("Peso subtítulo");
    expect(html).not.toContain("Ajuste fino subtítulo (px)");
    expect(html).not.toContain("Peso exacto subtítulo");
    expect(html).toContain('id="home-validation-feedback"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('id="home-editor-fields"');
    expect(html).not.toContain("No se puede publicar");
    expect(html).not.toContain("Ir al campo");
    expect(html).not.toContain("Tamaño links menú");
    expect(html).not.toContain("Peso links menú");
    expect(html).not.toContain("Ajuste fino links menú (px)");
    expect(html).not.toContain("Peso exacto links menú");
  });

  it("shows the hydrated original filename as the media dialog trigger", () => {
    const document = structuredClone(DEFAULT_HOME_CONTENT);
    const firstSlide = document.slider.slides[0];
    if (!firstSlide) throw new Error("home slide fixture missing");
    firstSlide.image = "/media/assets/asset_home_01/heroDesktop.webp";

    const html = renderToStaticMarkup(
      <HomeEditor
        initialItem={{
          revisionVersion: 2,
          document,
          updatedAt: "2026-07-09T15:00:00.000Z",
          updatedByUserId: "admin-user-1",
          restoredFromVersion: null,
          source: "published",
        }}
        initialRevisions={[]}
        mediaMetadata={{
          asset_home_01: {
            assetId: "asset_home_01",
            originalFilename: "Selva Wakaya.jpg",
          },
        }}
      />,
    );

    expect(html).toContain("Selva Wakaya.jpg");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain("Imagen asociada");
  });

  it("remembers the uploaded asset before updating the Home document", () => {
    const events: string[] = [];
    const asset = {
      id: "asset_home_01",
      originalFilename: "gallery01.jpg",
      status: "ready",
      master: {
        url: "/media/assets/asset_home_01/master.webp",
        width: 2400,
        height: 1600,
        format: "webp",
        quality: 95,
        nearLossless: true,
      },
      variants: {
        heroDesktop: {
          storageKey: "assets/asset_home_01/heroDesktop.webp",
          url: "/media/assets/asset_home_01/heroDesktop.webp",
          width: 1920,
          height: 1080,
          bytes: 180000,
          quality: 88,
        },
      },
    } satisfies ContentMediaAsset;
    const onMediaAssetCreated = vi.fn(() => events.push("metadata"));
    const onComplete = vi.fn((mediaUrl: string) => events.push(`document:${mediaUrl}`));

    completeHomeMediaUpload(asset, "hero", onMediaAssetCreated, onComplete);

    expect(onMediaAssetCreated).toHaveBeenCalledExactlyOnceWith(asset);
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(
      "/media/assets/asset_home_01/heroDesktop.webp",
    );
    expect(events).toEqual([
      "metadata",
      "document:/media/assets/asset_home_01/heroDesktop.webp",
    ]);
  });

  it("shows only the active language while editing stats", () => {
    const document = structuredClone(DEFAULT_HOME_CONTENT);
    document.slider.slides = [];
    document.sections = document.sections.filter((section) => section.type === "stats");

    const html = renderToStaticMarkup(
      <HomeEditor
        initialItem={{
          revisionVersion: 2,
          document,
          updatedAt: "2026-07-09T15:00:00.000Z",
          updatedByUserId: "admin-user-1",
          restoredFromVersion: null,
          source: "published",
        }}
        initialRevisions={[]}
      />,
    );

    expect(html).toContain("Hectareas de selva");
    expect(html).not.toContain("Hectares of jungle");
    expect(html).not.toContain("Label ES");
    expect(html).not.toContain("Label EN");
  });

  it("shows only the active language while editing testimonials", () => {
    const document = structuredClone(DEFAULT_HOME_CONTENT);
    document.slider.slides = [];
    document.sections = document.sections.filter((section) => section.type === "testimonials");

    const html = renderToStaticMarkup(
      <HomeEditor
        initialItem={{
          revisionVersion: 2,
          document,
          updatedAt: "2026-07-09T15:00:00.000Z",
          updatedByUserId: "admin-user-1",
          restoredFromVersion: null,
          source: "published",
        }}
        initialRevisions={[]}
      />,
    );

    expect(html).toContain("Los bungalows se sienten calidos y reales");
    expect(html).not.toContain("The bungalows feel warm and real");
    expect(html).not.toContain("Origen ES");
    expect(html).not.toContain("Origen EN");
    expect(html).not.toContain("Quote ES");
    expect(html).not.toContain("Quote EN");
  });

  it("keeps the structural section name visible when its required title is empty", () => {
    const document = structuredClone(DEFAULT_HOME_CONTENT);
    document.slider.slides = [];
    document.sections = document.sections.filter((section) => section.type === "story");
    const story = document.sections[0];
    if (!story || story.type !== "story") throw new Error("story fixture missing");
    story.content.title.es = "";

    const html = renderToStaticMarkup(
      <HomeEditor
        initialItem={{
          revisionVersion: 2,
          document,
          updatedAt: "2026-07-09T15:00:00.000Z",
          updatedByUserId: "admin-user-1",
          restoredFromVersion: null,
          source: "published",
        }}
        initialRevisions={[]}
      />,
    );

    expect(html).toContain("<h2>Historia</h2>");
  });
});
