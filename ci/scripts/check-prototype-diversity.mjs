#!/usr/bin/env node
/**
 * check-prototype-diversity.mjs (v12.61)
 *
 * Detecta clones de prototipos HTML5 entre features.
 *
 * v12.61: en modo portfolio-spa los prototipos comparten infraestructura en
 * specs/_shared/ (tokens.css, mock-api.js, app-state.js, ui.js). Esas
 * referencias se EXCLUYEN del hash de estructura — compartir helpers de bajo
 * nivel no es clonar el dominio. Ver hashStructure().
 *
 * Causa raiz cubierta: el segundo audit profundo de codex revelo que el agente
 * genero las 8 features con prototipos de EXACTAMENTE 392 lineas, mismo mock
 * data (16 contenidos identicos), misma estructura HTML+JS, solo variando el
 * color HSL (+19° entre features) y el titulo de h1. Esto significa que el
 * agente clono un template entre features en vez de adaptarlo al dominio
 * especifico de cada una.
 *
 * Heuristicas de deteccion:
 *   1. Mismo numero de lineas (±5) entre 3+ features = sospecha de plantilla clonada.
 *   2. Hash de estructura (HTML stripped de mock data + colores) >= 95% identico = clon.
 *   3. Mock data identico (mismos textos en >= 80% de las celdas) entre 2 features = clon.
 *
 * Modos (v12.97: STRICT por DEFAULT — clonar nunca es aceptable):
 *   (default)       bloquea (exit 1) si detecta clones. NO requiere --strict.
 *   --warn          baja a solo-warning (exit 0). Opt-out explicito (CI de aprendizaje).
 *   --strict        redundante (ya es el default); se mantiene por compatibilidad.
 *   --root <path>   directorio raiz del proyecto. Default: cwd.
 *   --db <path>     BD opcional (no se usa actualmente; reservado).
 *
 * Por que default strict (v12.97): el `--strict` en el pipeline `check:project`
 * (package.json) NO se propaga a proyectos ya instanciados — `template:upgrade
 * --force-framework` refresca los archivos ci/scripts/ pero no reescribe el
 * package.json del proyecto. Caso real (cristiano.cloudev1): el validador tenia la
 * logica golden-skeleton pero su check:project lo corria sin --strict -> warn ->
 * check:all paso en verde con 7 prototipos copiados verbatim del golden. Con default
 * strict, basta refrescar el ARCHIVO del validador para que el bloqueo se active.
 *
 * Exit codes:
 *   0 - todas las features tienen prototipos diversos (o --warn).
 *   1 - se detectaron clones y modo es --strict.
 *
 * Verificado contra plataforma-app-cristiano.codex (8 features, todas 392 lineas)
 * — deberia detectar las 7 como clones del primer prototipo.
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true); // v12.97: STRICT por DEFAULT; --warn baja a solo-reporte
const specsRoot = join(root, "specs");

if (!existsSync(specsRoot)) {
  console.log("OK. No existe specs/ — nada que validar.");
  process.exit(0);
}

const features = [];
for (const entry of readdirSync(specsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^\d{3,}-/.test(entry.name)) continue;
  const protoPath = join(specsRoot, entry.name, "prototype-html5", "index.html");
  if (!existsSync(protoPath)) continue;
  const stat = statSync(protoPath);
  if (stat.size === 0) continue;
  const raw = readFileSync(protoPath, "utf8");
  const goldenMarker = (raw.match(/<!--\s*scaffold-prototype:[^>]*golden=([a-z0-9-]+)[^>]*-->/i) || [])[1] || null;
  features.push({
    slug: entry.name,
    path: `specs/${entry.name}/prototype-html5/index.html`,
    lines: raw.split(/\r?\n/).length,
    bytes: stat.size,
    raw,
    // Hash de estructura: removemos mock data textual y colores para comparar shape pura.
    structureHash: hashStructure(raw),
    // v12.92 (F2): firmas estructurales para similitud difusa vs el golden.
    sigs: structureSignatures(raw),
    golden: goldenMarker,
    // Hash de mock data: solo textos visibles para detectar mock identico.
    mockHash: hashMockData(raw),
  });
}

const findings = [];

// v12.92/F2 + v12.100: comparacion contra los goldens. Cada prototipo se compara
// contra TODOS los goldens disponibles (mejor coincidencia), NO solo el del marker.
// Cierra los huecos del camino golden (doble-check):
//   - copia verbatim SIN marker scaffold-prototype (agente copia el archivo a mano),
//   - marker con golden INEXISTENTE (caso real cristiano 006: golden=saas-operativo-cola),
//   - marker que apunta a OTRO golden del que realmente se copio.
// Si la mejor similitud >= umbral, el prototipo NO fue rediseñado -> bloquea.
// v12.93: umbral CONFIGURABLE (default 0.75). Precedencia:
//   --golden-sim-threshold > env SPDD_GOLDEN_SIM_THRESHOLD > template.config.json
//   (prototype.golden_sim_threshold) > default. Margen verificado: el 001 del template
//   (redisenado) queda en 68%; una copia verbatim ~100%.
const GOLDEN_SIM_THRESHOLD = resolveGoldenSimThreshold(args, root);
const goldenSigs = {};
const goldensDir = join(root, "ejemplos", "fase-2-ux-ui", "prototype-html5-golden");
if (existsSync(goldensDir)) {
  for (const d of readdirSync(goldensDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const gp = join(goldensDir, d.name, "index.html");
    if (!existsSync(gp)) continue;
    try { goldenSigs[d.name] = structureSignatures(readFileSync(gp, "utf8")); } catch { /* skip */ }
  }
}
for (const f of features) {
  let best = 0;
  let bestName = null;
  for (const [gname, gsigs] of Object.entries(goldenSigs)) {
    const sim = jaccardSim(f.sigs, gsigs);
    if (sim > best) { best = sim; bestName = gname; }
  }
  if (best >= GOLDEN_SIM_THRESHOLD) {
    const mislabel = f.golden && f.golden !== bestName ? ` (el marker dice golden="${f.golden}", pero coincide con "${bestName}")` : "";
    findings.push({
      kind: "golden-skeleton",
      severity: "blocker",
      message: `${f.slug}: el prototipo es ≈ el ESQUELETO del golden "${bestName}" (similitud ${(best * 100).toFixed(0)}%)${mislabel}. No lo rediseñaste — dale estructura propia (layout/componentes/jerarquia) manteniendo la marca del producto, o usa --freeform.`,
      affected: [f.path],
    });
  }
}

// v12.99 (C): el ANDAMIAJE neutro de --freeform no se puede entregar sin rediseñar.
// El starter trae el centinela `spdd:freeform-starter`; si sigue presente, el agente
// no lo rediseño -> bloquea (mismo espiritu que golden-skeleton, para freeform).
for (const f of features) {
  if (/spdd:freeform-starter/i.test(f.raw)) {
    findings.push({
      kind: "freeform-skeleton",
      severity: "blocker",
      message: `${f.slug}: el prototipo sigue siendo un ANDAMIAJE de scaffold sin rediseñar (centinela "spdd:freeform-starter" presente — starter --freeform o placeholder de scaffold-feature). Diseña la UI real del dominio y borra ese comentario.`,
      affected: [f.path],
    });
  }
}

// Con <2 features no hay comparacion ENTRE features (los loops siguientes no producen
// nada), pero F2 (vs golden) ya corrio arriba y el reporte final maneja sus findings.

// 1. Lineas casi identicas entre 3+ features (clon sistematico).
const lineGroups = new Map();
for (const f of features) {
  const bucket = Math.round(f.lines / 5) * 5; // bucket de 5 lineas
  if (!lineGroups.has(bucket)) lineGroups.set(bucket, []);
  lineGroups.get(bucket).push(f);
}
for (const [bucket, group] of lineGroups) {
  if (group.length >= 5) {
    findings.push({
      kind: "clone-lines",
      severity: "blocker",
      message: `${group.length} features con prototipos de ~${bucket} lineas (±5). Evidencia fuerte de clonacion sistematica del mismo template entre features.`,
      affected: group.map((g) => g.path),
    });
  } else if (group.length >= 3) {
    findings.push({
      kind: "clone-lines",
      severity: "warning",
      message: `${group.length} features tienen prototipos de ~${bucket} lineas (±5). Posible clonacion de template.`,
      affected: group.map((g) => g.path),
    });
  }
}

// 2. Hash de estructura >= 95% (clon estructural).
for (let i = 0; i < features.length; i += 1) {
  for (let j = i + 1; j < features.length; j += 1) {
    const a = features[i];
    const b = features[j];
    if (a.structureHash === b.structureHash) {
      findings.push({
        kind: "clone-structure",
        severity: "blocker",
        message: `Estructura HTML identica entre ${a.slug} y ${b.slug} (hash ${a.structureHash.slice(0, 8)}).`,
        affected: [a.path, b.path],
      });
    }
  }
}

// 3. Mock data identico (mismas tablas, mismos textos).
for (let i = 0; i < features.length; i += 1) {
  for (let j = i + 1; j < features.length; j += 1) {
    const a = features[i];
    const b = features[j];
    if (a.mockHash === b.mockHash && a.mockHash.length > 8) {
      findings.push({
        kind: "clone-mock",
        severity: "blocker",
        message: `Mock data identico entre ${a.slug} y ${b.slug} (los registros de muestra no fueron adaptados al dominio).`,
        affected: [a.path, b.path],
      });
    }
  }
}

// Reporte.
if (findings.length === 0) {
  console.log(`OK. ${features.length} prototipos verificados. Diversidad correcta — cada feature tiene contenido propio.`);
  process.exit(0);
}

const blockers = findings.filter((f) => f.severity === "blocker");
const warnings = findings.filter((f) => f.severity === "warning");

console.error(`Detectados ${blockers.length} bloqueante(s) + ${warnings.length} warning(s) de diversidad de prototipos.\n`);
for (const f of findings) {
  const icon = f.severity === "blocker" ? "✗" : "⚠";
  console.error(`  ${icon} [${f.kind}] ${f.message}`);
  for (const a of f.affected) console.error(`      - ${a}`);
}

console.error(`\nQue significa esto?`);
console.error(`Verificado contra agentes reales (codex genero 8 features con prototipos de 392 lineas exactas).`);
console.error(`Cuando un agente clona el mismo template entre features, indica que NO leyo`);
console.error(`spec-funcional.md de cada feature para adaptar mock data + actores + casos de uso.\n`);
console.error(`Fix sugerido:`);
console.error(`  1. Para cada feature, regenerar el prototipo leyendo su spec-funcional.md:`);
console.error(`     npm run scaffold:prototype -- --feature <slug> --domain <dominio> --titulo "..." --marca "..." --force`);
console.error(`  2. Adaptar mock data REAL del dominio de cada feature (no copiar entre ellas).`);
console.error(`  3. Si dos features SI son legitimamente similares, justificar en decisiones-ux.md`);
console.error(`     y agregar al menos 50 lineas de contenido especifico (sub-componente diferenciador).`);
console.error(`\nUmbral de similitud vs golden: ${(GOLDEN_SIM_THRESHOLD * 100).toFixed(0)}% (ajustable: template.config.json`);
console.error(`  > prototype.golden_sim_threshold, env SPDD_GOLDEN_SIM_THRESHOLD, o --golden-sim-threshold).`);

process.exit(strict ? 1 : 0);

// ─────────────────────────────────────────────────────────────────────────
// v12.93: resuelve el umbral de similitud vs golden (0..1). flag > env > config > default.
function resolveGoldenSimThreshold(a, rootDir) {
  const valid = (v) => { const n = Number(v); return !Number.isNaN(n) && n > 0 && n <= 1 ? n : null; };
  if (a["golden-sim-threshold"] != null && a["golden-sim-threshold"] !== true) {
    const v = valid(a["golden-sim-threshold"]); if (v != null) return v;
  }
  if (process.env.SPDD_GOLDEN_SIM_THRESHOLD) {
    const v = valid(process.env.SPDD_GOLDEN_SIM_THRESHOLD); if (v != null) return v;
  }
  try {
    const cfg = JSON.parse(readFileSync(join(rootDir, "template.config.json"), "utf8"));
    const v = valid(cfg?.prototype?.golden_sim_threshold); if (v != null) return v;
  } catch { /* sin config: default */ }
  return 0.75; // v12.93: bajado de 0.82 para cazar clones con retoques menores.
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

/**
 * Hash de estructura: limpia mock data, colores hsl/hex, numeros, fechas, textos largos.
 * Lo que queda es la "forma" del HTML+CSS+JS — si dos hashes son iguales, los archivos
 * son estructuralmente identicos (con cambios solo en datos/colores).
 */
function normalizeStructure(html) {
  let s = html;
  // Quita scaffold marker (no es parte de la estructura)
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  // v12.61: ignora referencias a specs/_shared/ (modo portfolio-spa). Compartir
  // tokens.css / mock-api.js / app-state.js / ui.js es infraestructura comun,
  // NO clonacion de dominio. Quitamos cualquier <link>/<script>/@import que
  // apunte a _shared/ para que la similitud refleje el contenido del dominio.
  s = s.replace(/<(?:link|script)\b[^>]*_shared\/[^>]*>(?:<\/script>)?/gi, "");
  s = s.replace(/@import[^;]*_shared\/[^;]*;/gi, "");
  // Normaliza colores hex y hsl/hsla.
  s = s.replace(/#[0-9a-fA-F]{3,8}\b/g, "#XXX");
  s = s.replace(/hsla?\([^)]+\)/gi, "hsl(X)");
  s = s.replace(/rgba?\([^)]+\)/gi, "rgb(X)");
  // Normaliza numeros (mock IDs, fechas, contadores).
  s = s.replace(/\d{2,}/g, "N");
  // Quita textos largos visibles (>20 chars dentro de etiquetas).
  s = s.replace(/>([^<>]{20,})</g, ">TXT<");
  // Quita atributos style inline largos (decoraciones).
  s = s.replace(/style\s*=\s*"[^"]*"/gi, 'style="X"');
  // Comprime whitespace.
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function hashStructure(html) {
  return createHash("sha256").update(normalizeStructure(html)).digest("hex");
}

// v12.92 (F2): firma estructural = secuencia de <tag.clase> del HTML normalizado.
// Permite medir SIMILITUD (no solo igualdad exacta) contra el golden de origen.
function structureSignatures(html) {
  const s = normalizeStructure(html);
  const sigs = [];
  const re = /<([a-z][a-z0-9]*)\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(s)) !== null) {
    const tag = m[1].toLowerCase();
    const clsMatch = m[2].match(/class\s*=\s*["']([^"']*)["']/i);
    const cls = clsMatch ? clsMatch[1].trim().split(/\s+/).filter(Boolean).sort().join(".") : "";
    sigs.push(cls ? `${tag}.${cls}` : tag);
  }
  return sigs;
}

// Similitud Jaccard sobre el conjunto de firmas unicas (0..1).
function jaccardSim(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  return inter / (A.size + B.size - inter);
}

/**
 * Hash de mock data: extrae solo textos visibles entre etiquetas y los hashea.
 * Si dos features tienen los mismos 20 nombres en sus tablas, el hash sera identico.
 */
function hashMockData(html) {
  // Texto visible: contenido entre etiquetas, excluyendo scripts/styles.
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const texts = [];
  const re = />\s*([^<>][^<>]{2,})\s*</g;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    const t = m[1].trim();
    // Filtrar entidades HTML, headings/labels muy cortos.
    if (t.length < 3) continue;
    if (/^&\w+;$/.test(t)) continue;
    texts.push(t.toLowerCase());
  }
  // Dedup y orden para hash estable.
  const uniq = [...new Set(texts)].sort();
  return createHash("sha256").update(uniq.join("|")).digest("hex");
}
