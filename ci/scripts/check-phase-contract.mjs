#!/usr/bin/env node
/**
 * check-phase-contract.mjs (v12.58)
 *
 * Valida que cada feature en fase N cumpla su contrato de ejecucion definido
 * en `_lib/phase-contracts.mjs`.
 *
 * Para cada feature:
 *   1. Infiere la fase actual via gates approved.
 *   2. Verifica que existan los archivos listados en `debeActualizar` del contrato.
 *   3. Reporta warnings si falta evidencia (no bloqueante por default — el contrato
 *      es una guia operativa, no un mandato rigido).
 *
 * Modos:
 *   --strict       exit 1 si alguna feature no cumple contrato de su fase.
 *   --warn         exit 0 con warning (default).
 *   --feature X    valida solo una feature especifica.
 *   --root <path>  raiz del proyecto.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "./_lib/feature-filter.mjs";
import { getPhaseContract } from "./_lib/phase-contracts.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override
const featureFilter = args.feature || null;

const features = listIncludedFeatures(root).filter((s) => !featureFilter || s.startsWith(featureFilter));
const findings = [];

for (const slug of features) {
  const tracePath = join(root, "specs", slug, "traceability.md");
  if (!existsSync(tracePath)) continue;
  const text = readFileSync(tracePath, "utf8");

  // Inferir fase actual desde gates approved.
  let phase = 2; // default fase UX/UI (donde una feature recien creada vive)
  if (/gate-operations-ready[^\n]*approved/i.test(text)) phase = 8;
  else if (/gate-deploy-ready[^\n]*approved/i.test(text)) phase = 7;
  else if (/gate-qa-passed[^\n]*approved/i.test(text)) phase = 6;
  else if (/gate-build-ready[^\n]*approved/i.test(text)) phase = 5;
  else if (/gate-sdd-approved[^\n]*approved/i.test(text)) phase = 4;
  else if (/gate-2-3[^\n]*approved/i.test(text)) phase = 3;
  else if (/gate-spdd-approved[^\n]*approved/i.test(text)) phase = 2; // sigue en 2 hasta gate-2-3

  const contract = getPhaseContract(phase);
  if (!contract) continue;

  // Verificar que existan los archivos referenciados en debeActualizar.
  // Solo verificamos paths que tienen <feature> placeholder (los reemplazamos por el slug).
  const missingArtifacts = [];
  for (const item of contract.debeActualizar) {
    // Extraer path file-like dentro del item (heuristica simple).
    const pathMatches = item.match(/[\w./-]*specs\/<feature>\/[\w.-]+\.md/g) || [];
    for (const pm of pathMatches) {
      const real = pm.replace("<feature>", slug);
      if (!existsSync(join(root, real))) {
        missingArtifacts.push(real);
      }
    }
  }

  if (missingArtifacts.length > 0) {
    findings.push({
      slug,
      phase,
      phaseName: contract.name,
      kind: "missing-artifacts",
      missing: missingArtifacts,
    });
  }
}

console.log(`check-phase-contract (v12.58)`);
console.log(`Features verificadas:        ${features.length}`);
console.log(`Contrato consultado:         _lib/phase-contracts.mjs (9 fases)`);

if (findings.length === 0) {
  console.log(`\nOK. Todas las features cumplen el contrato de ejecucion de su fase actual.`);
  process.exit(0);
}

console.error(`\n${findings.length} feature(s) con artefactos pendientes segun contrato de fase:`);
for (const f of findings) {
  console.error(`  ⚠ ${f.slug} (fase ${f.phase} ${f.phaseName}):`);
  for (const m of f.missing.slice(0, 5)) {
    console.error(`      - falta ${m}`);
  }
  if (f.missing.length > 5) console.error(`      ... y ${f.missing.length - 5} mas.`);
}
console.error(`\nFix sugerido:`);
console.error(`  1. Consultar el contrato completo de la fase via:`);
console.error(`     npm run roadmap:next  (incluye phase_contract de la fase actual)`);
console.error(`     o:`);
console.error(`     curl /api/roadmap/contract/<phase-id>  (panel embebido en memory-serve)`);
console.error(`  2. Completar los archivos faltantes listados en 'debeActualizar' del contrato.`);

process.exit(findings.length > 0 && strict ? 1 : 0);

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
