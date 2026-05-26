/**
 * _lib/prototype-contract.mjs (v12.65)
 *
 * CONTRATO DE EJECUCION A NIVEL DE PROTOTIPO HTML5.
 *
 * Analogo a phase-contracts.mjs pero por FEATURE: define que DEBE contener el
 * prototipo de una feature concreta (no riqueza generica, sino los requisitos
 * de ESA feature) y permite verificarlo. Convierte "el prototipo es rico" en
 * "el prototipo implementa el contrato de esta feature".
 *
 * El contrato tiene dos lados:
 *   1. DERIVADO del spec-funcional.md: RFs/HUs + actores que la feature debe
 *      representar (no negociable: no puedes omitir un requisito).
 *   2. DECLARADO por el agente en decisiones-ux.md > '## Contrato del prototipo':
 *      Estados, Roles, Entidades, RF representados.
 *
 * Y se verifica (en check-prototype-contract.mjs):
 *   - Cobertura: los RF/actores del spec estan en el contrato declarado.
 *   - Implementacion: cada Estado/Rol/Entidad declarado aparece en index.html
 *     (estados via sinonimos; el prototipo debe ser interactivo).
 *
 * Consumido por:
 *   - ci/scripts/check-prototype-contract.mjs (validador bloqueante)
 *   - scripts/prototype-contract.mjs (imprime el contrato — analogo de roadmap:next)
 *   - scripts/prototype-prompt.mjs (renderiza prompt — analogo de roadmap:prompt)
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Sinonimos de estados de UI canonicos. Un estado declarado por su nombre
// canonico se considera implementado si aparece CUALQUIER sinonimo en el HTML.
export const STATE_SYNONYMS = {
  loading: /loading|cargando|spinner|skeleton/i,
  empty: /empty|sin resultado|sin coincidenc|vac[ií]o|no hay|sin datos/i,
  error: /error|fallo|fallid|no se pudo|reintentar|ha fallado/i,
  success: /success|completad|listo|aprobad|exitos|guardad|confirmad/i,
  unauthorized: /unauthorized|permission denied|denied|sin permiso|no autorizad|403|acceso denegado/i,
};

const ACTOR_STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "y", "o", "con", "para", "un", "una", "rol", "usuario", "actor"]);

function readIf(path) {
  try { return existsSync(path) ? readFileSync(path, "utf8") : ""; } catch { return ""; }
}

/** Lista limpia desde "a, b; c" -> ["a","b","c"]. */
function splitList(s) {
  return String(s || "")
    .split(/[,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Requisitos DERIVADOS del spec-funcional.md: RFs/HUs (no omitibles) + actores.
 */
export function parseSpecRequirements(root, slug) {
  const text = readIf(join(root, "specs", slug, "spec-funcional.md"));
  const rfs = [...new Set((text.match(/\b(?:RF|RNF|HU)-\d+/gi) || []).map((s) => s.toUpperCase()))];
  // Actores: seccion ## Actores (bullets o tabla).
  const actors = [];
  const m = text.match(/##\s*Actores([\s\S]*?)(?=\n##\s|$)/i);
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const l = line.trim();
      if (!l) continue;
      if (/^\|[\s-]+\|/.test(l)) continue; // separador de tabla
      let name = null;
      const bullet = l.match(/^[-*]\s+(.+)$/);
      const cell = l.match(/^\|\s*([^|]+?)\s*\|/);
      if (bullet) name = bullet[1];
      else if (cell) name = cell[1];
      if (!name) continue;
      if (/^(rol|actor|nombre)\b/i.test(name)) continue; // encabezado de tabla
      const primary = (name.split(/\s+/).find((w) => w.length > 2 && !ACTOR_STOPWORDS.has(w.toLowerCase())) || name).toLowerCase().replace(/[^a-záéíóúñ-]/gi, "");
      if (primary) actors.push({ raw: name.trim(), token: primary });
    }
  }
  return { rfs, actors };
}

/**
 * Contrato DECLARADO en decisiones-ux.md > '## Contrato del prototipo'.
 */
export function parseDeclaredContract(root, slug) {
  const text = readIf(join(root, "specs", slug, "prototype-html5", "decisiones-ux.md"));
  const sec = text.match(/##\s*Contrato\s+del\s+prototipo([\s\S]*?)(?=\n##\s|$)/i);
  const out = { hasSection: !!sec, states: [], roles: [], entities: [], rfs: [] };
  if (!sec) return out;
  const body = sec[1];
  const grab = (re) => { const mm = body.match(re); return mm ? splitList(mm[1]) : []; };
  out.states = grab(/(?:^|\n)\s*[-*]?\s*Estados?\s*:\s*([^\n]+)/i);
  out.roles = grab(/(?:^|\n)\s*[-*]?\s*Roles?\s*:\s*([^\n]+)/i);
  out.entities = grab(/(?:^|\n)\s*[-*]?\s*Entidades?\s*:\s*([^\n]+)/i);
  const rfsRaw = grab(/(?:^|\n)\s*[-*]?\s*(?:RF\s+representados?|RFs?\s+cubiertos?|RF\s*\/\s*HU|Requisitos?\s+representados?)\s*:\s*([^\n]+)/i);
  out.rfs = [...new Set(rfsRaw.flatMap((s) => (s.match(/\b(?:RF|RNF|HU)-\d+/gi) || []).map((x) => x.toUpperCase())))];
  return out;
}

/** ¿El estado declarado aparece en el HTML (via sinonimo si es canonico)? */
export function stateImplemented(html, state) {
  const key = String(state).toLowerCase().trim();
  const syn = STATE_SYNONYMS[key];
  if (syn) return syn.test(html);
  return new RegExp(escapeReg(key), "i").test(html);
}

export function isInteractive(html) {
  return /(addEventListener|onclick\s*=|data-view|data-screen|setView|showView|render\w*\()/i.test(html);
}

function escapeReg(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Contrato consolidado de una feature: spec (derivado) + declared + gaps de cobertura.
 * No lee el HTML (eso lo hace el validador); aqui solo cruzamos spec vs declarado.
 */
export function computeContract(root, slug) {
  const spec = parseSpecRequirements(root, slug);
  const declared = parseDeclaredContract(root, slug);
  const missingRfs = spec.rfs.filter((rf) => !declared.rfs.includes(rf));
  const declaredRolesLc = declared.roles.map((r) => r.toLowerCase());
  const missingActors = spec.actors.filter((a) => !declaredRolesLc.some((r) => r.includes(a.token) || a.token.includes(r.split(/\s+/)[0])));
  return {
    feature: slug,
    hasPrototype: existsSync(join(root, "specs", slug, "prototype-html5", "index.html")),
    spec,
    declared,
    coverage: { missingRfs, missingActors },
  };
}

/**
 * v12.66: cumplimiento BLOQUEANTE del contrato (las mismas reglas que
 * check-prototype-contract.mjs marca como bloqueantes), reutilizable para que
 * prototype-state.mjs refleje el contrato en el semaforo. Devuelve { ok, reasons }.
 * Recibe el html del index.html (el caller ya lo leyo).
 */
export function contractCompliance(root, slug, html) {
  const c = computeContract(root, slug);
  const reasons = [];
  if (!c.declared.hasSection) {
    reasons.push("sin '## Contrato del prototipo' en decisiones-ux.md");
    return { ok: false, reasons };
  }
  for (const rf of c.coverage.missingRfs) reasons.push(`${rf} del spec sin declarar en el contrato`);
  for (const st of c.declared.states) {
    if (!stateImplemented(html, st)) reasons.push(`estado '${st}' no implementado`);
  }
  if (c.declared.states.length > 0 && !isInteractive(html)) reasons.push("estados declarados sin interaccion");
  return { ok: reasons.length === 0, reasons };
}
