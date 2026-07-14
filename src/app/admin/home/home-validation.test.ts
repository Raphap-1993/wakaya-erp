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
});
