#!/usr/bin/env node
// Verificador de consistencia RBAC entre stacks.
//
// Cross-platform (Windows / Linux / macOS). Solo Node 20+.
//
// Uso:
//   node ci/scripts/check-rbac-consistency.mjs [--root <repo>] [--json]
//
// Que hace:
//   - Lee la matriz Role -> Permission de cada stack:
//       * stacks/node-next/template/src/lib/rbac.ts          (TS, ROLE_PERMISSIONS object)
//       * stacks/java-monolith/template/.../security/Role.java
//       * stacks/spring-react/template/.../security/Role.java
//       * stacks/quarkus-angular/template/.../security/Role.java
//   - Normaliza cada matriz a { role -> Set<permission> }.
//   - Reporta diferencias (rol faltante, permiso extra, permiso faltante).
//   - Sale con codigo distinto de cero si hay drift.
//
// Permisos esperados (forma "reservation:read"). Roles en lowercase: viewer/editor/approver/admin.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { root: path.resolve(__dirname, "..", ".."), json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "-h" || flag === "--help") { args.help = true; continue; }
    if (flag === "--root") { args.root = path.resolve(value); i += 1; continue; }
    if (flag === "--json") { args.json = true; continue; }
    throw new Error(`Argumento desconocido: ${flag}`);
  }
  return args;
}

function usage() {
  console.log(`Uso:
  node ci/scripts/check-rbac-consistency.mjs [--root <repo>] [--json]
`);
}

const STACK_FILES = [
  {
    stack: "node-next",
    file: "stacks/node-next/template/src/lib/rbac.ts",
    parser: parseTsRbac,
  },
  {
    stack: "java-monolith",
    file: "stacks/java-monolith/template/src/main/java/com/wakaya/erp/security/Role.java",
    parser: parseJavaRole,
  },
  {
    stack: "spring-react",
    file: "stacks/spring-react/template/backend/src/main/java/com/wakaya/erp/security/Role.java",
    parser: parseJavaRole,
  },
  {
    stack: "quarkus-angular",
    file: "stacks/quarkus-angular/template/backend/src/main/java/com/wakaya/erp/security/Role.java",
    parser: parseJavaRole,
  },
];

// Mapeo de constante Java -> permiso canonico.
const JAVA_PERMISSION_MAP = {
  RESOURCE_READ: "reservation:read",
  RESOURCE_WRITE: "reservation:write",
  RESOURCE_APPROVE: "reservation:approve",
  ADMIN_USERS: "admin:users",
};

function parseTsRbac(text) {
  // Buscar el bloque ROLE_PERMISSIONS = { ... };
  const blockMatch = text.match(/ROLE_PERMISSIONS\s*:\s*[^=]*=\s*\{([\s\S]*?)\};/);
  if (!blockMatch) {
    throw new Error("No se encontro ROLE_PERMISSIONS en rbac.ts");
  }
  const body = blockMatch[1];
  const result = {};
  // Cada entrada: rolName: ["perm1", "perm2", ...]
  const entryRegex = /(\w+)\s*:\s*\[([^\]]*)\]/g;
  let match;
  while ((match = entryRegex.exec(body)) !== null) {
    const role = match[1].toLowerCase();
    const perms = [...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    result[role] = new Set(perms);
  }
  return result;
}

function parseJavaRole(text) {
  // Buscar entradas tipo: ROLENAME(EnumSet.of(P1, P2, ...))  o  ROLENAME(EnumSet.allOf(Permission.class))
  const result = {};
  const allPerms = Object.values(JAVA_PERMISSION_MAP);

  // Primero capturar declaraciones del enum por linea
  const enumMatch = text.match(/public\s+enum\s+Role\s*\{([\s\S]*?)\}/);
  if (!enumMatch) {
    throw new Error("No se encontro enum Role en Role.java");
  }
  const body = enumMatch[1];

  // Regex tolerante para cada entrada del enum
  const entryRegex = /([A-Z_]+)\(EnumSet\.(of|allOf)\(([^)]*)\)\)/g;
  let m;
  while ((m = entryRegex.exec(body)) !== null) {
    const roleName = m[1].toLowerCase();
    const kind = m[2];
    if (kind === "allOf") {
      result[roleName] = new Set(allPerms);
    } else {
      const perms = m[3]
        .split(",")
        .map((p) => p.replace(/Permission\./g, "").trim())
        .filter((p) => p.length > 0)
        .map((p) => JAVA_PERMISSION_MAP[p])
        .filter((p) => Boolean(p));
      result[roleName] = new Set(perms);
    }
  }
  return result;
}

function compareMatrices(matrices) {
  const diffs = [];
  if (matrices.length === 0) return diffs;

  const reference = matrices[0];
  const refRoles = new Set(Object.keys(reference.matrix));

  for (let i = 1; i < matrices.length; i += 1) {
    const candidate = matrices[i];
    const candRoles = new Set(Object.keys(candidate.matrix));

    // Roles faltantes
    for (const r of refRoles) {
      if (!candRoles.has(r)) {
        diffs.push({
          stack: candidate.stack,
          role: r,
          kind: "role_missing",
          detail: `rol "${r}" presente en ${reference.stack} pero no en ${candidate.stack}`,
        });
      }
    }
    // Roles extra
    for (const r of candRoles) {
      if (!refRoles.has(r)) {
        diffs.push({
          stack: candidate.stack,
          role: r,
          kind: "role_extra",
          detail: `rol "${r}" presente en ${candidate.stack} pero no en ${reference.stack}`,
        });
      }
    }
    // Mismatches en permisos por rol
    for (const r of refRoles) {
      if (!candRoles.has(r)) continue;
      const refSet = reference.matrix[r];
      const candSet = candidate.matrix[r];
      for (const p of refSet) {
        if (!candSet.has(p)) {
          diffs.push({
            stack: candidate.stack,
            role: r,
            kind: "permission_missing",
            detail: `permiso "${p}" presente en ${reference.stack}.${r} pero no en ${candidate.stack}.${r}`,
          });
        }
      }
      for (const p of candSet) {
        if (!refSet.has(p)) {
          diffs.push({
            stack: candidate.stack,
            role: r,
            kind: "permission_extra",
            detail: `permiso "${p}" presente en ${candidate.stack}.${r} pero no en ${reference.stack}.${r}`,
          });
        }
      }
    }
  }
  return diffs;
}

function summarize(matrices) {
  return matrices.map((m) => ({
    stack: m.stack,
    roles: Object.fromEntries(
      Object.entries(m.matrix).map(([k, v]) => [k, [...v].sort()]),
    ),
  }));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); return 0; }

  const matrices = [];
  const errors = [];
  for (const entry of STACK_FILES) {
    const filePath = path.join(args.root, entry.file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Archivo no existe: ${filePath}`);
      continue;
    }
    try {
      const text = fs.readFileSync(filePath, "utf8");
      const matrix = entry.parser(text);
      matrices.push({ stack: entry.stack, file: entry.file, matrix });
    } catch (error) {
      errors.push(`Error parseando ${filePath}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    if (args.json) {
      console.log(JSON.stringify({ ok: false, errors, matrices: summarize(matrices) }, null, 2));
    } else {
      for (const e of errors) console.error(`error: ${e}`);
    }
    return 2;
  }

  const diffs = compareMatrices(matrices);

  if (args.json) {
    console.log(JSON.stringify({
      ok: diffs.length === 0,
      reference: matrices[0]?.stack,
      diffs,
      matrices: summarize(matrices),
    }, null, 2));
  } else {
    if (diffs.length === 0) {
      console.log(`OK. Matrices RBAC consistentes en los ${matrices.length} stacks (referencia: ${matrices[0].stack}).`);
    } else {
      console.log(`Drift RBAC detectado (${diffs.length} diferencia(s)):`);
      for (const d of diffs) {
        console.log(`  - [${d.kind}] ${d.detail}`);
      }
    }
  }

  return diffs.length === 0 ? 0 : 1;
}

try {
  process.exit(main());
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}
