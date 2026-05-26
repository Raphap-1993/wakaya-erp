#!/usr/bin/env node
/**
 * check-openapi-coverage.mjs (v12.51)
 *
 * Valida que cada endpoint declarado en la columna `API` de
 * `specs/<feature>/traceability.md` (o de la matriz raiz) este presente en
 * `contracts/api/openapi.yaml`.
 *
 * Cierra el patron real visto en los 3 casos: features declaran endpoints en
 * sus traceability.md pero el openapi.yaml queda incompleto (opencode: 17 paths
 * en openapi.yaml vs 51 declarados en api-contract.md).
 *
 * Flujo:
 *   1. Lee specs/<feature>/traceability.md y extrae celdas de la columna API.
 *   2. Cada celda puede tener: "METHOD /path", "M1 /p1, M2 /p2", "401/403" (no es endpoint).
 *   3. Lee contracts/api/openapi.yaml, extrae paths + methods.
 *   4. Calcula coverage = declarados_en_traceability INTERSECT presentes_en_openapi.
 *   5. Reporta huecos.
 *
 * Modos:
 *   --strict       exit 1 si falta cualquier endpoint.
 *   --warn         exit 0 con warning (default).
 *   --threshold N  exigir coverage >= N% (default 90).
 *   --root <path>  raiz del proyecto. Default: cwd.
 *
 * Exit codes:
 *   0 - coverage >= threshold.
 *   1 - coverage < threshold (modo strict) o openapi.yaml no existe.
 *   2 - error al parsear archivos.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override
const threshold = Number(args.threshold ?? 90);

const specsRoot = join(root, "specs");
const openapiPath = join(root, "contracts", "api", "openapi.yaml");

if (!existsSync(specsRoot)) {
  console.log(`OK. No existe ${specsRoot} — nada que validar.`);
  process.exit(0);
}

if (!existsSync(openapiPath)) {
  console.error(`contracts/api/openapi.yaml no existe.`);
  console.error(`Si tu proyecto declara endpoints en traceability.md, genera el openapi:`);
  console.error(`  npm run generate:openapi`);
  console.error(`Si tu proyecto no expone API, omite este validador.`);
  process.exit(strict ? 1 : 0);
}

// Paso 1: extraer endpoints declarados en traceability per-feature + raiz.
const declared = new Map(); // "METHOD /path" -> [sources]
const traceabilityFiles = [];
const rootTrace = join(root, "TRACEABILITY_MATRIX.md");
if (existsSync(rootTrace)) traceabilityFiles.push({ path: rootTrace, label: "TRACEABILITY_MATRIX.md" });
for (const entry of readdirSync(specsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^\d{3,}-/.test(entry.name)) continue;
  const tracePath = join(specsRoot, entry.name, "traceability.md");
  if (existsSync(tracePath)) {
    traceabilityFiles.push({ path: tracePath, label: `specs/${entry.name}/traceability.md` });
  }
}

for (const f of traceabilityFiles) {
  const text = readFileSync(f.path, "utf8");
  const apis = extractApiCells(text);
  for (const ep of apis) {
    if (!declared.has(ep)) declared.set(ep, []);
    declared.get(ep).push(f.label);
  }
}

if (declared.size === 0) {
  console.log(`OK. Ninguna feature declara endpoints en traceability.md — nada que validar.`);
  process.exit(0);
}

// Paso 2: leer openapi.yaml y extraer paths + methods presentes.
const openapiText = readFileSync(openapiPath, "utf8");
const present = extractOpenapiOps(openapiText);

if (present.size === 0) {
  console.error(`contracts/api/openapi.yaml existe pero no contiene paths parseables.`);
  console.error(`Corre: npm run generate:openapi`);
  process.exit(strict ? 1 : 0);
}

// Paso 3: calcular coverage.
const missing = [];
const covered = [];
for (const [ep, sources] of declared) {
  // Comparar normalizando: case-insensitive y trimming de path params.
  const normalized = normalizeEndpoint(ep);
  let found = false;
  for (const o of present) {
    if (normalizeEndpoint(o) === normalized) { found = true; break; }
  }
  if (found) covered.push({ ep, sources });
  else missing.push({ ep, sources });
}

const total = declared.size;
const coverage = total === 0 ? 100 : Math.round((covered.length / total) * 100);

console.log(`check-openapi-coverage (v12.51)`);
console.log(`Endpoints declarados en traceability: ${total}`);
console.log(`Endpoints en openapi.yaml:            ${present.size}`);
console.log(`Cubiertos (traceability ∩ openapi):  ${covered.length}`);
console.log(`Coverage:                             ${coverage}% (threshold: ${threshold}%)`);

if (missing.length > 0) {
  console.error(`\nEndpoints declarados en traceability PERO ausentes en openapi.yaml:`);
  for (const m of missing.slice(0, 30)) {
    console.error(`  - ${m.ep}   (declarado en: ${m.sources.join(", ")})`);
  }
  if (missing.length > 30) {
    console.error(`  ... y ${missing.length - 30} mas.`);
  }
  console.error(`\nFix sugerido:`);
  console.error(`  1. Asegura que cada api-contract.md de la feature tenga el bloque OpenAPI YAML embebido (ver plantillas/fase-4-sdd/api-contract.md).`);
  console.error(`  2. Regenera el openapi: npm run generate:openapi`);
  console.error(`  3. Vuelve a correr este validador.`);
}

if (coverage < threshold) {
  console.error(`\nCoverage ${coverage}% < threshold ${threshold}%.`);
  process.exit(strict ? 1 : 0);
}

console.log(`\nOK. Coverage ${coverage}% >= ${threshold}%.`);
process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
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

/**
 * Extrae endpoints de la columna API de una matriz traceability.md.
 * Acepta multiples formas:
 *   - "GET /api/reservations"
 *   - "POST /api/x, PATCH /api/x/{id}"
 *   - "401/403" -> ignorado (no es endpoint)
 *   - "-" -> ignorado
 */
function extractApiCells(text) {
  const result = new Set();
  const lines = text.split(/\r?\n/);
  let inMatrix = false;
  let apiColIndex = -1;
  for (const line of lines) {
    if (!inMatrix && /\|\s*RF\s*\|/i.test(line) && /\|\s*API\s*\|/i.test(line)) {
      // Encontrar el indice de la columna API.
      const cells = line.split("|").map((c) => c.trim());
      apiColIndex = cells.findIndex((c) => /^API$/i.test(c));
      inMatrix = true;
      continue;
    }
    if (inMatrix && /^\s*\|[\s-]+\|/.test(line)) continue; // separador
    if (inMatrix && !line.trim().startsWith("|")) { inMatrix = false; apiColIndex = -1; continue; }
    if (inMatrix && apiColIndex > 0) {
      const cells = line.split("|").map((c) => c.trim());
      const apiCell = cells[apiColIndex] || "";
      if (!apiCell || apiCell === "-" || apiCell === "n/a") continue;
      // Multiples endpoints en una celda: separados por coma o "+"
      const parts = apiCell.split(/[,;+]/).map((s) => s.trim());
      for (const p of parts) {
        const ep = normalizeEndpoint(p);
        // Filtrar lo que NO es endpoint (codigos http, refs simples, etc.).
        if (/^\d{3}(\/\d{3})*$/.test(p)) continue; // 401/403
        if (!/(get|post|put|patch|delete|head|options)\s+\//i.test(p)) continue;
        if (ep) result.add(ep);
      }
    }
  }
  return result;
}

/**
 * Extrae endpoints presentes en openapi.yaml.
 * Reconoce el formato canonico:
 *   paths:
 *     /api/x:
 *       get:
 *         ...
 */
function extractOpenapiOps(yaml) {
  const result = new Set();
  const lines = yaml.split(/\r?\n/);
  let inPaths = false;
  let currentPath = null;
  let pathIndent = -1;
  for (const line of lines) {
    if (/^paths\s*:/.test(line)) { inPaths = true; pathIndent = 0; continue; }
    if (!inPaths) continue;
    // top-level key fuera de paths => salimos
    if (/^[a-zA-Z]/.test(line) && !line.startsWith("paths:")) { inPaths = false; continue; }
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    // Linea de path: "  /api/x:"
    if (indent === 2 && line.trim().startsWith("/")) {
      currentPath = line.trim().replace(/:\s*$/, "");
      continue;
    }
    // Linea de method: "    get:"
    if (currentPath && indent === 4) {
      const m = line.trim().match(/^(get|post|put|patch|delete|head|options)\s*:\s*$/i);
      if (m) {
        result.add(normalizeEndpoint(`${m[1].toUpperCase()} ${currentPath}`));
      }
    }
  }
  return result;
}

function normalizeEndpoint(s) {
  const str = String(s || "").trim();
  const m = str.match(/^(get|post|put|patch|delete|head|options)\s+(\/\S+)/i);
  if (!m) return null;
  // Normalizar path params: /api/x/{id} y /api/x/:id se tratan igual.
  const path = m[2].replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "{$1}");
  return `${m[1].toUpperCase()} ${path}`;
}
