#!/usr/bin/env node
/**
 * check-auto-zones.mjs (v12.56) — BLOQUEANTE
 *
 * Verifica integridad de zonas auto-regenerables en archivos markdown:
 *   <!-- auto:start name=X -->
 *   ...contenido autogenerado...
 *   <!-- auto:end -->
 *
 * Tambien acepta variante con `@`:
 *   <!-- @auto:start name=X -->
 *   ...
 *   <!-- @auto:end -->
 *
 * Detecta:
 *   1. Zonas con start sin end correspondiente (corrupcion).
 *   2. Zonas con end sin start previo.
 *   3. Nesting (auto:start dentro de otra auto:start sin cerrar).
 *   4. Zona requerida ausente (ej. AI_CONTEXT.md DEBE tener `decisiones-recientes`).
 *   5. Multiples zonas con el mismo name (ambiguedad para el generador).
 *
 * Por que es BLOQUEANTE: si un agente corrompe una zona auto, el siguiente
 * `regenerate-context` puede:
 *   - Borrar contenido humano que el agente puso ENTRE start y end.
 *   - Regenerar contenido en lugar incorrecto.
 *   - Romper el parser silenciosamente.
 *
 * Modos:
 *   --strict       exit 1 si hay zonas corrompidas (default).
 *   --warn         exit 0 con warning.
 *   --root <path>  raiz del proyecto.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true); // v12.59: default strict (bloqueante); --warn override; CHECK_STRICT=1 redundante

// Archivos que CONTIENEN zonas auto + zonas requeridas.
const FILES_WITH_AUTO_ZONES = [
  {
    path: "AI_CONTEXT.md",
    requiredZones: [
      "stack", "version", "features", "gates-pendientes",
      "sesiones-recientes", "decisiones-recientes", "ultima-actualizacion",
    ],
  },
  // PROJECT_MAP.md, TRACEABILITY_MATRIX.md, GLOSSARY.md pueden tener zonas opcionales.
  // No las exigimos aqui, pero si tienen alguna, debe ser balanceada.
];
const OTHER_FILES_TO_SCAN = [
  "PROJECT_MAP.md",
  "TRACEABILITY_MATRIX.md",
  "GLOSSARY.md",
  "prototype/index.html",
  // v12.67: docs de fase con zonas de estado vivo (balance-only; las rellena roadmap:sync).
  "docs/fase-0-iniciacion/00.02-roadmap.md",
  "docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md",
  "docs/fase-1-analisis-requerimientos/01.01-matriz-huecos-fase-1.md",
  "docs/fase-3-arquitectura/03.04-checklist-arquitectura.md",
  "docs/fase-4-sdd/04.00-spec-driven-development.md",
  "docs/fase-5-construccion/05.00-plantilla-proyecto-base.md",
  "docs/fase-6-qa/06.00-plan-pruebas.md",
  "docs/fase-7-deploy/07.00-checklist-salida-produccion.md",
  "docs/fase-8-operacion/08.00-operacion-continua.md",
];

const findings = [];

// Regex: acepta tanto `<!-- auto:start name=X -->` como `<!-- @auto:start name=X -->`.
const START_RE = /<!--\s*@?auto:start\s+name=([a-zA-Z][a-zA-Z0-9_-]*)\s*-->/g;
const END_RE = /<!--\s*@?auto:end\s*-->/g;

function scanFile(absPath, relPath, requiredZones) {
  if (!existsSync(absPath)) {
    if (requiredZones && requiredZones.length > 0) {
      findings.push({ file: relPath, kind: "file-missing", message: `archivo no existe pero deberia tener zonas auto` });
    }
    return;
  }
  const text = readFileSync(absPath, "utf8");
  const starts = [];
  const ends = [];
  let m;
  START_RE.lastIndex = 0;
  while ((m = START_RE.exec(text)) !== null) {
    starts.push({ name: m[1], pos: m.index });
  }
  END_RE.lastIndex = 0;
  while ((m = END_RE.exec(text)) !== null) {
    ends.push({ pos: m.index });
  }

  // 1. Balance.
  if (starts.length !== ends.length) {
    findings.push({
      file: relPath,
      kind: "unbalanced",
      message: `${starts.length} 'auto:start' vs ${ends.length} 'auto:end' (deben ser iguales)`,
    });
  }

  // 2. Cada start debe tener un end posterior.
  // Ordenar por posicion y verificar nesting.
  const events = [
    ...starts.map((s) => ({ type: "start", name: s.name, pos: s.pos })),
    ...ends.map((e) => ({ type: "end", pos: e.pos })),
  ].sort((a, b) => a.pos - b.pos);
  const stack = [];
  for (const ev of events) {
    if (ev.type === "start") {
      if (stack.length > 0) {
        findings.push({
          file: relPath,
          kind: "nested",
          message: `zona '${ev.name}' anidada dentro de '${stack[stack.length - 1].name}' sin cerrar`,
        });
      }
      stack.push(ev);
    } else {
      if (stack.length === 0) {
        findings.push({
          file: relPath,
          kind: "orphan-end",
          message: `auto:end sin auto:start previo en posicion ${ev.pos}`,
        });
      } else {
        stack.pop();
      }
    }
  }
  if (stack.length > 0) {
    for (const s of stack) {
      findings.push({
        file: relPath,
        kind: "missing-end",
        message: `auto:start name='${s.name}' sin auto:end correspondiente`,
      });
    }
  }

  // 3. Zonas duplicadas con el mismo name.
  const nameCount = {};
  for (const s of starts) nameCount[s.name] = (nameCount[s.name] || 0) + 1;
  for (const [name, count] of Object.entries(nameCount)) {
    if (count > 1) {
      findings.push({
        file: relPath,
        kind: "duplicate-zone",
        message: `zona name='${name}' aparece ${count} veces (debe ser unica)`,
      });
    }
  }

  // 4. Zonas requeridas ausentes.
  if (requiredZones) {
    const present = new Set(starts.map((s) => s.name));
    for (const req of requiredZones) {
      if (!present.has(req)) {
        findings.push({
          file: relPath,
          kind: "missing-required-zone",
          message: `zona requerida '${req}' no encontrada`,
        });
      }
    }
  }
}

for (const f of FILES_WITH_AUTO_ZONES) {
  scanFile(join(root, f.path), f.path, f.requiredZones);
}
for (const p of OTHER_FILES_TO_SCAN) {
  scanFile(join(root, p), p, null);
}

console.log(`check-auto-zones (v12.56) — bloqueante`);
console.log(`Archivos verificados: ${FILES_WITH_AUTO_ZONES.length + OTHER_FILES_TO_SCAN.length}`);

if (findings.length === 0) {
  console.log(`\nOK. Todas las zonas auto-regenerables estan integras.`);
  process.exit(0);
}

console.error(`\nDetectados ${findings.length} hallazgo(s) en zonas auto:`);
for (const f of findings) {
  console.error(`  ✗ [${f.kind}] ${f.file}: ${f.message}`);
}
console.error(`\nPor que es bloqueante:`);
console.error(`  - Si un agente sobrescribe el contenido entre auto:start/auto:end con contenido propio,`);
console.error(`    el siguiente 'npm run memory:context' lo borrara al regenerar.`);
console.error(`  - Si una zona requerida falta (ej. 'decisiones-recientes' en AI_CONTEXT.md),`);
console.error(`    el agente NO podra ubicar contexto reciente al retomar el proyecto.`);
console.error(`\nFix sugerido:`);
console.error(`  1. Regenerar el archivo si solo faltan zonas:`);
console.error(`     npm run memory:context`);
console.error(`  2. Si hay zonas duplicadas o anidadas, editar manualmente para balancearlas.`);
console.error(`  3. NO PONER contenido humano DENTRO de zonas auto — usar zonas fuera del bloque.`);

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
