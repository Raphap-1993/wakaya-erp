#!/usr/bin/env node
/**
 * check-prototype-bidirectional-links.mjs (v12.56)
 *
 * Verifica que TODO prototipo de feature tenga link bidireccional con el hub:
 *   - prototype/index.html (hub) -> specs/NNN/prototype-html5/index.html
 *   - specs/NNN/prototype-html5/index.html -> prototype/index.html (con depth correcta)
 *
 * Cierra el patron real visto en codex post-v12.55:
 *   - Algunos prototipos tenian href="../../../../prototype/index.html" (4 niveles)
 *     cuando lo correcto desde specs/<feature>/prototype-html5/ son 3 niveles.
 *   - Hub generado sin link a alguna feature recien creada.
 *
 * Modos:
 *   --strict       exit 1 si hay links rotos.
 *   --warn         exit 0 con warning (default).
 *   --root <path>  raiz del proyecto.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // v12.59: --strict | CHECK_STRICT=1 | --warn override

const hubPath = join(root, "prototype", "index.html");
const features = listIncludedFeatures(root);

if (features.length === 0) {
  console.log(`OK. Sin features bajo specs/. Nada que validar.`);
  process.exit(0);
}

const findings = [];

// 1. Hub -> specs: cada feature con prototipo debe estar enlazada desde el hub.
let hubText = null;
if (existsSync(hubPath)) {
  hubText = readFileSync(hubPath, "utf8");
} else {
  findings.push({ kind: "missing-hub", message: `prototype/index.html no existe. Corre 'npm run prototype:hub'.` });
}

for (const slug of features) {
  const protoPath = join(root, "specs", slug, "prototype-html5", "index.html");
  if (!existsSync(protoPath)) continue; // feature sin prototipo aun, no aplica

  // 1a. El hub debe linkear a esta feature.
  if (hubText) {
    // Busca href que apunte a este slug (puede tener ?params o no).
    const linkRe = new RegExp(`href\\s*=\\s*["'][^"']*specs\\/${escapeReg(slug)}\\/prototype-html5\\/[^"']*["']`);
    if (!linkRe.test(hubText)) {
      findings.push({
        kind: "hub-missing-link",
        slug,
        message: `Hub no contiene link a specs/${slug}/prototype-html5/. Regenera con 'npm run prototype:hub'.`,
      });
    }
  }

  // 1b. El prototipo debe tener link de vuelta al hub con depth correcta.
  const protoText = readFileSync(protoPath, "utf8");
  // El path canonico desde specs/<slug>/prototype-html5/ al hub es: ../../../prototype/index.html
  const canonicalRe = /href\s*=\s*["']\.\.\/\.\.\/\.\.\/prototype\/index\.html(?:\?[^"']*)?["']/;
  const tooDeepRe = /href\s*=\s*["']\.\.\/\.\.\/\.\.\/\.\.\/+prototype\/index\.html/;     // 4+ niveles
  const tooShallowRe = /href\s*=\s*["']\.\.\/\.\.\/prototype\/index\.html(?!\/)/;          // 2 niveles
  const absoluteRe = /href\s*=\s*["']\/prototype\/index\.html/;                            // absoluto
  if (!canonicalRe.test(protoText)) {
    let detail;
    if (tooDeepRe.test(protoText)) {
      detail = "tiene href con 4+ niveles `../`, debe ser exactamente `../../../prototype/index.html`";
    } else if (tooShallowRe.test(protoText)) {
      detail = "tiene href con 2 niveles `../`, debe ser exactamente `../../../prototype/index.html`";
    } else if (absoluteRe.test(protoText)) {
      detail = "tiene href absoluto `/prototype/...`, debe ser relativo `../../../prototype/index.html`";
    } else {
      detail = "NO tiene link de vuelta al hub. Agrega `<a href=\"../../../prototype/index.html\" data-hub-link>← Hub</a>`";
    }
    findings.push({
      kind: "broken-hub-link",
      slug,
      message: `specs/${slug}/prototype-html5/index.html: ${detail}`,
    });
  }

  // 1c. El prototipo debe tener [data-hub-link] para el helper auto-show/hide.
  if (!/data-hub-link/.test(protoText)) {
    findings.push({
      kind: "missing-data-hub-link",
      slug,
      severity: "warning",
      message: `specs/${slug}/prototype-html5/index.html: link al hub sin atributo data-hub-link. El helper shared-prototype-helpers.js no podra mostrarlo automaticamente cuando viene del hub.`,
    });
  }
}

console.log(`check-prototype-bidirectional-links (v12.56)`);
console.log(`Features con prototipo:        ${features.filter((s) => existsSync(join(root, "specs", s, "prototype-html5", "index.html"))).length}/${features.length}`);
console.log(`Hub existe:                    ${hubText ? "si" : "no"}`);

const blockers = findings.filter((f) => f.severity !== "warning");
const warnings = findings.filter((f) => f.severity === "warning");

if (findings.length === 0) {
  console.log(`\nOK. Todos los prototipos tienen link bidireccional correcto.`);
  process.exit(0);
}

console.error(`\nDetectados ${blockers.length} bloqueante(s) + ${warnings.length} warning(s):`);
for (const f of findings) {
  const icon = f.severity === "warning" ? "⚠" : "✗";
  console.error(`  ${icon} [${f.kind}] ${f.message}`);
}
console.error(`\nFix sugerido:`);
console.error(`  - Para 'hub-missing-link': regenerar hub con 'npm run prototype:hub'.`);
console.error(`  - Para 'broken-hub-link': corregir href en cada prototipo afectado.`);
console.error(`    El path canonico desde specs/<slug>/prototype-html5/ es: ../../../prototype/index.html`);
console.error(`    (3 niveles arriba: prototype-html5/ -> specs/ -> root -> prototype/)`);

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
