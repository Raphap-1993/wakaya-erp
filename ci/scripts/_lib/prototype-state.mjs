/**
 * _lib/prototype-state.mjs (v12.66)
 *
 * v12.66: el peldaño "visible-product" ahora exige tambien cumplir el CONTRATO
 * del prototipo (contractCompliance): sin contrato declarado, con un RF del spec
 * sin cubrir, o con un estado declarado no implementado, el prototipo se queda
 * en "auto-quality". Asi el semaforo (CLI + panel embebido + ROADMAP_STATE.json)
 * refleja el contrato sin tocar el panel.
 *
 * Calcula el ESTADO VISUAL de un prototipo HTML5 como una escalera de 5 peldaños
 * (mas "none"). Es la fuente unica para el semaforo del roadmap y para la regla
 * de avance fase 2 -> 3 ("requiere revision visual humana aprobada").
 *
 *   none                  -> no hay prototype-html5/index.html
 *   exists                -> existe, pero no alcanza calidad automatica nivel 2
 *   auto-quality          -> pasa calidad nivel 2, pero falla anti-trampa (producto visible)
 *   visible-product       -> pasa anti-trampa, pero aun NO tiene seccion de revision humana
 *   human-review-pending  -> tiene seccion de revision humana, sin aprobar (pending/blocked)
 *   human-approved        -> revision humana aprobada por un humano real + fecha + evidencia
 *
 * IMPORTANTE: este modulo es un INDICADOR (rapido, sin spawnear validadores).
 * El gate AUTORITATIVO sigue siendo check:project (check-html5-prototype-quality
 * + check-prototype-visible-product). Aqui replicamos sus heuristicas de forma
 * ligera para pintar el semaforo y recomendar la siguiente accion. El unico
 * peldaño que se considera autoritativo es `human-approved` porque lee la misma
 * evidencia que el validador anti-trampa (prototype-validation.md).
 *
 * Coherente con v12.61: resuelve <link>/@import a CSS local (incl. specs/_shared/)
 * para contar tokens — un prototipo portfolio-spa NO debe verse de baja calidad
 * solo por mover el sistema de diseño a _shared/.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { listIncludedFeatures } from "./feature-filter.mjs";
import { contractCompliance } from "./prototype-contract.mjs";

export const PROTOTYPE_STATES = [
  "none",
  "exists",
  "auto-quality",
  "visible-product",
  "human-review-pending",
  "human-approved",
];

// Metadata para UI (semaforo) y reportes.
export const STATE_META = {
  "none":                 { rung: 0, light: "gray",  icon: "○", label: "sin prototipo" },
  "exists":               { rung: 1, light: "red",   icon: "🔴", label: "existe (calidad insuficiente)" },
  "auto-quality":         { rung: 2, light: "red",   icon: "🔴", label: "calidad automatica (falla anti-trampa)" },
  "visible-product":      { rung: 3, light: "amber", icon: "🟡", label: "producto visible (sin revision humana)" },
  "human-review-pending": { rung: 4, light: "amber", icon: "🟡", label: "revision humana pendiente" },
  "human-approved":       { rung: 5, light: "green", icon: "🟢", label: "aprobado por humano" },
};

// Revisores que NO cuentan como humano (espejo de check-prototype-visible-product).
const NON_HUMAN_REVIEWERS = /\b(agente|agent|ia\b|a\.?i\.?|claude|gpt|codex|copilot|gemini|cursor|opencode|bot|automatico|automatic|sistema|script)\b/i;

// Umbrales nivel 2 (espejo de QUALITY_THRESHOLDS.level2 en check-html5-prototype-quality).
const LEVEL2 = { htmlLines: 250, cssTokens: 6, mediaQueries: 1, distinctViews: 4, mockRecords: 6, buttons: 5 };

function countMatches(s, re) { return (s.match(re) || []).length; }

function resolveLinkedCss(htmlPath, raw) {
  const baseDir = dirname(htmlPath);
  const refs = new Set();
  for (const m of raw.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+\.css)["'][^>]*>/gi)) refs.add(m[1]);
  for (const m of raw.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+\.css)["']/gi)) refs.add(m[1]);
  let css = "";
  for (const ref of refs) {
    if (/^https?:\/\//i.test(ref)) continue;
    const p = resolve(baseDir, ref);
    if (existsSync(p)) { try { css += "\n" + readFileSync(p, "utf8"); } catch { /* ignore */ } }
  }
  return css;
}

function gradeLevel2(htmlPath, raw) {
  const cssCorpus = raw + "\n" + resolveLinkedCss(htmlPath, raw);
  const lines = raw.split(/\r?\n/).length;
  const cssTokens = countMatches(cssCorpus, /--[a-z][a-z0-9-]*\s*:/gi);
  const mediaQueries = countMatches(cssCorpus, /@media\b/gi);

  const views = new Set();
  for (const a of ["data-view", "data-screen", "data-section", "data-tab", "data-page", "data-route", "data-step", "data-panel", "data-card"]) {
    for (const m of raw.matchAll(new RegExp(a + '\\s*=\\s*["\']([^"\']+)["\']', "gi"))) views.add(a + ":" + m[1]);
  }
  for (const m of raw.matchAll(/\b(?:setView|setSection|showView|render|setTab|setPage|navigate|goTo|openView|selectLesson|goStep)\s*\([^)]*?['"]([a-zA-Z0-9_-]+)['"]/g)) views.add("fn:" + m[1]);
  const sectionsWithId = countMatches(raw, /<section\b[^>]*\bid\s*=/gi);
  const distinctViews = Math.max(views.size, sectionsWithId);

  const tableRows = Math.max(countMatches(raw, /<tr\b/gi) - countMatches(raw, /<thead[\s\S]*?<\/thead>/gi), 0);
  const listItems = countMatches(raw, /<li\b/gi);
  const jsObjects = countMatches(raw, /\{[^{}]{0,300}\b(?:id|name|titulo|title|nombre|fecha|date|estado|status|sku|email|price|precio|amount|qty|cantidad)\s*:/gi);
  const mockRecords = tableRows + listItems + jsObjects;

  const buttons = countMatches(raw, /<button\b/gi);

  const t = LEVEL2;
  const ok = lines >= t.htmlLines && cssTokens >= t.cssTokens && mediaQueries >= t.mediaQueries
    && distinctViews >= t.distinctViews && mockRecords >= t.mockRecords && buttons >= t.buttons;
  const gaps = [];
  if (lines < t.htmlLines) gaps.push(`lineas ${lines}<${t.htmlLines}`);
  if (cssTokens < t.cssTokens) gaps.push(`tokens ${cssTokens}<${t.cssTokens}`);
  if (mediaQueries < t.mediaQueries) gaps.push(`media ${mediaQueries}<${t.mediaQueries}`);
  if (distinctViews < t.distinctViews) gaps.push(`vistas ${distinctViews}<${t.distinctViews}`);
  if (mockRecords < t.mockRecords) gaps.push(`mocks ${mockRecords}<${t.mockRecords}`);
  if (buttons < t.buttons) gaps.push(`botones ${buttons}<${t.buttons}`);
  return { ok, metrics: { lines, cssTokens, mediaQueries, distinctViews, mockRecords, buttons }, gaps };
}

function visibleProductOk(root, slug, raw) {
  const reasons = [];
  for (const cls of ["validation-only", "test-fixture", "metrics-filler", "validation-fixture"]) {
    if (new RegExp(`class\\s*=\\s*["'][^"']*\\b${cls}\\b`, "i").test(raw)) reasons.push(`clase prohibida .${cls}`);
  }
  if (/<template[^>]*\bhidden\b[^>]*>[\s\S]*?(valid|fixture|metric|test-only)/i.test(raw)) reasons.push("template hidden con fixture");
  const hiddenBlocks = [...raw.matchAll(/style\s*=\s*["'][^"']*(display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)[^"']*["'][^>]*>([\s\S]{0,2000}?)<\/(div|section|ul|tbody|table)>/gi)];
  for (const m of hiddenBlocks) {
    if (((m[2] || "").match(/<(tr|li|article)\b/gi) || []).length >= 3) { reasons.push("bloque oculto con >=3 records"); break; }
  }
  const decPath = join(root, "specs", slug, "prototype-html5", "decisiones-ux.md");
  if (existsSync(decPath)) {
    if (!/golden/i.test(readFileSync(decPath, "utf8"))) reasons.push("decisiones-ux sin Golden de referencia");
  } else {
    reasons.push("falta decisiones-ux.md");
  }
  const mentionsStates = /(loading|cargando|empty|sin datos|error|reintentar)/i.test(raw);
  const hasInteraction = /(addEventListener|onclick\s*=|data-view|data-screen|setView|showView|render\w*\()/i.test(raw);
  if (mentionsStates && !hasInteraction) reasons.push("estados UI solo-texto (sin interaccion)");
  return { ok: reasons.length === 0, reasons };
}

function humanReview(root, slug) {
  const valPath = join(root, "specs", slug, "prototype-validation.md");
  if (!existsSync(valPath)) return { hasSection: false, approved: false, result: null, reviewer: null };
  const val = readFileSync(valPath, "utf8");
  const sec = val.match(/##\s*Revision\s+visual\s+humana([\s\S]*?)(?=\n##\s|$)/i);
  if (!sec) return { hasSection: false, approved: false, result: null, reviewer: null };
  const body = sec[1];
  const resultRaw = (body.match(/Resultado\s*:\s*(approved|aprobado|blocked|bloqueado|pending|pendiente)/i) || [])[1];
  const result = resultRaw ? resultRaw.toLowerCase() : null;
  const reviewer = ((body.match(/Revisor\s*:\s*(.+)/i) || [])[1] || "").trim();
  const fecha = ((body.match(/Fecha\s*:\s*(.+)/i) || [])[1] || "").trim();
  const evidencia = ((body.match(/Evidencia\s+revisada\s*:\s*(.+)/i) || [])[1] || "").trim();
  const approved = (result === "approved" || result === "aprobado")
    && !!reviewer && !NON_HUMAN_REVIEWERS.test(reviewer)
    && !!fecha && !/<|placeholder|TBD|YYYY/i.test(fecha)
    && !!evidencia && !/<|placeholder|TBD/i.test(evidencia);
  return { hasSection: true, approved, result, reviewer };
}

function finalize(slug, state, extra) {
  const meta = STATE_META[state];
  return { slug, state, light: meta.light, icon: meta.icon, label: meta.label, rung: meta.rung, ...extra };
}

/**
 * Estado de un solo prototipo. Devuelve { slug, state, light, icon, label, rung, ... }.
 */
export function computePrototypeState(root, slug) {
  const protoPath = join(root, "specs", slug, "prototype-html5", "index.html");
  if (!existsSync(protoPath)) return finalize(slug, "none", {});
  let size = 0;
  try { size = statSync(protoPath).size; } catch { /* ignore */ }
  if (size === 0) return finalize(slug, "none", {});

  const raw = readFileSync(protoPath, "utf8");
  const grade = gradeLevel2(protoPath, raw);
  if (!grade.ok) return finalize(slug, "exists", { metrics: grade.metrics, blockedBy: `calidad nivel 2 insuficiente (${grade.gaps.join(", ")})` });

  const vis = visibleProductOk(root, slug, raw);
  if (!vis.ok) return finalize(slug, "auto-quality", { metrics: grade.metrics, blockedBy: vis.reasons.join("; ") });

  // v12.66: un prototipo no llega a producto visible si incumple SU contrato
  // (sin seccion, RF sin cubrir, estado declarado no implementado). Asi el
  // semaforo (CLI + panel embebido + ROADMAP_STATE.json) refleja el contrato.
  const cc = contractCompliance(root, slug, raw);
  if (!cc.ok) return finalize(slug, "auto-quality", { metrics: grade.metrics, blockedBy: "contrato: " + cc.reasons.join("; ") });

  const hr = humanReview(root, slug);
  if (hr.approved) return finalize(slug, "human-approved", { metrics: grade.metrics, reviewer: hr.reviewer });
  if (hr.hasSection) return finalize(slug, "human-review-pending", { metrics: grade.metrics, result: hr.result || "pending" });
  return finalize(slug, "visible-product", { metrics: grade.metrics, blockedBy: "sin seccion '## Revision visual humana' aprobada" });
}

/**
 * Resumen para todas las features incluidas (excluye 000-* y roadmap: ignore).
 * Incluye la regla de avance fase 2 -> 3.
 */
export function summarizePrototypeStates(root) {
  const slugs = listIncludedFeatures(root);
  const features = slugs.map((s) => computePrototypeState(root, s));
  const withProto = features.filter((f) => f.state !== "none");
  const counts = {};
  for (const st of PROTOTYPE_STATES) counts[st] = features.filter((f) => f.state === st).length;
  const blockers = withProto
    .filter((f) => f.state !== "human-approved")
    .map((f) => ({ slug: f.slug, state: f.state, blockedBy: f.blockedBy || (f.result ? `revision humana: ${f.result}` : null) }));
  return {
    total: features.length,
    withPrototype: withProto.length,
    counts,
    features,
    // Avance fase 2 -> 3: todas las features con prototipo deben estar human-approved.
    phase2to3Ready: withProto.length > 0 && blockers.length === 0,
    phase2to3Blockers: blockers,
  };
}
