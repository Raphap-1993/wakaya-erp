#!/usr/bin/env node
/**
 * check-plantillas.mjs (v12.88)
 *
 * Coherencia de plantillas/ (formularios en blanco) con su destino real.
 * Cierra el riesgo: un agente abre una plantilla y no sabe si es el entregable
 * o a donde va, o copia una plantilla por-feature que ya drifto del generador.
 *
 * Verifica DOS cosas:
 *  1) POINTER (cada plantillas/**.md excepto README.md):
 *     - declara un banner "> **Plantilla (no es el entregable).** Destino: `<x>`"
 *     - si el destino es una ruta (lleva `/`), esa ruta existe en el repo.
 *  2) SYNC fase-4 (fuente unica): plantillas/fase-4-sdd/*.md derivadas de
 *     scripts/_lib/feature-templates.mjs deben coincidir con el emit (sin drift).
 *
 * Modos: --strict | --warn (default) | --root <path>.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";
import { emitFase4Plantillas } from "../../scripts/_lib/feature-templates.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);

const plantillasDir = join(root, "plantillas");
const BANNER_RE = /^> \*\*Plantilla \(no es el entregable\)\.\*\*\s*Destino:\s*`([^`]+)`/m;

const blockers = [];
const warnings = [];

// ── 1) POINTER ────────────────────────────────────────────────────────
const mdFiles = existsSync(plantillasDir) ? walkMd(plantillasDir) : [];
let evaluated = 0;
for (const abs of mdFiles) {
  const rel = relative(root, abs).replace(/\\/g, "/");
  if (rel.endsWith("/README.md")) continue; // los README son doc de carpeta, no plantilla
  evaluated += 1;
  const txt = readFileSync(abs, "utf8");
  const m = txt.match(BANNER_RE);
  if (!m) {
    blockers.push({ kind: "sin-banner", message: `${rel}: falta el banner "> **Plantilla (no es el entregable).** Destino: \`...\`" (el agente no sabe a donde va el entregable).` });
    continue;
  }
  const dest = m[1].trim();
  if (dest.includes("/")) {
    const probe = dest.replace(/<[^>]*>/g, "").replace(/\/+$/, "").replace(/\/+/g, "/");
    if (probe && !existsSync(join(root, probe))) {
      blockers.push({ kind: "destino-roto", message: `${rel}: el destino \`${dest}\` no existe (${probe}).` });
    }
  }
}

// ── 2) SYNC fase-4 (fuente unica) ─────────────────────────────────────
const emitted = emitFase4Plantillas();
const drift = [];
for (const [name, content] of Object.entries(emitted)) {
  const p = join(root, "plantillas", "fase-4-sdd", name);
  const current = existsSync(p) ? readFileSync(p, "utf8") : null;
  if (current !== content) drift.push(name);
}
if (drift.length > 0) {
  blockers.push({ kind: "fase4-desincronizada", message: `plantillas/fase-4-sdd desincronizada con la fuente unica (${drift.join(", ")}). Fix: npm run plantillas:sync` });
}

console.log(`check-plantillas (v12.88) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`Plantillas evaluadas (pointer): ${evaluated} | archivos fase-4 sync: ${Object.keys(emitted).length}`);

if (blockers.length === 0 && warnings.length === 0) {
  console.log(`\nOK. Todas las plantillas declaran destino valido y fase-4 esta sincronizada.`);
  process.exit(0);
}
if (blockers.length > 0) {
  console.error(`\nBloqueantes (${blockers.length}):`);
  for (const b of blockers) console.error(`  ✗ [${b.kind}] ${b.message}`);
}
if (warnings.length > 0) {
  console.error(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.error(`  ⚠ [${w.kind}] ${w.message}`);
}
console.error(`\nFix sugerido:`);
console.error(`  - Agrega el banner de destino a cada plantilla (ver otras plantillas como modelo).`);
console.error(`  - Sincroniza las plantillas por-feature: npm run plantillas:sync.`);

process.exit(blockers.length > 0 && strict ? 1 : 0);

function walkMd(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMd(abs));
    else if (e.isFile() && e.name.endsWith(".md")) out.push(abs);
  }
  return out;
}

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
