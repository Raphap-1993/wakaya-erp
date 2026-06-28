#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { emitFase4Plantillas } from "./_lib/feature-templates.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const outputDir = join(root, "plantillas", "fase-4-sdd");
const emitted = emitFase4Plantillas(root);

let written = 0;
for (const [name, content] of Object.entries(emitted)) {
  const targetPath = join(outputDir, name);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, content, "utf8");
  written += 1;
}

console.log(`OK. plantillas/fase-4-sdd sincronizada desde la snapshot canonica local (${written} archivos).`);

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
