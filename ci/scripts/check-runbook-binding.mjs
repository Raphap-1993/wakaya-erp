#!/usr/bin/env node
/**
 * check-runbook-binding.mjs (v12.57)
 *
 * Verifica que cada runbook en ops/runbooks/ cumpla 3 criterios estrictos:
 *   1. Nombre del archivo debe matchear un slug de feature real:
 *      ops/runbooks/<NNN-feature-slug>-runbook.md
 *      o ops/runbooks/<NNN-feature-slug>.md
 *      Excepcion: runbooks transversales con frontmatter `kind: transversal`.
 *   2. Debe mencionar al menos un RF-NN/HU-NN del proyecto.
 *   3. Debe tener seccion `## SLO/SLI` con al menos un valor numerico
 *      (`p95 <= 800ms`, `disponibilidad >= 99.5%`, etc.).
 *
 * v12.57 cierra el falso positivo de Fase 8 "complete":
 *   - Antes: bastaba con que existiera ops/runbooks/ para marcar Fase 8 complete.
 *   - Ahora: cada runbook debe estar VINCULADO a una feature real con SLO medible.
 *
 * Modos:
 *   --strict       exit 1 si hay runbooks sin vinculacion completa.
 *   --warn         exit 0 con warning (default).
 *   --root <path>  raiz del proyecto.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { listAllFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override

const runbookDir = join(root, "ops", "runbooks");
if (!existsSync(runbookDir)) {
  console.log(`OK. No existe ops/runbooks/ — nada que validar (Fase 8 no aplica).`);
  process.exit(0);
}

let entries;
try { entries = readdirSync(runbookDir); } catch { entries = []; }
const runbooks = entries.filter((f) => /\.md$/.test(f) && !/^readme/i.test(f));

if (runbooks.length === 0) {
  console.log(`OK. ops/runbooks/ existe pero esta vacio — nada que validar.`);
  process.exit(0);
}

const allFeatures = listAllFeatures(root).map((f) => f.slug);
const findings = [];

for (const fname of runbooks) {
  const path = join(runbookDir, fname);
  const text = readFileSync(path, "utf8");
  const rel = `ops/runbooks/${fname}`;

  // Opt-out: runbook transversal.
  if (/^---\s*\n[\s\S]*?\bkind\s*:\s*(transversal|cross-cutting|infraestructura)\b[\s\S]*?\n---/m.test(text)) {
    continue;
  }

  // 1. Nombre debe matchear un slug de feature.
  const slugFromName = fname.replace(/(-runbook)?\.md$/, "");
  const matchesFeature = allFeatures.includes(slugFromName);
  if (!matchesFeature) {
    findings.push({
      file: rel,
      kind: "name-mismatch",
      message: `nombre '${slugFromName}' no matchea ningun slug en specs/. Esperado: <NNN-feature-slug>-runbook.md o frontmatter 'kind: transversal'`,
    });
  }

  // 2. Debe mencionar RF/HU.
  const rfMatches = text.match(/\b(RF|RNF|HU)-\d+/g) || [];
  if (rfMatches.length === 0) {
    findings.push({
      file: rel,
      kind: "no-rf-mention",
      message: `no menciona ningun RF-NN/HU-NN. Agrega cobertura explicita.`,
    });
  }

  // 3. SLO numerico.
  const hasNumericSlo = /(p9[59]|latenc|disponib|uptime|throughput|rpm|rps|tps)[^\n]*?(?:<=?|>=?|=)\s*\d+/i.test(text);
  if (!hasNumericSlo) {
    findings.push({
      file: rel,
      kind: "no-numeric-slo",
      message: `no contiene SLO numerico. Esperado: 'latencia p95 <= 800ms' o 'disponibilidad >= 99.5%' o similar.`,
    });
  }
}

console.log(`check-runbook-binding (v12.57)`);
console.log(`Runbooks verificados: ${runbooks.length}`);
console.log(`Features conocidas:   ${allFeatures.length}`);

if (findings.length === 0) {
  console.log(`\nOK. Todos los runbooks estan vinculados a feature + RF + SLO numerico.`);
  process.exit(0);
}

// v12.63: ⚠ en modo no-estricto (no bloquea), ✗ solo en --strict/CHECK_STRICT=1.
const mark = strict ? "✗" : "⚠";
const sev = strict ? "hallazgo(s) (BLOQUEAN en strict)" : "warning(s) (no bloquean — usa --strict para fallar)";
console.error(`\nDetectados ${findings.length} ${sev} en runbooks:`);
for (const f of findings) {
  console.error(`  ${mark} [${f.kind}] ${f.file}: ${f.message}`);
}
console.error(`\nFix sugerido:`);
console.error(`  1. Renombrar runbook al patron canonico: ops/runbooks/<NNN-feature-slug>-runbook.md`);
console.error(`     Ej: ops/runbooks/001-bandeja-trabajo-expedientes-runbook.md`);
console.error(`  2. Agregar mencion explicita de RF/HU al runbook:`);
console.error(`     "## Cobertura: RF-02 (consulta bandeja), RNF-01 (latencia)"`);
console.error(`  3. Agregar SLO/SLI numerico:`);
console.error(`     "## SLO/SLI"`);
console.error(`     "- Latencia p95 <= 800ms"`);
console.error(`     "- Disponibilidad >= 99.5%"`);
console.error(`  4. Si el runbook NO esta atado a una feature, marca con frontmatter:`);
console.error(`     ---`);
console.error(`     kind: transversal`);
console.error(`     ---`);

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
