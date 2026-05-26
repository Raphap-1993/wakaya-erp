#!/usr/bin/env node
/**
 * Validador automático de calidad de prototipos HTML5
 *
 * Uso:
 *   node ci/scripts/check-html5-prototype-quality.mjs
 *   node ci/scripts/check-html5-prototype-quality.mjs --spec specs/001-bandeja-trabajo-expedientes
 *   node ci/scripts/check-html5-prototype-quality.mjs --strict   (bloquea en observaciones)
 *
 * Niveles rúbrica (docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md):
 *   0 — Rechazado    : bloqueantes B1-B10 o términos prohibidos visibles
 *   1 — Insuficiente : pasa lo básico pero shell genérica o riqueza pobre
 *   2 — Aceptable    : flujo navegable, estados, datos del dominio
 *   3 — Producto real: tokens de diseño, responsive, riqueza visual y de datos
 *
 * Exit codes:
 *   0 — Aprobado nivel 2 o 3
 *   1 — Bloqueado (nivel 0 o 1)
 *   2 — Aprobado con observaciones (solo con --strict)
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve, dirname } from "path";

const args = process.argv.slice(2);
const specFlag = args.indexOf("--spec");
const specTarget = specFlag !== -1 ? args[specFlag + 1] : null;
const strict = args.includes("--strict");

// ── Términos prohibidos como texto visible en pantalla (B3) ─────────────────
// Se prohiben SOLO etiquetas metodologicas/tecnicas. Las palabras de
// "simulacion" (Contrato mock, Recorrido simulado, Proceso asincrono mock,
// Login OIDC simulado) se quitaron en v12.20: ya no se exige marcar al
// prototipo como simulacion, debe parecer producto real.
const FORBIDDEN_VISIBLE = [
  "RF-",
  "gate-",
  "Formulario-spec",
  "Actividad de ejemplo",
  "Permiso activo",
  "Ruta interna",
  "Componente:",
  "Spec técnica",
  "Angular futuro:",
  "Rol sin permiso",
  "Resumen</button>",
  "Recorrido</button>",
];

// ── Señales que deben estar presentes en un prototipo de calidad ────────────
// Se quito "aviso de datos mock" en v12.20: el prototipo ya no esta obligado
// a mostrar un banner "Prototipo de validacion / datos de demostracion".
const REQUIRED_SIGNALS = [
  { pattern: /loading|cargando|spinner|cargand/i, label: "estado loading" },
  { pattern: /empty|sin resultado|no hay|vacío|sin coincidenci/i, label: "estado empty" },
  { pattern: /error|fallido|no se pudo|ha fallado/i, label: "estado error" },
  { pattern: /success|completado|listo|aprobado|exitos/i, label: "estado success" },
  { pattern: /toast|notify|notif|snackbar/i, label: "feedback toast/notify" },
  { pattern: /prototype\/index\.html|hub del producto|← hub|volver al hub/i, label: "link de vuelta al hub" },
];

const INTERACTIVITY_SIGNALS = [
  { pattern: /data-view|onclick|addEventListener/i, label: "navegación entre vistas" },
];

// ── Archivos requeridos por spec con prototipo HTML5 ────────────────────────
const REQUIRED_FILES = [
  "prototype-html5/index.html",
  "prototype-html5/flujo.md",
  "prototype-html5/decisiones-ux.md",
  "prototype.md",
  "prototype-validation.md",
];

// ── Patrón visual por dominio (B6, B7, B9) ──────────────────────────────────
// Dominios donde sidenav+tabla como shell principal es bloqueante (B9).
const CONSUMER_DOMAINS = [
  "streaming",
  "contenido",
  "entretenimiento",
  "ecommerce",
  "e-commerce",
  "marketplace",
  "educacion",
  "educación",
  "e-learning",
  "kids",
  "infantil",
  "consumo",
];

// Dominios que requieren patrones específicos.
const DOMAIN_REQUIREMENTS = {
  streaming: { needs: [/topbar|nav|header/i, /(catálogo|catalogo|grid|posters?|hero)/i], label: "topbar + catálogo/hero" },
  player: { needs: [/<video|player|reproductor/i, /(play|pause|seek|controls)/i], label: "video + controles playback" },
  ecommerce: { needs: [/(catálogo|catalogo|productos?|grid)/i, /(carrito|cart|checkout|comprar)/i], label: "catálogo + carrito/checkout" },
  educacion: { needs: [/(curso|lección|leccion|módulo|modulo)/i, /(progreso|progress|completad)/i], label: "curso/lección + progreso" },
};

// ── Mínimos cuantitativos para nivel 2 / nivel 3 ────────────────────────────
// Calibrados contra los goldens canónicos reales:
//   saas-operativo-bandeja    : 1311 líneas, 26 tokens, 1 mq, 5 vistas, 15 mocks, 28 botones
//   streaming-catalogo-player :  640 líneas, 14 tokens, 1 mq, 5 vistas, 12 mocks, 22 botones
//   dashboard-analytics-kpi   : 1019 líneas, 31 tokens, 3 mq, 8 vistas, 19 mocks, 19 botones
// El umbral nivel 3 es el mínimo común que los tres goldens superan.
const QUALITY_THRESHOLDS = {
  level2: {
    htmlLines: 250,
    cssCustomProps: 6,
    mediaQueries: 1,
    distinctViews: 4,
    mockRecords: 6,
    buttons: 5,
  },
  level3: {
    htmlLines: 500,
    cssCustomProps: 12,
    mediaQueries: 1,
    distinctViews: 5,
    mockRecords: 12,
    buttons: 10,
  },
};

// v12.90 (P4): el umbral de RIQUEZA (líneas/vistas/mocks/botones) se ajusta a la
// complejidad declarada de la feature, para no forzar a inflar features simples.
// Se declara en spec-funcional.md frontmatter: `complexity: simple|standard|rich`.
// Los tokens de diseño y media queries NO se relajan (son el piso de calidad visual).
function readComplexity(specPath) {
  try {
    const sf = readFileSync(join(specPath, "spec-funcional.md"), "utf8");
    const fm = sf.match(/^---\s*\n([\s\S]*?)\n---/);
    if (fm) {
      const c = fm[1].match(/^\s*complexity\s*:\s*(simple|standard|rich)\s*$/im);
      if (c) return c[1].toLowerCase();
    }
  } catch { /* sin spec-funcional: standard */ }
  return "standard";
}
function scaleThresholds(complexity) {
  const b = QUALITY_THRESHOLDS;
  if (complexity === "simple") {
    return {
      level2: { ...b.level2, htmlLines: 160, distinctViews: 3, mockRecords: 4, buttons: 4 },
      level3: { ...b.level3, htmlLines: 320, distinctViews: 4, mockRecords: 8, buttons: 7 },
    };
  }
  if (complexity === "rich") {
    return {
      level2: { ...b.level2 },
      level3: { ...b.level3, htmlLines: 700, distinctViews: 7, mockRecords: 18, buttons: 14 },
    };
  }
  return b; // standard
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function log(level, msg) {
  const prefix = { ok: "  ✓", warn: "  ⚠", error: "  ✗", info: "  ·", bonus: "  ★" };
  console.log(`${prefix[level] ?? "  ?"} ${msg}`);
}

function readRaw(filePath) {
  try { return readFileSync(filePath, "utf8"); } catch { return ""; }
}

/**
 * v12.61 (tension B) — Resuelve CSS enlazado LOCAL (incluido specs/_shared/*.css)
 * via <link rel="stylesheet" href="..."> y @import. Devuelve el contenido
 * concatenado para que los tokens del sistema de diseño compartido cuenten en
 * el grading: mover tokens.css a _shared/ NO debe bajar el nivel del prototipo.
 * Los CSS externos (http/https) se ignoran (ya los bloquea B-CDN).
 */
function resolveLinkedCss(htmlPath, raw) {
  const baseDir = dirname(htmlPath);
  const refs = new Set();
  for (const m of raw.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+\.css)["'][^>]*>/gi)) refs.add(m[1]);
  for (const m of raw.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+\.css)["']/gi)) refs.add(m[1]);
  let combined = "";
  const resolved = [];
  for (const ref of refs) {
    if (/^https?:\/\//i.test(ref)) continue; // externo -> lo cubre B-CDN
    const cssPath = resolve(baseDir, ref);
    if (existsSync(cssPath)) {
      combined += "\n/* linked: " + ref + " */\n" + readRaw(cssPath);
      resolved.push(ref);
    }
  }
  return { css: combined, resolved };
}

function stripCommentsAndScripts(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

function findPrototypeSpecs(root) {
  const specs = [];
  if (!existsSync(root)) return specs;
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) {
      const htmlPath = join(full, "prototype-html5", "index.html");
      if (existsSync(htmlPath)) specs.push(full);
    }
  }
  return specs;
}

function detectDomain(decisionesContent) {
  const m = decisionesContent.match(/Dominio[^\n:]*:\s*([^\n]+)/i);
  if (!m) return null;
  const raw = m[1].trim();
  // Ignorar placeholders no rellenados (texto entre <...> o que empiezan con TODO/COMPLETAR)
  if (/^<.*>$/.test(raw)) return null;
  if (/^(TODO|COMPLETAR|PENDIENTE|FIXME|XXX)/i.test(raw)) return null;
  return raw.toLowerCase();
}

function detectShellPattern(html) {
  const hasSidenav = /<aside\b|class\s*=\s*["'][^"']*\b(sidenav|sidebar|side-nav|side-menu)\b/i.test(html);
  const hasMainTable = /<table\b/i.test(html);
  const hasHero = /\b(hero|jumbotron|banner-hero|hero-section)\b/i.test(html);
  const hasGrid = /\b(grid|posters?|cards?-grid|catalog|catálogo)\b/i.test(html);
  const hasVideo = /<video\b|\b(player|video-player)\b/i.test(html);
  return { hasSidenav, hasMainTable, hasHero, hasGrid, hasVideo };
}

function countMatches(html, regex) {
  return (html.match(regex) ?? []).length;
}

function countDistinctViews(html) {
  const distinct = new Set();
  // Data attributes comunes para vistas/pantallas/secciones/pasos/KPIs/cards.
  const attrs = [
    "data-view", "data-screen", "data-section", "data-tab", "data-page",
    "data-route", "data-kpi", "data-pane", "data-step", "data-panel",
    "data-card", "data-use", "data-plan", "data-q",
  ];
  for (const attr of attrs) {
    const re = new RegExp(attr + '\\s*=\\s*["\']([^"\']+)["\']', "gi");
    for (const m of html.matchAll(re)) distinct.add(attr + ":" + m[1]);
  }
  // Patrones de invocacion de funciones de navegacion entre vistas. Captura
  // cualquier string literal dentro de la llamada, aunque haya argumentos
  // previos como `this` (ej. setSection(this, 'overview')).
  for (const m of html.matchAll(/\b(?:setView|setSection|showView|render|setTab|setPage|navigate|goTo|openView|goPage|goStep|selectLesson|selectStep|setRange|nextStep|prevStep|setMode|filterMoves)\s*\([^)]*?['"]([a-zA-Z0-9_-]+)['"]/g)) {
    distinct.add("fn:" + m[1]);
  }
  // Tambien acepta argumentos numericos en funciones de navegacion
  // (ej. selectLesson(this, 1), goStep(2), setTab(3)).
  for (const m of html.matchAll(/\b(?:selectLesson|goStep|setTab|setStep|gotoStep|setPage|goPage|setView|showPage|setLesson)\s*\([^)]*?\b(\d+)\s*\)/g)) {
    distinct.add("fnNum:" + m[1]);
  }
  // Secciones identificables top-level + divs/aside/main/nav con id de vista.
  const sectionsWithId = countMatches(html, /<section\b[^>]*\bid\s*=/gi);
  const pageDivs = countMatches(html, /<(?:div|aside|main|nav)\b[^>]*\bid\s*=\s*["'](?:page|pane|panel|step|view|screen|tab|section|route)[-_][^"']+["']/gi);
  return Math.max(distinct.size, sectionsWithId, pageDivs);
}

function countMockRecords(html) {
  // Heuristica: filas de tabla + items de lista + objetos JS literales en arrays
  // + items de un .map() o div repetido. Cada uno suma; el max() inicial
  // descarta el caso donde no hay <tbody>.
  const tableRows = countMatches(html, /<tr\b/gi) - countMatches(html, /<thead[\s\S]*?<\/thead>/gi);
  const listItems = countMatches(html, /<li\b/gi);
  // Objetos JS literales: matchea cualquier { ... clave ... } con clave
  // tipica del dominio. No exige que la clave sea la primera del objeto.
  const jsObjects = countMatches(
    html,
    /\{[^{}]{0,300}\b(?:id|name|titulo|title|nombre|fecha|date|estado|status|sku|email|phone|price|precio|amount|qty|cantidad|sessions|revenue|delta|count|gate|ref|brand|model|year|placa|plate)\s*:/gi,
  );
  // Divs/articles que repiten una clase de "item/row/card" — patron comun en
  // listas mock renderizadas por map() con HTML statico.
  const repeatedItems = countMatches(
    html,
    /class\s*=\s*["'][^"']*\b(?:cart-item|tx-row|action-card|coverage-card|kpi-card|product-card|module|lesson\b|funnel-step|channel-row|step-pill|module-head|moves-card|step|case-row|card-product)\b[^"']*["']/gi,
  );
  return Math.max(tableRows, 0) + listItems + jsObjects + repeatedItems;
}

function gradeProto(html, decisionesContent, extraCss = "", thresholds = QUALITY_THRESHOLDS) {
  const lines = html.split(/\r?\n/).length;
  // v12.61: tokens y media queries cuentan tambien el CSS enlazado (_shared/*.css).
  const cssCorpus = extraCss ? html + "\n" + extraCss : html;
  const cssCustomProps = countMatches(cssCorpus, /--[a-z][a-z0-9-]*\s*:/gi);
  const mediaQueries = countMatches(cssCorpus, /@media\b/gi);
  const distinctViews = countDistinctViews(html);
  const mockRecords = countMockRecords(html);
  const buttons = countMatches(html, /<button\b/gi);

  const t2 = thresholds.level2;
  const t3 = thresholds.level3;
  const meets = (v, t) => v >= t;

  const meetsLevel2 =
    meets(lines, t2.htmlLines) &&
    meets(cssCustomProps, t2.cssCustomProps) &&
    meets(mediaQueries, t2.mediaQueries) &&
    meets(distinctViews, t2.distinctViews) &&
    meets(mockRecords, t2.mockRecords) &&
    meets(buttons, t2.buttons);

  const meetsLevel3 =
    meets(lines, t3.htmlLines) &&
    meets(cssCustomProps, t3.cssCustomProps) &&
    meets(mediaQueries, t3.mediaQueries) &&
    meets(distinctViews, t3.distinctViews) &&
    meets(mockRecords, t3.mockRecords) &&
    meets(buttons, t3.buttons);

  return {
    metrics: { lines, cssCustomProps, mediaQueries, distinctViews, mockRecords, buttons },
    meetsLevel2,
    meetsLevel3,
  };
}

function checkDecisiones(specPath) {
  const issues = { blockers: [], observations: [] };
  const path = join(specPath, "prototype-html5", "decisiones-ux.md");
  if (!existsSync(path)) {
    issues.blockers.push("[O4] decisiones-ux.md no existe.");
    return { issues, content: "" };
  }
  const content = readRaw(path);
  const required = [
    { pattern: /Dominio[^\n:]*:/i, label: "Dominio del spec" },
    { pattern: /Actor[^\n:]*:/i, label: "Actor principal" },
    { pattern: /(Tarea|Recorrido)[^\n:]*:/i, label: "Tarea principal navegable" },
    { pattern: /Patr[oó]n[^\n:]*:/i, label: "Patrón visual elegido" },
    { pattern: /(Por qu[eé] no|Justificaci[oó]n)[^\n:]*:/i, label: "Justificación de no-shell-genérica" },
    { pattern: /Interacciones[^\n:]*:/i, label: "Interacciones mock obligatorias" },
  ];
  for (const r of required) {
    if (!r.pattern.test(content)) {
      issues.observations.push(`[O4] decisiones-ux.md no declara: ${r.label}`);
    }
  }
  // Si ningún campo está → bloqueo total
  const filledCount = required.filter(r => r.pattern.test(content)).length;
  if (filledCount === 0) {
    issues.blockers.push("[O4] decisiones-ux.md está vacío de decisiones — bloqueante para B9/B6/B7.");
  }
  return { issues, content };
}

function checkHtmlFile(htmlPath, decisionesContent) {
  const issues = { blockers: [], observations: [] };
  let level = 0;
  let metrics = null;

  if (!existsSync(htmlPath)) {
    issues.blockers.push(`Archivo no encontrado: ${htmlPath}`);
    return { issues, level, metrics };
  }

  const raw = readRaw(htmlPath);
  if (!raw) {
    issues.blockers.push("Archivo vacío o ilegible.");
    return { issues, level, metrics };
  }

  const visible = stripCommentsAndScripts(raw);

  // B3 — Términos prohibidos visibles
  for (const term of FORBIDDEN_VISIBLE) {
    if (visible.includes(term)) {
      issues.blockers.push(`[B3] Término prohibido visible en pantalla: "${term}"`);
    }
  }

  // v12.49 (F3) — Antipatrones detectados por contenido del HTML.
  // Estos cierran los gaps reales vistos en opencode/codex/gemini.

  // B-CDN — CDN externo de framework CSS/JS (Tailwind, Bootstrap, Bulma, etc.)
  // Un prototipo HTML5 autocontenido NO debe depender de CDN externos:
  // - El gate `prototype-validation.md` exige "abre sin build ni dependencias no documentadas".
  // - Tailwind utility-first hace los tokens CSS invisibles para el validador.
  const CDN_PATTERNS = [
    { re: /https?:\/\/cdn\.tailwindcss\.com/i, label: "Tailwind CDN" },
    { re: /https?:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap/i, label: "Bootstrap CDN" },
    { re: /https?:\/\/(?:[^"']*\.)?bootstrapcdn\.com/i, label: "Bootstrap CDN (bootstrapcdn)" },
    { re: /https?:\/\/cdn\.jsdelivr\.net\/npm\/bulma/i, label: "Bulma CDN" },
    { re: /https?:\/\/unpkg\.com\/(tailwindcss|bootstrap|bulma|@material)/i, label: "framework CDN (unpkg)" },
    { re: /https?:\/\/cdn\.jsdelivr\.net\/npm\/@?(material-ui|antd|chakra-ui|vue|react|angular)/i, label: "framework CDN (jsdelivr)" },
    { re: /<script[^>]+src=["']https?:\/\/[^"']+\.js["']/i, label: "<script src> externo (debe ser autocontenido)" },
  ];
  for (const cdn of CDN_PATTERNS) {
    if (cdn.re.test(raw)) {
      issues.blockers.push(`[B-CDN] No se permiten CDN externos en prototipos autocontenidos. Detectado: ${cdn.label}. Reemplaza por CSS/JS inline en <style>/<script>.`);
      break; // un solo finding por archivo, suficiente
    }
  }

  // B-MINIFIED — HTML minificado en una sola linea (>500 chars en linea 1)
  // o densidad de etiquetas en una sola linea (>20 elementos abriendo en una linea).
  // Indica generacion automatica sin formato; rompe revision humana.
  const lines = raw.split(/\r?\n/);
  const longestLineLen = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const longestLineTags = lines.reduce((m, l) => Math.max(m, (l.match(/<[a-z]/gi) || []).length), 0);
  if (longestLineLen > 1000 && longestLineTags > 20) {
    issues.blockers.push(`[B-MINIFIED] HTML aparece minificado: linea mas larga ${longestLineLen} chars con ${longestLineTags} tags. Debe estar formateado con indentacion para ser revisable.`);
  }

  // B-INLINE-STYLES — exceso de style="..." sin clases nombradas (>20 ocurrencias
  // y <10 declaraciones CSS en <style>). Indica copy-paste sin sistema visual.
  const inlineStyleCount = (raw.match(/style\s*=\s*["'][^"']+["']/gi) || []).length;
  const styleBlocks = raw.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  const styleDeclarations = styleBlocks.join("\n").split(";").length;
  if (inlineStyleCount > 20 && styleDeclarations < 30) {
    issues.observations.push(`[O-INLINE] ${inlineStyleCount} style="..." inline pero solo ${styleDeclarations} declaraciones en <style>. Considera mover a clases nombradas.`);
  }

  // O-FAKE-NAV — navegacion decorativa (alert/console) sin handlers reales.
  const hasAlertNav = /onclick\s*=\s*["']?\s*(alert|console\.log)/i.test(raw);
  const hasRealNav = /(setView|showView|navigate|render|setSection|switchView|loadView|openView|activate)\s*\(/i.test(raw)
    || /addEventListener\s*\(\s*["']click["']/i.test(raw);
  if (hasAlertNav && !hasRealNav) {
    issues.observations.push("[O-NAV] Navegacion parece decorativa (alert/console.log). Implementa JavaScript real (setView/render/addEventListener).");
  }

  // B4 — Sin navegación entre vistas
  const hasNav = INTERACTIVITY_SIGNALS.some(s => s.pattern.test(raw));
  if (!hasNav) {
    issues.blockers.push("[B4] No se detectó navegación entre vistas (data-view, onclick, addEventListener).");
  }

  // B5 — Estados UI. loading/empty/error/success se manejan con vocabulario propio
  // del dominio (un player usa "buffering", un catálogo usa "sin coincidencias").
  // El validador no puede saber "cuándo aplica" cada estado, así que:
  //   - cada señal ausente individual = observación
  //   - SOLO si faltan 3 o más señales de estado (loading/empty/error/success) a la
  //     vez, es bloqueante B5 — eso sí indica un prototipo genuinamente sin estados.
  const STATE_LABELS = ["estado loading", "estado empty", "estado error", "estado success"];
  const missingSignals = REQUIRED_SIGNALS.filter(s => !s.pattern.test(raw));
  const missingStateCount = missingSignals.filter(s => STATE_LABELS.includes(s.label)).length;
  if (missingStateCount >= 3) {
    issues.blockers.push(`[B5] Faltan ${missingStateCount} de 4 estados UI (loading/empty/error/success) — el prototipo no demuestra comportamiento de producto.`);
  }
  for (const s of missingSignals) {
    issues.observations.push(`[O] Señal no detectada: ${s.label}`);
  }

  // B2 — Título genérico
  const title = visible.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
  const genericTitles = ["prototype", "html5", "template", "index", "untitled", "prototipo html", "prototipo", "demo", "test", "document"];
  if (!title.trim() || genericTitles.some(g => title.toLowerCase().trim() === g)) {
    issues.blockers.push(`[B2] Título de página genérico o ausente: "${title}". Debe reflejar el producto o la feature.`);
  }

  // O2 — Viewport meta
  if (!/<meta[^>]+viewport/i.test(raw)) {
    issues.observations.push("[O2] Falta meta viewport — el prototipo puede no ser responsive.");
  }

  // ── Patrón visual por dominio (B6, B7, B9) ──
  const domain = detectDomain(decisionesContent);
  const shell = detectShellPattern(raw);

  if (domain) {
    log("info", `Dominio declarado en decisiones-ux.md: "${domain}"`);
    // B9 — sidenav+tabla en dominio de consumo
    if (CONSUMER_DOMAINS.some(d => domain.includes(d))) {
      if (shell.hasSidenav && shell.hasMainTable && !shell.hasHero && !shell.hasGrid && !shell.hasVideo) {
        issues.blockers.push(`[B9] Dominio de consumo ("${domain}") usando shell genérica sidenav+tabla. Debe usar patrón propio (hero/catálogo/grid/player).`);
      }
    }
    // B6/B7 — patrones específicos
    for (const [key, req] of Object.entries(DOMAIN_REQUIREMENTS)) {
      if (domain.includes(key)) {
        const missing = req.needs.filter(p => !p.test(raw));
        if (missing.length > 0) {
          const code = key === "player" ? "B7" : key === "streaming" ? "B6" : "B-domain";
          issues.blockers.push(`[${code}] Dominio "${key}" no implementa el patrón requerido (${req.label}).`);
        }
      }
    }
  } else {
    issues.observations.push("[O4] decisiones-ux.md no declara dominio — no se puede validar B6/B7/B9.");
  }

  // ── Grading cuantitativo nivel 2 / nivel 3 ──
  // v12.61: resuelve CSS enlazado local (_shared/tokens.css, etc) para que los
  // tokens del sistema de diseño compartido cuenten en el grading.
  const linked = resolveLinkedCss(htmlPath, raw);
  if (linked.resolved.length > 0) {
    log("info", `CSS enlazado resuelto (cuenta tokens): ${linked.resolved.join(", ")}`);
  }
  // v12.90 (P4): umbral de riqueza ajustado a la complejidad declarada del spec.
  const specPath = dirname(dirname(htmlPath)); // .../specs/<slug>/prototype-html5/index.html -> .../specs/<slug>
  const complexity = readComplexity(specPath);
  const thresholds = scaleThresholds(complexity);
  const grade = gradeProto(raw, decisionesContent, linked.css, thresholds);
  metrics = grade.metrics;

  log("info", `Métricas: ${grade.metrics.lines} líneas, ${grade.metrics.cssCustomProps} tokens CSS, ${grade.metrics.mediaQueries} media queries, ${grade.metrics.distinctViews} vistas, ${grade.metrics.mockRecords} mocks, ${grade.metrics.buttons} botones${complexity !== "standard" ? ` · complejidad: ${complexity}` : ""}`);

  // Determinar nivel
  if (issues.blockers.length > 0) {
    level = 0;
  } else if (grade.meetsLevel3) {
    level = 3;
  } else if (grade.meetsLevel2) {
    level = 2;
  } else {
    level = 1;
    // Riqueza insuficiente bloquea (B1 — parece especificación, no producto)
    const t2 = thresholds.level2;
    const m = grade.metrics;
    const gaps = [];
    if (m.lines < t2.htmlLines) gaps.push(`líneas ${m.lines}<${t2.htmlLines}`);
    if (m.cssCustomProps < t2.cssCustomProps) gaps.push(`tokens CSS ${m.cssCustomProps}<${t2.cssCustomProps}`);
    if (m.mediaQueries < t2.mediaQueries) gaps.push(`media queries ${m.mediaQueries}<${t2.mediaQueries}`);
    if (m.distinctViews < t2.distinctViews) gaps.push(`vistas ${m.distinctViews}<${t2.distinctViews}`);
    if (m.mockRecords < t2.mockRecords) gaps.push(`mocks ${m.mockRecords}<${t2.mockRecords}`);
    if (m.buttons < t2.buttons) gaps.push(`botones ${m.buttons}<${t2.buttons}`);
    issues.blockers.push(`[B1] Riqueza insuficiente para nivel 2 — el prototipo se ve documental, no producto. Faltantes: ${gaps.join(", ")}.`);
    level = 0;
  }

  return { issues, level, metrics };
}

function checkSpec(specPath) {
  console.log(`\n── Spec: ${specPath}`);
  let blocked = false;
  let hasObservations = false;
  let level = 0;

  // Archivos requeridos
  for (const rel of REQUIRED_FILES) {
    const full = join(specPath, rel);
    if (existsSync(full)) {
      log("ok", rel);
    } else {
      log("warn", `Falta: ${rel}`);
      if (rel === "prototype-html5/index.html") blocked = true;
    }
  }

  // decisiones-ux.md
  const { issues: dIssues, content: decisionesContent } = checkDecisiones(specPath);
  for (const b of dIssues.blockers) { log("error", b); blocked = true; }
  for (const o of dIssues.observations) { log("warn", o); hasObservations = true; }

  // Calidad del HTML
  const htmlPath = join(specPath, "prototype-html5", "index.html");
  const { issues, level: htmlLevel } = checkHtmlFile(htmlPath, decisionesContent);
  level = htmlLevel;

  for (const b of issues.blockers) { log("error", b); blocked = true; }
  for (const o of issues.observations) { log("warn", o); hasObservations = true; }

  if (level >= 2) {
    log(level === 3 ? "bonus" : "ok", `Nivel rúbrica autoevaluado: ${level} (${level === 3 ? "Producto real" : "Aceptable"})`);
  } else {
    log("error", `Nivel rúbrica autoevaluado: ${level} (${level === 0 ? "Rechazado" : "Insuficiente"}) — gate-prototype-ready BLOQUEADO`);
  }

  return { blocked, hasObservations, level };
}

function checkHub(root) {
  console.log("\n── Hub del producto: prototype/index.html");
  const hubPath = join(root, "prototype", "index.html");
  if (!existsSync(hubPath)) {
    log("error", "[B] No existe prototype/index.html — hub obligatorio ausente.");
    return { blocked: true, hasObservations: false };
  }
  const content = stripCommentsAndScripts(readRaw(hubPath));
  const required = [
    { pattern: /journey|recorrido end.to.end/i, label: "Journey end-to-end" },
    { pattern: /actores|actor del sistema/i, label: "Actores del sistema" },
    { pattern: /cobertura|estado del prototipo/i, label: "Cobertura/Estado" },
  ];
  let obs = false;
  for (const r of required) {
    if (r.pattern.test(content)) { log("ok", r.label); }
    else { log("warn", `Sección no detectada en hub: ${r.label}`); obs = true; }
  }
  return { blocked: false, hasObservations: obs };
}

// ── Ejecución principal ───────────────────────────────────────────────────────
const root = resolve(".");
console.log("═══════════════════════════════════════════════════════");
console.log("  check-html5-prototype-quality.mjs (v2 — con grading nivel 0-3)");
console.log(`  Raíz del proyecto: ${root}`);
console.log(`  Modo strict: ${strict}`);
console.log("═══════════════════════════════════════════════════════");

const specsRoot = join(root, "specs");
const targetSpecs = specTarget
  ? [resolve(specTarget)]
  : findPrototypeSpecs(specsRoot);

if (targetSpecs.length === 0) {
  console.log("\nNo se encontraron specs con prototype-html5/index.html.");
  process.exit(0);
}

let globalBlocked = false;
let globalObservations = false;
const levels = [];

const hubResult = checkHub(root);
if (hubResult.blocked) globalBlocked = true;
if (hubResult.hasObservations) globalObservations = true;

for (const specPath of targetSpecs) {
  const result = checkSpec(specPath);
  if (result.blocked) globalBlocked = true;
  if (result.hasObservations) globalObservations = true;
  levels.push({ spec: specPath, level: result.level });
}

console.log("\n═══════════════════════════════════════════════════════");
console.log("  Resumen por spec:");
for (const { spec, level } of levels) {
  const icon = level === 3 ? "★" : level === 2 ? "✓" : "✗";
  console.log(`    ${icon} nivel ${level} — ${spec}`);
}
console.log("═══════════════════════════════════════════════════════");

if (globalBlocked) {
  console.log("  RESULTADO: BLOQUEADO — corrige los criterios B antes de continuar.");
  console.log("  gate-prototype-ready NO puede marcarse como Listo.");
  console.log("  Compara contra ejemplos/fase-2-ux-ui/prototype-html5-golden/ antes de regenerar.");
  process.exit(1);
} else if (strict && globalObservations) {
  console.log("  RESULTADO: OBSERVACIONES (modo strict) — revisar antes de validación.");
  process.exit(2);
} else if (globalObservations) {
  console.log("  RESULTADO: APROBADO con observaciones — puede avanzar, revisar antes de presentar a stakeholder.");
  process.exit(0);
} else {
  console.log("  RESULTADO: APROBADO — prototipo cumple calidad mínima nivel 2+.");
  process.exit(0);
}
