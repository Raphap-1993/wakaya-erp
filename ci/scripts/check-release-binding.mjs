#!/usr/bin/env node
/**
 * check-release-binding.mjs (v12.57)
 *
 * Verifica que cada archivo en releases/ o ops/release-notes/ vincule
 * explicitamente al menos un RF/HU/feature real.
 *
 * v12.57 cierra el falso positivo de Fase 7 "complete":
 *   - Antes: bastaba con que existiera releases/ para marcar Fase 7 complete.
 *   - Ahora: cada release note debe mencionar RF-NN/HU-NN/feature_slug explicito.
 *
 * Reglas:
 *   1. Cada .md en releases/ o ops/release-notes/ debe mencionar:
 *      - Al menos un patron RF-NN, RNF-NN o HU-NN, O
 *      - Al menos un slug de feature real (specs/NNN-slug/ que exista)
 *   2. Releases sin features asociadas (ej. "v0.0.1 — initial bootstrap")
 *      pueden marcarse con front-matter `kind: bootstrap` para opt-out.
 *
 * Modos:
 *   --strict       exit 1 si hay releases sin vinculacion.
 *   --warn         exit 0 con warning (default).
 *   --root <path>  raiz del proyecto.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures, listAllFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override

const releaseDirs = ["releases", join("ops", "release-notes")];
const releaseFiles = [];

for (const dir of releaseDirs) {
  const abs = join(root, dir);
  if (!existsSync(abs)) continue;
  let entries;
  try { entries = readdirSync(abs); } catch { continue; }
  for (const f of entries) {
    if (!/\.md$/.test(f)) continue;
    if (/^readme/i.test(f)) continue; // README no es release
    releaseFiles.push({ rel: `${dir}/${f}`.replace(/\\/g, "/"), abs: join(abs, f) });
  }
}

if (releaseFiles.length === 0) {
  console.log(`OK. No hay archivos de release en releases/ ni ops/release-notes/ — nada que validar.`);
  process.exit(0);
}

// Conocidas: todas las features (incluidas y excluidas como 000-*).
const allFeatures = listAllFeatures(root).map((f) => f.slug);
const findings = [];

for (const file of releaseFiles) {
  const text = readFileSync(file.abs, "utf8");

  // Opt-out: frontmatter `kind: bootstrap` o `kind: scaffolding`.
  if (/^---\s*\n[\s\S]*?\bkind\s*:\s*(bootstrap|scaffolding|template-only)\b[\s\S]*?\n---/m.test(text)) {
    continue;
  }

  // 1. Buscar referencias RF-NN, RNF-NN, HU-NN.
  const rfMatches = text.match(/\b(RF|RNF|HU)-\d+/g) || [];

  // 2. Buscar mencion de slug real.
  const slugMatches = allFeatures.filter((slug) => text.includes(slug));

  if (rfMatches.length === 0 && slugMatches.length === 0) {
    findings.push({
      file: file.rel,
      kind: "no-binding",
      message: `no menciona ningun RF-NN/HU-NN ni slug de feature real`,
    });
  }
}

console.log(`check-release-binding (v12.57)`);
console.log(`Archivos de release verificados: ${releaseFiles.length}`);
console.log(`Features conocidas:              ${allFeatures.length}`);

if (findings.length === 0) {
  console.log(`\nOK. Todas las release notes vinculan a RF/HU o feature real.`);
  process.exit(0);
}

// v12.63: en modo no-estricto estos hallazgos NO bloquean, asi que se muestran
// como ⚠ (warning), reservando ✗ para modo --strict / CHECK_STRICT=1.
const mark = strict ? "✗" : "⚠";
const sev = strict ? "hallazgo(s) (BLOQUEAN en strict)" : "warning(s) (no bloquean — usa --strict para fallar)";
console.error(`\nDetectados ${findings.length} release note(s) sin vinculacion explicita — ${sev}:`);
for (const f of findings) {
  console.error(`  ${mark} [${f.kind}] ${f.file}: ${f.message}`);
}
console.error(`\nFix sugerido:`);
console.error(`  1. Agregar al menos una mencion explicita de RF/HU/feature en el archivo:`);
console.error(`     "## Features cubiertas: RF-02, HU-03, specs/001-bandeja-trabajo-expedientes"`);
console.error(`  2. Si el release es bootstrap/scaffolding y no vincula features, agrega frontmatter:`);
console.error(`     ---`);
console.error(`     kind: bootstrap`);
console.error(`     ---`);

process.exit(strict ? 1 : 0);

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
