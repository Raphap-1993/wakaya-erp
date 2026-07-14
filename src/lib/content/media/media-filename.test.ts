import { describe, expect, it } from "vitest";

import { normalizeOriginalFilename } from "./media-filename";

describe("normalizeOriginalFilename", () => {
  it("keeps the basename and original casing from a browser fake path", () => {
    expect(normalizeOriginalFilename("C:\\fakepath\\Selva Wakaya.JPG", "image/jpeg")).toBe(
      "Selva Wakaya.JPG",
    );
  });

  it("removes control characters and compacts whitespace in the basename", () => {
    expect(normalizeOriginalFilename("../carpeta/foto\u0000   final.png", "image/png")).toBe(
      "foto final.png",
    );
  });

  it("removes the U+007F control character", () => {
    expect(normalizeOriginalFilename("foto\u007f   final.png", "image/png")).toBe(
      "foto final.png",
    );
  });

  it("normalizes the basename to NFC", () => {
    expect(normalizeOriginalFilename("Cafe\u0301 Wakaya.png", "image/png")).toBe(
      "Café Wakaya.png",
    );
  });

  it("uses a MIME-derived fallback when the filename becomes empty", () => {
    expect(normalizeOriginalFilename("\u0000", "image/webp")).toBe("imagen.webp");
  });

  it("limits long filenames to 180 characters while preserving the extension", () => {
    const normalized = normalizeOriginalFilename(`${"a".repeat(240)}.jpeg`, "image/jpeg");

    expect(normalized).toHaveLength(180);
    expect(normalized).toBe(`${"a".repeat(175)}.jpeg`);
  });

  it("does not split a Unicode code point when preserving the extension", () => {
    const normalized = normalizeOriginalFilename(`${"🌿".repeat(120)}.jpeg`, "image/jpeg");

    expect(normalized).toBe(`${"🌿".repeat(87)}.jpeg`);
    expect(normalized).toHaveLength(179);
  });
});
