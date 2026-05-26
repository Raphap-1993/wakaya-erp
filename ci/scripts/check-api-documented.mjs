#!/usr/bin/env node
/**
 * check-api-documented.mjs (v12.45)
 *
 * Para cada endpoint declarado en la columna `API` de algun `traceability.md`
 * (ej. `GET /api/reservations`), verifica que exista doc canonica en algun
 * `api-contract.md` del repo con la marca:
 *
 *   ## Endpoint
 *   <METHOD> /path/to/resource
 *
 * o tabla:
 *
 *   | METHOD | Path | ... |
 *
 * Filtra placeholders (`-`, `tbd`). Es paralelo a `check-bd-documented` para
 * cerrar la trazabilidad RF -> API -> codigo end-to-end.
 *
 * Uso:
 *   node ci/scripts/check-api-documented.mjs
 *   node ci/scripts/check-api-documented.mjs --root <repo>
 *
 * Exit codes:
 *   0 - todas las APIs declaradas tienen doc canonica
 *   1 - hay endpoints declarados sin doc
 *   2 - error de configuracion
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dbPath = args.db ? resolve(args.db) : join(root, "ai", "memory", "framework-agent.db");

if (!existsSync(dbPath)) {
  console.error(`No existe DB: ${dbPath}. Corre primero index-docs + sync-memory.`);
  process.exit(2);
}

const db = new DatabaseSync(dbPath);

const placeholderRe = /^(\s*[-—]?\s*|n\/?a|na|tbd|pendiente|por definir)$/i;
const apiRefs = db
  .prepare(`SELECT DISTINCT target_ref, source_ref, source_file FROM ai_trace_links WHERE LOWER(target_type) = 'api'`)
  .all()
  .filter((r) => r.target_ref && !placeholderRe.test(r.target_ref));

if (apiRefs.length === 0) {
  console.log("OK. No hay endpoints declarados en columnas API de ningun traceability.md.");
  process.exit(0);
}

// Normalizar endpoint: "GET /api/reservations" -> { method: "GET", path: "/api/reservations" }
// Tambien aceptar "GET /api/x/{id}/y" o solo "/api/x". Si el valor no parece
// un endpoint (no contiene '/' o es una descripcion de respuestas tipo "401/403"),
// devuelve null y se ignora silenciosamente — el validador no tiene nada que decir.
function parseEndpoint(s) {
  const trimmed = String(s).trim();
  // Descartar valores que claramente no son endpoints HTTP.
  // Patrones a ignorar: "401/403", "200", "TBD", solo numeros, etc.
  if (/^\d/.test(trimmed)) return null;
  if (!trimmed.includes("/")) return null;
  const m = trimmed.match(/^([A-Z]+)\s+(\/\S+)$/) || trimmed.match(/^(\/\S+)$/);
  if (m) {
    if (m.length === 3) return { method: m[1], path: m[2] };
    return { method: null, path: m[1] };
  }
  return null;
}

// Recolectar todos los endpoints documentados en api-contract.md del repo
const documentedEndpoints = new Set(); // 'METHOD path' o solo 'path'
// v12.36: tambien recolectar endpoints declarados en openapi.yaml / openapi.json
// para validacion mas estricta. Reglas:
//   - Si NO existe openapi.yaml, basta con api-contract.md (compat v12.35).
//   - Si SI existe, cada endpoint declarado en la matriz debe estar en
//     openapi.yaml tambien (no solo en api-contract.md).
const openapiEndpoints = new Set(); // 'METHOD path' siempre con method
const openapiShapes = new Map(); // 'METHOD path' -> bloque YAML del method (v12.37)
let openapiExists = false;

function walkContracts(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkContracts(full);
    } else if (entry.isFile() && /api-contract\.md$/i.test(entry.name)) {
      const text = readFileSync(full, "utf8");
      const lineRe = /\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\/[A-Za-z0-9_\-/{}.]+)/g;
      let m;
      while ((m = lineRe.exec(text)) !== null) {
        documentedEndpoints.add(`${m[1]} ${m[2]}`);
        documentedEndpoints.add(m[2]);
      }
    } else if (entry.isFile() && /openapi\.(ya?ml|json)$/i.test(entry.name)) {
      openapiExists = true;
      const text = readFileSync(full, "utf8");
      // Parser ligero: buscar paths como "  /api/reservations:" seguido (lineas
      // despues) por "    get:" / "    post:" / etc. NO usamos un parser YAML
      // formal para evitar dependencias.
      // v12.37: ademas recolectar bloque por method para validar shape de
      // request/response. shapesByKey[key] = bloque YAML del method completo.
      const lines = text.split(/\r?\n/);
      let currentPath = null;
      let currentIndent = 0;
      let currentMethod = null;
      let methodIndent = 0;
      let methodBuffer = [];
      const closeMethod = () => {
        if (currentMethod && currentPath) {
          const key = `${currentMethod} ${currentPath}`;
          openapiShapes.set(key, methodBuffer.join("\n"));
        }
        currentMethod = null;
        methodBuffer = [];
      };
      for (const line of lines) {
        const pathM = line.match(/^(\s{2,4})(\/[A-Za-z0-9_\-/{}.]+):\s*$/);
        if (pathM) {
          closeMethod();
          currentPath = pathM[2];
          currentIndent = pathM[1].length;
          continue;
        }
        if (currentPath) {
          const methM = line.match(/^(\s+)(get|post|put|patch|delete|head|options):\s*$/i);
          if (methM && methM[1].length > currentIndent) {
            closeMethod();
            currentMethod = methM[2].toUpperCase();
            methodIndent = methM[1].length;
            openapiEndpoints.add(`${currentMethod} ${currentPath}`);
            continue;
          }
          if (currentMethod) {
            // Si la indentacion es mayor que methodIndent, sigue dentro del method.
            const leading = line.match(/^(\s*)/)[1].length;
            if (line.trim() === "" || leading > methodIndent) {
              methodBuffer.push(line);
            } else {
              closeMethod();
            }
          }
        }
      }
      closeMethod();
    }
  }
}
walkContracts(join(root, "specs"));
walkContracts(join(root, "contracts"));

// v12.37: validar el bloque YAML del method tiene shape minimo:
//   - responses con al menos un status (200/201/204/200-499)
//   - si es POST/PUT/PATCH: requestBody con schema
// v12.45: ademas parsear cada schema inline y validar JSON Schema basico:
//   - cada schema debe tener 'type:' (object/array/string/number/boolean/integer)
//   - si type=object: debe tener 'properties:' con al menos un campo
//   - si type=array: debe tener 'items:' con type o $ref
const KNOWN_JSON_TYPES = new Set(["object", "array", "string", "number", "integer", "boolean", "null"]);

// Encuentra cada bloque 'schema:' (no $ref) y lo extrae como (indent, block).
// Retorna [{indent, lines:[...]}] de schemas inline.
function extractInlineSchemas(block) {
  const out = [];
  const lines = block.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^(\s*)schema:\s*$/);
    if (!m) continue;
    const indent = m[1].length;
    // Recoger lineas siguientes con indent > indent.
    const buf = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      const l = lines[j];
      if (l.trim() === "") { buf.push(l); continue; }
      const lead = l.match(/^(\s*)/)[1].length;
      if (lead <= indent) break;
      buf.push(l);
    }
    if (buf.length) {
      // Saltar schemas que son solo $ref.
      const hasRef = buf.some((l) => /^\s*\$ref:\s*['"]?#/.test(l));
      if (!hasRef) out.push({ indent, lines: buf });
    }
  }
  return out;
}

function validateJsonSchemaBlock(schemaLines) {
  const issues = [];
  const text = schemaLines.join("\n");
  // Buscar 'type:' al nivel base del schema (la indentacion minima no vacia).
  const baseIndent = schemaLines
    .filter((l) => l.trim() !== "")
    .reduce((m, l) => Math.min(m, l.match(/^(\s*)/)[1].length), Infinity);
  const typeRx = new RegExp(`^\\s{${baseIndent}}type:\\s*['"]?([a-zA-Z]+)['"]?\\s*$`, "m");
  const typeMatch = text.match(typeRx);
  if (!typeMatch) {
    issues.push("schema sin 'type:' (esperado object/array/string/number/integer/boolean)");
    return issues;
  }
  const type = typeMatch[1].toLowerCase();
  if (!KNOWN_JSON_TYPES.has(type)) {
    issues.push(`schema type='${type}' no es tipo JSON Schema conocido`);
  }
  if (type === "object") {
    const hasProperties = new RegExp(`^\\s{${baseIndent}}properties:\\s*$`, "m").test(text);
    if (!hasProperties) {
      issues.push("schema type=object sin 'properties:' con al menos un campo");
    } else {
      // Verificar que properties tiene al menos un hijo.
      const propsRx = new RegExp(`^\\s{${baseIndent}}properties:\\s*\\n([\\s\\S]*)`, "m");
      const m2 = text.match(propsRx);
      if (m2) {
        const after = m2[1];
        const firstChild = after.split(/\r?\n/).find((l) => {
          if (l.trim() === "") return false;
          const lead = l.match(/^(\s*)/)[1].length;
          return lead > baseIndent;
        });
        if (!firstChild) {
          issues.push("schema 'properties:' vacio (esperado al menos un campo)");
        }
      }
    }
  }
  if (type === "array") {
    const hasItems = new RegExp(`^\\s{${baseIndent}}items:\\s*`, "m").test(text);
    if (!hasItems) {
      issues.push("schema type=array sin 'items:'");
    } else {
      // items debe declarar type o $ref.
      const itemsRx = new RegExp(`^\\s{${baseIndent}}items:\\s*\\n([\\s\\S]*)`, "m");
      const m3 = text.match(itemsRx);
      if (m3) {
        const after = m3[1];
        if (!/\btype:/.test(after) && !/\$ref:/.test(after)) {
          issues.push("schema 'items:' sin type ni $ref");
        }
      }
    }
  }
  return issues;
}

function validateShape(method, key, block) {
  const issues = [];
  if (!block) return issues;
  const hasResponses = /^\s*responses:\s*$/m.test(block);
  if (!hasResponses) {
    issues.push("falta 'responses:' con al menos un status");
  } else {
    // Buscar al menos un status code (ej '200:', '201:', "'404':" o '4xx:')
    const hasStatus = /^\s+['"]?\d{3}['"]?:\s*$/m.test(block) || /^\s+['"]?[1-5]xx['"]?:\s*$/m.test(block);
    if (!hasStatus) {
      issues.push("'responses:' presente pero sin status codes (esperado 200/201/204/4xx/etc.)");
    }
  }
  // Para metodos con body, exigir requestBody con schema o $ref.
  const writeMethods = ["POST", "PUT", "PATCH"];
  if (writeMethods.includes(method)) {
    const hasReqBody = /^\s*requestBody:\s*$/m.test(block);
    if (!hasReqBody) {
      issues.push(`${method} requiere 'requestBody:' con schema (este es write method)`);
    } else {
      const hasSchemaOrRef = /\$ref:/.test(block) || /schema:/m.test(block);
      if (!hasSchemaOrRef) {
        issues.push("'requestBody:' presente pero sin schema/$ref dentro");
      }
    }
  }
  // v12.45: validar cada schema inline (no $ref).
  const schemas = extractInlineSchemas(block);
  schemas.forEach((s, idx) => {
    const schemaIssues = validateJsonSchemaBlock(s.lines);
    for (const si of schemaIssues) {
      issues.push(`schema #${idx + 1}: ${si}`);
    }
  });
  return issues;
}

const missing = [];
const missingFromOpenapi = [];
const malformedShapes = [];
for (const r of apiRefs) {
  const parsed = parseEndpoint(r.target_ref);
  if (!parsed) continue;
  const { method, path: ep } = parsed;
  const keyMd = method ? `${method} ${ep}` : ep;
  const foundMd = documentedEndpoints.has(keyMd) || documentedEndpoints.has(ep);
  if (!foundMd) {
    missing.push({ ref: r.target_ref, source_ref: r.source_ref, source_file: r.source_file });
    continue;
  }
  // v12.36: si existe openapi.yaml, exigir que tambien este ahi.
  if (openapiExists && method) {
    const keyOA = `${method} ${ep}`;
    if (!openapiEndpoints.has(keyOA)) {
      missingFromOpenapi.push({ ref: r.target_ref, source_ref: r.source_ref });
      continue;
    }
    // v12.37: validar shape de request/response.
    const shapeIssues = validateShape(method, keyOA, openapiShapes.get(keyOA));
    if (shapeIssues.length) {
      malformedShapes.push({ ref: r.target_ref, source_ref: r.source_ref, issues: shapeIssues });
    }
  }
}

let exitCode = 0;
if (missing.length > 0) {
  console.error(`API SIN DOCUMENTAR: ${missing.length} endpoint(s) declarado(s) en la matriz no aparecen en ningun api-contract.md.`);
  console.error("");
  for (const m of missing) {
    console.error(`  - "${m.ref}" declarado por ${m.source_ref} en ${m.source_file}`);
  }
  console.error("");
  console.error("Fix: agregar el endpoint formal en `api-contract.md` (de la feature o global).");
  console.error("Formato canonico: '## Endpoint' + linea 'METHOD /path' (ej. 'GET /api/reservations').");
  exitCode = 1;
}
if (missingFromOpenapi.length > 0) {
  console.error("");
  console.error(`API SIN OPENAPI: ${missingFromOpenapi.length} endpoint(s) estan en api-contract.md pero no en openapi.yaml.`);
  for (const m of missingFromOpenapi) {
    console.error(`  - "${m.ref}" (RF: ${m.source_ref})`);
  }
  console.error("");
  console.error("Fix: agregar el path al openapi.yaml con su method bajo 'paths:'.");
  console.error("Ejemplo:");
  console.error("  paths:");
  console.error("    /api/reservations:");
  console.error("      get:");
  console.error("        summary: Lista reservas");
  exitCode = 1;
}
if (malformedShapes.length > 0) {
  console.error("");
  console.error(`API SIN SHAPE: ${malformedShapes.length} endpoint(s) en openapi.yaml sin request/response definidos.`);
  for (const m of malformedShapes) {
    console.error(`  - "${m.ref}" (RF: ${m.source_ref}):`);
    for (const issue of m.issues) console.error(`      * ${issue}`);
  }
  console.error("");
  console.error("Fix: agregar 'responses:' con al menos un status code y, para POST/PUT/PATCH, 'requestBody:' con schema o $ref.");
  exitCode = 1;
}
if (exitCode === 0) {
  const oaNote = openapiExists ? `, ${openapiEndpoints.size} en openapi.yaml` : ", openapi.yaml no encontrado (opcional)";
  console.log(`OK. ${apiRefs.length} endpoints declarados, ${documentedEndpoints.size} entradas documentadas en api-contract.md${oaNote}. Cero huerfanos.`);
  process.exit(0);
}
process.exit(exitCode);

// ── Helpers ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      out[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return out;
}
