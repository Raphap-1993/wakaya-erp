#!/usr/bin/env node
/**
 * check-prototype-coverage.mjs (v12.82)
 *
 * Exige que CADA feature visual tenga su prototipo en la ubicacion canonica
 * specs/<slug>/prototype-html5/index.html.
 *
 * Cierra el patron real visto en agentes: generan los specs (y a veces solo el
 * hub prototype/index.html) pero NO crean el prototipo por feature en su lugar.
 * Los demas validadores de prototipo SE SALTAN las features sin prototipo (para
 * no romper fases tempranas), asi que un proyecto en fase 2 con 0 prototipos
 * pasaba en verde. Este validador cierra esa grieta.
 *
 * Opt-out (features no visuales / backend-only): declarar en el frontmatter de
 * spec-funcional.md o traceability.md:
 *   ---
 *   prototype: not-required
 *   ---
 * (acepta: not-required | not-applicable | none | no)
 *
 * Modos:
 *   --strict       exit 1 si falta algun prototipo (default segun CHECK_STRICT).
 *   --warn         exit 0 (solo reporta). Default en el pipeline.
 *   --feature X    valida solo una feature.
 *   --root <path>  raiz del proyecto.
 *
 * Salta features de ejemplo (000-*) y `roadmap: ignore` via listIncludedFeatures.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);
const featureFilter = args.feature || null;

function frontmatter(text) {
  const m = String(text).match(/^---\s*\n([\s\S]*?)\n---/);
  return m ? m[1] : "";
}
function optedOut(slug) {
  for (const f of ["spec-funcional.md", "traceability.md"]) {
    const p = join(root, "specs", slug, f);
    if (!existsSync(p)) continue;
    const fm = frontmatter(readFileSync(p, "utf8"));
    if (/\bprototype\s*:\s*(not-required|not-applicable|none|no)\b/i.test(fm)) return true;
  }
  return false;
}

const features = listIncludedFeatures(root).filter((s) => !featureFilter || s.startsWith(featureFilter));
const missing = [];
const optedOutList = [];
let visualCount = 0;

for (const slug of features) {
  if (optedOut(slug)) { optedOutList.push(slug); continue; }
  visualCount += 1;
  const p = join(root, "specs", slug, "prototype-html5", "index.html");
  let ok = false;
  try { ok = existsSync(p) && statSync(p).size > 0; } catch { ok = false; }
  if (!ok) missing.push(slug);
}

console.log(`check-prototype-coverage (v12.82) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`Features visuales: ${visualCount} · con prototipo: ${visualCount - missing.length} · opt-out: ${optedOutList.length}`);

if (missing.length === 0) {
  console.log(`\nOK. Cada feature visual tiene su prototipo en specs/<slug>/prototype-html5/index.html.`);
  process.exit(0);
}

console.error(`\nFaltan ${missing.length} prototipo(s) de feature en su ubicacion canonica:`);
for (const slug of missing) console.error(`  ✗ specs/${slug}/prototype-html5/index.html  (no existe)`);

console.error(`\nQue significa:`);
console.error(`  En fase 2, cada feature visual DEBE tener su prototipo HTML5 navegable. Tener solo`);
console.error(`  el hub (prototype/index.html) o solo los specs NO cumple — el prototipo es la evidencia.`);
console.error(`\nFix sugerido:`);
console.error(`  1. Genera cada prototipo en su lugar (copia + adapta el golden del dominio):`);
console.error(`     npm run scaffold:prototype -- --feature ${missing[0]} --domain <dominio>`);
console.error(`  2. Regenera el hub:  npm run prototype:hub`);
console.error(`  3. Si una feature NO es visual (backend-only), marca opt-out en su spec-funcional.md:`);
console.error(`     ---`);
console.error(`     prototype: not-required`);
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
