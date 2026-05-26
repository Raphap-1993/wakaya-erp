#!/usr/bin/env node
/**
 * check-constitution.mjs (v12.105)
 *
 * Verifica que la CONSTITUCION del proyecto (CONSTITUTION.md en la raiz) exista y
 * conserve sus principios NO negociables. La constitucion es el contrato de mas alto
 * nivel del template: cada principio esta respaldado por un gate humano o un validador.
 *
 * Que comprueba:
 *   1) CONSTITUTION.md existe en la raiz.
 *   2) Declara los N principios numerados (## Principio 1 .. ## Principio N).
 *   3) Cada principio tiene cuerpo no vacio y nombra "Lo hace cumplir" (su diente).
 *   4) Tiene una seccion "## Cumplimiento" que apunta a check:all.
 *
 * NO valida el TEXTO exacto de cada principio (eso driftaria como en check-ai-artifacts).
 * Valida ESTRUCTURA y SUSTANCIA: que los principios sigan estando y atados a enforcement.
 *
 * Modos: --strict (default, bloqueante) | --warn | --root <path>.
 *
 * Exit codes:
 *   0 - constitucion presente y completa (o --warn).
 *   1 - falta la constitucion o algun principio (en strict).
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveStrict } from "./_lib/strict-mode.mjs";

const MIN_PRINCIPLES = 10;

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, true);

const blockers = [];
let seen = new Set();
const constPath = join(root, "CONSTITUTION.md");

if (!existsSync(constPath)) {
  blockers.push(`CONSTITUTION.md:1: no existe en la raiz. Es el contrato de principios del proyecto. Restaurala con: npm run template:upgrade -- --apply --force-framework`);
  finish();
}

const text = readFileSync(constPath, "utf8");

// 1) Principios numerados con cuerpo no vacio.
const principleRe = /^##\s+Principio\s+(\d+)\b[^\n]*$/gim;
const matches = [...text.matchAll(principleRe)];
seen = new Set(matches.map((m) => Number(m[1])));

for (let n = 1; n <= MIN_PRINCIPLES; n += 1) {
  if (!seen.has(n)) {
    blockers.push(`CONSTITUTION.md:1: falta el principio "## Principio ${n}" (se esperan al menos ${MIN_PRINCIPLES} principios numerados).`);
  }
}

// 2) Cada principio presente debe tener cuerpo + "Lo hace cumplir" (su diente ejecutable).
for (let i = 0; i < matches.length; i += 1) {
  const start = matches[i].index + matches[i][0].length;
  const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
  const body = text.slice(start, end);
  const n = matches[i][1];
  if (body.replace(/[\s#-]/g, "").length < 40) {
    blockers.push(`CONSTITUTION.md:1: el principio ${n} esta vacio o demasiado corto (sustancia minima).`);
    continue;
  }
  if (!/Lo hace cumplir/i.test(body)) {
    blockers.push(`CONSTITUTION.md:1: el principio ${n} no declara "Lo hace cumplir" (gate humano o validador que lo verifica).`);
  }
}

// 3) Seccion de cumplimiento que ate la constitucion a check:all.
if (!/^##\s+Cumplimiento\b/im.test(text)) {
  blockers.push(`CONSTITUTION.md:1: falta la seccion "## Cumplimiento".`);
} else if (!/check:all/.test(text)) {
  blockers.push(`CONSTITUTION.md:1: la seccion de cumplimiento debe apuntar a "npm run check:all".`);
}

finish();

function finish() {
  console.log(`check-constitution (v12.105) ${strict ? "[STRICT]" : "[WARN]"}`);
  if (blockers.length === 0) {
    console.log(`OK. CONSTITUTION.md presente con ${seen ? seen.size : 0} principios atados a enforcement.`);
    process.exit(0);
  }
  console.error(`\nHallazgos (${blockers.length}):`);
  for (const b of blockers) console.error(`  ✗ ${b}`);
  process.exit(strict ? 1 : 0);
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
