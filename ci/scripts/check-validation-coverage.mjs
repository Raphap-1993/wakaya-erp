#!/usr/bin/env node
/**
 * check-validation-coverage.mjs (v12.55)
 *
 * Meta-validador: verifica que el script `check:project` (en package.json) ejecute
 * TODOS los validadores fisicos disponibles en `ci/scripts/check-*.mjs`.
 *
 * Cierra el patron real visto en codex post-v12.53:
 *   - El archivo fisico ci/scripts/check-prototype-cross-links.mjs existia.
 *   - PERO package.json check:project NO lo invocaba.
 *   - Resultado: el validador nunca corria en check:all aunque era requerido.
 *
 * Excepciones reconocidas (no se exigen en check:project):
 *   - check-docs.mjs (esta en check:template)
 *   - check-prototype-hub.mjs (esta en check:template)
 *   - check-ai-artifacts.mjs (esta en check:template)
 *   - check-markdown-paths.mjs (esta en check:template)
 *   - check-html5-prototype-quality.mjs (se corre per-spec, no en pipeline general)
 *   - check-template-instantiation.mjs (esta como check:instantiation)
 *   - check-validation-coverage.mjs (este meta-validador, no se autoinvoca)
 *
 * Modos:
 *   --strict       exit 1 si hay validadores fisicos no invocados.
 *   --warn         exit 0 con warning (default).
 *   --root <path>  raiz del proyecto. Default: cwd.
 *
 * Exit codes:
 *   0 - todos los validadores fisicos estan en check:project (o son excepciones).
 *   1 - hay validadores fisicos sin invocar y modo es --strict.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override

const TEMPLATE_LEVEL_VALIDATORS = new Set([
  "check-docs.mjs",
  "check-prototype-hub.mjs",
  "check-ai-artifacts.mjs",
  "check-markdown-paths.mjs",
]);
const PER_SPEC_VALIDATORS = new Set([
  "check-html5-prototype-quality.mjs",
]);
const SEPARATE_PIPELINE_VALIDATORS = new Set([
  "check-template-instantiation.mjs",
]);
const META_VALIDATORS = new Set([
  "check-validation-coverage.mjs",
]);
// v12.55: validadores condicionales que NO se incluyen en check:project por default
// porque requieren contexto especifico (CI con git base/head, o stacks/ poblado).
// Se invocan a demanda desde CI o desde stack-specific scripts.
const CI_ONLY_VALIDATORS = new Set([
  "check-github-actions.mjs",      // valida workflows .github/, CI-level
  "check-openapi-diff.mjs",        // requiere --base/--head git refs
  "check-rbac-consistency.mjs",    // stack-specific, solo si hay stacks/<x>/template/
]);

if (!existsSync(join(root, "package.json"))) {
  console.error(`Error: ${root} sin package.json. Es un proyecto valido?`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const scripts = pkg.scripts || {};
const checkProject = scripts["check:project"] || "";
const checkTemplate = scripts["check:template"] || "";
const checkAll = scripts["check:all"] || "";

const ciDir = join(root, "ci", "scripts");
if (!existsSync(ciDir)) {
  console.error(`Error: ${ciDir} no existe. Corre 'npm run template:upgrade -- --apply' si vienes de una version vieja.`);
  process.exit(1);
}

const physicalValidators = readdirSync(ciDir).filter((f) => f.startsWith("check-") && f.endsWith(".mjs"));
const physicalSet = new Set(physicalValidators);

// Que valida cada bucket?
const inTemplate = physicalValidators.filter((f) => TEMPLATE_LEVEL_VALIDATORS.has(f));
const inPerSpec = physicalValidators.filter((f) => PER_SPEC_VALIDATORS.has(f));
const inSeparate = physicalValidators.filter((f) => SEPARATE_PIPELINE_VALIDATORS.has(f));
const inMeta = physicalValidators.filter((f) => META_VALIDATORS.has(f));
const shouldBeInProject = physicalValidators.filter((f) =>
  !TEMPLATE_LEVEL_VALIDATORS.has(f) && !PER_SPEC_VALIDATORS.has(f) && !SEPARATE_PIPELINE_VALIDATORS.has(f) && !META_VALIDATORS.has(f) && !CI_ONLY_VALIDATORS.has(f)
);

// Que invoca cada pipeline?
function extractInvokedScripts(pipeline) {
  return (pipeline.match(/check:[a-z][a-z0-9-]*/g) || []);
}
// v12.60: expandir scripts compuestos (ej. check:prototype-portfolio invoca
// check:prototype-html5 + check:prototype-visible-product). Resuelve transitivamente
// hasta 1 nivel para que el meta-validador vea los validadores reales.
function expandComposite(scriptNames, allScripts) {
  const expanded = new Set(scriptNames);
  for (const name of scriptNames) {
    const def = allScripts[name.replace(/^check:/, "check:")] || allScripts[name];
    if (def && /npm run check:/.test(def)) {
      for (const sub of extractInvokedScripts(def)) expanded.add(sub);
    }
  }
  return expanded;
}
const invokedInProject = expandComposite(extractInvokedScripts(checkProject), scripts);
const invokedInTemplate = expandComposite(extractInvokedScripts(checkTemplate), scripts);

// Cross-check.
const missing = [];
for (const file of shouldBeInProject) {
  // El nombre del script npm es check:<nombre-corto>.
  const scriptName = "check:" + file.replace(/^check-/, "").replace(/\.mjs$/, "");
  if (!invokedInProject.has(scriptName)) {
    missing.push({ file, expectedScript: scriptName });
  }
}
const missingTemplate = [];
for (const file of inTemplate) {
  const scriptName = "check:" + file.replace(/^check-/, "").replace(/\.mjs$/, "");
  if (!invokedInTemplate.has(scriptName)) {
    missingTemplate.push({ file, expectedScript: scriptName });
  }
}

// Reporte.
console.log(`check-validation-coverage (v12.55)`);
console.log(`Validadores fisicos en ci/scripts/:  ${physicalValidators.length}`);
console.log(`  en check:template:                 ${inTemplate.length}`);
console.log(`  en check:project (esperados):      ${shouldBeInProject.length}`);
const inCiOnly = physicalValidators.filter((f) => CI_ONLY_VALIDATORS.has(f));
console.log(`  per-spec (no en pipeline):         ${inPerSpec.length}`);
console.log(`  separados:                         ${inSeparate.length}`);
console.log(`  meta:                              ${inMeta.length}`);
console.log(`  CI-only (no en pipeline default): ${inCiOnly.length}  (${[...inCiOnly].join(", ")})`);
console.log(``);
console.log(`Invocados en check:project:          ${invokedInProject.size}`);
console.log(`Invocados en check:template:         ${invokedInTemplate.size}`);

if (missing.length === 0 && missingTemplate.length === 0) {
  console.log(`\nOK. Todos los validadores fisicos estan invocados en su pipeline correspondiente.`);
  process.exit(0);
}

if (missing.length > 0) {
  console.error(`\n✗ Validadores fisicos NO invocados en check:project:`);
  for (const m of missing) {
    console.error(`  - ${m.file}  (deberia agregarse como '${m.expectedScript}' a check:project)`);
  }
}
if (missingTemplate.length > 0) {
  console.error(`\n✗ Validadores fisicos NO invocados en check:template:`);
  for (const m of missingTemplate) {
    console.error(`  - ${m.file}  (deberia agregarse como '${m.expectedScript}' a check:template)`);
  }
}

console.error(`\nFix sugerido:`);
console.error(`  1. Editar package.json y agregar los validadores faltantes a check:project (o check:template).`);
console.error(`  2. O corre 'node scripts/template-upgrade.mjs --root . --apply --force-scripts' para sobrescribir`);
console.error(`     check:project con el canonico del template.`);
console.error(`  3. O si el validador es ad-hoc del proyecto y NO debe correr en check:project, agregalo a la`);
console.error(`     lista de excepciones (TEMPLATE_LEVEL_VALIDATORS / PER_SPEC_VALIDATORS / etc.) en este script.`);

process.exit((missing.length + missingTemplate.length) > 0 && strict ? 1 : 0);

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
