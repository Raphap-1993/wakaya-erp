#!/usr/bin/env node
/**
 * check-prototype-location.mjs (v12.81)
 *
 * Detecta prototipos HTML5 fuera de su ubicacion canonica.
 *
 * v12.81: detecta el antipatron mas comun (prototype/<feature>/index.html —
 * subcarpetas del hub) y sugiere la ruta canonica mapeada al spec real. Sigue
 * siendo warn por defecto en check:project; pre-flight-gate lo corre STRICT en
 * modo instanciado (bloquea el release de un proyecto con prototipos mal puestos).
 *
 * Locaciones aceptadas:
 *   - specs/<NNN-slug>/prototype-html5/index.html
 *   - prototype/index.html  (el hub canonico, no es spec)
 *   - ejemplos/fase-2-ux-ui/prototype-html5-golden/<dominio>/index.html
 *
 * Cierra el patron real visto en algunos agentes:
 *   - Crean prototype-html5/ en la raiz del proyecto.
 *   - Crean prototipo/ (singular) en lugar de prototype-html5/.
 *   - Ponen prototipos en frontend/ o src/ar/.
 *
 * Modos:
 *   --strict       exit 1 si hay prototipos fuera de lugar.
 *   --warn         exit 0 con warning (default).
 *   --root <path>  raiz del proyecto.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { loadIgnoreConfig, shouldIgnorePath } from "./_lib/ignore-paths.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override

const ignoreCfg = loadIgnoreConfig(root);
const offending = [];

const CANONICAL_PATTERNS = [
  /^specs\/\d{3,}-[a-z0-9-]+\/prototype-html5\/index\.html$/,
  /^prototype\/index\.html$/,
  /^ejemplos\/fase-2-ux-ui\/prototype-html5-golden\/[^/]+\/index\.html$/,
  // v12.56: anti-ejemplo es intencional — no es un prototipo real.
  /^ejemplos\/fase-2-ux-ui\/prototype-html5-anti-ejemplo\//,
];

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const abs = join(dir, e.name);
    const rel = relative(root, abs).replace(/\\/g, "/");
    if (shouldIgnorePath(rel, ignoreCfg)) continue;
    if (e.isDirectory()) {
      walk(abs);
      continue;
    }
    // Buscar index.html que sean candidatos a prototipo (>500 bytes, contiene "<!DOCTYPE").
    if (e.name !== "index.html") continue;
    let size = 0;
    try { size = statSync(abs).size; } catch { continue; }
    if (size < 500) continue;
    if (CANONICAL_PATTERNS.some((re) => re.test(rel))) continue;
    // Es un index.html que NO esta en locacion canonica.
    offending.push(rel);
  }
}

walk(root);

// v12.81: slugs reales de specs/ para sugerir la ruta canonica correcta.
const specSlugs = (() => {
  const d = join(root, "specs");
  if (!existsSync(d)) return [];
  try { return readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory() && /^\d{3,}-/.test(e.name)).map((e) => e.name); } catch { return []; }
})();

// v12.81: clasifica cada ofensor y sugiere la ruta canonica mapeada al spec real.
//   Antipatron mas comun (visto en agentes): prototype/<feature>/index.html
//   (subcarpetas dentro del hub). El hub NUNCA lleva subcarpetas de feature.
function classify(rel) {
  const sub = (rel.match(/^prototype\/([^/]+)\/index\.html$/) || [])[1];
  if (sub) {
    const num = (sub.match(/^(\d{3,})/) || [])[1];
    const match = num
      ? specSlugs.find((s) => s.startsWith(num + "-"))
      : specSlugs.find((s) => s.includes(sub) || sub.includes(s.replace(/^\d{3,}-/, "")));
    return {
      antipattern: "hub-subfolder",
      canonical: `specs/${match || "<NNN-slug>"}/prototype-html5/index.html`,
      matched: !!match,
    };
  }
  return { antipattern: "non-canonical", canonical: "specs/<NNN-slug>/prototype-html5/index.html", matched: false };
}

console.log(`check-prototype-location (v12.81) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`Locaciones canonicas aceptadas:`);
console.log(`  - specs/<NNN-slug>/prototype-html5/index.html   (prototipo por feature)`);
console.log(`  - prototype/index.html                          (UNICO hub, sin subcarpetas)`);
console.log(`  - ejemplos/fase-2-ux-ui/prototype-html5-golden/<dominio>/index.html`);

if (offending.length === 0) {
  console.log(`\nOK. No hay prototipos HTML5 fuera de ubicacion canonica.`);
  process.exit(0);
}

const classified = offending.map((f) => ({ rel: f, ...classify(f) }));
const hubSub = classified.filter((c) => c.antipattern === "hub-subfolder");

console.error(`\nDetectados ${offending.length} prototipo(s) en ubicacion NO canonica:`);
for (const c of classified) {
  console.error(`  ✗ ${c.rel}`);
  console.error(`      → mover a: ${c.canonical}${c.matched ? "" : "   (ajusta <NNN-slug> al feature real en specs/)"}`);
}

if (hubSub.length > 0) {
  console.error(`\nAntipatron detectado: ${hubSub.length} prototipo(s) como subcarpeta del hub (prototype/<feature>/index.html).`);
  console.error(`  El directorio 'prototype/' es SOLO el hub autogenerado (prototype/index.html) y NO lleva`);
  console.error(`  subcarpetas por feature. Cada feature vive en specs/<slug>/prototype-html5/index.html.`);
}

console.error(`\nFix sugerido:`);
console.error(`  1. Genera/regenera cada prototipo en su lugar con el comando canonico:`);
console.error(`     npm run scaffold:prototype -- --feature <NNN-slug> --domain <dominio>`);
console.error(`     (escribe siempre en specs/<slug>/prototype-html5/ y adapta el golden al dominio)`);
console.error(`  2. El hub se regenera con: npm run prototype:hub   (no se edita a mano, no lleva subcarpetas)`);
console.error(`  3. Si es un artefacto temporal/output, ignoralo en template.config.json:`);
console.error(`     { "roadmap": { "ignore_dirs": ["mi-dir-output"] } }`);

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
