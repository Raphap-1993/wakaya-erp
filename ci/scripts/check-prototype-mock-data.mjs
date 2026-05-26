#!/usr/bin/env node
/**
 * check-prototype-mock-data.mjs (v12.86)
 *
 * Cierra la casuistica "el prototipo se quedo con datos del golden / placeholders":
 *  - ANTI-PLACEHOLDER: el index.html no debe contener tokens `<<...>>` residuales
 *    (los inserta scaffold --replace-mock y el esqueleto mock-data.json). Si quedan,
 *    el agente no termino de poner datos reales del dominio.
 *  - DATOS DECLARADOS NO CONSUMIDOS: si existe mock-data.json con entidades, el
 *    prototipo debe consumirlos (window.FEATURE_DATA / MockApi.resource / SharedSeed).
 *  - ESQUELETO SIN COMPLETAR: mock-data.json no debe seguir con el ejemplo `<<...>>`.
 *
 * Es OPT-IN por feature: si no hay mock-data.json y el html no tiene placeholders,
 * no aplica (no fuerza la convencion). Solo actua cuando hay senal real de pendiente.
 *
 * Modos: --strict | --warn (default) | --feature X | --root <path>.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);
const featureFilter = args.feature || null;

const PLACEHOLDER_RE = /<<[^<>\n]{1,80}>>/g;

const features = listIncludedFeatures(root).filter((s) => !featureFilter || s.startsWith(featureFilter));

console.log(`check-prototype-mock-data (v12.86) ${strict ? "[STRICT]" : "[WARN]"}`);

const blockers = [];
const warnings = [];
let evaluated = 0;

for (const slug of features) {
  const htmlPath = join(root, "specs", slug, "prototype-html5", "index.html");
  if (!existsSync(htmlPath)) continue;
  const html = readFileSync(htmlPath, "utf8");
  const dataPath = join(root, "specs", slug, "prototype-html5", "mock-data.json");
  const hasData = existsSync(dataPath);
  const htmlPlaceholders = [...html.matchAll(PLACEHOLDER_RE)].map((m) => m[0]);

  // Si no hay senal de pendiente, no aplica a esta feature.
  if (!hasData && htmlPlaceholders.length === 0) continue;
  evaluated += 1;

  if (htmlPlaceholders.length > 0) {
    const sample = [...new Set(htmlPlaceholders)].slice(0, 4).join(", ");
    blockers.push({ slug, kind: "placeholder-residual", message: `el index.html conserva ${htmlPlaceholders.length} placeholder(s) sin reemplazar (${sample}). Pon datos reales del dominio.` });
  }

  if (hasData) {
    let parsed = null;
    let raw = "";
    try { raw = readFileSync(dataPath, "utf8"); parsed = JSON.parse(raw); } catch {
      blockers.push({ slug, kind: "mock-data-invalido", message: "mock-data.json no es JSON valido." });
      continue;
    }
    if (/<<[^<>\n]{1,80}>>/.test(raw)) {
      blockers.push({ slug, kind: "mock-data-esqueleto", message: "mock-data.json sigue con el ejemplo `<<...>>` — declara entidades y rows reales." });
    }
    const entities = parsed && parsed.entities && typeof parsed.entities === "object" ? parsed.entities : {};
    const names = Object.keys(entities).filter((n) => n !== "ejemplo");
    if (names.length === 0) {
      warnings.push({ slug, kind: "mock-data-vacio", message: "mock-data.json no declara entidades reales (solo el ejemplo)." });
    } else {
      const consume = /FEATURE_DATA|MockApi\.resource|SharedSeed\./.test(html);
      if (!consume) {
        warnings.push({ slug, kind: "datos-no-consumidos", message: `mock-data.json declara ${names.length} entidad(es) pero el prototipo no las consume (usa MockApi.resource(FEATURE_DATA.x) / SharedSeed.resource).` });
      }
    }
  }
}

if (evaluated === 0) {
  console.log(`Sin senal de datos pendientes (sin mock-data.json ni placeholders). No aplica — OK.`);
  process.exit(0);
}
console.log(`Prototipos evaluados (con mock-data.json o placeholders): ${evaluated}`);

if (blockers.length === 0 && warnings.length === 0) {
  console.log(`\nOK. Sin placeholders residuales y los datos declarados se consumen.`);
  process.exit(0);
}
if (blockers.length > 0) {
  console.error(`\nBloqueantes (${blockers.length}):`);
  for (const b of blockers) console.error(`  ✗ [${b.kind}] specs/${b.slug}: ${b.message}`);
}
if (warnings.length > 0) {
  console.error(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.error(`  ⚠ [${w.kind}] specs/${w.slug}: ${w.message}`);
}
console.error(`\nFix sugerido:`);
console.error(`  1. Declara datos reales del dominio en specs/<slug>/prototype-html5/mock-data.json (entities -> rows).`);
console.error(`  2. Re-corre scaffold:prototype para cablear window.FEATURE_DATA (o agrega el <script> a mano).`);
console.error(`  3. Consume los datos: MockApi.resource(FEATURE_DATA.<entidad>); entidades compartidas: "shared": true -> SharedSeed.resource("<entidad>").`);

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
