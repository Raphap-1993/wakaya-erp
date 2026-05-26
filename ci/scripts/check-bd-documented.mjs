#!/usr/bin/env node
/**
 * check-bd-documented.mjs (v12.45)
 *
 * Para cada tabla declarada en la columna `BD` de algun `traceability.md`,
 * verifica que exista una doc formal `Tabla \`<nombre>\`` en algun
 * `spec-tecnica.md` del repo.
 *
 * Por que: `check-trace-drift` ya usa `targetRefExists('bd', ...)` que busca
 * cualquier mencion del nombre en specs/. Eso es muy permisivo: un parrafo
 * casual con la palabra `transicion_estado` lo marca como implementado, sin
 * que exista una entity real declarada. Este validador es mas estricto:
 * exige la marca canonica `Tabla \`<nombre>\`` (que la plantilla
 * `plantillas/fase-4-sdd/spec-tecnica.md` documenta como obligatoria).
 *
 * Uso:
 *   node ci/scripts/check-bd-documented.mjs
 *   node ci/scripts/check-bd-documented.mjs --root <repo>
 *
 * Exit codes:
 *   0 - todas las BD declaradas tienen doc formal
 *   1 - hay tablas declaradas sin doc canonica
 *   2 - error de configuracion (sin DB, etc)
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, basename } from "node:path";
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

// 1. Recolectar todos los nombres de tabla declarados en target_type='bd'.
//    Filtrar valores vacios o placeholders ('-', 'tbd', etc).
const placeholderRe = /^(\s*[-—]?\s*|n\/?a|na|tbd|pendiente|por definir)$/i;
const bdRefs = db
  .prepare(`SELECT DISTINCT target_ref, source_ref, source_file FROM ai_trace_links WHERE LOWER(target_type) = 'bd'`)
  .all()
  .filter((r) => r.target_ref && !placeholderRe.test(r.target_ref));

if (bdRefs.length === 0) {
  console.log("OK. No hay tablas declaradas en columnas BD de ningun traceability.md.");
  process.exit(0);
}

// 2. Recolectar todas las menciones `Tabla \`<name>\`` en cualquier spec-tecnica.md
// junto con el bloque de columnas/indices que la sigue (hasta el proximo header).
const documentedTables = new Map(); // name -> {file, block}
walkSpecsTecnicas(join(root, "specs"));

function walkSpecsTecnicas(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSpecsTecnicas(full);
    } else if (entry.isFile() && /spec-tecnica\.md$/i.test(entry.name)) {
      const text = readFileSync(full, "utf8");
      // Pattern canonico: `Tabla \`<nombre>\`` o `Tabla **<nombre>**`.
      // Capturamos hasta el proximo "Tabla `" o "## " o final.
      const tableRx = /Tabla\s+(?:`([a-zA-Z0-9_]+)`|\*\*([a-zA-Z0-9_]+)\*\*)/g;
      const positions = [];
      let m;
      while ((m = tableRx.exec(text)) !== null) {
        positions.push({ name: (m[1] || m[2]).toLowerCase(), start: m.index });
      }
      for (let i = 0; i < positions.length; i += 1) {
        const start = positions[i].start;
        const end = (i + 1 < positions.length) ? positions[i + 1].start : findNextHeader(text, start + 1);
        const block = text.slice(start, end);
        if (!documentedTables.has(positions[i].name)) {
          documentedTables.set(positions[i].name, { file: full, block });
        }
      }
    }
  }
}

function findNextHeader(text, fromIdx) {
  const next = text.slice(fromIdx).search(/\n#{1,3}\s/);
  return next < 0 ? text.length : fromIdx + next;
}

// v12.35: validacion de columnas minimas. Una doc canonica debe tener al menos:
//   - una tabla markdown con headers `Columna | Tipo | Notas` (o similar)
//   - mencion explicita de PK (campo `id` con `PK` o similar)
//   - al menos 1 indice (`Indices:` o `INDEX`)
// v12.36: ademas validar que cada fila de tabla use tipos SQL conocidos.
//   Tipos aceptados (case-insensitive): TEXT, VARCHAR, CHAR, UUID, INT, INTEGER,
//   BIGINT, SMALLINT, DECIMAL, NUMERIC, REAL, FLOAT, DOUBLE, BOOLEAN, BOOL,
//   DATE, TIME, TIMESTAMP, TIMESTAMPTZ, JSON, JSONB, BYTEA, BLOB.
//   Aceptamos modifiers: NULL, NOT NULL, FK, PK, UNIQUE, REFERENCES.
const KNOWN_SQL_TYPES = new Set([
  "TEXT", "VARCHAR", "CHAR", "STRING",
  "UUID",
  "INT", "INTEGER", "BIGINT", "SMALLINT", "SERIAL", "BIGSERIAL",
  "DECIMAL", "NUMERIC", "REAL", "FLOAT", "DOUBLE",
  "BOOLEAN", "BOOL",
  "DATE", "TIME", "TIMESTAMP", "TIMESTAMPTZ", "TIMESTAMPZ", "DATETIME",
  "JSON", "JSONB", "ARRAY", "ENUM",
  "BYTEA", "BLOB", "BINARY",
]);
const TYPE_MODIFIERS = new Set(["NULL", "NOT", "FK", "PK", "UNIQUE", "REFERENCES", "DEFAULT", "CHECK"]);

function extractTypeWord(typeCell) {
  // El primer token alfanumerico que parezca un tipo.
  const m = String(typeCell).match(/[A-Za-z]+(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?/);
  if (!m) return null;
  return m[0].replace(/\s*\(.*\)$/, "").toUpperCase();
}

// v12.37: extraer FK targets de una columna. v12.45: ahora devuelve {table, column}
// para poder validar tambien que la columna referenciada exista en la tabla destino.
//   "apunta a `usuario.id`"   -> {table:"usuario", column:"id"}
//   "FK -> usuario.id"        -> {table:"usuario", column:"id"}
//   "REFERENCES usuario(id)"  -> {table:"usuario", column:"id"}
//   "FK usuario.id"           -> {table:"usuario", column:"id"}
//   "FK usuario"              -> {table:"usuario", column:null}
function extractFkTarget(cellText) {
  if (!cellText) return null;
  const s = String(cellText);
  const patterns = [
    { re: /apunta\s+a\s+`?([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)`?/i, hasCol: true },
    { re: /REFERENCES\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?\s*\(\s*`?([a-zA-Z_][a-zA-Z0-9_]*)`?\s*\)/i, hasCol: true },
    { re: /(?:FK|REFERENCES)\s*(?:->)?\s*`?([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)`?/i, hasCol: true },
    { re: /(?:FK|REFERENCES)\s*(?:->)?\s*`?([a-zA-Z_][a-zA-Z0-9_]*)`?/i, hasCol: false },
  ];
  for (const p of patterns) {
    const m = s.match(p.re);
    if (m && m[1]) {
      return {
        table: m[1].toLowerCase(),
        column: p.hasCol && m[2] ? m[2].toLowerCase() : null,
      };
    }
  }
  return null;
}

// v12.45: extrae las columnas de un bloque "Tabla `<name>` ..." (lista markdown).
function extractColumnsOf(block) {
  const cols = new Set();
  if (!block) return cols;
  const lines = block.split(/\r?\n/);
  let inTable = false, headerSeen = false;
  for (const line of lines) {
    if (!inTable && /\|\s*columna\s*\|/i.test(line)) { inTable = true; continue; }
    if (inTable && /^\s*\|[\s-]+\|/.test(line)) { headerSeen = true; continue; }
    if (inTable && headerSeen) {
      if (!line.trim().startsWith("|")) { inTable = false; continue; }
      const cells = line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      if (cells.length >= 1) {
        const colName = cells[0].toLowerCase().replace(/`/g, "").trim();
        if (colName) cols.add(colName);
      }
    }
  }
  return cols;
}

function validateTableBlock(name, block, knownTables) {
  // knownTables: Map<name, {file, block}> de todas las tablas documentadas.
  const issues = [];
  // Tabla markdown con al menos una fila de columna.
  const hasMdTable = /\|\s*columna\s*\|/i.test(block) && /\|---/.test(block);
  if (!hasMdTable) {
    issues.push(`falta tabla markdown con headers '| Columna | Tipo | Notas |'`);
    return issues; // sin tabla, no podemos validar mas
  }
  // PK declarada (id con PK).
  const hasPk = /\bpk\b/i.test(block) || /primary\s*key/i.test(block);
  if (!hasPk) {
    issues.push(`falta declaracion de PK (poner 'PK' en la fila del id o 'PRIMARY KEY' en restricciones)`);
  }
  // Al menos 1 indice.
  const hasIndex = /indices?\s*:/i.test(block) || /\bINDEX\b/i.test(block);
  if (!hasIndex) {
    issues.push(`falta seccion 'Indices: ...' con al menos un indice`);
  }
  // v12.36: validar tipos SQL conocidos en cada fila de la tabla markdown.
  // v12.37: ademas validar FK targets reales (que la tabla referenciada exista).
  // v12.45: ademas validar que la columna referenciada exista en la tabla destino.
  // Tablas builtin que no exigimos documentar (suelen vivir en infra cross-feature).
  // Para builtin asumimos columna 'id' como PK por convencion.
  const builtinTables = new Set(["usuario", "user", "users", "auth", "role", "permission"]);
  const lines = block.split(/\r?\n/);
  let inTable = false;
  let headerSeen = false;
  const unknownTypes = [];
  const unknownFks = [];
  const unknownFkCols = [];
  for (const line of lines) {
    if (!inTable && /\|\s*columna\s*\|/i.test(line)) { inTable = true; continue; }
    if (inTable && /^\s*\|[\s-]+\|/.test(line)) { headerSeen = true; continue; }
    if (inTable && headerSeen) {
      if (!line.trim().startsWith("|")) { inTable = false; continue; }
      const cells = line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      if (cells.length < 2) continue;
      const col = cells[0];
      const typeCell = cells[1];
      const notesCell = cells[2] || "";
      // Validar tipo SQL conocido.
      const typeWord = extractTypeWord(typeCell);
      if (typeWord && !TYPE_MODIFIERS.has(typeWord) && !KNOWN_SQL_TYPES.has(typeWord)) {
        unknownTypes.push(`${col} -> "${typeCell}" (no es tipo SQL conocido)`);
      }
      // v12.37/v12.45: si la celda Tipo o Notas indica FK, extraer target y validar
      // que la tabla exista Y que la columna referenciada exista.
      const isFkColumn = /\bFK\b/i.test(typeCell) || /\bFK\b/i.test(notesCell) || /REFERENCES/i.test(typeCell + " " + notesCell) || /apunta\s+a/i.test(notesCell);
      if (isFkColumn) {
        const target = extractFkTarget(typeCell) || extractFkTarget(notesCell);
        if (target) {
          const isBuiltin = builtinTables.has(target.table);
          const tableExists = isBuiltin || (knownTables && knownTables.has(target.table));
          if (!tableExists) {
            unknownFks.push(`${col} -> ${target.table} (tabla no documentada con \`Tabla \`${target.table}\`\`)`);
          } else if (target.column) {
            // v12.45: validar columna referenciada.
            if (isBuiltin) {
              // Para builtin solo aceptamos 'id' por convencion PK.
              if (target.column !== "id") {
                unknownFkCols.push(`${col} -> ${target.table}.${target.column} (tabla builtin, solo se acepta '.id')`);
              }
            } else {
              const targetDoc = knownTables.get(target.table);
              const targetCols = extractColumnsOf(targetDoc.block);
              if (!targetCols.has(target.column)) {
                unknownFkCols.push(`${col} -> ${target.table}.${target.column} (tabla OK pero columna '${target.column}' no esta declarada en ${basename(targetDoc.file)})`);
              }
            }
          }
        }
      }
    }
  }
  if (unknownTypes.length) {
    issues.push(`columnas con tipos no reconocidos: ${unknownTypes.join("; ")}`);
  }
  if (unknownFks.length) {
    issues.push(`FKs que apuntan a tablas no documentadas: ${unknownFks.join("; ")}`);
  }
  if (unknownFkCols.length) {
    issues.push(`FKs que apuntan a columnas inexistentes: ${unknownFkCols.join("; ")}`);
  }
  return issues;
}

// 3. Comparar declarado vs documentado y validar columnas minimas.
const missing = [];
const incomplete = [];
for (const r of bdRefs) {
  const tableName = String(r.target_ref).trim().split(/[\s(]/)[0].toLowerCase();
  if (!tableName) continue;
  const doc = documentedTables.get(tableName);
  if (!doc) {
    missing.push({ name: tableName, source_ref: r.source_ref, source_file: r.source_file });
    continue;
  }
  // v12.35: validar columnas minimas + tipos SQL + (v12.37) FK targets reales
  // + (v12.45) columnas referenciadas reales.
  // Pasamos el Map completo para poder hacer extractColumnsOf de la tabla destino.
  const colIssues = validateTableBlock(tableName, doc.block, documentedTables);
  if (colIssues.length) {
    incomplete.push({ name: tableName, file: doc.file, issues: colIssues });
  }
}

// Deduplicar incomplete por name (mismo nombre puede aparecer N veces en bdRefs)
const dedupIncomplete = [];
const seenIncomplete = new Set();
for (const item of incomplete) {
  if (seenIncomplete.has(item.name)) continue;
  seenIncomplete.add(item.name);
  dedupIncomplete.push(item);
}

let exitCode = 0;
if (missing.length > 0) {
  console.error(`BD SIN DOCUMENTAR: ${missing.length} tabla(s) sin marca canonica en spec-tecnica.md.`);
  for (const m of missing) {
    console.error(`  - "${m.name}" declarada por ${m.source_ref} en ${m.source_file}`);
  }
  console.error("");
  exitCode = 1;
}
if (dedupIncomplete.length > 0) {
  console.error(`BD INCOMPLETAS: ${dedupIncomplete.length} tabla(s) documentadas pero sin columnas minimas (id/PK, tabla markdown, indices).`);
  for (const i of dedupIncomplete) {
    console.error(`  - "${i.name}" en ${i.file}:`);
    for (const issue of i.issues) console.error(`      * ${issue}`);
  }
  console.error("");
  console.error("Fix: usar la plantilla canonica de `plantillas/fase-4-sdd/spec-tecnica.md`.");
  exitCode = 1;
}
if (exitCode === 0) {
  console.log(`OK. ${bdRefs.length} tablas declaradas, ${documentedTables.size} documentadas con columnas minimas. Cero huerfanos.`);
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
