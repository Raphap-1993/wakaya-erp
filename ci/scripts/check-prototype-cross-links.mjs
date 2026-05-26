#!/usr/bin/env node
/**
 * check-prototype-cross-links.mjs (v12.52)
 *
 * Valida la integridad de los hrefs cross-spec entre prototipos HTML5.
 * Convencion: un prototipo puede abrir otro con
 *   <a href="../../../specs/NNN-slug/prototype-html5/index.html?id=X&role=Y">
 * o usar el helper window.openPrototypeBySpec('NNN', {...}).
 *
 * Verifica:
 *   1. Todo href a specs/NNN-* apunta a una feature que existe.
 *   2. El path tiene la estructura canonica prototype-html5/index.html.
 *   3. Si usa ?spec=NNN o ?from=spec-NNN, el spec referenciado existe.
 *   4. No hay loops circulares evidentes (a -> b -> a en 1 paso).
 *
 * Modos:
 *   --strict       exit 1 si hay links rotos.
 *   --warn         exit 0 con warning (default).
 *   --root <path>  raiz del proyecto. Default: cwd.
 *
 * Exit codes:
 *   0 - sin links rotos.
 *   1 - hay links rotos en modo strict.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override

const specsRoot = join(root, "specs");
if (!existsSync(specsRoot)) {
  console.log("OK. No existe specs/ — nada que validar.");
  process.exit(0);
}

const knownFeatures = new Set();
const protoFiles = [];
for (const entry of readdirSync(specsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^\d{3,}-/.test(entry.name)) continue;
  knownFeatures.add(entry.name);
  const slugNum = entry.name.match(/^(\d{3,})-/)[1];
  knownFeatures.add(slugNum); // tambien aceptamos NNN solo
  const proto = join(specsRoot, entry.name, "prototype-html5", "index.html");
  if (existsSync(proto)) protoFiles.push({ slug: entry.name, num: slugNum, path: proto });
}

if (protoFiles.length === 0) {
  console.log("OK. No hay prototipos para validar.");
  process.exit(0);
}

const findings = [];
const crossLinks = []; // para detectar loops

// Regex para extraer hrefs a otros prototipos:
//   ../specs/NNN-slug/prototype-html5/index.html  (relativo desde otra spec)
//   /specs/NNN-slug/prototype-html5/index.html    (absoluto)
//   ../../../specs/NNN-slug/prototype-html5/...
const HREF_RE = /href\s*=\s*["']([^"']*specs\/(\d{3,})-([a-z0-9-]+)\/prototype-html5\/index\.html[^"']*)["']/gi;
// Tambien chequear openPrototypeBySpec('NNN', ...)
const OPEN_FN_RE = /openPrototypeBySpec\s*\(\s*['"]?(\d{3,})['"]?/g;
// Y ?spec=NNN / ?from=spec-NNN.
const SPEC_PARAM_RE = /[?&](?:spec|from)\s*=\s*(?:spec-)?(\d{3,})/gi;

for (const pf of protoFiles) {
  const text = readFileSync(pf.path, "utf8");

  // 1) hrefs explicitos.
  let m;
  HREF_RE.lastIndex = 0;
  while ((m = HREF_RE.exec(text)) !== null) {
    const fullHref = m[1];
    const targetNum = m[2];
    const targetSlug = `${m[2]}-${m[3]}`;
    if (targetNum === pf.num) continue; // self-link (link al hub o similar), no es cross-spec
    if (!knownFeatures.has(targetSlug) && !knownFeatures.has(targetNum)) {
      findings.push({
        kind: "broken-href",
        from: `specs/${pf.slug}/prototype-html5/index.html`,
        href: fullHref.length > 80 ? fullHref.slice(0, 80) + "..." : fullHref,
        message: `link a specs/${targetSlug}/ pero esa feature no existe`,
      });
    } else {
      crossLinks.push({ from: pf.num, to: targetNum });
    }
  }

  // 2) openPrototypeBySpec('NNN').
  OPEN_FN_RE.lastIndex = 0;
  while ((m = OPEN_FN_RE.exec(text)) !== null) {
    const targetNum = m[1];
    if (targetNum === pf.num) continue;
    if (!knownFeatures.has(targetNum)) {
      findings.push({
        kind: "broken-openfn",
        from: `specs/${pf.slug}/prototype-html5/index.html`,
        message: `openPrototypeBySpec('${targetNum}') pero specs/${targetNum}-* no existe`,
      });
    } else {
      crossLinks.push({ from: pf.num, to: targetNum });
    }
  }

  // 3) ?spec=NNN / ?from=spec-NNN.
  SPEC_PARAM_RE.lastIndex = 0;
  while ((m = SPEC_PARAM_RE.exec(text)) !== null) {
    const targetNum = m[1];
    if (targetNum === pf.num) continue;
    if (!knownFeatures.has(targetNum)) {
      findings.push({
        kind: "broken-param",
        from: `specs/${pf.slug}/prototype-html5/index.html`,
        message: `URL param 'spec=${targetNum}' o 'from=spec-${targetNum}' pero esa feature no existe`,
      });
    }
  }
}

// 4) loops circulares (a -> b y b -> a en 1 paso).
const linkSet = new Set(crossLinks.map((l) => `${l.from}->${l.to}`));
const loops = new Set();
for (const l of crossLinks) {
  if (linkSet.has(`${l.to}->${l.from}`) && l.from < l.to) {
    loops.add(`${l.from} <-> ${l.to}`);
  }
}
for (const loop of loops) {
  findings.push({
    kind: "loop",
    severity: "warning",
    message: `Loop circular detectado entre specs ${loop} (cross-link mutuo). Puede ser intencional pero revisa.`,
  });
}

// Reporte.
const blockers = findings.filter((f) => f.kind !== "loop");
console.log(`check-prototype-cross-links (v12.52)`);
console.log(`Prototipos verificados:     ${protoFiles.length}`);
console.log(`Features conocidas:         ${[...knownFeatures].filter((f) => /^[0-9]+-/.test(f)).length}`);
console.log(`Cross-links detectados:     ${crossLinks.length}`);
console.log(`Loops circulares:           ${loops.size}`);
console.log(`Links rotos:                ${blockers.length}`);

if (findings.length === 0) {
  console.log(`\nOK. Sin links rotos ni loops sospechosos.`);
  process.exit(0);
}

console.error(`\nHallazgos:`);
for (const f of findings.slice(0, 20)) {
  const icon = f.kind === "loop" ? "⚠" : "✗";
  console.error(`  ${icon} [${f.kind}] ${f.from || "(global)"}: ${f.message}`);
}
if (findings.length > 20) console.error(`  ... y ${findings.length - 20} mas.`);

if (blockers.length > 0) {
  console.error(`\nFix sugerido:`);
  console.error(`  1. Revisa los hrefs cross-spec; deben apuntar a specs/NNN-<slug>/prototype-html5/index.html existentes.`);
  console.error(`  2. Si la feature destino aun no existe, comenta el link con TODO o usa openPrototypeBySpec con try/catch.`);
  console.error(`  3. Helper canonico: plantillas/transversal/shared-prototype-helpers.js > openPrototypeBySpec(specNum, params)`);
}

process.exit(blockers.length > 0 && strict ? 1 : 0);

// ─────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) out[key] = argv[++i];
      else out[key] = true;
    }
  }
  return out;
}
