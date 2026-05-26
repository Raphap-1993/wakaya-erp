#!/usr/bin/env node
/**
 * check-orphan-evidence.mjs (v12.45.1)
 *
 * Inverso de check-evidence-exists. Verifica que todo archivo bajo specs/
 * cuyo nombre se considera "evidencia canonica" (spec-funcional.md,
 * spec-tecnica.md, api-contract.md, traceability.md, prototype.md,
 * prototype-validation.md, product-design.md, spdd-frontend.md, etc.) este
 * conectado a la trazabilidad de alguna manera:
 *
 *   1) Aparece como `evidence_ref` en al menos un `ai_trace_links`, O
 *   2) Aparece como `source_file` de al menos un `ai_trace_links` (es decir,
 *      durante `sync-memory` generó al menos un link — el archivo ES la
 *      fuente de la trazabilidad, no necesita "evidenciarse" a si mismo).
 *
 * Si NO cumple ninguna de las dos => archivo huerfano: o esta documentado
 * pero olvidado, o no contiene tablas que sync-memory pueda parsear.
 *
 * Casos especiales:
 *   - Archivos en specs/_attic/ o specs/.archived/ se ignoran.
 *   - Archivos cuyo nombre no coincide con la lista canonica se ignoran.
 *
 * Uso:
 *   node ci/scripts/check-orphan-evidence.mjs
 *   node ci/scripts/check-orphan-evidence.mjs --include "^(.+\\.md)$"  (regex custom)
 *   node ci/scripts/check-orphan-evidence.mjs --warn-only               (exit 0 incluso si hay huerfanos)
 *
 * Exit codes:
 *   0 - sin huerfanos (o --warn-only)
 *   1 - hay archivos canonicos en specs/ no referenciados como evidence_ref
 *   2 - error de configuracion
 */

import { existsSync, readdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dbPath = args.db ? resolve(args.db) : join(root, "ai", "memory", "framework-agent.db");
const warnOnly = args["warn-only"] === true || process.env.CHECK_ORPHAN_EVIDENCE_WARN === "1";

if (!existsSync(dbPath)) {
  console.error(`No existe DB: ${dbPath}. Corre primero index-docs + sync-memory.`);
  process.exit(2);
}

const db = new DatabaseSync(dbPath);

const CANONICAL_NAMES = new Set([
  "spec-funcional.md",
  "spec-tecnica.md",
  "api-contract.md",
  "traceability.md",
  "traceability_matrix.md",
  "prototype.md",
  "prototype-validation.md",
  "product-design.md",
  "spdd-frontend.md",
  "spdd-backend.md",
  "ux-spec.md",
  "spec-ux.md",
]);

const customInclude = args.include ? new RegExp(String(args.include), "i") : null;
const SKIP_DIRS = new Set(["_attic", ".archived", "node_modules", ".git"]);

const specsRoot = join(root, "specs");
if (!existsSync(specsRoot)) {
  console.log("OK. No existe specs/ (validador no aplica).");
  process.exit(0);
}

const canonicalFiles = [];
function walk(dir, rel) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = join(dir, e.name);
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(full, r);
    else if (e.isFile()) {
      const baseL = e.name.toLowerCase();
      const match = CANONICAL_NAMES.has(baseL) || (customInclude && customInclude.test(e.name));
      if (match) canonicalFiles.push({ rel: `specs/${r}`, name: baseL });
    }
  }
}
walk(specsRoot, "");

if (canonicalFiles.length === 0) {
  console.log("OK. No hay archivos canonicos bajo specs/ (validador no aplica).");
  process.exit(0);
}

// Recolectar todos los evidence_ref distintos.
const evRows = db
  .prepare(`SELECT DISTINCT evidence_ref FROM ai_trace_links WHERE evidence_ref IS NOT NULL AND evidence_ref != ''`)
  .all()
  .map((r) => String(r.evidence_ref).split(/[\s:]/)[0].toLowerCase().replace(/\\/g, "/"))
  .filter(Boolean);

const evSet = new Set(evRows);

// v12.45.1: tambien aceptar source_file (el archivo es la FUENTE de los links,
// no necesita aparecer como evidence_ref de si mismo).
let sfSet = new Set();
try {
  const sfRows = db
    .prepare(`SELECT DISTINCT source_file FROM ai_trace_links WHERE source_file IS NOT NULL AND source_file != ''`)
    .all()
    .map((r) => String(r.source_file).toLowerCase().replace(/\\/g, "/"))
    .filter(Boolean);
  sfSet = new Set(sfRows);
} catch { /* DB previa a v12.31 sin source_file */ }

const orphans = [];
for (const f of canonicalFiles) {
  const lc = f.rel.toLowerCase();
  // Match en evidence_ref (exacto o por sufijo).
  const matchedEv = evSet.has(lc) || evRows.some((e) => e === lc || e.endsWith("/" + f.name) || lc.endsWith(e));
  if (matchedEv) continue;
  // v12.45.1: o match en source_file (el archivo genero al menos un trace link).
  const matchedSf = sfSet.has(lc) || [...sfSet].some((e) => e === lc || e.endsWith("/" + f.name) || lc.endsWith(e));
  if (matchedSf) continue;
  orphans.push(f.rel);
}

if (orphans.length === 0) {
  console.log(`OK. ${canonicalFiles.length} archivo(s) canonico(s) en specs/ estan conectados a la trazabilidad (como evidence_ref o como source_file).`);
  process.exit(0);
}

console.error(`EVIDENCIA HUERFANA: ${orphans.length}/${canonicalFiles.length} archivo(s) canonico(s) en specs/ no estan conectados a la trazabilidad.`);
for (const o of orphans) {
  console.error(`  - ${o}`);
}
console.error("");
console.error("Fix opcion 1: enlazar el archivo en la columna 'Evidencia' de algun traceability.md.");
console.error("Fix opcion 2: agregar al archivo una tabla (RF/HU/gates/etc) que sync-memory parsee, asi");
console.error("              el archivo aparece como source_file de al menos un trace link.");
console.error("Fix opcion 3: borrarlo / moverlo a specs/_attic/ si quedo obsoleto.");
console.error("Para silenciar temporalmente, usa --warn-only (no falla en CI pero sigue reportando).");

if (warnOnly) {
  console.error("");
  console.error("(--warn-only: exit 0 pese a huerfanos)");
  process.exit(0);
}
process.exit(1);

// ── Helpers ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      out[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return out;
}
