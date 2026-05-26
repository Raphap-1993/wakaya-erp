#!/usr/bin/env node
/**
 * check-trace-coverage.mjs
 *
 * Garantiza que todo RF/RNF en un spec con fase >= la fase minima
 * configurada tiene al menos un trace link de tipo `codigo` Y otro de tipo
 * `test`. Es decir: ningun requerimiento se queda sin implementacion ni
 * sin prueba cuando ya entro a construccion.
 *
 * La fase se infiere desde el campo `phase_scope` (specs/<feature>) y se
 * consulta el campo `phase` del documento `traceability.md` correspondiente.
 * Como heuristica: si existe `spec-tareas.md` en el mismo scope, se asume que
 * la feature paso a fase 5+.
 *
 * Uso:
 *   node ci/scripts/check-trace-coverage.mjs
 *   node ci/scripts/check-trace-coverage.mjs --root <repo> --min-phase 5
 *   node ci/scripts/check-trace-coverage.mjs --require-test false  (solo codigo)
 *
 * Exit codes:
 *   0 — cobertura completa
 *   1 — algun RF/RNF sin codigo o sin test
 */

import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dbPath = args.db ? resolve(args.db) : join(root, "ai", "memory", "framework-agent.db");
const requireTest = args["require-test"] !== "false";
const minPhase = Number(args["min-phase"] ?? 5);

if (!existsSync(dbPath)) {
  console.error(`No existe DB: ${dbPath}. Corre primero index-docs + sync-memory.`);
  process.exit(2);
}

const db = new DatabaseSync(dbPath);

// v12.32: detectar scopes de features con fase explicita >= minPhase.
// Estrategia 1 (preferida): leer `phase` de ai_documents (la fase real declarada
// en el archivo Markdown, ej. "fase-5", "construccion", "5"). Estrategia 2
// (fallback): inferir por existencia de spec-tareas.md.
function phaseToNumber(phaseStr) {
  if (!phaseStr) return null;
  const s = String(phaseStr).toLowerCase();
  const num = parseInt(s.match(/(\d+)/)?.[1] || "0", 10);
  if (num > 0) return num;
  // mapeo de aliases por nombre
  if (/iniciaci/.test(s)) return 0;
  if (/analisis|requerimientos/.test(s)) return 1;
  if (/ux|ui/.test(s)) return 2;
  if (/arquitectura/.test(s)) return 3;
  if (/sdd/.test(s)) return 4;
  if (/construcci/.test(s)) return 5;
  if (/qa/.test(s)) return 6;
  if (/deploy/.test(s)) return 7;
  if (/operaci/.test(s)) return 8;
  return null;
}

const featureScopes = db
  .prepare(
    `SELECT DISTINCT phase_scope AS scope FROM ai_gate_runs
     WHERE phase_scope LIKE 'specs/%'`,
  )
  .all()
  .map((r) => r.scope);

const activeFeatures = featureScopes.filter((scope) => {
  // v12.33: SOLO phase explicita desde ai_documents (cualquier .md de la feature
  // con phase declarada >= minPhase basta para considerarla activa). Antes habia
  // un fallback "existe spec-tareas.md => fase 5+" pero spec-tareas.md es de
  // fase 4 (SDD), no de fase 5. El fallback marcaba como construccion features
  // que aun estaban en SDD y exigia codigo/test cuando no correspondia.
  const docs = db.prepare(`SELECT phase FROM ai_documents WHERE path LIKE ?`).all(`${scope}/%`);
  for (const d of docs) {
    const p = phaseToNumber(d.phase);
    if (p != null && p >= minPhase) return true;
  }
  // Senal explicita: existe src/<feature>/ con codigo real => construccion empezo.
  // Esto si justifica exigir cobertura (codigo + test). 'spec-tareas.md' solo
  // significa que SDD termino la planificacion, no que se este construyendo.
  const slug = scope.replace(/^specs\//, "");
  for (const candidate of ["src", "backend", "frontend"]) {
    if (existsSync(join(root, candidate, slug))) return true;
  }
  return false;
});

if (activeFeatures.length === 0) {
  console.log(`OK. No hay features en fase >= ${minPhase} (phase de ai_documents + existencia de src/<feature>/).`);
  process.exit(0);
}

// v12.35: detectar la fase real de cada feature (max phase declarada en sus docs
// o por existencia de src/<feature>/). La cobertura exigida depende de la fase:
//   fase 4 (SDD):          spec-funcional + spec-tecnica + spec-tareas (no codigo/test)
//   fase 5 (Construccion): codigo real obligatorio; test recomendado
//   fase 6+ (QA/Deploy):   codigo + test ambos obligatorios; gate-spdd-approved
function detectFeaturePhase(scope) {
  // Maxima fase declarada en docs de la feature
  const docs = db.prepare(`SELECT phase FROM ai_documents WHERE path LIKE ?`).all(`${scope}/%`);
  let maxPhase = 0;
  for (const d of docs) {
    const p = phaseToNumber(d.phase);
    if (p != null && p > maxPhase) maxPhase = p;
  }
  // Si hay src/<feature>/ con codigo real => al menos fase 5
  const slug = scope.replace(/^specs\//, "");
  for (const candidate of ["src", "backend", "frontend"]) {
    if (existsSync(join(root, candidate, slug))) maxPhase = Math.max(maxPhase, 5);
  }
  return maxPhase;
}

const issues = [];
for (const scope of activeFeatures) {
  const featurePhase = detectFeaturePhase(scope);
  const rfs = db
    .prepare(
      `SELECT DISTINCT source_ref FROM ai_trace_links
       WHERE source_type IN ('RF', 'origen', 'requerimiento')
         AND (source_file LIKE ? OR evidence_ref LIKE ?)`,
    )
    .all(`${scope}/%`, `%${scope}%`)
    .map((r) => r.source_ref);

  for (const rf of rfs) {
    const targets = db
      .prepare(
        `SELECT target_type FROM ai_trace_links
         WHERE source_ref = ?
           AND target_type IN ('codigo', 'test')
           AND link_status IN ('implemented','validated')`,
      )
      .all(rf)
      .map((r) => r.target_type);
    const hasCode = targets.includes("codigo");
    const hasTest = targets.includes("test");

    // v12.35: requisitos por fase.
    //   fase 5: codigo obligatorio; test recomendado (warning)
    //   fase 6+: codigo + test ambos obligatorios
    const wantsCode = featurePhase >= 5;
    const wantsTest = featurePhase >= 6 && requireTest;
    const wantsTestSoft = featurePhase === 5 && requireTest;

    const missing = [];
    if (wantsCode && !hasCode) missing.push("codigo");
    if (wantsTest && !hasTest) missing.push("test");
    if (missing.length) {
      issues.push({ feature: scope, rf, missing, severity: "error", phase: featurePhase });
    } else if (wantsTestSoft && !hasTest) {
      // Solo warning para fase 5 sin test
      issues.push({ feature: scope, rf, missing: ["test"], severity: "warning", phase: featurePhase });
    }
  }
}

const errors = issues.filter((i) => i.severity === "error");
const warnings = issues.filter((i) => i.severity === "warning");

if (errors.length === 0 && warnings.length === 0) {
  console.log(`OK. Todas las features en fase >= ${minPhase} tienen cobertura completa por su fase.`);
  process.exit(0);
}

if (warnings.length > 0) {
  console.warn(`WARNINGS (fase 5, test recomendado): ${warnings.length} requerimientos.`);
  for (const i of warnings) {
    console.warn(`  WARN  ${i.feature} :: ${i.rf}  faltan: ${i.missing.join(", ")} (fase ${i.phase})`);
  }
}

if (errors.length === 0) {
  console.log(`OK con ${warnings.length} warnings. Sin errores bloqueantes.`);
  process.exit(0);
}

console.error(`COBERTURA INCOMPLETA: ${errors.length} requerimientos con huecos bloqueantes.`);
for (const i of errors) {
  console.error(`  ERROR ${i.feature} :: ${i.rf}  faltan: ${i.missing.join(", ")} (fase ${i.phase})`);
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
