#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function collectWorkflowFiles(rootDir) {
  const workflowsDir = path.join(rootDir, ".github", "workflows");
  if (!fs.existsSync(workflowsDir)) {
    return [];
  }
  return fs
    .readdirSync(workflowsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && [".yml", ".yaml"].includes(path.extname(entry.name)))
    .map((entry) => path.join(workflowsDir, entry.name))
    .sort();
}

function main() {
  const rootDir = path.resolve(process.argv[2] || ".");
  const findings = [];

  for (const file of collectWorkflowFiles(rootDir)) {
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/^\s*if:\s*.*secrets\./.test(line)) {
        const relative = path.relative(rootDir, file).replace(/\\/g, "/");
        findings.push(
          `${relative}:${index + 1}: evita usar secrets.* directamente en if; pasa el valor por env y condiciona sobre env.*`,
        );
      }
    });
  }

  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(finding);
    }
    console.error(`\nTotal hallazgos: ${findings.length}`);
    return 1;
  }

  console.log("OK. Workflows sin secrets.* directos en if.");
  return 0;
}

process.exit(main());
