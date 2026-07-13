#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { refreshPhaseDocZones } from "../ci/scripts/_lib/doc-autozones.mjs";
import { listIncludedFeatures } from "../ci/scripts/_lib/feature-filter.mjs";
import { listLocks, pruneExpired } from "../ci/scripts/_lib/agent-locks.mjs";
import { resolveStrict, strictLabel } from "../ci/scripts/_lib/strict-mode.mjs";

const VERSION = "12.78";
const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const strict = resolveStrict(args, false);

const status = runJsonScript("scripts/roadmap-status.mjs", ["--json", "--root", root]);
const next = runJsonScript("scripts/roadmap-next.mjs", ["--root", root]);

const state = {
  version: VERSION,
  generated_at: new Date().toISOString(),
  project: status.project ?? null,
  template_version: status.templateVersion ?? null,
  phases: status.phases ?? [],
  features: status.features ?? [],
  dependencies: collectDependencies(root),
  blockers: status.blockers ?? [],
  next_action: next,
};

const serialized = `${JSON.stringify(state, null, 2)}\n`;
const roadmapStatePath = join(root, "ROADMAP_STATE.json");

if (args["dry-run"]) {
  process.stdout.write(serialized);
  process.exit(0);
}

if (args.check) {
  const current = existsSync(roadmapStatePath) ? readFileSync(roadmapStatePath, "utf8") : null;
  if (current && roadmapStateEquals(current, serialized)) {
    console.log(`ROADMAP_STATE.json al dia ${strictLabel(strict)}`);
    process.exit(0);
  }

  const message = existsSync(roadmapStatePath)
    ? "ROADMAP_STATE.json stale. Corre `npm run roadmap:sync`."
    : "ROADMAP_STATE.json no existe. Corre `npm run roadmap:sync`.";
  if (strict) {
    console.error(message);
    process.exit(2);
  }
  console.warn(message);
  process.exit(0);
}

writeFileSync(roadmapStatePath, serialized, "utf8");
writeFileSync(join(root, "AGENT_BOARD.md"), buildAgentBoard(state), "utf8");
pruneExpired(root);
const docZoneResults = refreshPhaseDocZones(root, status);

console.log(`roadmap-sync (v${VERSION})`);
console.log(`ROADMAP_STATE.json actualizado.`);
console.log(`AGENT_BOARD.md actualizado.`);
console.log(`Docs de fase refrescados: ${docZoneResults.filter((item) => item.updated).length}/${docZoneResults.length}`);
console.log(`Los docs de fase se actualizaron. Corre \`npm run memory:sync\` para reindexar la memoria.`);

function runJsonScript(relativePath, scriptArgs) {
  const scriptPath = join(root, relativePath);
  if (!existsSync(scriptPath)) {
    throw new Error(`script_missing:${relativePath}`);
  }

  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: root,
    encoding: "utf8",
    timeout: 30000,
  });

  if (result.status !== 0) {
    throw new Error(
      `script_failed:${relativePath}:${(result.stderr || result.stdout || "").trim().slice(0, 400)}`,
    );
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`script_invalid_json:${relativePath}`);
  }
}

function collectDependencies(rootDir) {
  return listIncludedFeatures(rootDir)
    .flatMap((slug) => parseDependencies(rootDir, slug))
    .sort((left, right) => {
      return (
        left.from.localeCompare(right.from) ||
        left.to.localeCompare(right.to) ||
        left.type.localeCompare(right.type)
      );
    });
}

function parseDependencies(rootDir, slug) {
  const tracePath = join(rootDir, "specs", slug, "traceability.md");
  if (!existsSync(tracePath)) {
    return [];
  }

  const text = readFileSync(tracePath, "utf8");
  const match = text.match(/##\s+Dependencias\s*\n([\s\S]*?)(?=\n##\s|\n$|$)/i);
  if (!match) {
    return [];
  }

  return match[1]
    .split(/\r?\n/)
    .filter((line) => /^\s*\|/.test(line) && !/^\s*\|[\s-]+\|/.test(line))
    .slice(1)
    .flatMap((row) => {
      const cells = row
        .split("|")
        .map((cell) => cell.trim())
        .filter((_, index, array) => index > 0 && index < array.length - 1);
      if (cells.length < 2) {
        return [];
      }

      const arrow = cells[0].match(/(\d{3,}-[a-z0-9-]+)\s*(?:→|->|-->)\s*(\d{3,}-[a-z0-9-]+)/i);
      if (!arrow) {
        return [];
      }

      return [
        {
          from: arrow[1],
          to: arrow[2],
          type: (cells[1] || "requires").toLowerCase(),
          reason: cells[2] || "",
        },
      ];
    });
}

function buildAgentBoard(state) {
  const locksByFeature = new Map(listLocks(root).map((lock) => [lock.feature, lock]));
  const lines = [
    "# AGENT_BOARD",
    "",
    `Generado: ${state.generated_at}`,
    "",
    "| Feature | Fase | Prototipo | Lock activo |",
    "|---|---:|---|---|",
  ];

  for (const feature of state.features ?? []) {
    const lock = locksByFeature.get(feature.slug);
    const lockLabel = lock && !lock.expired ? `${lock.agent} · expira ${lock.expires_at}` : "Libre";
    lines.push(
      `| ${feature.slug} | ${feature.phase ?? "-"} | ${feature.prototype_state ?? "n/a"} | ${lockLabel} |`,
    );
  }

  lines.push("");
  lines.push("_Archivo regenerable por `npm run roadmap:sync`._");
  lines.push("");
  return lines.join("\n");
}

function roadmapStateEquals(leftSource, rightSource) {
  try {
    const left = JSON.parse(leftSource);
    const right = JSON.parse(rightSource);
    delete left.generated_at;
    delete right.generated_at;
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
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
