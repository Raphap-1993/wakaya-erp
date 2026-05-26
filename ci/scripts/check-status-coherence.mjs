#!/usr/bin/env node
/**
 * check-status-coherence.mjs (v12.45)
 *
 * Valida que cada `ai_trace_links.display_status` sea coherente con
 * `link_status` segun la matriz de v12.41 (computeDisplayStatus):
 *
 *   - codigo/test:   display_status == link_status (planned/implemented/validated)
 *   - bd/api/spdd/sdd/prototipo/pantalla/componente/doc:
 *       planned     -> pending
 *       implemented -> documented
 *       validated   -> approved
 *   - hu/rf/rnf/estado:   display_status == 'documented' (siempre)
 *   - inferred/drift:     display_status == link_status
 *
 * Si en el proyecto se usa MEMORY_DISPLAY_VOCAB, los terminos del vocabulario
 * para non-code/documental se aceptan en su lugar.
 *
 * Sin este validador, el frontend del agente puede mostrar valores
 * heredados (ej. 'planned' literal en una BD donde semanticamente deberia
 * decir 'pending'), confundiendo a humanos que leen el panel.
 *
 * Exit codes:
 *   0 - todos los links son coherentes
 *   1 - hay incoherencias
 *   2 - error de configuracion
 */

import { existsSync } from "node:fs";
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

const NON_CODE = new Set(["spdd", "sdd", "product-design", "prototipo", "api", "bd", "pantalla", "componente", "doc"]);
const DOCUMENTAL = new Set(["hu", "rf", "rnf", "estado"]);

// Cargar vocabulario configurable.
const DISPLAY_VOCAB_DEFAULT = {
  "non-code": ["pending", "documented", "approved"],
  "documental": ["documented"],
};
function loadVocab() {
  const raw = process.env.MEMORY_DISPLAY_VOCAB;
  if (!raw) return DISPLAY_VOCAB_DEFAULT;
  const out = { ...DISPLAY_VOCAB_DEFAULT };
  for (const part of String(raw).split(",")) {
    const [cat, terms] = part.split(":");
    if (!cat || !terms) continue;
    const ts = terms.split("/").map((s) => s.trim()).filter(Boolean);
    if (cat.trim() === "non-code" && ts.length === 3) out["non-code"] = ts;
    else if (cat.trim() === "documental" && ts.length >= 1) out["documental"] = ts;
  }
  return out;
}
const VOCAB = loadVocab();

function expectedDisplay(linkStatus, targetType) {
  if (!linkStatus) return null;
  if (linkStatus === "inferred" || linkStatus === "drift") return linkStatus;
  const t = String(targetType || "").toLowerCase();
  if (t === "codigo" || t === "test") return linkStatus;
  if (NON_CODE.has(t)) {
    const [vPending, vDocumented, vApproved] = VOCAB["non-code"];
    if (linkStatus === "planned") return vPending;
    if (linkStatus === "implemented") return vDocumented;
    if (linkStatus === "validated") return vApproved;
    return linkStatus;
  }
  if (DOCUMENTAL.has(t)) return VOCAB["documental"][0];
  return linkStatus;
}

let rows;
try {
  rows = db.prepare(`
    SELECT id, source_type, source_ref, target_type, target_ref, link_status, display_status, source_file
    FROM ai_trace_links
    WHERE link_status IS NOT NULL
  `).all();
} catch (err) {
  console.error(`Error leyendo ai_trace_links: ${err.message || err}`);
  process.exit(2);
}

const issues = [];
for (const r of rows) {
  const expected = expectedDisplay(r.link_status, r.target_type);
  if (expected == null) continue;
  if ((r.display_status || "") === expected) continue;
  issues.push({
    id: r.id,
    source: `${r.source_type}:${r.source_ref}`,
    target: `${r.target_type}:${r.target_ref}`,
    link_status: r.link_status,
    actual: r.display_status || "(null)",
    expected,
    source_file: r.source_file || "?",
  });
}

if (issues.length === 0) {
  console.log(`OK. ${rows.length} trace links con display_status coherente respecto a link_status (vocab: ${JSON.stringify(VOCAB)}).`);
  process.exit(0);
}

console.error(`INCOHERENCIA: ${issues.length}/${rows.length} trace links con display_status que NO coincide con la regla v12.41.`);
const MAX_SHOW = 40;
for (const i of issues.slice(0, MAX_SHOW)) {
  console.error(`  - [#${i.id}] ${i.source} -> ${i.target}  link=${i.link_status}  display=${i.actual} (esperado: ${i.expected})  en ${i.source_file}`);
}
if (issues.length > MAX_SHOW) {
  console.error(`  ... y ${issues.length - MAX_SHOW} mas.`);
}
console.error("");
console.error("Fix: corre `npm run memory:sync` para que computeDisplayStatus repoble display_status.");
console.error("Si el desajuste persiste despues de sync, revisa MEMORY_DISPLAY_VOCAB y la matriz computeDisplayStatus en scripts/ai-framework-agent.mjs.");
process.exit(1);

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
