#!/usr/bin/env node
/**
 * check-phase-validator-sync.mjs (v12.87)
 *
 * Meta-validador de COHERENCIA entre el contrato ejecutable de fases
 * (_lib/phase-contracts.mjs > debeValidar) y el pipeline real (package.json).
 * Cierra el drift detectado: validadores nuevos (check:prototype-spa-coherence,
 * check:prototype-mock-data, ...) que se agregaron a check:project y pre-flight
 * pero se olvidaron en el contrato de fase, dejando la metodologia desincronizada.
 *
 * Verifica:
 *   FORWARD (blocker):  cada `npm run check:*` referenciado en algun debeValidar
 *                       EXISTE como script en package.json (sin typos / removidos).
 *   REVERSE (blocker):  cada validador HOJA `check:prototype-*` que corre en
 *                       check:project esta referenciado en el contrato de fase 2
 *                       (los de prototipo son gate de UX). Excluye composites
 *                       (scripts cuyo valor usa `npm run`, p.ej. check:prototype-portfolio).
 *
 * Es la contraparte de check:validation-coverage (que valida pipeline<->fs); este
 * valida contrato<->pipeline. Modos: --strict | --warn (default) | --root <path>.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { getAllPhaseContracts, getPhaseContract } from "./_lib/phase-contracts.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);

const pkgPath = join(root, "package.json");
if (!existsSync(pkgPath)) {
  console.log(`check-phase-validator-sync (v12.87): no hay package.json en ${root} — no aplica.`);
  process.exit(0);
}
const scripts = (JSON.parse(readFileSync(pkgPath, "utf8")).scripts) || {};
const checkProject = scripts["check:project"] || "";

// Extrae tokens `check:xxx` de un texto (debeValidar entry o un script compuesto).
function checkTokens(text) {
  return [...String(text).matchAll(/npm run (check:[a-z0-9:-]+)/g)].map((m) => m[1]);
}

const contracts = getAllPhaseContracts();
const blockers = [];

// FORWARD: cada check:* del contrato existe como script.
for (const c of contracts) {
  for (const entry of (c.debeValidar || [])) {
    for (const tok of checkTokens(entry)) {
      if (!(tok in scripts)) {
        blockers.push({ kind: "contrato-ref-rota", message: `fase ${c.id} (${c.name}) debeValidar referencia "${tok}" que NO existe en package.json scripts.` });
      }
    }
  }
}

// REVERSE: todo leaf check:prototype-* en check:project debe estar en fase 2 debeValidar.
const fase2 = getPhaseContract(2);
const fase2Tokens = new Set((fase2?.debeValidar || []).flatMap(checkTokens));
const projectTokens = [...new Set(checkTokens(checkProject))];
const protoLeaves = projectTokens.filter((t) => t.startsWith("check:prototype-") && !/npm run/.test(scripts[t] || ""));
for (const t of protoLeaves) {
  if (!fase2Tokens.has(t)) {
    blockers.push({ kind: "validador-fuera-de-contrato", message: `"${t}" corre en check:project pero NO esta en el contrato de fase 2 (debeValidar). Agregalo a _lib/phase-contracts.mjs.` });
  }
}

console.log(`check-phase-validator-sync (v12.87) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`Contratos de fase:           ${contracts.length}`);
console.log(`Validadores de prototipo en check:project: ${protoLeaves.length}`);

if (blockers.length === 0) {
  console.log(`\nOK. El contrato de fases y el pipeline estan sincronizados.`);
  process.exit(0);
}

console.error(`\nDesincronizaciones (${blockers.length}):`);
for (const b of blockers) console.error(`  ✗ [${b.kind}] ${b.message}`);
console.error(`\nFix sugerido:`);
console.error(`  - Si agregaste un validador de prototipo: agregalo a fase 2 debeValidar en _lib/phase-contracts.mjs.`);
console.error(`  - Si renombraste/eliminaste un script: actualiza la referencia en el contrato de la fase.`);
console.error(`  - El auto-zone 'fase-N-contrato' (npm run roadmap:sync) reflejara el cambio en los checklists.`);

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
