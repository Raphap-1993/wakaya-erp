#!/usr/bin/env node
/**
 * check-gates-mentioned.mjs (v12.45)
 *
 * Verifica que cada feature bajo `specs/` registre al menos un gate en
 * `ai_gate_runs`. Sin esto, una feature puede llegar a Construccion o QA
 * sin haber pasado ni `gate-spdd-approved` ni `gate-build-ready`,
 * convirtiendose en una caja negra desde el punto de vista del proceso.
 *
 * Reglas:
 *   - Toda feature listada en `ai_documents` con path `specs/<slug>/...` debe
 *     tener al menos 1 fila en `ai_gate_runs` con `phase_scope = 'specs/<slug>'`.
 *   - Si la feature solo aparece en la matriz global, NO cuenta: debe haber
 *     un gate per-feature (origin='feature').
 *   - Compat: si NO existe la columna `origin` (DB previa a v12.45), se acepta
 *     cualquier match.
 *
 * Uso:
 *   node ci/scripts/check-gates-mentioned.mjs
 *   node ci/scripts/check-gates-mentioned.mjs --require-origin feature
 *
 * Exit codes:
 *   0 - todas las features mencionan al menos un gate
 *   1 - hay features sin ningun gate
 *   2 - error de configuracion
 */

import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dbPath = args.db ? resolve(args.db) : join(root, "ai", "memory", "framework-agent.db");
const requireOrigin = args["require-origin"]; // 'feature' o 'global' o undefined

if (!existsSync(dbPath)) {
  console.error(`No existe DB: ${dbPath}. Corre primero index-docs + sync-memory.`);
  process.exit(2);
}

const db = new DatabaseSync(dbPath);

// Detectar si existe la columna origin (v12.45+).
let hasOrigin = false;
try {
  const cols = db.prepare("PRAGMA table_info(ai_gate_runs)").all();
  hasOrigin = cols.some((c) => c.name === "origin");
} catch { /* sin tabla */ }

// v12.45: solo cuentan slugs reales de feature (NNN-...). Excluye README.md,
// _attic/, 000-ejemplo-feature (placeholder canonico), .archived/.
const isRealFeatureSlug = (slug) => /^\d{3,}-[a-z0-9-]+/i.test(slug) && !/^000-/.test(slug) && !slug.startsWith(".") && slug !== "README.md";
const featureSlugs = new Set(
  db.prepare(`SELECT DISTINCT path FROM ai_documents WHERE path LIKE 'specs/%'`).all()
    .map((r) => {
      const m = String(r.path).match(/^specs\/([^/]+)/);
      return m ? m[1] : null;
    })
    .filter(Boolean)
    .filter(isRealFeatureSlug),
);

if (featureSlugs.size === 0) {
  console.log("OK. No hay features bajo specs/ (validador no aplica).");
  process.exit(0);
}

const orphans = [];
for (const slug of featureSlugs) {
  const scope = `specs/${slug}`;
  let rows;
  if (hasOrigin && requireOrigin) {
    rows = db.prepare(`SELECT COUNT(*) AS n FROM ai_gate_runs WHERE phase_scope = ? AND origin = ?`).all(scope, requireOrigin);
  } else {
    rows = db.prepare(`SELECT COUNT(*) AS n FROM ai_gate_runs WHERE phase_scope = ?`).all(scope);
  }
  const n = rows[0]?.n || 0;
  if (n === 0) orphans.push(slug);
}

if (orphans.length === 0) {
  const note = hasOrigin && requireOrigin ? ` (origin='${requireOrigin}')` : "";
  console.log(`OK. ${featureSlugs.size} feature(s) bajo specs/ mencionan al menos un gate${note}.`);
  process.exit(0);
}

console.error(`FEATURES SIN GATE: ${orphans.length}/${featureSlugs.size} feature(s) bajo specs/ no registran ningun gate en ai_gate_runs.`);
for (const slug of orphans) {
  console.error(`  - specs/${slug}`);
}
console.error("");
console.error("Fix: agregar al menos una linea con formato `- \\`gate-<nombre>\\`: <status>` en");
console.error("alguno de los .md de la feature (ej. spec-funcional.md, traceability.md), o registrar");
console.error("la fila en la tabla 'Gates' del traceability per-feature con columna `feature` poblada.");
if (requireOrigin) {
  console.error(`Esto exige origin='${requireOrigin}': los gates de la matriz global NO cuentan.`);
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
