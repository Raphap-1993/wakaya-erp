#!/usr/bin/env node
/**
 * check-evidence-exists.mjs (v12.45)
 *
 * Paralelo a check-trace-drift pero enfocado en `evidence_ref`. Para cada
 * evidence_ref distinto en ai_trace_links, verifica que el archivo exista
 * en disco (relativo al root del repo). Si no existe, reporta como hallazgo.
 *
 * Casos especiales que se ignoran (no fallan):
 *   - URLs (http://, https://)
 *   - Anchors / fragmentos (`#seccion`)
 *   - Paths absolutos Windows (`C:\...`) o Unix (`/...`)
 *   - Placeholders (`-`, `tbd`, vacios)
 *
 * En modo --strict (env CHECK_STRICT=1) tambien valida que ningun evidence_ref
 * quede como ruta "corta" sin slash (ej. `spec-funcional.md` suelto). Por
 * default solo valida existencia.
 *
 * Uso:
 *   node ci/scripts/check-evidence-exists.mjs
 *   node ci/scripts/check-evidence-exists.mjs --strict
 *   node ci/scripts/check-evidence-exists.mjs --root <repo>
 *
 * Exit codes:
 *   0 - todas las evidencias apuntan a archivos reales
 *   1 - hay evidencias que no existen
 *   2 - error de configuracion
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dbPath = args.db ? resolve(args.db) : join(root, "ai", "memory", "framework-agent.db");
const strict = args.strict === true || process.env.CHECK_STRICT === "1";

if (!existsSync(dbPath)) {
  console.error(`No existe DB: ${dbPath}. Corre primero index-docs + sync-memory.`);
  process.exit(2);
}

const db = new DatabaseSync(dbPath);

const placeholderRe = /^(\s*[-—]?\s*|n\/?a|na|tbd|pendiente|por definir)$/i;

function isExternalOrAbsolute(s) {
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return true;
  if (s.startsWith("#")) return true;          // anchor
  if (/^[A-Za-z]:[\\/]/.test(s)) return true;   // Windows absolute (C:\...)
  if (s.startsWith("/")) return true;           // Unix absolute
  return false;
}

// Recolectar evidence_ref distintos.
const rows = db
  .prepare(`SELECT DISTINCT evidence_ref, source_ref, target_type, source_file FROM ai_trace_links WHERE evidence_ref IS NOT NULL AND evidence_ref != ''`)
  .all();

if (rows.length === 0) {
  console.log("OK. No hay evidence_ref para validar.");
  process.exit(0);
}

const missing = [];
const shortPaths = [];

for (const r of rows) {
  const ev = String(r.evidence_ref || "").trim();
  if (!ev || placeholderRe.test(ev)) continue;
  if (isExternalOrAbsolute(ev)) continue; // no tratamos URLs/absolutes
  // Algunas evidencias incluyen `:line @tag TARGET` (de harvest-trace).
  // Para chequear existencia, quitar el sufijo de cita.
  const cleanPath = ev.split(/[\s:]/)[0];
  if (!cleanPath) continue;
  const abs = resolve(root, cleanPath);
  if (!existsSync(abs)) {
    missing.push({ evidence: ev, source_ref: r.source_ref, target_type: r.target_type, source_file: r.source_file });
    continue;
  }
  // v12.43 --strict: warning si quedan rutas cortas sin slash (deberian haberse
  // qualificado en v12.42 pero por compat seguimos aceptando). Solo informativo
  // a menos que --strict.
  if (strict && !ev.includes("/") && !ev.startsWith("#")) {
    shortPaths.push({ evidence: ev, source_ref: r.source_ref, source_file: r.source_file });
  }
}

// v12.45 (F1): "did you mean" — para cada evidencia inexistente, buscar
// archivos en el repo cuyo basename sea identico o parecido (Levenshtein <= 2
// sobre el basename). Limita a candidatos bajo specs/, plantillas/, docs/,
// ai/, ops/, qa/, ci/, contracts/.
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const v0 = new Array(b.length + 1);
  const v1 = new Array(b.length + 1);
  for (let i = 0; i <= b.length; i += 1) v0[i] = i;
  for (let i = 0; i < a.length; i += 1) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) v0[j] = v1[j];
  }
  return v1[b.length];
}

function buildRepoIndex(rootDir) {
  const out = []; // [{base, rel}]
  const SCOPED = ["specs", "plantillas", "docs", "ai", "ops", "qa", "ci", "contracts", "evidencias", "evidence"];
  const SKIP = new Set(["node_modules", ".git", ".tmp", "dist", "build", "coverage"]);
  function walk(dir, prefix) {
    if (!existsSync(dir)) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP.has(e.name)) continue;
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full, rel);
      else if (e.isFile()) out.push({ base: e.name.toLowerCase(), rel });
    }
  }
  for (const s of SCOPED) walk(join(rootDir, s), s);
  return out;
}
const repoIndex = missing.length > 0 ? buildRepoIndex(root) : [];

function suggestionsFor(evidence) {
  if (!evidence) return [];
  const baseEv = basename(evidence.split(/[\s:]/)[0]).toLowerCase();
  if (!baseEv) return [];
  // 1. Exact base match.
  const exacts = repoIndex.filter((f) => f.base === baseEv).map((f) => f.rel);
  if (exacts.length) return exacts.slice(0, 5);
  // 2. Levenshtein <= 2 sobre basename.
  const close = repoIndex
    .map((f) => ({ rel: f.rel, d: levenshtein(f.base, baseEv) }))
    .filter((x) => x.d <= 2)
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)
    .map((x) => `${x.rel}  (dist ${x.d})`);
  return close;
}

let exitCode = 0;
if (missing.length > 0) {
  console.error(`EVIDENCIAS INEXISTENTES: ${missing.length} evidence_ref apuntan a archivos que no existen.`);
  for (const m of missing) {
    console.error(`  - "${m.evidence}" (${m.source_ref} -> ${m.target_type}; declarado en ${m.source_file})`);
    const sug = suggestionsFor(m.evidence);
    if (sug.length) {
      console.error(`      did you mean:`);
      for (const s of sug) console.error(`        * ${s}`);
    }
  }
  console.error("");
  console.error("Fix: o crear el archivo, o corregir la matriz para usar el path real, o");
  console.error("dejar la celda Evidencia con '-' si aun no esta lista.");
  exitCode = 1;
}
if (shortPaths.length > 0) {
  console.error("");
  console.error(`STRICT: ${shortPaths.length} evidencias siguen como ruta corta (sin slash).`);
  for (const s of shortPaths) {
    console.error(`  - "${s.evidence}" (${s.source_ref}; declarado en ${s.source_file})`);
  }
  console.error("");
  console.error("Fix: qualificar con 'specs/<feature>/<archivo>' en la columna Evidencia.");
  exitCode = 1;
}
if (exitCode === 0) {
  console.log(`OK. ${rows.length} evidence_ref verificadas; todas apuntan a archivos existentes${strict ? " y con path completo" : ""}.`);
  process.exit(0);
}
process.exit(exitCode);

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
