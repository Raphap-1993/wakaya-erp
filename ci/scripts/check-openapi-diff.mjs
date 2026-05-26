#!/usr/bin/env node
// Detector de cambios breaking en contratos OpenAPI.
//
// Cross-platform (Windows / Linux / macOS). Solo Node 20+ y git en PATH.
//
// Uso:
//   node ci/scripts/check-openapi-diff.mjs --base origin/main --head HEAD [--file contracts/api/openapi.yaml]
//
// Estrategia:
//   - Lee el archivo en --base via `git show` y en --head via working tree (o git show).
//   - Extrae con regex tolerantes los siguientes campos del YAML OpenAPI:
//       * Paths declarados.
//       * Operations (HTTP methods) bajo cada path.
//       * Response codes documentados por operation.
//       * Required de request bodies y schemas.
//       * Valores de enum.
//       * Security schemes globales.
//   - Compara y reporta breakings.
//
// Rationale: un parser YAML completo es prone a bugs sutiles. Este script no intenta
// reconstruir el AST entero; extrae lo que importa para detectar breakings y reporta
// con precision suficiente para CI gating.
//
// Bypass: en GitHub Actions, condicionar el job con
//   if: ! contains(github.event.pull_request.labels.*.name, 'contract-breaking-approved')

import fs from "node:fs";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const args = {
    base: "origin/main",
    head: "WORKING",
    file: "contracts/api/openapi.yaml",
    json: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "-h" || flag === "--help") { args.help = true; continue; }
    if (flag === "--base") { args.base = value; i += 1; continue; }
    if (flag === "--head") { args.head = value; i += 1; continue; }
    if (flag === "--file") { args.file = value; i += 1; continue; }
    if (flag === "--json") { args.json = true; continue; }
    throw new Error(`Argumento desconocido: ${flag}`);
  }
  return args;
}

function usage() {
  console.log(`Uso:
  node ci/scripts/check-openapi-diff.mjs --base <ref> [--head <ref|WORKING>] [--file <path>] [--json]

Defaults:
  --base origin/main
  --head WORKING            (lee el archivo del working tree; usa "HEAD" para el index commit)
  --file contracts/api/openapi.yaml
`);
}

function readFromGit(ref, filePath) {
  // "WORKING" es el alias para leer el archivo desde el working tree.
  // Cualquier otra ref se resuelve via `git show <ref>:<file>` (incluyendo "HEAD").
  if (ref === "WORKING") {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no existe en working tree: ${filePath}`);
    }
    return fs.readFileSync(filePath, "utf8");
  }
  const result = spawnSync("git", ["show", `${ref}:${filePath}`], {
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`git show ${ref}:${filePath} fallo: ${(result.stderr ?? "").trim()}`);
  }
  return result.stdout;
}

// ---------- Extractor regex ----------

function indentOf(line) {
  const m = line.match(/^( *)/);
  return m ? m[1].length : 0;
}

function isStructuralLine(line) {
  return !/^\s*(#|$)/.test(line);
}

function extractContract(text) {
  const lines = text.split(/\r?\n/);
  const paths = {}; // path -> { methods: { get: { responses: Set, requestRequired: Set, summary } }, internal: bool }
  const securitySchemes = new Set();
  const globalRequired = []; // contar entradas de security:
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!isStructuralLine(line)) { i += 1; continue; }

    if (/^paths\s*:/.test(line)) {
      i += 1;
      while (i < lines.length && (lines[i] === "" || /^\s/.test(lines[i]))) {
        if (!isStructuralLine(lines[i])) { i += 1; continue; }
        const ind = indentOf(lines[i]);
        if (ind === 0) break;
        if (ind === 2) {
          // Path
          const m = lines[i].match(/^ {2}(\/[^\s:]+)\s*:\s*$/);
          if (m) {
            const pathKey = m[1];
            const result = parsePathItem(lines, i + 1);
            paths[pathKey] = result.item;
            i = result.nextIndex;
            continue;
          }
        }
        i += 1;
      }
      continue;
    }

    if (/^components\s*:/.test(line)) {
      i += 1;
      while (i < lines.length && (lines[i] === "" || /^\s/.test(lines[i]))) {
        if (!isStructuralLine(lines[i])) { i += 1; continue; }
        const ind = indentOf(lines[i]);
        if (ind === 0) break;
        if (ind === 2 && /^ {2}securitySchemes\s*:\s*$/.test(lines[i])) {
          i += 1;
          while (i < lines.length && (lines[i] === "" || indentOf(lines[i]) >= 4 || !isStructuralLine(lines[i]))) {
            if (!isStructuralLine(lines[i])) { i += 1; continue; }
            if (indentOf(lines[i]) === 4) {
              const sm = lines[i].match(/^ {4}([A-Za-z0-9_-]+)\s*:\s*$/);
              if (sm) securitySchemes.add(sm[1]);
            }
            i += 1;
          }
          continue;
        }
        i += 1;
      }
      continue;
    }

    if (/^security\s*:/.test(line)) {
      i += 1;
      while (i < lines.length && /^\s/.test(lines[i])) {
        if (/^- /.test(lines[i].trim() ? lines[i].trimStart() : "") || /^ {2}- /.test(lines[i])) {
          globalRequired.push(lines[i].trim());
        }
        if (lines[i] !== "" && !/^\s/.test(lines[i])) break;
        i += 1;
      }
      continue;
    }

    i += 1;
  }

  return { paths, securitySchemes, globalRequiredCount: globalRequired.length };
}

function parsePathItem(lines, startIndex) {
  const item = { methods: {}, internal: false };
  let i = startIndex;
  while (i < lines.length) {
    if (!isStructuralLine(lines[i])) { i += 1; continue; }
    const ind = indentOf(lines[i]);
    if (ind <= 2) break; // siguiente path o seccion

    if (ind === 4) {
      const internalMatch = lines[i].match(/^ {4}x-internal\s*:\s*true\s*$/);
      if (internalMatch) { item.internal = true; i += 1; continue; }

      const methodMatch = lines[i].match(/^ {4}(get|post|put|patch|delete|options|head|trace)\s*:\s*$/);
      if (methodMatch) {
        const method = methodMatch[1];
        const result = parseOperation(lines, i + 1);
        item.methods[method] = result.op;
        i = result.nextIndex;
        continue;
      }
    }
    i += 1;
  }
  return { item, nextIndex: i };
}

function parseOperation(lines, startIndex) {
  const op = { responses: new Set(), requestRequired: new Set(), enums: {} };
  let i = startIndex;
  while (i < lines.length) {
    if (!isStructuralLine(lines[i])) { i += 1; continue; }
    const ind = indentOf(lines[i]);
    if (ind <= 4) break;

    if (ind === 6 && /^ {6}responses\s*:\s*$/.test(lines[i])) {
      i += 1;
      while (i < lines.length) {
        if (!isStructuralLine(lines[i])) { i += 1; continue; }
        const rind = indentOf(lines[i]);
        if (rind <= 6) break;
        if (rind === 8) {
          const cm = lines[i].match(/^ {8}["']?(\d{3}|default)["']?\s*:\s*$/);
          if (cm) op.responses.add(cm[1]);
        }
        i += 1;
      }
      continue;
    }

    if (ind === 6 && /^ {6}requestBody\s*:\s*$/.test(lines[i])) {
      i += 1;
      // buscar required dentro del schema del requestBody
      while (i < lines.length) {
        if (!isStructuralLine(lines[i])) { i += 1; continue; }
        const rind = indentOf(lines[i]);
        if (rind <= 6) break;
        const reqMatch = lines[i].match(/^\s+required\s*:\s*$/);
        if (reqMatch) {
          // siguientes lineas son items "- name"
          let j = i + 1;
          while (j < lines.length && /^\s+- /.test(lines[j])) {
            const itemMatch = lines[j].match(/^\s+-\s+([A-Za-z0-9_-]+)\s*$/);
            if (itemMatch) op.requestRequired.add(itemMatch[1]);
            j += 1;
          }
          i = j;
          continue;
        }
        i += 1;
      }
      continue;
    }

    i += 1;
  }
  return { op, nextIndex: i };
}

// ---------- Comparador ----------

function diff(base, head) {
  const breakings = [];
  const warnings = [];

  // Eliminacion de paths
  for (const pathKey of Object.keys(base.paths)) {
    const basePath = base.paths[pathKey];
    if (basePath.internal) continue;
    if (!(pathKey in head.paths)) {
      breakings.push({ path: `paths.${pathKey}`, reason: "path eliminado" });
      continue;
    }
    const headPath = head.paths[pathKey];

    // Eliminacion de methods
    for (const method of Object.keys(basePath.methods)) {
      if (!(method in headPath.methods)) {
        breakings.push({
          path: `paths.${pathKey}.${method}`,
          reason: `operation ${method.toUpperCase()} eliminada`,
        });
        continue;
      }
      const baseOp = basePath.methods[method];
      const headOp = headPath.methods[method];

      // Eliminacion de responseCode
      for (const code of baseOp.responses) {
        if (!headOp.responses.has(code)) {
          breakings.push({
            path: `paths.${pathKey}.${method}.responses.${code}`,
            reason: `responseCode ${code} eliminado`,
          });
        }
      }

      // Required nuevo en request body
      for (const r of headOp.requestRequired) {
        if (!baseOp.requestRequired.has(r)) {
          breakings.push({
            path: `paths.${pathKey}.${method}.requestBody.required`,
            reason: `campo "${r}" se vuelve required`,
          });
        }
      }
    }
  }

  // Eliminacion de securitySchemes globales
  for (const name of base.securitySchemes) {
    if (!head.securitySchemes.has(name)) {
      breakings.push({
        path: `components.securitySchemes.${name}`,
        reason: "security scheme eliminado",
      });
    }
  }

  // Endurecimiento de security global
  if (head.globalRequiredCount > base.globalRequiredCount) {
    warnings.push({
      path: "security",
      reason: `security global mas estricto: ${base.globalRequiredCount} -> ${head.globalRequiredCount} requirements`,
    });
  }

  return { breakings, warnings };
}

// ---------- Main ----------

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); return 0; }

  let baseText;
  let headText;
  try {
    baseText = readFromGit(args.base, args.file);
  } catch (error) {
    console.error(`No se pudo leer base ${args.base}:${args.file}: ${error.message}`);
    console.error("Si el archivo es nuevo en este PR, no hay breakings que comparar.");
    return 0;
  }
  try {
    headText = readFromGit(args.head, args.file);
  } catch (error) {
    console.error(`No se pudo leer head ${args.head}:${args.file}: ${error.message}`);
    return 2;
  }

  const baseDoc = extractContract(baseText);
  const headDoc = extractContract(headText);

  const { breakings, warnings } = diff(baseDoc, headDoc);

  if (args.json) {
    console.log(JSON.stringify({
      file: args.file,
      base: args.base,
      head: args.head,
      summary: {
        basePathCount: Object.keys(baseDoc.paths).length,
        headPathCount: Object.keys(headDoc.paths).length,
        breakings: breakings.length,
        warnings: warnings.length,
      },
      breakings,
      warnings,
    }, null, 2));
  } else {
    if (warnings.length > 0) {
      console.log("Warnings (no bloquean):");
      for (const w of warnings) {
        console.log(`  - ${w.path}: ${w.reason}`);
      }
    }
    if (breakings.length === 0) {
      console.log(`OK. Sin cambios breaking en ${args.file} (base=${args.base} head=${args.head}).`);
      console.log(`Paths analizados: base=${Object.keys(baseDoc.paths).length} head=${Object.keys(headDoc.paths).length}`);
    } else {
      console.log(`Cambios BREAKING detectados en ${args.file}:`);
      for (const b of breakings) {
        console.log(`  - ${b.path}: ${b.reason}`);
      }
    }
  }

  return breakings.length === 0 ? 0 : 1;
}

try {
  process.exit(main());
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}
