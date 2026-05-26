#!/usr/bin/env node
/**
 * check-test-documented.mjs (v12.45)
 *
 * Para cada test declarado en la columna `Test` de algun `traceability.md`,
 * verifica que exista archivo real en `tests/`, `qa/`, `src/<feature>/__tests__/`
 * o equivalente. Solo aplica a features con phase >= 6 (QA).
 *
 * En features con phase < 6, los nombres de test son aspiracionales y deben
 * estar como `-` (regla v12.22+). Por eso este validador es estricto solo
 * cuando la feature realmente entro a QA.
 *
 * Uso:
 *   node ci/scripts/check-test-documented.mjs
 *   node ci/scripts/check-test-documented.mjs --min-phase 6
 *
 * Exit codes:
 *   0 - cobertura test completa en features QA, o no hay features en fase >=6
 *   1 - hay tests declarados sin archivo real en features QA
 *   2 - error de configuracion
 */

import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { resolve, join, basename, extname } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || ".");
const dbPath = args.db ? resolve(args.db) : join(root, "ai", "memory", "framework-agent.db");
const minPhase = Number(args["min-phase"] ?? 6);

if (!existsSync(dbPath)) {
  console.error(`No existe DB: ${dbPath}. Corre primero index-docs + sync-memory.`);
  process.exit(2);
}

const db = new DatabaseSync(dbPath);

function phaseToNumber(phaseStr) {
  if (!phaseStr) return null;
  const s = String(phaseStr).toLowerCase();
  const num = parseInt(s.match(/(\d+)/)?.[1] || "0", 10);
  if (num > 0) return num;
  if (/qa/.test(s)) return 6;
  if (/construcci/.test(s)) return 5;
  if (/sdd/.test(s)) return 4;
  return null;
}

// 1. Detectar scopes en fase >= minPhase (QA).
const featureScopes = db.prepare(`SELECT DISTINCT phase_scope AS scope FROM ai_gate_runs WHERE phase_scope LIKE 'specs/%'`).all().map((r) => r.scope);
const activeFeatures = featureScopes.filter((scope) => {
  const docs = db.prepare(`SELECT phase FROM ai_documents WHERE path LIKE ?`).all(`${scope}/%`);
  for (const d of docs) {
    const p = phaseToNumber(d.phase);
    if (p != null && p >= minPhase) return true;
  }
  return false;
});

if (activeFeatures.length === 0) {
  console.log(`OK. No hay features en fase >= ${minPhase} (QA). check-test-documented solo aplica cuando hay tests reales.`);
  process.exit(0);
}

// 2. Recolectar archivos de test del repo.
const testFiles = [];
const TEST_DIRS = ["tests", "qa", "test", "__tests__"];
const TEST_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".java", ".kt", ".py", ".go", ".rs", ".cs"]);
function walkTests(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", ".tmp", "dist", "build"].includes(entry.name)) continue;
      walkTests(full);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (!TEST_EXTS.has(ext)) continue;
      // Heuristica: el archivo es test si su nombre incluye 'test' o 'spec' o esta bajo un dir de test.
      const nameL = entry.name.toLowerCase();
      const inTestDir = TEST_DIRS.some((t) => full.includes(`/${t}/`) || full.includes(`\\${t}\\`));
      if (inTestDir || /(test|spec)/.test(nameL)) testFiles.push(full);
    }
  }
}
walkTests(join(root, "tests"));
walkTests(join(root, "qa"));
walkTests(join(root, "src"));
walkTests(join(root, "backend"));
walkTests(join(root, "frontend"));

// 3. Para cada feature en fase QA, validar que cada Test declarado tenga archivo real.
// Placeholders + valores descriptivos que no son nombres de archivo de test.
function isPlaceholder(s) {
  const v = String(s || "").trim().toLowerCase();
  if (!v || v === "-" || v === "—") return true;
  if (/^(n\/?a|na|tbd|pendiente|por definir)$/.test(v)) return true;
  // "e2e seguridad", "performance/smoke" no son nombres de archivo, son
  // descripciones de tipo de prueba; ignorarlas aqui.
  if (/^e2e\s+/.test(v)) return true;
  if (v.includes("/") && !v.endsWith(".ts") && !v.endsWith(".js") && !v.endsWith(".java")) return true;
  return false;
}
// v12.36: cache de @trace RF-XX por archivo de test. Lee el archivo solo
// la primera vez y mantiene el Set de RFs/RNFs/HUs cubiertos.
const testFileTraces = new Map();
function tracesIn(path) {
  if (testFileTraces.has(path)) return testFileTraces.get(path);
  const set = new Set();
  try {
    const text = readFileSync(path, "utf8");
    const rx = /@(?:trace|covers|implements)\s+(RF-\d+|RNF-\d+|HU-\d+)/gi;
    let m;
    while ((m = rx.exec(text)) !== null) set.add(m[1].toUpperCase());
  } catch { /* ignorar lectura fallida */ }
  testFileTraces.set(path, set);
  return set;
}

// v12.37: parsear lcov.info si existe y devolver Map: source_file -> {LH, LF, BRH, BRF, DA}.
// v12.45: ademas conservar DA: { lineNo -> hits } por archivo para granularidad por RF.
function loadLcovCoverage(rootDir) {
  const candidates = [
    join(rootDir, "coverage", "lcov.info"),
    join(rootDir, "coverage", "lcov-report", "lcov.info"),
    join(rootDir, "coverage-report", "lcov.info"),
    join(rootDir, ".coverage", "lcov.info"),
  ];
  let lcovPath = null;
  for (const c of candidates) {
    if (existsSync(c)) { lcovPath = c; break; }
  }
  if (!lcovPath) return null;
  const out = new Map();
  try {
    const text = readFileSync(lcovPath, "utf8");
    const lines = text.split(/\r?\n/);
    let current = null;
    for (const line of lines) {
      if (line.startsWith("SF:")) {
        current = { source: line.slice(3).trim(), LH: 0, LF: 0, BRH: 0, BRF: 0, DA: new Map() };
        continue;
      }
      if (!current) continue;
      if (line.startsWith("DA:")) {
        const parts = line.slice(3).split(",");
        const ln = Number(parts[0]);
        const hits = Number(parts[1]);
        if (!Number.isNaN(ln)) current.DA.set(ln, hits);
      } else if (line.startsWith("LH:")) current.LH = Number(line.slice(3)) || 0;
      else if (line.startsWith("LF:")) current.LF = Number(line.slice(3)) || 0;
      else if (line.startsWith("BRH:")) current.BRH = Number(line.slice(4)) || 0;
      else if (line.startsWith("BRF:")) current.BRF = Number(line.slice(4)) || 0;
      else if (line === "end_of_record") {
        if (current.LF > 0) out.set(current.source.replace(/\\/g, "/").toLowerCase(), current);
        current = null;
      }
    }
  } catch { return null; }
  return out;
}

// v12.45: buscar archivos de produccion bajo src/<slug>/ o stacks/*/template/src/<slug>/
// que contengan @trace RF-X (o @covers/@implements). Retorna Map: 'RF-X' -> Set<file>.
function buildProdTraceIndex(rootDir) {
  const idx = new Map(); // 'RF-X' -> Set<absPath>
  const PROD_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".java", ".kt", ".py", ".go", ".rs", ".cs"]);
  const SKIP_DIRS = new Set(["node_modules", ".git", ".tmp", "dist", "build", "coverage", "tests", "__tests__"]);
  function walk(d) {
    if (!existsSync(d)) return;
    let entries;
    try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(full);
      } else if (e.isFile()) {
        const ext = extname(e.name).toLowerCase();
        if (!PROD_EXTS.has(ext)) continue;
        const nameL = e.name.toLowerCase();
        if (/\.(test|spec)\./.test(nameL)) continue;
        try {
          const text = readFileSync(full, "utf8");
          const rx = /@(?:trace|covers|implements)\s+(RF-\d+|RNF-\d+|HU-\d+)/gi;
          let m;
          while ((m = rx.exec(text)) !== null) {
            const rf = m[1].toUpperCase();
            if (!idx.has(rf)) idx.set(rf, new Set());
            idx.get(rf).add(full);
          }
        } catch { /* ignorar */ }
      }
    }
  }
  walk(join(rootDir, "src"));
  walk(join(rootDir, "backend"));
  walk(join(rootDir, "frontend"));
  walk(join(rootDir, "stacks"));
  return idx;
}

const lcovData = loadLcovCoverage(root);
const minCoverageLines = Number(args["min-coverage"] ?? 70); // % minimo de cobertura de linea por RF
// v12.45: indice por RF -> archivos de produccion que lo declaran via @trace.
const prodTraceIdx = buildProdTraceIndex(root);

const missing = [];
const missingTrace = [];
const lowCoverage = [];
for (const scope of activeFeatures) {
  const testRefs = db.prepare(`SELECT DISTINCT target_ref, source_ref FROM ai_trace_links WHERE LOWER(target_type) = 'test' AND (source_file LIKE ? OR evidence_ref LIKE ?)`).all(`${scope}/%`, `%${scope}%`);
  for (const t of testRefs) {
    const refRaw = String(t.target_ref || "").trim();
    if (isPlaceholder(refRaw)) continue;
    const needle = refRaw.replace(/\..*$/, "").toLowerCase();
    const matchedFiles = testFiles.filter((f) => basename(f).toLowerCase().includes(needle));
    if (matchedFiles.length === 0) {
      missing.push({ feature: scope, ref: refRaw, source_ref: t.source_ref });
      continue;
    }
    // v12.36: verificar que al menos uno de los archivos matched menciona el RF
    // de origen (source_ref) con un @trace / @covers / @implements.
    const rfToCover = String(t.source_ref || "").toUpperCase();
    if (!/^(RF|RNF|HU)-\d+$/i.test(rfToCover)) continue;
    const covers = matchedFiles.some((f) => tracesIn(f).has(rfToCover));
    if (!covers) {
      missingTrace.push({ feature: scope, ref: refRaw, source_ref: rfToCover, files: matchedFiles.slice(0, 3) });
      continue;
    }
    // v12.37/v12.45: si hay lcov, validar cobertura POR RF granular.
    // Estrategia: encontrar archivos de produccion que declaran @trace RF-X
    // (prodTraceIdx). Si hay matches, agregar SOLO esos archivos. Si no hay
    // matches por RF, caer al fallback v12.37 (por slug de feature).
    if (lcovData) {
      const slug = scope.replace(/^specs\//, "");
      let totalLF = 0, totalLH = 0, source = "feature-slug";
      const prodFilesForRf = prodTraceIdx.get(rfToCover);
      if (prodFilesForRf && prodFilesForRf.size > 0) {
        source = "rf-granular";
        for (const pf of prodFilesForRf) {
          const key = pf.replace(/\\/g, "/").toLowerCase();
          // match por endsWith para tolerar paths absolutos vs relativos en lcov.
          for (const [src, cov] of lcovData) {
            if (src === key || key.endsWith(src) || src.endsWith(key.replace(root.replace(/\\/g, "/").toLowerCase() + "/", ""))) {
              totalLF += cov.LF;
              totalLH += cov.LH;
            }
          }
        }
      }
      if (totalLF === 0) {
        // Fallback: agregar por slug de feature (compat v12.37).
        source = "feature-slug-fallback";
        for (const [src, cov] of lcovData) {
          if (src.includes(`/${slug}/`) || src.endsWith(`/${slug}`)) {
            totalLF += cov.LF;
            totalLH += cov.LH;
          }
        }
      }
      if (totalLF > 0) {
        const pct = (100 * totalLH) / totalLF;
        if (pct < minCoverageLines) {
          lowCoverage.push({ feature: scope, source_ref: rfToCover, pct: pct.toFixed(1), lh: totalLH, lf: totalLF, min: minCoverageLines, source });
        }
      }
    }
  }
}

let exitCode = 0;
if (missing.length > 0) {
  console.error(`TESTS SIN ARCHIVO: ${missing.length} test(s) declarado(s) en la matriz no tienen archivo en tests/, qa/, src/.`);
  for (const i of missing) {
    console.error(`  - "${i.ref}" (RF: ${i.source_ref}) en ${i.feature}`);
  }
  console.error("");
  console.error("Fix: crear el archivo de test correspondiente o, si aun no esta listo, cambiar el valor en la columna Test a '-'.");
  exitCode = 1;
}
if (missingTrace.length > 0) {
  console.error("");
  console.error(`TESTS SIN @trace: ${missingTrace.length} test(s) existen pero no referencian el RF que cubren via @trace / @covers / @implements.`);
  for (const i of missingTrace) {
    console.error(`  - ${i.feature} :: ${i.ref}`);
    console.error(`      esperado: ${i.source_ref}`);
    console.error(`      archivos: ${i.files.map((f) => f.replace(root, "<root>")).join(", ")}`);
  }
  console.error("");
  console.error("Fix: agregar comentario `@trace ${RF-XX}` o `@covers RF-XX` en el archivo de test.");
  console.error("Ejemplo: // @covers RF-02 — bandeja muestra solo expedientes del rol activo");
  exitCode = 1;
}
if (lowCoverage.length > 0) {
  console.error("");
  console.error(`COVERAGE INSUFICIENTE: ${lowCoverage.length} feature(s) con cobertura de linea < ${minCoverageLines}% en lcov.info.`);
  for (const i of lowCoverage) {
    console.error(`  - ${i.feature} (RF ${i.source_ref}): ${i.pct}% (${i.lh}/${i.lf} lineas, minimo ${i.min}%) [agregacion: ${i.source || "feature-slug"}]`);
  }
  console.error("");
  console.error("Fix: agregar tests o bajar el umbral con `--min-coverage <N>`.");
  exitCode = 1;
}
if (exitCode === 0) {
  const covNote = lcovData ? ` Coverage lcov: ${lcovData.size} archivos analizados (min ${minCoverageLines}% por feature).` : ` Sin lcov.info; coverage no validado.`;
  console.log(`OK. ${activeFeatures.length} feature(s) en fase >= ${minPhase} con tests declarados encontrados Y con @trace al RF correspondiente.${covNote}`);
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
