#!/usr/bin/env node
/**
 * check-architecture-baseline.mjs (v12.68) — BLOQUEANTE
 *
 * Verifica el BASELINE MINIMO de arquitectura (fase 3): el conjunto no
 * negociable que cualquier proyecto debe abordar antes de construir —
 * seguridad, calidad, SOLID, DDD/capas, observabilidad, performance/SLO,
 * datos/PII. Es el contrato de ejecucion a nivel arquitectura.
 *
 * Evidence-based: para cada concern busca evidencia en docs/fase-3-arquitectura/
 * (incl. adr/). BLOQUEA si un concern esta completamente ausente.
 *
 * Modos: --strict (default, bloqueante) | --warn | --root <path>.
 *
 * Nota: si el proyecto aun no inicio fase 3 (sin docs/fase-3-arquitectura/),
 * no aplica (OK) — coherente con validadores per-fase.
 */

import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";
import { summarizeBaseline } from "./_lib/architecture-baseline.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true); // default bloqueante

const fase3 = join(root, "docs", "fase-3-arquitectura");
if (!existsSync(fase3)) {
  console.log("OK. No existe docs/fase-3-arquitectura/ — fase 3 no iniciada, baseline no aplica.");
  process.exit(0);
}

const { results, covered, total, absent } = summarizeBaseline(root);

console.log(`check-architecture-baseline (v12.68) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`Concerns del baseline cubiertos: ${covered}/${total}`);
for (const r of results) {
  const icon = r.status === "covered" ? "✓" : "✗";
  console.log(`  ${icon} ${r.label}${r.status === "covered" ? `  (${r.files.length} doc)` : ""}`);
}

if (absent.length === 0) {
  console.log(`\nOK. El proyecto aborda los ${total} concerns minimos de arquitectura.`);
  process.exit(0);
}

console.error(`\nBaseline incompleto: ${absent.length} concern(s) sin evidencia en docs/fase-3-arquitectura/:`);
for (const r of absent) console.error(`  ✗ [${r.id}] ${r.label}`);
console.error(`\nQue significa:`);
console.error(`  Todo proyecto debe abordar el minimo de seguridad/calidad/SOLID/DDD/observabilidad/SLO/datos`);
console.error(`  en fase 3 ANTES de construir. Documenta cada concern ausente en docs/fase-3-arquitectura/`);
console.error(`  (o en un ADR) — basta una seccion que lo aborde con decisiones reales.`);
console.error(`\nVer el semaforo: docs/fase-3-arquitectura/03.04-checklist-arquitectura.md > Baseline minimo`);
console.error(`Refrescar el semaforo: npm run roadmap:sync`);

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
