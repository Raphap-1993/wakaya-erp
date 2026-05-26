#!/usr/bin/env node
/**
 * check-runbook-documented.mjs (v12.45)
 *
 * Para cada feature en phase >= 8 (Operacion), verifica que exista
 * `ops/fase-8-operacion/features/<slug>/runbook.md` (o
 * `ops/features/<slug>/runbook.md`) con las secciones minimas que un
 * operador de guardia necesita en una madrugada:
 *
 *   - ## Procedimiento normal
 *   - ## Procedimiento de fallo
 *   - ## SLO / SLI
 *   - ## Contactos / escalamiento
 *
 * Sin esto, el runbook es decorativo y el ops-on-call no tiene guia
 * accionable cuando el sistema falla.
 *
 * En features con phase < 8 no aplica (runbook aspiracional es normal en
 * SDD/construccion/QA).
 *
 * Uso:
 *   node ci/scripts/check-runbook-documented.mjs
 *   node ci/scripts/check-runbook-documented.mjs --min-phase 8
 *
 * Exit codes:
 *   0 - cobertura runbook completa o no hay features fase >=8
 *   1 - hay features fase >=8 sin runbook canonico
 *   2 - error de configuracion
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dbPath = args.db ? resolve(args.db) : join(root, "ai", "memory", "framework-agent.db");
const minPhase = Number(args["min-phase"] ?? 8);

if (!existsSync(dbPath)) {
  console.error(`No existe DB: ${dbPath}. Corre primero index-docs + sync-memory.`);
  process.exit(2);
}

const db = new DatabaseSync(dbPath);

const REQUIRED_SECTIONS = [
  "## Procedimiento normal",
  "## Procedimiento de fallo",
  "## SLO / SLI",
  "## Contactos",
];

function phaseToNumber(phaseStr) {
  if (!phaseStr) return null;
  const s = String(phaseStr).toLowerCase();
  const num = parseInt(s.match(/(\d+)/)?.[1] || "0", 10);
  if (num > 0) return num;
  if (/operaci/.test(s)) return 8;
  if (/deploy/.test(s)) return 7;
  if (/qa/.test(s)) return 6;
  if (/construcci/.test(s)) return 5;
  if (/sdd/.test(s)) return 4;
  return null;
}

const featureScopes = db
  .prepare(`SELECT DISTINCT phase_scope AS scope FROM ai_gate_runs WHERE phase_scope LIKE 'specs/%'`)
  .all()
  .map((r) => r.scope);

const opsFeatures = featureScopes.filter((scope) => {
  const docs = db.prepare(`SELECT phase FROM ai_documents WHERE path LIKE ?`).all(`${scope}/%`);
  for (const d of docs) {
    const p = phaseToNumber(d.phase);
    if (p != null && p >= minPhase) return true;
  }
  // Senal alternativa: existe ops/<slug>/ o ops/features/<slug>/ con runbook.md
  const slug = scope.replace(/^specs\//, "");
  const candidates = [
    join(root, "ops", "fase-8-operacion", "features", slug, "runbook.md"),
    join(root, "ops", "features", slug, "runbook.md"),
    join(root, "ops", slug, "runbook.md"),
  ];
  return candidates.some((c) => existsSync(c));
});

if (opsFeatures.length === 0) {
  console.log(`OK. No hay features en fase >= ${minPhase} (Operacion). check-runbook-documented solo aplica cuando la feature esta productiva.`);
  process.exit(0);
}

const issues = [];
for (const scope of opsFeatures) {
  const slug = scope.replace(/^specs\//, "");
  const candidates = [
    join(root, "ops", "fase-8-operacion", "features", slug, "runbook.md"),
    join(root, "ops", "features", slug, "runbook.md"),
    join(root, "ops", slug, "runbook.md"),
  ];
  const runbookPath = candidates.find((c) => existsSync(c));
  if (!runbookPath) {
    issues.push({ feature: scope, kind: "missing", detail: `falta runbook.md en ${candidates.map((c) => c.replace(root, "<root>")).join(" | ")}` });
    continue;
  }
  const text = readFileSync(runbookPath, "utf8");
  const missingSections = REQUIRED_SECTIONS.filter((s) => !text.includes(s));
  if (missingSections.length) {
    issues.push({ feature: scope, kind: "incomplete", file: runbookPath, missing: missingSections });
    continue;
  }
  // v12.45: ademas exigir SLO numerico verificable bajo la seccion '## SLO / SLI'.
  // Patrones aceptados (case-insensitive, decimales con punto):
  //   - latency p95 <= 200ms / latencia p99 < 500 ms
  //   - error rate < 0.5%  /  tasa de error <= 1%
  //   - availability >= 99.9%  / disponibilidad 99.95%
  //   - throughput >= 100 rps
  const sloMatch = text.match(/##\s*SLO[^\n]*\n([\s\S]*?)(?=\n##\s|$)/);
  if (sloMatch) {
    const sloBody = sloMatch[1];
    const sloIssues = validateSloBody(sloBody);
    if (sloIssues.length) {
      issues.push({ feature: scope, kind: "slo-weak", file: runbookPath, sloIssues });
    }
  }
}

// v12.45: helper para parsear SLOs numericos. Devuelve issues si no encuentra
// al menos un SLO concreto (latencia o error rate o disponibilidad).
function validateSloBody(body) {
  const issues = [];
  const lat = /\b(?:lat(?:ency|encia)|p(?:50|90|95|99))\b[^\n]*?(<=|>=|<|>|=)\s*\d+(?:\.\d+)?\s*(ms|s|seg|segundos)/i.test(body);
  const err = /\b(?:error\s*rate|tasa\s+de\s+error|errores?)\b[^\n]*?(<=|<|>=|>|=)\s*\d+(?:\.\d+)?\s*%/i.test(body);
  const avail = /\b(?:availability|disponibilidad|uptime)\b[^\n]*?(<=|>=|<|>|=)\s*\d+(?:\.\d+)?\s*%/i.test(body);
  const tput = /\b(?:throughput|qps|rps|tps)\b[^\n]*?(<=|>=|<|>|=)\s*\d+(?:\.\d+)?\s*(rps|qps|tps|req\/s|\/s)?/i.test(body);
  const anyNumeric = lat || err || avail || tput;
  if (!anyNumeric) {
    issues.push("seccion '## SLO / SLI' no declara ningun SLO numerico verificable (esperado al menos uno entre: latencia p95 <= Xms, error rate < X%, disponibilidad >= X%, throughput >= X rps).");
  }
  return issues;
}

if (issues.length === 0) {
  console.log(`OK. ${opsFeatures.length} feature(s) en fase >= ${minPhase} con runbook completo (procedimientos + SLO + contactos).`);
  process.exit(0);
}

console.error(`RUNBOOK INCOMPLETO: ${issues.length} feature(s) en fase >= ${minPhase} sin runbook canonico.`);
for (const i of issues) {
  if (i.kind === "missing") {
    console.error(`  - ${i.feature}: ${i.detail}`);
  } else if (i.kind === "slo-weak") {
    console.error(`  - ${i.feature} (${i.file.replace(root, "<root>")}): SLO no verificable`);
    for (const s of i.sloIssues) console.error(`      * ${s}`);
  } else {
    console.error(`  - ${i.feature} (${i.file.replace(root, "<root>")}): faltan secciones`);
    for (const s of i.missing) console.error(`      * ${s}`);
  }
}
console.error("");
console.error("Fix: crear `ops/fase-8-operacion/features/<slug>/runbook.md` con las secciones");
console.error("`## Procedimiento normal`, `## Procedimiento de fallo`, `## SLO / SLI`, `## Contactos`.");
console.error("Sin esto, el ops-on-call no tiene guia accionable cuando la feature falla en produccion.");
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
