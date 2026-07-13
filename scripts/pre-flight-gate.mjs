#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const instantiated = isInstantiatedProject(root);

const checks = [
  {
    label: "roadmap-state",
    command: [process.execPath, [join(root, "scripts", "roadmap-sync.mjs"), "--check", ...(instantiated ? ["--strict"] : [])]],
  },
  ...(instantiated
    ? [
        {
          label: "release-binding",
          command: [process.execPath, [join(root, "ci", "scripts", "check-release-binding.mjs"), "--strict"]],
        },
        {
          label: "runbook-binding",
          command: [process.execPath, [join(root, "ci", "scripts", "check-runbook-binding.mjs"), "--strict"]],
        },
      ]
    : []),
];

let failures = 0;

console.log(`pre-flight-gate (${instantiated ? "instanciado" : "template"})`);

for (const check of checks) {
  const result = spawnSync(check.command[0], check.command[1], {
    cwd: root,
    encoding: "utf8",
    timeout: 30000,
  });

  const ok = result.status === 0;
  const output = [result.stdout, result.stderr].filter(Boolean).join("").trim();
  console.log(`${ok ? "PASS" : "FAIL"} ${check.label}`);
  if (output) {
    console.log(output);
  }
  if (!ok) {
    failures += 1;
  }
}

if (failures > 0) {
  process.exit(2);
}

process.exit(0);

function isInstantiatedProject(rootDir) {
  const packageJsonPath = join(rootDir, "package.json");
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      if (/project-template/i.test(String(packageJson.name ?? ""))) {
        return false;
      }
    } catch {
      // fallback to folder heuristics
    }
  }

  const stacksDir = join(rootDir, "stacks");
  if (existsSync(stacksDir)) {
    for (const entry of readdirSync(stacksDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      if (existsSync(join(stacksDir, entry.name, "template"))) {
        return false;
      }
    }
  }

  return true;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) {
      continue;
    }
    const key = argv[i].slice(2);
    if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
      out[key] = argv[++i];
    } else {
      out[key] = true;
    }
  }
  return out;
}
