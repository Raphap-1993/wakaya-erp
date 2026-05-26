/**
 * _lib/doc-autozones.mjs (v12.67)
 *
 * Estado vivo en docs de fase: rellena zonas <!-- auto:start name=X --> ... <!-- auto:end -->
 * en los docs deliverables (00.02-roadmap, 00.03-estimacion, 01.01-matriz-huecos, ...)
 * a partir del estado del roadmap (roadmap-status --json) + la BD/filesystem.
 *
 * Generaliza lo que regenerateAiContext hace solo para AI_CONTEXT.md: aqui es
 * multi-archivo y lo invoca `roadmap:sync` (que ya tiene el status). Asi cada doc
 * de fase deja de ser estatico y dice DONDE ESTAS.
 *
 * Lo consume:
 *   - scripts/roadmap-sync.mjs (rellena las zonas tras calcular el status)
 *
 * Bloque C (fases 4-8) agrega mas builders aqui y mas entradas a PHASE_DOC_ZONES.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listIncludedFeatures } from "./feature-filter.mjs";
import { parseSpecRequirements } from "./prototype-contract.mjs";
import { evaluateBaseline } from "./architecture-baseline.mjs";
import { getPhaseContract } from "./phase-contracts.mjs";

/** Reescribe las zonas auto:start conocidas de un archivo con el contenido dado. */
export function rewriteAutoZones(filePath, contentByName) {
  if (!existsSync(filePath)) return { updated: false, reason: "archivo no existe" };
  const original = readFileSync(filePath, "utf8");
  const re = /(<!--\s*@?auto:start\s+name=([a-zA-Z][a-zA-Z0-9_-]*)\s*-->)([\s\S]*?)(<!--\s*@?auto:end\s*-->)/g;
  let changed = false;
  const next = original.replace(re, (full, start, name, _body, end) => {
    if (!(name in contentByName)) return full;
    changed = true;
    return `${start}\n${contentByName[name]}\n${end}`;
  });
  if (changed) { writeFileSync(filePath, next, "utf8"); return { updated: true }; }
  return { updated: false, reason: "sin zonas conocidas" };
}

function stamp() {
  return `\n_Generado por \`npm run roadmap:sync\` — ${new Date().toISOString().slice(0, 16).replace("T", " ")}._`;
}

function statusIcon(s) {
  return s === "complete" ? "✓" : s === "partial" ? "⚠" : "⊘";
}

/** 00.02-roadmap.md > phase-progress: snapshot de las 9 fases. */
export function buildPhaseProgress(status) {
  const phases = status.phases || [];
  const lines = [
    `| Fase | Nombre | Estado | Detalle |`,
    `|:-:|---|:-:|---|`,
  ];
  for (const p of phases) {
    lines.push(`| ${p.id} | ${p.name} | ${statusIcon(p.status)} ${p.status} | ${String(p.detail || "").replace(/\|/g, "/")} |`);
  }
  lines.push(stamp());
  return lines.join("\n");
}

/** 00.03-estimacion-tiempo-costo.md > avance-real: plan vs real. */
export function buildAvanceReal(status) {
  const features = status.features || [];
  const phases = status.phases || [];
  const total = features.length;
  const sinFaltantes = features.filter((f) => !(f.missing && f.missing.length > 0)).length;
  const gatesApproved = features.reduce((n, f) => n + Object.values(f.gates || {}).filter((g) => g === "approved").length, 0);
  const fasesCompletas = phases.filter((p) => p.status === "complete").length;
  const ps = status.prototypeStates || null;
  const lines = [
    `> Avance REAL (para comparar contra la estimacion declarada arriba).`,
    ``,
    `| Metrica | Valor |`,
    `|---|---:|`,
    `| Features bajo specs/ | ${total} |`,
    `| Features sin archivos canonicos faltantes | ${sinFaltantes}/${total} |`,
    `| Gates approved (todas las features) | ${gatesApproved} |`,
    `| Fases completas | ${fasesCompletas}/${phases.length || 9} |`,
  ];
  if (ps) {
    lines.push(`| Prototipos human-approved | ${ps.counts ? ps.counts["human-approved"] : 0}/${ps.withPrototype || 0} |`);
  }
  lines.push(stamp());
  return lines.join("\n");
}

/** 01.01-matriz-huecos-fase-1.md > cobertura-rf: RF cubierto / en progreso / hueco. */
export function buildCoberturaRf(root, status) {
  // RFs declarados en TRACEABILITY_MATRIX.md raiz.
  const matrixPath = join(root, "TRACEABILITY_MATRIX.md");
  const matrixText = existsSync(matrixPath) ? readFileSync(matrixPath, "utf8") : "";
  const matrixRfs = [...new Set((matrixText.match(/\b(?:RF|RNF|HU)-\d+/gi) || []).map((s) => s.toUpperCase()))];
  // RF -> features que lo representan (segun spec-funcional.md de cada feature).
  const phaseBySlug = {};
  for (const f of (status.features || [])) phaseBySlug[f.slug] = f.phase;
  const rfToFeatures = {};
  for (const slug of listIncludedFeatures(root)) {
    const { rfs } = parseSpecRequirements(root, slug);
    for (const rf of rfs) {
      if (!rfToFeatures[rf]) rfToFeatures[rf] = [];
      rfToFeatures[rf].push(slug);
    }
  }
  const allRfs = [...new Set([...matrixRfs, ...Object.keys(rfToFeatures)])].sort();
  const lines = [
    `| Requisito | Feature(s) | Estado |`,
    `|---|---|---|`,
  ];
  for (const rf of allRfs) {
    const feats = rfToFeatures[rf] || [];
    let estado;
    if (feats.length === 0) estado = "✗ hueco (sin feature)";
    else {
      const maxPhase = Math.max(...feats.map((s) => phaseBySlug[s] || 2));
      estado = maxPhase >= 4 ? "✓ cubierto (SDD+)" : "⚠ en progreso (UX)";
    }
    lines.push(`| ${rf} | ${feats.join(", ") || "—"} | ${estado} |`);
  }
  if (allRfs.length === 0) lines.push(`| — | — | (sin RF declarados aun) |`);
  lines.push(stamp());
  return lines.join("\n");
}

/** Resumen vivo de una fase (id) desde status.phases. Usado por fases 5-8. */
function buildPhaseSummary(status, id) {
  const p = (status.phases || []).find((x) => x.id === id) || {};
  return [
    `| Fase | Estado | Detalle |`,
    `|:-:|:-:|---|`,
    `| ${id} ${p.name || ""} | ${statusIcon(p.status)} ${p.status || "-"} | ${String(p.detail || "").replace(/\|/g, "/")} |`,
    stamp(),
  ].join("\n");
}

/** 04.00 > sdd-trazabilidad: por feature, RF -> modelo BD -> API contract. */
export function buildSddTrazabilidad(root, status) {
  const phaseBySlug = {};
  for (const f of (status.features || [])) phaseBySlug[f.slug] = f.phase;
  const lines = [`| Feature | RF/HU | Modelo BD | API contract | Estado SDD |`, `|---|---|:-:|:-:|---|`];
  let any = false;
  for (const slug of listIncludedFeatures(root)) {
    any = true;
    const { rfs } = parseSpecRequirements(root, slug);
    const stPath = join(root, "specs", slug, "spec-tecnica.md");
    const apPath = join(root, "specs", slug, "api-contract.md");
    const stText = existsSync(stPath) ? readFileSync(stPath, "utf8") : "";
    const apText = existsSync(apPath) ? readFileSync(apPath, "utf8") : "";
    const hasBd = /Tabla\s*`[a-z_]+`/i.test(stText);
    const hasApi = /\b(GET|POST|PUT|PATCH|DELETE)\s+\//.test(apText);
    const estado = hasBd && hasApi ? "✓ completo" : (hasBd || hasApi ? "⚠ parcial" : "⊘ pendiente");
    lines.push(`| ${slug} | ${rfs.join(", ") || "—"} | ${hasBd ? "✓" : "✗"} | ${hasApi ? "✓" : "✗"} | ${estado} |`);
  }
  if (!any) lines.push(`| — | — | — | — | (sin features) |`);
  lines.push(stamp());
  return lines.join("\n");
}

/** 03.04-checklist-arquitectura.md > baseline-estado: semaforo del baseline minimo. */
export function buildBaselineEstado(root) {
  const results = evaluateBaseline(root);
  const lines = [
    `| Concern | Estado | Evidencia |`,
    `|---|:-:|---|`,
  ];
  for (const r of results) {
    const icon = r.status === "covered" ? "✓" : "✗";
    lines.push(`| ${r.label} | ${icon} | ${r.files.length > 0 ? `${r.files.length} doc(s)` : "—"} |`);
  }
  const covered = results.filter((r) => r.status === "covered").length;
  lines.push(``);
  lines.push(`Baseline: **${covered}/${results.length}** concerns cubiertos. Validado por \`npm run check:architecture-baseline\`.`);
  lines.push(stamp());
  return lines.join("\n");
}

/**
 * v12.87 (Sincronizacion): contrato EJECUTABLE de una fase renderizado desde
 * _lib/phase-contracts.mjs (fuente unica). Lista los validadores que confirman la
 * fase + los gates. Asi los checklists markdown dejan de copiar a mano la lista de
 * `check:*` (que driftaba). Las partes de juicio humano del checklist siguen manuales;
 * solo este bloque (validadores + gate) se auto-genera.
 */
export function buildPhaseContrato(phaseId) {
  const c = getPhaseContract(phaseId);
  if (!c) return "_(sin contrato para esta fase)_";
  const tokens = [...new Set((c.debeValidar || []).flatMap((e) =>
    [...String(e).matchAll(/npm run ([a-z0-9:_-]+)/g)].map((m) => m[1])))];
  const gates = (c.gates || []).map((g) => `\`${g}\``).join(", ") || "—";
  const lines = [
    `> **Contrato ejecutable — Fase ${c.id} ${c.name}.** Fuente unica: \`ci/scripts/_lib/phase-contracts.mjs\`.`,
    `> No edites esta lista a mano; se regenera con \`npm run roadmap:sync\`.`,
    ``,
    `Validadores que confirman la fase (corre TODOS antes de solicitar el gate):`,
    ...(tokens.length > 0
      ? tokens.map((t) => `- [ ] \`npm run ${t}\``)
      : ["- _(sin validadores automaticos; entrega + revision humana)_"]),
    ``,
    `Gate(s) de la fase: ${gates} — los **aprueba un humano** (el agente solo los solicita; verifica desviaciones con \`npm run roadmap:audit\`).`,
    stamp(),
  ];
  return lines.join("\n");
}

// Registro: archivo -> { zona: builder }. Bloque C agrega mas entradas.
const PHASE_DOC_ZONES = [
  { rel: "docs/fase-0-iniciacion/00.02-roadmap.md", zones: { "phase-progress": (root, status) => buildPhaseProgress(status) } },
  { rel: "docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md", zones: { "avance-real": (root, status) => buildAvanceReal(status) } },
  { rel: "docs/fase-0-iniciacion/00.05-checklist-adopcion.md", zones: { "fase-0-contrato": () => buildPhaseContrato(0) } },
  { rel: "docs/fase-1-analisis-requerimientos/01.01-matriz-huecos-fase-1.md", zones: { "cobertura-rf": (root, status) => buildCoberturaRf(root, status), "fase-1-contrato": () => buildPhaseContrato(1) } },
  { rel: "docs/fase-2-ux-ui/02.12-checklist-spdd.md", zones: { "fase-2-contrato": () => buildPhaseContrato(2) } },
  { rel: "docs/fase-3-arquitectura/03.04-checklist-arquitectura.md", zones: { "baseline-estado": (root) => buildBaselineEstado(root), "fase-3-contrato": () => buildPhaseContrato(3) } },
  // Bloque C (v12.69): estado vivo fases 4-8.
  { rel: "docs/fase-4-sdd/04.00-spec-driven-development.md", zones: { "sdd-trazabilidad": (root, status) => buildSddTrazabilidad(root, status) } },
  { rel: "docs/fase-4-sdd/04.01-checklist-spec-driven-development.md", zones: { "fase-4-contrato": () => buildPhaseContrato(4) } },
  { rel: "docs/fase-5-construccion/05.00-plantilla-proyecto-base.md", zones: { "trace-coverage": (root, status) => buildPhaseSummary(status, 5), "fase-5-contrato": () => buildPhaseContrato(5) } },
  { rel: "docs/fase-6-qa/06.00-plan-pruebas.md", zones: { "qa-estado": (root, status) => buildPhaseSummary(status, 6), "fase-6-contrato": () => buildPhaseContrato(6) } },
  { rel: "docs/fase-7-deploy/07.00-checklist-salida-produccion.md", zones: { "release-readiness": (root, status) => buildPhaseSummary(status, 7), "fase-7-contrato": () => buildPhaseContrato(7) } },
  { rel: "docs/fase-8-operacion/08.00-operacion-continua.md", zones: { "ops-readiness": (root, status) => buildPhaseSummary(status, 8), "fase-8-contrato": () => buildPhaseContrato(8) } },
];

/** Refresca todas las zonas de estado vivo en los docs de fase. */
export function refreshPhaseDocZones(root, status) {
  const results = [];
  for (const entry of PHASE_DOC_ZONES) {
    const filePath = join(root, entry.rel);
    if (!existsSync(filePath)) { results.push({ file: entry.rel, updated: false, reason: "no existe" }); continue; }
    const contentByName = {};
    for (const [name, fn] of Object.entries(entry.zones)) contentByName[name] = fn(root, status);
    const r = rewriteAutoZones(filePath, contentByName);
    results.push({ file: entry.rel, ...r });
  }
  return results;
}
