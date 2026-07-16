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

  it("removes C1 control characters such as U+0085", () => {
    expect(normalizeOriginalFilename("foto\u0085   final.png", "image/png")).toBe(
      "foto final.png",
    );
  });

  it("removes bidi control characters from the stored name", () => {
    const bidiControls =
      "\u061c\u200e\u200f\u202a\u202b\u202c\u202d\u202e\u2066\u2067\u2068\u2069";

    expect(
      normalizeOriginalFilename(`foto${bidiControls}   final.png`, "image/png"),
    ).toBe("foto final.png");
  });

  it.each([
    ["high", "\ud800"],
    ["low", "\udc00"],
  ])("removes an isolated %s surrogate", (_kind, surrogate) => {
    expect(normalizeOriginalFilename(`foto${surrogate}   final.png`, "image/png")).toBe(
      "foto final.png",
    );
  });

  it("normalizes the basename to NFC", () => {
    expect(normalizeOriginalFilename("Cafe\u0301 Wakaya.png", "image/png")).toBe(
      "Café Wakaya.png",
    );
  });

  it("normalizes to NFC after removing an intervening control character", () => {
    const normalized = normalizeOriginalFilename("Cafe\u0000\u0301.png", "image/png");

    expect(normalized).toBe("Café.png");
    expect(normalized).toBe(normalized.normalize("NFC"));
  });

  it("normalizes to NFC after removing an intervening bidi control", () => {
    const normalized = normalizeOriginalFilename("Cafe\u202e\u0301.png", "image/png");

    expect(normalized).toBe("Café.png");
    expect(normalized).toBe(normalized.normalize("NFC"));
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

  it("preserves a normal family emoji joined with ZWJ", () => {
    expect(normalizeOriginalFilename("Familia 👨‍👩‍👧‍👦.png", "image/png")).toBe(
      "Familia 👨‍👩‍👧‍👦.png",
    );
  });

  it("truncates at a grapheme boundary while preserving the extension", () => {
    const family = "👨‍👩‍👧‍👦";
    const normalized = normalizeOriginalFilename(`${family.repeat(20)}.jpeg`, "image/jpeg");

    expect(normalized).toBe(`${family.repeat(15)}.jpeg`);
    expect(normalized.length).toBeLessThanOrEqual(180);
  });
});
