#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const MD_LINK_RE = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
const HEADER_RE = /^(#{1,6})\s+(.*?)\s*$/;
const ANCHOR_ID_RE = /<a\s+id="([^"]+)"\s*><\/a>/gi;
const NAV_START = "<!-- nav-guided:start -->";
const NAV_END = "<!-- nav-guided:end -->";
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
const RESERVED_ASCII = [
  ["\u00cdndice", "Indice"],
  ["Operaci\u00f3n", "Operacion"],
  ["An\u00e1lisis", "Analisis"],
  ["Construcci\u00f3n", "Construccion"],
  ["Estimaci\u00f3n", "Estimacion"],
  ["Adopci\u00f3n", "Adopcion"],
  ["Producci\u00f3n", "Produccion"],
  ["Decisiones tecnol\u00f3gicas", "Decisiones tecnologicas"],
  ["Visi\u00f3n", "Vision"],
  ["Operaci\u00f3n continua", "Operacion continua"],
  ["Preparaci\u00f3n", "Preparacion"],
  ["Definici\u00f3n", "Definicion"],
];

function usage() {
  console.log(`Uso:
  node ci/scripts/check-docs.mjs [root]

Valida markdown, enlaces, anclas, nav-guided y ortografia ASCII reservada.
`);
}

function resolveRoot(argv) {
  let root = process.cwd();
  for (const arg of argv) {
    if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    }
    root = path.resolve(arg);
  }
  return root;
}

function normalizeRelative(filePath, rootDir) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

function isIgnored(relativePath) {
  return relativePath.split("/").some((part) =>
    [".git", ".tmp", "node_modules", ".venv", "__pycache__"].includes(part),
  );
}

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function collectMarkdownFiles(rootDir) {
  const files = [];
  const visit = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolute = path.join(currentDir, entry.name);
      const relative = normalizeRelative(absolute, rootDir);
      if (entry.isDirectory()) {
        if (isIgnored(relative)) {
          continue;
        }
        visit(absolute);
        continue;
      }
      if (path.extname(entry.name).toLowerCase() !== ".md") {
        continue;
      }
      if (isIgnored(relative)) {
        continue;
      }
      files.push(absolute);
    }
  };
  visit(rootDir);
  return files.sort((a, b) => normalizeRelative(a, rootDir).localeCompare(normalizeRelative(b, rootDir)));
}

function hasBom(raw) {
  return raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf;
}

function decodeUtf8(raw) {
  const payload = hasBom(raw) ? raw.subarray(3) : raw;
  return UTF8_DECODER.decode(payload);
}

function collectAnchors(text) {
  const anchors = new Set();
  for (const match of text.matchAll(ANCHOR_ID_RE)) {
    anchors.add(match[1]);
  }
  for (const line of text.split(/\r?\n/)) {
    const header = line.match(HEADER_RE);
    if (header) {
      anchors.add(slugify(header[2]));
    }
  }
  return anchors;
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function checkBom(relativePath, raw, findings) {
  if (hasBom(raw)) {
    findings.push(`${relativePath}:1: UTF-8 BOM presente al inicio del archivo`);
  }
}

function checkLinksAndAnchors(filePath, rootDir, text, findings, markdownCache) {
  const relativePath = normalizeRelative(filePath, rootDir);
  const anchors = collectAnchors(text);
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const match of line.matchAll(MD_LINK_RE)) {
      const target = match[2].trim();
      if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("mailto:")) {
        continue;
      }
      if (target.startsWith("#")) {
        const anchor = target.slice(1);
        if (anchor && !anchors.has(anchor)) {
          findings.push(`${relativePath}:${i + 1}: ancla interna \`#${anchor}\` no existe en este archivo`);
        }
        continue;
      }

      const [targetPath, anchor = ""] = target.split("#", 2);
      if (!targetPath) {
        continue;
      }

      const full = path.resolve(path.dirname(filePath), targetPath);
      const normalizedTarget = normalizeRelative(full, rootDir);
      if (normalizedTarget.startsWith("..")) {
        continue;
      }
      if (!fs.existsSync(full)) {
        findings.push(`${relativePath}:${i + 1}: enlace roto a \`${targetPath}\``);
        continue;
      }
      if (anchor && path.extname(full).toLowerCase() === ".md") {
        let otherText = markdownCache.get(full);
        if (otherText === undefined) {
          try {
            otherText = decodeUtf8(fs.readFileSync(full));
          } catch {
            otherText = null;
          }
          markdownCache.set(full, otherText);
        }
        if (otherText && !collectAnchors(otherText).has(anchor)) {
          findings.push(`${relativePath}:${i + 1}: ancla \`#${anchor}\` no existe en \`${targetPath}\``);
        }
      }
    }
  }
}

function navBlock(text) {
  if (!text.includes(NAV_START) || !text.includes(NAV_END)) {
    return null;
  }
  const start = text.indexOf(NAV_START);
  const end = text.indexOf(NAV_END);
  if (start < 0 || end < 0 || end <= start) {
    return null;
  }
  return text.slice(start, end);
}

function checkNavGuided(relativePath, text, findings) {
  if (!relativePath.startsWith("docs/")) {
    return;
  }
  const block = navBlock(text);
  if (!block) {
    findings.push(`${relativePath}:1: falta bloque nav-guided (start/end)`);
    return;
  }

  for (const label of ["Anterior:", "Siguiente:"]) {
    const idx = block.indexOf(label);
    if (idx < 0) {
      findings.push(`${relativePath}:1: bloque nav-guided sin \`${label}\``);
      continue;
    }
    const line = block.slice(idx).split(/\r?\n/, 1)[0];
    if (!MD_LINK_RE.test(line)) {
      findings.push(`${relativePath}:1: \`${label}\` debe ser enlace markdown navegable`);
    }
    MD_LINK_RE.lastIndex = 0;
  }
}

function extractNavTarget(text, label) {
  const block = navBlock(text);
  if (!block) {
    return null;
  }
  for (const line of block.split(/\r?\n/)) {
    const stripped = line.replace(/^\s*-\s*/, "").trim();
    if (!stripped.startsWith(label)) {
      continue;
    }
    const match = stripped.match(MD_LINK_RE);
    MD_LINK_RE.lastIndex = 0;
    if (!match) {
      return null;
    }
    const targetMatch = /\[[^\]]+\]\(([^)]+)\)/.exec(stripped);
    if (!targetMatch) {
      return null;
    }
    let target = targetMatch[1].trim();
    if (
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("mailto:") ||
      target.startsWith("#")
    ) {
      return null;
    }
    if (target.includes("#")) {
      [target] = target.split("#", 1);
    }
    return target;
  }
  return null;
}

function checkNavSymmetry(files, rootDir, texts, findings) {
  const nextOf = new Map();
  const prevOf = new Map();

  for (const filePath of files) {
    const relativePath = normalizeRelative(filePath, rootDir);
    if (!relativePath.startsWith("docs/")) {
      continue;
    }
    const text = texts.get(filePath);
    if (!text) {
      continue;
    }
    const nextTarget = extractNavTarget(text, "Siguiente:");
    const prevTarget = extractNavTarget(text, "Anterior:");
    nextOf.set(relativePath, nextTarget ? path.resolve(path.dirname(filePath), nextTarget) : null);
    prevOf.set(relativePath, prevTarget ? path.resolve(path.dirname(filePath), prevTarget) : null);
  }

  for (const filePath of files) {
    const relativePath = normalizeRelative(filePath, rootDir);
    if (!relativePath.startsWith("docs/")) {
      continue;
    }
    const nextAbs = nextOf.get(relativePath);
    if (!nextAbs) {
      continue;
    }
    const nextRelative = normalizeRelative(nextAbs, rootDir);
    if (nextRelative.startsWith("..")) {
      continue;
    }
    const backAbs = prevOf.get(nextRelative);
    if (backAbs == null) {
      findings.push(
        `${relativePath}:1: asimetria nav-guided: Siguiente apunta a \`${nextRelative}\` pero ese destino no declara Anterior`,
      );
      continue;
    }
    const backRelative = normalizeRelative(backAbs, rootDir);
    if (backRelative !== relativePath && nextRelative !== "docs/README.md") {
      findings.push(
        `${nextRelative}:1: asimetria nav-guided: Anterior apunta a \`${backRelative}\` pero el nodo previo real es \`${relativePath}\``,
      );
    }
  }
}

function checkReservedAscii(relativePath, text, findings) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const isHeader = HEADER_RE.test(line);
    const isBreadcrumb = line.includes("[README principal]") && line.includes("[Indice");
    const trimmed = line.replace(/^\s*-\s*/, "");
    const isNavLabel = trimmed.startsWith("Anterior:") || trimmed.startsWith("Siguiente:");
    if (!isHeader && !isBreadcrumb && !isNavLabel) {
      continue;
    }
    for (const [bad, good] of RESERVED_ASCII) {
      if (line.includes(bad)) {
        findings.push(
          `${relativePath}:${i + 1}: forma acentuada \`${bad}\` en titulo/breadcrumb/nav; usar \`${good}\``,
        );
      }
    }
  }
}

function main() {
  const rootDir = resolveRoot(process.argv.slice(2));
  const findings = [];
  const markdownCache = new Map();
  const texts = new Map();
  const files = collectMarkdownFiles(rootDir);
  // v12.30: emite [progress] X/Y archivos cada N para feedback en la UI.
  const total = files.length;
  const tick = Math.max(1, Math.min(50, Math.floor(total / 20) || 1));
  process.stdout.write(`[progress] 0/${total} archivos\n`);

  let processed = 0;
  for (const filePath of files) {
    processed += 1;
    if (processed === total || processed % tick === 0) {
      process.stdout.write(`[progress] ${processed}/${total} archivos\n`);
    }
    const relativePath = normalizeRelative(filePath, rootDir);
    let raw;
    try {
      raw = fs.readFileSync(filePath);
    } catch (error) {
      findings.push(`${relativePath}:0: no se pudo leer (${error instanceof Error ? error.message : String(error)})`);
      continue;
    }

    checkBom(relativePath, raw, findings);

    let text;
    try {
      text = decodeUtf8(raw);
    } catch (error) {
      findings.push(
        `${relativePath}:0: no es UTF-8 valido (${error instanceof Error ? error.message : String(error)})`,
      );
      continue;
    }

    texts.set(filePath, text);
    markdownCache.set(filePath, text);
    checkLinksAndAnchors(filePath, rootDir, text, findings, markdownCache);
    checkNavGuided(relativePath, text, findings);
    checkReservedAscii(relativePath, text, findings);
  }

  checkNavSymmetry(files, rootDir, texts, findings);

  if (findings.length > 0) {
    for (const finding of findings) {
      console.log(finding);
    }
    console.log(`\nTotal hallazgos: ${findings.length}`);
    return 1;
  }

  console.log(`OK. ${files.length} archivos markdown revisados sin hallazgos.`);
  return 0;
}

process.exit(main());
