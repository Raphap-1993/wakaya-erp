#!/usr/bin/env node
/**
 * check-prototype-hub.mjs
 *
 * Valida que `prototype/index.html` cumple la estructura estándar de 10
 * secciones definida en `plantillas/transversal/PROTOTYPE_HUB.md`.
 *
 * Uso:
 *   node ci/scripts/check-prototype-hub.mjs
 *   node ci/scripts/check-prototype-hub.mjs --root <repo>
 *   node ci/scripts/check-prototype-hub.mjs --strict   (también bloquea en observaciones)
 *
 * Exit codes:
 *   0 — el hub cumple
 *   1 — bloqueado (falta una sección obligatoria o término prohibido)
 *   2 — observaciones (solo con --strict)
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = Boolean(args.strict);
const hubPath = join(root, "prototype", "index.html");

console.log("═══════════════════════════════════════════════════════");
console.log("  check-prototype-hub.mjs — validador del hub");
console.log(`  Hub: ${hubPath}`);
console.log("═══════════════════════════════════════════════════════");

if (!existsSync(hubPath)) {
  console.error("✗ BLOQUEADO: no existe prototype/index.html");
  console.error("  Genera el hub con: node scripts/ai-framework-agent.mjs generate-prototype-hub");
  process.exit(1);
}

const html = readFileSync(hubPath, "utf8");
const visible = stripCommentsAndScripts(html);

const blockers = [];
const observations = [];

// ── Terminos prohibidos en el hub: criterio mas relajado que prototipos ────
// El hub ES un meta-documento que describe los prototipos, asi que PUEDE
// mostrar referencias tecnicas (`RF-02`, `gate-spdd-approved`, `RN-05`) dentro
// de tablas, invariantes y badges. Lo que NO puede tener es ese tipo de
// referencias como TITULO principal (h1/h2/h3) o como NOMBRE de spec card.
// Los terminos puramente metodologicos siguen siendo bloqueantes en cualquier parte.
const FORBIDDEN_ANY = [
  "Formulario-spec",
  "Actividad de ejemplo",
  "Permiso activo",
  "Ruta interna",
  "Componente:",
  "Spec técnica",
  "Angular futuro:",
  "Rol sin permiso",
];
for (const term of FORBIDDEN_ANY) {
  if (visible.includes(term)) {
    blockers.push(`[B3] Término metodológico prohibido visible: "${term}"`);
  }
}
// RF- y gate-: solo bloquean si aparecen como heading o como spec-title.
const headingsText = (visible.match(/<h[1-3][^>]*>([^<]*)<\/h[1-3]>/gi) || []).join(" ");
const specTitlesText = (visible.match(/<[^>]*class\s*=\s*["']spec-title["'][^>]*>([^<]*)<\/[^>]+>/gi) || []).join(" ");
const exposedAreas = headingsText + " " + specTitlesText;
if (/\bRF-\d+/i.test(exposedAreas)) {
  blockers.push("[B3] Una referencia 'RF-NN' aparece como heading o spec-title — debería ir solo dentro de invariantes/tablas como referencia técnica");
}
if (/\bgate-[a-z0-9-]+/i.test(exposedAreas)) {
  blockers.push("[B3] Un 'gate-xxx' aparece como heading o spec-title — debería ir solo dentro de la tabla de cobertura");
}

// ── 1. Banner SPDD ──────────────────────────────────────────────────────────
if (!/class\s*=\s*["']banner["']/i.test(html) || !/<span[^>]*class\s*=\s*["']banner-tag\s+spdd["']/i.test(html)) {
  blockers.push("[Hub-1] Falta el banner superior con tag SPDD HUB");
} else {
  const bannerTags = (html.match(/class\s*=\s*["']banner-tag\s+\w+["']/gi) || []).length;
  if (bannerTags < 3) {
    observations.push(`[Hub-1] Banner tiene solo ${bannerTags} tags; recomendado ≥4 (spdd, info, warn/ok, date)`);
  }
}

// ── 2. Hero con stats ──────────────────────────────────────────────────────
if (!/<section[^>]*class\s*=\s*["']hero["']/i.test(html)) {
  blockers.push("[Hub-2] Falta sección hero");
} else {
  const stats = (html.match(/class\s*=\s*["']stat["']/g) || []).length;
  if (stats < 4) {
    blockers.push(`[Hub-2] Hero tiene solo ${stats} stats; mínimo 4 (specs, prototipos, actores, flujos/backend)`);
  }
  if (!/<h1[^>]*class\s*=\s*["']hero-title["']/i.test(html)) {
    blockers.push("[Hub-2] Hero no tiene <h1 class='hero-title'>");
  }
}

// ── 3. Journey por actor ────────────────────────────────────────────────────
const journeyRows = (html.match(/class\s*=\s*["']journey-row["']/g) || []).length;
if (journeyRows === 0) {
  observations.push("[Hub-3] No hay journey-rows. Si hay ≥2 actores, agrega una fila por actor.");
}

// ── 4. Spec cards ───────────────────────────────────────────────────────────
const specCards = (html.match(/class\s*=\s*["']spec-card["']/g) || []).length;
const specsDir = join(root, "specs");
let realSpecs = 0;
if (existsSync(specsDir)) {
  realSpecs = readdirSync(specsDir)
    .filter((n) => /^\d+-/.test(n))
    .filter((n) => statSync(join(specsDir, n)).isDirectory()).length;
}
if (specCards === 0 && realSpecs > 0) {
  blockers.push(`[Hub-4] No hay spec-cards pero el repo tiene ${realSpecs} specs en specs/`);
} else if (specCards < realSpecs) {
  blockers.push(`[Hub-4] Hub muestra ${specCards} spec-cards pero el repo tiene ${realSpecs} specs. Regenera con generate-prototype-hub`);
}
// Cada spec card debe tener status pill
const statusPills = (html.match(/class\s*=\s*["']status-pill\s+\w+["']/g) || []).length;
if (specCards > 0 && statusPills < specCards) {
  observations.push(`[Hub-4] ${specCards} spec-cards pero solo ${statusPills} status-pill — cada card debe tener status pill`);
}

// ── 5. Actores ──────────────────────────────────────────────────────────────
const actorCards = (html.match(/class\s*=\s*["']actor-card["']/g) || []).length;
if (actorCards === 0) {
  observations.push("[Hub-5] No hay actor-cards. Si los specs declaran actores, agrega una card por actor.");
}

// ── 6. Tabla de cobertura ───────────────────────────────────────────────────
const covTable = (html.match(/<table\b[^>]*class\s*=\s*["']cov["']/g) || []).length;
if (covTable === 0) {
  blockers.push("[Hub-6] Falta la tabla de cobertura SPDD (clase 'cov')");
} else {
  const thCount = (html.match(/<th\b/gi) || []).length;
  if (thCount < 7) {
    observations.push(`[Hub-6] Tabla con solo ${thCount} columnas; recomendado ≥7 (Spec, Feature, prototipo, ui-test-cases, api-contract, spec-tecnica, spec-tareas, traceability, Estado)`);
  }
  // Zona @auto:start name=coverage
  if (!/<!--\s*@auto:start\s+name=coverage\s*-->/i.test(html)) {
    observations.push("[Hub-6] Tabla de cobertura no tiene marcadores @auto — no es regenerable automáticamente");
  }
}

// ── 8. Quick links docs ─────────────────────────────────────────────────────
const docLinks = (html.match(/class\s*=\s*["']doc-link["']/g) || []).length;
if (docLinks === 0) {
  observations.push("[Hub-8] No hay doc-links. Agrega quick links a `../specs/NNN-feature/`");
}

// ── 9. Footer con stack ─────────────────────────────────────────────────────
if (!/<footer\b/i.test(html)) {
  blockers.push("[Hub-9] Falta <footer> de cierre");
} else {
  const stackTags = (html.match(/class\s*=\s*["']stack-tag["']/g) || []).length;
  if (stackTags < 3) {
    observations.push(`[Hub-9] Footer tiene solo ${stackTags} stack-tags; recomendado ≥3 para visibilidad del stack`);
  }
  if (!/sin\s+backend\s+real/i.test(visible) && !/datos\s+mock/i.test(visible)) {
    observations.push("[Hub-9] Footer no incluye disclaimer 'Sin backend real' / 'Datos mock'");
  }
}

// ── Zonas @auto (regenerables) ──────────────────────────────────────────────
const autoZones = ["journeys", "specs", "actors", "coverage", "doclinks", "stack"];
const missingZones = [];
for (const z of autoZones) {
  const re = new RegExp(`<!--\\s*@auto:start\\s+name=${z}\\s*-->`, "i");
  if (!re.test(html)) missingZones.push(z);
}
if (missingZones.length > 0) {
  observations.push(`[Hub-auto] Faltan marcadores @auto:start name=X para: ${missingZones.join(", ")}. El comando no podrá regenerar esas zonas.`);
}

// ── Salida ──────────────────────────────────────────────────────────────────
console.log("");
console.log(`Spec-cards en hub:    ${specCards}`);
console.log(`Specs reales en repo: ${realSpecs}`);
console.log(`Actor-cards:          ${actorCards}`);
console.log(`Journey-rows:         ${journeyRows}`);
console.log(`Doc-links:            ${docLinks}`);

if (blockers.length === 0 && observations.length === 0) {
  console.log("\n✓ Hub cumple las 10 secciones estándar.");
  process.exit(0);
}
if (blockers.length > 0) {
  console.error("\n✗ BLOQUEANTES:");
  for (const b of blockers) console.error(`  ${b}`);
}
if (observations.length > 0) {
  console.error("\n⚠ OBSERVACIONES:");
  for (const o of observations) console.error(`  ${o}`);
}

if (blockers.length > 0) {
  console.error("\n  Para regenerar: node scripts/ai-framework-agent.mjs generate-prototype-hub");
  process.exit(1);
}
if (strict && observations.length > 0) process.exit(2);
process.exit(0);

// ── Helpers ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--root") out.root = argv[++i];
    else if (argv[i] === "--strict") out.strict = true;
  }
  return out;
}

function stripCommentsAndScripts(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}
