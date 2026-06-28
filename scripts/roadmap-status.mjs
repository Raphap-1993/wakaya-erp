#!/usr/bin/env node
/**
 * roadmap-status.mjs (v12.62)
 *
 * v12.62: incluye el semaforo de estado visual de prototipos (5 peldaños) y la
 * regla de avance fase 2 → 3 (requiere todos los prototipos human-approved).
 *
 * Reporta el estado actual del proyecto contra el roadmap metodologico de 9 fases
 * (definido en `docs/transversal/90.36-roadmap-metodologico.md`).
 *
 * Para cada fase, evalua:
 *   - Existencia de deliverables canonicos.
 *   - Cantidad de features que ya pasaron por esa fase.
 *   - Gates registrados en la BD del agente.
 *   - Bloqueadores activos (check:* que fallan).
 *
 * Salida amigable para humanos por default; --json para integraciones.
 *
 * Uso:
 *   npm run roadmap:status                # tabla legible
 *   node scripts/roadmap-status.mjs --json  # JSON para CI / panel
 *   node scripts/roadmap-status.mjs --feature 003  # focus en una feature
 *
 * Exit codes:
 *   0 - reporte generado.
 *   1 - no se encuentra proyecto valido.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "../ci/scripts/_lib/feature-filter.mjs";
import { loadIgnoreConfig, shouldIgnorePath } from "../ci/scripts/_lib/ignore-paths.mjs";
import { summarizePrototypeStates } from "../ci/scripts/_lib/prototype-state.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const asJson = !!args.json;
const focusFeature = args.feature || null;

if (!existsSync(join(root, "package.json"))) {
  console.error(`Error: ${root} no parece un proyecto valido (sin package.json).`);
  process.exit(1);
}

const phases = analyzeAllPhases();
const features = listFeatures();
const prototypeStates = summarizePrototypeStates(root); // v12.62: semaforo de prototipos
const blockers = detectBlockers();
const nextAction = recommendNextAction(phases, features, blockers);

if (asJson) {
  console.log(JSON.stringify({
    project: getProjectName(),
    templateVersion: getTemplateVersion(),
    phases,
    features: features.map((f) => ({ slug: f.slug, phase: f.phase, gates: f.gates, missing: f.missing })),
    prototypeStates,
    blockers,
    nextAction,
  }, null, 2));
  process.exit(0);
}

// Tabla legible.
console.log(`\nROADMAP STATUS (v12.62)`);
console.log(`========================`);
console.log(`Proyecto:           ${getProjectName()}`);
console.log(`Version template:   ${getTemplateVersion()}`);
console.log(`Features detectadas: ${features.length} bajo specs/`);
console.log(``);
console.log(`Estado por fase:`);
for (const p of phases) {
  const icon = p.status === "complete" ? "✓" : p.status === "partial" ? "⚠" : "⊘";
  const label = p.status === "complete" ? "COMPLETA" : p.status === "partial" ? "PARCIAL" : "NO INICIADA";
  console.log(`  Fase ${p.id} (${p.name.padEnd(20)})  ${icon} ${label.padEnd(12)}  (${p.detail})`);
}
console.log(``);

// v12.62: semaforo de estado visual de prototipos (5 peldaños).
if (prototypeStates.withPrototype > 0) {
  console.log(`Estado visual de prototipos (semaforo):`);
  for (const f of prototypeStates.features) {
    if (f.state === "none") continue;
    const dot = f.light === "green" ? "🟢" : f.light === "amber" ? "🟡" : "🔴";
    console.log(`  ${dot} ${f.slug.padEnd(40)} ${f.state.padEnd(22)} ${f.blockedBy ? "→ " + f.blockedBy : f.reviewer ? "→ " + f.reviewer : ""}`);
  }
  const c = prototypeStates.counts;
  console.log(`  Resumen: exists ${c.exists} · auto-quality ${c["auto-quality"]} · visible-product ${c["visible-product"]} · human-review-pending ${c["human-review-pending"]} · human-approved ${c["human-approved"]}`);
  // v12.104: el mensaje NO debe sugerir que TODO el proyecto puede avanzar. La regla
  // mira solo prototipos EXISTENTES aprobados; las features SIN prototipo (visuales
  // incompletas) siguen bloqueadas. Texto preciso + lista de pendientes.
  const noProtoSlugs = prototypeStates.features.filter((f) => f.state === "none").map((f) => f.slug);
  if (!prototypeStates.phase2to3Ready) {
    console.log(`  ⚠ Avance fase 2 → 3 BLOQUEADO: ${prototypeStates.phase2to3Blockers.length} prototipo(s) sin revision visual humana aprobada.`);
  } else {
    console.log(`  ✓ Avance fase 2 → 3 habilitado SOLO para ${prototypeStates.withPrototype} feature${prototypeStates.withPrototype === 1 ? "" : "s"} con prototipo human-approved.`);
  }
  if (noProtoSlugs.length > 0) {
    console.log(`  ⚠ ${noProtoSlugs.length} feature(s) SIN prototipo: ${noProtoSlugs.join(", ")}.`);
    console.log(`     Si son visuales, NO avanzan a fase 3. Verifica: npm run check:prototype-coverage`);
    console.log(`     (o marca 'prototype: not-required' en spec-funcional.md si NO son visuales).`);
  }
  console.log(``);
}

if (blockers.length > 0) {
  console.log(`Bloqueadores activos:`);
  for (const b of blockers) console.log(`  ✗ ${b}`);
  console.log(``);
}

console.log(`Siguiente accion recomendada:`);
for (const a of nextAction) console.log(`  ${a}`);
console.log(``);

if (focusFeature) {
  const f = features.find((x) => x.slug.startsWith(focusFeature));
  if (f) {
    console.log(`Feature focus: ${f.slug}`);
    console.log(`  Fase actual:    ${f.phase}`);
    console.log(`  Gates:          ${f.gates.length ? f.gates.join(", ") : "(ninguno)"}`);
    console.log(`  Faltante:       ${f.missing.length ? f.missing.join(", ") : "(nada)"}`);
  }
}

process.exit(0);

// ─────────────────────────────────────────────────────────────────────────
function analyzeAllPhases() {
  const phases = [
    analyzePhase0(),
    analyzePhase1(),
    analyzePhase2(),
    analyzePhase3(),
    analyzePhase4(),
    analyzePhase5(),
    analyzePhase6(),
    analyzePhase7(),
    analyzePhase8(),
  ];
  return phases;
}

function analyzePhase0() {
  const required = [
    "docs/fase-0-iniciacion/00.01-vision-proyecto.md",
    "docs/fase-0-iniciacion/00.02-roadmap.md",
    "docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md",
    "docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md",
  ];
  const present = required.filter((r) => existsSync(join(root, r))).length;
  const status = present === required.length ? "complete" : present > 0 ? "partial" : "not-started";
  return { id: 0, name: "Iniciacion", status, detail: `${present}/${required.length} docs canonicos` };
}

function analyzePhase1() {
  const checks = [
    existsSync(join(root, "docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md")),
    existsSync(join(root, "TRACEABILITY_MATRIX.md")),
  ];
  const present = checks.filter(Boolean).length;
  const status = present === checks.length ? "complete" : present > 0 ? "partial" : "not-started";
  return { id: 1, name: "Requerimientos", status, detail: `analisis + matriz: ${present}/${checks.length}` };
}

function analyzePhase2() {
  const features = listFeatures();
  if (features.length === 0) return { id: 2, name: "UX/UI", status: "not-started", detail: "0 features bajo specs/" };
  const withPrototype = features.filter((f) => f.gates.includes("gate-prototype-ready") || existsSync(join(root, "specs", f.slug, "prototype-html5", "index.html"))).length;
  const withSpddApproved = features.filter((f) => f.gates.includes("gate-spdd-approved")).length;
  const total = features.length;
  // v12.62: la fase 2 NO se completa (no avanza a fase 3) hasta que todos los
  // prototipos esten human-approved (revision visual humana real).
  const ps = summarizePrototypeStates(root);
  const humanApproved = ps.counts["human-approved"];
  const advanceReady = ps.phase2to3Ready;
  let status;
  if (withSpddApproved === total && advanceReady) status = "complete";
  else if (withPrototype > 0) status = "partial";
  else status = "not-started";
  // v12.104: el avance 2→3 solo aplica a features CON prototipo human-approved. Si hay
  // features sin prototipo (visuales incompletas), el "habilitado" se acota para no
  // sugerir que TODO el proyecto avanza.
  const missingProto = ps.total - ps.withPrototype;
  let advanceNote = "";
  if (ps.withPrototype > 0) {
    if (!advanceReady) advanceNote = `; avance 2→3 BLOQUEADO (${ps.phase2to3Blockers.length} sin revision humana)`;
    else if (missingProto > 0) advanceNote = `; avance 2→3 habilitado solo para ${ps.withPrototype} con prototipo (${missingProto} sin prototipo aun)`;
    else advanceNote = "; avance 2→3 habilitado";
  }
  return { id: 2, name: "UX/UI", status, detail: `${withPrototype}/${total} con prototipo, ${withSpddApproved}/${total} SPDD aprobado, ${humanApproved}/${ps.withPrototype || 0} human-approved${advanceNote}` };
}

function analyzePhase3() {
  const checks = [
    existsSync(join(root, "docs/fase-3-arquitectura/03.00-arquitectura.md")),
    existsSync(join(root, "docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md")),
    existsSync(join(root, "likec4")) || existsSync(join(root, "diagramas")),
    countAdrs() > 0,
  ];
  const present = checks.filter(Boolean).length;
  const status = present === checks.length ? "complete" : present > 1 ? "partial" : "not-started";
  return { id: 3, name: "Arquitectura", status, detail: `${present}/4 entregables + ${countAdrs()} ADRs` };
}

function analyzePhase4() {
  const features = listFeatures();
  if (features.length === 0) return { id: 4, name: "SDD", status: "not-started", detail: "0 features bajo specs/" };
  const withSpecTecnica = features.filter((f) => {
    const p = join(root, "specs", f.slug, "spec-tecnica.md");
    if (!existsSync(p)) return false;
    const text = readFileSync(p, "utf8");
    return /Tabla\s*`[a-z_]+`/i.test(text);
  }).length;
  const total = features.length;
  const status = withSpecTecnica === total ? "complete" : withSpecTecnica > 0 ? "partial" : "not-started";
  return { id: 4, name: "SDD", status, detail: `${withSpecTecnica}/${total} features con spec-tecnica + modelo BD` };
}

function analyzePhase5() {
  const srcDirs = ["src", "backend", "frontend"];
  let codeFiles = 0;
  let withTrace = 0;
  for (const d of srcDirs) {
    const abs = join(root, d);
    if (!existsSync(abs)) continue;
    const files = walkDir(abs).filter((f) => /\.(ts|tsx|js|jsx|java|kt|py|go|rs|cs)$/.test(f));
    codeFiles += files.length;
    for (const f of files) {
      try {
        const t = readFileSync(f, "utf8");
        if (/@(trace|covers|implements)\s+(RF|RNF|HU)-\d+/i.test(t)) withTrace += 1;
      } catch {}
    }
  }
  const status = codeFiles === 0 ? "not-started" : withTrace === codeFiles ? "complete" : "partial";
  return { id: 5, name: "Construccion", status, detail: `${codeFiles} archivos codigo, ${withTrace} con @trace` };
}

function analyzePhase6() {
  const testDirs = ["tests", "qa/automated", "src"];
  let testFiles = 0;
  for (const d of testDirs) {
    const abs = join(root, d);
    if (!existsSync(abs)) continue;
    testFiles += walkDir(abs).filter((f) => /\.(test|spec)\.(ts|tsx|js|jsx|java|kt|py)$/.test(f)).length;
  }
  const lcov = existsSync(join(root, "qa/coverage/lcov.info")) || existsSync(join(root, "coverage/lcov.info"));
  const status = testFiles === 0 ? "not-started" : lcov ? "complete" : "partial";
  return { id: 6, name: "QA", status, detail: `${testFiles} archivos de test, lcov.info: ${lcov ? "si" : "no"}` };
}

function analyzePhase7() {
  // v12.57: Fase 7 estricta. Solo "complete" si:
  //   1. Existe al menos una release note CON vinculacion a RF/HU/feature.
  //   2. Existe al menos un gate-deploy-ready approved (en alguna feature).
  let releaseNotesValid = 0;
  let releaseNotesTotal = 0;
  for (const dir of ["releases", "ops/release-notes"]) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    let files;
    try { files = readdirSync(abs).filter((f) => /\.md$/.test(f) && !/^readme/i.test(f)); } catch { continue; }
    releaseNotesTotal += files.length;
    for (const f of files) {
      try {
        const text = readFileSync(join(abs, f), "utf8");
        if (/^---\s*\n[\s\S]*?\bkind\s*:\s*(bootstrap|scaffolding|template-only)\b/m.test(text)) continue;
        if (/\b(RF|RNF|HU)-\d+/.test(text) || /specs\/\d{3,}-/.test(text)) releaseNotesValid += 1;
      } catch { /* skip */ }
    }
  }
  // Detectar gate-deploy-ready approved.
  const deployApproved = countApprovedGates("gate-deploy-ready");
  if (releaseNotesValid > 0 && deployApproved > 0) {
    return { id: 7, name: "Despliegue", status: "complete", detail: `${releaseNotesValid}/${releaseNotesTotal} release notes vinculadas + ${deployApproved} feature(s) con gate-deploy-ready approved` };
  }
  if (releaseNotesValid > 0 || deployApproved > 0) {
    return { id: 7, name: "Despliegue", status: "partial", detail: `${releaseNotesValid}/${releaseNotesTotal} release notes vinculadas, ${deployApproved} gates approved (necesita ambos)` };
  }
  return { id: 7, name: "Despliegue", status: "not-started", detail: `0 release notes vinculadas a RF/HU` };
}

function analyzePhase8() {
  // v12.57: Fase 8 estricta. Solo "complete" si:
  //   1. Cada runbook esta vinculado a una feature real (nombre o frontmatter).
  //   2. Cada runbook menciona RF/HU.
  //   3. Cada runbook tiene SLO numerico.
  //   4. Hay al menos 1 feature con gate-operations-ready approved.
  const runbookDir = join(root, "ops/runbooks");
  if (!existsSync(runbookDir)) return { id: 8, name: "Operacion", status: "not-started", detail: "sin ops/runbooks/" };
  let runbooks;
  try { runbooks = readdirSync(runbookDir).filter((f) => /\.md$/.test(f) && !/^readme/i.test(f)); } catch { runbooks = []; }
  if (runbooks.length === 0) return { id: 8, name: "Operacion", status: "not-started", detail: "ops/runbooks/ vacio" };
  let withSlo = 0;
  let withRf = 0;
  let withBinding = 0;
  // Obtener slugs reales para verificar binding.
  const allFeatureSlugs = new Set();
  const specsRoot = join(root, "specs");
  if (existsSync(specsRoot)) {
    try {
      for (const e of readdirSync(specsRoot, { withFileTypes: true })) {
        if (e.isDirectory() && /^\d{3,}-/.test(e.name)) allFeatureSlugs.add(e.name);
      }
    } catch { /* skip */ }
  }
  for (const fname of runbooks) {
    try {
      const t = readFileSync(join(runbookDir, fname), "utf8");
      // Frontmatter transversal opt-out.
      const isTransversal = /^---\s*\n[\s\S]*?\bkind\s*:\s*(transversal|cross-cutting)\b/m.test(t);
      const slugFromName = fname.replace(/(-runbook)?\.md$/, "");
      const hasBinding = isTransversal || allFeatureSlugs.has(slugFromName);
      const hasRf = /\b(RF|RNF|HU)-\d+/.test(t);
      const hasSlo = /(p9[59]|latenc|disponib|uptime|throughput)[^\n]*?(?:<=?|>=?|=)\s*\d+/i.test(t);
      if (hasBinding) withBinding += 1;
      if (hasRf) withRf += 1;
      if (hasSlo) withSlo += 1;
    } catch {}
  }
  const opsApproved = countApprovedGates("gate-operations-ready");
  const allBound = withBinding === runbooks.length;
  const allRf = withRf === runbooks.length;
  const allSlo = withSlo === runbooks.length;
  if (allBound && allRf && allSlo && opsApproved > 0) {
    return { id: 8, name: "Operacion", status: "complete", detail: `${runbooks.length} runbooks vinculados + RF + SLO + ${opsApproved} gate-operations-ready approved` };
  }
  if (withBinding > 0 || withRf > 0 || withSlo > 0) {
    return { id: 8, name: "Operacion", status: "partial", detail: `${runbooks.length} runbooks: ${withBinding} vinculados, ${withRf} con RF, ${withSlo} con SLO, ${opsApproved} gates approved` };
  }
  return { id: 8, name: "Operacion", status: "not-started", detail: `${runbooks.length} runbooks sin vinculacion completa` };
}

/**
 * v12.57: cuenta features que tienen un gate especifico approved.
 * Soporta formato canonico v12.56 (5 cols) y legacy (3 cols).
 */
function countApprovedGates(gateName) {
  const specsRoot = join(root, "specs");
  if (!existsSync(specsRoot)) return 0;
  let count = 0;
  try {
    for (const e of readdirSync(specsRoot, { withFileTypes: true })) {
      if (!e.isDirectory() || !/^\d{3,}-/.test(e.name)) continue;
      const p = join(specsRoot, e.name, "traceability.md");
      if (!existsSync(p)) continue;
      const text = readFileSync(p, "utf8");
      // Buscar fila con gateName + status approved (canonico) o "Aprobado" (legacy).
      const re = new RegExp(`\\|\\s*${gateName}\\s*\\|\\s*(approved|aprobado|completo|validado)\\b`, "i");
      if (re.test(text)) count += 1;
    }
  } catch { /* skip */ }
  return count;
}

function listFeatures() {
  const specsRoot = join(root, "specs");
  if (!existsSync(specsRoot)) return [];
  // v12.56: usar feature-filter._lib que excluye 000-* y frontmatter `roadmap: ignore`.
  const includedSlugs = listIncludedFeatures(root);
  const features = [];
  for (const slug of includedSlugs) {
    const tracePath = join(specsRoot, slug, "traceability.md");
    const gates = [];
    const missing = [];
    if (existsSync(tracePath)) {
      const text = readFileSync(tracePath, "utf8");
      const gateMatches = text.match(/gate-[a-z0-9-]+/g) || [];
      for (const g of new Set(gateMatches)) gates.push(g);
    }
    const REQUIRED = ["spec-funcional.md", "spec-tecnica.md", "traceability.md", "prototype.md", "prototype-validation.md", "product-design.md", "spdd-frontend.md", "api-contract.md", "ui-test-cases.md"];
    for (const r of REQUIRED) {
      if (!existsSync(join(specsRoot, slug, r))) missing.push(r);
    }
    // Inferir fase actual.
    let phase = 2;
    if (gates.includes("gate-sdd-approved")) phase = 4;
    if (gates.includes("gate-build-ready")) phase = 5;
    if (gates.includes("gate-qa-passed")) phase = 6;
    if (gates.includes("gate-deploy-ready")) phase = 7;
    if (gates.includes("gate-operations-ready")) phase = 8;
    features.push({ slug, phase, gates, missing });
  }
  return features;
}

function detectBlockers() {
  const blockers = [];
  const features = listFeatures();
  for (const f of features) {
    if (f.missing.length > 0) blockers.push(`${f.slug}: faltan ${f.missing.length} archivo(s) canonico(s)`);
  }
  // Detectar package.json desactualizado.
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const scripts = pkg.scripts || {};
    if (!scripts["check:prototype-cross-links"]) blockers.push(`package.json: faltan scripts de v12.52+. Corre 'node scripts/template-upgrade.mjs' (si lo tienes) o pidelo al template canonico.`);
  } catch {}
  return blockers;
}

function recommendNextAction(phases, features, blockers) {
  const actions = [];
  // Si hay blockers de archivos canonicos, eso primero.
  if (blockers.some((b) => b.includes("faltan"))) {
    actions.push("1. Resolver features con archivos canonicos faltantes (corre 'npm run scaffold:feature' si una feature aun no esta scaffoldeada).");
  }
  // Si fase 2 esta partial, completarla.
  const phase2 = phases.find((p) => p.id === 2);
  if (phase2 && phase2.status === "partial") {
    actions.push(`${actions.length + 1}. Completar fase 2 (UX/UI): ${phase2.detail}.`);
  }
  // Si phase 5 esta partial, sugerir harvest-trace.
  const phase5 = phases.find((p) => p.id === 5);
  if (phase5 && phase5.status === "partial") {
    actions.push(`${actions.length + 1}. Anotar @trace RF-XX en codigo faltante + 'npm run memory:harvest-trace'.`);
  }
  // Default.
  if (actions.length === 0) {
    actions.push("1. npm run memory:sync");
    actions.push("2. npm run check:project");
  }
  return actions;
}

function countAdrs() {
  const dir = join(root, "docs/fase-3-arquitectura/adr");
  if (!existsSync(dir)) return 0;
  try { return readdirSync(dir).filter((f) => /^ADR-/.test(f)).length; } catch { return 0; }
}

function getProjectName() {
  try { return JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name || "(sin nombre)"; } catch { return "(error)"; }
}

function getTemplateVersion() {
  try {
    const v = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
    return v ? `v${v}` : "(sin version)";
  } catch { return "(error)"; }
}

function walkDir(dir, depth = 0) {
  if (depth > 8) return [];
  if (!existsSync(dir)) return [];
  // v12.56: usar ignore-paths._lib para excluir target/, bin/main/, *.class, etc.
  const ignoreCfg = loadIgnoreConfig(root);
  const out = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  for (const e of entries) {
    const abs = join(dir, e.name);
    const rel = abs.substring(root.length + 1).replace(/\\/g, "/");
    if (shouldIgnorePath(rel, ignoreCfg)) continue;
    if (e.isDirectory()) out.push(...walkDir(abs, depth + 1));
    else out.push(abs);
  }
  return out;
}

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
