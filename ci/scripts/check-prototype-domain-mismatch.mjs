#!/usr/bin/env node
/**
 * check-prototype-domain-mismatch.mjs (v12.56)
 *
 * Detecta que un prototipo scaffoldado desde un golden mantiene mock data
 * del dominio del golden (en lugar del dominio real de la feature).
 *
 * Ejemplo real visto en codex case:
 *   - specs/002-cambio-estado-expediente fue scaffoldada con domain=operativo.
 *   - El golden saas-operativo-bandeja tiene strings como "Roberto Gomez",
 *     "MRN-44218" (en realidad ese era del HIPAA golden, pero ya entiendes la idea).
 *   - El prototipo final aun tenia "Roberto" sin adaptar al dominio cristiano.
 *
 * Estrategia:
 *   1. Leer el marker `<!-- scaffold-prototype: ... golden=X ... -->` del HTML.
 *   2. Extraer los textos "visibles" caracteristicos del golden referido.
 *   3. Buscar esos textos en el prototipo. Si aparecen, es probable que el
 *      agente no adapto el mock data.
 *   4. Reportar como warning (puede ser falso positivo si nombres comunes
 *      accidentalmente coinciden) o blocker en --strict si hay >5 matches.
 *
 * Modos:
 *   --strict       exit 1 si hay matches >= threshold.
 *   --warn         exit 0 con warning (default).
 *   --threshold N  numero minimo de matches para reportar (default 3).
 *   --root <path>  raiz del proyecto.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override
const threshold = Number(args.threshold ?? 3);

// Textos caracteristicos por golden. Strings que aparecen en el mock data
// del golden y que NO deberian aparecer en otro dominio.
// Extraidos manualmente de los goldens canonicos.
const GOLDEN_FINGERPRINTS = {
  "saas-operativo-bandeja": [
    "Maria Vega", "Roberto Gomez", "Carmen Lopez", "EXP-2026", "bandeja", "expediente",
  ],
  "streaming-catalogo-player": [
    "FaithStream", "Genesis Kids", "Marcos", "PIN", "modo niños", "adoración",
  ],
  "salud-hipaa-clinico": [
    "MedRecord", "MRN-44218", "Gomez, Roberto", "Sanchez, Ana Maria", "PHI", "Dra. Vega", "troponina",
  ],
  "erp-multimodulo-financiero": [
    "OmniERP", "Acme Holdings", "Luis Vargas", "asiento contable", "partida doble", "S/", "RUC 20512345678",
  ],
  "logistica-tracking-flota": [
    "FleetOps", "Carlos Gutierrez", "SHP-44892", "FLT-042", "Almacen Lurin", "Jose Pérez",
  ],
  "educacion-colegio-sis": [
    "EduCol", "Colegio San Pedro", "Aguirre Lopez, Ana Sofia", "EST-2026-0042", "Carmen Lopez Vasquez",
  ],
  "educacion-superior-lms": [
    "UniLearn", "Dr. Andres Torres", "CS-3201", "Castaneda, Ana", "U20201234", "Algoritmos y Estructuras",
  ],
  "retail-pos-terminal": [
    "ShopPOS", "Inca Kola", "Luis Ramirez", "SKU-7501", "Pan Frances", "Arroz Costeno",
  ],
  "iot-industrial-sensores": [
    "FactoryIQ", "Roberto Mendoza", "SENS-A-T1", "VIB-A-M5", "Planta Lurin", "Reactor R-1",
  ],
  "insurtech-polizas-claims": [
    "InsureNow", "Sandra Vargas", "POL-AUT-2026", "Familia Vasquez Lopez", "Dr. Aliaga", "Clinica San Pablo",
  ],
  "ecommerce-checkout": [
    "ShopMart", // si existe...
  ],
  "dashboard-analytics-kpi": [],
  "dashboard-analytics": [],
  "mobile-first-app": [],
  "formulario-complejo": [],
  "educacion-leccion": [],
};

const features = listIncludedFeatures(root);
const findings = [];

for (const slug of features) {
  const protoPath = join(root, "specs", slug, "prototype-html5", "index.html");
  if (!existsSync(protoPath)) continue;
  const text = readFileSync(protoPath, "utf8");

  // Extraer el golden referido del marker.
  const markerMatch = text.match(/<!--\s*scaffold-prototype:[^>]*golden=([a-z0-9-]+)[^>]*-->/i);
  if (!markerMatch) continue; // sin marker, no fue scaffoldado, no aplica
  const golden = markerMatch[1];
  const fingerprints = GOLDEN_FINGERPRINTS[golden] || [];
  if (fingerprints.length === 0) continue;

  // Buscar matches.
  const matches = [];
  for (const fp of fingerprints) {
    // Skip si el fingerprint coincide con el slug propio (auto-coincidencia, falso positivo).
    if (slug.toLowerCase().includes(fp.toLowerCase())) continue;
    const re = new RegExp(escapeReg(fp), "gi");
    const found = [...text.matchAll(re)];
    if (found.length > 0) matches.push({ fp, count: found.length });
  }

  if (matches.length >= threshold) {
    findings.push({
      slug,
      golden,
      matches,
      total: matches.reduce((a, b) => a + b.count, 0),
    });
  } else if (matches.length > 0) {
    findings.push({
      slug,
      golden,
      matches,
      total: matches.reduce((a, b) => a + b.count, 0),
      severity: "warning",
    });
  }
}

console.log(`check-prototype-domain-mismatch (v12.56)`);
console.log(`Features con prototipo scaffoldado: ${features.length}`);
console.log(`Threshold de matches:               ${threshold}`);

const blockers = findings.filter((f) => f.severity !== "warning");
const warnings = findings.filter((f) => f.severity === "warning");

if (findings.length === 0) {
  console.log(`\nOK. Ningun prototipo tiene mock data del golden sin adaptar.`);
  process.exit(0);
}

console.error(`\nDetectados ${blockers.length} bloqueante(s) + ${warnings.length} warning(s) de dominio no adaptado:`);
for (const f of findings) {
  const icon = f.severity === "warning" ? "⚠" : "✗";
  console.error(`  ${icon} specs/${f.slug}/prototype-html5/index.html`);
  console.error(`     scaffoldado desde golden: ${f.golden}`);
  console.error(`     ${f.matches.length} fingerprints del golden encontrados (${f.total} ocurrencias):`);
  for (const m of f.matches.slice(0, 5)) {
    console.error(`       - "${m.fp}" x ${m.count}`);
  }
  if (f.matches.length > 5) console.error(`       ... y ${f.matches.length - 5} mas.`);
}
console.error(`\nFix sugerido:`);
console.error(`  1. Adaptar el mock data del prototipo al dominio real de la feature.`);
console.error(`     Reemplazar nombres/IDs/registros del golden por los del proyecto.`);
console.error(`  2. Si NO quieres validar este prototipo, agrega al HTML:`);
console.error(`     <!-- scaffold-prototype-domain-check: skip -->`);
console.error(`  3. Re-scaffoldar con --replace-mock para placeholders explicitos:`);
console.error(`     npm run scaffold:prototype -- --feature <slug> --replace-mock --force`);

process.exit(blockers.length > 0 && strict ? 1 : 0);

function escapeReg(s) {
  return s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
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
