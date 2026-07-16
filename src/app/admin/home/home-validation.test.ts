import { describe, expect, it } from "vitest";

import { DEFAULT_HOME_CONTENT } from "@/lib/home-content/default-content";
import {
  countValidationIssuesForNode,
  mapHomeValidationIssues,
  validateHomeDocument,
} from "./home-validation";

describe("home validation targets", () => {
  it("maps a required localized section field to its block, language and control", () => {
    const document = structuredClone(DEFAULT_HOME_CONTENT);
    const story = document.sections.find((section) => section.type === "story");
    if (!story || story.type !== "story") throw new Error("story fixture missing");
    story.content.title.es = "";

    const issues = validateHomeDocument(document);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          node: { kind: "section", id: story.id },
          nodeLabel: "Historia",
          locale: "es",
          groupLabel: "Contenido",
          fieldLabel: "Título",
          message: "Completa este campo.",
          summaryLabel: "Historia · Español · Título",
        }),
      ]),
    );
    expect(countValidationIssuesForNode(issues, { kind: "section", id: story.id })).toBe(1);
  });

  it("identifies the CTA context and English locale without exposing a schema path", () => {
    const document = structuredClone(DEFAULT_HOME_CONTENT);
    document.slider.slides[0].primaryCta.label.en = "";

    const [issue] = validateHomeDocument(document);

    expect(issue).toMatchObject({
      node: { kind: "slide", id: "slide-hero" },
      nodeLabel: "Wakaya Ecolodge",
      locale: "en",
      groupLabel: "CTA principal",
      fieldLabel: "Label",
      message: "Completa este campo.",
      summaryLabel: "Wakaya Ecolodge · English · Label",
    });
    expect(issue.summaryLabel).not.toContain("primaryCta");
  });

  it("routes invalid typography values to the advanced options control", () => {
    const document = structuredClone(DEFAULT_HOME_CONTENT);
    const story = document.sections.find((section) => section.type === "story");
    if (!story) throw new Error("story fixture missing");
    story.style.headingWeightValue = 975;

    expect(validateHomeDocument(document)).toEqual([
      expect.objectContaining({
        node: { kind: "section", id: story.id },
        nodeLabel: "Historia",
        locale: undefined,
        groupLabel: "Opciones avanzadas",
        fieldLabel: "Peso exacto heading",
        message: "Usa un peso entre 350 y 650.",
        summaryLabel: "Historia · Peso exacto heading",
      }),
    ]);
  });

  it("normalizes server issue paths prefixed with document", () => {
    const document = structuredClone(DEFAULT_HOME_CONTENT);

    const issues = mapHomeValidationIssues(document, [
      {
        path: ["document", "slider", "slides", 0, "primaryCta", "destination", "value"],
        message: "invalid_cta_destination",
      },
    ]);

    expect(issues).toEqual([
      expect.objectContaining({
        node: { kind: "slide", id: "slide-hero" },
        groupLabel: "CTA principal",
        fieldLabel: "Valor destino",
        message: "Ingresa un destino válido.",
      }),
    ]);
  });

  it("keeps every invalid field so the summary can navigate them independently", () => {
    const document = structuredClone(DEFAULT_HOME_CONTENT);
    const story = document.sections.find((section) => section.type === "story");
    if (!story || story.type !== "story") throw new Error("story fixture missing");
    document.slider.slides[0].primaryCta.label.en = "";
    story.content.title.es = "";

    const issues = validateHomeDocument(document);

    expect(issues).toHaveLength(2);
    expect(issues.map((issue) => issue.summaryLabel)).toEqual([
      "Wakaya Ecolodge · English · Label",
      "Historia · Español · Título",
    ]);
  });

  it("uses the exact visible labels for lists, testimonials and section counts", () => {
    const document = structuredClone(DEFAULT_HOME_CONTENT);
    const storyIndex = document.sections.findIndex((section) => section.type === "story");
    const bungalowsIndex = document.sections.findIndex((section) => section.type === "bungalows");
    const experiencesIndex = document.sections.findIndex((section) => section.type === "experiences");
    const testimonialsIndex = document.sections.findIndex((section) => section.type === "testimonials");

    const issues = mapHomeValidationIssues(document, [
      { path: ["sections", storyIndex, "content", "paragraphs", "es", 0], message: "required" },
      { path: ["sections", testimonialsIndex, "content", "items", 1, "quote", "en"], message: "required" },
      { path: ["sections", bungalowsIndex, "content", "visibleCount"], message: "invalid" },
      { path: ["sections", experiencesIndex, "content", "visibleCount"], message: "invalid" },
    ]);

    expect(issues.map((issue) => [issue.fieldLabel, issue.focusOccurrence])).toEqual([
      ["Párrafos (uno por línea)", 0],
      ["Testimonio", 1],
      ["Bungalows visibles", 0],
      ["Cards visibles", 0],
    ]);
  });
});
