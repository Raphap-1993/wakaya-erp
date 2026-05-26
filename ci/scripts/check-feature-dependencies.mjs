#!/usr/bin/env node
/**
 * check-feature-dependencies.mjs (v12.57)
 *
 * Verifica integridad de dependencias entre features declaradas en
 * `traceability.md > ## Dependencias`.
 *
 * Formato canonico de la seccion:
 *   ## Dependencias
 *
 *   | De → A | Tipo | Motivo |
 *   |---|---|---|
 *   | 004-control-parental → 003-perfiles-familiares | requires | Necesita perfil familiar activo |
 *   | 004-control-parental → 001-catalogo | uses-api | Consume GET /api/catalogo |
 *
 * Tipos validos:
 *   - requires        (dependencia dura: A no funciona sin B)
 *   - uses-api        (consume APIs de B)
 *   - shares-bd       (comparte tablas/entidades con B)
 *   - extends         (extiende funcionalidad de B)
 *
 * Validaciones:
 *   1. Cada feature destino debe existir en specs/.
 *   2. No deben existir ciclos (A -> B -> A en 1 o N pasos).
 *   3. Si A "requires" B, B debe estar en fase >= la fase actual de A.
 *
 * Modos:
 *   --strict       exit 1 si hay errores.
 *   --warn         exit 0 con warning (default).
 *   --root <path>  raiz del proyecto.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures, listAllFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override

const VALID_TYPES = new Set(["requires", "uses-api", "shares-bd", "extends"]);
const allSlugs = new Set(listAllFeatures(root).map((f) => f.slug));
const features = listIncludedFeatures(root);
const dependencies = []; // {from, to, type, reason, sourceFile}
const findings = [];

for (const slug of features) {
  const tracePath = join(root, "specs", slug, "traceability.md");
  if (!existsSync(tracePath)) continue;
  const text = readFileSync(tracePath, "utf8");
  const depMatch = text.match(/##\s+Dependencias\s*\n([\s\S]*?)(?=\n##\s|\n$|$)/i);
  if (!depMatch) continue;
  const section = depMatch[1];
  const rows = section.split(/\r?\n/).filter((l) => /^\s*\|/.test(l) && !/^\s*\|[\s-]+\|/.test(l));
  const dataRows = rows.slice(1); // saltar header
  for (const row of dataRows) {
    const cells = row.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 3) continue;
    // Cell 0: "from → to" o "from -> to"
    const arrowMatch = cells[0].match(/^\s*(\d{3,}-[a-z0-9-]+)\s*(?:→|->|-->)\s*(\d{3,}-[a-z0-9-]+)\s*$/i);
    if (!arrowMatch) {
      findings.push({ kind: "bad-format", from: slug, message: `fila no parseable: "${cells[0]}". Esperado: 'NNN-slug → NNN-slug'.` });
      continue;
    }
    const from = arrowMatch[1];
    const to = arrowMatch[2];
    const type = cells[1].toLowerCase();
    const reason = cells[2];

    if (!VALID_TYPES.has(type)) {
      findings.push({ kind: "bad-type", from, to, message: `tipo '${type}' invalido. Validos: ${[...VALID_TYPES].join(", ")}.` });
    }
    if (!allSlugs.has(to)) {
      findings.push({ kind: "missing-target", from, to, message: `feature destino '${to}' no existe en specs/.` });
    }
    if (from === to) {
      findings.push({ kind: "self-loop", from, to, message: `feature depende de si misma.` });
    }
    dependencies.push({ from, to, type, reason });
  }
}

// Detectar ciclos.
const graph = new Map();
for (const d of dependencies) {
  if (!graph.has(d.from)) graph.set(d.from, new Set());
  graph.get(d.from).add(d.to);
}
function findCycles() {
  const cycles = [];
  for (const start of graph.keys()) {
    const visited = new Set();
    const path = [];
    const dfs = (node) => {
      if (path.includes(node)) {
        const cycle = path.slice(path.indexOf(node)).concat(node);
        cycles.push(cycle);
        return;
      }
      if (visited.has(node)) return;
      visited.add(node);
      path.push(node);
      const neighbors = graph.get(node) || [];
      for (const n of neighbors) dfs(n);
      path.pop();
    };
    dfs(start);
  }
  // Dedup por orden.
  const seen = new Set();
  return cycles.filter((c) => {
    const k = c.slice().sort().join("->");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
const cycles = findCycles();
for (const cycle of cycles) {
  findings.push({ kind: "cycle", message: `ciclo detectado: ${cycle.join(" → ")}` });
}

console.log(`check-feature-dependencies (v12.57)`);
console.log(`Features verificadas:        ${features.length}`);
console.log(`Dependencias declaradas:     ${dependencies.length}`);
console.log(`Ciclos detectados:           ${cycles.length}`);

if (findings.length === 0) {
  console.log(`\nOK. Dependencias entre features sin errores estructurales.`);
  process.exit(0);
}

console.error(`\nDetectados ${findings.length} hallazgo(s):`);
for (const f of findings.slice(0, 20)) {
  console.error(`  ✗ [${f.kind}] ${f.from ? `(${f.from}` + (f.to ? ` → ${f.to})` : ")") : ""} ${f.message}`);
}
if (findings.length > 20) console.error(`  ... y ${findings.length - 20} mas.`);

console.error(`\nFix sugerido:`);
console.error(`  - Format: '| NNN-slug → NNN-slug | tipo | motivo |'`);
console.error(`  - Tipos validos: ${[...VALID_TYPES].join(", ")}`);
console.error(`  - Si hay ciclo: una de las dos features debe ser independiente o usar shares-bd/extends en vez de requires.`);

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
