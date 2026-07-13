import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function readStyle(filePath: string): string {
  return readFileSync(path.join(ROOT, filePath), "utf8");
}

function collectStyleFiles(directory: string): string[] {
  const absoluteDirectory = path.join(ROOT, directory);
  const entries = readdirSync(absoluteDirectory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const relativePath = path.join(directory, entry.name);
    const absolutePath = path.join(ROOT, relativePath);

    if (entry.isDirectory()) {
      return collectStyleFiles(relativePath);
    }

    if (!statSync(absolutePath).isFile()) {
      return [];
    }

    if (relativePath.endsWith(".css") || relativePath.endsWith(".module.css")) {
      return [relativePath];
    }

    return [];
  });
}

const STYLE_FILES = [...collectStyleFiles("src/app"), ...collectStyleFiles("src/components")].sort();

describe("style governance", () => {
  it("defines the approved global font stack and a global sharp-corner rule", () => {
    const globals = readStyle("src/app/globals.css");

    expect(globals).toContain('--wakaya-font-sans: "Avenir Next", "Inter", "Segoe UI", sans-serif;');
    expect(globals).toContain("font-family: var(--wakaya-font-sans);");
    expect(globals).toContain("border-radius: 0 !important;");
  });

  it("keeps explicit CSS font weights inside the approved 500/700 scale", () => {
    const offenders = STYLE_FILES.flatMap((filePath) => {
      const source = readStyle(filePath);
      return [...source.matchAll(/font-weight:\s*([^;]+);/g)]
        .filter((match) => {
          const value = match[1].trim();
          return value !== "500" && value !== "700" && value !== "inherit" && !value.startsWith("var(");
        })
        .map((match) => `${filePath}:${match[0]}`);
    });

    expect(offenders).toEqual([]);
  });

  it("forces the admin shell to keep inherited text and strong tags at 500", () => {
    const adminShellStyles = readStyle("src/app/admin/admin-shell.module.css");

    expect(adminShellStyles).toContain("font-weight: 500;");
    expect(adminShellStyles).toContain(':global(strong)');
    expect(adminShellStyles).toContain(':global(b)');
    expect(adminShellStyles).toContain("font-weight: inherit;");
  });

  it("removes non-zero rounded corners from every CSS surface", () => {
    const offenders = STYLE_FILES.flatMap((filePath) => {
      const source = readStyle(filePath);
      return [...source.matchAll(/border-radius:\s*([^;]+);/g)]
        .filter((match) => /[1-9]|var\(|calc\(/.test(match[1]))
        .map((match) => `${filePath}:${match[0]}`);
    });

    expect(offenders).toEqual([]);
  });

  it("keeps every explicit font-family aligned to the approved sans stack", () => {
    const offenders = STYLE_FILES.flatMap((filePath) => {
      const source = readStyle(filePath);
      return [...source.matchAll(/font-family:\s*([^;]+);/g)]
        .filter((match) => {
          const value = match[1].trim();
          return value !== "var(--wakaya-font-sans)" && value !== "inherit";
        })
        .map((match) => `${filePath}:${match[0]}`);
    });

    expect(offenders).toEqual([]);
  });
});
