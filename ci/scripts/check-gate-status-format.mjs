#!/usr/bin/env node
/**
 * check-gate-status-format.mjs (v12.56)
 *
 * Verifica que la seccion `## Gates` de cada traceability.md tenga el formato
 * canonico v12.56 con 5 columnas:
 *
 *   | Gate | Estado | Aprobador | Fecha | Evidencia |
 *   |---|---|---|---|---|
 *   | gate-prototype-ready | approved | Maria Garcia (PO) | 2026-05-18 | prototype-validation.md |
 *   | gate-spdd-approved | pending | — | — | spdd-frontend.md |
 *
 * Valores aceptados en columna 'Estado':
 *   - approved
 *   - pending
 *   - rejected
 *   - blocked
 *   (legacy: "Aprobado", "Listo para validacion", "En diseno SDD", etc. son tolerados con warning)
 *
 * Cierra el patron real: el formato viejo (3 cols `| Gate | Estado | Evidencia |`)
 * permitia describir el estado en prosa libre ("Listo para validacion", "Aprobado con observaciones")
 * que para un agente IA es ambiguo. El nuevo formato fuerza enum estricto.
 *
 * Modos:
 *   --strict       exit 1 si hay formato no canonico.
 *   --warn         exit 0 con warning (default).
 *   --root <path>  raiz del proyecto.
 *
 * Migracion automatica:
 *   node scripts/template-upgrade.mjs --root . --apply --migrate-gates
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override

const CANONICAL_STATUSES = new Set(["approved", "pending", "rejected", "blocked"]);

const features = listIncludedFeatures(root);
const findings = [];

for (const slug of features) {
  const tracePath = join(root, "specs", slug, "traceability.md");
  if (!existsSync(tracePath)) continue;
  const text = readFileSync(tracePath, "utf8");

  // Extraer seccion ## Gates.
  const gatesMatch = text.match(/##\s+Gates\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  if (!gatesMatch) {
    findings.push({ slug, kind: "missing-section", message: "no tiene seccion `## Gates`" });
    continue;
  }
  const section = gatesMatch[1];

  // Detectar header de tabla.
  const headerMatch = section.match(/^\s*\|([^\n]+)\|\s*$/m);
  if (!headerMatch) {
    findings.push({ slug, kind: "missing-table", message: "seccion `## Gates` no contiene tabla markdown" });
    continue;
  }
  const cols = headerMatch[1].split("|").map((c) => c.trim().toLowerCase()).filter(Boolean);

  // Canonico v12.56: 5 columnas Gate / Estado / Aprobador / Fecha / Evidencia.
  const isCanonical = cols.length === 5
    && /^gate$/i.test(cols[0])
    && /^estado$/i.test(cols[1])
    && /^aprobador$/i.test(cols[2])
    && /^fecha$/i.test(cols[3])
    && /^evidencia$/i.test(cols[4]);

  // Legacy: 3 columnas Gate / Estado / Evidencia.
  const isLegacy = cols.length === 3
    && /^gate$/i.test(cols[0])
    && /^estado$/i.test(cols[1])
    && /^evidencia$/i.test(cols[2]);

  if (!isCanonical && !isLegacy) {
    findings.push({
      slug,
      kind: "unknown-format",
      message: `tabla Gates con columnas no reconocidas: [${cols.join(", ")}]. Esperado canonico: Gate|Estado|Aprobador|Fecha|Evidencia.`,
    });
    continue;
  }

  if (isLegacy) {
    findings.push({
      slug,
      kind: "legacy-format",
      severity: "warning",
      message: `tabla Gates en formato v12.20 (3 cols). Migrar a v12.56 (5 cols) con: 'node scripts/template-upgrade.mjs --apply --migrate-gates'`,
    });
    continue;
  }

  // Validar cada fila tenga status en CANONICAL_STATUSES.
  const rowLines = section.split(/\r?\n/).filter((l) => /^\s*\|/.test(l) && !/^\s*\|[\s-]+\|/.test(l));
  // Saltar header.
  const dataRows = rowLines.slice(1);
  for (const row of dataRows) {
    const cells = row.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 2) continue;
    const gate = cells[0];
    const status = cells[1].toLowerCase();
    if (!CANONICAL_STATUSES.has(status)) {
      findings.push({
        slug,
        kind: "invalid-status",
        message: `gate '${gate}' tiene estado '${cells[1]}'. Debe ser uno de: ${[...CANONICAL_STATUSES].join(", ")}.`,
      });
    }
  }
}

console.log(`check-gate-status-format (v12.56)`);
console.log(`Features verificadas: ${features.length}`);

const blockers = findings.filter((f) => f.severity !== "warning");
const warnings = findings.filter((f) => f.severity === "warning");

if (findings.length === 0) {
  console.log(`\nOK. Todas las tablas Gates tienen formato canonico v12.56.`);
  process.exit(0);
}

console.error(`\nDetectados ${blockers.length} bloqueante(s) + ${warnings.length} warning(s):`);
for (const f of findings) {
  const icon = f.severity === "warning" ? "⚠" : "✗";
  console.error(`  ${icon} [${f.kind}] specs/${f.slug}/traceability.md: ${f.message}`);
}
console.error(`\nFix sugerido:`);
console.error(`  Migracion automatica del template:`);
console.error(`    node scripts/template-upgrade.mjs --root . --apply --migrate-gates`);
console.error(``);
console.error(`  Formato canonico v12.56:`);
console.error(`    ## Gates`);
console.error(`    | Gate | Estado | Aprobador | Fecha | Evidencia |`);
console.error(`    |---|---|---|---|---|`);
console.error(`    | gate-prototype-ready | approved | Maria Garcia (PO) | 2026-05-18 | prototype-validation.md |`);
console.error(`    | gate-spdd-approved | pending | — | — | spdd-frontend.md |`);
console.error(``);
console.error(`  Estados canonicos: approved | pending | rejected | blocked`);

process.exit(blockers.length > 0 && strict ? 1 : 0);

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
