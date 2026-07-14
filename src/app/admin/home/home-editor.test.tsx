import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DEFAULT_HOME_CONTENT } from "@/lib/home-content/default-content";
import { HomeEditor } from "./home-editor";

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
    expect(html).toContain("Imagen asociada");
    expect(html).not.toContain("URL imagen");
    expect(html).not.toContain("Preview local");
    expect(html).not.toContain("Menú público");
    expect(html).toContain("Configuración web");
    expect(html).toContain("Opciones avanzadas");
    expect(html).toContain("<details");
    expect(html).not.toContain("<details open");
    expect(html).toContain("Tamaño subtítulo");
    expect(html).toContain("Peso subtítulo");
    expect(html).toContain("Ajuste fino subtítulo (px)");
    expect(html).toContain("Peso exacto subtítulo");
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
