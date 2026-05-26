#!/usr/bin/env node
/**
 * check-trace-drift.mjs
 *
 * Valida que cada target_ref en ai_trace_links (tipos codigo/test/api/bd/
 * pantalla/componente/prototipo/spdd/sdd) resuelve a algo real:
 *   - codigo/test: existe un archivo cuyo nombre base coincide con el ref
 *     en src/, backend/, frontend/, tests/.
 *   - api: el endpoint aparece en contracts/api/*.yaml o en algun .md de specs.
 *   - prototipo/spdd/sdd/pantalla/componente: la ruta o nombre aparece en
 *     algun archivo del repo.
 *
 * Uso:
 *   node ci/scripts/check-trace-drift.mjs
 *   node ci/scripts/check-trace-drift.mjs --root <repo> --db <ruta>
 *
 * Exit codes:
 *   0 — sin drift
 *   1 — drift detectado (lista los target_ref huerfanos)
 */

import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { resolve, join, basename, extname } from "node:path";
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
const SOURCE_DIRS = ["src", "backend", "frontend", "tests"];
const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".mjs", ".java", ".kt", ".py", ".go", ".rs", ".cs"]);

const sourceFiles = collectFiles(root, SOURCE_DIRS, SOURCE_EXTS);
const allMd = collectFiles(root, ["docs", "specs", "ai", "qa"], new Set([".md"]));
const allApiSpecs = collectFiles(root, ["contracts", "specs"], new Set([".yaml", ".yml", ".json"]));

const links = db
  .prepare(
    `SELECT id, source_type, source_ref, target_type, target_ref
     FROM ai_trace_links
     WHERE target_type IN ('codigo', 'test', 'api', 'bd', 'prototipo', 'spdd', 'sdd', 'pantalla', 'componente', 'product-design')`,
  )
  .all();

const issues = [];
for (const link of links) {
  if (!validateTarget(link)) {
    issues.push(link);
  }
}

if (issues.length === 0) {
  console.log(`OK. ${links.length} trace links validados; cero drift.`);
  process.exit(0);
}

console.error(`DRIFT: ${issues.length} trace links apuntan a artefactos que no existen.`);
for (const link of issues) {
  console.error(`  ${link.source_ref} --${link.target_type}--> ${link.target_ref}`);
}
process.exit(1);

// ── Helpers ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--root") out.root = argv[++i];
    else if (argv[i] === "--db") out.db = argv[++i];
  }
  return out;
}

function collectFiles(rootDir, dirs, exts) {
  const result = [];
  const walk = (abs) => {
    if (!existsSync(abs)) return;
    let st;
    try {
      st = statSync(abs);
    } catch {
      return;
    }
    if (st.isDirectory()) {
      const base = basename(abs);
      if (["node_modules", ".git", ".tmp", "dist", "build", "target", ".next"].includes(base))
        return;
      for (const entry of readdirSync(abs)) walk(join(abs, entry));
      return;
    }
    if (st.isFile() && exts.has(extname(abs).toLowerCase())) result.push(abs);
  };
  for (const d of dirs) walk(resolve(rootDir, d));
  return result;
}

function validateTarget(link) {
  const target = String(link.target_ref || "").trim();
  if (!target || target === "-") return true; // celdas vacias

  switch (link.target_type) {
    case "codigo":
    case "test": {
      // Buscar archivo por nombre base o por path parcial.
      const t = target.toLowerCase();
      return sourceFiles.some((f) => {
        const fname = basename(f).toLowerCase();
        return fname.includes(t.replace(/\..*$/, "")) || f.toLowerCase().endsWith(t.toLowerCase());
      });
    }
    case "api": {
      // Buscar "METODO /ruta" o "/ruta" en specs Markdown o contratos.
      const needle = target.replace(/^\w+\s+/, "").toLowerCase();
      return (
        allMd.some((f) => readFileSafe(f).toLowerCase().includes(needle)) ||
        allApiSpecs.some((f) => readFileSafe(f).toLowerCase().includes(needle))
      );
    }
    case "bd": {
      // Buscar nombre de tabla/entidad.
      const t = target.split(/[\s(]/)[0].toLowerCase();
      return (
        allMd.some((f) => readFileSafe(f).toLowerCase().includes(t)) ||
        sourceFiles.some((f) => readFileSafe(f).toLowerCase().includes(t))
      );
    }
    case "prototipo":
    case "spdd":
    case "sdd":
    case "product-design":
    case "pantalla":
    case "componente": {
      const needle = target.toLowerCase();
      return (
        existsSafe(join(root, target)) ||
        allMd.some((f) => readFileSafe(f).toLowerCase().includes(needle))
      );
    }
    default:
      return true;
  }
}

function readFileSafe(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function existsSafe(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}
