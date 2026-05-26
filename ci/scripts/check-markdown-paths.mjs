#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const PATH_EXTENSIONS = new Set([
  ".md",
  ".yml",
  ".yaml",
  ".json",
  ".mjs",
  ".js",
  ".ts",
  ".tsx",
  ".java",
  ".xml",
  ".tf",
  ".sh",
  ".ps1",
  ".sql",
  ".likec4",
  ".svg",
]);

const IGNORED_DIRS = new Set([
  ".git",
  ".gradle",
  "node_modules",
  ".next",
  ".angular",
  ".cache",
  "dist",
  "build",
  "bin",
  "target",
  "out",
  "coverage",
  "playwright-report",
  "test-results",
  ".tmp",
  "__pycache__",
  ".venv",
]);
const IGNORED_FILE_PREFIXES = [
  "CHANGELOG.md",
  "releases/",
  "revisiones/",
];
const ROOT_PREFIXES = [
  ".github/",
  "ai/",
  "catalog/",
  "ci/",
  "contracts/",
  "docs/",
  "ejemplos/",
  "estimacion/",
  "escenarios/",
  "likec4/",
  "ops/",
  "plantillas/",
  "qa/",
  "scripts/",
  "specs/",
  "src/",
  "stacks/",
  "tests/",
];

function parseArgs(argv) {
  return { root: path.resolve(argv[0] || ".") };
}

function collectMarkdown(rootDir) {
  const files = [];
  const visit = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolute = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          visit(absolute);
        }
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const relative = path.relative(rootDir, absolute).replace(/\\/g, "/");
        if (!IGNORED_FILE_PREFIXES.some((prefix) => relative === prefix || relative.startsWith(prefix))) {
          files.push(absolute);
        }
      }
    }
  };
  visit(rootDir);
  return files.sort();
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split("\n").length;
}

function looksLikePath(value) {
  if (!value.includes("/") && !value.includes("\\")) {
    return false;
  }
  if (/\s/.test(value.trim())) {
    return false;
  }
  if (/[<>{}*|$]/.test(value) || value.includes("NNN") || value.includes("...")) {
    return false;
  }
  if (/[A-Z]{2,}/.test(value) || /(^|\/)fase-x(\/|$)/.test(value) || /vX\.Y\.Z/.test(value)) {
    return false;
  }
  if (/^(https?:|s3:|ghcr\.io\/|gcr\.io\/|pkg:|mailto:)/.test(value)) {
    return false;
  }
  const extension = path.extname(value.replace(/\\/g, "/"));
  return value.endsWith("/") || PATH_EXTENSIONS.has(extension);
}

function resolveCandidate(rootDir, markdownFile, rawValue) {
  const normalized = rawValue.replace(/\\/g, "/").replace(/^\.?\//, "");
  const relativeToFile = path.resolve(path.dirname(markdownFile), normalized);
  if (fs.existsSync(relativeToFile)) {
    return relativeToFile;
  }
  if (normalized.startsWith("../")) {
    return path.resolve(path.dirname(markdownFile), normalized);
  }
  if (ROOT_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(prefix))) {
    return path.resolve(rootDir, normalized);
  }
  if (normalized.endsWith("/") && !PATH_EXTENSIONS.has(path.extname(normalized))) {
    return path.resolve(path.dirname(markdownFile), normalized);
  }
  return path.resolve(rootDir, normalized);
}

function main() {
  const { root } = parseArgs(process.argv.slice(2));
  const findings = [];

  for (const file of collectMarkdown(root)) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/`([^`\n]+)`/g)) {
      const value = match[1].trim();
      if (!looksLikePath(value)) {
        continue;
      }
      const candidate = resolveCandidate(root, file, value);
      if (value.endsWith("/") && !ROOT_PREFIXES.some((prefix) => value.startsWith(prefix)) && !value.startsWith("../")) {
        if (!fs.existsSync(candidate)) {
          continue;
        }
      }
      if (!fs.existsSync(candidate)) {
        const relativeFile = path.relative(root, file).replace(/\\/g, "/");
        findings.push(
          `${relativeFile}:${lineNumberForIndex(text, match.index ?? 0)}: ruta en backticks no existe: ${value}`,
        );
      }
    }
  }

  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(finding);
    }
    console.error(`\nTotal hallazgos: ${findings.length}`);
    return 1;
  }

  console.log("OK. Rutas en backticks verificadas sin hallazgos.");
  return 0;
}

process.exit(main());
