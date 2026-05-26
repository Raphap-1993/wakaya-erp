#!/usr/bin/env node
/**
 * check-prototype-visible-product.mjs (v12.60) — ANTI-TRAMPA
 *
 * Cierra la grieta donde un agente puede "declarar nivel 3" sin que el prototipo
 * sea producto visible real. El quality-checker mide conteos estaticos (lineas,
 * tokens, vistas) que un agente puede inflar con fixtures ocultos. Este validador
 * detecta esas trampas + exige revision visual humana real.
 *
 * BLOQUEA (cada uno es un finding):
 *   1. <template hidden> o elementos ocultos con señales de validacion/fixture.
 *   2. Clases .validation-only / .test-fixture / .metrics-filler.
 *   3. display:none / visibility:hidden / opacity:0 aplicado a mock records
 *      (heuristica: bloques ocultos con >3 elementos repetidos = inflado de metricas).
 *   4. decisiones-ux.md SIN "Golden de referencia".
 *   5. Estados UI declarados SOLO como texto (sin interaccion real: onclick/addEventListener/data-view).
 *   6. Renderer generico unico (mini-app.js / app-renderer que define toda la UI) — anti shell-clon.
 *   7. Revision visual humana ausente o auto-aprobada por IA (anti self-approval):
 *      - prototype-validation.md debe tener seccion '## Revision visual humana'.
 *      - Resultado: approved requiere Revisor que NO sea agente/IA + Fecha + Evidencia revisada.
 *
 * Modos:
 *   --strict       exit 1 si hay findings (default segun CHECK_STRICT/--strict).
 *   --warn         exit 0 (solo reporta).
 *   --feature X    valida solo una feature.
 *   --root <path>  raiz del proyecto.
 *
 * Nota: este validador SOLO evalua specs que YA tienen prototype-html5/index.html.
 * Features sin prototipo se saltan (no fallan) — coherente con quality-checker.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { listIncludedFeatures } from "./_lib/feature-filter.mjs";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args); // --strict | CHECK_STRICT=1 | --warn override
const featureFilter = args.feature || null;

// Revisores que NO cuentan como humano (anti self-approval).
const NON_HUMAN_REVIEWERS = /\b(agente|agent|ia\b|a\.?i\.?|claude|gpt|codex|copilot|gemini|cursor|opencode|bot|automatico|automatic|sistema|script)\b/i;

const features = listIncludedFeatures(root).filter((s) => !featureFilter || s.startsWith(featureFilter));
const findings = [];

for (const slug of features) {
  const protoPath = join(root, "specs", slug, "prototype-html5", "index.html");
  if (!existsSync(protoPath)) continue; // sin prototipo aun -> no aplica
  const html = readFileSync(protoPath, "utf8");
  const decisionesPath = join(root, "specs", slug, "prototype-html5", "decisiones-ux.md");
  const validationPath = join(root, "specs", slug, "prototype-validation.md");

  // 1. <template hidden> con señales de validacion.
  if (/<template[^>]*\bhidden\b[^>]*>[\s\S]*?(valid|fixture|metric|test-only)/i.test(html)) {
    findings.push({ slug, kind: "hidden-template-fixture", message: "<template hidden> con contenido de validacion/fixture (inflado de metricas)." });
  }

  // 2. Clases prohibidas.
  for (const cls of ["validation-only", "test-fixture", "metrics-filler", "validation-fixture"]) {
    if (new RegExp(`class\\s*=\\s*["'][^"']*\\b${cls}\\b`, "i").test(html)) {
      findings.push({ slug, kind: "forbidden-class", message: `clase prohibida .${cls} (señal de fixture oculto para validadores).` });
    }
  }

  // 3. display:none / visibility:hidden con bloques repetidos (mock records inflados).
  //    Heuristica: un contenedor con display:none que contiene >3 <tr>/<li>/<article>/<div class=card>.
  const hiddenBlocks = [...html.matchAll(/style\s*=\s*["'][^"']*(display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)[^"']*["'][^>]*>([\s\S]{0,2000}?)<\/(div|section|ul|tbody|table)>/gi)];
  for (const m of hiddenBlocks) {
    const inner = m[2] || "";
    const repeated = (inner.match(/<(tr|li|article)\b/gi) || []).length;
    if (repeated >= 3) {
      findings.push({ slug, kind: "hidden-mock-records", message: `bloque oculto (display:none/hidden) con ${repeated} registros — posible inflado de mockRecords para pasar el quality-checker.` });
      break;
    }
  }

  // 4. decisiones-ux.md sin Golden de referencia.
  if (existsSync(decisionesPath)) {
    const dec = readFileSync(decisionesPath, "utf8");
    if (!/golden/i.test(dec)) {
      findings.push({ slug, kind: "no-golden-ref", message: "decisiones-ux.md no declara 'Golden de referencia' (obligatorio en fase 2)." });
    }
  } else {
    findings.push({ slug, kind: "no-decisiones-ux", message: "falta prototype-html5/decisiones-ux.md (pre-flight de decisiones visuales)." });
  }

  // 5. Estados UI solo como texto, sin interaccion. Heuristica: menciona loading/error/empty
  //    pero NO hay handlers de interaccion (addEventListener / onclick / data-view / setView).
  const mentionsStates = /(loading|cargando|empty|sin datos|error|reintentar)/i.test(html);
  const hasInteraction = /(addEventListener|onclick\s*=|data-view|data-screen|setView|showView|render\w*\()/i.test(html);
  if (mentionsStates && !hasInteraction) {
    findings.push({ slug, kind: "states-text-only", message: "estados UI (loading/empty/error) mencionados pero SIN interaccion real (sin addEventListener/onclick/data-view). Deben ser comportamiento, no texto." });
  }

  // 6. Renderer generico unico (anti shell-clon). Detecta import a mini-app/app-renderer/ui-factory
  //    que define TODA la UI (no solo helpers de bajo nivel permitidos).
  if (/<script[^>]+src\s*=\s*["'][^"']*(mini-app|app-renderer|ui-factory|render-all|app-shell)\.m?js/i.test(html)) {
    findings.push({ slug, kind: "generic-renderer", message: "usa un renderer generico unico (mini-app/app-renderer/etc). Permitido: tokens/toast/modal/mock-api/app-state. NO permitido: una fabrica que define todo el layout del dominio." });
  }

  // 7. Revision visual humana (anti self-approval).
  if (!existsSync(validationPath)) {
    findings.push({ slug, kind: "no-validation-file", message: "falta prototype-validation.md." });
  } else {
    const val = readFileSync(validationPath, "utf8");
    const reviewSection = val.match(/##\s*Revision\s+visual\s+humana([\s\S]*?)(?=\n##\s|$)/i);
    if (!reviewSection) {
      findings.push({ slug, kind: "no-human-review-section", message: "prototype-validation.md sin seccion '## Revision visual humana' (obligatoria v12.60)." });
    } else {
      const sec = reviewSection[1];
      const resultMatch = sec.match(/Resultado\s*:\s*(approved|aprobado|blocked|bloqueado|pending|pendiente)/i);
      const result = resultMatch ? resultMatch[1].toLowerCase() : null;
      if (result === "approved" || result === "aprobado") {
        // Exigir revisor humano + fecha + evidencia.
        const reviewer = (sec.match(/Revisor\s*:\s*(.+)/i) || [])[1] || "";
        const fecha = (sec.match(/Fecha\s*:\s*(.+)/i) || [])[1] || "";
        const evidencia = (sec.match(/Evidencia\s+revisada\s*:\s*(.+)/i) || [])[1] || "";
        if (!reviewer.trim() || NON_HUMAN_REVIEWERS.test(reviewer)) {
          findings.push({ slug, kind: "self-approval", message: `revision visual 'approved' pero Revisor invalido ('${reviewer.trim() || "(vacio)"}'). Debe ser un humano real, no agente/IA.` });
        }
        if (!fecha.trim() || /<|placeholder|TBD|YYYY/i.test(fecha)) {
          findings.push({ slug, kind: "approval-no-date", message: "revision visual 'approved' sin Fecha real." });
        }
        if (!evidencia.trim() || /<|placeholder|TBD/i.test(evidencia)) {
          findings.push({ slug, kind: "approval-no-evidence", message: "revision visual 'approved' sin 'Evidencia revisada' (screenshot/path)." });
        }
      }
    }
  }
}

console.log(`check-prototype-visible-product (v12.60) ${strict ? "[STRICT]" : "[WARN]"}`);
console.log(`Features con prototipo evaluadas: ${features.filter((s) => existsSync(join(root, "specs", s, "prototype-html5", "index.html"))).length}`);

if (findings.length === 0) {
  console.log(`\nOK. Ningun prototipo usa fixtures ocultos ni auto-aprobacion. Revision visual humana presente.`);
  process.exit(0);
}

console.error(`\nDetectados ${findings.length} hallazgo(s) de producto-visible / anti-trampa:`);
for (const f of findings) {
  console.error(`  ✗ [${f.kind}] specs/${f.slug}: ${f.message}`);
}
console.error(`\nQue significa:`);
console.error(`  El quality-checker mide conteos estaticos que se pueden inflar con fixtures ocultos.`);
console.error(`  Este validador exige que el prototipo sea PRODUCTO VISIBLE real + revision humana.`);
console.error(`\nFix sugerido:`);
console.error(`  1. Eliminar fixtures ocultos / clases .validation-only / bloques display:none con records.`);
console.error(`  2. Hacer los estados UI interactivos (addEventListener/data-view), no solo texto.`);
console.error(`  3. Declarar Golden de referencia en decisiones-ux.md.`);
console.error(`  4. Completar '## Revision visual humana' en prototype-validation.md con Revisor humano + Fecha + Evidencia.`);
console.error(`  5. Si un humano dice 'se ve pobre', marcar Resultado: blocked (no approved).`);

process.exit(strict ? 1 : 0);

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
