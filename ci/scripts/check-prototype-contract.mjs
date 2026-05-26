#!/usr/bin/env node
/**
 * check-prototype-contract.mjs (v12.65)
 *
 * Valida el CONTRATO DE EJECUCION del prototipo HTML5 por feature. Cierra el
 * nivel prototipo igual que roadmap:audit cierra el nivel fase: ya no basta con
 * que el prototipo sea "rico" (conteos genericos), debe IMPLEMENTAR el contrato
 * de ESTA feature y CUBRIR sus requisitos.
 *
 * BLOQUEA (cada uno es finding):
 *   1. no-contract-section  — decisiones-ux.md sin '## Contrato del prototipo'.
 *   2. rf-not-in-contract   — un RF/RNF/HU del spec-funcional no esta declarado
 *                             en el contrato (no puedes omitir un requisito).
 *   3. state-not-implemented — un Estado declarado no aparece en index.html
 *                             (via sinonimos si es canonico).
 *   4. non-interactive      — hay estados declarados pero el HTML no es interactivo.
 *
 * WARNING (no bloquea):
 *   - actor-not-in-contract  — un actor del spec no esta entre los Roles declarados.
 *   - role-not-implemented   — un Rol declarado no aparece en index.html.
 *   - entity-not-implemented — una Entidad declarada no aparece en index.html.
 *
 * Solo evalua features con prototype-html5/index.html (las demas se saltan).
 *
 * Modos: --strict | --warn (default segun CHECK_STRICT) | --feature X | --root <path>.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";
import { computeContract, stateImplemented, isInteractive } from "./_lib/prototype-contract.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args);
const featureFilter = args.feature || null;

const features = listIncludedFeatures(root).filter((s) => !featureFilter || s.startsWith(featureFilter));
const blockers = [];
const warnings = [];
let evaluated = 0;

for (const slug of features) {
  const protoPath = join(root, "specs", slug, "prototype-html5", "index.html");
  if (!existsSync(protoPath)) continue; // sin prototipo -> no aplica
  evaluated += 1;
  const html = readFileSync(protoPath, "utf8");
  const c = computeContract(root, slug);

  // 1. Seccion de contrato presente.
  if (!c.declared.hasSection) {
    blockers.push({ slug, kind: "no-contract-section", message: "decisiones-ux.md sin seccion '## Contrato del prototipo' (Estados / Roles / Entidades / RF representados)." });
    continue; // sin contrato no hay nada mas que verificar
  }

  // 2. Cobertura de RFs del spec.
  for (const rf of c.coverage.missingRfs) {
    blockers.push({ slug, kind: "rf-not-in-contract", message: `${rf} del spec-funcional.md no esta en 'RF representados' del contrato (no se puede omitir un requisito de la feature).` });
  }

  // 3. Implementacion de estados declarados.
  for (const st of c.declared.states) {
    if (!stateImplemented(html, st)) {
      blockers.push({ slug, kind: "state-not-implemented", message: `el estado declarado '${st}' no aparece en index.html (ni por sinonimo). Implementalo o quitalo del contrato.` });
    }
  }

  // 4. Interactividad si hay estados.
  if (c.declared.states.length > 0 && !isInteractive(html)) {
    blockers.push({ slug, kind: "non-interactive", message: "el contrato declara estados pero el index.html no tiene interaccion (addEventListener/onclick/data-view). Los estados deben ser comportamiento, no texto." });
  }

  // Warnings: cobertura de actores + implementacion de roles/entidades.
  for (const a of c.coverage.missingActors) {
    warnings.push({ slug, kind: "actor-not-in-contract", message: `el actor '${a.raw}' del spec no esta entre los Roles del contrato.` });
  }
  for (const role of c.declared.roles) {
    if (!new RegExp(escapeReg(role), "i").test(html)) {
      warnings.push({ slug, kind: "role-not-implemented", message: `el rol declarado '${role}' no aparece en index.html.` });
    }
  }
  for (const ent of c.declared.entities) {
    if (!new RegExp(escapeReg(ent), "i").test(html)) {
      warnings.push({ slug, kind: "entity-not-implemented", message: `la entidad declarada '${ent}' no aparece en index.html.` });
    }
  }
}

console.log(`check-prototype-contract (v12.65) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`Features con prototipo evaluadas: ${evaluated}`);

if (blockers.length === 0 && warnings.length === 0) {
  console.log(`\nOK. Cada prototipo declara su contrato e implementa estados + cubre los RF/actores de su spec.`);
  process.exit(0);
}

if (blockers.length > 0) {
  console.error(`\nBloqueantes (${blockers.length}):`);
  for (const f of blockers) console.error(`  ✗ [${f.kind}] specs/${f.slug}: ${f.message}`);
}
if (warnings.length > 0) {
  console.error(`\nWarnings (${warnings.length}):`);
  for (const f of warnings) console.error(`  ⚠ [${f.kind}] specs/${f.slug}: ${f.message}`);
}

console.error(`\nQue significa:`);
console.error(`  El prototipo debe representar los requisitos de SU feature (no solo ser "rico").`);
console.error(`  Declara el contrato en decisiones-ux.md > '## Contrato del prototipo' e implementalo.`);
console.error(`\nVer que debe contener: npm run prototype:contract -- --feature <slug>`);

const failed = blockers.length > 0;
process.exit(failed && strict ? 1 : 0);

function escapeReg(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
