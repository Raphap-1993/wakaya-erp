#!/usr/bin/env node
// Enterprise AI Framework Agent CLI.
//
// Este ejecutable no sustituye a un LLM. Materializa la parte operacional:
// memoria SQLite portable, lectura/indexacion de documentacion, routing,
// plan de creacion y ejecucion del bootstrap de proyectos reales.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { spawn, spawnSync } from "node:child_process";

const SUPPORTED_STACKS = new Set(["node-next", "java-monolith", "quarkus-angular", "spring-react"]);
const DEFAULT_DOC_PATHS = [
  "AGENTS.md",
  "README.md",
  "AI_CONTEXT.md",
  "PROJECT_MAP.md",
  "GLOSSARY.md",
  "TRACEABILITY_MATRIX.md",
  "SESSION_LOG.md",
  "template.config.example.json",
  "docs",
  "ai",
  "specs",
  "qa",
  "stacks/README.md",
  "scripts/new-service.mjs",
  "scripts/validate-template-config.mjs",
];
const TEXT_EXTENSIONS = new Set([
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".mjs",
  ".js",
  ".ts",
  ".tsx",
  ".sql",
  ".ps1",
  ".sh",
]);
const IGNORED_DIRS = new Set([
  ".git",
  ".tmp",
  "node_modules",
  "dist",
  "build",
  "target",
  ".gradle",
  ".next",
  ".angular",
  "coverage",
  "playwright-report",
  "test-results",
  "__pycache__",
  ".venv",
]);
const REQUIRED_CREATE_DOCS = [
  "AGENTS.md",
  "docs/fase-0-iniciacion/00.00-guia-de-uso.md",
  "docs/fase-0-iniciacion/00.05-checklist-adopcion.md",
  "docs/fase-0-iniciacion/00.10-idea-a-documentacion-inicial-con-ia.md",
  "docs/transversal/90.10-entregables-minimos-por-fase.md",
  "docs/transversal/90.11-checklist-entregables.md",
  "docs/transversal/90.12-mapa-ia-por-fase.md",
  "docs/transversal/90.14-instanciacion-fases-proyectos-reales.md",
  "docs/transversal/90.30-principios-solid-diseno-modular.md",
  "docs/transversal/90.32-agente-interno-framework-ai-first.md",
  "docs/transversal/90.33-flujo-delivery-ia-proveedores.md",
  "docs/transversal/90.34-product-design-y-spdd-frontend.md",
  "docs/fase-2-ux-ui/02.11-checklist-product-design.md",
  "docs/fase-2-ux-ui/02.12-checklist-spdd.md",
  "docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md",
  "docs/fase-2-ux-ui/02.14-html5-first-prototyping.md",
  "ai/agents/enterprise-ai-framework-agent.md",
  "ai/prompts/crear-proyecto-real-desde-template.md",
  "ai/prompts/generar-prototipo-html5-desde-spdd.md",
  "ai/prompts/generar-prototipo-penpot-desde-spdd.md",
  "ai/skills/framework-governance.skill.md",
  "ai/references/framework-enterprise-ai-first.md",
  "ai/runbooks/crear-proyecto-real-con-agente.md",
  "docs/transversal/90.25-threat-modeling.md",
  "docs/transversal/90.26-contract-governance.md",
  "docs/transversal/90.29-integracion-selectiva-agent-skills.md",
  "ai/commands/document-command.md",
  "ai/commands/ux-command.md",
  "ai/commands/spec-command.md",
  "ai/commands/review-command.md",
  "ai/commands/test-command.md",
  "ai/commands/build-command.md",
  "ai/commands/ship-command.md",
  "ai/commands/plan-command.md",
  "ai/commands/prototype-command.md",
  "ai/skills/security-hardening.skill.md",
  "ai/skills/backend.skill.md",
  "ai/skills/frontend.skill.md",
  "ai/skills/browser-testing.skill.md",
  "ai/skills/html5-prototyping.skill.md",
  "ai/skills/penpot-ai-prototyping.skill.md",
  "ai/skills/source-driven-development.skill.md",
  "ai/skills/performance-optimization.skill.md",
  "ai/skills/debugging-workflow.skill.md",
  "stacks/README.md",
  "template.config.example.json",
];
let DatabaseSyncClass = null;
const TEMPLATE_LIKE_PATTERNS = [
  /^\s*(?:[-*]\s*)?Describe\b/im,
  /^\s*(?:[-*]\s*)?Lista\b/im,
  /^\s*(?:[-*]\s*)?Define\b/im,
  /^\s*(?:[-*]\s*)?Completa\b/im,
  /Espacio reservado/i,
  /Scaffolding para/i,
  /Antes de promover/i,
  /Adaptacion al proyecto real/i,
  /stacks\/.+\/template/i,
];
const GENERATED_DOC_NAV_ORDER = [
  "docs/README.md",
  "docs/fase-0-iniciacion/README.md",
  "docs/fase-0-iniciacion/00.01-vision-proyecto.md",
  "docs/fase-0-iniciacion/00.02-roadmap.md",
  "docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md",
  "docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md",
  "docs/fase-1-analisis-requerimientos/README.md",
  "docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md",
  "docs/fase-2-ux-ui/README.md",
  "docs/fase-2-ux-ui/02.00-ux-ui.md",
  "docs/fase-2-ux-ui/02.09-spec-driven-product-design.md",
  "docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md",
  "docs/fase-2-ux-ui/02.11-checklist-product-design.md",
  "docs/fase-2-ux-ui/02.12-checklist-spdd.md",
  "docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md",
  "docs/fase-2-ux-ui/02.14-html5-first-prototyping.md",
  "docs/fase-3-arquitectura/README.md",
  "docs/fase-3-arquitectura/03.00-arquitectura.md",
  "docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md",
  "docs/fase-3-arquitectura/03.03-plan-despliegue.md",
  "docs/fase-3-arquitectura/adr/README.md",
  "docs/fase-3-arquitectura/adr/ADR-001-stack-quarkus-angular-keycloak.md",
  "docs/fase-4-sdd/README.md",
  "docs/fase-5-construccion/README.md",
  "docs/fase-5-construccion/05.01-spec-prototype-driven-development-frontend.md",
  "docs/fase-6-qa/README.md",
  "docs/fase-7-deploy/README.md",
  "docs/fase-8-operacion/README.md",
  "docs/transversal/README.md",
  "docs/transversal/90.10-entregables-minimos-por-fase.md",
  "docs/transversal/90.11-checklist-entregables.md",
  "docs/transversal/90.12-operacion-ia-por-fase.md",
  "docs/transversal/90.25-threat-modeling.md",
  "docs/transversal/90.26-contract-governance.md",
  "docs/transversal/90.29-integracion-selectiva-agent-skills.md",
  "docs/transversal/90.30-principios-solid-diseno-modular.md",
  "docs/transversal/90.33-flujo-delivery-ia-proveedores.md",
  "docs/transversal/90.34-product-design-y-spdd-frontend.md",
];
const LIVE_FRAMEWORK_FILES_TO_COPY = [
  "docs/fase-2-ux-ui/README.md",
  "docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md",
  "docs/fase-2-ux-ui/02.12-checklist-spdd.md",
  "docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md",
  "docs/fase-2-ux-ui/02.14-html5-first-prototyping.md",
  "docs/fase-5-construccion/05.01-spec-prototype-driven-development-frontend.md",
  "docs/transversal/90.10-entregables-minimos-por-fase.md",
  "docs/transversal/90.11-checklist-entregables.md",
  "docs/transversal/90.12-mapa-ia-por-fase.md",
  "docs/transversal/90.33-flujo-delivery-ia-proveedores.md",
  "docs/transversal/90.34-product-design-y-spdd-frontend.md",
  "ai/README.md",
  "ai/agents/enterprise-ai-framework-agent.md",
  "ai/runbooks/crear-proyecto-real-con-agente.md",
  "ai/commands/README.md",
  "ai/commands/ux-command.md",
  "ai/commands/prototype-command.md",
  "ai/skills/README.md",
  "ai/skills/spec-prototype-driven-frontend.skill.md",
  "ai/skills/html5-prototyping.skill.md",
  "ai/skills/penpot-ai-prototyping.skill.md",
  "ai/prompts/README.md",
  "ai/prompts/generar-prototipo-html5-desde-spdd.md",
  "ai/prompts/generar-prototipo-penpot-desde-spdd.md",
  "ai/quality-gates/README.md",
  "ai/quality-gates/gate-prototype-ready.md",
  "ai/quality-gates/gate-spdd-approved.md",
  "ai/references/frontend-spdd-workflow.md",
  "ai/references/feature-delivery-workflow.md",
  "plantillas/fase-2-ux-ui/prototype-html5.md",
  "plantillas/fase-4-sdd/prototype.md",
  "plantillas/fase-4-sdd/prototype-validation.md",
  "plantillas/fase-4-sdd/spdd-frontend.md",
  "plantillas/fase-4-sdd/README.md",
  // v12.22: infraestructura de memoria viva. Sin estos, los scripts npm
  // `memory:*` y `check:*` del package.json generado fallan con MODULE_NOT_FOUND.
  "scripts/ai-framework-agent.mjs",
  "ai/memory/schema-sqlite.sql",
  "ai/memory/schema-sqlite-vec.sql",
  "ai/memory/README.md",
  "ci/scripts/check-docs.mjs",
  "ci/scripts/check-trace-drift.mjs",
  "ci/scripts/check-trace-coverage.mjs",
  "ci/scripts/check-prototype-hub.mjs",
  "ci/scripts/check-html5-prototype-quality.mjs",
  // v12.33: tambien copiar los validadores que usa check:template
  "ci/scripts/check-ai-artifacts.mjs",
  "ci/scripts/check-markdown-paths.mjs",
  // v12.34: check-bd-documented enforce que toda BD declarada en la matriz
  // tenga doc canonica en algun spec-tecnica.md (con `Tabla \`<nombre>\``).
  "ci/scripts/check-bd-documented.mjs",
  // v12.35: paridad de bd-documented para API y Test.
  "ci/scripts/check-api-documented.mjs",
  "ci/scripts/check-test-documented.mjs",
  // v12.37: runbook para features en fase 8 (operacion).
  "ci/scripts/check-runbook-documented.mjs",
  // v12.43: validador de existencia de evidence_ref.
  "ci/scripts/check-evidence-exists.mjs",
];

function repoRoot() {
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

function usage() {
  console.log(`Uso:
  node scripts/ai-framework-agent.mjs <command> [opciones]

Commands:
  init-memory                 Crea/actualiza la BD SQLite portable.
  index-docs                  Indexa documentacion del framework en la BD (FTS5).
  sync-memory                 Puebla trazabilidad, gates, evidencia, decisiones,
                              preguntas abiertas y session_events desde Markdown.
  embed-docs                  Genera embeddings locales por chunk (busqueda semantica).
  regenerate-context          Reescribe zonas <!-- auto:start --> de AI_CONTEXT.md
                              desde la BD (features, gates, sesiones recientes).
  context-pack --topic <t>    Bundle JSON: chunks + RFs/gates/decisiones/preguntas.
  memory-query --preset <k>   Consulta predefinida (docs-for, apis-for, rf-without-code…).
                              Lista de presets: corre el comando sin --preset.
  next-task                   Sugiere la siguiente tarea desbloqueada por reglas.
  diff-since --ref <commit>   Que cambio en gates/decisiones/sesiones desde un ref.
  harvest-trace               Cosecha @trace/@implements de source code (confianza 0.8).
  check-spec-dedup            Detecta specs semanticamente cercanas (cosine >= T).
  watch                       Re-sincroniza la memoria al editar Markdown.
                              Flags: --once (un solo sync y sale, para CI/hooks);
                              --interval 30s (polling en vez de fs.watch).
  install-hooks               Instala .git/hooks/pre-commit que ejecuta watch --once.
                              Con --uninstall remueve el hook.
  generate-prototype-hub      Regenera prototype/index.html desde specs/ + BD.
                              Con --auto-only conserva las zonas no-auto.
  template-drift              Diff entre un proyecto generado y la generacion limpia.
  status                      Muestra estado de memoria e index + freshness.
  search --query <texto>      Busca contexto en memoria SQLite (FTS5 textual o --semantic).
  memory-report               Genera ai/memory/memory-report.html autocontenido.
  memory-serve [--port N]     Levanta un servidor local para consultar la memoria.
  import-embeddings           Importa embeddings de un proveedor externo (sqlite-vec).
  route --intent <texto>      Enruta una intencion a fase, command y gate.
  document                    Planifica documentacion formal desde texto o fuente.
  ux                          Ejecuta Fase 2 UX, Penpot local y HTML5 prototype sobre un proyecto.
  plan-create                 Planifica crear un proyecto real en otra ruta.
  create-project              Valida config y ejecuta scripts/new-service.mjs.

Opciones comunes:
  --root <path>               Ruta del template. Default: repo actual.
  --db <path>                 Ruta de BD. Default: ai/memory/framework-agent.db

document/search:
  --intent <texto>            Necesidad, idea o requerimiento.
  --source <path>             Archivo fuente, por ejemplo intake/necesidades-iniciales.md.
  --semantic                  Busqueda semantica. Por defecto usa el embedder local
                              sobre --query (requiere embed-docs antes). Con
                              --embedding usa el vector de un proveedor externo.
  --embedding <json|csv>      Vector de consulta de un proveedor para search semantico.
  --sqlite-vec-extension <p>  Acelerador opcional: ruta de la extension nativa sqlite-vec.
  --force                     embed-docs/index-docs: regenera todo en vez de incremental.

ux:
  --project <path>            Ruta del proyecto real. Alias: --dest.
  --feature <id>              Feature a procesar. Default: 001-bandeja-trabajo-expedientes.

plan-create/create-project:
  --stack <stack>             node-next | java-monolith | quarkus-angular | spring-react
  --config <path>             Config JSON real.
  --dest <path>               Ruta destino externa.
  --source <path>             Fuente de negocio opcional.
  --skip-smoke                Omite smoke checks al crear.
  --no-git                    Omite git inicial al crear.
  --force                     Reutiliza --dest solo si existe y esta vacio.
  --refresh-existing          Actualiza un proyecto existente sin recrear scaffolding.

Ejemplos:
  node scripts/ai-framework-agent.mjs init-memory
  node scripts/ai-framework-agent.mjs index-docs
  node scripts/ai-framework-agent.mjs sync-memory
  node scripts/ai-framework-agent.mjs embed-docs
  node scripts/ai-framework-agent.mjs status
  node scripts/ai-framework-agent.mjs search --query "crear proyecto real"
  node scripts/ai-framework-agent.mjs search --query "validar prototipo" --semantic
  node scripts/ai-framework-agent.mjs memory-report
  node scripts/ai-framework-agent.mjs memory-serve --port 4319
  node scripts/ai-framework-agent.mjs document --intent "El operador debe registrar reclamos con adjuntos"
  node scripts/ai-framework-agent.mjs ux --project C:\\template\\caso-real\\mi-proyecto
  node scripts/ai-framework-agent.mjs plan-create --stack quarkus-angular --config .\\mi.config.json --dest C:\\template\\caso-real\\mi-proyecto
  node scripts/ai-framework-agent.mjs create-project --stack quarkus-angular --config .\\mi.config.json --dest C:\\template\\caso-real\\mi-proyecto --skip-smoke --no-git
`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "-h" || current === "--help") {
      args.help = true;
      continue;
    }
    if (
      current === "--skip-smoke" ||
      current === "--no-git" ||
      current === "--force" ||
      current === "--refresh-existing" ||
      current === "--semantic" ||
      current === "--once" ||
      current === "--uninstall" ||
      current === "--json" ||
      current === "--auto-only" ||
      // v12.45: flags booleanos del comando status.
      current === "--fail-on-drift" ||
      current === "--fix" ||
      current === "--warn-only" ||
      current === "--strict" ||
      // v12.55: flag para memory-serve que busca puerto libre si el preferido esta ocupado.
      current === "--auto-port"
    ) {
      args[current.slice(2)] = true;
      continue;
    }
    if (current === "--watch") {
      // v12.45: --watch acepta numero opcional; si el siguiente arg no es numerico, es booleano.
      const next = argv[i + 1];
      if (next && /^\d+$/.test(next)) { args.watch = next; i += 1; } else { args.watch = true; }
      continue;
    }
    if (current.startsWith("--")) {
      args[current.slice(2)] = argv[++i];
      continue;
    }
    args._.push(current);
  }
  return args;
}

function rootFromArgs(args) {
  return path.resolve(args.root ?? repoRoot());
}

function dbPathFromArgs(args, root) {
  return path.resolve(root, args.db ?? "ai/memory/framework-agent.db");
}

function normalizeRelative(root, absolute) {
  return path.relative(root, absolute).replace(/\\/g, "/");
}

async function loadDatabaseSync() {
  if (!DatabaseSyncClass) {
    ({ DatabaseSync: DatabaseSyncClass } = await import("node:sqlite"));
  }
  return DatabaseSyncClass;
}

async function ensureDatabase(root, dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const DatabaseSync = await loadDatabaseSync();
  const db = new DatabaseSync(dbPath);
  const schemaPath = path.join(root, "ai", "memory", "schema-sqlite.sql");
  db.exec(fs.readFileSync(schemaPath, "utf8"));
  migrateSchema(db);
  return db;
}

// Migracion ligera: agrega columnas nuevas a tablas existentes que CREATE TABLE
// IF NOT EXISTS no actualiza. Idempotente, ignora errores de "duplicate column".
function migrateSchema(db) {
  const cols = (table) => {
    try {
      return db.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name);
    } catch {
      return [];
    }
  };
  const ensureColumn = (table, name, type) => {
    if (!cols(table).includes(name)) {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
      } catch {
        // ignora si la tabla no existe todavia
      }
    }
  };
  ensureColumn("ai_gate_runs", "actor", "TEXT");
  ensureColumn("ai_gate_runs", "decided_at", "TEXT");
  ensureColumn("ai_gate_runs", "evidence_paths", "TEXT");
  // v12.45: origin distingue 'global' (matriz raiz) vs 'feature' (per-feature).
  ensureColumn("ai_gate_runs", "origin", "TEXT");
  ensureColumn("ai_decisions", "tags", "TEXT");
  ensureColumn("ai_decisions", "affects", "TEXT");
  ensureColumn("ai_decisions", "deciders", "TEXT");
  ensureColumn("ai_decisions", "decided_at", "TEXT");
  // v12.22: distingue planned/implemented/validated/inferred/drift
  ensureColumn("ai_trace_links", "link_status", "TEXT");
  ensureColumn("ai_trace_links", "origin", "TEXT");
  ensureColumn("ai_trace_links", "validated_at", "TEXT");
  // v12.31: source_file para dedup logico entre matriz raiz y per-feature
  ensureColumn("ai_trace_links", "source_file", "TEXT");
  // v12.41: display_status enriquece link_status con vocabulario por target_type.
  ensureColumn("ai_trace_links", "display_status", "TEXT");
  // v12.45: snooze por kind de alerta.
  ensureColumn("ai_action_snoozes", "kind", "TEXT");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function isIgnored(relativePath) {
  return relativePath.split("/").some((part) => IGNORED_DIRS.has(part));
}

function collectFiles(root, entries = DEFAULT_DOC_PATHS) {
  const files = [];
  const visit = (absolute) => {
    if (!fs.existsSync(absolute)) return;
    const stat = fs.statSync(absolute);
    const relative = normalizeRelative(root, absolute);
    if (isIgnored(relative)) return;
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolute)) visit(path.join(absolute, entry));
      return;
    }
    if (stat.isFile() && TEXT_EXTENSIONS.has(path.extname(absolute).toLowerCase())) {
      files.push(absolute);
    }
  };
  for (const entry of entries) visit(path.resolve(root, entry));
  return [...new Set(files)].sort((a, b) => normalizeRelative(root, a).localeCompare(normalizeRelative(root, b)));
}

function inferKind(relativePath) {
  if (relativePath.startsWith("docs/")) return "docs";
  if (relativePath.startsWith("ai/")) return "ai";
  if (relativePath.startsWith("specs/")) return "spec";
  if (relativePath.startsWith("tests/")) return "test";
  if (relativePath.startsWith("qa/")) return "qa";
  if (relativePath.startsWith("ops/")) return "ops";
  if (relativePath.startsWith("src/")) return "code";
  if (relativePath.startsWith("stacks/")) return "stack";
  return "repo";
}

function inferPhase(relativePath) {
  const match = relativePath.match(/fase-(\d+)-/);
  if (match) return match[1];
  if (relativePath.startsWith("specs/")) return "4";
  if (relativePath.startsWith("qa/")) return "6";
  if (relativePath.startsWith("ops/fase-7")) return "7";
  if (relativePath.startsWith("ops/fase-8")) return "8";
  if (relativePath.startsWith("ai/")) return "ai";
  return null;
}

function extractTitle(relativePath, text) {
  const heading = text.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : path.basename(relativePath);
}

function chunkText(text) {
  const lines = text.split(/\r?\n/);
  const chunks = [];
  let heading = "Inicio";
  let buffer = [];

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content) chunks.push({ heading, content, tokenCount: content.split(/\s+/).filter(Boolean).length });
    buffer = [];
  };

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      flush();
      heading = match[2].trim();
      buffer.push(line);
      continue;
    }
    buffer.push(line);
  }
  flush();
  return chunks.length > 0 ? chunks : [{ heading, content: text.trim(), tokenCount: text.split(/\s+/).filter(Boolean).length }];
}

function indexDocuments(root, db, { force = false } = {}) {
  const selectDoc = db.prepare("SELECT id, checksum FROM ai_documents WHERE path = ?");
  const insertDoc = db.prepare(`
    INSERT INTO ai_documents(path, kind, phase, title, checksum, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  const updateDoc = db.prepare(`
    UPDATE ai_documents
    SET kind = ?, phase = ?, title = ?, checksum = ?, indexed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE path = ?
  `);
  const deleteChunks = db.prepare("DELETE FROM ai_document_chunks WHERE document_id = ?");
  const insertChunk = db.prepare(`
    INSERT INTO ai_document_chunks(document_id, chunk_index, heading, content, token_count)
    VALUES (?, ?, ?, ?, ?)
  `);

  // FTS5: tabla standalone reconstruible. rowid == ai_document_chunks.id.
  const ftsAvailable = hasFtsTable(db);
  const deleteFts = ftsAvailable
    ? db.prepare("DELETE FROM ai_chunks_fts WHERE document_id = ?")
    : null;
  const insertFts = ftsAvailable
    ? db.prepare("INSERT INTO ai_chunks_fts(rowid, path, heading, content, document_id) VALUES (?, ?, ?, ?, ?)")
    : null;

  let indexed = 0;
  let skipped = 0;
  // v12.27: emite lineas `[progress] X/Y archivos` para que el front pueda
  // renderizar una barra. Cadencia: cada 5% o cada 25 archivos, lo que llegue antes.
  const files = collectFiles(root);
  const total = files.length;
  const tick = Math.max(1, Math.min(25, Math.floor(total / 20) || 1));
  process.stdout.write(`[progress] 0/${total} archivos\n`);
  db.exec("BEGIN");
  try {
    let processed = 0;
    for (const file of files) {
      const relative = normalizeRelative(root, file);
      const text = fs.readFileSync(file, "utf8");
      const checksum = sha256(text);
      const kind = inferKind(relative);
      const phase = inferPhase(relative);
      const title = extractTitle(relative, text);
      const existing = selectDoc.get(relative);

      let documentId;
      if (existing && existing.checksum === checksum && !force) {
        skipped += 1;
      } else {
        if (existing) {
          documentId = existing.id;
          updateDoc.run(kind, phase, title, checksum, relative);
          deleteChunks.run(documentId);
          if (deleteFts) deleteFts.run(documentId);
        } else {
          insertDoc.run(relative, kind, phase, title, checksum);
          documentId = selectDoc.get(relative).id;
        }

        const chunks = chunkText(text);
        chunks.forEach((chunk, index) => {
          const info = insertChunk.run(documentId, index, chunk.heading, chunk.content, chunk.tokenCount);
          if (insertFts) {
            insertFts.run(Number(info.lastInsertRowid), relative, chunk.heading, chunk.content, documentId);
          }
        });
        indexed += 1;
      }
      processed += 1;
      if (processed === total || processed % tick === 0) {
        process.stdout.write(`[progress] ${processed}/${total} archivos\n`);
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return { indexed, skipped, fts: ftsAvailable };
}

function hasFtsTable(db) {
  try {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ai_chunks_fts'")
      .get();
    return Boolean(row);
  } catch {
    return false;
  }
}

// ── sync-memory: poblar tablas estructuradas desde Markdown ──────────────────
// La BD es un indice reconstruible. sync-memory parsea los Markdown oficiales
// (fuente de verdad) y rellena trace_links, gate_runs, evidence_items,
// decisions y open_questions para que el agente IA consulte rapido sin leer
// n archivos cada vez.

const TRACE_COLUMN_MAP = {
  hu: { type: "HU", relation: "cubre" },
  "ux/spdd": { type: "spdd", relation: "disenado-en" },
  spdd: { type: "spdd", relation: "disenado-en" },
  "spdd/prototipo": { type: "prototipo", relation: "prototipado-en" },
  ux: { type: "ux", relation: "disenado-en" },
  "product design": { type: "product-design", relation: "origen-en" },
  pantalla: { type: "pantalla", relation: "tiene-pantalla" },
  componente: { type: "componente", relation: "usa-componente" },
  prototipo: { type: "prototipo", relation: "prototipado-en" },
  api: { type: "api", relation: "expone" },
  bd: { type: "bd", relation: "persiste-en" },
  sdd: { type: "sdd", relation: "especificado-en" },
  codigo: { type: "codigo", relation: "implementado-en" },
  construccion: { type: "codigo", relation: "implementado-en" },
  test: { type: "test", relation: "validado-por" },
  prueba: { type: "test", relation: "validado-por" },
};

function stripAccents(value) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function splitTableRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((cell) => cell.trim());
}

function normalizeHeader(header) {
  return stripAccents(header.toLowerCase()).replace(/[^a-z0-9/ ]+/g, "").trim();
}

function cleanCell(value) {
  const v = (value || "").trim();
  if (!v || /^[-–—]+$/.test(v) || /^(n\/a|na|tbd)$/i.test(v)) return "";
  return v;
}

function parseMarkdownTables(text) {
  const lines = text.split(/\r?\n/);
  const tables = [];
  for (let i = 0; i < lines.length - 1; i += 1) {
    const header = lines[i].trim();
    if (!header.startsWith("|")) continue;
    const sep = lines[i + 1].trim();
    if (!/^\|?[\s:|-]+\|?$/.test(sep) || !sep.includes("-")) continue;
    const rawHeaders = splitTableRow(header);
    const headers = rawHeaders.map(normalizeHeader);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && lines[j].trim().startsWith("|")) {
      rows.push(splitTableRow(lines[j]));
      j += 1;
    }
    tables.push({ rawHeaders, headers, rows });
    i = j - 1;
  }
  return tables;
}

function findMarkdownSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  let current = null;
  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      if (current) sections.push(current);
      current = { level: match[1].length, heading: match[2].trim(), bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections.map((s) => ({ level: s.level, heading: s.heading, body: s.bodyLines.join("\n") }));
}

function bulletsOf(body) {
  return body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => l.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

function specScopeOf(relativePath) {
  const match = relativePath.match(/^(specs\/[^/]+)\//);
  if (match) return match[1];
  const dir = relativePath.split("/").slice(0, -1).join("/");
  return dir || relativePath;
}

function srcTypeOf(normalizedHeader) {
  if (normalizedHeader === "rf") return "RF";
  if (normalizedHeader === "origen") return "origen";
  return "requerimiento";
}

function extractAdrStatus(text) {
  // 1) Seccion dedicada `## Estado` o `## Status`.
  for (const section of findMarkdownSections(text)) {
    if (/^(estado|status)$/i.test(stripAccents(section.heading.toLowerCase()).trim())) {
      const firstLine = section.body
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)[0];
      if (firstLine) {
        const clean = firstLine.replace(/^[-*]\s+/, "").replace(/\*\*/g, "").trim();
        return clean.slice(0, 80);
      }
    }
  }
  // 2) Linea con prefijo "Estado:" o "Status:" en inicio de linea / bullet.
  const inline = text.match(/^\s*(?:[-*]\s+)?(?:\*\*)?(?:Estado|Status)(?:\*\*)?\s*[:\-]\s*([^\n]+)/im);
  if (inline) {
    const clean = inline[1].replace(/\*\*/g, "").trim();
    return clean.slice(0, 80);
  }
  return "propuesta";
}

function sanitizeInline(text) {
  // Limpia sintaxis Markdown para texto plano legible en la BD.
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstSection(text, headingRegex) {
  for (const section of findMarkdownSections(text)) {
    if (headingRegex.test(stripAccents(section.heading.toLowerCase()))) {
      const body = section.body
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ");
      return sanitizeInline(body).slice(0, 280);
    }
  }
  return "";
}

function collectSyncMarkdown(root) {
  const targets = ["specs", "qa", "docs/fase-3-arquitectura/adr"];
  const rootFiles = ["AI_CONTEXT.md", "TRACEABILITY_MATRIX.md", "PROJECT_MAP.md", "SESSION_LOG.md", "GLOSSARY.md"];
  const files = [];
  const walk = (absolute) => {
    if (!fs.existsSync(absolute)) return;
    const stat = fs.statSync(absolute);
    const relative = normalizeRelative(root, absolute);
    if (isIgnored(relative)) return;
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolute)) walk(path.join(absolute, entry));
      return;
    }
    if (stat.isFile() && absolute.toLowerCase().endsWith(".md")) files.push(absolute);
  };
  for (const target of targets) walk(path.resolve(root, target));
  for (const file of rootFiles) {
    const absolute = path.resolve(root, file);
    if (fs.existsSync(absolute)) files.push(absolute);
  }
  return [...new Set(files)].sort();
}

// v12.42: normaliza evidence_ref con la ruta mas completa que se pueda
// resolver. Estrategia:
//   1. Si evidence ya tiene "/" -> ya esta qualificado (`docs/...`, `specs/...`),
//      devolver tal cual.
//   2. Si el archivo fuente vive en specs/<feature>/, qualificar con ese scope.
//   3. Si la fila viene de TRACEABILITY_MATRIX.md global y tiene columna feature,
//      qualificar con specs/<feature>/.
//   4. Validacion best-effort: si el path qualificado NO existe en disco,
//      devolver el original (no inventar paths). Asi un evidence_ref como
//      "internal-only.md" que no es archivo real queda inalterado.
function qualifyEvidenceRef(evidence, scopeFromFile, featureFromColumn, root) {
  const raw = String(evidence || "").trim();
  if (!raw) return raw;
  if (raw.includes("/")) return raw; // ya qualificado
  // Candidato 1: scope del archivo fuente (per-feature spec).
  // Candidato 2: feature de la columna (matriz global).
  const candidates = [];
  if (scopeFromFile) candidates.push(`${scopeFromFile}/${raw}`);
  if (featureFromColumn) {
    const slug = String(featureFromColumn).replace(/^specs\//, "");
    candidates.push(`specs/${slug}/${raw}`);
  }
  // Validacion best-effort: el primero que exista en disco gana.
  if (root) {
    for (const cand of candidates) {
      const abs = path.resolve(root, cand);
      try { if (fs.existsSync(abs)) return cand; } catch { /* ignorar */ }
    }
  }
  // Sin root o ninguno existe: si hay al menos un candidato, devolverlo
  // (mejor que el raw suelto). Si no hay candidatos, raw.
  return candidates[0] || raw;
}

// v12.41: vocabulario apropiado a la naturaleza del target.
//   codigo/test -> link_status tal cual (planned/implemented/validated).
//   spdd/api/bd/proto/sdd/pantalla/componente -> pending/documented/approved.
//   hu/rf/rnf/estado (cross-refs documentales) -> documented (siempre presente).
//   inferred/drift -> se preservan iguales.
const NON_CODE_TARGETS = new Set([
  "spdd", "sdd", "product-design", "prototipo",
  "api", "bd", "pantalla", "componente",
  // v12.43: 'doc' es el target generico para columnas-path auto-detectadas
  // (cualquier columna nueva en la matriz cuyo valor parezca un archivo).
  "doc",
]);
const DOCUMENTAL_TARGETS = new Set(["hu", "rf", "rnf", "estado"]);

// v12.45 (E2): vocabulario configurable por proyecto via env MEMORY_DISPLAY_VOCAB.
// Formato: "non-code:pending/documented/approved,documental:documented"
// Si no se define, se usan los defaults.
// Permite que un proyecto use ej. "draft/final/signed-off" en vez de "pending/documented/approved".
const DISPLAY_VOCAB_DEFAULT = {
  "non-code": ["pending", "documented", "approved"],
  "documental": ["documented"],
};
function loadDisplayVocab() {
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
const DISPLAY_VOCAB = loadDisplayVocab();

function computeDisplayStatus(linkStatus, targetType) {
  if (!linkStatus) return null;
  if (linkStatus === "inferred" || linkStatus === "drift") return linkStatus;
  const t = String(targetType || "").toLowerCase();
  if (t === "codigo" || t === "test") {
    // Igual a link_status: planned | implemented | validated
    return linkStatus;
  }
  if (NON_CODE_TARGETS.has(t)) {
    const [vPending, vDocumented, vApproved] = DISPLAY_VOCAB["non-code"];
    if (linkStatus === "planned") return vPending;
    if (linkStatus === "implemented") return vDocumented;
    if (linkStatus === "validated") return vApproved;
    return linkStatus;
  }
  if (DOCUMENTAL_TARGETS.has(t)) {
    // Cross-refs documentales: si existe el link, esta documentado.
    return DISPLAY_VOCAB["documental"][0];
  }
  return linkStatus;
}

// v12.45.1: registra artefactos canonicos per-feature como trace links de tipo
// 'doc'. Cada feature en specs/<slug>/ aporta hasta N filas (una por archivo
// canonico presente). Asi check-orphan-evidence ve cada archivo como source_file
// de al menos un link y no lo reporta huerfano.
const CANONICAL_FEATURE_ARTIFACTS = [
  "spec-funcional.md",
  "spec-tecnica.md",
  "spec-tareas.md",
  "api-contract.md",
  "traceability.md",
  "prototype.md",
  "prototype-validation.md",
  "product-design.md",
  "spdd-frontend.md",
  "spdd-backend.md",
  "ui-test-cases.md",
];
function syncCanonicalArtifacts(db, root) {
  const specsRoot = path.join(root, "specs");
  if (!fs.existsSync(specsRoot)) return 0;
  const insert = db.prepare(`
    INSERT INTO ai_trace_links(
      source_type, source_ref, target_type, target_ref, relation,
      confidence, evidence_ref, link_status, origin, validated_at, source_file, display_status
    )
    VALUES (?, ?, 'doc', ?, 'documents', 1.0, ?, ?, 'auto-canonical-artifact', NULL, ?, ?)
  `);
  let count = 0;
  let entries;
  try { entries = fs.readdirSync(specsRoot, { withFileTypes: true }); } catch { return 0; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const slug = e.name;
    // Saltar dirs no-feature (README, _attic, .archived, NO_NNN).
    if (slug.startsWith(".") || slug.startsWith("_")) continue;
    const featureDir = path.join(specsRoot, slug);
    let files;
    try { files = fs.readdirSync(featureDir); } catch { continue; }
    for (const name of files) {
      if (!CANONICAL_FEATURE_ARTIFACTS.includes(name.toLowerCase())) continue;
      const rel = `specs/${slug}/${name}`;
      // El archivo es el "source" de su propia entrada documental.
      // source_ref = slug de la feature, target_ref = filename.
      // link_status = 'implemented' (el archivo existe en disco) -> display_status para 'doc' = 'documented'.
      const linkStatus = "implemented";
      const displayStatus = computeDisplayStatus(linkStatus, "doc");
      insert.run("feature", slug, name, rel, linkStatus, rel, displayStatus);
      count += 1;
    }
  }
  return count;
}

function syncTraceLinks(db, files, root) {
  // v12.22: cada link declarado en la matriz se etiqueta con link_status:
  //   'planned'     - declarado pero el target_ref NO existe aun en el repo.
  //   'implemented' - declarado Y existe en el repo (codigo/test/api/bd/proto).
  //   'validated'   - implemented + Estado de la fila contiene 'valid|aprob|complet'.
  // origin = 'markdown-matrix' siempre para esta funcion.
  const insert = db.prepare(`
    INSERT INTO ai_trace_links(
      source_type, source_ref, target_type, target_ref, relation,
      confidence, evidence_ref, link_status, origin, validated_at, source_file, display_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'markdown-matrix', ?, ?, ?)
  `);
  const today = new Date().toISOString().slice(0, 10);
  // v12.31: dedup logico. Si dos matrices (raiz + per-feature) declaran el
  // mismo link, solo guardamos la mas especifica (la per-feature). Clave:
  // source_ref + target_type + target_ref. Procesamos las per-feature antes.
  const sortedFiles = [...files].sort((a, b) => {
    const aIsPerFeature = /^specs\//.test(a.rel);
    const bIsPerFeature = /^specs\//.test(b.rel);
    if (aIsPerFeature && !bIsPerFeature) return -1;
    if (!aIsPerFeature && bIsPerFeature) return 1;
    return a.rel.localeCompare(b.rel);
  });
  const seen = new Set();
  let count = 0;
  for (const file of sortedFiles) {
    if (!/traceability\.md$/i.test(file.rel) && !/traceability_matrix\.md$/i.test(file.rel)) continue;
    for (const table of parseMarkdownTables(file.text)) {
      const srcIdx = table.headers.findIndex(
        (h) => h === "rf" || h === "requerimiento" || h === "origen",
      );
      if (srcIdx === -1) continue;
      const evidenceIdx = table.headers.findIndex((h) => h === "evidencia");
      const estadoIdx = table.headers.findIndex((h) => h === "estado");
      const sourceType = srcTypeOf(table.headers[srcIdx]);
      // v12.31: scope del archivo fuente (specs/<feature>/...) para qualificar
      // evidence_ref. Antes se guardaba 'prototype-validation.md' suelto y
      // check-trace-coverage no podia correlacionarlo con la feature.
      // v12.42: tambien aprovechar la columna 'feature' de la matriz global
      // (TRACEABILITY_MATRIX.md) para qualificar evidencia que viene sin path.
      const scopeMatch = file.rel.match(/^(specs\/[^/]+)\//);
      const scope = scopeMatch ? scopeMatch[1] : null;
      const featureColIdx = table.headers.findIndex((h) => h === "feature" || h === "spec");
      for (const row of table.rows) {
        const source = cleanCell(row[srcIdx]);
        if (!source) continue;
        const evidenceRaw = evidenceIdx >= 0 ? cleanCell(row[evidenceIdx]) : "";
        const featureFromCol = featureColIdx >= 0 ? cleanCell(row[featureColIdx]) : null;
        // v12.42: qualificar con scope OR columna feature, con verificacion best-effort.
        let evidenceRef = evidenceRaw
          ? qualifyEvidenceRef(evidenceRaw, scope, featureFromCol, root)
          : file.rel;
        const estadoCell = estadoIdx >= 0 ? cleanCell(row[estadoIdx]) : "";
        const isValidated = /valid|aprob|complet/i.test(estadoCell || "");
        for (let c = 0; c < table.headers.length; c += 1) {
          if (c === srcIdx || c === evidenceIdx) continue;
          const value = cleanCell(row[c]);
          if (!value) continue;
          if (c === estadoIdx) {
            const key = `${source}::estado::${value}`;
            if (seen.has(key)) continue;
            seen.add(key);
            insert.run(
              sourceType, source, "estado", value, "estado",
              1.0, evidenceRef, "implemented", null, file.rel,
              computeDisplayStatus("implemented", "estado"),
            );
            count += 1;
            continue;
          }
          let map = TRACE_COLUMN_MAP[table.headers[c]];
          // v12.43: auto-deteccion de columnas-path no mapeadas. Si el header
          // no esta en TRACE_COLUMN_MAP pero el valor parece path (termina en
          // .md/.html/.yaml/.ts/.tsx/.js/.json o contiene '/'), registrar como
          // tipo 'doc' generico con relation = nombre del header. Asi una
          // columna nueva en la matriz como "Runbook" o "Threat model" se
          // captura sin tocar codigo.
          if (!map) {
            const looksLikePath = /\.(md|html|yaml|yml|json|ts|tsx|js|jsx|mjs|cjs|java|kt|py|go|rs|cs)$/i.test(value) || (value.includes("/") && !value.includes(" "));
            if (looksLikePath) {
              map = { type: "doc", relation: table.headers[c].toLowerCase().replace(/[^a-z0-9]+/g, "-") };
            } else {
              continue;
            }
          }
          // v12.31: dedup logico — si ya tenemos un link para esta combinacion
          // de (source, target_type, target_ref), no duplicar. Como procesamos
          // primero las matrices per-feature, esas ganan sobre la global.
          const dedupKey = `${source}::${map.type}::${value}`;
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);
          const exists = root ? targetRefExists(root, map.type, value) : true;
          let linkStatus = exists ? "implemented" : "planned";
          let validatedAt = null;
          if (exists && isValidated && (map.type === "codigo" || map.type === "test")) {
            linkStatus = "validated";
            validatedAt = today;
          }
          insert.run(
            sourceType, source, map.type, value, map.relation,
            1.0, evidenceRef, linkStatus, validatedAt, file.rel,
            computeDisplayStatus(linkStatus, map.type),
          );
          count += 1;
        }
      }
    }
  }
  return count;
}

function syncGateRuns(db, files, root) {
  const insert = db.prepare(`
    INSERT INTO ai_gate_runs(gate, phase_scope, status, summary, actor, decided_at, evidence_paths, origin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // v12.45: derivar origin del archivo. 'global' si es matriz raiz; 'feature' si esta bajo specs/.
  const originOf = (rel) => {
    const n = String(rel).replace(/\\/g, "/").toLowerCase();
    if (/^specs\//.test(n)) return "feature";
    if (/(^|\/)traceability(_matrix)?\.md$/.test(n)) return "global";
    return "doc";
  };
  // traceability.md es la vista consolidada: se procesa primero para que su
  // estado de gate gane sobre menciones sueltas en otros Markdown.
  const ordered = [...files].sort((a, b) => {
    const rank = (f) => (/traceability(_matrix)?\.md$/i.test(f.rel) ? 0 : 1);
    return rank(a) - rank(b) || a.rel.localeCompare(b.rel);
  });
  // Una fila por (gate, scope): la primera vista (traceability) gana.
  const seen = new Set();
  let count = 0;
  for (const file of ordered) {
    const scope = specScopeOf(file.rel);
    const git = root ? gitLastChange(root, file.rel) : { author: null, date: null };
    // Acepta el gate con o sin backticks. El separador debe ser ":" para no
    // confundir el guion interno del nombre (gate-spdd-approved).
    const lineRe = /(?:^|\n)\s*[-*]?\s*`?(gate-[a-z0-9-]+)`?\s*:\s*([^\n|]+)/gi;
    let m;
    while ((m = lineRe.exec(file.text)) !== null) {
      const gate = m[1].toLowerCase();
      const status = m[2].trim().replace(/[`.]+$/g, "").replace(/`/g, "").trim();
      if (!status) continue;
      const key = `${gate}::${scope}`;
      if (seen.has(key)) continue;
      seen.add(key);
      insert.run(gate, scope, status, file.rel, git.author, git.date, null, originOf(file.rel));
      count += 1;
    }
    for (const table of parseMarkdownTables(file.text)) {
      const gateIdx = table.headers.findIndex((h) => h === "gate");
      if (gateIdx === -1) continue;
      const statusIdx = table.headers.findIndex(
        (h) => h === "estado" || h === "status" || h === "resultado",
      );
      const evidenceIdx = table.headers.findIndex((h) => h === "evidencia");
      // v12.38: si la tabla tiene columna 'feature', cada fila usa su propio
      // scope (`specs/<feature>`) en vez del scope del archivo. Esto evita que
      // 3 filas de TRACEABILITY_MATRIX.md con el mismo gate pero distinta
      // feature se deduplicaran a una sola entrada con scope global.
      const featureIdx = table.headers.findIndex((h) => h === "feature" || h === "spec");
      for (const row of table.rows) {
        const gate = cleanCell(row[gateIdx]);
        if (!gate || !/^gate-/i.test(gate)) continue;
        const status = statusIdx >= 0 ? cleanCell(row[statusIdx]) || "registrado" : "registrado";
        const evidencePath = evidenceIdx >= 0 ? cleanCell(row[evidenceIdx]) : null;
        // v12.38: derivar scope desde la columna feature si existe.
        let rowScope = scope;
        if (featureIdx >= 0) {
          const featureCell = cleanCell(row[featureIdx]);
          if (featureCell && /^[0-9]/.test(featureCell)) {
            // Acepta '001-bandeja-trabajo-expedientes' o ruta completa.
            const slug = featureCell.replace(/^specs\//, "");
            rowScope = `specs/${slug}`;
          }
        }
        const key = `${gate.toLowerCase()}::${rowScope}`;
        if (seen.has(key)) continue;
        seen.add(key);
        // v12.45: si la tabla derivo rowScope desde feature, entonces es per-feature
        // aunque el archivo de origen sea la matriz global.
        const rowOrigin = (featureIdx >= 0 && rowScope !== scope) ? "feature" : originOf(file.rel);
        insert.run(
          gate.toLowerCase(),
          rowScope,
          status,
          file.rel,
          git.author,
          git.date,
          evidencePath || null,
          rowOrigin,
        );
        count += 1;
      }
    }
  }
  return count;
}

function syncDecisions(db, files) {
  const insert = db.prepare(`
    INSERT INTO ai_decisions(title, status, decision_ref, adr_path, rationale, tags, affects, deciders, decided_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  let count = 0;
  for (const file of files) {
    const adrMatch = file.rel.match(/adr\/(ADR-\d+)[^/]*\.md$/i);
    if (adrMatch) {
      const ref = adrMatch[1].toUpperCase();
      const title = (file.text.match(/^#\s+(.+)$/m)?.[1] || ref).trim();
      // Frontmatter YAML opcional: tags, affects, deciders, decided_at, status.
      const fm = parseYamlFrontmatter(file.text) || {};
      const status = (fm.status && String(fm.status)) || extractAdrStatus(file.text);
      const rationale = extractFirstSection(file.text, /contexto|decision|decisi/);
      insert.run(
        title,
        status,
        ref,
        file.rel,
        rationale,
        joinList(fm.tags),
        joinList(fm.affects),
        joinList(fm.deciders || fm.authors),
        fm.decided_at || fm.date || null,
      );
      count += 1;
      continue;
    }
    if (/decisiones-ux\.md$/i.test(file.rel)) {
      for (const section of findMarkdownSections(file.text)) {
        if (!/decisi/.test(stripAccents(section.heading.toLowerCase()))) continue;
        const summary = section.body
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 2)
          .join(" ")
          .slice(0, 280);
        insert.run(
          section.heading.slice(0, 160),
          "registrada",
          null,
          file.rel,
          summary,
          null,
          null,
          null,
          null,
        );
        count += 1;
      }
      continue;
    }
    for (const section of findMarkdownSections(file.text)) {
      if (stripAccents(section.heading.toLowerCase()).trim() !== "decisiones") continue;
      for (const bullet of bulletsOf(section.body)) {
        insert.run(
          bullet.slice(0, 160),
          "registrada",
          null,
          file.rel,
          bullet.slice(0, 280),
          null,
          null,
          null,
          null,
        );
        count += 1;
      }
    }
  }
  return count;
}

function syncEvidenceItems(db, files) {
  const insert = db.prepare(`
    INSERT INTO ai_evidence_items(gate_run_id, evidence_type, path, description, status)
    VALUES (NULL, ?, ?, ?, ?)
  `);
  let count = 0;
  for (const file of files) {
    for (const section of findMarkdownSections(file.text)) {
      if (!/evidencia/.test(stripAccents(section.heading.toLowerCase()))) continue;
      for (const bullet of bulletsOf(section.body)) {
        insert.run("doc", file.rel, bullet.slice(0, 280), "registrada");
        count += 1;
      }
    }
    if (/traceability\.md$/i.test(file.rel) || /traceability_matrix\.md$/i.test(file.rel)) {
      for (const table of parseMarkdownTables(file.text)) {
        const evIdx = table.headers.findIndex((h) => h === "evidencia");
        if (evIdx === -1) continue;
        const rfIdx = table.headers.findIndex(
          (h) => h === "rf" || h === "requerimiento" || h === "origen",
        );
        for (const row of table.rows) {
          const evidence = cleanCell(row[evIdx]);
          if (!evidence) continue;
          const rf = rfIdx >= 0 ? cleanCell(row[rfIdx]) : "";
          insert.run("trace", file.rel, rf ? `${rf}: ${evidence}` : evidence, "registrada");
          count += 1;
        }
      }
    }
    if (/prototype-validation\.md$/i.test(file.rel)) {
      const resultado = extractFirstSection(file.text, /resultado/);
      if (resultado) {
        insert.run("validation", file.rel, resultado.slice(0, 280), "registrada");
        count += 1;
      }
    }
  }
  return count;
}

function syncOpenQuestions(db, files) {
  const insert = db.prepare(`
    INSERT INTO ai_open_questions(phase, question, owner_role, status, source_ref)
    VALUES (?, ?, ?, 'open', ?)
  `);
  let count = 0;
  for (const file of files) {
    const phase = inferPhase(file.rel);
    for (const section of findMarkdownSections(file.text)) {
      const heading = stripAccents(section.heading.toLowerCase());
      if (!/preguntas abiertas|open questions|dudas pendientes/.test(heading)) continue;
      for (const bullet of bulletsOf(section.body)) {
        insert.run(phase, bullet.slice(0, 400), null, file.rel);
        count += 1;
      }
    }
  }
  return count;
}

// ── Helpers para parsers ricos ───────────────────────────────────────────────

// gitLastChange: devuelve {author, date} del ultimo cambio del archivo si hay git.
// Cachea por relativePath para no invocar git N veces.
const __gitCache = new Map();
function gitLastChange(root, relativePath) {
  if (__gitCache.has(relativePath)) return __gitCache.get(relativePath);
  let info = { author: null, date: null };
  try {
    const result = spawnSync(
      "git",
      ["log", "-1", "--format=%an|%aI", "--", relativePath],
      { cwd: root, encoding: "utf8", timeout: 2000, windowsHide: true },
    );
    if (result.status === 0 && result.stdout) {
      const out = result.stdout.trim();
      if (out.includes("|")) {
        const [author, date] = out.split("|");
        info = { author: author || null, date: date || null };
      }
    }
  } catch {
    // git no disponible o archivo no rastreado; deja null.
  }
  __gitCache.set(relativePath, info);
  return info;
}

// parseYamlFrontmatter: extrae frontmatter YAML simple (clave: valor o lista).
// Soporta listas inline [a, b, c] y multilinea con - prefijo. No es un parser
// completo de YAML, suficiente para frontmatter de ADRs.
// targetRefExists: verifica si el target_ref declarado en una matriz de
// trazabilidad realmente existe en el repo. Usado por syncTraceLinks para
// distinguir 'planned' (declarado pero no existe) de 'implemented' (existe).
// Mismo criterio que check-trace-drift.mjs para mantener coherencia.
const SOURCE_SEARCH_DIRS = ["src", "backend", "frontend", "tests", "stacks"];
const SOURCE_SEARCH_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".java", ".kt",
  ".py",
  ".go",
  ".rs",
  ".cs",
]);
const __existsCache = new Map();

function listSourceFiles(root) {
  const key = `__src::${root}`;
  if (__existsCache.has(key)) return __existsCache.get(key);
  const out = [];
  const walk = (abs) => {
    if (!fs.existsSync(abs)) return;
    let st;
    try { st = fs.statSync(abs); } catch { return; }
    if (st.isDirectory()) {
      const base = path.basename(abs);
      if (["node_modules", ".git", ".tmp", "dist", "build", "target", ".next", ".angular"].includes(base)) return;
      for (const entry of fs.readdirSync(abs)) walk(path.join(abs, entry));
      return;
    }
    if (st.isFile() && SOURCE_SEARCH_EXTS.has(path.extname(abs).toLowerCase())) out.push(abs);
  };
  for (const d of SOURCE_SEARCH_DIRS) walk(path.resolve(root, d));
  __existsCache.set(key, out);
  return out;
}

function targetRefExists(root, targetType, targetRef) {
  const v = String(targetRef || "").trim();
  if (!v || v === "-" || v === "—" || /^(n\/a|na|tbd|pendiente)$/i.test(v)) return false;
  const t = String(targetType || "").toLowerCase();
  switch (t) {
    case "codigo":
    case "test": {
      const needle = v.replace(/\..*$/, "").toLowerCase();
      // Match por nombre base de archivo o por nombre de clase en el contenido.
      const files = listSourceFiles(root);
      return files.some((f) => {
        const fname = path.basename(f).toLowerCase();
        if (fname.includes(needle)) return true;
        // Heuristica: tambien aceptamos si aparece como declaracion de clase/funcion
        try {
          const content = fs.readFileSync(f, "utf8");
          const re = new RegExp("\\b(class|interface|function|const|let|var|@Component|@Service|@Repository|@Controller)\\s+" + v.replace(/[.\w]/g, (c) => c.match(/\w/) ? c : "\\" + c) + "\\b");
          return re.test(content);
        } catch { return false; }
      });
    }
    case "api": {
      // Limpia "METODO /ruta" y busca la ruta en specs y contracts.
      const needle = v.replace(/^[A-Z]+\s+/, "").toLowerCase();
      if (!needle) return false;
      const filesToScan = [
        ...listMarkdownFiles(root, ["specs", "contracts"]),
        ...listYamlFiles(root, ["contracts"]),
      ];
      return filesToScan.some((f) => {
        try { return fs.readFileSync(f, "utf8").toLowerCase().includes(needle); } catch { return false; }
      });
    }
    case "bd": {
      const needle = v.split(/[\s(]/)[0].toLowerCase();
      if (!needle) return false;
      // Buscar en specs/, src/, migraciones
      const files = [
        ...listMarkdownFiles(root, ["specs"]),
        ...listSourceFiles(root),
      ];
      return files.some((f) => {
        try { return fs.readFileSync(f, "utf8").toLowerCase().includes(needle); } catch { return false; }
      });
    }
    case "prototipo":
    case "spdd":
    case "sdd":
    case "product-design":
    case "pantalla":
    case "componente":
    case "doc": {
      // path/archivo declarado: verificar si existe literalmente o por nombre.
      // v12.43: 'doc' es el tipo generico de columnas-path auto-detectadas;
      // se trata igual que prototipo/spdd (busca path exacto + fallback nombre).
      const direct = path.resolve(root, v);
      if (fs.existsSync(direct)) return true;
      const needle = v.toLowerCase();
      return listMarkdownFiles(root, ["specs", "docs", "ops", "qa"]).some((f) => {
        try { return fs.readFileSync(f, "utf8").toLowerCase().includes(needle); } catch { return false; }
      });
    }
    case "hu":
    case "rf":
    case "rnf":
    case "estado":
      // Estos no son artefactos fisicos; sus target_ref se aceptan siempre como "implemented"
      // (son cross-references documentales, no codigo).
      return true;
    default:
      // tipo desconocido: ser conservador y devolver true
      return true;
  }
}

function listMarkdownFiles(root, subdirs) {
  const out = [];
  const walk = (abs) => {
    if (!fs.existsSync(abs)) return;
    let st;
    try { st = fs.statSync(abs); } catch { return; }
    if (st.isDirectory()) {
      const base = path.basename(abs);
      if (["node_modules", ".git", ".tmp"].includes(base)) return;
      for (const entry of fs.readdirSync(abs)) walk(path.join(abs, entry));
      return;
    }
    if (st.isFile() && abs.toLowerCase().endsWith(".md")) out.push(abs);
  };
  for (const d of subdirs) walk(path.resolve(root, d));
  return out;
}

function listYamlFiles(root, subdirs) {
  const out = [];
  const walk = (abs) => {
    if (!fs.existsSync(abs)) return;
    let st;
    try { st = fs.statSync(abs); } catch { return; }
    if (st.isDirectory()) {
      const base = path.basename(abs);
      if (["node_modules", ".git", ".tmp"].includes(base)) return;
      for (const entry of fs.readdirSync(abs)) walk(path.join(abs, entry));
      return;
    }
    if (st.isFile() && /\.(ya?ml|json)$/i.test(abs)) out.push(abs);
  };
  for (const d of subdirs) walk(path.resolve(root, d));
  return out;
}

function parseYamlFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const lines = m[1].split(/\r?\n/);
  const data = {};
  let currentKey = null;
  for (const line of lines) {
    const kv = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (kv) {
      currentKey = kv[1].trim();
      const raw = kv[2].trim();
      if (!raw) {
        data[currentKey] = [];
      } else if (raw.startsWith("[") && raw.endsWith("]")) {
        data[currentKey] = raw
          .slice(1, -1)
          .split(",")
          .map((v) => v.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else {
        data[currentKey] = raw.replace(/^["']|["']$/g, "");
      }
      continue;
    }
    const bullet = line.match(/^\s*-\s+(.+)$/);
    if (bullet && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(bullet[1].trim().replace(/^["']|["']$/g, ""));
    }
  }
  return data;
}

function joinList(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

// syncSessionEvents: parsea SESSION_LOG.md y puebla ai_session_events.
// Formato esperado por entrada:
//   ## YYYY-MM-DD HH:MM — Titulo
//   - Agente: ...
//   - Resumen: ...
//   - Cambios: \n  - ... \n  - ...
//   - Pendiente: \n  - ...
//   - Evidencia: \n  - ...
function syncSessionEvents(db, files) {
  const insert = db.prepare(`
    INSERT INTO ai_session_events(occurred_at, agent, summary, changes, pending, source_ref)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  let count = 0;
  for (const file of files) {
    if (!/session_log\.md$/i.test(file.rel)) continue;
    for (const section of findMarkdownSections(file.text)) {
      const head = section.heading.match(
        /^(\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?)\s*[—\-:]\s*(.+)$/,
      );
      if (!head) continue;
      const occurredAt = head[1].trim();
      const title = head[2].trim();
      const fields = extractSessionFields(section.body);
      const summary = fields.resumen || title;
      insert.run(
        occurredAt,
        fields.agente || null,
        summary.slice(0, 280),
        fields.cambios ? fields.cambios.slice(0, 1200) : null,
        fields.pendiente ? fields.pendiente.slice(0, 1200) : null,
        file.rel,
      );
      count += 1;
    }
  }
  return count;
}

function extractSessionFields(body) {
  // Parser tolerante: detecta "- Campo:" y captura su valor o sublista.
  const lines = body.split(/\r?\n/);
  const fields = {};
  let currentKey = null;
  let buffer = [];
  const flush = () => {
    if (!currentKey) return;
    fields[currentKey] = buffer
      .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
      .filter(Boolean)
      .join(" · ");
    buffer = [];
  };
  for (const line of lines) {
    const top = line.match(/^\s*[-*]\s+([A-Za-zÁÉÍÓÚáéíóúÑñ]+)\s*:\s*(.*)$/);
    if (top) {
      flush();
      currentKey = stripAccents(top[1].toLowerCase());
      const inline = top[2].trim();
      if (inline) buffer.push(inline);
      continue;
    }
    if (currentKey && /^\s+[-*]\s+/.test(line)) {
      buffer.push(line);
    } else if (currentKey && line.trim() === "") {
      // permitir lineas vacias dentro del bloque
    } else if (currentKey && !/^#/.test(line)) {
      // texto libre se anexa al campo actual
      buffer.push(line);
    }
  }
  flush();
  return fields;
}

function syncMemory(root, db) {
  const files = collectSyncMarkdown(root).map((absolute) => ({
    abs: absolute,
    rel: normalizeRelative(root, absolute),
    text: fs.readFileSync(absolute, "utf8"),
  }));

  const counts = {
    files: files.length,
    traceLinks: 0,
    gateRuns: 0,
    evidence: 0,
    decisions: 0,
    openQuestions: 0,
    sessionEvents: 0,
  };

  db.exec("BEGIN");
  try {
    // Tablas derivadas: se reconstruyen completas en cada sync.
    db.exec("DELETE FROM ai_evidence_items");
    db.exec("DELETE FROM ai_gate_runs");
    db.exec("DELETE FROM ai_trace_links");
    db.exec("DELETE FROM ai_open_questions");
    db.exec("DELETE FROM ai_decisions");
    db.exec("DELETE FROM ai_session_events");

    // v12.30: progreso por fase. 6 fases, una linea cada vez que una termina.
    process.stdout.write(`[progress] 0/6 fases (sincronizando ${files.length} archivos)\n`);
    counts.traceLinks = syncTraceLinks(db, files, root);
    // v12.45.1: auto-registrar artefactos canonicos per-feature como trace links
    // de tipo 'doc'. Asi cada spec-tecnica.md / prototype.md / product-design.md /
    // spdd-frontend.md / api-contract.md de cada feature aparece como source_file
    // de al menos un link, evitando que check-orphan-evidence los reporte huerfanos.
    counts.traceLinks += syncCanonicalArtifacts(db, root);
    process.stdout.write(`[progress] 1/6 fases (traceLinks: ${counts.traceLinks})\n`);
    counts.gateRuns = syncGateRuns(db, files, root);
    process.stdout.write(`[progress] 2/6 fases (gateRuns: ${counts.gateRuns})\n`);
    counts.evidence = syncEvidenceItems(db, files);
    process.stdout.write(`[progress] 3/6 fases (evidence: ${counts.evidence})\n`);
    counts.decisions = syncDecisions(db, files);
    process.stdout.write(`[progress] 4/6 fases (decisions: ${counts.decisions})\n`);
    counts.openQuestions = syncOpenQuestions(db, files);
    process.stdout.write(`[progress] 5/6 fases (openQuestions: ${counts.openQuestions})\n`);
    counts.sessionEvents = syncSessionEvents(db, files);
    process.stdout.write(`[progress] 6/6 fases (sessionEvents: ${counts.sessionEvents})\n`);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  // v12.48 (P3.4): warning de inconsistencia inter-feature. Si una feature
  // tiene matriz canonica (header 10 cols) y otra no, reportarlo en stdout.
  // Captura el patron real visto en opencode: features 001-004 con matriz mala
  // y 005-008 con matriz buena.
  try {
    const inconsistencies = detectFeatureMatrixInconsistencies(root);
    if (inconsistencies.length > 0) {
      process.stdout.write(`[warning] inconsistencia inter-feature en matrices de traceability:\n`);
      for (const i of inconsistencies) process.stdout.write(`  - ${i}\n`);
      process.stdout.write(`[warning] revisa que todas las features sigan el header canonico de 10 cols.\n`);
    }
  } catch { /* no romper sync por warning */ }
  return counts;
}

// v12.48 (P3.4): inspecciona specs/<feature>/traceability.md y reporta features
// que NO siguen el header canonico v12.45 (10 columnas exactas).
function detectFeatureMatrixInconsistencies(root) {
  const issues = [];
  const specsDir = path.join(root, "specs");
  if (!fs.existsSync(specsDir)) return issues;
  let entries;
  try { entries = fs.readdirSync(specsDir, { withFileTypes: true }); } catch { return issues; }
  const features = entries.filter((e) => e.isDirectory() && /^\d{3,}-[a-z0-9-]+/i.test(e.name));
  const canonicalHeader = /\|\s*RF\s*\|\s*HU\s*\|\s*UX\/SPDD\s*\|\s*Prototipo\s*\|\s*API\s*\|\s*BD\s*\|\s*Codigo\s*\|\s*Test\s*\|\s*Estado\s*\|\s*Evidencia\s*\|/i;
  let canonicalCount = 0;
  const nonCanonical = [];
  for (const f of features) {
    const tracePath = path.join(specsDir, f.name, "traceability.md");
    if (!fs.existsSync(tracePath)) continue;
    const text = fs.readFileSync(tracePath, "utf8");
    if (canonicalHeader.test(text)) {
      canonicalCount += 1;
    } else {
      // Detectar variantes comunes para mensaje accionable.
      const colsHeaderMatch = text.match(/^\|\s*RF\s*\|[^\n]+\|\s*$/m);
      const colsDetected = colsHeaderMatch ? colsHeaderMatch[0].split("|").filter((c) => c.trim()).length : "?";
      nonCanonical.push({ feature: f.name, colsDetected });
    }
  }
  // Solo emitir warnings si hay MEZCLA (algunas canonicas + algunas no) — eso
  // es el patron de inconsistencia. Si todas son no-canonicas o todas canonicas,
  // no es inconsistencia sino problema/exito uniforme.
  if (canonicalCount > 0 && nonCanonical.length > 0) {
    issues.push(`${canonicalCount} feature(s) usan el header canonico (10 cols), pero ${nonCanonical.length} no:`);
    for (const nc of nonCanonical.slice(0, 5)) {
      issues.push(`  · specs/${nc.feature}/traceability.md (detectadas ${nc.colsDetected} columnas, esperadas 10)`);
    }
    if (nonCanonical.length > 5) issues.push(`  ... y ${nonCanonical.length - 5} mas.`);
  }
  return issues;
}

function countRows(db, table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

// ── Front embebido de consulta de memoria ───────────────────────────────────
// memory-report: genera un HTML estatico autocontenido con un snapshot de la BD.
// memory-serve:  levanta un servidor Node que consulta la BD en vivo.
// Ambos comparten la misma UI; solo cambia de donde vienen los datos.

function buildMemorySnapshot(db, dbPath, mode) {
  const all = (sql) => {
    try {
      return db.prepare(sql).all();
    } catch {
      return [];
    }
  };
  return {
    generatedAt: new Date().toISOString(),
    dbPath,
    mode,
    stats: {
      documents: countRows(db, "ai_documents"),
      chunks: countRows(db, "ai_document_chunks"),
      traceLinks: countRows(db, "ai_trace_links"),
      gateRuns: countRows(db, "ai_gate_runs"),
      evidence: countRows(db, "ai_evidence_items"),
      decisions: countRows(db, "ai_decisions"),
      openQuestions: countRows(db, "ai_open_questions"),
      fts: hasFtsTable(db),
    },
    traceLinks: all(
      "SELECT source_type, source_ref, target_type, target_ref, relation, evidence_ref FROM ai_trace_links ORDER BY source_ref, relation",
    ),
    gateRuns: all(
      "SELECT gate, phase_scope, status, summary FROM ai_gate_runs ORDER BY phase_scope, gate",
    ),
    evidence: all(
      "SELECT evidence_type, path, description, status FROM ai_evidence_items ORDER BY path",
    ),
    decisions: all(
      "SELECT title, status, decision_ref, adr_path FROM ai_decisions ORDER BY decision_ref, title",
    ),
    openQuestions: all(
      "SELECT phase, question, source_ref, status FROM ai_open_questions ORDER BY phase",
    ),
    documents: all(
      "SELECT path, kind, phase, title FROM ai_documents ORDER BY path",
    ),
    presets: MEMORY_QUERY_PRESETS,
  };
}

// Cliente JS de la UI. Sin backticks ni `${` para poder vivir dentro del
// template literal exterior sin escapes.
const MEMORY_CLIENT_JS = [
  "(function(){",
  "  var MEM = window['__' + 'MEMORY__'] || null;",
  "  var MODE = window['__' + 'MEMORY' + '_MODE__'] || (MEM ? 'static' : 'live');",
  "  var el = function(id){ return document.getElementById(id); };",
  "  var esc = function(s){ s = (s==null?'':String(s)); return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };",
  "  // v12.32: helper compartido para serializar selectedOptions de un <select multiple> como CSV.",
  "  function multiCsv(id){ var n=el(id); if(!n) return ''; if(n.multiple){ var arr=[]; for(var i=0;i<n.selectedOptions.length;i++) arr.push(n.selectedOptions[i].value); return arr.filter(Boolean).join(','); } return n.value||''; }",
  "  function cell(v){ return '<td>' + esc(v||'-') + '</td>'; }",
  "  function table(headers, rows, cols){",
  "    if(!rows || !rows.length) return '<p class=\"empty\">Sin registros.</p>';",
  "    var h = '<table><thead><tr>'; for(var i=0;i<headers.length;i++) h += '<th>'+esc(headers[i])+'</th>'; h += '</tr></thead><tbody>';",
  "    for(var r=0;r<rows.length;r++){ h += '<tr>'; for(var c=0;c<cols.length;c++) h += cell(rows[r][cols[c]]); h += '</tr>'; }",
  "    return h + '</tbody></table>';",
  "  }",
  "  function renderStats(s){",
  "    var items = [['Documentos',s.documents],['Chunks',s.chunks],['Trace links',s.traceLinks],['Gate runs',s.gateRuns],['Evidencia',s.evidence],['Decisiones',s.decisions],['Preguntas',s.openQuestions]];",
  "    var h = ''; for(var i=0;i<items.length;i++){ h += '<div class=\"stat\"><div class=\"stat-v\">'+esc(items[i][1])+'</div><div class=\"stat-l\">'+esc(items[i][0])+'</div></div>'; }",
  "    h += '<div class=\"stat\"><div class=\"stat-v\">'+(s.fts?'si':'no')+'</div><div class=\"stat-l\">FTS5</div></div>';",
  "    el('stats').innerHTML = h;",
  "  }",
  "  function renderAll(d){",
  "    renderStats(d.stats);",
  "    el('tab-trace').innerHTML = table(['Origen','Ref','Relacion','Destino','Ref destino','Evidencia'], d.traceLinks, ['source_type','source_ref','relation','target_type','target_ref','evidence_ref']);",
  "    el('tab-gates').innerHTML = table(['Gate','Scope','Estado','Fuente'], d.gateRuns, ['gate','phase_scope','status','summary']);",
  "    el('tab-decisions').innerHTML = table(['Ref','Titulo','Estado','ADR'], d.decisions, ['decision_ref','title','status','adr_path']);",
  "    el('tab-evidence').innerHTML = table(['Tipo','Ruta','Descripcion','Estado'], d.evidence, ['evidence_type','path','description','status']);",
  "    el('tab-questions').innerHTML = table(['Fase','Pregunta','Fuente','Estado'], d.openQuestions, ['phase','question','source_ref','status']);",
  "    el('tab-docs').innerHTML = table(['Ruta','Tipo','Fase','Titulo'], d.documents, ['path','kind','phase','title']);",
  "    el('meta').textContent = 'BD: ' + d.dbPath + '  |  modo: ' + d.mode + '  |  ' + d.generatedAt;",
  "  }",
  "  function matchesAll(haystack, terms){ var l=String(haystack||'').toLowerCase(); for(var i=0;i<terms.length;i++){ if(l.indexOf(terms[i])<0) return false; } return true; }",
  "  function staticSearch(q){",
  "    q = q.toLowerCase().trim(); if(!q) return [];",
  "    var terms = q.split(/\\s+/);",
  "    var out = [];",
  "    (MEM.documents||[]).forEach(function(x){ if(matchesAll(x.path+' '+(x.title||''), terms)) out.push({t:'doc', ref:x.path, path:x.path, excerpt:x.title||''}); });",
  "    (MEM.traceLinks||[]).forEach(function(x){ var hay=x.source_ref+' '+x.relation+' '+x.target_ref+' '+(x.evidence_ref||''); if(matchesAll(hay, terms)) out.push({t:'trace', ref:x.source_ref+' -['+x.relation+']-> '+x.target_ref, path:x.evidence_ref||'', excerpt:(x.source_type||'')+' -> '+(x.target_type||'')}); });",
  "    (MEM.decisions||[]).forEach(function(x){ if(matchesAll((x.decision_ref||'')+' '+(x.title||'')+' '+(x.status||''), terms)) out.push({t:'decision', ref:x.decision_ref||x.title, path:x.adr_path||'', excerpt:(x.title||'')+' ('+x.status+')'}); });",
  "    (MEM.gateRuns||[]).forEach(function(x){ if(matchesAll(x.gate+' '+x.phase_scope+' '+x.status, terms)) out.push({t:'gate', ref:x.gate+' ('+x.phase_scope+')', path:x.summary||'', excerpt:x.status}); });",
  "    (MEM.openQuestions||[]).forEach(function(x){ if(matchesAll(x.question, terms)) out.push({t:'pregunta', ref:x.source_ref||'', path:x.source_ref||'', excerpt:x.question}); });",
  "    return out.slice(0,60);",
  "  }",
  "  function renderSearch(rows, label){",
  "    var modeNote = MODE==='live' ? 'live (metadata + chunks)' : 'estatico (solo metadata; sin chunks)';",
  "    var hdr = '<div class=\"count\"><strong>'+(rows.length)+'</strong> resultado'+(rows.length===1?'':'s')+(label?' · '+esc(label):'')+' <span class=\"mode-note\">[modo: '+esc(modeNote)+']</span></div>';",
  "    if(!rows.length){ el('search-out').innerHTML = hdr + '<p class=\"empty\">Sin resultados.</p>'; return; }",
  "    var byType = {}; for(var k=0;k<rows.length;k++){ var tt=rows[k].t||rows[k].kind||'-'; byType[tt]=(byType[tt]||0)+1; }",
  "    var typeOrder = ['chunk','doc','trace','decision','gate','pregunta','api','rf','prototipo'];",
  "    var chips=''; for(var i0=0;i0<typeOrder.length;i0++){ var tt0=typeOrder[i0]; if(byType[tt0]) chips += '<span class=\"badge\">'+esc(tt0)+': '+byType[tt0]+'</span> '; }",
  "    for(var t in byType){ if(typeOrder.indexOf(t)<0) chips += '<span class=\"badge\">'+esc(t)+': '+byType[t]+'</span> '; }",
  "    var h = hdr + '<div class=\"chips\">'+chips+'</div>' + '<table><thead><tr><th>Tipo</th><th>Resultado</th></tr></thead><tbody>';",
  "    for(var i=0;i<rows.length;i++){ var r=rows[i]; h += '<tr><td><span class=\"badge\">'+esc(r.t||r.kind||'')+'</span></td><td>'+esc(r.ref || (r.path+' :: '+(r.heading||'')))+(r.excerpt?'<div class=\"excerpt\">'+esc(r.excerpt)+'</div>':'')+'</td></tr>'; }",
  "    el('search-out').innerHTML = h + '</tbody></table>';",
  "  }",
  "  function doSearch(){",
  "    var q = el('search-q').value;",
  "    if(!q || !q.trim()){ el('search-out').innerHTML = '<p class=\"empty\">Escribe una consulta y pulsa Buscar.</p>'; return; }",
  "    if(MODE === 'live'){",
  "      fetch('/api/search?q=' + encodeURIComponent(q)).then(function(r){return r.json();}).then(function(rows){renderSearch(rows, 'busqueda: '+q);}).catch(function(){ el('search-out').innerHTML='<p class=\"empty\">Error de busqueda.</p>'; });",
  "    } else {",
  "      renderSearch(staticSearch(q), 'busqueda: '+q);",
  "    }",
  "  }",
  "  // ---- Preset queries (Consultas rapidas) ------------------------------",
  "  function runQueryClient(key, arg){",
  "    arg = (arg||'').trim();",
  "    var out=[]; var like = arg.toLowerCase();",
  "    var T = MEM.traceLinks||[], D = MEM.decisions||[], G = MEM.gateRuns||[], C = MEM.documents||[], Q = MEM.openQuestions||[];",
  "    function dec(s){ return String(s||'').toLowerCase(); }",
  "    switch(key){",
  "      case 'docs-for':",
  "        if(!arg) return [];",
  "        T.forEach(function(x){ if(x.source_ref===arg || (x.target_ref||'').indexOf(arg)>=0) out.push({t:'trace', ref:x.source_ref+' -['+x.relation+']-> '+x.target_ref, path:x.evidence_ref||'', excerpt:'tipo destino: '+x.target_type}); });",
  "        C.forEach(function(x){ if((x.path||'').toLowerCase().indexOf(like)>=0 || (x.title||'').toLowerCase().indexOf(like)>=0) out.push({t:'doc', ref:x.path, path:x.path, excerpt:x.title||''}); });",
  "        return out;",
  "      case 'apis-for':",
  "        if(!arg) return [];",
  "        T.forEach(function(x){ if(x.source_ref===arg && x.target_type==='api') out.push({t:'api', ref:x.source_ref+' → '+x.target_ref, path:x.evidence_ref||'', excerpt:x.target_ref}); });",
  "        return out;",
  "      case 'features-pending-qa':",
  "        G.forEach(function(x){ var s=dec(x.status); if((x.phase_scope||'').indexOf('specs/')===0 && s.indexOf('aprob')<0 && s.indexOf('cerrad')<0) out.push({t:'gate', ref:x.gate+' · '+x.phase_scope.replace(/^specs\\//,''), path:x.phase_scope, excerpt:x.status}); });",
  "        return out;",
  "      case 'validated-prototypes':",
  "        G.forEach(function(x){ var s=dec(x.status); if(x.gate==='gate-prototype-ready' && (s.indexOf('valid')>=0 || s.indexOf('listo')>=0 || s.indexOf('aprob')>=0)) out.push({t:'prototipo', ref:x.phase_scope.replace(/^specs\\//,''), path:x.phase_scope, excerpt:x.status}); });",
  "        return out;",
  "      case 'decisions-pending':",
  "        D.forEach(function(x){ var s=dec(x.status); if(s.indexOf('aprob')<0 && s.indexOf('aceptad')<0 && s.indexOf('cerrad')<0) out.push({t:'decision', ref:x.decision_ref||x.title, path:x.adr_path||'', excerpt:(x.title||'')+' · estado: '+x.status}); });",
  "        return out;",
  "      case 'failed-gates':",
  "        G.forEach(function(x){ var s=dec(x.status); if(s.indexOf('bloque')>=0||s.indexOf('falla')>=0||s.indexOf('recha')>=0||s.indexOf('error')>=0) out.push({t:'gate', ref:x.gate+' · '+x.phase_scope, path:x.phase_scope, excerpt:x.status}); });",
  "        return out;",
  "      case 'rf-without-code': {",
  "        var withCode = {}; T.forEach(function(x){ if(x.target_type==='codigo') withCode[x.source_ref]=true; });",
  "        var rfs = {}; T.forEach(function(x){ if((x.source_type==='RF'||x.source_type==='requerimiento')) rfs[x.source_ref]=true; });",
  "        for(var rf in rfs){ if(!withCode[rf]) out.push({t:'rf', ref:rf, path:'', excerpt:'sin trace_link de target_type=codigo'}); }",
  "        out.sort(function(a,b){return a.ref<b.ref?-1:1;}); return out;",
  "      }",
  "      case 'rf-without-test': {",
  "        var withTest = {}; T.forEach(function(x){ if(x.target_type==='test') withTest[x.source_ref]=true; });",
  "        var rfs2 = {}; T.forEach(function(x){ if((x.source_type==='RF'||x.source_type==='requerimiento')) rfs2[x.source_ref]=true; });",
  "        for(var rf2 in rfs2){ if(!withTest[rf2]) out.push({t:'rf', ref:rf2, path:'', excerpt:'sin trace_link de target_type=test'}); }",
  "        out.sort(function(a,b){return a.ref<b.ref?-1:1;}); return out;",
  "      }",
  "      case 'rf-implemented': {",
  "        var c={}, t2={}; T.forEach(function(x){ if(x.source_type==='RF'||x.source_type==='requerimiento'){ if(x.target_type==='codigo') c[x.source_ref]=true; if(x.target_type==='test') t2[x.source_ref]=true; }});",
  "        for(var rf3 in c){ if(t2[rf3]) out.push({t:'rf', ref:rf3, path:'', excerpt:'tiene codigo y test'}); }",
  "        out.sort(function(a,b){return a.ref<b.ref?-1:1;}); return out;",
  "      }",
  "      case 'decisions-about':",
  "        if(!arg) return [];",
  "        D.forEach(function(x){ var blob=(dec(x.title)+' '+dec(x.status)+' '+dec(x.tags||'')); if(blob.indexOf(like)>=0) out.push({t:'decision', ref:x.decision_ref||x.title, path:x.adr_path||'', excerpt:(x.title||'')+' · '+x.status+(x.tags?' · tags: '+x.tags:'')}); });",
  "        return out;",
  "      default: return [];",
  "    }",
  "  }",
  "  function runPreset(key, label){",
  "    var preset = (MEM.presets||[]).find(function(p){return p.key===key;}) || {key:key, requiresArg:false};",
  "    var arg = '';",
  "    if(preset.requiresArg){ arg = (el('preset-arg')||{}).value || ''; if(!arg.trim()){ el('search-out').innerHTML = '<p class=\"empty\">Esta consulta requiere un argumento. Escribelo arriba y vuelve a pulsar.</p>'; return; } }",
  "    var labelText = (label||preset.label||key) + (arg ? ' · arg: '+arg : '');",
  "    if(MODE === 'live'){",
  "      fetch('/api/query?preset='+encodeURIComponent(key)+(arg?'&arg='+encodeURIComponent(arg):'')).then(function(r){return r.json();}).then(function(rows){ if(rows && rows.error){ el('search-out').innerHTML='<p class=\"empty\">'+esc(rows.error)+'</p>'; return; } renderSearch(rows||[], labelText); }).catch(function(){ el('search-out').innerHTML='<p class=\"empty\">Error consultando preset.</p>'; });",
  "    } else {",
  "      renderSearch(runQueryClient(key, arg), labelText);",
  "    }",
  "  }",
  "  function renderPresetButtons(){",
  "    var presets = MEM.presets || [];",
  "    if(!presets.length){ return; }",
  "    var html = '<div class=\"presets\"><div class=\"presets-title\">Consultas rapidas</div>';",
  "    html += '<input id=\"preset-arg\" type=\"text\" placeholder=\"Argumento (RF-02, Keycloak, reportes…) cuando aplique\" />';",
  "    html += '<div class=\"preset-grid\">';",
  "    for(var i=0;i<presets.length;i++){ var p=presets[i]; html += '<button class=\"preset-btn\" data-key=\"'+esc(p.key)+'\" title=\"'+esc(p.hint||'')+'\">'+esc(p.label)+(p.requiresArg?' <span class=\"req\">*</span>':'')+'</button>'; }",
  "    html += '</div></div>';",
  "    var host = el('presets-host'); if(host) host.innerHTML = html;",
  "    var btns = document.querySelectorAll('.preset-btn'); for(var j=0;j<btns.length;j++){ btns[j].addEventListener('click', function(ev){ runPreset(ev.currentTarget.getAttribute('data-key')); }); }",
  "  }",
  "  // ---- Acciones (Validador / Sync / Reporte / Generador) --------------",
  "  var ACTIONS_CACHE = null;",
  "  // v12.27: si la linea matchea `[progress] X/Y label`, actualizamos una barra",
  "  // de progreso en lugar de imprimir una linea nueva por tick.",
  "  var __progressBar = null;",
  "  function renderProgress(done, total, label){",
  "    var c = el('console');",
  "    if(!__progressBar){",
  "      var wrap = document.createElement('div'); wrap.className = 'progress-line';",
  "      wrap.innerHTML = '<div class=\"progress-text\"></div><div class=\"progress-bar\"><div class=\"progress-fill\"></div></div>';",
  "      c.appendChild(wrap);",
  "      __progressBar = { wrap:wrap, text:wrap.querySelector('.progress-text'), fill:wrap.querySelector('.progress-fill') };",
  "    }",
  "    var pct = total > 0 ? Math.min(100, (done*100/total)) : 0;",
  "    __progressBar.text.textContent = label+': '+done+'/'+total+' ('+pct.toFixed(0)+'%)';",
  "    __progressBar.fill.style.width = pct.toFixed(1)+'%';",
  "    if(done >= total) __progressBar = null; // proxima linea de progreso crea barra nueva",
  "    c.scrollTop = c.scrollHeight;",
  "  }",
  "  var PROGRESS_RE = /^\\[progress\\]\\s+(\\d+)\\/(\\d+)\\s+(.+)$/;",
  "  function consoleLine(cls, text){",
  "    var m = (cls === 'err') ? null : PROGRESS_RE.exec(text||'');",
  "    if(m){ renderProgress(Number(m[1]), Number(m[2]), m[3]); return; }",
  "    __progressBar = null; // cualquier otra linea cierra la barra activa",
  "    var c=el('console'); var span=document.createElement('span'); if(cls) span.className=cls; span.textContent=text+'\\n'; c.appendChild(span); c.scrollTop=c.scrollHeight;",
  "  }",
  "  function consoleClear(){ el('console').innerHTML = '<span class=\"muted\">Consola limpia.</span>\\n'; }",
  "  function consoleCopy(){ var t=el('console').innerText||''; if(navigator.clipboard) navigator.clipboard.writeText(t); }",
  "  var CATEGORY_LABEL = { universal:'Comandos universales · siempre disponibles', memoria:'Memoria · rebuild / update DB', validador:'Validadores · read-only, exit code', reporte:'Reportes · snapshots y packs', generador:'Generadores · ESCRIBEN archivos del repo' };",
  "  function renderActions(actions){",
  "    var byCat = { universal:[], memoria:[], validador:[], reporte:[], generador:[] };",
  "    actions.forEach(function(a){ (byCat[a.category]=byCat[a.category]||[]).push(a); });",
  "    var html='';",
  "    ['universal','memoria','validador','reporte','generador'].forEach(function(cat){",
  "      if(!byCat[cat] || !byCat[cat].length) return;",
  "      html += '<div class=\"action-cat\"><h3>'+esc(CATEGORY_LABEL[cat]||cat)+'</h3><div class=\"action-grid\">';",
  "      byCat[cat].forEach(function(a){",
  "        var classes = 'action-btn' + (a.danger?' danger':'');",
  "        var argBlock = '';",
  "        if(a.arg){ argBlock = '<div class=\"action-arg\">'+esc(a.arg.name)+(a.arg.required?' <span style=\"color:#B45309\">*</span>':'')+': <input id=\"arg-'+esc(a.id)+'\" placeholder=\"'+esc(a.arg.hint||'')+'\" /></div>'; }",
  "        html += '<button class=\"'+classes+'\" data-action=\"'+esc(a.id)+'\">'+esc(a.label)+'<span class=\"ah\">'+esc(a.hint||'')+'</span></button>'+argBlock;",
  "      });",
  "      html += '</div></div>';",
  "    });",
  "    el('actions-host').innerHTML = html;",
  "    var btns = el('actions-host').querySelectorAll('.action-btn');",
  "    for(var i=0;i<btns.length;i++){ btns[i].addEventListener('click', function(ev){ onActionClick(ev.currentTarget.getAttribute('data-action')); }); }",
  "  }",
  "  function findAction(id){ if(!ACTIONS_CACHE) return null; for(var i=0;i<ACTIONS_CACHE.length;i++) if(ACTIONS_CACHE[i].id===id) return ACTIONS_CACHE[i]; return null; }",
  "  function onActionClick(id){",
  "    var a = findAction(id); if(!a) return;",
  "    var arg = '';",
  "    if(a.arg){ var input = el('arg-'+id); arg = input ? (input.value||'').trim() : ''; if(a.arg.required && !arg){ alert('Esta accion requiere '+a.arg.name); return; } }",
  "    if(a.danger){",
  "      el('modal-title').textContent = 'Confirmar: '+a.label;",
  "      el('modal-msg').textContent = (a.hint||'')+'\\n\\nEsta accion modifica archivos del repo. ¿Continuar?';",
  "      el('modal-bg').classList.add('show');",
  "      el('modal-confirm').onclick = function(){ el('modal-bg').classList.remove('show'); execAction(id, arg); };",
  "      el('modal-cancel').onclick = function(){ el('modal-bg').classList.remove('show'); };",
  "    } else { execAction(id, arg); }",
  "  }",
  "  // v12.24: ejecucion via SSE — stdout/stderr aparecen linea por linea.",
  "  // Soporta cancelacion: el cliente aborta la conexion fetch, el server",
  "  // detecta req.close y envia SIGTERM al child.",
  "  var __execController = null;",
  "  function setRunning(running){",
  "    var btns = el('actions-host').querySelectorAll('.action-btn');",
  "    for(var i=0;i<btns.length;i++) btns[i].disabled = !!running;",
  "    var stop = el('console-stop'); if(stop) stop.style.display = running ? 'inline-block' : 'none';",
  "  }",
  "  function execAction(id, arg){",
  "    var a = findAction(id); if(!a) return;",
  "    setRunning(true);",
  "    consoleLine('cmd', '$ '+a.label+(arg?' --'+a.arg.name.replace(/^--/,'')+' '+arg:''));",
  "    var t0 = Date.now();",
  "    var ctrl = ('AbortController' in window) ? new AbortController() : null;",
  "    __execController = ctrl;",
  "    var buf = '';",
  "    var pending = { stdout: '', stderr: '' };",
  "    function flushPending(kind){ var s=pending[kind]; if(s){ consoleLine(kind==='stderr'?'err':'', s.replace(/\\n$/,'')); pending[kind]=''; } }",
  "    function handleEvent(type, dataStr){",
  "      var data; try { data = JSON.parse(dataStr); } catch { return; }",
  "      if(type==='meta'){ consoleLine('muted', 'pid '+data.pid+' · '+(data.argv||[]).join(' ')); return; }",
  "      if(type==='stdout' || type==='stderr'){",
  "        // Buffer por linea: emite cada vez que llega un \\n para no romper el flow.",
  "        pending[type] += data.chunk||'';",
  "        var idx;",
  "        while((idx = pending[type].indexOf('\\n')) >= 0){",
  "          var line = pending[type].slice(0, idx);",
  "          pending[type] = pending[type].slice(idx+1);",
  "          consoleLine(type==='stderr'?'err':'', line);",
  "        }",
  "        return;",
  "      }",
  "      if(type==='exit'){",
  "        flushPending('stdout'); flushPending('stderr');",
  "        var ms = data.durationMs || (Date.now()-t0);",
  "        var s = (ms/1000).toFixed(1);",
  "        if(data.exitCode === 0) consoleLine('ok', '─ exit 0 · '+s+'s ─');",
  "        else consoleLine('err', '─ exit '+data.exitCode+(data.signal?' ('+data.signal+')':'')+(data.timedOut?' · TIMEOUT':'')+' · '+s+'s ─');",
  "        return;",
  "      }",
  "      if(type==='error'){ flushPending('stdout'); flushPending('stderr'); consoleLine('err', '✗ '+(data.message||'error')); return; }",
  "    }",
  "    function parseSseBuffer(){",
  "      // Eventos SSE separados por blank line; cada evento puede traer event:/data:.",
  "      var idx;",
  "      while((idx = buf.indexOf('\\n\\n')) >= 0){",
  "        var raw = buf.slice(0, idx); buf = buf.slice(idx+2);",
  "        var lines = raw.split('\\n'); var ev='message', dat='';",
  "        for(var li=0; li<lines.length; li++){",
  "          var ln = lines[li]; if(!ln || ln.charAt(0)===':') continue;",
  "          if(ln.indexOf('event:')===0) ev = ln.slice(6).trim();",
  "          else if(ln.indexOf('data:')===0) dat += (dat?'\\n':'') + ln.slice(5).trimStart();",
  "        }",
  "        if(dat) handleEvent(ev, dat);",
  "      }",
  "    }",
  "    fetch('/api/exec', {",
  "      method:'POST',",
  "      headers:{ 'Content-Type':'application/json', 'Accept':'text/event-stream' },",
  "      body: JSON.stringify({ id:id, arg:arg||undefined }),",
  "      signal: ctrl ? ctrl.signal : undefined,",
  "    }).then(function(r){",
  "      if(!r.ok || !r.body || (r.headers.get('content-type')||'').indexOf('text/event-stream')<0){",
  "        return r.json().then(function(j){ consoleLine('err', '✗ '+(j && j.error ? j.error : ('HTTP '+r.status))); });",
  "      }",
  "      var reader = r.body.getReader(); var dec = new TextDecoder('utf-8');",
  "      function pump(){",
  "        return reader.read().then(function(step){",
  "          if(step.done){ flushPending('stdout'); flushPending('stderr'); return; }",
  "          buf += dec.decode(step.value, { stream:true });",
  "          parseSseBuffer();",
  "          return pump();",
  "        });",
  "      }",
  "      return pump();",
  "    }).catch(function(err){",
  "      if(err && err.name==='AbortError'){ consoleLine('info', '… cancelado por el usuario'); }",
  "      else consoleLine('err', '✗ Error de red: '+(err && err.message ? err.message : err));",
  "    }).then(function(){",
  "      __execController = null;",
  "      setRunning(false);",
  "      if(['sync-memory','index-docs','embed-docs','regenerate-context','harvest-trace'].indexOf(id)>=0){",
  "        fetch('/api/snapshot').then(function(r){return r.json();}).then(function(d){ MEM=d; renderAll(d); consoleLine('info', '… snapshot recargado'); }).catch(function(){});",
  "      }",
  "      // Si el subpane Historial o Stats esta visible, refrescarlo silenciosamente.",
  "      var hp = el('subpane-history'); if(hp && hp.classList.contains('active')) loadHistory();",
  "      var sp = el('subpane-stats'); if(sp && sp.classList.contains('active')) loadStats();",
  "    });",
  "  }",
  "  function stopAction(){",
  "    if(!__execController){ return; }",
  "    consoleLine('info', '… enviando cancelacion (SIGTERM)…');",
  "    fetch('/api/exec', { method:'DELETE' }).catch(function(){});",
  "    try { __execController.abort(); } catch {}",
  "  }",
  "  function loadActions(){",
  "    if(MODE !== 'live'){ el('actions-host').innerHTML = '<p class=\"empty\">Las acciones solo estan disponibles en modo live (memory-serve). Arranca el server con: <code>node scripts/ai-framework-agent.mjs memory-serve</code> o <code>npm run memory:serve</code>.</p>'; return; }",
  "    fetch('/api/actions').then(function(r){return r.json();}).then(function(actions){ ACTIONS_CACHE = actions; renderActions(actions); loadAlerts(); }).catch(function(){ el('actions-host').innerHTML='<p class=\"empty\">No se pudo cargar /api/actions.</p>'; });",
  "  }",
  "  // v12.28: alertas activas (acciones con >=3 fallos consecutivos al final).",
  "  function loadAlerts(){",
  "    if(MODE !== 'live') return;",
  "    fetch('/api/action-runs/alerts').then(function(r){return r.json();}).then(renderAlerts).catch(function(){});",
  "  }",
  "  function renderAlerts(alerts){",
  "    var bar = el('alerts-banner'); if(!bar) return;",
  "    if(!alerts || !alerts.length){ bar.className = 'alerts-banner'; bar.innerHTML = ''; return; }",
  "    // v12.32: dos tipos de alerta (failure-streak + duration-threshold).",
  "    // v12.45: kind='combined' agrupa ambos del mismo action_id en una sola card.",
  "    var nStreak = 0, nSlow = 0, nCombined = 0;",
  "    alerts.forEach(function(a){",
  "      var k = a.kind || 'failure-streak';",
  "      if(k === 'combined'){ nCombined++; (a.kinds||[]).forEach(function(kk){ if(kk==='failure-streak') nStreak++; else if(kk==='duration-threshold') nSlow++; }); }",
  "      else if(k === 'duration-threshold') nSlow++;",
  "      else nStreak++;",
  "    });",
  "    var headBits = [];",
  "    if(nStreak) headBits.push(nStreak+' con fallos consecutivos');",
  "    if(nSlow) headBits.push(nSlow+' lentas (p95+%)');",
  "    if(nCombined) headBits.push(nCombined+' combinadas');",
  "    var html = '<h4>⚠ '+headBits.join(' · ')+'</h4>';",
  "    for(var i=0;i<alerts.length;i++){",
  "      var a = alerts[i];",
  "      var kind = a.kind || 'failure-streak';",
  "      var detail;",
  "      if(kind === 'combined'){",
  "        var bits = (a.parts||[]).map(function(p){",
  "          if(p.kind==='duration-threshold') return '🐢 '+esc(p.detail||'');",
  "          return p.consecutive_failures+' fallos · ultimo OK: '+esc(p.last_success?fmtAgo(p.last_success):'nunca');",
  "        });",
  "        detail = '<span title=\"agrupada\">⚠+🐢</span> '+bits.join(' &nbsp; · &nbsp; ');",
  "      } else if(kind === 'duration-threshold'){",
  "        detail = '🐢 '+esc(a.detail||'');",
  "      } else {",
  "        detail = a.consecutive_failures+' fallos consecutivos · '+esc(a.last_success ? 'ultimo OK: '+fmtAgo(a.last_success) : 'nunca tuvo OK');",
  "      }",
  "      html += '<div class=\"alert-item\"><strong>'+esc(a.action_id)+'</strong>: '+detail;",
  "      html += ' <a data-replay=\"'+esc(a.action_id)+'\">↻ re-ejecutar</a>';",
  "      html += ' <a data-history-filter=\"'+esc(a.action_id)+'\">ver historial</a>';",
  "      // v12.45 (C2): snooze por kind especifico si la alerta no es 'combined'.",
  "      var snoozeKind = (kind === 'combined') ? '' : kind;",
  "      var kindAttr = snoozeKind ? ' data-snooze-kind=\"'+esc(snoozeKind)+'\"' : '';",
  "      var kindLabel = snoozeKind === 'duration-threshold' ? ' (solo slow)' : (snoozeKind === 'failure-streak' ? ' (solo fail)' : '');",
  "      html += ' <a data-snooze=\"'+esc(a.action_id)+'\" data-duration=\"24h\"'+kindAttr+'>🔕 silenciar 24h'+kindLabel+'</a>';",
  "      html += ' <a data-snooze=\"'+esc(a.action_id)+'\" data-duration=\"7d\"'+kindAttr+'>7d</a>';",
  "      html += ' <a data-snooze=\"'+esc(a.action_id)+'\" data-duration=\"forever\"'+kindAttr+'>forever</a>';",
  "      html += '</div>';",
  "    }",
  "    bar.innerHTML = html; bar.className = 'alerts-banner show';",
  "    var rep = bar.querySelectorAll('[data-replay]');",
  "    for(var j=0;j<rep.length;j++){ rep[j].addEventListener('click', function(ev){ var aid = ev.currentTarget.getAttribute('data-replay'); showSubtab('run'); execAction(aid, ''); }); }",
  "    var hl = bar.querySelectorAll('[data-history-filter]');",
  "    for(var m=0;m<hl.length;m++){ hl[m].addEventListener('click', function(ev){ var aid = ev.currentTarget.getAttribute('data-history-filter'); showSubtab('history'); var sel = el('filter-action'); if(sel){ sel.value = aid; sel.dispatchEvent(new Event('change')); } }); }",
  "    var sn = bar.querySelectorAll('[data-snooze]');",
  "    for(var k=0;k<sn.length;k++){ sn[k].addEventListener('click', function(ev){",
  "      var aid = ev.currentTarget.getAttribute('data-snooze');",
  "      var dur = ev.currentTarget.getAttribute('data-duration');",
  "      var snKind = ev.currentTarget.getAttribute('data-snooze-kind') || null;",
  "      var kindLabel = snKind ? ' (kind='+snKind+')' : '';",
  "      var reason = (dur === 'forever') ? (prompt('Razon del snooze permanente para '+aid+kindLabel+' (ej. \"es by-design\"):', '') || 'sin razon') : '';",
  "      var payload = { action_id: aid, duration: dur, reason: reason };",
  "      if(snKind) payload.kind = snKind;",
  "      fetch('/api/action-runs/snoozes', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) })",
  "        .then(function(r){ return r.json(); })",
  "        .then(function(j){ if(j.ok){ loadAlerts(); } else { alert('No se pudo silenciar: '+(j.error||'')); } });",
  "    }); }",
  "  }",
  "  // v12.28: persistir filtros del Historial en URL para compartir / volver.",
  "  function setMulti(id, csv){ var n=el(id); if(!n||!csv) return; var vals = csv.split(',').map(function(x){return x.trim();}); if(n.multiple){ for(var i=0;i<n.options.length;i++) n.options[i].selected = vals.indexOf(n.options[i].value)>=0; } else { n.value = csv; } }",
  "  function readFiltersFromUrl(){",
  "    var params = new URLSearchParams(window.location.search);",
  "    if(params.get('act_action')) setMulti('filter-action', params.get('act_action'));",
  "    if(params.get('act_status')) setMulti('filter-status', params.get('act_status'));",
  "    if(el('filter-since') && params.get('act_since')) el('filter-since').value = params.get('act_since');",
  "    if(params.get('act_mode')) setMulti('filter-mode', params.get('act_mode'));",
  "    if(el('filter-slow') && params.get('act_slow')) el('filter-slow').value = params.get('act_slow');",
  "    if(el('trend-action') && params.get('trend_action')) el('trend-action').value = params.get('trend_action');",
  "    if(el('trend-days') && params.get('trend_days')) el('trend-days').value = params.get('trend_days');",
  "  }",
  "  function writeFiltersToUrl(){",
  "    var params = new URLSearchParams(window.location.search);",
  "    ['act_action','act_status','act_since','act_mode','act_slow'].forEach(function(p){ params.delete(p); });",
  "    var fa = multiCsv('filter-action'); if(fa) params.set('act_action', fa);",
  "    var fs = multiCsv('filter-status'); if(fs) params.set('act_status', fs);",
  "    var fsi = (el('filter-since')||{}).value; if(fsi) params.set('act_since', fsi);",
  "    var fm = multiCsv('filter-mode'); if(fm) params.set('act_mode', fm);",
  "    var fsl = (el('filter-slow')||{}).value; if(fsl) params.set('act_slow', fsl);",
  "    var qs = params.toString();",
  "    window.history.replaceState(null, '', window.location.pathname + (qs ? '?'+qs : '') + window.location.hash);",
  "  }",
  "  function writeTrendFiltersToUrl(){",
  "    var params = new URLSearchParams(window.location.search);",
  "    ['trend_action','trend_days'].forEach(function(p){ params.delete(p); });",
  "    var ta = (el('trend-action')||{}).value; if(ta) params.set('trend_action', ta);",
  "    var td = (el('trend-days')||{}).value; if(td && td !== '30') params.set('trend_days', td);",
  "    var qs = params.toString();",
  "    window.history.replaceState(null, '', window.location.pathname + (qs ? '?'+qs : '') + window.location.hash);",
  "  }",
  "  // v12.25: Historial de acciones + re-ejecucion ----------------------",
  "  function fmtAgo(iso){",
  "    if(!iso) return '-';",
  "    var t = Date.parse(iso); if(isNaN(t)) return iso;",
  "    var s = Math.floor((Date.now()-t)/1000);",
  "    if(s<60) return s+'s';",
  "    if(s<3600) return Math.floor(s/60)+'min';",
  "    if(s<86400) return Math.floor(s/3600)+'h';",
  "    return Math.floor(s/86400)+'d';",
  "  }",
  "  function fmtDuration(ms){ if(ms==null) return '-'; if(ms<1000) return ms+'ms'; return (ms/1000).toFixed(1)+'s'; }",
  "  function badgeForRun(r){",
  "    if(r.cancelled) return '<span class=\"badge cancelled\">cancelled</span>';",
  "    if(r.exit_code === 0) return '<span class=\"badge ok\">exit 0</span>';",
  "    if(r.exit_code != null) return '<span class=\"badge fail\">exit '+esc(r.exit_code)+'</span>';",
  "    if(r.signal) return '<span class=\"badge fail\">'+esc(r.signal)+'</span>';",
  "    if(r.finished_at) return '<span class=\"badge fail\">?</span>';",
  "    return '<span class=\"badge\">corriendo…</span>';",
  "  }",
  "  function renderHistory(rows){",
  "    if(!rows.length){ el('history-host').innerHTML = '<p class=\"empty\">Sin runs registrados todavia. Ejecuta una accion y vuelve.</p>'; return; }",
  "    var html = '<div class=\"history-row\" style=\"font-weight:700;color:var(--muted);font-size:11px;text-transform:uppercase;\"><div>Cuando</div><div>Accion</div><div>Duracion</div><div>Modo</div><div>Estado</div><div></div></div>';",
  "    for(var i=0;i<rows.length;i++){",
  "      var r = rows[i];",
  "      var argStr = r.arg ? ' <span class=\"arg\">'+esc(r.arg)+'</span>' : '';",
  "      html += '<div class=\"history-row\" data-runid=\"'+esc(r.id)+'\">';",
  "      html += '<div class=\"when\" title=\"'+esc(r.started_at)+'\">'+esc(fmtAgo(r.started_at))+'</div>';",
  "      html += '<div class=\"action\">'+esc(r.action_id)+argStr+'</div>';",
  "      html += '<div>'+esc(fmtDuration(r.duration_ms))+'</div>';",
  "      html += '<div><span class=\"badge\">'+esc(r.mode||'-')+'</span></div>';",
  "      html += '<div>'+badgeForRun(r)+'</div>';",
  "      html += '<div><button class=\"replay\" data-action=\"'+esc(r.action_id)+'\" data-arg=\"'+esc(r.arg||'')+'\">↻ Re-ejecutar</button></div>';",
  "      html += '</div>';",
  "      var detail = '';",
  "      if(r.stdout_tail) detail += r.stdout_tail;",
  "      if(r.stderr_tail) detail += (detail?'\\n':'') + '[stderr]\\n' + r.stderr_tail;",
  "      if(detail) html += '<details class=\"history-detail-wrap\" style=\"margin-bottom:6px;\"><summary style=\"cursor:pointer;font-size:11px;color:var(--muted);margin-left:80px;\">ver tail de salida</summary><div class=\"history-detail\">'+esc(detail)+'</div></details>';",
  "    }",
  "    el('history-host').innerHTML = html;",
  "    var btns = el('history-host').querySelectorAll('.replay');",
  "    for(var j=0;j<btns.length;j++){ btns[j].addEventListener('click', function(ev){ var b=ev.currentTarget; var aid=b.getAttribute('data-action'); var arg=b.getAttribute('data-arg'); showSubtab('run'); execAction(aid, arg); }); }",
  "  }",
  "  function loadHistory(){",
  "    if(MODE !== 'live'){ el('history-host').innerHTML = '<p class=\"empty\">El historial solo esta disponible en modo live.</p>'; return; }",
  "    var fa = multiCsv('filter-action');",
  "    var fs = multiCsv('filter-status');",
  "    var fsi = (el('filter-since')||{}).value || '';",
  "    var fm = multiCsv('filter-mode');",
  "    var fsl = (el('filter-slow')||{}).value || '';",
  "    var qs = [];",
  "    if(fa) qs.push('action_id='+encodeURIComponent(fa));",
  "    if(fs) qs.push('status='+encodeURIComponent(fs));",
  "    if(fsi) qs.push('since='+encodeURIComponent(fsi));",
  "    if(fm) qs.push('mode='+encodeURIComponent(fm));",
  "    if(fsl) qs.push('slow='+encodeURIComponent(fsl));",
  "    qs.push('limit=100');",
  "    writeFiltersToUrl();",
  "    fetch('/api/action-runs?'+qs.join('&')).then(function(r){return r.json();}).then(function(rows){ renderHistory(rows); populateActionFilter(rows); var fc=el('filter-count'); if(fc) fc.textContent = rows.length + (rows.length===100 ? '+ ' : ' ') + 'runs'; }).catch(function(){ el('history-host').innerHTML = '<p class=\"empty\">No se pudo cargar /api/action-runs.</p>'; });",
  "  }",
  "  function populateActionFilter(rows){",
  "    var sel = el('filter-action'); if(!sel) return;",
  "    // v12.32: preservar valores seleccionados (multi-select) entre repobladas.",
  "    var cur = [];",
  "    if(sel.multiple){ for(var s=0;s<sel.selectedOptions.length;s++) cur.push(sel.selectedOptions[s].value); }",
  "    else if(sel.value) cur.push(sel.value);",
  "    var ids = {};",
  "    (rows||[]).forEach(function(r){ ids[r.action_id] = true; });",
  "    (ACTIONS_CACHE||[]).forEach(function(a){ ids[a.id] = true; });",
  "    var keys = Object.keys(ids).sort();",
  "    if(sel.options.length === keys.length) { /* re-marcar por si CSS o repintar */ }",
  "    var html = '';",
  "    if(!sel.multiple) html += '<option value=\"\">— todas —</option>';",
  "    for(var i=0;i<keys.length;i++){ var k=keys[i]; var sl = cur.indexOf(k)>=0 ? ' selected' : ''; html += '<option value=\"'+esc(k)+'\"'+sl+'>'+esc(k)+'</option>'; }",
  "    sel.innerHTML = html;",
  "  }",
  "  // v12.26: stats agregados por accion ----------------------------------",
  "  function renderStatsAgg(rows, trendRows){",
  "    if(!rows.length){ el('stats-host').innerHTML = '<p class=\"empty\">Sin datos todavia. Ejecuta acciones y vuelve.</p>'; return; }",
  "    var trendByAction = {};",
  "    (trendRows||[]).forEach(function(t){ trendByAction[t.action_id] = t.series; });",
  "    var totals = { runs:0, ok:0, fail:0, can:0 };",
  "    for(var i=0;i<rows.length;i++){ totals.runs+=rows[i].total||0; totals.ok+=rows[i].ok||0; totals.fail+=rows[i].fail||0; totals.can+=rows[i].cancelled||0; }",
  "    var overall = totals.runs > 0 ? (100 * totals.ok / totals.runs).toFixed(1)+'%' : '-';",
  "    var html = '<div class=\"stats-summary\">';",
  "    html += '<div class=\"stat\"><div class=\"stat-v\">'+totals.runs+'</div><div class=\"stat-l\">Total runs</div></div>';",
  "    html += '<div class=\"stat\"><div class=\"stat-v\" style=\"color:var(--ok)\">'+totals.ok+'</div><div class=\"stat-l\">Exitos</div></div>';",
  "    html += '<div class=\"stat\"><div class=\"stat-v\" style=\"color:#B91C1C\">'+totals.fail+'</div><div class=\"stat-l\">Fallos</div></div>';",
  "    html += '<div class=\"stat\"><div class=\"stat-v\">'+overall+'</div><div class=\"stat-l\">Success rate</div></div>';",
  "    html += '</div>';",
  "    html += '<table class=\"stats-table\"><thead><tr>';",
  "    html += '<th>Accion</th><th class=\"num\">Total</th><th class=\"num\">OK</th><th class=\"num\">Fail</th><th class=\"num\">Cancel</th><th class=\"num\">Avg</th><th class=\"num\">p50</th><th class=\"num\">p95</th><th class=\"num\">Min</th><th class=\"num\">Max</th><th class=\"num\">Success</th><th>Ultima</th><th class=\"sparkline-cell\">14d</th>';",
  "    html += '</tr></thead><tbody>';",
  "    for(var k=0;k<rows.length;k++){",
  "      var r = rows[k];",
  "      var rateClass = (r.success_rate>=95)?'ok':((r.success_rate>=70)?'':'fail');",
  "      var spark = sparklineSvg(trendByAction[r.action_id]);",
  "      html += '<tr>';",
  "      html += '<td class=\"action\">'+esc(r.action_id)+'</td>';",
  "      html += '<td class=\"num\">'+esc(r.total)+'</td>';",
  "      html += '<td class=\"num ok\">'+esc(r.ok)+'</td>';",
  "      html += '<td class=\"num fail\">'+esc(r.fail)+'</td>';",
  "      html += '<td class=\"num can\">'+esc(r.cancelled)+'</td>';",
  "      html += '<td class=\"num\">'+esc(fmtDuration(r.avg_ms))+'</td>';",
  "      html += '<td class=\"num\">'+esc(fmtDuration(r.p50_ms))+'</td>';",
  "      html += '<td class=\"num\">'+esc(fmtDuration(r.p95_ms))+'</td>';",
  "      html += '<td class=\"num\">'+esc(fmtDuration(r.min_ms))+'</td>';",
  "      html += '<td class=\"num\">'+esc(fmtDuration(r.max_ms))+'</td>';",
  "      html += '<td class=\"num '+rateClass+'\">'+(r.success_rate==null?'-':esc(r.success_rate)+'%')+'</td>';",
  "      html += '<td class=\"when\" title=\"'+esc(r.last_run||'')+'\">'+esc(fmtAgo(r.last_run))+'</td>';",
  "      html += '<td class=\"sparkline-cell\">'+spark+'</td>';",
  "      html += '</tr>';",
  "    }",
  "    html += '</tbody></table>';",
  "    el('stats-host').innerHTML = html;",
  "  }",
  "  // v12.29: Dashboard de tendencias ---------------------------------",
  "  function buildLineChart(series, opts){",
  "    var W = opts.width || 720, H = opts.height || 200;",
  "    var padL = 40, padR = 12, padT = 14, padB = 28;",
  "    var iw = W - padL - padR, ih = H - padT - padB;",
  "    var n = series.length;",
  "    if(!n) return '<p class=\"empty\">Sin datos en el periodo.</p>';",
  "    var xs = function(i){ return padL + (n === 1 ? iw/2 : (i * iw / (n - 1))); };",
  "    var ys = function(v){ return padT + ih - (v / 100) * ih; };",
  "    // Eje Y: lineas en 0/25/50/75/100",
  "    var grid = '';",
  "    [0, 25, 50, 75, 100].forEach(function(v){",
  "      var y = ys(v);",
  "      grid += '<line class=\"grid-line\" x1=\"'+padL+'\" x2=\"'+(W-padR)+'\" y1=\"'+y+'\" y2=\"'+y+'\"/>';",
  "      grid += '<text class=\"axis-label\" x=\"'+(padL-6)+'\" y=\"'+(y+3)+'\" text-anchor=\"end\">'+v+'%</text>';",
  "    });",
  "    // Path por puntos con success_rate != null. Los nulls rompen el path.",
  "    var path = ''; var pts = '';",
  "    var lastWasValid = false;",
  "    for(var i=0;i<n;i++){",
  "      var s = series[i];",
  "      if(s.success_rate == null){ lastWasValid = false; continue; }",
  "      var x = xs(i), y = ys(s.success_rate);",
  "      path += (lastWasValid ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';",
  "      pts += '<circle class=\"data-point\" cx=\"'+x.toFixed(1)+'\" cy=\"'+y.toFixed(1)+'\" r=\"2.5\"><title>'+esc(s.day)+': '+s.success_rate+'% ('+s.ok+'/'+s.total+')</title></circle>';",
  "      lastWasValid = true;",
  "    }",
  "    // Eje X: etiquetas en ~6 ticks",
  "    var step = Math.max(1, Math.floor(n / 6));",
  "    var xlab = '';",
  "    for(var k=0;k<n;k+=step){",
  "      var lx = xs(k); var ld = series[k].day.slice(5); // MM-DD",
  "      xlab += '<text class=\"axis-label\" x=\"'+lx+'\" y=\"'+(H-padB+14)+'\" text-anchor=\"middle\">'+esc(ld)+'</text>';",
  "    }",
  "    var axis = '<line class=\"axis-line\" x1=\"'+padL+'\" x2=\"'+(W-padR)+'\" y1=\"'+(padT+ih)+'\" y2=\"'+(padT+ih)+'\"/>';",
  "    axis += '<line class=\"axis-line\" x1=\"'+padL+'\" x2=\"'+padL+'\" y1=\"'+padT+'\" y2=\"'+(padT+ih)+'\"/>';",
  "    var line = path ? '<path class=\"data-line\" d=\"'+path.trim()+'\"/>' : '';",
  "    return '<svg class=\"chart-svg\" viewBox=\"0 0 '+W+' '+H+'\" preserveAspectRatio=\"xMidYMid meet\">'+grid+axis+line+pts+xlab+'</svg>';",
  "  }",
  "  function buildStackedBars(series, opts){",
  "    var W = opts.width || 720, H = opts.height || 180;",
  "    var padL = 40, padR = 12, padT = 14, padB = 28;",
  "    var iw = W - padL - padR, ih = H - padT - padB;",
  "    var n = series.length;",
  "    if(!n) return '<p class=\"empty\">Sin datos en el periodo.</p>';",
  "    var maxTotal = Math.max.apply(null, series.map(function(s){ return s.total||0; })) || 1;",
  "    var bw = Math.max(2, Math.floor(iw / n) - 1);",
  "    var bars = '';",
  "    for(var i=0;i<n;i++){",
  "      var s = series[i];",
  "      if(s.total === 0) continue;",
  "      var x = padL + i * (iw / n);",
  "      var hOk = s.ok > 0 ? (s.ok / maxTotal) * ih : 0;",
  "      var hFail = s.fail > 0 ? (s.fail / maxTotal) * ih : 0;",
  "      var hCancel = s.cancelled > 0 ? (s.cancelled / maxTotal) * ih : 0;",
  "      var yBase = padT + ih;",
  "      var tip = s.day+': '+s.total+' runs ('+s.ok+' ok / '+s.fail+' fail / '+s.cancelled+' cancel) · click para drill-down';",
  "      // v12.30: wrap del grupo de barras en <g> con data-day para drill-down al click.",
  "      bars += '<g class=\"bar-group\" data-day=\"'+esc(s.day)+'\" style=\"cursor:pointer\"><title>'+esc(tip)+'</title>';",
  "      if(hOk > 0){ yBase -= hOk; bars += '<rect class=\"bar-ok\" x=\"'+x.toFixed(1)+'\" y=\"'+yBase.toFixed(1)+'\" width=\"'+bw+'\" height=\"'+hOk.toFixed(1)+'\"/>'; }",
  "      if(hFail > 0){ yBase -= hFail; bars += '<rect class=\"bar-fail\" x=\"'+x.toFixed(1)+'\" y=\"'+yBase.toFixed(1)+'\" width=\"'+bw+'\" height=\"'+hFail.toFixed(1)+'\"/>'; }",
  "      if(hCancel > 0){ yBase -= hCancel; bars += '<rect class=\"bar-cancel\" x=\"'+x.toFixed(1)+'\" y=\"'+yBase.toFixed(1)+'\" width=\"'+bw+'\" height=\"'+hCancel.toFixed(1)+'\"/>'; }",
  "      bars += '</g>';",
  "    }",
  "    // Eje Y: 0 y max",
  "    var ylab = '<text class=\"axis-label\" x=\"'+(padL-6)+'\" y=\"'+(padT+ih+3)+'\" text-anchor=\"end\">0</text>';",
  "    ylab += '<text class=\"axis-label\" x=\"'+(padL-6)+'\" y=\"'+(padT+3)+'\" text-anchor=\"end\">'+maxTotal+'</text>';",
  "    var step = Math.max(1, Math.floor(n / 6));",
  "    var xlab = '';",
  "    for(var k=0;k<n;k+=step){",
  "      var lx = padL + k * (iw / n) + bw/2; var ld = series[k].day.slice(5);",
  "      xlab += '<text class=\"axis-label\" x=\"'+lx+'\" y=\"'+(H-padB+14)+'\" text-anchor=\"middle\">'+esc(ld)+'</text>';",
  "    }",
  "    var axis = '<line class=\"axis-line\" x1=\"'+padL+'\" x2=\"'+(W-padR)+'\" y1=\"'+(padT+ih)+'\" y2=\"'+(padT+ih)+'\"/>';",
  "    axis += '<line class=\"axis-line\" x1=\"'+padL+'\" x2=\"'+padL+'\" y1=\"'+padT+'\" y2=\"'+(padT+ih)+'\"/>';",
  "    return '<svg class=\"chart-svg\" viewBox=\"0 0 '+W+' '+H+'\" preserveAspectRatio=\"xMidYMid meet\">'+axis+ylab+bars+xlab+'</svg>';",
  "  }",
  "  function renderCompareBanner(c){",
  "    function deltaClass(v, inverse){",
  "      if(v == null) return 'flat';",
  "      if(Math.abs(v) < 0.1) return 'flat';",
  "      return (v > 0) === !inverse ? 'up' : 'down';",
  "    }",
  "    function fmtDelta(v, suffix){ if(v == null) return '—'; var sign = v > 0 ? '+' : ''; return sign+v+(suffix||''); }",
  "    var html = '<div class=\"compare-banner\">';",
  "    html += '<div class=\"compare-card\"><h4>Success rate</h4>';",
  "    html += '<div class=\"v\">'+(c.current.success_rate==null?'—':c.current.success_rate+'%')+'</div>';",
  "    html += '<div class=\"delta '+deltaClass(c.delta_success_pp, false)+'\">'+fmtDelta(c.delta_success_pp,' pp')+' vs anterior</div>';",
  "    html += '<div class=\"sub\">prev: '+(c.previous.success_rate==null?'—':c.previous.success_rate+'%')+'</div></div>';",
  "    html += '<div class=\"compare-card\"><h4>Volumen</h4>';",
  "    html += '<div class=\"v\">'+c.current.total+' runs</div>';",
  "    html += '<div class=\"delta '+deltaClass(c.delta_volume_pct, false)+'\">'+fmtDelta(c.delta_volume_pct,'%')+' vs anterior</div>';",
  "    html += '<div class=\"sub\">prev: '+c.previous.total+' runs</div></div>';",
  "    html += '<div class=\"compare-card\"><h4>Fallos</h4>';",
  "    html += '<div class=\"v\" style=\"color:#B91C1C\">'+c.current.fail+'</div>';",
  "    var failDelta = c.previous.fail > 0 ? +(100 * (c.current.fail - c.previous.fail) / c.previous.fail).toFixed(1) : null;",
  "    html += '<div class=\"delta '+deltaClass(failDelta, true)+'\">'+fmtDelta(failDelta,'%')+' vs anterior</div>';",
  "    html += '<div class=\"sub\">prev: '+c.previous.fail+' fallos</div></div>';",
  "    html += '</div>';",
  "    return html;",
  "  }",
  "  function renderTrendsDashboard(d, hostId){",
  "    hostId = hostId || 'trends-host';",
  "    var suffix = (hostId === 'trends-host') ? '' : '-b';",
  "    if(!d || !d.series || !d.series.length){ el(hostId).innerHTML = '<p class=\"empty\">Sin datos en el periodo seleccionado.</p>'; return; }",
  "    var html = '';",
  "    // v12.30: cabecera explicita del scope del banner (todas vs accion individual)",
  "    var scopeLabel = d.action_id ? ('comparando <strong>'+esc(d.action_id)+'</strong>') : '<strong>todas las acciones</strong> (agregado)';",
  "    html += '<div style=\"font-size:12px;color:var(--muted);margin-bottom:8px;\">'+scopeLabel+' · ventana actual: '+d.compare.current.window_days+'d · ventana previa: '+d.compare.previous.window_days+'d</div>';",
  "    html += renderCompareBanner(d.compare);",
  "    // v12.30: barra de export PNG (uno por chart).",
  "    html += '<div class=\"chart-wrap\"><div style=\"display:flex;justify-content:space-between;align-items:center;\"><h4>Success rate diario ('+d.days_window+' dias)'+(d.action_id?' · '+esc(d.action_id):'')+'</h4><button class=\"export-png\" data-target=\"chart-line'+suffix+'\" style=\"padding:4px 10px;font-size:11px;background:var(--brand-light);color:var(--brand-dark);border:1px solid var(--line);border-radius:4px;cursor:pointer;\">⬇ PNG</button></div>';",
  "    html += '<div id=\"chart-line'+suffix+'\">'+buildLineChart(d.series, { width: 720, height: 200 })+'</div>';",
  "    html += '<div class=\"chart-legend\"><span><span class=\"swatch\" style=\"background:#06B6D4\"></span>success_rate (%)</span><span class=\"sub\">eje Y: 0-100% · eje X: dia</span></div>';",
  "    html += '</div>';",
  "    html += '<div class=\"chart-wrap\"><div style=\"display:flex;justify-content:space-between;align-items:center;\"><h4>Volumen diario (stacked: ok/fail/cancel) · click en barra = drill-down</h4><button class=\"export-png\" data-target=\"chart-bars'+suffix+'\" style=\"padding:4px 10px;font-size:11px;background:var(--brand-light);color:var(--brand-dark);border:1px solid var(--line);border-radius:4px;cursor:pointer;\">⬇ PNG</button></div>';",
  "    html += '<div id=\"chart-bars'+suffix+'\">'+buildStackedBars(d.series, { width: 720, height: 180 })+'</div>';",
  "    html += '<div class=\"chart-legend\"><span><span class=\"swatch\" style=\"background:#10B981\"></span>ok</span><span><span class=\"swatch\" style=\"background:#DC2626\"></span>fail</span><span><span class=\"swatch\" style=\"background:#F59E0B\"></span>cancelled</span></div>';",
  "    html += '</div>';",
  "    if(d.top_actions && d.top_actions.length){",
  "      html += '<div class=\"chart-wrap\"><h4>Top '+d.top_actions.length+' acciones por volumen</h4>';",
  "      html += '<table class=\"stats-table\"><thead><tr><th>Accion</th><th class=\"num\">Runs</th><th class=\"num\">OK</th><th class=\"num\">Fail</th><th class=\"num\">Cancel</th><th class=\"num\">Success</th></tr></thead><tbody>';",
  "      d.top_actions.forEach(function(t){",
  "        var rc = (t.success_rate>=95)?'ok':((t.success_rate>=70)?'':'fail');",
  "        html += '<tr><td class=\"action\"><a style=\"cursor:pointer;color:var(--brand);text-decoration:underline;\" data-trend-action=\"'+esc(t.action_id)+'\">'+esc(t.action_id)+'</a></td><td class=\"num\">'+t.total+'</td><td class=\"num ok\">'+t.ok+'</td><td class=\"num fail\">'+t.fail+'</td><td class=\"num can\">'+t.cancelled+'</td><td class=\"num '+rc+'\">'+(t.success_rate==null?'—':t.success_rate+'%')+'</td></tr>';",
  "      });",
  "      html += '</tbody></table></div>';",
  "    }",
  "    el(hostId).innerHTML = html;",
  "    // v12.30: wire drill-down (click en barra del stacked) -> Historial filtrado por dia.",
  "    var groups = el(hostId).querySelectorAll('.bar-group');",
  "    for(var i=0;i<groups.length;i++){",
  "      groups[i].addEventListener('click', function(ev){",
  "        var day = ev.currentTarget.getAttribute('data-day');",
  "        var aid = d.action_id || ((el('trend-action')||{}).value || '');",
  "        // Setear filtros del Historial y abrirlo.",
  "        if(el('filter-action')) el('filter-action').value = aid;",
  "        if(el('filter-status')) el('filter-status').value = '';",
  "        if(el('filter-since')) el('filter-since').value = day;",
  "        showSubtab('history');",
  "      });",
  "    }",
  "    // v12.30: click en accion del top -> setear filtro de Tendencias y re-cargar.",
  "    var tops = el(hostId).querySelectorAll('[data-trend-action]');",
  "    for(var j=0;j<tops.length;j++){",
  "      tops[j].addEventListener('click', function(ev){ var aid = ev.currentTarget.getAttribute('data-trend-action'); var sel = el('trend-action'); if(sel){ sel.value = aid; sel.dispatchEvent(new Event('change')); } });",
  "    }",
  "    // v12.30: wire export PNG.",
  "    var pngs = el(hostId).querySelectorAll('.export-png');",
  "    for(var k=0;k<pngs.length;k++){",
  "      pngs[k].addEventListener('click', function(ev){ exportChartAsPng(ev.currentTarget.getAttribute('data-target'), d); });",
  "    }",
  "  }",
  "  // v12.30: convierte SVG a PNG via Canvas y dispara descarga.",
  "  function exportChartAsPng(targetId, dashboardData){",
  "    var container = el(targetId); if(!container) return;",
  "    var svg = container.querySelector('svg'); if(!svg) return;",
  "    // Serializar el SVG con declaracion XML.",
  "    var serializer = new XMLSerializer();",
  "    var svgStr = serializer.serializeToString(svg);",
  "    if(!svgStr.match(/^<svg[^>]+xmlns/)) svgStr = svgStr.replace(/^<svg/, '<svg xmlns=\"http://www.w3.org/2000/svg\"');",
  "    var blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });",
  "    var URLctor = window.URL || window.webkitURL;",
  "    var imgUrl = URLctor.createObjectURL(blob);",
  "    var img = new Image();",
  "    img.onload = function(){",
  "      var vb = svg.getAttribute('viewBox');",
  "      var W = vb ? Number(vb.split(/\\s+/)[2]) : svg.width.baseVal.value;",
  "      var H = vb ? Number(vb.split(/\\s+/)[3]) : svg.height.baseVal.value;",
  "      var scale = 2; // 2x para mejor calidad",
  "      var canvas = document.createElement('canvas'); canvas.width = W*scale; canvas.height = H*scale;",
  "      var ctx = canvas.getContext('2d');",
  "      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0,0,canvas.width,canvas.height);",
  "      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);",
  "      URLctor.revokeObjectURL(imgUrl);",
  "      canvas.toBlob(function(pngBlob){",
  "        if(!pngBlob) return;",
  "        var dlUrl = URLctor.createObjectURL(pngBlob);",
  "        var a = document.createElement('a');",
  "        var stamp = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);",
  "        var aid = (dashboardData && dashboardData.action_id) || 'all';",
  "        a.href = dlUrl; a.download = 'dashboard-'+aid+'-'+targetId+'-'+stamp+'.png';",
  "        document.body.appendChild(a); a.click(); document.body.removeChild(a);",
  "        setTimeout(function(){ URLctor.revokeObjectURL(dlUrl); }, 1000);",
  "      }, 'image/png');",
  "    };",
  "    img.onerror = function(){ alert('No se pudo exportar el SVG a PNG.'); URLctor.revokeObjectURL(imgUrl); };",
  "    img.src = imgUrl;",
  "  }",
  "  function loadTrends(){",
  "    if(MODE !== 'live'){ el('trends-host').innerHTML = '<p class=\"empty\">Tendencias solo en modo live.</p>'; return; }",
  "    var aid = (el('trend-action')||{}).value || '';",
  "    var aidB = (el('trend-action-b')||{}).value || '';",
  "    var days = (el('trend-days')||{}).value || '30';",
  "    var qs = 'days='+encodeURIComponent(days) + (aid ? '&action_id='+encodeURIComponent(aid) : '');",
  "    fetch('/api/action-runs/dashboard?'+qs).then(function(r){return r.json();}).then(function(d){ renderTrendsDashboard(d, 'trends-host'); }).catch(function(){ el('trends-host').innerHTML = '<p class=\"empty\">No se pudo cargar /api/action-runs/dashboard.</p>'; });",
  "    // v12.45 (C5): si hay una segunda accion seleccionada, fetch + render lado a lado.",
  "    var hostB = el('trends-host-b');",
  "    if(hostB){",
  "      if(aidB && aidB !== aid){",
  "        var qsB = 'days='+encodeURIComponent(days) + '&action_id='+encodeURIComponent(aidB);",
  "        hostB.innerHTML = '<p class=\"empty\">Cargando comparacion ('+esc(aidB)+')…</p>';",
  "        fetch('/api/action-runs/dashboard?'+qsB).then(function(r){return r.json();}).then(function(d){ renderTrendsDashboard(d, 'trends-host-b'); }).catch(function(){ hostB.innerHTML = '<p class=\"empty\">No se pudo cargar comparacion.</p>'; });",
  "      } else { hostB.innerHTML = ''; }",
  "    }",
  "    // v12.45 (C4): actualizar link de export Markdown.",
  "    var mdLink = el('trends-export-md'); if(mdLink){ mdLink.href = '/api/action-runs/dashboard?format=md&'+qs; }",
  "    // Autopopular el selector de accion con los ids del catalogo + historial.",
  "    var sel = el('trend-action'); var selB = el('trend-action-b');",
  "    if(sel && sel.options.length <= 1){",
  "      var ids = {}; (ACTIONS_CACHE||[]).forEach(function(a){ ids[a.id] = true; });",
  "      var html = '<option value=\"\">— todas (agregado) —</option>';",
  "      Object.keys(ids).sort().forEach(function(k){ html += '<option value=\"'+esc(k)+'\">'+esc(k)+'</option>'; });",
  "      var cur = sel.value; sel.innerHTML = html; if(cur) sel.value = cur;",
  "    }",
  "    if(selB && selB.options.length <= 1){",
  "      var ids2 = {}; (ACTIONS_CACHE||[]).forEach(function(a){ ids2[a.id] = true; });",
  "      var html2 = '<option value=\"\">— ninguna —</option>';",
  "      Object.keys(ids2).sort().forEach(function(k){ html2 += '<option value=\"'+esc(k)+'\">'+esc(k)+'</option>'; });",
  "      var cur2 = selB.value; selB.innerHTML = html2; if(cur2) selB.value = cur2;",
  "    }",
  "  }",
  "  function loadStats(){",
  "    if(MODE !== 'live'){ el('stats-host').innerHTML = '<p class=\"empty\">Stats solo en modo live.</p>'; return; }",
  "    Promise.all([",
  "      fetch('/api/action-runs/stats').then(function(r){return r.json();}),",
  "      fetch('/api/action-runs/trend?days=14').then(function(r){return r.json();}).catch(function(){return [];}),",
  "    ]).then(function(arr){ renderStatsAgg(arr[0], arr[1]); }).catch(function(){ el('stats-host').innerHTML = '<p class=\"empty\">No se pudo cargar /api/action-runs/stats.</p>'; });",
  "  }",
  "  // v12.28: sparkline SVG inline. Cada barra es 1 dia; altura proporcional a total runs",
  "  // y color por estado: verde si todos ok, rojo si hubo fail, amarillo si solo cancelled.",
  "  function sparklineSvg(series){",
  "    if(!series || !series.length) return '<span class=\"muted\">-</span>';",
  "    var w = 120, h = 22, bar = Math.max(2, Math.floor((w - series.length) / series.length));",
  "    var maxTotal = Math.max.apply(null, series.map(function(s){ return s.total||0; }));",
  "    if(maxTotal === 0) return '<span class=\"muted\">sin runs</span>';",
  "    var svg = '<svg class=\"sparkline\" width=\"'+w+'\" height=\"'+h+'\" viewBox=\"0 0 '+w+' '+h+'\">';",
  "    for(var i=0;i<series.length;i++){",
  "      var s = series[i];",
  "      var total = s.total||0;",
  "      var bh = total > 0 ? Math.max(2, Math.round((total / maxTotal) * (h - 2))) : 1;",
  "      var x = i * (bar + 1);",
  "      var y = h - bh;",
  "      var color = '#E5E7EB';",
  "      if(total > 0){",
  "        if(s.fail > 0) color = '#DC2626';",
  "        else if(s.cancelled > 0 && s.ok === 0) color = '#F59E0B';",
  "        else color = '#10B981';",
  "      }",
  "      var title = s.day+': '+total+' runs ('+s.ok+' ok / '+s.fail+' fail / '+s.cancelled+' cancel)';",
  "      svg += '<rect x=\"'+x+'\" y=\"'+y+'\" width=\"'+bar+'\" height=\"'+bh+'\" fill=\"'+color+'\"><title>'+esc(title)+'</title></rect>';",
  "    }",
  "    return svg + '</svg>';",
  "  }",
  "  function showSubtab(name){",
  "    var tabs = document.querySelectorAll('.subtab'); for(var i=0;i<tabs.length;i++) tabs[i].classList.toggle('active', tabs[i].dataset.subtab===name);",
  "    var panes = document.querySelectorAll('.subpane'); for(var j=0;j<panes.length;j++) panes[j].classList.toggle('active', panes[j].id===('subpane-'+name));",
  "    if(name==='history') loadHistory();",
  "    if(name==='stats') loadStats();",
  "    if(name==='trends') loadTrends();",
  "    // v12.32: persistir sub-tab activo en URL. 'run' es el default, no se escribe.",
  "    try {",
  "      var p = new URLSearchParams(window.location.search);",
  "      if(name && name !== 'run') p.set('act_subtab', name); else p.delete('act_subtab');",
  "      var qs = p.toString();",
  "      window.history.replaceState(null, '', window.location.pathname + (qs ? '?'+qs : '') + window.location.hash);",
  "    } catch {}",
  "  }",
  "  // v12.25: atajos de teclado para las acciones mas usadas",
  "  var SHORTCUTS = { 'KeyS':'sync-memory', 'KeyR':'memory-report', 'KeyE':'regenerate-context', 'KeyC':'check-trace-drift' };",
  "  document.addEventListener('keydown', function(ev){",
  "    if(ev.key === 'Escape'){ if(__execController) stopAction(); return; }",
  "    if(!(ev.ctrlKey && ev.shiftKey)) return;",
  "    if(ev.code === 'KeyH'){ ev.preventDefault(); showTab('actions'); showSubtab('history'); return; }",
  "    if(ev.code === 'KeyT'){ ev.preventDefault(); showTab('actions'); showSubtab('stats'); return; }",
  "    if(ev.code === 'KeyD'){ ev.preventDefault(); showTab('actions'); showSubtab('trends'); return; }",
  "    var aid = SHORTCUTS[ev.code]; if(!aid) return;",
  "    ev.preventDefault();",
  "    showTab('actions'); showSubtab('run');",
  "    if(MODE === 'live'){ if(!ACTIONS_CACHE) loadActions(); execAction(aid, ''); }",
  "  });",
  "  // v12.43: coverage-by-feature view en sub-tab de Trazabilidad.",
  "  // v12.45 (E3): cache local del payload + filtro display_status sin re-fetch.",
  "  var COVERAGE_CACHE = null;",
  "  function loadCoverageByFeature(){",
  "    if(MODE !== 'live'){ el('tab-trace-by-feature').innerHTML = '<p class=\"empty\">Solo disponible en modo live (memory-serve).</p>'; return; }",
  "    fetch('/api/coverage-by-feature').then(function(r){return r.json();}).then(function(data){ COVERAGE_CACHE = data; renderCoverageByFeature(data); }).catch(function(){ el('tab-trace-by-feature').innerHTML = '<p class=\"empty\">No se pudo cargar /api/coverage-by-feature.</p>'; });",
  "  }",
  "  function applyTraceDsFilter(){ if(COVERAGE_CACHE) renderCoverageByFeature(COVERAGE_CACHE); }",
  "  function renderCoverageByFeature(features){",
  "    var dsFilter = (el('trace-ds-filter')||{}).value || '';",
  "    if(!features || !features.length){ el('tab-trace-by-feature').innerHTML = '<p class=\"empty\">Sin trace links registrados.</p>'; return; }",
  "    var html = '';",
  "    for(var i=0;i<features.length;i++){",
  "      var f = features[i];",
  "      html += '<div class=\"feature-card\">';",
  "      html += '<h3>'+esc(f.feature)+'</h3>';",
  "      html += '<div class=\"feature-meta\">'+f.source_count+' RF/RNF · '+f.links+' trace links · sources: '+f.sources.map(esc).join(', ')+'</div>';",
  "      // Status breakdown como pills.",
  "      html += '<div>';",
  "      for(var st in f.status_breakdown){",
  "        var cls = (st && st !== '(null)') ? st : '';",
  "        html += '<span class=\"status-pill '+esc(cls)+'\">'+esc(st)+': '+f.status_breakdown[st]+'</span>';",
  "      }",
  "      html += '</div>';",
  "      // Targets agrupados por tipo.",
  "      var typeOrder = ['hu','spdd','prototipo','api','bd','codigo','test','estado'];",
  "      var seenTypes = {};",
  "      for(var ti=0; ti<typeOrder.length; ti++){",
  "        var t = typeOrder[ti];",
  "        if(!f.targets_by_type[t]) continue;",
  "        seenTypes[t] = true;",
  "        var visible = f.targets_by_type[t].filter(function(lk){ return !dsFilter || (lk.display_status||'') === dsFilter; });",
  "        if(!visible.length) continue;",
  "        html += '<div class=\"target-group\"><div class=\"gtitle\">'+esc(t)+' ('+visible.length+(dsFilter?' / '+f.targets_by_type[t].length:'')+')</div><ul>';",
  "        for(var k=0; k<visible.length; k++){",
  "          var lk = visible[k];",
  "          html += '<li><strong>'+esc(lk.source_ref)+'</strong> → '+esc(lk.target_ref)+' <span class=\"status-pill '+esc(lk.display_status||'')+'\">'+esc(lk.display_status||'-')+'</span>';",
  "          if(lk.evidence_ref){ html += ' <span class=\"ev\">'+esc(lk.evidence_ref)+'</span>'; html += ' <a href=\"#\" class=\"ev-git\" data-ev=\"'+esc(lk.evidence_ref)+'\" title=\"Ver historial git del archivo\">[git]</a>'; }",
  "          html += '</li>';",
  "        }",
  "        html += '</ul></div>';",
  "      }",
  "      for(var ot in f.targets_by_type){",
  "        if(seenTypes[ot]) continue;",
  "        html += '<div class=\"target-group\"><div class=\"gtitle\">'+esc(ot)+' ('+f.targets_by_type[ot].length+')</div></div>';",
  "      }",
  "      html += '</div>';",
  "    }",
  "    el('tab-trace-by-feature').innerHTML = html;",
  "    // v12.45 (F2): wire drill-down git history en links de evidencia.",
  "    var gitLinks = el('tab-trace-by-feature').querySelectorAll('.ev-git');",
  "    for(var gi=0; gi<gitLinks.length; gi++){",
  "      gitLinks[gi].addEventListener('click', function(ev){",
  "        ev.preventDefault();",
  "        var path = ev.currentTarget.getAttribute('data-ev');",
  "        if(!path) return;",
  "        var cleanPath = path.split(/[\\s:]/)[0];",
  "        fetch('/api/file-git-history?path='+encodeURIComponent(cleanPath)+'&limit=10').then(function(r){return r.json();}).then(function(d){",
  "          var lines = ['Historial git de '+cleanPath+':',''];",
  "          if(d.error){ lines.push('Error: '+d.error); }",
  "          else if(!d.commits || !d.commits.length){ lines.push('(sin commits)'); }",
  "          else { d.commits.forEach(function(c){ lines.push(c.sha+'  '+c.date+'  '+(c.author||'?')+'  '+c.subject); }); }",
  "          alert(lines.join('\\n'));",
  "        }).catch(function(err){ alert('No se pudo cargar el git history: '+err); });",
  "      });",
  "    }",
  "  }",
  "  function showTraceSub(name){",
  "    var subs = document.querySelectorAll('[data-trace-sub]'); for(var i=0;i<subs.length;i++) subs[i].classList.toggle('active', subs[i].dataset.traceSub===name);",
  "    var panes = document.querySelectorAll('#pane-trace .subpane'); for(var j=0;j<panes.length;j++) panes[j].classList.toggle('active', panes[j].id===('trace-sub-'+name));",
  "    if(name==='by-feature') loadCoverageByFeature();",
  "  }",
  "  // v12.70: visor de proyecto (pestana Proyecto).",
  "  var FILES_TREE = null;",
  "  var CURRENT_FILE = null;",
  "  // v12.74: resuelve un href relativo contra el directorio del archivo actual.",
  "  function resolveRel(base, href){ href=(href||'').split('#')[0].split('?')[0]; if(!href) return null; var baseDir = base && base.indexOf('/')>=0 ? base.replace(/\\/[^/]*$/,'') : ''; var parts = baseDir ? baseDir.split('/') : []; var hp = href.split('/'); for(var i=0;i<hp.length;i++){ var s=hp[i]; if(s===''||s==='.') continue; if(s==='..') parts.pop(); else parts.push(s); } return parts.join('/'); }",
  "  function loadFilesTree(){",
  "    if(MODE !== 'live'){ el('files-tree').innerHTML = '<p class=\"empty\">El visor solo esta disponible en modo live (npm run memory:serve).</p>'; return; }",
  "    el('files-tree').innerHTML = '<p class=\"empty\">Cargando arbol…</p>';",
  "    fetch('/api/files/tree').then(function(r){return r.json();}).then(function(t){ FILES_TREE = t; renderFilesTree(); }).catch(function(){ el('files-tree').innerHTML='<p class=\"empty\">No se pudo cargar /api/files/tree.</p>'; });",
  "  }",
  "  function ficon(name){ var e=(name.split('.').pop()||'').toLowerCase(); if(e==='md')return '📄'; if(e==='js'||e==='mjs'||e==='ts')return '🟨'; if(e==='json')return '🔧'; if(e==='html')return '🌐'; if(e==='css')return '🎨'; if(['png','jpg','jpeg','gif','webp','svg','ico','bmp'].indexOf(e)>=0)return '🖼'; return '📃'; }",
  "  function renderFilesTree(){",
  "    if(!FILES_TREE){ return; }",
  "    var filter = ((el('files-filter') && el('files-filter').value) || '').toLowerCase();",
  "    function node(n){",
  "      if(n.type==='dir'){",
  "        var kids = (n.children||[]).map(node).filter(Boolean);",
  "        if(filter && kids.length===0 && n.name.toLowerCase().indexOf(filter)<0) return '';",
  "        var open = filter ? ' open' : '';",
  "        return '<details class=\"ftree-dir\"'+open+'><summary>📁 '+esc(n.name)+'</summary><div class=\"ftree-children\">'+kids.join('')+'</div></details>';",
  "      }",
  "      if(filter && n.name.toLowerCase().indexOf(filter)<0) return '';",
  "      return '<div class=\"ftree-file\" data-fpath=\"'+esc(n.path)+'\" title=\"'+esc(n.path)+'\">'+ficon(n.name)+' '+esc(n.name)+'</div>';",
  "    }",
  "    var html = (FILES_TREE.children||[]).map(node).filter(Boolean).join('');",
  "    if(FILES_TREE.truncated) html += '<p class=\"empty\">(arbol truncado: demasiados archivos)</p>';",
  "    el('files-tree').innerHTML = html || '<p class=\"empty\">Sin coincidencias.</p>';",
  "    var files = el('files-tree').querySelectorAll('[data-fpath]');",
  "    for(var i=0;i<files.length;i++){ files[i].addEventListener('click', function(ev){ var p=ev.currentTarget.getAttribute('data-fpath'); var prev=el('files-tree').querySelector('.ftree-file.sel'); if(prev) prev.classList.remove('sel'); ev.currentTarget.classList.add('sel'); openFile(p); }); }",
  "  }",
  "  function openFile(p){",
  "    el('files-viewer').innerHTML = '<p class=\"empty\">Cargando '+esc(p)+'…</p>';",
  "    fetch('/api/files/read?path='+encodeURIComponent(p)).then(function(r){return r.json();}).then(function(d){ renderFileContent(d); }).catch(function(){ el('files-viewer').innerHTML='<p class=\"empty\">No se pudo leer el archivo.</p>'; });",
  "  }",
  "  function gutterHtml(lineHtmlArr){ var o=''; for(var i=0;i<lineHtmlArr.length;i++){ o+='<div class=\"fview-line\"><span class=\"fview-ln\">'+(i+1)+'</span><span class=\"fview-code\">'+lineHtmlArr[i]+'</span></div>'; } return o; }",
  "  function gutterRaw(text){ var ls=(text||'').split('\\n'); var a=[]; for(var i=0;i<ls.length;i++) a.push(esc(ls[i])); return gutterHtml(a); }",
  "  function renderFileContent(d){",
  "    var v=el('files-viewer');",
  "    if(d.path) CURRENT_FILE = d.path;",
  "    if(d.error){ v.innerHTML = '<p class=\"empty\">'+esc(d.error)+'</p>'; return; }",
  "    var kb = (d.size/1024).toFixed(1);",
  "    var head = '<div class=\"fview-head\"><code>'+esc(d.path)+'</code> <span class=\"muted\">· '+kb+' KB · '+esc(d.ext||'')+'</span><span class=\"fview-tools\"></span></div>';",
  "    if(d.kind==='image'){ v.innerHTML = head + '<div class=\"fview-img\"><img src=\"'+d.dataUrl+'\" alt=\"'+esc(d.path)+'\"/></div>'; return; }",
  "    if(d.kind==='binary'){ v.innerHTML = head + '<p class=\"empty\">Archivo binario — no se puede mostrar como texto.</p>'; return; }",
  "    if(d.kind==='too-large'){ v.innerHTML = head + '<p class=\"empty\">Archivo demasiado grande para previsualizar.</p>'; return; }",
  "    if(d.kind==='markdown'){ v.innerHTML = head + '<div class=\"fview-body\"><div class=\"md-body\">'+d.html+'</div></div>'; addViewerTools(d); return; }",
  "    v.innerHTML = head + '<div class=\"fview-body\"><div class=\"fview-pre\">'+gutterHtml(d.lines||[])+'</div></div>';",
  "    addViewerTools(d);",
  "  }",
  "  function addViewerTools(d){",
  "    var v=el('files-viewer'); var tools=v.querySelector('.fview-tools'); if(!tools) return;",
  "    var body=v.querySelector('.fview-body'); var defaultHTML = body ? body.innerHTML : '';",
  "    var btns='';",
  "    if(d.kind==='markdown') btns+='<button data-valt>Fuente</button>';",
  "    if(d.kind==='html') btns+='<button data-valt>Vista</button>';",
  "    btns+='<button data-vcopy>Copiar</button>';",
  "    tools.innerHTML=btns;",
  "    var showingAlt=false; var alt=tools.querySelector('[data-valt]');",
  "    if(alt) alt.addEventListener('click', function(){ showingAlt=!showingAlt; if(!showingAlt){ body.innerHTML=defaultHTML; alt.textContent=(d.kind==='html'?'Vista':'Fuente'); return; } if(d.kind==='html'){ alt.textContent='Fuente'; body.innerHTML=''; var f=document.createElement('iframe'); f.className='fview-frame'; f.setAttribute('sandbox','allow-scripts allow-same-origin'); body.appendChild(f); f.srcdoc=d.content; } else { alt.textContent='Vista'; body.innerHTML='<div class=\"fview-pre\">'+gutterRaw(d.content)+'</div>'; } });",
  "    var cp=tools.querySelector('[data-vcopy]'); if(cp) cp.addEventListener('click', function(){ if(navigator.clipboard){ navigator.clipboard.writeText(d.content||''); cp.textContent='Copiado'; setTimeout(function(){cp.textContent='Copiar';},1200); } });",
  "  }",
  "  // v12.80: panel multiagente (locks claim/release + tablero).",
  "  function agentId(){ return (el('agent-id') && el('agent-id').value.trim()) || ''; }",
  "  function loadAgents(){",
  "    if(MODE !== 'live'){ el('agents-host').innerHTML = '<p class=\"empty\">El multiagente solo esta disponible en modo live (npm run memory:serve).</p>'; return; }",
  "    var saved = localStorage.getItem('spdd-agent-id'); if(saved && el('agent-id') && !el('agent-id').value) el('agent-id').value = saved;",
  "    el('agents-host').innerHTML = '<p class=\"empty\">Cargando tablero…</p>';",
  "    fetch('/api/locks').then(function(r){return r.json();}).then(function(d){ renderAgents(d); }).catch(function(){ el('agents-host').innerHTML='<p class=\"empty\">No se pudo cargar /api/locks.</p>'; });",
  "  }",
  "  function renderAgents(d){",
  "    if(d.error){ el('agents-host').innerHTML = '<p class=\"empty\">'+esc(d.error)+'</p>'; return; }",
  "    var rows = d.rows||[];",
  "    var html = '<table class=\"agent-board\"><thead><tr><th>Feature</th><th>Prototipo</th><th>Lock</th><th>Expira</th><th>Accion</th></tr></thead><tbody>';",
  "    rows.forEach(function(f){",
  "      var lk = f.lock;",
  "      var active = lk && !lk.expired;",
  "      var lockTxt = active ? ('🔒 '+esc(lk.agent)) : (lk && lk.expired ? '⏰ expirado ('+esc(lk.agent)+')' : '— libre');",
  "      var exp = active ? esc(String(lk.expires_at).slice(0,16).replace('T',' ')) : '—';",
  "      var act = active ? ('<button data-release=\"'+esc(f.slug)+'\">Liberar</button>') : ('<button data-claim=\"'+esc(f.slug)+'\">Reclamar</button>');",
  "      html += '<tr><td><code>'+esc(f.slug)+'</code></td><td>'+esc(f.prototype_state||'—')+'</td><td>'+lockTxt+'</td><td>'+exp+'</td><td>'+act+'</td></tr>';",
  "    });",
  "    html += '</tbody></table>';",
  "    var expired = (d.locks||[]).filter(function(l){return l.expired;});",
  "    if(expired.length) html += '<p class=\"agent-warn\">⏰ '+expired.length+' lock(s) expirados — usa “Purgar expirados”.</p>';",
  "    el('agents-host').innerHTML = html;",
  "    el('agents-host').querySelectorAll('[data-claim]').forEach(function(b){ b.addEventListener('click', function(e){ doClaim(e.currentTarget.getAttribute('data-claim')); }); });",
  "    el('agents-host').querySelectorAll('[data-release]').forEach(function(b){ b.addEventListener('click', function(e){ doRelease(e.currentTarget.getAttribute('data-release')); }); });",
  "  }",
  "  function postLocks(path, payload){ return fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(function(r){return r.json().then(function(j){return {status:r.status, j:j};});}); }",
  "  function doClaim(feature){",
  "    var a = agentId(); if(!a){ alert('Escribe tu nombre de agente arriba (campo Agente).'); return; }",
  "    localStorage.setItem('spdd-agent-id', a);",
  "    postLocks('/api/locks/claim', { feature:feature, agent:a }).then(function(res){ if(!res.j.ok){ alert('No se pudo reclamar: '+(res.j.error||res.status)); } loadAgents(); });",
  "  }",
  "  function doRelease(feature){",
  "    var a = agentId();",
  "    postLocks('/api/locks/release', { feature:feature, agent:a||undefined }).then(function(res){ if(!res.j.ok){ if(confirm((res.j.error||'No se pudo liberar')+'\\n\\n¿Forzar liberacion?')){ postLocks('/api/locks/release',{feature:feature, force:true}).then(function(){ loadAgents(); }); return; } } loadAgents(); });",
  "  }",
  "  function showTab(name){",
  "    var tabs = document.querySelectorAll('.tab'); for(var i=0;i<tabs.length;i++) tabs[i].classList.toggle('active', tabs[i].dataset.tab===name);",
  "    var panes = document.querySelectorAll('.pane'); for(var j=0;j<panes.length;j++) panes[j].classList.toggle('active', panes[j].id===('pane-'+name));",
  "    if(name==='actions' && !ACTIONS_CACHE) loadActions();",
  "    if(name==='roadmap') loadRoadmap();",
  "    if(name==='files' && !FILES_TREE) loadFilesTree();",
  "    if(name==='agents') loadAgents();",
  "  }",
  "  // v12.54: Roadmap pane. Carga estado de las 9 fases + comandos recientes + sugeridos.",
  "  var ROADMAP_STATE = null;",
  "  function loadRoadmap(){",
  "    if(MODE !== 'live'){ el('roadmap-host').innerHTML = '<p class=\"empty\">Roadmap solo disponible en modo live (memory-serve). Arranca con: <code>npm run memory:serve</code></p>'; return; }",
  "    el('roadmap-host').innerHTML = '<p class=\"empty\">Cargando estado del roadmap…</p>';",
  "    Promise.all([",
  "      fetch('/api/roadmap/status').then(function(r){return r.json();}),",
  "      fetch('/api/roadmap/next').then(function(r){return r.json();}).catch(function(){return null;})",
  "    ]).then(function(arr){ ROADMAP_STATE = { status: arr[0], next: arr[1] }; renderRoadmap(); })",
  "    .catch(function(){ el('roadmap-host').innerHTML = '<p class=\"empty\">No se pudo cargar /api/roadmap/status. Verifica que scripts/roadmap-status.mjs existe (corre: npm run template:upgrade -- --apply).</p>'; });",
  "  }",
  "  function renderRoadmap(){",
  "    var st = ROADMAP_STATE.status;",
  "    if(st.error){ el('roadmap-host').innerHTML = '<p class=\"empty\">Error: '+esc(st.error)+'</p>'; return; }",
  "    var html = '';",
  "    // Cabecera con proyecto + version + features.",
  "    html += '<div class=\"roadmap-section\"><h4>Proyecto · ' + esc(st.project||'-') + ' · template ' + esc(st.templateVersion||'-') + ' · ' + (st.features?st.features.length:0) + ' features</h4></div>';",
  "    // Grid de fases.",
  "    html += '<div class=\"roadmap-grid\">';",
  "    (st.phases||[]).forEach(function(p){",
  "      var icon = p.status==='complete'?'✓':(p.status==='partial'?'⚠':'⊘');",
  "      var label = p.status==='complete'?'COMPLETA':(p.status==='partial'?'PARCIAL':'NO INICIADA');",
  "      html += '<div class=\"phase-card '+esc(p.status)+'\" data-phase=\"'+p.id+'\">';",
  "      html += '<div class=\"phase-num\">Fase '+p.id+'</div>';",
  "      html += '<div class=\"phase-name\">'+esc(p.name)+'</div>';",
  "      html += '<div class=\"phase-status '+esc(p.status)+'\">'+icon+' '+label+'</div>';",
  "      html += '<div class=\"phase-detail\">'+esc(p.detail)+'</div>';",
  "      html += '</div>';",
  "    });",
  "    html += '</div>';",
  "    // v12.62: semaforo de estado visual de prototipos (5 peldaños).",
  "    var ps = st.prototypeStates;",
  "    if(ps && ps.withPrototype > 0){",
  "      var advanceColor = ps.phase2to3Ready ? '#16A34A' : '#D97706';",
  "      html += '<div class=\"roadmap-section\" style=\"border-left:4px solid '+advanceColor+'\">';",
  "      html += '<h4>🚦 Estado visual de prototipos (fase 2) <span style=\"background:'+advanceColor+';color:#fff;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px\">'+(ps.phase2to3Ready?'avance 2→3 OK':'2→3 bloqueado')+'</span></h4>';",
  "      var c = ps.counts || {};",
  "      var ladder = [['exists','#DC2626'],['auto-quality','#DC2626'],['visible-product','#D97706'],['human-review-pending','#D97706'],['human-approved','#16A34A']];",
  "      html += '<div class=\"proto-ladder\">';",
  "      ladder.forEach(function(rung){ var n=c[rung[0]]||0; html += '<div class=\"proto-rung\" style=\"opacity:'+(n>0?1:0.4)+'\"><span class=\"proto-rung-dot\" style=\"background:'+rung[1]+'\"></span><span class=\"proto-rung-label\">'+rung[0]+'</span><span class=\"proto-rung-count\">'+n+'</span></div>'; });",
  "      html += '</div>';",
  "      html += '<div class=\"proto-feature-list\">';",
  "      (ps.features||[]).forEach(function(f){",
  "        if(f.state==='none') return;",
  "        var dot = f.light==='green'?'🟢':(f.light==='amber'?'🟡':'🔴');",
  "        html += '<div class=\"proto-feature-row\"><span>'+dot+'</span><code>'+esc(f.slug)+'</code><span class=\"proto-feature-state\">'+esc(f.state)+'</span><span class=\"proto-feature-note\">'+esc(f.blockedBy||f.reviewer||'')+'</span></div>';",
  "      });",
  "      html += '</div>';",
  "      if(!ps.phase2to3Ready && ps.phase2to3Blockers && ps.phase2to3Blockers.length){",
  "        html += '<div class=\"proto-advance-warn\">⚠ Avance fase 2 → 3 BLOQUEADO: '+ps.phase2to3Blockers.length+' prototipo(s) sin revision visual humana aprobada. Un humano real debe firmar <code>## Revision visual humana</code> con Resultado: approved.</div>';",
  "      } else {",
  "        html += '<div class=\"proto-advance-ok\">✓ Todos los prototipos estan human-approved. La fase 2 puede avanzar a fase 3.</div>';",
  "      }",
  "      html += '</div>';",
  "    }",
  "    // v12.56: tarjeta de Next Action (roadmap:next) prominente.",
  "    var nx = ROADMAP_STATE.next;",
  "    if(nx && !nx.error){",
  "      var readinessColor = nx.agent_readiness === 'ready_for_ai' ? '#16A34A' : (nx.agent_readiness === 'needs_human' ? '#D97706' : '#DC2626');",
  "      html += '<div class=\"roadmap-section\" style=\"border-left:4px solid '+readinessColor+'\">';",
  "      html += '<h4>→ Siguiente accion segura para el agente <span style=\"background:'+readinessColor+';color:#fff;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px\">'+esc(nx.agent_readiness)+'</span></h4>';",
  "      html += '<div style=\"font-size:14px;font-weight:600;color:var(--accent);margin-bottom:6px\">'+esc(nx.next_action)+'</div>';",
  "      if(nx.feature) html += '<div style=\"font-size:11px;color:var(--muted);margin-bottom:8px\">Feature target: <code>'+esc(nx.feature)+'</code> · Fase '+nx.phase+'</div>';",
  "      if(nx.allowed_actions && nx.allowed_actions.length){",
  "        html += '<div style=\"margin-top:8px\"><strong style=\"font-size:11px;color:#16A34A\">✓ Puedes hacer:</strong><ul style=\"margin:4px 0 4px 20px;font-size:11.5px\">';",
  "        nx.allowed_actions.slice(0,5).forEach(function(a){ html += '<li>'+esc(a)+'</li>'; });",
  "        html += '</ul></div>';",
  "      }",
  "      if(nx.forbidden_actions && nx.forbidden_actions.length){",
  "        html += '<div style=\"margin-top:6px\"><strong style=\"font-size:11px;color:#DC2626\">✗ NO puedes hacer:</strong><ul style=\"margin:4px 0 4px 20px;font-size:11.5px;color:var(--muted)\">';",
  "        nx.forbidden_actions.slice(0,3).forEach(function(a){ html += '<li>'+esc(a)+'</li>'; });",
  "        html += '</ul></div>';",
  "      }",
  "      if(nx.must_read && nx.must_read.length){",
  "        html += '<div style=\"margin-top:6px\"><strong style=\"font-size:11px\">📖 Lee primero:</strong><ul style=\"margin:4px 0 4px 20px;font-size:11.5px;font-family:var(--mono)\">';",
  "        nx.must_read.slice(0,4).forEach(function(r){ html += '<li>'+esc(r)+'</li>'; });",
  "        html += '</ul></div>';",
  "      }",
  "      if(nx.commands_to_run && nx.commands_to_run.length){",
  "        html += '<div style=\"margin-top:6px\"><strong style=\"font-size:11px\">$ Comandos sugeridos (en orden):</strong><pre style=\"background:#0F172A;color:#E2E8F0;padding:8px 12px;border-radius:4px;font-size:11px;margin-top:4px;overflow-x:auto\">';",
  "        nx.commands_to_run.forEach(function(c){ html += esc(c)+'\\n'; });",
  "        html += '</pre></div>';",
  "      }",
  "      html += '</div>';",
  "    }",
  "    // Bloqueadores.",
  "    if(st.blockers && st.blockers.length){",
  "      html += '<div class=\"roadmap-section\"><h4>⚠ Bloqueadores activos ('+st.blockers.length+')</h4>';",
  "      st.blockers.forEach(function(b){ html += '<div class=\"blocker-item\">'+esc(b)+'</div>'; });",
  "      html += '</div>';",
  "    }",
  "    // Siguiente accion recomendada.",
  "    if(st.nextAction && st.nextAction.length){",
  "      html += '<div class=\"roadmap-section\"><h4>→ Siguiente accion recomendada</h4>';",
  "      st.nextAction.forEach(function(a){ html += '<div class=\"next-action\">'+esc(a)+'</div>'; });",
  "      html += '</div>';",
  "    }",
  "    // v12.70: los comandos universales + el historial de ejecuciones viven en la",
  "    // pestana Acciones (Ejecutar / Historial). Aqui solo dejamos un acceso directo.",
  "    html += '<div class=\"roadmap-section\"><h4>🛠 Comandos y ejecucion</h4><p class=\"empty\">Ejecuta cualquier comando del catalogo y revisa el historial de ejecuciones en la pestana <a data-goto-actions style=\"cursor:pointer;color:var(--accent);text-decoration:underline;font-weight:600\">Acciones</a> (subpestanas Ejecutar e Historial).</p></div>';",
  "    el('roadmap-host').innerHTML = html;",
  "    // Click handlers.",
  "    var ga = el('roadmap-host').querySelector('[data-goto-actions]'); if(ga) ga.addEventListener('click', function(){ showTab('actions'); showSubtab('run'); });",
  "    document.querySelectorAll('.phase-card').forEach(function(c){ c.addEventListener('click', function(){ document.querySelectorAll('.phase-card').forEach(function(x){x.classList.remove('selected')}); c.classList.add('selected'); var pid = c.getAttribute('data-phase'); if(pid !== null) loadPhaseContract(pid); }); });",
  "  }",
  "  // v12.58/v12.59: cargar contrato + status de ejecucion (cruce con BD ai_action_runs).",
  "  function loadPhaseContract(phaseId){",
  "    Promise.all([",
  "      fetch('/api/roadmap/contract/' + phaseId).then(function(r){return r.json();}),",
  "      fetch('/api/roadmap/contract-status/' + phaseId).then(function(r){return r.json();}).catch(function(){return null;})",
  "    ]).then(function(arr){ renderPhaseContract(arr[0], arr[1]); }).catch(function(){ var pc=el('phase-contract-panel'); if(pc) pc.innerHTML='<p class=\"empty\">No se pudo cargar el contrato.</p>'; });",
  "  }",
  "  function renderPhaseContract(c, statusData){",
  "    var panel = el('phase-contract-panel');",
  "    if(!panel) return;",
  "    if(c.error){ panel.innerHTML = '<p class=\"empty\">'+esc(c.error)+'</p>'; return; }",
  "    // Mapa comando -> estado de ejecucion (passed/failed/never) desde la BD.",
  "    var execMap = {};",
  "    if(statusData && statusData.validations){ statusData.validations.forEach(function(v){ execMap[v.command] = v; }); }",
  "    var html = '<div class=\"contract-card\">';",
  "    html += '<div class=\"contract-head\"><strong>Contrato de ejecucion — Fase '+c.id+'</strong> <span class=\"contract-name\">'+esc(c.name)+'</span></div>';",
  "    html += '<div class=\"contract-objective\">'+esc(c.objective)+'</div>';",
  "    function sect(icon,title,items,cls){",
  "      var h = '<div class=\"contract-section '+cls+'\"><h5>'+icon+' '+title+'</h5><ul>';",
  "      (items||[]).forEach(function(it){ h += '<li>'+esc(it)+'</li>'; });",
  "      return h + '</ul></div>';",
  "    }",
  "    // v12.59: seccion 'Debe validar' con check de ejecucion desde la BD inteligente.",
  "    function sectValidate(items){",
  "      var legendTitle = 'El estado viene de la BD ai_action_runs: solo se registran corridas via el panel (Acciones), el agente, npm run validate o el git hook. Las corridas sueltas en terminal (npm run check:all) NO se registran.';",
  "      var h = '<div class=\"contract-section validate\"><h5>🔍 Debe validar <span class=\"exec-legend\" title=\"'+esc(legendTitle)+'\">(✓ registrado · ◦ sin registro · ⚠ fallo) ⓘ</span></h5><ul>';",
  "      (items||[]).forEach(function(it){",
  "        var v = execMap[it];",
  "        var badge = '';",
  "        if(v){",
  "          if(v.status==='passed'){ badge = '<span class=\"exec-badge ok\" title=\"ultima corrida registrada OK: '+esc(v.last_run||'')+'\">✓ registrado</span>'; }",
  "          else if(v.status==='failed'){ badge = '<span class=\"exec-badge fail\" title=\"exit '+v.last_exit_code+' en la ultima corrida registrada\">⚠ fallo (exit '+v.last_exit_code+')</span>'; }",
  "          else { badge = '<span class=\"exec-badge never\" title=\"sin corridas registradas (puede haberse ejecutado en terminal sin registrarse)\">◦ sin registro</span>'; }",
  "        } else { badge = '<span class=\"exec-badge never\" title=\"sin corridas registradas (puede haberse ejecutado en terminal sin registrarse)\">◦ sin registro</span>'; }",
  "        h += '<li>'+esc(it)+' '+badge+'</li>';",
  "      });",
  "      return h + '</ul></div>';",
  "    }",
  "    html += '<div class=\"contract-grid\">';",
  "    html += sect('✓','Puede hacer', c.puede, 'allowed');",
  "    html += sect('✗','NO puede hacer', c.noPuede, 'forbidden');",
  "    html += sect('📖','Debe leer', c.debeLeer, 'read');",
  "    html += sect('✏','Debe actualizar', c.debeActualizar, 'update');",
  "    html += sectValidate(c.debeValidar);",
  "    html += sect('📤','Debe entregar', c.debeEntregar, 'deliver');",
  "    html += '</div>';",
  "    if(statusData && statusData.summary){ html += '<div class=\"contract-exec-summary\">Corridas registradas: <strong>'+statusData.summary.passed+'/'+statusData.summary.total+'</strong> OK · '+statusData.summary.never+' sin registro <span title=\"registro = panel/agente/npm run validate/git hook; las corridas en terminal no cuentan\">ⓘ</span> (BD ai_action_runs)</div>'; }",
  "    if(c.gates && c.gates.length){ html += '<div class=\"contract-gates\"><strong>Gates de la fase:</strong> '+c.gates.map(function(g){return '<code>'+esc(g)+'</code>'}).join(', ')+'</div>'; }",
  "    html += '</div>';",
  "    panel.innerHTML = html;",
  "    panel.scrollIntoView({behavior:'smooth', block:'nearest'});",
  "  }",
  "  // Refresh button del roadmap.",
  "  setTimeout(function(){ var rr=el('roadmap-refresh'); if(rr) rr.addEventListener('click', loadRoadmap); }, 0);",
  "  setTimeout(function(){ var fr=el('files-refresh'); if(fr) fr.addEventListener('click', function(){ FILES_TREE=null; loadFilesTree(); }); var ff=el('files-filter'); if(ff) ff.addEventListener('input', function(){ if(FILES_TREE) renderFilesTree(); }); var ffs=el('files-fullscreen'); if(ffs) ffs.addEventListener('click', toggleFilesFullscreen); var ftt=el('files-tree-toggle'); if(ftt) ftt.addEventListener('click', toggleFilesTree); var fv=el('files-viewer'); if(fv) fv.addEventListener('click', function(ev){ var a=ev.target.closest && ev.target.closest('.md-body a[href]'); if(!a) return; var href=a.getAttribute('href')||''; if(/^(https?:|mailto:|tel:)/i.test(href)) return; if(href.charAt(0)==='#') return; ev.preventDefault(); var rp=resolveRel(CURRENT_FILE, href); if(rp) openFile(rp); }); var ar=el('agents-refresh'); if(ar) ar.addEventListener('click', loadAgents); var ap=el('agents-prune'); if(ap) ap.addEventListener('click', function(){ postLocks('/api/locks/release',{prune:true}).then(function(){ loadAgents(); }); }); var aid=el('agent-id'); if(aid) aid.addEventListener('change', function(){ localStorage.setItem('spdd-agent-id', aid.value.trim()); }); }, 0);",
  "  function toggleFilesFullscreen(){ var p=el('pane-files'); if(!p) return; var on=p.classList.toggle('fs-mode'); var b=el('files-fullscreen'); if(b) b.textContent = on ? '⛶ Salir de pantalla completa' : '⛶ Pantalla completa'; document.body.classList.toggle('fs-lock', on); }",
  "  function toggleFilesTree(){ var lay=document.querySelector('#pane-files .files-layout'); if(!lay) return; var off=lay.classList.toggle('tree-collapsed'); var b=el('files-tree-toggle'); if(b) b.textContent = off ? '⮞ Mostrar arbol' : '⮜ Ocultar arbol'; }",
  "  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ var p=el('pane-files'); if(p && p.classList.contains('fs-mode')) toggleFilesFullscreen(); } });",
  "  document.addEventListener('click', function(e){ var t = e.target.closest('.tab'); if(t) showTab(t.dataset.tab); var st = e.target.closest('.subtab[data-subtab]'); if(st) showSubtab(st.dataset.subtab); var ts = e.target.closest('[data-trace-sub]'); if(ts) showTraceSub(ts.dataset.traceSub); });",
  "  el('search-q').addEventListener('keydown', function(e){ if(e.key==='Enter') doSearch(); });",
  "  el('search-btn').addEventListener('click', doSearch);",
  "  if(el('console-clear')) el('console-clear').addEventListener('click', consoleClear);",
  "  if(el('console-copy')) el('console-copy').addEventListener('click', consoleCopy);",
  "  if(el('console-stop')) el('console-stop').addEventListener('click', stopAction);",
  "  if(el('history-refresh')) el('history-refresh').addEventListener('click', loadHistory);",
  "  if(el('stats-refresh')) el('stats-refresh').addEventListener('click', loadStats);",
  "  if(el('trends-refresh')) el('trends-refresh').addEventListener('click', loadTrends);",
  "  ['filter-action','filter-status','filter-since','filter-mode','filter-slow'].forEach(function(id){ var n=el(id); if(n) n.addEventListener('change', loadHistory); });",
  "  ['trend-action','trend-action-b','trend-days'].forEach(function(id){ var n=el(id); if(n) n.addEventListener('change', function(){ writeTrendFiltersToUrl(); loadTrends(); }); });",
  "  // v12.45 (E3): filtro display_status en Trazabilidad/Por feature.",
  "  if(el('trace-ds-filter')) el('trace-ds-filter').addEventListener('change', applyTraceDsFilter);",
  "  if(MODE === 'live'){",
  "    fetch('/api/snapshot').then(function(r){return r.json();}).then(function(d){ MEM=d; renderAll(d); renderPresetButtons(); }).catch(function(){ el('meta').textContent='No se pudo cargar /api/snapshot'; });",
  "  } else {",
  "    renderAll(MEM); renderPresetButtons();",
  "  }",
  "  // v12.28/v12.30/v12.32: si la URL trae filtros, abrir el sub-tab apropiado.",
  "  var __urlParams = new URLSearchParams(window.location.search);",
  "  var __hasActFilters = ['act_action','act_status','act_since','act_mode','act_slow'].some(function(p){ return __urlParams.has(p); });",
  "  var __hasTrendFilters = ['trend_action','trend_days'].some(function(p){ return __urlParams.has(p); });",
  "  var __explicitSubtab = __urlParams.get('act_subtab');",
  "  readFiltersFromUrl();",
  "  if(__explicitSubtab && MODE === 'live'){ showTab('actions'); showSubtab(__explicitSubtab); }",
  "  else if(__hasTrendFilters && MODE === 'live'){ showTab('actions'); showSubtab('trends'); }",
  "  else if(__hasActFilters && MODE === 'live'){ showTab('actions'); showSubtab('history'); }",
  "  else { showTab('trace'); }",
  "})();",
].join("\n");

function memoryHtmlShell(dataScript) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Memoria del agente IA — consulta</title>
<style>
  :root {
    --brand:#1F4E79; --brand-dark:#163A5C; --brand-light:#E8F0F9;
    --bg:#F3F4F6; --surface:#fff; --line:#E5E7EB; --line-soft:#F1F5F9;
    --text:#1F2937; --muted:#6B7280; --ok:#047857; --warn:#B45309;
    --font:'Segoe UI',system-ui,sans-serif; --mono:'Consolas',monospace; --radius:8px;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:var(--font); background:var(--bg); color:var(--text); }
  header { background:var(--brand); color:#fff; padding:18px 24px; }
  header h1 { font-size:18px; font-weight:700; }
  header .meta { font-size:12px; opacity:.85; margin-top:4px; font-family:var(--mono); }
  .wrap { max-width:1180px; margin:0 auto; padding:20px 24px 48px; }
  .stats { display:grid; grid-template-columns:repeat(8,1fr); gap:10px; margin-bottom:20px; }
  .stat { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:12px; text-align:center; }
  .stat-v { font-size:22px; font-weight:800; color:var(--brand); }
  .stat-l { font-size:10px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); margin-top:2px; }
  .searchbar { display:flex; gap:8px; margin-bottom:18px; }
  .searchbar input { flex:1; padding:9px 12px; border:1px solid var(--line); border-radius:var(--radius); font-size:14px; outline:none; }
  .searchbar input:focus { border-color:var(--brand); }
  .searchbar button { padding:9px 16px; background:var(--brand); color:#fff; border:none; border-radius:var(--radius); font-size:13px; font-weight:600; cursor:pointer; }
  .searchbar button:hover { background:var(--brand-dark); }
  .tabs { display:flex; gap:4px; flex-wrap:wrap; border-bottom:1px solid var(--line); margin-bottom:16px; }
  .tab { padding:8px 14px; font-size:13px; cursor:pointer; border:none; background:transparent; color:var(--muted); border-bottom:2px solid transparent; }
  .tab:hover { color:var(--text); }
  .tab.active { color:var(--brand); border-bottom-color:var(--brand); font-weight:600; }
  .pane { display:none; }
  .pane.active { display:block; }
  table { width:100%; border-collapse:collapse; background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; }
  thead { background:var(--line-soft); }
  th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); padding:9px 12px; border-bottom:1px solid var(--line); }
  td { font-size:13px; padding:9px 12px; border-bottom:1px solid var(--line-soft); vertical-align:top; }
  td:first-child { white-space:nowrap; font-family:var(--mono); font-size:12px; }
  tr:last-child td { border-bottom:none; }
  tbody tr:hover td { background:var(--line-soft); }
  .empty { color:var(--muted); font-size:13px; padding:18px; }
  .badge { display:inline-block; background:var(--brand-light); color:var(--brand-dark); font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px; }
  .excerpt { color:var(--muted); font-size:12px; margin-top:4px; }
  .count { font-size:13px; color:var(--text); margin-bottom:8px; padding:8px 12px; background:var(--brand-light); border-radius:var(--radius); }
  .count strong { color:var(--brand); font-size:15px; }
  .count .mode-note { color:var(--muted); font-size:11px; font-weight:400; margin-left:6px; }
  .chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
  .chips .badge { background:var(--line-soft); color:var(--text); }
  .presets { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:14px; margin-bottom:16px; }
  .presets-title { font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.6px; margin-bottom:10px; }
  .presets input { width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:var(--radius); font-size:13px; margin-bottom:10px; outline:none; }
  .presets input:focus { border-color:var(--brand); }
  .preset-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:6px; }
  .preset-btn { text-align:left; padding:9px 12px; background:var(--brand-light); color:var(--brand-dark); border:1px solid var(--line); border-radius:var(--radius); font-size:12.5px; font-weight:500; cursor:pointer; transition:.15s; }
  .preset-btn:hover { background:var(--brand); color:#fff; border-color:var(--brand); }
  .preset-btn .req { color:var(--warn); font-weight:700; }
  /* v12.23: panel Acciones */
  .actions-layout { display:grid; grid-template-columns: 1fr 1fr; gap:14px; }
  @media (max-width:900px){ .actions-layout { grid-template-columns:1fr; } .stats{ grid-template-columns:repeat(4,1fr);} }
  .action-cat { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:12px 14px; margin-bottom:12px; }
  .action-cat h3 { font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.6px; margin-bottom:8px; }
  .action-grid { display:grid; grid-template-columns:1fr; gap:5px; }
  .action-btn { text-align:left; padding:8px 11px; background:var(--brand-light); color:var(--brand-dark); border:1px solid var(--line); border-radius:var(--radius); font-size:12.5px; cursor:pointer; transition:.15s; display:flex; flex-direction:column; gap:2px; }
  .action-btn:hover { background:var(--brand); color:#fff; border-color:var(--brand); }
  .action-btn .ah { font-size:10.5px; opacity:.8; font-weight:400; }
  .action-btn:hover .ah { opacity:.95; }
  .action-btn.danger { background:#FEF2F2; color:#991B1B; border-color:#FCA5A5; }
  .action-btn.danger:hover { background:#B91C1C; color:#fff; border-color:#B91C1C; }
  .action-btn:disabled { opacity:.5; cursor:wait; }
  .action-arg { margin:6px 0; padding:6px 10px; background:var(--line-soft); border-radius:var(--radius); font-size:12px; color:var(--muted); }
  .action-arg input { margin-left:6px; padding:3px 6px; border:1px solid var(--line); border-radius:4px; font-size:12px; font-family:var(--mono); width:160px; }
  .console { background:#0F172A; color:#E2E8F0; border-radius:var(--radius); padding:12px; font-family:var(--mono); font-size:12.5px; min-height:380px; max-height:520px; overflow-y:auto; white-space:pre-wrap; word-break:break-word; line-height:1.5; }
  .console .cmd { color:#7DD3FC; }
  .console .ok { color:#86EFAC; }
  .console .err { color:#FCA5A5; }
  .console .muted { color:#94A3B8; }
  .console .info { color:#FCD34D; }
  .console-bar { display:flex; gap:6px; margin-bottom:8px; justify-content:flex-end; }
  .console-bar button { padding:5px 10px; background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); font-size:11.5px; color:var(--text); cursor:pointer; }
  .console-bar button:hover { background:var(--brand-light); }
  .modal-bg { position:fixed; inset:0; background:rgba(15,23,42,.6); display:none; align-items:center; justify-content:center; z-index:100; }
  .modal-bg.show { display:flex; }
  .modal { background:#fff; padding:22px; border-radius:var(--radius); max-width:480px; box-shadow:0 8px 32px rgba(0,0,0,.2); }
  .modal h3 { font-size:15px; margin-bottom:10px; color:var(--brand-dark); }
  .modal p { font-size:13px; color:var(--text); margin-bottom:14px; line-height:1.5; }
  .modal .row { display:flex; gap:8px; justify-content:flex-end; }
  .modal button { padding:8px 14px; border-radius:var(--radius); border:none; font-size:13px; font-weight:600; cursor:pointer; }
  .modal .cancel { background:var(--line); color:var(--text); }
  .modal .confirm { background:#B91C1C; color:#fff; }
  /* v12.25: sub-tabs y panel Historial */
  .subtabs { display:flex; gap:2px; margin-bottom:12px; border-bottom:1px solid var(--line); }
  .subtab { padding:6px 12px; font-size:12px; background:transparent; border:none; cursor:pointer; color:var(--muted); border-bottom:2px solid transparent; }
  .subtab.active { color:var(--brand); border-bottom-color:var(--brand); font-weight:600; }
  .subpane { display:none; }
  .subpane.active { display:block; }
  .history-row { border-bottom:1px solid var(--line-soft); padding:8px 6px; display:grid; grid-template-columns: 80px 1fr 70px 60px 70px 80px; gap:8px; align-items:center; font-size:12px; }
  .history-row:hover { background:var(--line-soft); }
  .history-row .when { color:var(--muted); font-family:var(--mono); font-size:11px; }
  .history-row .action { font-weight:600; color:var(--brand-dark); }
  .history-row .arg { color:var(--muted); font-family:var(--mono); font-size:11px; }
  .history-row .badge.ok { background:#D1FAE5; color:#065F46; }
  .history-row .badge.fail { background:#FEE2E2; color:#991B1B; }
  .history-row .badge.cancelled { background:#FEF3C7; color:#92400E; }
  .history-row .replay { padding:3px 8px; font-size:11px; background:var(--brand-light); border:1px solid var(--line); border-radius:4px; cursor:pointer; }
  .history-row .replay:hover { background:var(--brand); color:#fff; }
  .history-row .replay:disabled { opacity:.4; cursor:wait; }
  .history-detail { background:#0F172A; color:#E2E8F0; font-family:var(--mono); font-size:11.5px; padding:10px; margin:6px 0 0 80px; border-radius:6px; white-space:pre-wrap; max-height:240px; overflow-y:auto; }
  .history-detail .err { color:#FCA5A5; }
  .kbd { display:inline-block; padding:1px 5px; background:var(--line-soft); border:1px solid var(--line); border-radius:3px; font-family:var(--mono); font-size:10.5px; color:var(--muted); }
  .actions-help { margin-top:10px; padding:8px 10px; background:var(--line-soft); border-radius:var(--radius); font-size:11.5px; color:var(--muted); line-height:1.6; }
  /* v12.26: stats sub-tab + export buttons */
  .stats-table { width:100%; border-collapse:collapse; background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; font-size:12.5px; }
  .stats-table thead { background:var(--line-soft); }
  .stats-table th { text-align:left; padding:8px 10px; font-size:10.5px; text-transform:uppercase; color:var(--muted); letter-spacing:.5px; }
  .stats-table th.num, .stats-table td.num { text-align:right; font-family:var(--mono); }
  .stats-table td { padding:7px 10px; border-top:1px solid var(--line-soft); }
  .stats-table td.action { font-weight:600; color:var(--brand-dark); }
  .stats-table .ok { color:var(--ok); font-weight:600; }
  .stats-table .fail { color:#B91C1C; font-weight:600; }
  .stats-table .can { color:#92400E; font-weight:600; }
  .stats-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:12px; }
  .stats-summary .stat { padding:10px; }
  .export-bar { display:flex; gap:6px; margin-bottom:8px; }
  .export-bar a { padding:6px 12px; background:var(--brand-light); color:var(--brand-dark); text-decoration:none; border:1px solid var(--line); border-radius:var(--radius); font-size:11.5px; font-weight:500; }
  .export-bar a:hover { background:var(--brand); color:#fff; border-color:var(--brand); }
  /* v12.27: filtros del Historial */
  .filter-bar { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px; padding:8px 10px; background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); font-size:12px; align-items:center; }
  .filter-bar label { color:var(--muted); font-size:11px; margin-right:2px; }
  .filter-bar select, .filter-bar input { padding:4px 8px; border:1px solid var(--line); border-radius:4px; font-size:12px; font-family:var(--font); background:#fff; }
  .filter-bar .filter-count { margin-left:auto; color:var(--muted); font-size:11px; }
  /* v12.27: barra de progreso en consola */
  .console .progress-line { display:block; margin:4px 0; padding:4px 6px; background:#1E293B; border-radius:4px; }
  .console .progress-bar { position:relative; height:14px; background:#334155; border-radius:3px; overflow:hidden; margin-top:3px; }
  .console .progress-fill { position:absolute; left:0; top:0; bottom:0; background:linear-gradient(90deg, #06B6D4, #10B981); transition:width .25s ease; }
  .console .progress-text { color:#7DD3FC; font-size:11px; }
  /* v12.28: sparklines + banner de alertas */
  .alerts-banner { display:none; margin-bottom:12px; padding:10px 14px; background:#FEF2F2; border:1px solid #FCA5A5; border-left:4px solid #B91C1C; border-radius:var(--radius); color:#7F1D1D; font-size:13px; }
  .alerts-banner.show { display:block; }
  .alerts-banner h4 { font-size:12px; margin-bottom:4px; text-transform:uppercase; letter-spacing:.5px; color:#991B1B; }
  .alerts-banner .alert-item { margin-top:4px; font-family:var(--mono); font-size:12px; }
  .alerts-banner .alert-item strong { color:#7F1D1D; font-weight:700; }
  .alerts-banner .alert-item a { color:#991B1B; text-decoration:underline; cursor:pointer; margin-left:8px; font-size:11px; }
  /* v12.54: roadmap pane */
  .roadmap-toolbar { display:flex; gap:8px; align-items:center; padding:10px 12px; background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); margin-bottom:14px; }
  .roadmap-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px; margin-bottom:18px; }
  .phase-card { background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:12px 14px; position:relative; overflow:hidden; cursor:pointer; transition:.15s; }
  .phase-card:hover { box-shadow:0 4px 12px rgba(0,0,0,.06); border-color:var(--brand); }
  .phase-card.selected { border-color:var(--brand); box-shadow:0 0 0 2px var(--brand-light); }
  .phase-card::before { content:""; position:absolute; top:0; left:0; width:4px; height:100%; background:var(--line); }
  .phase-card.complete::before { background:#16A34A; }
  .phase-card.partial::before { background:#D97706; }
  .phase-card.not-started::before { background:#94A3B8; }
  .phase-num { font-size:10px; text-transform:uppercase; letter-spacing:.6px; color:var(--muted); font-weight:700; }
  .phase-name { font-size:14px; font-weight:700; margin-top:2px; }
  .phase-status { font-size:11px; margin-top:4px; font-weight:600; }
  .phase-status.complete { color:#16A34A; }
  .phase-status.partial { color:#D97706; }
  .phase-status.not-started { color:#94A3B8; }
  .phase-detail { font-size:11px; color:var(--muted); margin-top:4px; }
  .roadmap-section { background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:14px 16px; margin-bottom:14px; }
  .roadmap-section h4 { font-size:11px; text-transform:uppercase; letter-spacing:.6px; color:var(--muted); font-weight:700; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; }
  .blocker-item { padding:8px 12px; background:#FEF2F2; border:1px solid #FCA5A5; border-left:3px solid #DC2626; border-radius:4px; margin-bottom:6px; font-size:12px; color:#7F1D1D; }
  .next-action { padding:10px 14px; background:#EFF6FF; border:1px solid #BFDBFE; border-left:3px solid #2563EB; border-radius:4px; margin-bottom:6px; font-size:13px; color:#1E3A8A; font-weight:500; }
  .proto-ladder { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
  .proto-rung { display:flex; align-items:center; gap:6px; padding:4px 10px; background:#F8FAFC; border:1px solid var(--line); border-radius:999px; font-size:11px; }
  .proto-rung-dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
  .proto-rung-label { font-weight:600; color:var(--ink); }
  .proto-rung-count { font-weight:700; color:var(--muted); background:#fff; border:1px solid var(--line); border-radius:999px; padding:0 6px; min-width:18px; text-align:center; }
  .proto-feature-list { display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }
  .proto-feature-row { display:grid; grid-template-columns:auto auto auto 1fr; gap:8px; align-items:center; font-size:12px; padding:4px 0; border-bottom:1px solid var(--line); }
  .proto-feature-state { font-family:var(--mono); font-size:11px; color:var(--brand); font-weight:600; }
  .proto-feature-note { font-size:11px; color:var(--muted); }
  .proto-advance-warn { padding:10px 14px; background:#FFFBEB; border:1px solid #FCD34D; border-left:3px solid #D97706; border-radius:4px; font-size:12px; color:#92400E; }
  .proto-advance-ok { padding:10px 14px; background:#F0FDF4; border:1px solid #86EFAC; border-left:3px solid #16A34A; border-radius:4px; font-size:12px; color:#166534; }
  /* v12.70: visor de proyecto */
  .files-layout { display:grid; grid-template-columns:300px 1fr; gap:12px; align-items:start; }
  .files-tree { max-height:70vh; overflow:auto; border:1px solid var(--line); border-radius:var(--radius); padding:8px; background:#fff; font-size:12.5px; }
  .files-viewer { max-height:70vh; overflow:auto; border:1px solid var(--line); border-radius:var(--radius); background:#fff; }
  /* v12.73: contraer el arbol */
  .files-layout.tree-collapsed { grid-template-columns:1fr; }
  .files-layout.tree-collapsed .files-tree { display:none; }
  /* v12.72: pantalla completa del visor */
  body.fs-lock { overflow:hidden; }
  #pane-files.fs-mode { position:fixed; inset:0; z-index:9999; margin:0; padding:12px 16px; background:var(--bg,#f6f7f9); overflow:auto; display:block; }
  #pane-files.fs-mode .files-layout { grid-template-columns:340px 1fr; }
  #pane-files.fs-mode .files-layout.tree-collapsed { grid-template-columns:1fr; }
  #pane-files.fs-mode .files-tree { max-height:calc(100vh - 90px); }
  #pane-files.fs-mode .files-viewer { max-height:calc(100vh - 90px); }
  #pane-files.fs-mode .fview-frame { height:calc(100vh - 170px); }
  .ftree-dir > summary { cursor:pointer; padding:2px 4px; border-radius:4px; user-select:none; white-space:nowrap; }
  .ftree-dir > summary:hover { background:var(--bg); }
  .ftree-children { padding-left:14px; border-left:1px dashed var(--line); margin-left:6px; }
  .ftree-file { cursor:pointer; padding:2px 6px; border-radius:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ftree-file:hover { background:var(--bg); }
  .ftree-file.sel { background:var(--brand-light); color:var(--brand-dark); font-weight:600; }
  .fview-head { position:sticky; top:0; background:var(--bg); border-bottom:1px solid var(--line); padding:8px 12px; font-size:12px; }
  .fview-img { padding:14px; text-align:center; }
  .fview-img img { max-width:100%; height:auto; border:1px solid var(--line); border-radius:4px; }
  .fview-tools { float:right; display:inline-flex; gap:6px; }
  .fview-tools button { font-size:11px; padding:2px 8px; }
  .fview-body { }
  .fview-pre { font-family:var(--mono); font-size:12px; line-height:1.5; padding:8px 0; }
  .fview-line { display:flex; }
  .fview-line:hover { background:var(--bg); }
  .fview-ln { flex:0 0 48px; text-align:right; padding-right:10px; color:var(--muted); user-select:none; border-right:1px solid var(--line); }
  .fview-code { padding-left:12px; white-space:pre; overflow-x:auto; }
  .fview-frame { width:100%; height:68vh; border:0; background:#fff; }
  /* v12.80: panel multiagente */
  .agent-board { width:100%; border-collapse:collapse; font-size:12.5px; background:#fff; border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; }
  .agent-board th, .agent-board td { border-bottom:1px solid var(--line); padding:8px 12px; text-align:left; }
  .agent-board th { background:var(--bg); font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); }
  .agent-board tr:last-child td { border-bottom:0; }
  .agent-board button { font-size:11px; padding:3px 10px; }
  .agent-warn { margin-top:10px; padding:8px 12px; background:#FFFBEB; border:1px solid #FCD34D; border-radius:4px; font-size:12px; color:#92400E; }
  /* tokens de resaltado */
  .hl-str { color:#0a7d33; }
  .hl-com { color:#8a93a3; font-style:italic; }
  .hl-num { color:#b5530b; }
  .hl-kw { color:#7c3aed; font-weight:600; }
  /* markdown renderizado */
  .md-body { padding:14px 18px; font-size:13.5px; line-height:1.6; color:var(--ink); }
  .md-body h1, .md-body h2, .md-body h3, .md-body h4 { margin:18px 0 8px; line-height:1.25; }
  .md-body h1 { font-size:1.6em; border-bottom:1px solid var(--line); padding-bottom:6px; }
  .md-body h2 { font-size:1.35em; border-bottom:1px solid var(--line); padding-bottom:4px; }
  .md-body h3 { font-size:1.15em; }
  .md-body p { margin:8px 0; }
  .md-body ul, .md-body ol { margin:8px 0 8px 22px; }
  .md-body li { margin:3px 0; }
  .md-body code { font-family:var(--mono); font-size:0.9em; background:var(--bg); padding:1px 5px; border-radius:4px; }
  .md-body pre.md-code { background:#0F172A; color:#E2E8F0; padding:12px 14px; border-radius:6px; overflow-x:auto; }
  .md-body pre.md-code code { background:transparent; color:inherit; padding:0; }
  .md-body blockquote { margin:8px 0; padding:4px 12px; border-left:3px solid var(--brand); background:var(--bg); color:var(--muted); }
  .md-body table { border-collapse:collapse; margin:10px 0; font-size:12.5px; width:100%; }
  .md-body th, .md-body td { border:1px solid var(--line); padding:5px 9px; text-align:left; }
  .md-body th { background:var(--bg); }
  .md-body a { color:var(--brand-dark); }
  .md-body hr { border:0; border-top:1px solid var(--line); margin:14px 0; }
  .timeline-list { max-height:340px; overflow-y:auto; }
  .timeline-row { padding:8px 0; border-bottom:1px solid var(--line); display:grid; grid-template-columns:auto 1fr auto auto; gap:10px; align-items:center; font-size:12px; }
  .timeline-row:last-child { border-bottom:0; }
  .timeline-icon { width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }
  .timeline-icon.ok { background:#DCFCE7; color:#166534; }
  .timeline-icon.fail { background:#FEE2E2; color:#991B1B; }
  .timeline-icon.cancel { background:#FEF3C7; color:#92400E; }
  .timeline-action { font-weight:600; font-family:var(--mono); font-size:11.5px; }
  .timeline-meta { font-size:10px; color:var(--muted); }
  .timeline-time { font-size:10px; color:var(--muted); font-family:var(--mono); white-space:nowrap; }
  .timeline-replay { padding:3px 9px; border:1px solid var(--line); border-radius:4px; font-size:11px; background:#fff; cursor:pointer; }
  .timeline-replay:hover { background:var(--brand); color:#fff; border-color:var(--brand); }
  .cmd-suggestions { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:10px; }
  .cmd-card { padding:10px 12px; background:var(--surface); border:1px solid var(--line); border-radius:4px; }
  .cmd-card-id { font-family:var(--mono); font-size:12px; font-weight:700; color:var(--brand); }
  .cmd-card-reason { font-size:11px; color:var(--muted); margin-top:3px; }
  .cmd-card-run { display:inline-block; margin-top:6px; padding:4px 10px; background:var(--brand); color:#fff; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer; border:0; }
  .cmd-card-run:hover { background:#1E3A8A; }
  /* v12.58: contract panel por fase */
  .contract-card { background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:16px; margin-bottom:14px; }
  .contract-head { font-size:13px; margin-bottom:6px; color:var(--brand); }
  .contract-head .contract-name { color:var(--ink); font-weight:600; margin-left:6px; }
  .contract-objective { font-size:13px; color:var(--ink); margin-bottom:14px; font-style:italic; padding:8px 12px; background:var(--surface); border-radius:4px; }
  .contract-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:10px; margin-bottom:12px; }
  .contract-section { padding:10px 12px; border-radius:6px; border:1px solid var(--line); background:#fff; }
  .contract-section h5 { font-size:11px; text-transform:uppercase; letter-spacing:.6px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
  .contract-section ul { list-style:none; padding:0; margin:0; }
  .contract-section li { font-size:12px; padding:3px 0; line-height:1.45; color:var(--ink); border-bottom:1px solid var(--line-soft); }
  .contract-section li:last-child { border-bottom:0; }
  .contract-section.allowed { border-left:3px solid #16A34A; }
  .contract-section.allowed h5 { color:#15803D; }
  .contract-section.forbidden { border-left:3px solid #DC2626; }
  .contract-section.forbidden h5 { color:#991B1B; }
  .contract-section.read { border-left:3px solid #2563EB; }
  .contract-section.read h5 { color:#1E40AF; }
  .contract-section.read li { font-family:var(--mono); font-size:11px; }
  .contract-section.update { border-left:3px solid #D97706; }
  .contract-section.update h5 { color:#92400E; }
  .contract-section.validate { border-left:3px solid #7C3AED; }
  .contract-section.validate h5 { color:#5B21B6; }
  .contract-section.validate li { font-family:var(--mono); font-size:11px; }
  .contract-section.deliver { border-left:3px solid #0891B2; }
  .contract-section.deliver h5 { color:#155E75; }
  .contract-gates { font-size:11px; color:var(--muted); margin-top:8px; padding-top:8px; border-top:1px solid var(--line); }
  .contract-gates code { background:var(--surface); padding:2px 6px; border-radius:3px; font-size:10px; }
  /* v12.59: badges de ejecucion en 'Debe validar' (cruce con BD ai_action_runs) */
  .exec-legend { font-size:9px; color:var(--muted); font-weight:400; text-transform:none; letter-spacing:0; }
  .exec-badge { display:inline-block; font-size:9px; font-weight:700; padding:1px 6px; border-radius:999px; margin-left:4px; white-space:nowrap; }
  .exec-badge.ok { background:#DCFCE7; color:#166534; }
  .exec-badge.fail { background:#FEF3C7; color:#92400E; }
  .exec-badge.never { background:#F1F5F9; color:#64748B; }
  .contract-exec-summary { font-size:11px; color:var(--ink); margin-top:10px; padding:8px 12px; background:var(--surface); border-radius:4px; border-left:3px solid #7C3AED; }
  .sparkline { display:inline-block; vertical-align:middle; height:24px; }
  .sparkline-cell { width:160px; }
  .sparkline-tip { font-size:10px; color:var(--muted); margin-left:6px; }
  /* v12.29: dashboard de tendencias */
  .trend-controls { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:14px; padding:10px 12px; background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); }
  .trend-controls label { font-size:11px; color:var(--muted); }
  .trend-controls select, .trend-controls button { padding:5px 10px; border:1px solid var(--line); border-radius:4px; font-size:12px; background:#fff; }
  .compare-banner { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:14px; }
  .compare-card { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:14px; }
  .compare-card h4 { font-size:10.5px; text-transform:uppercase; color:var(--muted); letter-spacing:.5px; margin-bottom:6px; }
  .compare-card .v { font-size:24px; font-weight:800; color:var(--brand-dark); line-height:1.1; }
  .compare-card .delta { font-size:13px; margin-top:6px; font-weight:600; }
  .compare-card .delta.up { color:var(--ok); }
  .compare-card .delta.down { color:#B91C1C; }
  .compare-card .delta.flat { color:var(--muted); }
  .compare-card .sub { font-size:11px; color:var(--muted); margin-top:2px; }
  .chart-wrap { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:14px; margin-bottom:14px; }
  .chart-wrap h4 { font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
  .chart-svg { width:100%; height:auto; display:block; }
  .chart-svg .axis-line { stroke:var(--line); stroke-width:1; }
  .chart-svg .grid-line { stroke:var(--line-soft); stroke-width:1; stroke-dasharray:2,3; }
  .chart-svg .axis-label { font-size:10px; fill:var(--muted); font-family:var(--font); }
  .chart-svg .data-line { fill:none; stroke:#06B6D4; stroke-width:2; }
  .chart-svg .data-point { fill:#06B6D4; stroke:#fff; stroke-width:1.5; }
  .chart-svg .bar-ok { fill:#10B981; }
  .chart-svg .bar-fail { fill:#DC2626; }
  .chart-svg .bar-cancel { fill:#F59E0B; }
  .chart-legend { display:flex; gap:14px; font-size:11px; color:var(--muted); margin-top:8px; }
  .chart-legend .swatch { display:inline-block; width:10px; height:10px; border-radius:2px; vertical-align:middle; margin-right:4px; }
  /* v12.43: coverage by feature */
  .feature-card { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:14px; margin-bottom:12px; }
  .feature-card h3 { font-size:14px; font-weight:700; color:var(--brand-dark); margin-bottom:6px; }
  .feature-card .feature-meta { font-size:11.5px; color:var(--muted); margin-bottom:8px; font-family:var(--mono); }
  .feature-card .status-pill { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; margin-right:4px; }
  .feature-card .status-pill.documented { background:#D1FAE5; color:#065F46; }
  .feature-card .status-pill.implemented { background:#A7F3D0; color:#064E3B; }
  .feature-card .status-pill.validated { background:#86EFAC; color:#14532D; }
  .feature-card .status-pill.approved { background:#86EFAC; color:#14532D; }
  .feature-card .status-pill.pending { background:#FEF3C7; color:#92400E; }
  .feature-card .status-pill.planned { background:#FED7AA; color:#9A3412; }
  .feature-card .target-group { margin-top:6px; }
  .feature-card .target-group .gtitle { font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:2px; }
  .feature-card .target-group ul { list-style:none; padding-left:6px; margin:0; }
  .feature-card .target-group li { font-size:11.5px; padding:2px 0; color:var(--text); }
  .feature-card .target-group .ev { color:var(--muted); font-family:var(--mono); font-size:10.5px; }
</style>
</head>
<body>
<header>
  <h1>Memoria del agente IA — consulta</h1>
  <div class="meta" id="meta">Cargando…</div>
</header>
<div class="wrap">
  <div class="stats" id="stats"></div>
  <div class="searchbar">
    <input id="search-q" type="text" placeholder="Buscar en la memoria (trazabilidad, decisiones, documentos…)">
    <button id="search-btn">Buscar</button>
  </div>
  <div class="tabs">
    <button class="tab active" data-tab="trace">Trazabilidad</button>
    <button class="tab" data-tab="gates">Gates</button>
    <button class="tab" data-tab="decisions">Decisiones</button>
    <button class="tab" data-tab="evidence">Evidencia</button>
    <button class="tab" data-tab="questions">Preguntas abiertas</button>
    <button class="tab" data-tab="docs">Documentos</button>
    <button class="tab" data-tab="search">Busqueda</button>
    <button class="tab" data-tab="actions">Acciones</button>
    <button class="tab" data-tab="roadmap">Roadmap</button>
    <button class="tab" data-tab="files">Proyecto</button>
    <button class="tab" data-tab="agents">Multiagente</button>
  </div>
  <div class="pane active" id="pane-trace">
    <div class="subtabs">
      <button class="subtab active" data-trace-sub="links">Trace links</button>
      <button class="subtab" data-trace-sub="by-feature">Por feature</button>
    </div>
    <div class="subpane active" id="trace-sub-links"><div id="tab-trace"></div></div>
    <div class="subpane" id="trace-sub-by-feature">
      <div class="trend-controls" style="margin-bottom:8px;">
        <label for="trace-ds-filter">Filtrar por display_status:</label>
        <select id="trace-ds-filter">
          <option value="">— todos —</option>
          <option value="planned">planned</option>
          <option value="implemented">implemented</option>
          <option value="validated">validated</option>
          <option value="pending">pending</option>
          <option value="documented">documented</option>
          <option value="approved">approved</option>
          <option value="inferred">inferred</option>
          <option value="drift">drift</option>
        </select>
        <span class="muted" style="font-size:11px;">filtra los links visibles sin recargar /api/coverage-by-feature</span>
      </div>
      <div id="tab-trace-by-feature"><p class="empty">Cargando coverage por feature…</p></div>
    </div>
  </div>
  <div class="pane" id="pane-gates"><div id="tab-gates"></div></div>
  <div class="pane" id="pane-decisions"><div id="tab-decisions"></div></div>
  <div class="pane" id="pane-evidence"><div id="tab-evidence"></div></div>
  <div class="pane" id="pane-questions"><div id="tab-questions"></div></div>
  <div class="pane" id="pane-docs"><div id="tab-docs"></div></div>
  <div class="pane" id="pane-search">
    <div id="presets-host"></div>
    <div id="search-out"><p class="empty">Escribe una consulta y pulsa Buscar, o usa una consulta rapida.</p></div>
  </div>
  <div class="pane" id="pane-actions">
    <div class="alerts-banner" id="alerts-banner"></div>
    <div class="subtabs">
      <button class="subtab active" data-subtab="run">Ejecutar</button>
      <button class="subtab" data-subtab="history">Historial</button>
      <button class="subtab" data-subtab="stats">Stats</button>
      <button class="subtab" data-subtab="trends">Tendencias</button>
    </div>
    <div class="subpane active" id="subpane-run">
      <div class="actions-layout">
        <div>
          <div id="actions-host"><p class="empty">Cargando acciones…</p></div>
          <div class="actions-help">
            <strong>Atajos:</strong>
            <span class="kbd">Ctrl+Shift+S</span> sync-memory ·
            <span class="kbd">Ctrl+Shift+R</span> memory-report ·
            <span class="kbd">Ctrl+Shift+E</span> regen contexto ·
            <span class="kbd">Ctrl+Shift+C</span> check:trace-drift ·
            <span class="kbd">Esc</span> detener job actual ·
            <span class="kbd">Ctrl+Shift+H</span> historial ·
            <span class="kbd">Ctrl+Shift+T</span> stats ·
            <span class="kbd">Ctrl+Shift+D</span> tendencias
          </div>
        </div>
        <div>
          <div class="console-bar">
            <button id="console-stop" style="display:none;background:#FEE2E2;color:#991B1B;border-color:#FCA5A5;font-weight:600;">■ Detener</button>
            <button id="console-clear">Limpiar</button>
            <button id="console-copy">Copiar</button>
          </div>
          <div class="console" id="console"><span class="muted">Esperando accion… Las acciones solo estan disponibles en modo <strong>live</strong> (memory-serve), no en el reporte estatico.</span></div>
        </div>
      </div>
    </div>
    <div class="subpane" id="subpane-history">
      <div class="filter-bar">
        <label for="filter-action">Acciones:</label>
        <select id="filter-action" multiple size="3" style="min-width:200px;"></select>
        <label for="filter-status">Estados:</label>
        <select id="filter-status" multiple size="3" style="min-width:120px;">
          <option value="ok">solo OK</option>
          <option value="fail">solo fail</option>
          <option value="cancelled">solo cancelled</option>
          <option value="running">solo corriendo</option>
        </select>
        <label for="filter-since">Periodo:</label>
        <select id="filter-since">
          <option value="">— todo el historial —</option>
          <option value="1h">ultima hora</option>
          <option value="24h">ultimas 24h</option>
          <option value="7d">ultimos 7d</option>
          <option value="30d">ultimos 30d</option>
        </select>
        <label for="filter-mode">Modos:</label>
        <select id="filter-mode" multiple size="2" style="min-width:90px;">
          <option value="sync">sync</option>
          <option value="stream">stream</option>
        </select>
        <label for="filter-slow">Lentos (>=):</label>
        <select id="filter-slow">
          <option value="">— sin filtro —</option>
          <option value="1000">1s</option>
          <option value="3000">3s</option>
          <option value="5000">5s</option>
          <option value="10000">10s</option>
          <option value="30000">30s</option>
        </select>
        <span class="filter-count" id="filter-count">—</span>
      </div>
      <div class="export-bar">
        <button id="history-refresh">↻ Refrescar</button>
        <a href="/api/action-runs/export?format=csv" download>⬇ Export CSV</a>
        <a href="/api/action-runs/export?format=json" download>⬇ Export JSON</a>
      </div>
      <div id="history-host"><p class="empty">Cargando historial…</p></div>
    </div>
    <div class="subpane" id="subpane-stats">
      <div class="export-bar"><button id="stats-refresh">↻ Refrescar</button></div>
      <div id="stats-host"><p class="empty">Cargando estadisticas…</p></div>
    </div>
    <div class="subpane" id="subpane-trends">
      <div class="trend-controls">
        <label for="trend-action">Accion:</label>
        <select id="trend-action"><option value="">— todas (agregado) —</option></select>
        <label for="trend-action-b">Comparar con:</label>
        <select id="trend-action-b"><option value="">— ninguna —</option></select>
        <label for="trend-days">Periodo:</label>
        <select id="trend-days">
          <option value="7">ultimos 7 dias</option>
          <option value="14">ultimos 14 dias</option>
          <option value="30" selected>ultimos 30 dias</option>
          <option value="60">ultimos 60 dias</option>
          <option value="90">ultimos 90 dias</option>
          <option value="180">ultimos 180 dias</option>
        </select>
        <button id="trends-refresh">↻ Refrescar</button>
        <a id="trends-export-md" href="#" title="Descargar dashboard como Markdown">⬇ Markdown</a>
      </div>
      <div id="trends-host"><p class="empty">Cargando tendencias…</p></div>
      <div id="trends-host-b" style="margin-top:16px;"></div>
    </div>
  </div>
  <div class="pane" id="pane-roadmap">
    <div class="roadmap-toolbar">
      <strong style="font-size:13px">Roadmap metodologico</strong>
      <span class="muted" style="font-size:11px;">— Donde esta el proyecto en la metodologia de 9 fases. Doc: <code>docs/transversal/90.36-roadmap-metodologico.md</code></span>
      <button id="roadmap-refresh" style="margin-left:auto">↻ Refrescar</button>
    </div>
    <div id="roadmap-host"><p class="empty">Cargando roadmap…</p></div>
    <div id="phase-contract-panel" style="margin-top:14px;"></div>
  </div>
  <div class="pane" id="pane-files">
    <div class="roadmap-toolbar">
      <strong style="font-size:13px">Proyecto</strong>
      <span class="muted" style="font-size:11px;">— Explora y visualiza los archivos del proyecto (.md, .js, .html, imagenes, ...).</span>
      <input id="files-filter" type="text" placeholder="filtrar por nombre…" style="margin-left:auto;min-width:180px;" />
      <button id="files-tree-toggle" title="Mostrar/ocultar el arbol">⮜ Ocultar arbol</button>
      <button id="files-refresh">↻ Refrescar</button>
      <button id="files-fullscreen">⛶ Pantalla completa</button>
    </div>
    <div class="files-layout">
      <div id="files-tree" class="files-tree"><p class="empty">Cargando arbol…</p></div>
      <div id="files-viewer" class="files-viewer"><p class="empty">Selecciona un archivo del arbol para verlo aqui.</p></div>
    </div>
  </div>
  <div class="pane" id="pane-agents">
    <div class="roadmap-toolbar">
      <strong style="font-size:13px">Multiagente</strong>
      <span class="muted" style="font-size:11px;">— Reclama/libera features para correr varios agentes IA en paralelo sin colision.</span>
      <label style="margin-left:auto;font-size:11px;">Agente:</label>
      <input id="agent-id" type="text" placeholder="tu-agente (ej: codex)" style="min-width:140px;" />
      <button id="agents-prune" title="Liberar locks expirados">🧹 Purgar expirados</button>
      <button id="agents-refresh">↻ Refrescar</button>
    </div>
    <div id="agents-host"><p class="empty">Cargando tablero…</p></div>
  </div>
</div>
<div class="modal-bg" id="modal-bg">
  <div class="modal">
    <h3 id="modal-title">Confirmar</h3>
    <p id="modal-msg"></p>
    <div class="row">
      <button class="cancel" id="modal-cancel">Cancelar</button>
      <button class="confirm" id="modal-confirm">Ejecutar</button>
    </div>
  </div>
</div>
<script>${dataScript}</script>
<script>${MEMORY_CLIENT_JS}</script>
</body>
</html>
`;
}

function writeMemoryReport(root, db, dbPath) {
  const snapshot = buildMemorySnapshot(db, dbPath, "static");
  const dataScript = `window['__' + 'MEMORY__'] = ${JSON.stringify(snapshot)};`;
  const html = memoryHtmlShell(dataScript);
  const outPath = path.join(root, "ai", "memory", "memory-report.html");
  writeFileEnsured(outPath, html);
  return { outPath, snapshot };
}

// v12.23: catalogo whitelisted de acciones ejecutables desde el front embebido.
// El cliente envia el `id` y el servidor mapea a un argv fijo; NO se acepta
// shell string ni `command` arbitrario. `danger:true` exige confirm modal en UI.
// `arg.regex` valida el unico parametro libre permitido por accion.
const EXEC_ACTIONS = [
  // ── UNIVERSALES: comandos compuestos siempre disponibles (v12.75) ──────
  { id: "check-project",   category: "universal", label: "check:project (todos los validadores)", hint: "Corre el pipeline completo de validadores del proyecto.", npmScript: "check:project" },
  { id: "check-all",       category: "universal", label: "check:all (template + project)",         hint: "Validacion total: check:template + check:project.",        npmScript: "check:all" },
  { id: "roadmap-status",  category: "universal", label: "roadmap:status",                         hint: "Estado de las 9 fases + semaforo de prototipos.",          scriptPath: "scripts/roadmap-status.mjs" },
  { id: "roadmap-next",    category: "universal", label: "roadmap:next",                           hint: "Siguiente tarea segura + contrato de ejecucion (JSON).",   scriptPath: "scripts/roadmap-next.mjs" },
  { id: "roadmap-sync",    category: "universal", label: "roadmap:sync",                           hint: "Regenera ROADMAP_STATE.json + estado vivo de los docs de fase.", scriptPath: "scripts/roadmap-sync.mjs" },
  { id: "template-upgrade", category: "universal", label: "template:upgrade (dry-run)",            hint: "Reporta diff vs el template canonico (no aplica cambios).", scriptPath: "scripts/template-upgrade.mjs" },
  { id: "roadmap-prompt",     category: "universal", label: "roadmap:prompt",                       hint: "Prompt listo para un agente IA con la siguiente tarea + contrato.", scriptPath: "scripts/roadmap-prompt.mjs" },
  { id: "roadmap-audit",      category: "universal", label: "roadmap:audit",                        hint: "Audita el git diff vs touch_policy + gates no auto-aprobados.",     scriptPath: "scripts/roadmap-audit.mjs" },
  { id: "check-roadmap-state", category: "universal", label: "check:roadmap-state",                 hint: "Verifica si ROADMAP_STATE.json esta al dia (warn; bloquea con CHECK_STRICT=1).", scriptPath: "scripts/roadmap-sync.mjs", defaultArgs: ["--check"] },
  { id: "release-prep",       category: "universal", label: "release:prep (sync + memoria + checks)", hint: "Flujo de release: roadmap:sync + memory:sync + check:all + ROADMAP_STATE strict.", npmScript: "release:prep", danger: true },
  // ── MEMORIA: reconstruyen / actualizan la BD desde Markdown ────────────
  { id: "sync-memory",        category: "memoria",     label: "Sync memoria",           hint: "Re-poblar trace_links, gates, decisiones, sesiones desde Markdown.", argv: ["sync-memory"] },
  { id: "index-docs",         category: "memoria",     label: "Index docs",             hint: "Re-indexar Markdown y chunks FTS5.",                                  argv: ["index-docs"] },
  { id: "embed-docs",         category: "memoria",     label: "Embed docs",             hint: "Generar embeddings locales (modelo local-hash-v1).",                  argv: ["embed-docs"] },
  { id: "regenerate-context", category: "memoria",     label: "Regen AI_CONTEXT.md",    hint: "Refrescar las zonas auto:start del contexto vivo.",                   argv: ["regenerate-context"] },
  { id: "harvest-trace",      category: "memoria",     label: "Harvest @trace",         hint: "Cosechar @trace/@implements del source code (origin='source-harvest').", argv: ["harvest-trace"] },
  // v12.45: bootstrap rapido (sin embed-docs) — equivalente a `npm run memory:bootstrap:quick`.
  // Encadena init-memory + index-docs + sync-memory + regenerate-context + index-docs.
  // No usa npm porque el panel ejecuta procesos hijos directos; las acciones encadenadas se
  // hacen via comandos individuales del agente. Se exponen aqui los pasos individuales y el
  // boton "Bootstrap rapido" corre el wrapper init-memory que asume que el resto se corre despues.
  { id: "init-memory",        category: "memoria",     label: "Init memory (schema)",   hint: "Crear/actualizar el schema de la BD (idempotente).",                  argv: ["init-memory"] },
  // ── VALIDADORES: read-only, exit code 0/1 ──────────────────────────────
  { id: "check-docs",            category: "validador", label: "check-docs",            hint: "Links rotos, headings duplicados, secciones obligatorias.",          argv: null, ciScript: "check-docs.mjs", acceptsDb: false },
  { id: "check-trace-drift",     category: "validador", label: "check-trace-drift",     hint: "Links de la matriz que apuntan a artefactos inexistentes.",          argv: null, ciScript: "check-trace-drift.mjs", acceptsDb: true },
  { id: "check-trace-coverage",  category: "validador", label: "check-trace-coverage",  hint: "RFs en fase >=5 sin codigo + test reales.",                          argv: null, ciScript: "check-trace-coverage.mjs", acceptsDb: true },
  { id: "check-prototype-hub",   category: "validador", label: "check-prototype-hub",   hint: "Las 10 secciones del hub + paridad spec-cards/specs reales.",        argv: null, ciScript: "check-prototype-hub.mjs", acceptsDb: false },
  { id: "check-prototype-html5", category: "validador", label: "check-prototype-html5", hint: "Rubrica nivel 0-3 de prototipos HTML5.",                             argv: null, ciScript: "check-html5-prototype-quality.mjs", acceptsDb: false },
  { id: "check-bd-documented",   category: "validador", label: "check-bd-documented",   hint: "Cada BD declarada en la matriz tiene doc canonica en spec-tecnica.md (con columnas, PK, indices).", argv: null, ciScript: "check-bd-documented.mjs", acceptsDb: true },
  { id: "check-api-documented",  category: "validador", label: "check-api-documented",  hint: "Cada endpoint declarado en la matriz tiene doc canonica en api-contract.md.", argv: null, ciScript: "check-api-documented.mjs", acceptsDb: true },
  { id: "check-test-documented", category: "validador", label: "check-test-documented", hint: "Cada test declarado tiene archivo real en tests/qa/src + @trace al RF + cobertura lcov (solo phase >= 6).", argv: null, ciScript: "check-test-documented.mjs", acceptsDb: true },
  { id: "check-runbook-documented", category: "validador", label: "check-runbook-documented", hint: "Cada feature en fase 8 tiene runbook con Procedimientos/SLO/Contactos.", argv: null, ciScript: "check-runbook-documented.mjs", acceptsDb: true },
  { id: "check-evidence-exists",    category: "validador", label: "check-evidence-exists",    hint: "Cada evidence_ref de la matriz apunta a un archivo real del repo (con did-you-mean v12.45).", argv: null, ciScript: "check-evidence-exists.mjs", acceptsDb: true },
  // v12.45: nuevos validadores estrictos.
  { id: "check-gates-mentioned",    category: "validador", label: "check-gates-mentioned",    hint: "Cada feature NNN-* bajo specs/ menciona al menos un gate en ai_gate_runs (v12.45).", argv: null, ciScript: "check-gates-mentioned.mjs", acceptsDb: true },
  { id: "check-status-coherence",   category: "validador", label: "check-status-coherence",   hint: "display_status coincide con lo que computeDisplayStatus produciria (v12.45).", argv: null, ciScript: "check-status-coherence.mjs", acceptsDb: true },
  { id: "check-orphan-evidence",    category: "validador", label: "check-orphan-evidence",    hint: "Archivos canonicos en specs/ no conectados a la trazabilidad (ni evidence_ref ni source_file) (v12.45.1).", argv: null, ciScript: "check-orphan-evidence.mjs", acceptsDb: true },
  // ── REPORTES: snapshots, packs, contexto ───────────────────────────────
  { id: "memory-report",  category: "reporte", label: "Regenerar memory-report.html", hint: "Snapshot HTML estatico de la memoria.",                argv: ["memory-report"] },
  { id: "context-pack",   category: "reporte", label: "Context pack",                 hint: "Pack JSON comprimido para pasar a otro agente.",       argv: ["context-pack"] },
  { id: "next-task",      category: "reporte", label: "Next task",                    hint: "Sugerencia de proxima tarea segun gates abiertos.",   argv: ["next-task"] },
  { id: "diff-since",     category: "reporte", label: "Diff desde…",                  hint: "Eventos/gates/decisiones desde una fecha (ej 7d).",   argv: ["diff-since"], arg: { name: "--since", required: true, hint: "7d / 24h / 2026-05-01", regex: "^(\\d+[dhwm]|\\d{4}-\\d{2}-\\d{2})$" } },
  { id: "template-drift", category: "reporte", label: "Template drift",               hint: "Detecta divergencia respecto al template canonico.",  argv: ["template-drift"] },
  { id: "status",         category: "reporte", label: "Status",                       hint: "Resumen de conteos y frescura de la memoria.",        argv: ["status"] },
  // v12.45: status modos avanzados (D1/D3). --watch no se expone aqui (es interactivo solo terminal).
  { id: "status-fail-on-drift", category: "reporte", label: "Status --fail-on-drift", hint: "Como Status pero exit=1 si stale o drift (util para CI).", argv: ["status", "--fail-on-drift"] },
  { id: "status-fix",     category: "reporte", label: "Status --fix",                 hint: "Como Status; si hay drift de embeddings, corre embed-docs automaticamente.", argv: ["status", "--fix"] },
  // ── GENERADORES: ESCRIBEN archivos en el repo (danger) ─────────────────
  { id: "prototype-hub",      category: "generador", label: "Prototype hub (full)",       hint: "Reescribe TODO prototype/index.html — sobrescribe customizaciones manuales.", argv: ["generate-prototype-hub"], danger: true },
  { id: "prototype-hub-auto", category: "generador", label: "Prototype hub --auto-only",  hint: "Reescribe solo las zonas @auto:start; preserva customizaciones.",            argv: ["generate-prototype-hub", "--auto-only"] },
];

// Lock global: un job a la vez para evitar race conditions en la BD.
// v12.24: __execJob ahora guarda referencia al ChildProcess para poder cancelar.
let __execJob = null;
const EXEC_TIMEOUT_MS = 5 * 60 * 1000;
const TAIL_BYTES = 4 * 1024;

// v12.59: convierte un comando del contrato (debeValidar) al action_id que se
// registra en ai_action_runs. Permite cruzar "que hacer" con "que se ejecuto".
// Ejemplos:
//   "npm run check:prototype-html5 -- --spec specs/X"  -> "check-prototype-html5"
//   "npm run memory:sync"                              -> "sync-memory"
//   "npm run memory:harvest-trace"                     -> "harvest-trace"
//   "npm run generate:openapi"                         -> "generate-openapi" (no rastreado, devuelve null si no hay match comun)
function npmCommandToActionId(cmd) {
  if (!cmd) return null;
  const m = String(cmd).match(/npm run ([a-z][a-z0-9:-]+)/i);
  if (!m) return null;
  const script = m[1]; // ej. "check:prototype-html5" o "memory:sync"
  // Mapeos especiales memory:X -> X-memory o forma del agente.
  const MEMORY_MAP = {
    "memory:sync": "sync-memory",
    "memory:sync:quick": "sync-memory",
    "memory:index": "index-docs",
    "memory:embed": "embed-docs",
    "memory:context": "regenerate-context",
    "memory:harvest-trace": "harvest-trace",
    "memory:bootstrap": "init-memory",
    "memory:report": "memory-report",
    "memory:next-task": "next-task",
  };
  if (MEMORY_MAP[script]) return MEMORY_MAP[script];
  // check:X -> check-X (los validadores ci se registran con guion).
  if (script.startsWith("check:")) return "check-" + script.slice("check:".length);
  // generate:X -> generate-X (no se rastrean por el panel hoy, pero devolvemos el id).
  if (script.startsWith("generate:")) return "generate-" + script.slice("generate:".length);
  // prototype:hub -> generate-prototype-hub.
  if (script === "prototype:hub") return "prototype-hub";
  // Fallback: reemplazar ":" por "-".
  return script.replace(/:/g, "-");
}

// v12.25: persistencia del audit trail. Inserta una fila al inicio y la
// actualiza al final. Si la BD no esta disponible, no rompe la ejecucion.
function persistRunBegin(db, plan, mode, origin) {
  if (!db) return null;
  try {
    const argvJson = JSON.stringify(plan.argv.map((p) => p.replace(/^.*[\\/]/, (m, i) => i === 0 ? m : m)));
    const stmt = db.prepare(`
      INSERT INTO ai_action_runs(action_id, arg, argv, mode, origin, started_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(plan.action.id, plan.userArgRaw || null, argvJson, mode, origin, new Date().toISOString());
    return Number(res.lastInsertRowid);
  } catch { return null; }
}

function tailString(s, max) {
  if (!s) return null;
  const str = String(s);
  return str.length > max ? str.slice(str.length - max) : str;
}

function persistRunEnd(db, runId, result) {
  if (!db || !runId) return;
  try {
    db.prepare(`
      UPDATE ai_action_runs SET
        finished_at = ?, exit_code = ?, signal = ?, duration_ms = ?,
        timed_out = ?, cancelled = ?, stdout_tail = ?, stderr_tail = ?
      WHERE id = ?
    `).run(
      new Date().toISOString(),
      result.exitCode == null ? null : Number(result.exitCode),
      result.signal || null,
      result.durationMs == null ? null : Number(result.durationMs),
      result.timedOut ? 1 : 0,
      result.cancelled ? 1 : 0,
      tailString(result.stdout, TAIL_BYTES),
      tailString(result.stderr, TAIL_BYTES),
      runId,
    );
  } catch { /* no-op */ }
}

// v12.89: registra de un solo golpe una corrida YA terminada (begin+end juntos).
// Lo usan `npm run validate` y el git hook para que las corridas de TERMINAL
// tambien aparezcan en el semaforo del panel (antes solo contaban las del panel/agente).
function recordActionRun(db, { actionId, exitCode, durationMs = null, origin = "cli", arg = null, argv = null }) {
  if (!db || !actionId) return null;
  try {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO ai_action_runs(action_id, arg, argv, mode, origin, started_at, finished_at, exit_code, duration_ms, cancelled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
    const res = stmt.run(
      actionId,
      arg,
      argv ? JSON.stringify(argv) : null,
      "sync",
      origin,
      now,
      now,
      exitCode == null ? null : Number(exitCode),
      durationMs == null ? null : Number(durationMs),
    );
    return Number(res.lastInsertRowid);
  } catch { return null; }
}

// v12.25: solo el server live tiene la BD abierta; runExecAction/stream
// reciben opcionalmente db via parametros nuevos.
let __serverDb = null;

// v12.30: notificacion via webhook cuando aparece una alerta nueva.
// Configurable via env:
//   MEMORY_ALERTS_WEBHOOK_URL = https://hooks.slack.com/services/... (o cualquier endpoint POST)
//   MEMORY_ALERTS_WEBHOOK_FORMAT = slack (default) | json
// Para evitar spam, registramos cada alerta notificada en ai_alert_notifications
// con un fingerprint (action_id::consecutive_failures::latest_started_at slice 10).
// Solo se re-notifica si el fingerprint cambia.
async function maybeNotifyAlerts(db, alerts) {
  const webhookUrl = process.env.MEMORY_ALERTS_WEBHOOK_URL;
  if (!webhookUrl || !alerts || !alerts.length) return { sent: 0, skipped: 0 };
  const format = (process.env.MEMORY_ALERTS_WEBHOOK_FORMAT || "slack").toLowerCase();
  // v12.32: plantilla custom opcional. Acepta inline (MEMORY_ALERTS_WEBHOOK_TEMPLATE)
  // o archivo (MEMORY_ALERTS_WEBHOOK_TEMPLATE_FILE). Variables soportadas:
  //   {action_id} {consecutive_failures} {window} {last_success}
  //   {latest_started_at} {kind} {detail} {timestamp}
  // El resultado debe ser JSON valido — el body se envia tal cual al webhook.
  let templateStr = null;
  const tplFile = process.env.MEMORY_ALERTS_WEBHOOK_TEMPLATE_FILE;
  if (tplFile && fs.existsSync(tplFile)) {
    try { templateStr = fs.readFileSync(tplFile, "utf8"); } catch {}
  }
  if (!templateStr && process.env.MEMORY_ALERTS_WEBHOOK_TEMPLATE) {
    templateStr = process.env.MEMORY_ALERTS_WEBHOOK_TEMPLATE;
  }
  const interpolate = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    if (v == null) return "";
    return String(v).replace(/"/g, '\\"').replace(/\n/g, "\\n");
  });
  const checkStmt = db.prepare(`SELECT 1 FROM ai_alert_notifications WHERE action_id = ? AND fingerprint = ?`);
  const insertStmt = db.prepare(`INSERT INTO ai_alert_notifications(action_id, fingerprint, webhook_status) VALUES (?, ?, ?)`);
  let sent = 0, skipped = 0;
  for (const a of alerts) {
    const kind = a.kind || "failure-streak";
    const fp = `${kind}::${a.consecutive_failures || a.detail || ""}::${(a.latest_started_at || "").slice(0, 10)}`;
    if (checkStmt.get(a.action_id, fp)) { skipped += 1; continue; }
    const vars = {
      action_id: a.action_id,
      consecutive_failures: a.consecutive_failures || 0,
      window: a.window || 0,
      last_success: a.last_success || "nunca",
      latest_started_at: a.latest_started_at || "",
      kind,
      detail: a.detail || "",
      timestamp: new Date().toISOString(),
    };
    let body;
    if (templateStr) {
      body = interpolate(templateStr, vars);
    } else if (format === "slack") {
      const headline = kind === "duration-threshold"
        ? `⚠ *${a.action_id}*: ${a.detail}`
        : `⚠ *${a.action_id}*: ${a.consecutive_failures} fallos consecutivos`;
      const blockText = kind === "duration-threshold"
        ? `${headline} (umbral excedido).\nUltimo intento: ${a.latest_started_at}.`
        : `${headline} en ventana de ${a.window} runs.\nUltimo OK: ${a.last_success || "nunca"}.\nUltimo intento: ${a.latest_started_at}.`;
      body = JSON.stringify({ text: headline, blocks: [{ type: "section", text: { type: "mrkdwn", text: blockText } }] });
    } else {
      body = JSON.stringify({ event: "memory_alert", alert: a, timestamp: vars.timestamp });
    }
    // v12.45 (C3): retry con backoff exponencial. Configurable via env:
    //   MEMORY_ALERTS_WEBHOOK_RETRIES (default 3)
    //   MEMORY_ALERTS_WEBHOOK_BACKOFF_MS (default 500)
    // Estrategia: 5xx y errores de red disparan retry; 4xx no (peticion mal formada).
    // El delay entre intentos es backoffMs * 2^attempt con jitter [+0..+25%].
    const maxRetries = Math.max(0, Number(process.env.MEMORY_ALERTS_WEBHOOK_RETRIES ?? 3));
    const backoffMs = Math.max(100, Number(process.env.MEMORY_ALERTS_WEBHOOK_BACKOFF_MS ?? 500));
    let status = 0, attempts = 0, lastErr = null;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      attempts = attempt + 1;
      try {
        const r = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        status = r.status;
        if (status >= 200 && status < 300) { sent += 1; lastErr = null; break; }
        if (status >= 400 && status < 500) {
          // 4xx no se reintenta (request mal formada o auth invalida).
          lastErr = `HTTP ${status}`;
          break;
        }
        // 5xx -> reintentar.
        lastErr = `HTTP ${status}`;
      } catch (err) {
        lastErr = err.message || String(err);
      }
      if (attempt < maxRetries) {
        const wait = backoffMs * Math.pow(2, attempt);
        const jitter = wait * (Math.random() * 0.25);
        await new Promise((rs) => setTimeout(rs, Math.round(wait + jitter)));
      }
    }
    if (lastErr) {
      console.error(`Webhook fallo para ${a.action_id} tras ${attempts} intento(s): ${lastErr}`);
    }
    try { insertStmt.run(a.action_id, fp, status); } catch {}
  }
  return { sent, skipped };
}

// v12.26: housekeeping del audit trail. Se corre una vez al boot del server
// y luego periodicamente. Hace dos cosas:
//   1) Marca como cancelled=1 los runs huerfanos (finished_at=NULL) cuyo
//      started_at sea anterior a `orphanCutoffMs` (default: 1 hora).
//      Estos quedan asi cuando el server muere mid-flight.
//   2) Borra runs cuyo started_at sea anterior a `retainDays` dias.
//      Configurable via env MEMORY_ACTIONS_RETAIN_DAYS (default 30).
function housekeepActionRuns(db, { orphanCutoffMs = 60 * 60 * 1000, retainDays = null } = {}) {
  if (!db) return { orphans: 0, purged: 0, snoozesExpired: 0 };
  const stats = { orphans: 0, purged: 0, snoozesExpired: 0 };
  try {
    const orphanIso = new Date(Date.now() - orphanCutoffMs).toISOString();
    const r1 = db.prepare(`
      UPDATE ai_action_runs
      SET finished_at = ?, cancelled = 1,
          stderr_tail = COALESCE(stderr_tail, '') || ?
      WHERE finished_at IS NULL AND started_at < ?
    `).run(new Date().toISOString(), "\n[orphan: marcado al boot, server murio mid-flight]\n", orphanIso);
    stats.orphans = r1.changes || 0;
  } catch { /* table may not exist yet on very old DBs */ }
  const days = Number(retainDays != null ? retainDays : (process.env.MEMORY_ACTIONS_RETAIN_DAYS ?? 30));
  if (Number.isFinite(days) && days > 0) {
    try {
      const cutoffIso = new Date(Date.now() - days * 86400 * 1000).toISOString();
      const r2 = db.prepare(`DELETE FROM ai_action_runs WHERE started_at < ?`).run(cutoffIso);
      stats.purged = r2.changes || 0;
    } catch { /* no-op */ }
  }
  // v12.32: purgar snoozes cuyo expires_at ya paso. Los snoozes 'forever'
  // (expires_at IS NULL) se preservan; solo se eliminan los con timestamp pasado.
  try {
    const nowIso = new Date().toISOString();
    const r3 = db.prepare(`DELETE FROM ai_action_snoozes WHERE expires_at IS NOT NULL AND expires_at < ?`).run(nowIso);
    stats.snoozesExpired = r3.changes || 0;
  } catch { /* no-op */ }
  return stats;
}

// Compila la spec runtime de una accion (argv + validaciones). Comun para
// modo sync y modo streaming.
function buildExecPlan(root, dbPath, actionId, userArg) {
  const action = EXEC_ACTIONS.find((a) => a.id === actionId);
  if (!action) return { error: { status: 404, message: `Accion desconocida: ${actionId}` } };
  if (action.arg) {
    const value = String(userArg || "").trim();
    if (action.arg.required && !value) return { error: { status: 400, message: `Esta accion requiere arg ${action.arg.name}` } };
    if (value && action.arg.regex && !new RegExp(action.arg.regex).test(value)) {
      return { error: { status: 400, message: `arg invalido: debe coincidir /${action.arg.regex}/` } };
    }
  }
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  const agentPath = path.resolve(here, "ai-framework-agent.mjs");
  let argv;
  let cmd = process.execPath;
  let useShell = false;
  // v12.75: comandos universales — npmScript (compuesto npm) o scriptPath (scripts/*.mjs).
  if (action.npmScript) {
    cmd = process.platform === "win32" ? "npm.cmd" : "npm";
    argv = ["run", action.npmScript];
    useShell = process.platform === "win32"; // npm.cmd requiere shell en Windows
    if (Array.isArray(action.defaultArgs)) argv.push(...action.defaultArgs);
    return { action, cmd, argv, shell: useShell, userArgRaw: userArg || null };
  }
  if (action.scriptPath) {
    argv = [path.resolve(root, action.scriptPath)];
  } else if (action.ciScript) {
    argv = [path.resolve(root, "ci", "scripts", action.ciScript)];
  } else {
    argv = [agentPath, ...action.argv];
  }
  // v12.45: defaultArgs son flags fijos que el panel pasa siempre (ej. --warn-only).
  if (Array.isArray(action.defaultArgs)) argv.push(...action.defaultArgs);
  if (action.arg && userArg) argv.push(action.arg.name, String(userArg));
  // v12.30: solo agregar --db si el script lo entiende.
  // ai-framework-agent.mjs lo acepta siempre. Los ci/scripts solo si declaran acceptsDb=true.
  // Los scripts/*.mjs (scriptPath) usan --root, no --db.
  const supportsDb = action.scriptPath ? false : (action.ciScript ? action.acceptsDb === true : true);
  if (supportsDb) argv.push("--db", dbPath);
  return { action, cmd, argv, shell: useShell, userArgRaw: userArg || null };
}

// Modo sync (legacy v12.23): bloquea hasta terminar, devuelve stdout/stderr completos.
async function runExecAction(root, dbPath, actionId, userArg) {
  const plan = buildExecPlan(root, dbPath, actionId, userArg);
  if (plan.error) return { ok: false, status: plan.error.status, error: plan.error.message };
  if (__execJob) return { ok: false, status: 409, error: `Ya hay un job corriendo: ${__execJob.actionId} (pid ${__execJob.pid})` };

  const startedAt = Date.now();
  __execJob = { actionId, pid: null, child: null, mode: "sync" };
  const runId = persistRunBegin(__serverDb, plan, "sync", "ui");
  const child = spawnSync(plan.cmd || process.execPath, plan.argv, { cwd: root, encoding: "utf8", timeout: EXEC_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024, shell: plan.shell || false });
  __execJob = null;
  const timedOut = child.error && /ETIMEDOUT/i.test(String(child.error));
  const result = {
    actionId,
    argv: plan.argv.map((p) => p.replace(root, "<root>")),
    exitCode: child.status,
    signal: child.signal,
    durationMs: Date.now() - startedAt,
    stdout: child.stdout || "",
    stderr: child.stderr || "",
    timedOut,
    cancelled: !!child.signal && !timedOut,
  };
  persistRunEnd(__serverDb, runId, result);
  return { ok: true, status: 200, body: result };
}

// v12.24: modo streaming. Llama onEvent({ type, data }) para cada chunk.
//   type 'meta'   -> { actionId, argv, pid, startedAt }
//   type 'stdout' -> { chunk }
//   type 'stderr' -> { chunk }
//   type 'exit'   -> { exitCode, signal, durationMs, timedOut }
//   type 'error'  -> { message }
// Devuelve una promesa que resuelve cuando el child termina.
async function streamExecAction(root, dbPath, actionId, userArg, onEvent) {
  const plan = buildExecPlan(root, dbPath, actionId, userArg);
  if (plan.error) {
    onEvent({ type: "error", data: { status: plan.error.status, message: plan.error.message } });
    return;
  }
  if (__execJob) {
    onEvent({ type: "error", data: { status: 409, message: `Ya hay un job corriendo: ${__execJob.actionId} (pid ${__execJob.pid})` } });
    return;
  }
  const startedAt = Date.now();
  const runId = persistRunBegin(__serverDb, plan, "stream", "ui");
  const child = spawn(plan.cmd || process.execPath, plan.argv, { cwd: root, shell: plan.shell || false });
  __execJob = { actionId, pid: child.pid, child, mode: "stream", startedAt, runId };
  const argvSafe = plan.argv.map((p) => p.replace(root, "<root>"));
  onEvent({ type: "meta", data: { actionId, argv: argvSafe, pid: child.pid, startedAt, runId } });
  let acc = { stdout: "", stderr: "" };

  const timer = setTimeout(() => {
    try { child.kill("SIGTERM"); } catch {}
    onEvent({ type: "stderr", data: { chunk: `\n[timeout ${EXEC_TIMEOUT_MS / 1000}s alcanzado, enviado SIGTERM]\n` } });
  }, EXEC_TIMEOUT_MS);

  let timedOut = false;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { acc.stdout = (acc.stdout + chunk).slice(-TAIL_BYTES); onEvent({ type: "stdout", data: { chunk } }); });
  child.stderr.on("data", (chunk) => { acc.stderr = (acc.stderr + chunk).slice(-TAIL_BYTES); onEvent({ type: "stderr", data: { chunk } }); });

  return new Promise((resolve) => {
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const wasCancelled = !!signal && !timedOut;
      __execJob = null;
      persistRunEnd(__serverDb, runId, {
        exitCode: code, signal, durationMs: Date.now() - startedAt,
        timedOut, cancelled: wasCancelled, stdout: acc.stdout, stderr: acc.stderr,
      });
      onEvent({
        type: "exit",
        data: {
          exitCode: code,
          signal,
          durationMs: Date.now() - startedAt,
          timedOut,
          cancelled: wasCancelled,
        },
      });
      resolve();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      __execJob = null;
      persistRunEnd(__serverDb, runId, {
        exitCode: null, signal: null, durationMs: Date.now() - startedAt,
        timedOut: false, cancelled: false, stdout: acc.stdout, stderr: acc.stderr,
      });
      onEvent({ type: "error", data: { message: err.message || String(err) } });
      resolve();
    });
  });
}

// v12.24: cancela el job en curso si existe. SIGTERM por defecto; si tras
// 3s sigue vivo, escala a SIGKILL.
function cancelExecAction() {
  if (!__execJob || !__execJob.child) return { ok: false, status: 404, error: "No hay job en curso" };
  const job = __execJob;
  try { job.child.kill("SIGTERM"); } catch (e) {
    return { ok: false, status: 500, error: `No se pudo enviar SIGTERM: ${e.message}` };
  }
  setTimeout(() => {
    if (__execJob && __execJob.pid === job.pid) {
      try { job.child.kill("SIGKILL"); } catch {}
    }
  }, 3000);
  return { ok: true, status: 202, body: { cancelling: job.actionId, pid: job.pid } };
}

async function serveMemory(root, db, dbPath, port) {
  // v12.25: cachear handle de la BD para que persistRunBegin/End del audit
  // trail de acciones encuentren la conexion abierta sin re-abrir por job.
  __serverDb = db;
  // v12.26: housekeeping al boot + cada hora. Marca huerfanos y purga viejos.
  const houseInit = housekeepActionRuns(db);
  if (houseInit.orphans > 0 || houseInit.purged > 0 || houseInit.snoozesExpired > 0) {
    console.log(`Housekeeping audit trail: ${houseInit.orphans} huerfanos marcados, ${houseInit.purged} viejos purgados, ${houseInit.snoozesExpired} snoozes expirados.`);
  }
  setInterval(() => { try { housekeepActionRuns(db); } catch {} }, 60 * 60 * 1000).unref();

  // v12.30/v12.32: chequeo periodico de alertas (failure-streak + duration-threshold)
  // para webhook externo. Solo si MEMORY_ALERTS_WEBHOOK_URL esta configurado.
  const slowThresholdPctEnv = Math.max(0, Number(process.env.MEMORY_ALERTS_SLOW_PCT ?? 50));
  const computeActiveAlerts = () => {
    const snoozedNow = new Set(db.prepare(`SELECT action_id FROM ai_action_snoozes WHERE expires_at IS NULL OR expires_at > ?`).all(new Date().toISOString()).map((r) => r.action_id));
    const actionIds = db.prepare(`SELECT DISTINCT action_id FROM ai_action_runs WHERE finished_at IS NOT NULL`).all().map((r) => r.action_id);
    const alerts = [];
    for (const aid of actionIds) {
      if (snoozedNow.has(aid)) continue;
      const runs = db.prepare(`SELECT exit_code, signal, cancelled, started_at, duration_ms FROM ai_action_runs WHERE action_id = ? AND finished_at IS NOT NULL ORDER BY started_at DESC LIMIT 5`).all(aid);
      let streak = 0;
      for (const r of runs) { const fail = r.cancelled !== 1 && r.exit_code !== 0 && r.exit_code !== null; if (fail) streak += 1; else break; }
      if (streak >= 3) {
        alerts.push({
          kind: "failure-streak",
          action_id: aid, consecutive_failures: streak, window: 5,
          last_success: db.prepare(`SELECT started_at FROM ai_action_runs WHERE action_id = ? AND exit_code = 0 AND cancelled = 0 ORDER BY started_at DESC LIMIT 1`).get(aid)?.started_at || null,
          latest_started_at: runs[0]?.started_at || null,
        });
      }
      if (slowThresholdPctEnv > 0) {
        const last = runs[0];
        if (last && last.duration_ms != null && last.exit_code === 0) {
          const okDur = db.prepare(`SELECT duration_ms FROM ai_action_runs WHERE action_id = ? AND exit_code = 0 AND cancelled = 0 AND duration_ms IS NOT NULL AND started_at < ? ORDER BY duration_ms ASC`).all(aid, last.started_at).map((r) => r.duration_ms);
          if (okDur.length >= 5) {
            const p95 = okDur[Math.min(okDur.length - 1, Math.floor(okDur.length * 0.95))];
            const threshold = p95 * (1 + slowThresholdPctEnv / 100);
            if (last.duration_ms > threshold) {
              alerts.push({
                kind: "duration-threshold",
                action_id: aid,
                detail: `${last.duration_ms}ms > umbral ${Math.round(threshold)}ms (p95=${p95}ms +${slowThresholdPctEnv}%)`,
                duration_ms: last.duration_ms, p95_ms: p95, threshold_ms: Math.round(threshold),
                latest_started_at: last.started_at,
              });
            }
          }
        }
      }
    }
    return alerts;
  };
  if (process.env.MEMORY_ALERTS_WEBHOOK_URL) {
    const tickAlerts = async () => {
      try {
        const alerts = computeActiveAlerts();
        const result = await maybeNotifyAlerts(db, alerts);
        if (result.sent > 0) console.log(`Webhook alerts: ${result.sent} enviadas, ${result.skipped} ya notificadas.`);
      } catch (e) { console.error(`Webhook tick fallo: ${e.message || e}`); }
    };
    tickAlerts();
    setInterval(tickAlerts, 5 * 60 * 1000).unref(); // cada 5 minutos
  }
  const http = await import("node:http");
  const liveHtml = memoryHtmlShell('window["__" + "MEMORY__"] = null; window["__" + "MEMORY" + "_MODE__"] = "live";');
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      if (url.pathname === "/" || url.pathname === "/index.html") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(liveHtml);
        return;
      }
      if (url.pathname === "/api/snapshot") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(buildMemorySnapshot(db, dbPath, "live")));
        return;
      }
      // v12.58: contrato de ejecucion por fase (todas las fases o una especifica).
      if (url.pathname === "/api/roadmap/contract" || url.pathname.startsWith("/api/roadmap/contract/")) {
        const phaseMatch = url.pathname.match(/^\/api\/roadmap\/contract\/(\d+)$/);
        const phaseContractsModulePath = path.join(process.cwd(), "ci", "scripts", "_lib", "phase-contracts.mjs");
        if (!fs.existsSync(phaseContractsModulePath)) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "ci/scripts/_lib/phase-contracts.mjs no existe. Corre: npm run template:upgrade -- --apply" }));
          return;
        }
        const fileUrl = "file:///" + phaseContractsModulePath.replace(/\\/g, "/");
        // Import dinamico no-bloqueante (then-chain en handler no-async).
        import(fileUrl).then((mod) => {
          if (phaseMatch) {
            const phaseId = Number(phaseMatch[1]);
            const contract = mod.getPhaseContract(phaseId);
            if (!contract) {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: `Fase ${phaseId} no existe (validas: 0-8)` }));
              return;
            }
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify(contract, null, 2));
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(mod.getAllPhaseContracts(), null, 2));
        }).catch((e) => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e.message || e) }));
        });
        return;
      }
      // v12.59: contract-status — cruza el contrato de una fase con la BD inteligente
      // (ai_action_runs) para mostrar QUE HACER (debeValidar) + un CHECK de QUE SE EJECUTO.
      // Esto alinea el roadmap (documentacion viva) con la BD de ejecuciones reales.
      if (url.pathname.startsWith("/api/roadmap/contract-status/")) {
        const phaseMatch = url.pathname.match(/^\/api\/roadmap\/contract-status\/(\d+)$/);
        if (!phaseMatch) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "uso: /api/roadmap/contract-status/<phase-id>" }));
          return;
        }
        const phaseContractsModulePath = path.join(process.cwd(), "ci", "scripts", "_lib", "phase-contracts.mjs");
        if (!fs.existsSync(phaseContractsModulePath)) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "phase-contracts.mjs no existe. Corre: npm run template:upgrade -- --apply" }));
          return;
        }
        const fileUrl = "file:///" + phaseContractsModulePath.replace(/\\/g, "/");
        import(fileUrl).then((mod) => {
          const phaseId = Number(phaseMatch[1]);
          const contract = mod.getPhaseContract(phaseId);
          if (!contract) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: `Fase ${phaseId} no existe (0-8)` }));
            return;
          }
          // Cruzar cada comando de debeValidar con ai_action_runs.
          const validations = (contract.debeValidar || []).map((cmd) => {
            const actionId = npmCommandToActionId(cmd);
            let lastRun = null;
            if (actionId && db) {
              try {
                lastRun = db.prepare(`
                  SELECT action_id, exit_code, started_at, duration_ms
                  FROM ai_action_runs
                  WHERE action_id = ?
                  ORDER BY started_at DESC LIMIT 1
                `).get(actionId);
              } catch { /* tabla puede no existir */ }
            }
            let status = "never";       // nunca ejecutado
            if (lastRun) status = lastRun.exit_code === 0 ? "passed" : "failed";
            return {
              command: cmd,
              action_id: actionId,
              status,                    // never | passed | failed
              last_exit_code: lastRun ? lastRun.exit_code : null,
              last_run: lastRun ? lastRun.started_at : null,
              duration_ms: lastRun ? lastRun.duration_ms : null,
            };
          });
          const executed = validations.filter((v) => v.status !== "never").length;
          const passed = validations.filter((v) => v.status === "passed").length;
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({
            phase: phaseId,
            name: contract.name,
            validations,
            summary: { total: validations.length, executed, passed, never: validations.length - executed },
          }, null, 2));
        }).catch((e) => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e.message || e) }));
        });
        return;
      }
      // v12.56: roadmap next — recomienda la siguiente accion segura.
      if (url.pathname === "/api/roadmap/next") {
        try {
          const rootDir = process.cwd();
          const scriptPath = path.join(rootDir, "scripts", "roadmap-next.mjs");
          if (!fs.existsSync(scriptPath)) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "roadmap-next.mjs no existe. Corre: npm run template:upgrade -- --apply" }));
            return;
          }
          const child = spawnSync(process.execPath, [scriptPath, "--root", rootDir], { encoding: "utf8", timeout: 15000 });
          if (child.status !== 0 || !child.stdout) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "roadmap-next fallo", stderr: child.stderr?.slice(0, 500) }));
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(child.stdout);
          return;
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e.message || e) }));
          return;
        }
      }
      // v12.54: roadmap status para el panel embebido.
      // Shell-exec del script roadmap-status.mjs con --json para mantener una sola fuente de verdad.
      if (url.pathname === "/api/roadmap/status") {
        try {
          // dbPath puede ser .../ai/memory/x.db. Subir 3 niveles llega al proyecto root.
          // O usar cwd del proceso server (donde se invoco memory-serve).
          const rootDir = process.cwd();
          const scriptPath = path.join(rootDir, "scripts", "roadmap-status.mjs");
          if (!fs.existsSync(scriptPath)) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "roadmap-status.mjs no existe en este proyecto. Corre: npm run template:upgrade -- --apply" }));
            return;
          }
          const child = spawnSync(process.execPath, [scriptPath, "--json", "--root", rootDir], { encoding: "utf8", timeout: 15000 });
          if (child.status !== 0 || !child.stdout) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "roadmap-status fallo", stderr: child.stderr?.slice(0, 500) }));
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(child.stdout);
          return;
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e.message || e) }));
          return;
        }
      }
      // v12.54: comandos recientes ejecutados + sugeridos segun roadmap.
      // Combina las ultimas 20 ai_action_runs con la nextAction recomendada.
      if (url.pathname === "/api/roadmap/commands") {
        try {
          // Recientes ejecutados.
          let recent = [];
          try {
            recent = db.prepare(`
              SELECT id, action_id, arg, mode, started_at, finished_at, exit_code, duration_ms, cancelled, timed_out
              FROM ai_action_runs
              ORDER BY started_at DESC
              LIMIT 30
            `).all();
          } catch { /* tabla puede no existir */ }
          // Sugeridos: derivar de roadmap-status nextAction + mapeo phase -> commands.
          const phaseCommands = {
            0: [{ id: "memory:bootstrap", reason: "Inicializar BD del agente" }],
            1: [{ id: "memory:sync", reason: "Sincronizar matriz de requerimientos" }],
            2: [{ id: "scaffold:feature", reason: "Generar feature canonica" }, { id: "scaffold:prototype", reason: "Copiar golden HTML5 del dominio" }, { id: "prototype:contract", reason: "Ver el contrato del prototipo (que debe contener)" }, { id: "check:prototype-contract", reason: "Validar que el prototipo cumple su contrato" }, { id: "prototype:hub", reason: "Regenerar hub" }],
            3: [{ id: "check:bd-documented", reason: "Validar BD" }, { id: "check:api-documented", reason: "Validar API" }],
            4: [{ id: "generate:openapi", reason: "Consolidar contrato API" }],
            5: [{ id: "memory:harvest-trace", reason: "Cosechar @trace del codigo" }, { id: "check:trace-coverage", reason: "Verificar cobertura" }],
            6: [{ id: "check:test-documented", reason: "Validar tests con @covers" }],
            7: [{ id: "check:runbook-documented", reason: "Validar runbooks" }],
            8: [{ id: "check:all", reason: "Validacion final completa" }],
          };
          // Suggerir comandos transversales siempre disponibles.
          const universalCommands = [
            { id: "memory:sync", reason: "Re-sincronizar memoria (cualquier momento)" },
            { id: "check:project", reason: "Validador completo (10+ checks)" },
            { id: "roadmap:status", reason: "Ver estado del roadmap" },
            { id: "template:upgrade", reason: "Sincronizar con template canonico" },
          ];
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ recent, phaseCommands, universalCommands }));
          return;
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e.message || e) }));
          return;
        }
      }
      // v12.70: visor de proyecto — arbol de archivos.
      if (url.pathname === "/api/files/tree") {
        try {
          const rootDir = process.cwd();
          const tree = buildFileTree(rootDir);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(tree));
          return;
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e.message || e) }));
          return;
        }
      }
      // v12.70: visor de proyecto — contenido de un archivo (con guard de path traversal).
      if (url.pathname === "/api/files/read") {
        try {
          const rootDir = process.cwd();
          const rel = (url.searchParams.get("path") || "").replace(/\\/g, "/").replace(/^\/+/, "");
          const abs = path.resolve(rootDir, rel);
          // Guard: el archivo debe vivir bajo rootDir (sin escapar con ..).
          if (abs !== rootDir && !abs.startsWith(rootDir + path.sep)) {
            res.writeHead(403, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "ruta fuera del proyecto" }));
            return;
          }
          if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "archivo no encontrado" }));
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(readFileForViewer(abs, rel)));
          return;
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e.message || e) }));
          return;
        }
      }
      // v12.80: panel multiagente — tablero de locks (GET) + claim/release (POST).
      if (url.pathname === "/api/locks" && req.method === "GET") {
        const rootDir = process.cwd();
        const alPath = path.join(rootDir, "ci", "scripts", "_lib", "agent-locks.mjs");
        const flPath = path.join(rootDir, "ci", "scripts", "_lib", "feature-filter.mjs");
        if (!fs.existsSync(alPath) || !fs.existsSync(flPath)) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Falta ci/scripts/_lib/agent-locks.mjs. Corre: npm run template:upgrade -- --apply --force-framework" }));
          return;
        }
        const psPath = path.join(rootDir, "ci", "scripts", "_lib", "prototype-state.mjs");
        const toUrl = (p) => "file:///" + p.replace(/\\/g, "/");
        Promise.all([
          import(toUrl(alPath)),
          import(toUrl(flPath)),
          fs.existsSync(psPath) ? import(toUrl(psPath)) : Promise.resolve(null),
        ]).then(([al, fl, ps]) => {
          const slugs = fl.listIncludedFeatures(rootDir);
          const locks = al.listLocks(rootDir);
          const lockBy = {};
          for (const l of locks) lockBy[l.feature] = l;
          const rows = slugs.map((s) => ({
            slug: s,
            prototype_state: ps ? ps.computePrototypeState(rootDir, s).state : null,
            lock: lockBy[s] || null,
          }));
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ rows, locks }));
        }).catch((e) => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e.message || e) }));
        });
        return;
      }
      if ((url.pathname === "/api/locks/claim" || url.pathname === "/api/locks/release") && req.method === "POST") {
        const origin = req.headers.origin || "";
        if (origin && origin !== `http://localhost:${port}` && origin !== `http://127.0.0.1:${port}`) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Origin no permitido: ${origin}` }));
          return;
        }
        const isClaim = url.pathname.endsWith("/claim");
        let body = "";
        req.on("data", (chunk) => { body += chunk; if (body.length > 4096) req.destroy(); });
        req.on("end", () => {
          let payload;
          try { payload = JSON.parse(body || "{}"); } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "JSON invalido" }));
            return;
          }
          const rootDir = process.cwd();
          const alPath = path.join(rootDir, "ci", "scripts", "_lib", "agent-locks.mjs");
          if (!fs.existsSync(alPath)) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Falta agent-locks.mjs (template:upgrade --force-framework)" }));
            return;
          }
          import("file:///" + alPath.replace(/\\/g, "/")).then((al) => {
            let result;
            if (payload.prune) {
              result = { ok: true, pruned: al.pruneExpired(rootDir) };
            } else if (isClaim) {
              result = al.claim(rootDir, String(payload.feature || ""), String(payload.agent || ""), {
                task: payload.task || null,
                ttlMin: payload.ttl ? Number(payload.ttl) : undefined,
                force: !!payload.force,
              });
            } else {
              result = al.release(rootDir, String(payload.feature || ""), payload.agent ? String(payload.agent) : null, { force: !!payload.force });
            }
            res.writeHead(result.ok ? 200 : 409, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify(result));
          }).catch((e) => {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: String(e.message || e) }));
          });
        });
        return;
      }
      if (url.pathname === "/api/search") {
        const q = url.searchParams.get("q") || "";
        // chunkLimit acota solo los chunks; la metadata se devuelve completa.
        const chunkLimit = Number(url.searchParams.get("chunkLimit") || url.searchParams.get("limit") || 30);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(searchAll(db, q, chunkLimit)));
        return;
      }
      if (url.pathname === "/api/presets") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(MEMORY_QUERY_PRESETS));
        return;
      }
      if (url.pathname === "/api/query") {
        const preset = url.searchParams.get("preset") || "";
        const arg = url.searchParams.get("arg") || "";
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(runMemoryQuery(db, preset, arg)));
        return;
      }
      // v12.26: export del historial completo en CSV o JSON.
      // Usa Content-Disposition: attachment para que el navegador descargue.
      if (url.pathname === "/api/action-runs/export") {
        const format = (url.searchParams.get("format") || "json").toLowerCase();
        const rows = db.prepare(`
          SELECT id, action_id, arg, mode, origin, started_at, finished_at,
                 exit_code, signal, duration_ms, timed_out, cancelled,
                 stdout_tail, stderr_tail
          FROM ai_action_runs
          ORDER BY started_at DESC
        `).all();
        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        if (format === "csv") {
          const headers = ["id","action_id","arg","mode","origin","started_at","finished_at","exit_code","signal","duration_ms","timed_out","cancelled","stdout_tail","stderr_tail"];
          const csvEscape = (v) => {
            if (v == null) return "";
            const s = String(v);
            return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          };
          const csv = [headers.join(",")].concat(rows.map((r) => headers.map((h) => csvEscape(r[h])).join(","))).join("\r\n");
          res.writeHead(200, {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="action-runs-${stamp}.csv"`,
          });
          res.end(csv);
          return;
        }
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="action-runs-${stamp}.json"`,
        });
        res.end(JSON.stringify(rows, null, 2));
        return;
      }
      // v12.29: dashboard de tendencias — agregado global por dia con
      // success_rate, volumen y comparacion periodo actual vs anterior.
      // Parametros: days=N (default 30, max 180), action_id=X (opcional).
      // Devuelve { days:[ISO,...], series:[{day, total, ok, fail, cancelled, avg_ms, success_rate}], compare:{current:{total,ok,success_rate}, previous:{...}, delta_pct} }
      if (url.pathname === "/api/action-runs/dashboard") {
        const days = Math.min(180, Math.max(7, Number(url.searchParams.get("days") || 30)));
        const filterAction = (url.searchParams.get("action_id") || "").trim();
        const params = [];
        const where = ["started_at >= ?"];
        const sinceIso = new Date(Date.now() - days * 86400 * 1000).toISOString();
        params.push(sinceIso);
        if (filterAction) { where.push("action_id = ?"); params.push(filterAction); }
        const whereSql = where.join(" AND ");
        const dailyRows = db.prepare(`
          SELECT substr(started_at, 1, 10) AS day,
                 COUNT(*) AS total,
                 SUM(CASE WHEN exit_code = 0 AND cancelled = 0 THEN 1 ELSE 0 END) AS ok,
                 SUM(CASE WHEN exit_code != 0 AND cancelled = 0 AND exit_code IS NOT NULL THEN 1 ELSE 0 END) AS fail,
                 SUM(CASE WHEN cancelled = 1 THEN 1 ELSE 0 END) AS cancelled,
                 ROUND(AVG(duration_ms)) AS avg_ms
          FROM ai_action_runs
          WHERE ${whereSql}
          GROUP BY day
          ORDER BY day ASC
        `).all(...params);
        // Rellenar dias faltantes con ceros para que el chart tenga eje continuo.
        const allDays = [];
        const startMs = Date.now() - (days - 1) * 86400 * 1000;
        for (let i = 0; i < days; i += 1) {
          allDays.push(new Date(startMs + i * 86400 * 1000).toISOString().slice(0, 10));
        }
        const byDay = {};
        for (const r of dailyRows) byDay[r.day] = r;
        const series = allDays.map((d) => {
          const r = byDay[d] || { day: d, total: 0, ok: 0, fail: 0, cancelled: 0, avg_ms: null };
          r.success_rate = r.total > 0 ? +(100 * r.ok / r.total).toFixed(1) : null;
          return r;
        });
        // Comparacion periodo actual vs anterior (mitad reciente vs mitad anterior).
        const halfDays = Math.floor(days / 2);
        const current = series.slice(-halfDays);
        const previous = series.slice(0, halfDays);
        const agg = (arr) => arr.reduce((acc, r) => ({ total: acc.total + r.total, ok: acc.ok + r.ok, fail: acc.fail + r.fail, cancelled: acc.cancelled + r.cancelled }), { total: 0, ok: 0, fail: 0, cancelled: 0 });
        const cur = agg(current);
        const prev = agg(previous);
        cur.success_rate = cur.total > 0 ? +(100 * cur.ok / cur.total).toFixed(1) : null;
        prev.success_rate = prev.total > 0 ? +(100 * prev.ok / prev.total).toFixed(1) : null;
        const delta_volume_pct = prev.total > 0 ? +(100 * (cur.total - prev.total) / prev.total).toFixed(1) : null;
        const delta_success_pp = (cur.success_rate != null && prev.success_rate != null) ? +(cur.success_rate - prev.success_rate).toFixed(1) : null;
        // Top 5 acciones por volumen en el periodo (para mostrar tabla complementaria).
        const topByAction = db.prepare(`
          SELECT action_id, COUNT(*) AS total,
                 SUM(CASE WHEN exit_code = 0 AND cancelled = 0 THEN 1 ELSE 0 END) AS ok,
                 SUM(CASE WHEN exit_code != 0 AND cancelled = 0 AND exit_code IS NOT NULL THEN 1 ELSE 0 END) AS fail,
                 SUM(CASE WHEN cancelled = 1 THEN 1 ELSE 0 END) AS cancelled
          FROM ai_action_runs
          WHERE ${whereSql}
          GROUP BY action_id
          ORDER BY total DESC
          LIMIT 8
        `).all(...params).map((r) => ({ ...r, success_rate: r.total > 0 ? +(100 * r.ok / r.total).toFixed(1) : null }));
        // v12.45 (C4): si ?format=md exportar como Markdown listo para pegar
        // en un reporte / canal Slack.
        const format = (url.searchParams.get("format") || "json").toLowerCase();
        if (format === "md" || format === "markdown") {
          const lines = [];
          lines.push(`# Action runs dashboard (${days} dias)`);
          lines.push("");
          lines.push(`- Generado: ${new Date().toISOString()}`);
          if (filterAction) lines.push(`- Action filtrada: \`${filterAction}\``);
          lines.push("");
          lines.push(`## Comparacion ventana actual vs anterior`);
          lines.push("");
          lines.push("| Ventana | Total | OK | Fail | Cancel | Success rate |");
          lines.push("|---|---:|---:|---:|---:|---:|");
          lines.push(`| Actual (${current.length}d) | ${cur.total} | ${cur.ok} | ${cur.fail} | ${cur.cancelled} | ${cur.success_rate == null ? "-" : cur.success_rate + "%"} |`);
          lines.push(`| Anterior (${previous.length}d) | ${prev.total} | ${prev.ok} | ${prev.fail} | ${prev.cancelled} | ${prev.success_rate == null ? "-" : prev.success_rate + "%"} |`);
          lines.push("");
          lines.push(`- Delta volumen: ${delta_volume_pct == null ? "-" : delta_volume_pct + "%"}`);
          lines.push(`- Delta success rate: ${delta_success_pp == null ? "-" : delta_success_pp + " pp"}`);
          lines.push("");
          lines.push(`## Top acciones por volumen`);
          lines.push("");
          lines.push("| Action | Total | OK | Fail | Cancel | Success rate |");
          lines.push("|---|---:|---:|---:|---:|---:|");
          for (const t of topByAction) {
            lines.push(`| \`${t.action_id}\` | ${t.total} | ${t.ok} | ${t.fail} | ${t.cancelled} | ${t.success_rate == null ? "-" : t.success_rate + "%"} |`);
          }
          lines.push("");
          lines.push(`## Serie diaria (ultimos ${Math.min(14, series.length)} dias)`);
          lines.push("");
          lines.push("| Dia | Total | OK | Fail | avg_ms | Success rate |");
          lines.push("|---|---:|---:|---:|---:|---:|");
          for (const s of series.slice(-14)) {
            lines.push(`| ${s.day} | ${s.total} | ${s.ok} | ${s.fail} | ${s.avg_ms == null ? "-" : s.avg_ms} | ${s.success_rate == null ? "-" : s.success_rate + "%"} |`);
          }
          const stampMd = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
          res.writeHead(200, {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="action-runs-dashboard-${stampMd}.md"`,
          });
          res.end(lines.join("\n"));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          days_window: days,
          action_id: filterAction || null,
          days: allDays,
          series,
          compare: {
            current: { ...cur, window_days: current.length },
            previous: { ...prev, window_days: previous.length },
            delta_volume_pct,
            delta_success_pp,
          },
          top_actions: topByAction,
        }));
        return;
      }
      // v12.28: tendencia diaria por accion para sparklines.
      // Devuelve array de N dias (default 14) con counts ok/fail/cancelled + avg_ms.
      if (url.pathname === "/api/action-runs/trend") {
        const days = Math.min(60, Math.max(1, Number(url.searchParams.get("days") || 14)));
        const filterAction = (url.searchParams.get("action_id") || "").trim();
        const sinceIso = new Date(Date.now() - days * 86400 * 1000).toISOString();
        const params = [sinceIso];
        let where = "started_at >= ?";
        if (filterAction) { where += " AND action_id = ?"; params.push(filterAction); }
        const rows = db.prepare(`
          SELECT substr(started_at, 1, 10) AS day,
                 action_id,
                 COUNT(*) AS total,
                 SUM(CASE WHEN exit_code = 0 AND cancelled = 0 THEN 1 ELSE 0 END) AS ok,
                 SUM(CASE WHEN exit_code != 0 AND cancelled = 0 AND exit_code IS NOT NULL THEN 1 ELSE 0 END) AS fail,
                 SUM(CASE WHEN cancelled = 1 THEN 1 ELSE 0 END) AS cancelled,
                 ROUND(AVG(duration_ms)) AS avg_ms
          FROM ai_action_runs
          WHERE ${where}
          GROUP BY day, action_id
          ORDER BY day ASC, action_id ASC
        `).all(...params);
        // Rellenar dias vacios para que el sparkline tenga len consistente.
        const startMs = Date.now() - (days - 1) * 86400 * 1000;
        const allDays = [];
        for (let i = 0; i < days; i += 1) {
          allDays.push(new Date(startMs + i * 86400 * 1000).toISOString().slice(0, 10));
        }
        // Agrupar por action_id.
        const byAction = {};
        for (const r of rows) {
          (byAction[r.action_id] = byAction[r.action_id] || {})[r.day] = r;
        }
        const result = Object.keys(byAction).sort().map((aid) => {
          const series = allDays.map((d) => byAction[aid][d] || { day: d, action_id: aid, total: 0, ok: 0, fail: 0, cancelled: 0, avg_ms: null });
          return { action_id: aid, days: allDays, series };
        });
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(result));
        return;
      }
      // v12.28: alertas activas. Una accion tiene alerta si sus ultimos N runs
      // (default N=5) tienen >=3 fallos consecutivos al final.
      // v12.30: filtra acciones con snooze activo (a menos que ?include_snoozed=1).
      // v12.32: agrega alertas tipo 'duration-threshold' si la ultima duracion
      // supera p95 * (1 + slow_threshold_pct/100). slow_threshold_pct default 50.
      if (url.pathname === "/api/action-runs/alerts") {
        const lastN = Math.min(20, Math.max(3, Number(url.searchParams.get("last") || 5)));
        const minFails = Math.min(lastN, Math.max(2, Number(url.searchParams.get("min") || 3)));
        const slowThresholdPct = Math.max(0, Number(url.searchParams.get("slow_pct") || 50));
        const minSampleForSlow = Math.max(5, Number(url.searchParams.get("slow_min_samples") || 5));
        const includeSnoozed = url.searchParams.get("include_snoozed") === "1";
        // v12.45: snoozes ahora son por (action_id, kind). kind=NULL silencia todos.
        const snoozeRows = db.prepare(`SELECT action_id, kind FROM ai_action_snoozes WHERE expires_at IS NULL OR expires_at > ?`)
          .all(new Date().toISOString());
        const snoozedByAction = new Map(); // action_id -> Set<kind|null>
        for (const r of snoozeRows) {
          if (!snoozedByAction.has(r.action_id)) snoozedByAction.set(r.action_id, new Set());
          snoozedByAction.get(r.action_id).add(r.kind || null);
        }
        const isSnoozedKind = (aid, alertKind) => {
          const kinds = snoozedByAction.get(aid);
          if (!kinds) return false;
          if (kinds.has(null)) return true; // NULL = todos los kinds
          return kinds.has(alertKind);
        };
        const isSnoozedAny = (aid) => snoozedByAction.has(aid);
        const actionIds = db.prepare(`SELECT DISTINCT action_id FROM ai_action_runs WHERE finished_at IS NOT NULL`).all().map((r) => r.action_id);
        const alerts = [];
        for (const aid of actionIds) {
          // Si todos los kinds estan snoozed, saltar action salvo includeSnoozed=1.
          const allSnoozed = (snoozedByAction.get(aid)?.has(null)) === true;
          if (!includeSnoozed && allSnoozed) continue;
          const runs = db.prepare(`
            SELECT exit_code, signal, cancelled, started_at, duration_ms
            FROM ai_action_runs
            WHERE action_id = ? AND finished_at IS NOT NULL
            ORDER BY started_at DESC
            LIMIT ?
          `).all(aid, lastN);
          let streak = 0;
          for (const r of runs) {
            const isFail = r.cancelled !== 1 && r.exit_code !== 0 && r.exit_code !== null;
            if (isFail) streak += 1; else break;
          }
          if (streak >= minFails) {
            const snoozedThis = isSnoozedKind(aid, "failure-streak");
            if (includeSnoozed || !snoozedThis) {
              alerts.push({
                kind: "failure-streak",
                action_id: aid,
                consecutive_failures: streak,
                window: lastN,
                last_success: db.prepare(`SELECT started_at FROM ai_action_runs WHERE action_id = ? AND exit_code = 0 AND cancelled = 0 ORDER BY started_at DESC LIMIT 1`).get(aid)?.started_at || null,
                latest_started_at: runs[0]?.started_at || null,
                snoozed: snoozedThis,
              });
            }
          }
          // v12.32: alerta de duracion. Calcular p95 sobre runs OK historicos
          // EXCLUYENDO el ultimo (no puede compararse contra si mismo).
          if (slowThresholdPct > 0) {
            const last = runs[0];
            if (last && last.duration_ms != null && last.exit_code === 0) {
              const historicalDurations = db.prepare(`
                SELECT duration_ms FROM ai_action_runs
                WHERE action_id = ? AND exit_code = 0 AND cancelled = 0
                  AND duration_ms IS NOT NULL AND started_at < ?
                ORDER BY duration_ms ASC
              `).all(aid, last.started_at).map((r) => r.duration_ms);
              if (historicalDurations.length >= minSampleForSlow) {
                const p95 = historicalDurations[Math.min(historicalDurations.length - 1, Math.floor(historicalDurations.length * 0.95))];
                const threshold = p95 * (1 + slowThresholdPct / 100);
                if (last.duration_ms > threshold) {
                  const snoozedThis = isSnoozedKind(aid, "duration-threshold");
                  if (includeSnoozed || !snoozedThis) {
                    alerts.push({
                      kind: "duration-threshold",
                      action_id: aid,
                      detail: `ultimo run ${last.duration_ms}ms supera umbral ${Math.round(threshold)}ms (p95 historico=${p95}ms +${slowThresholdPct}%)`,
                      duration_ms: last.duration_ms,
                      p95_ms: p95,
                      threshold_ms: Math.round(threshold),
                      latest_started_at: last.started_at,
                      snoozed: snoozedThis,
                    });
                  }
                }
              }
            }
          }
        }
        // v12.45 (C1): agrupar alertas por action_id (failure-streak + duration-threshold
        // del mismo action son una sola alerta combinada). Se mantiene compat:
        //  - default: devuelve la lista combinada (kind='combined' cuando hay >1).
        //  - ?combine=0 -> devuelve la lista plana original.
        const combine = url.searchParams.get("combine") !== "0";
        if (combine) {
          const byAction = new Map();
          for (const a of alerts) {
            if (!byAction.has(a.action_id)) byAction.set(a.action_id, []);
            byAction.get(a.action_id).push(a);
          }
          const combined = [];
          for (const [aid, list] of byAction) {
            if (list.length === 1) { combined.push(list[0]); continue; }
            combined.push({
              kind: "combined",
              action_id: aid,
              kinds: list.map((x) => x.kind),
              parts: list,
              latest_started_at: list.map((x) => x.latest_started_at).filter(Boolean).sort().slice(-1)[0] || null,
              snoozed: list.some((x) => x.snoozed),
            });
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(combined));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(alerts));
        return;
      }
      // v12.30: gestion de snoozes. POST { action_id, reason?, duration? } y DELETE { action_id }.
      // duration: '24h' | '7d' | 'forever' (default '7d').
      if (url.pathname === "/api/action-runs/snoozes" && req.method === "GET") {
        const rows = db.prepare(`SELECT action_id, kind, reason, snoozed_at, expires_at FROM ai_action_snoozes ORDER BY snoozed_at DESC`).all();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(rows));
        return;
      }
      if (url.pathname === "/api/action-runs/snoozes" && req.method === "POST") {
        const origin = req.headers.origin || "";
        const allowed = `http://localhost:${port}`; const allowed2 = `http://127.0.0.1:${port}`;
        if (origin && origin !== allowed && origin !== allowed2) { res.writeHead(403, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: `Origin no permitido: ${origin}` })); return; }
        let body = "";
        req.on("data", (chunk) => { body += chunk; if (body.length > 2048) req.destroy(); });
        req.on("end", () => {
          let payload; try { payload = JSON.parse(body || "{}"); } catch { res.writeHead(400); res.end(JSON.stringify({ error: "JSON invalido" })); return; }
          const aid = String(payload.action_id || "").trim();
          if (!aid) { res.writeHead(400); res.end(JSON.stringify({ error: "action_id requerido" })); return; }
          const duration = String(payload.duration || "7d");
          let expiresAt = null;
          if (duration === "24h") expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
          else if (duration === "7d") expiresAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
          else if (duration === "30d") expiresAt = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
          else if (duration === "forever") expiresAt = null;
          else { res.writeHead(400); res.end(JSON.stringify({ error: "duration invalido (24h|7d|30d|forever)" })); return; }
          // v12.45: kind opcional. Valido: 'failure-streak' | 'duration-threshold' | NULL.
          let kind = payload.kind === undefined || payload.kind === null || payload.kind === "" ? null : String(payload.kind);
          if (kind !== null && !["failure-streak", "duration-threshold"].includes(kind)) {
            res.writeHead(400); res.end(JSON.stringify({ error: "kind invalido (failure-streak|duration-threshold|null)" })); return;
          }
          db.prepare(`INSERT INTO ai_action_snoozes(action_id, kind, reason, expires_at) VALUES (?, ?, ?, ?) ON CONFLICT(action_id) DO UPDATE SET kind = excluded.kind, reason = excluded.reason, snoozed_at = CURRENT_TIMESTAMP, expires_at = excluded.expires_at`)
            .run(aid, kind, payload.reason || null, expiresAt);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, action_id: aid, kind, expires_at: expiresAt }));
        });
        return;
      }
      if (url.pathname === "/api/action-runs/snoozes" && req.method === "DELETE") {
        const origin = req.headers.origin || "";
        const allowed = `http://localhost:${port}`; const allowed2 = `http://127.0.0.1:${port}`;
        if (origin && origin !== allowed && origin !== allowed2) { res.writeHead(403, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: `Origin no permitido: ${origin}` })); return; }
        const aid = url.searchParams.get("action_id");
        if (!aid) { res.writeHead(400); res.end(JSON.stringify({ error: "action_id requerido" })); return; }
        const r = db.prepare(`DELETE FROM ai_action_snoozes WHERE action_id = ?`).run(aid);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, removed: r.changes }));
        return;
      }
      // v12.43: coverage por feature — agrega los trace links por feature
      // (extraida de source_file o evidence_ref) y devuelve un breakdown de
      // que artefactos tiene cada una con su display_status. Util para
      // responder "¿que falta a 002-cambio-estado-expediente?".
      // v12.45 (F2): historial git de un archivo (drill-down desde la tab Trazabilidad).
      if (url.pathname === "/api/file-git-history") {
        const p = (url.searchParams.get("path") || "").trim();
        const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 10)));
        if (!p) { res.writeHead(400); res.end(JSON.stringify({ error: "path requerido" })); return; }
        // sanity: path no debe escapar del root.
        if (p.includes("..")) { res.writeHead(400); res.end(JSON.stringify({ error: "path invalido (..)" })); return; }
        const absPath = path.join(root, p);
        if (!fs.existsSync(absPath)) { res.writeHead(404); res.end(JSON.stringify({ error: `path no existe: ${p}` })); return; }
        try {
          // Usar git log; separadores controlados para parsear sin shell quoting riesgoso.
          const SEP = "<<|FIELD|>>";
          const RECSEP = "<<|REC|>>";
          const format = ["%h", "%ad", "%an", "%s"].join(SEP) + RECSEP;
          const out = spawnSync(
            "git",
            ["log", `--max-count=${limit}`, "--date=short", `--pretty=format:${format}`, "--", p],
            { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 1024 * 1024 },
          );
          if (out.error) throw out.error;
          if (out.status !== 0) throw new Error(`git log status ${out.status}: ${out.stderr}`);
          const commits = String(out.stdout || "").split(RECSEP).map((rec) => rec.trim()).filter(Boolean).map((rec) => {
            const [sha, date, author, subject] = rec.split(SEP);
            return { sha, date, author, subject };
          });
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ path: p, commits }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: `git log fallo: ${err.message || err}` }));
        }
        return;
      }
      if (url.pathname === "/api/coverage-by-feature") {
        const rows = db.prepare(`
          SELECT source_ref, target_type, target_ref, evidence_ref, display_status, link_status, source_file
          FROM ai_trace_links
          WHERE source_type IN ('RF','RNF','HU','origen','requerimiento')
          ORDER BY source_ref, target_type
        `).all();
        const byFeature = {};
        for (const r of rows) {
          // Extraer feature de source_file o evidence_ref.
          let feature = null;
          const fromFile = (r.source_file || "").match(/^specs\/([^/]+)\//);
          const fromEv = (r.evidence_ref || "").match(/^specs\/([^/]+)\//);
          if (fromFile) feature = fromFile[1];
          else if (fromEv) feature = fromEv[1];
          else feature = "(sin-feature)";
          if (!byFeature[feature]) {
            byFeature[feature] = {
              feature,
              targets_by_type: {}, // bd, api, codigo, test, prototipo, spdd, hu, ...
              status_breakdown: {},
              sources: new Set(),
              links: 0,
            };
          }
          const f = byFeature[feature];
          f.links += 1;
          f.sources.add(r.source_ref);
          if (!f.targets_by_type[r.target_type]) f.targets_by_type[r.target_type] = [];
          f.targets_by_type[r.target_type].push({
            source_ref: r.source_ref,
            target_ref: r.target_ref,
            evidence_ref: r.evidence_ref,
            display_status: r.display_status,
            link_status: r.link_status,
          });
          const ds = r.display_status || "(null)";
          f.status_breakdown[ds] = (f.status_breakdown[ds] || 0) + 1;
        }
        // Serializar Sets a arrays + ordenar.
        const result = Object.values(byFeature).map((f) => ({
          feature: f.feature,
          links: f.links,
          sources: [...f.sources].sort(),
          source_count: f.sources.size,
          targets_by_type: f.targets_by_type,
          status_breakdown: f.status_breakdown,
        })).sort((a, b) => a.feature.localeCompare(b.feature));
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(result));
        return;
      }
      // v12.26: estadisticas agregadas por accion.
      // total runs, exitos, fallos, cancelados, avg/p50/p95 duration, last_run.
      if (url.pathname === "/api/action-runs/stats") {
        const rows = db.prepare(`
          SELECT action_id,
                 COUNT(*) AS total,
                 SUM(CASE WHEN exit_code = 0 AND cancelled = 0 THEN 1 ELSE 0 END) AS ok,
                 SUM(CASE WHEN exit_code != 0 AND cancelled = 0 AND exit_code IS NOT NULL THEN 1 ELSE 0 END) AS fail,
                 SUM(CASE WHEN cancelled = 1 THEN 1 ELSE 0 END) AS cancelled,
                 ROUND(AVG(duration_ms)) AS avg_ms,
                 MIN(duration_ms) AS min_ms,
                 MAX(duration_ms) AS max_ms,
                 MAX(started_at) AS last_run
          FROM ai_action_runs
          WHERE duration_ms IS NOT NULL
          GROUP BY action_id
          ORDER BY total DESC, action_id ASC
        `).all();
        // p50/p95 por accion (calculo en JS para no requerir window functions de SQLite >= 3.25).
        for (const r of rows) {
          const dur = db.prepare(`SELECT duration_ms FROM ai_action_runs WHERE action_id = ? AND duration_ms IS NOT NULL ORDER BY duration_ms ASC`).all(r.action_id).map((x) => x.duration_ms);
          r.p50_ms = dur.length ? dur[Math.floor(dur.length * 0.5)] : null;
          r.p95_ms = dur.length ? dur[Math.min(dur.length - 1, Math.floor(dur.length * 0.95))] : null;
          r.success_rate = r.total > 0 ? +(100 * r.ok / r.total).toFixed(1) : null;
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(rows));
        return;
      }
      // v12.25: historial de acciones ejecutadas (audit trail).
      // v12.27: filtros opcionales por action_id, status y since.
      // v12.30: filtros adicionales mode (sync|stream) y slow (duration_ms >= N).
      //   status: 'ok' | 'fail' | 'cancelled' | 'running' | 'all'
      //   since:  '24h' | '7d' | '30d' | ISO date
      //   mode:   'sync' | 'stream'
      //   slow:   numero (ms) — solo runs con duration_ms >= slow
      if (url.pathname === "/api/action-runs") {
        const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 50)));
        // v12.32: filtros multi-select. action_id, status y mode aceptan CSV.
        const csv = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
        const filterActions = csv(url.searchParams.get("action_id"));
        const filterStatuses = csv(url.searchParams.get("status"));
        const filterModes = csv(url.searchParams.get("mode"));
        const filterSince = (url.searchParams.get("since") || "").trim();
        const filterSlow = Number(url.searchParams.get("slow") || 0);
        const where = [];
        const params = [];
        if (filterActions.length) {
          where.push(`action_id IN (${filterActions.map(() => "?").join(",")})`);
          params.push(...filterActions);
        }
        if (filterStatuses.length) {
          const clauses = [];
          for (const st of filterStatuses) {
            if (st === "ok") clauses.push("(exit_code = 0 AND cancelled = 0)");
            else if (st === "fail") clauses.push("(exit_code IS NOT NULL AND exit_code != 0 AND cancelled = 0)");
            else if (st === "cancelled") clauses.push("(cancelled = 1)");
            else if (st === "running") clauses.push("(finished_at IS NULL)");
          }
          if (clauses.length) where.push(`(${clauses.join(" OR ")})`);
        }
        if (filterModes.length) {
          const valid = filterModes.filter((m) => m === "sync" || m === "stream");
          if (valid.length) {
            where.push(`mode IN (${valid.map(() => "?").join(",")})`);
            params.push(...valid);
          }
        }
        if (Number.isFinite(filterSlow) && filterSlow > 0) { where.push("duration_ms >= ?"); params.push(filterSlow); }
        if (filterSince) {
          const m = /^(\d+)([dhwm])$/.exec(filterSince);
          let sinceIso = null;
          if (m) {
            const n = Number(m[1]);
            const mult = m[2] === "h" ? 3600 : m[2] === "d" ? 86400 : m[2] === "w" ? 604800 : 2592000;
            sinceIso = new Date(Date.now() - n * mult * 1000).toISOString();
          } else if (/^\d{4}-\d{2}-\d{2}/.test(filterSince)) {
            sinceIso = filterSince;
          }
          if (sinceIso) { where.push("started_at >= ?"); params.push(sinceIso); }
        }
        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const rows = db.prepare(`
          SELECT id, action_id, arg, mode, origin, started_at, finished_at,
                 exit_code, signal, duration_ms, timed_out, cancelled,
                 stdout_tail, stderr_tail
          FROM ai_action_runs
          ${whereSql}
          ORDER BY started_at DESC
          LIMIT ?
        `).all(...params, limit);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(rows));
        return;
      }
      // v12.23: catalogo de acciones ejecutables desde la UI.
      if (url.pathname === "/api/actions") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        const safe = EXEC_ACTIONS.map((a) => ({
          id: a.id,
          category: a.category,
          label: a.label,
          hint: a.hint,
          danger: !!a.danger,
          arg: a.arg ? { name: a.arg.name, required: !!a.arg.required, hint: a.arg.hint, regex: a.arg.regex } : null,
        }));
        res.end(JSON.stringify(safe));
        return;
      }
      // v12.23/v12.24: ejecucion de una accion del whitelist.
      // Seguridad: server ya bindea 127.0.0.1; ademas exigimos Origin local y
      // POST con JSON. Sin esos requisitos -> 403. Sin shell strings.
      // v12.24: modo de respuesta depende del header Accept:
      //   - 'text/event-stream' -> SSE streaming (linea por linea, cancelable).
      //   - default              -> JSON sincrono (legacy v12.23, compat).
      if (url.pathname === "/api/exec" && req.method === "POST") {
        const origin = req.headers.origin || "";
        const allowedOrigin = `http://localhost:${port}`;
        const allowedOrigin127 = `http://127.0.0.1:${port}`;
        if (origin && origin !== allowedOrigin && origin !== allowedOrigin127) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Origin no permitido: ${origin}` }));
          return;
        }
        if ((req.headers["content-type"] || "").indexOf("application/json") < 0) {
          res.writeHead(415, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Content-Type debe ser application/json" }));
          return;
        }
        const wantsStream = (req.headers.accept || "").indexOf("text/event-stream") >= 0;
        let body = "";
        req.on("data", (chunk) => { body += chunk; if (body.length > 4096) req.destroy(); });
        req.on("end", () => {
          let payload;
          try { payload = JSON.parse(body || "{}"); } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "JSON invalido" }));
            return;
          }
          if (wantsStream) {
            // SSE: cabeceras + flush inmediato. El cliente cancela cerrando la conexion.
            res.writeHead(200, {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "Connection": "keep-alive",
              "X-Accel-Buffering": "no",
            });
            const send = (evt) => {
              try {
                res.write(`event: ${evt.type}\n`);
                res.write(`data: ${JSON.stringify(evt.data)}\n\n`);
              } catch {}
            };
            // keepalive comment cada 15s para que proxies/navegadores no cierren.
            const keepAlive = setInterval(() => { try { res.write(": keepalive\n\n"); } catch {} }, 15000);
            // v12.24: cancelacion del job si el cliente cierra antes de tiempo.
            // Atamos al socket subyacente (no a req) y diferimos el chequeo
            // a la siguiente tick para evitar matar al child cuando Node cierra
            // el lado de lectura tras consumir el body de la peticion.
            const sock = req.socket;
            const onSockClose = () => {
              clearInterval(keepAlive);
              setImmediate(() => {
                if (!res.writableEnded && __execJob && __execJob.mode === "stream") {
                  try { __execJob.child.kill("SIGTERM"); } catch {}
                }
              });
            };
            if (sock) sock.once("close", onSockClose);
            streamExecAction(root, dbPath, payload.id, payload.arg, send).then(() => {
              clearInterval(keepAlive);
              try { res.end(); } catch {}
            }).catch((err) => {
              clearInterval(keepAlive);
              send({ type: "error", data: { message: err instanceof Error ? err.message : String(err) } });
              try { res.end(); } catch {}
            });
            return;
          }
          // Modo sincrono (legacy).
          runExecAction(root, dbPath, payload.id, payload.arg).then((result) => {
            res.writeHead(result.status, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify(result.body || { error: result.error }));
          }).catch((err) => {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
          });
        });
        return;
      }
      // v12.24: DELETE /api/exec -> cancela el job en curso (SIGTERM -> SIGKILL tras 3s).
      if (url.pathname === "/api/exec" && req.method === "DELETE") {
        const origin = req.headers.origin || "";
        const allowedOrigin = `http://localhost:${port}`;
        const allowedOrigin127 = `http://127.0.0.1:${port}`;
        if (origin && origin !== allowedOrigin && origin !== allowedOrigin127) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Origin no permitido: ${origin}` }));
          return;
        }
        const result = cancelExecAction();
        res.writeHead(result.status, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(result.body || { error: result.error }));
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  return new Promise((resolve, reject) => {
    // v12.23: bind explicito a loopback. La UI ahora puede ejecutar comandos
    // del agente (sync, validadores, reportes, generadores); exponer eso a la
    // red seria un risk. Si se necesita acceso remoto, hacer SSH tunnel o
    // ejecutar `memory-serve` detras de un reverse proxy con auth.
    // v12.55: capturar EADDRINUSE via 'error' event y rechazar la promesa.
    // Sin esto, Node levanta el error como uncaught y mata el proceso.
    server.once("error", (err) => {
      reject(err);
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function buildFtsQuery(query) {
  // Prefix matching: cada termino se convierte en `term*` para que 'exp'
  // matchee 'expediente', 'expone', etc. Caracteres FTS5-especiales se
  // sanitizan: solo letras/digitos/_ pasan. Terminos < 2 chars se ignoran.
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/[^\p{L}\p{N}_]+/gu, "").trim())
    .filter((term) => term.length > 1);
  if (terms.length === 0) return null;
  return terms.map((term) => `${term}*`).join(" OR ");
}

function search(db, query, limit) {
  if (!query || !query.trim()) return [];
  if (hasFtsTable(db)) {
    const ftsQuery = buildFtsQuery(query);
    if (!ftsQuery) return [];
    try {
      const rows = db
        .prepare(`
          SELECT f.rowid AS chunkId, f.path, d.kind, d.phase, f.heading, f.content,
                 bm25(ai_chunks_fts) AS rank
          FROM ai_chunks_fts f
          JOIN ai_documents d ON d.id = f.document_id
          WHERE ai_chunks_fts MATCH ?
          ORDER BY rank
          LIMIT ?
        `)
        .all(ftsQuery, limit);
      return rows.map((row) => ({
        path: row.path,
        chunkId: row.chunkId,
        kind: row.kind,
        phase: row.phase,
        heading: row.heading,
        score: Number(-row.rank).toFixed(3),
        excerpt: row.content.replace(/\s+/g, " ").slice(0, 260),
      }));
    } catch {
      // Si FTS5 falla por cualquier razon, caemos al scan textual.
      return searchFallback(db, query, limit);
    }
  }
  return searchFallback(db, query, limit);
}

function searchFallback(db, query, limit) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const rows = db.prepare(`
    SELECT c.id AS chunkId, d.path, d.kind, d.phase, c.heading, c.content
    FROM ai_document_chunks c
    JOIN ai_documents d ON d.id = c.document_id
  `).all();

  return rows
    .map((row) => {
      const haystack = `${row.path} ${row.heading} ${row.content}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { ...row, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit)
    .map((row) => ({
      path: row.path,
      chunkId: row.chunkId,
      kind: row.kind,
      phase: row.phase,
      heading: row.heading,
      score: row.score,
      excerpt: row.content.replace(/\s+/g, " ").slice(0, 260),
    }));
}

// searchAll: busqueda unificada que cubre el mismo dominio que la UI estatica
// (documentos, trace_links, decisiones, gates, preguntas) y agrega los hits
// FTS5/textuales de los chunks de contenido. Garantia: el live devuelve la
// MISMA metadata que el estatico para la misma consulta + los chunks como
// bonus. La metadata no tiene cap; los chunks sí (chunkLimit).
function searchAll(db, query, chunkLimit) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter((t) => t.length > 0);
  const matches = (haystack) => {
    const lc = (haystack || "").toLowerCase();
    return terms.every((t) => lc.includes(t));
  };

  // 1) Metadatos estructurados — SIN cap; mismo dominio que staticSearch.
  const meta = [];
  for (const r of db
    .prepare("SELECT path, kind, phase, title FROM ai_documents")
    .all()) {
    if (matches(`${r.path} ${r.title || ""}`)) {
      meta.push({
        t: "doc",
        ref: r.path,
        path: r.path,
        kind: r.kind,
        phase: r.phase,
        excerpt: r.title || "",
      });
    }
  }
  for (const r of db
    .prepare(
      "SELECT source_type, source_ref, target_type, target_ref, relation, evidence_ref FROM ai_trace_links",
    )
    .all()) {
    if (
      matches(
        `${r.source_ref} ${r.relation} ${r.target_ref} ${r.evidence_ref || ""}`,
      )
    ) {
      meta.push({
        t: "trace",
        ref: `${r.source_ref} -[${r.relation}]-> ${r.target_ref}`,
        path: r.evidence_ref || "",
        excerpt: `${r.source_type} -> ${r.target_type}`,
      });
    }
  }
  for (const r of db
    .prepare("SELECT decision_ref, title, status, adr_path FROM ai_decisions")
    .all()) {
    if (matches(`${r.decision_ref || ""} ${r.title} ${r.status}`)) {
      meta.push({
        t: "decision",
        ref: r.decision_ref || r.title,
        path: r.adr_path || "",
        excerpt: `${r.title} (${r.status})`,
      });
    }
  }
  for (const r of db
    .prepare("SELECT gate, phase_scope, status, summary FROM ai_gate_runs")
    .all()) {
    if (matches(`${r.gate} ${r.phase_scope} ${r.status}`)) {
      meta.push({
        t: "gate",
        ref: `${r.gate} (${r.phase_scope})`,
        path: r.summary || "",
        excerpt: r.status,
      });
    }
  }
  for (const r of db
    .prepare("SELECT question, source_ref, phase, status FROM ai_open_questions")
    .all()) {
    if (matches(r.question)) {
      meta.push({
        t: "pregunta",
        ref: r.source_ref || "",
        path: r.source_ref || "",
        excerpt: r.question,
      });
    }
  }

  // 2) Chunks (FTS5 + fallback) — con cap propio (chunkLimit).
  const cap = Math.max(0, Number(chunkLimit) || 0);
  const chunkHits = cap > 0 ? search(db, query, cap) : [];
  const chunks = chunkHits.map((row) => ({
    t: "chunk",
    ref: `${row.path} :: ${row.heading}`,
    path: row.path,
    heading: row.heading,
    excerpt: row.excerpt,
    score: row.score,
  }));

  // 3) Combinar: metadata primero (mismo orden que staticSearch), luego chunks.
  // Sin dedup: una misma relacion declarada en dos archivos (matriz global +
  // matriz por feature) es informacion legitima y se preserva, igual que en
  // el modo estatico. Los chunks ya vienen unicos por chunkId desde search().
  return [...meta, ...chunks];
}

// ── Preset queries: preguntas frecuentes con SQL determinista ───────────────
// El catalogo se sirve al cliente (static y live) para renderizar botones de
// "consultas rapidas". Cada preset declara su key, etiqueta y si requiere arg.
const MEMORY_QUERY_PRESETS = [
  { key: "docs-for", label: "Documentos relacionados con…", hint: "RF-02, HU-03, ADR-001, gate-prototype-ready", requiresArg: true },
  { key: "apis-for", label: "APIs implementadas para…", hint: "RF-02", requiresArg: true },
  { key: "features-pending-qa", label: "Features pendientes de QA", requiresArg: false },
  { key: "validated-prototypes", label: "Prototipos validados", requiresArg: false },
  { key: "decisions-pending", label: "Decisiones pendientes", requiresArg: false },
  { key: "failed-gates", label: "Gates fallidos / bloqueados", requiresArg: false },
  { key: "rf-without-code", label: "Requerimientos sin implementacion", requiresArg: false },
  { key: "rf-without-test", label: "Requerimientos sin pruebas", requiresArg: false },
  { key: "rf-implemented", label: "Requerimientos implementados (codigo + test reales)", requiresArg: false },
  { key: "rf-validated", label: "Requerimientos validados (gate aprobado)", requiresArg: false },
  { key: "rf-planned", label: "Requerimientos con artefacto declarado pero inexistente (drift)", requiresArg: false },
  { key: "rf-not-implemented", label: "Requerimientos sin codigo O sin test reales (cualquier hueco)", requiresArg: false },
  { key: "links-drift", label: "Links a artefactos inexistentes (drift)", requiresArg: false },
  { key: "artifacts-pending", label: "Artefactos no-code pendientes (sin documentacion real)", requiresArg: false },
  { key: "artifacts-documented", label: "Artefactos no-code documentados (no necesariamente aprobados)", requiresArg: false },
  { key: "artifacts-approved", label: "Artefactos no-code aprobados (gate/Estado aprobado)", requiresArg: false },
  { key: "by-evidence", label: "RF/RNF que comparten una evidencia (path o nombre); opcional acota a una feature con sintaxis 'evidencia|feature'", hint: "spec-funcional.md|002-cambio-estado-expediente", requiresArg: true },
  { key: "decisions-about", label: "Decisiones tecnicas sobre…", hint: "Keycloak, OIDC, reportes…", requiresArg: true },
];

function runMemoryQuery(db, key, arg) {
  const a = (arg == null ? "" : String(arg)).trim();
  const wrap = (rows) => rows; // shape uniforme {t, ref, path, excerpt}

  switch (key) {
    case "docs-for": {
      if (!a) return [];
      const out = [];
      const like = `%${a}%`;
      for (const r of db
        .prepare(
          `SELECT source_ref, relation, target_type, target_ref, evidence_ref
           FROM ai_trace_links
           WHERE source_ref = ? OR target_ref LIKE ?`,
        )
        .all(a, like)) {
        out.push({
          t: "trace",
          ref: `${r.source_ref} -[${r.relation}]-> ${r.target_ref}`,
          path: r.evidence_ref || "",
          excerpt: `tipo destino: ${r.target_type}`,
        });
      }
      for (const r of db
        .prepare(
          `SELECT d.path AS path, c.heading AS heading, c.content AS content
           FROM ai_document_chunks c
           JOIN ai_documents d ON d.id = c.document_id
           WHERE c.content LIKE ? OR d.path LIKE ? OR c.heading LIKE ?
           LIMIT 30`,
        )
        .all(like, like, like)) {
        out.push({
          t: "doc",
          ref: `${r.path} :: ${r.heading}`,
          path: r.path,
          excerpt: (r.content || "").replace(/\s+/g, " ").slice(0, 240),
        });
      }
      return wrap(out);
    }

    case "apis-for": {
      if (!a) return [];
      return db
        .prepare(
          `SELECT source_ref, target_ref, evidence_ref FROM ai_trace_links
           WHERE source_ref = ? AND target_type = 'api'`,
        )
        .all(a)
        .map((r) => ({
          t: "api",
          ref: `${r.source_ref} → ${r.target_ref}`,
          path: r.evidence_ref || "",
          excerpt: r.target_ref,
        }));
    }

    case "features-pending-qa": {
      return db
        .prepare(
          `SELECT gate, phase_scope, status, actor FROM ai_gate_runs
           WHERE phase_scope LIKE 'specs/%'
             AND LOWER(status) NOT LIKE 'aprob%'
             AND LOWER(status) NOT LIKE 'cerrad%'
           ORDER BY phase_scope, gate`,
        )
        .all()
        .map((r) => ({
          t: "gate",
          ref: `${r.gate} · ${r.phase_scope.replace(/^specs\//, "")}`,
          path: r.phase_scope,
          excerpt: `${r.status}${r.actor ? " · " + r.actor : ""}`,
        }));
    }

    case "validated-prototypes": {
      return db
        .prepare(
          `SELECT gate, phase_scope, status, actor, decided_at FROM ai_gate_runs
           WHERE gate = 'gate-prototype-ready'
             AND (LOWER(status) LIKE '%valid%' OR LOWER(status) LIKE '%listo%' OR LOWER(status) LIKE '%aprob%')
           ORDER BY phase_scope`,
        )
        .all()
        .map((r) => ({
          t: "prototipo",
          ref: r.phase_scope.replace(/^specs\//, ""),
          path: r.phase_scope,
          excerpt: `${r.status}${r.actor ? " · " + r.actor : ""}${r.decided_at ? " · " + r.decided_at.slice(0, 10) : ""}`,
        }));
    }

    case "decisions-pending": {
      return db
        .prepare(
          `SELECT decision_ref, title, status, adr_path FROM ai_decisions
           WHERE LOWER(status) NOT LIKE 'aprob%'
             AND LOWER(status) NOT LIKE 'aceptad%'
             AND LOWER(status) NOT LIKE 'cerrad%'`,
        )
        .all()
        .map((r) => ({
          t: "decision",
          ref: r.decision_ref || r.title,
          path: r.adr_path || "",
          excerpt: `${r.title} · estado: ${r.status}`,
        }));
    }

    case "failed-gates": {
      return db
        .prepare(
          `SELECT gate, phase_scope, status FROM ai_gate_runs
           WHERE LOWER(status) LIKE '%bloque%'
              OR LOWER(status) LIKE '%falla%'
              OR LOWER(status) LIKE '%recha%'
              OR LOWER(status) LIKE '%error%'`,
        )
        .all()
        .map((r) => ({
          t: "gate",
          ref: `${r.gate} · ${r.phase_scope}`,
          path: r.phase_scope,
          excerpt: r.status,
        }));
    }

    case "rf-without-code": {
      // v12.22: "sin codigo" = no hay link de codigo con link_status IN ('implemented','validated').
      // Un link 'planned' o NULL no cuenta como implementacion real.
      return db
        .prepare(
          `SELECT DISTINCT t.source_ref AS rf FROM ai_trace_links t
           WHERE t.source_type IN ('RF', 'requerimiento')
             AND NOT EXISTS (
               SELECT 1 FROM ai_trace_links t2
               WHERE t2.source_ref = t.source_ref
                 AND t2.target_type = 'codigo'
                 AND t2.link_status IN ('implemented','validated')
             )
           ORDER BY t.source_ref`,
        )
        .all()
        .map((r) => ({ t: "rf", ref: r.rf, path: "", excerpt: "sin codigo real (planificado o ausente)" }));
    }

    case "rf-without-test": {
      return db
        .prepare(
          `SELECT DISTINCT t.source_ref AS rf FROM ai_trace_links t
           WHERE t.source_type IN ('RF', 'requerimiento')
             AND NOT EXISTS (
               SELECT 1 FROM ai_trace_links t2
               WHERE t2.source_ref = t.source_ref
                 AND t2.target_type = 'test'
                 AND t2.link_status IN ('implemented','validated')
             )
           ORDER BY t.source_ref`,
        )
        .all()
        .map((r) => ({ t: "rf", ref: r.rf, path: "", excerpt: "sin test real (planificado o ausente)" }));
    }

    case "rf-implemented": {
      // v12.22: "implementado" requiere codigo Y test, ambos con artefacto real.
      return db
        .prepare(
          `SELECT DISTINCT a.source_ref AS rf FROM ai_trace_links a
           WHERE a.source_type IN ('RF', 'requerimiento')
             AND a.target_type = 'codigo'
             AND a.link_status IN ('implemented','validated')
             AND EXISTS (
               SELECT 1 FROM ai_trace_links b
               WHERE b.source_ref = a.source_ref
                 AND b.target_type = 'test'
                 AND b.link_status IN ('implemented','validated')
             )
           ORDER BY a.source_ref`,
        )
        .all()
        .map((r) => ({ t: "rf", ref: r.rf, path: "", excerpt: "tiene codigo y test reales" }));
    }

    case "rf-validated": {
      // Validado = la fila de la matriz marca el Estado como aprobado/validado y los
      // artefactos existen en el repo (link_status='validated').
      return db
        .prepare(
          `SELECT DISTINCT a.source_ref AS rf FROM ai_trace_links a
           WHERE a.source_type IN ('RF', 'requerimiento')
             AND a.target_type = 'codigo'
             AND a.link_status = 'validated'
             AND EXISTS (
               SELECT 1 FROM ai_trace_links b
               WHERE b.source_ref = a.source_ref
                 AND b.target_type = 'test'
                 AND b.link_status = 'validated'
             )
           ORDER BY a.source_ref`,
        )
        .all()
        .map((r) => ({ t: "rf", ref: r.rf, path: "", excerpt: "validado por gate (codigo+test+aprobacion)" }));
    }

    case "rf-planned": {
      // Tiene al menos un link planificado y NINGUN link implementado/validated.
      return db
        .prepare(
          `SELECT DISTINCT a.source_ref AS rf FROM ai_trace_links a
           WHERE a.source_type IN ('RF', 'requerimiento')
             AND a.link_status = 'planned'
             AND NOT EXISTS (
               SELECT 1 FROM ai_trace_links b
               WHERE b.source_ref = a.source_ref
                 AND b.link_status IN ('implemented','validated')
                 AND b.target_type IN ('codigo','test')
             )
           ORDER BY a.source_ref`,
        )
        .all()
        .map((r) => ({ t: "rf", ref: r.rf, path: "", excerpt: "declarado en matriz pero sin artefacto en repo" }));
    }

    case "rf-not-implemented": {
      // v12.33: union de rf-without-code y rf-without-test. "Cualquier hueco
      // de implementacion": el RF tiene al menos una columna codigo o test
      // sin artefacto real (implemented/validated). Util para responder
      // "que RFs me faltan implementar" sin ambiguedad con rf-planned.
      return db
        .prepare(
          `SELECT DISTINCT t.source_ref AS rf FROM ai_trace_links t
           WHERE t.source_type IN ('RF', 'requerimiento')
             AND (
               NOT EXISTS (
                 SELECT 1 FROM ai_trace_links t2
                 WHERE t2.source_ref = t.source_ref
                   AND t2.target_type = 'codigo'
                   AND t2.link_status IN ('implemented','validated')
               )
               OR NOT EXISTS (
                 SELECT 1 FROM ai_trace_links t3
                 WHERE t3.source_ref = t.source_ref
                   AND t3.target_type = 'test'
                   AND t3.link_status IN ('implemented','validated')
               )
             )
           ORDER BY t.source_ref`,
        )
        .all()
        .map((r) => ({ t: "rf", ref: r.rf, path: "", excerpt: "falta codigo y/o test real" }));
    }

    case "artifacts-pending":
    case "artifacts-documented":
    case "artifacts-approved": {
      // v12.41: filtrar links no-code por display_status semantico.
      // Excluye target_type='codigo'/'test' (esos usan link_status / presets RF).
      const displayMap = {
        "artifacts-pending": "pending",
        "artifacts-documented": "documented",
        "artifacts-approved": "approved",
      };
      const wanted = displayMap[key];
      return db
        .prepare(
          `SELECT source_ref, target_type, target_ref, evidence_ref, display_status, link_status
           FROM ai_trace_links
           WHERE display_status = ?
             AND target_type NOT IN ('codigo','test','estado')
           ORDER BY source_ref, target_type, target_ref`,
        )
        .all(wanted)
        .map((r) => ({
          t: "artifact",
          ref: `${r.source_ref} -[${r.target_type}]-> ${r.target_ref}`,
          path: r.evidence_ref || "",
          excerpt: `display_status=${r.display_status} · link_status=${r.link_status}`,
        }));
    }

    case "by-evidence": {
      // v12.43: encontrar todos los RF/RNF/HU que comparten un evidence_ref.
      // v12.45 (F3): arg acepta sintaxis "<evidence>|<feature>" para acotar
      // resultados a una feature especifica (slug). El feature se compara contra
      // source_file/evidence_ref con LIKE.
      if (!a) return [];
      let evPart = String(a), featPart = null;
      if (evPart.includes("|")) {
        const parts = evPart.split("|");
        evPart = parts[0].trim();
        featPart = parts.slice(1).join("|").trim() || null;
      }
      const likeEv = `%${evPart}%`;
      const wheres = ["source_type IN ('RF','RNF','HU','origen','requerimiento')", "evidence_ref LIKE ?"];
      const params = [likeEv];
      if (featPart) {
        wheres.push("(source_file LIKE ? OR evidence_ref LIKE ?)");
        const lf = `%${featPart}%`; params.push(lf, lf);
      }
      const sql = `SELECT DISTINCT source_ref, target_type, target_ref, evidence_ref, display_status, source_file
                   FROM ai_trace_links
                   WHERE ${wheres.join(" AND ")}
                   ORDER BY source_ref, target_type`;
      return db.prepare(sql).all(...params).map((r) => ({
        t: "trace",
        ref: `${r.source_ref} -[${r.target_type}]-> ${r.target_ref}`,
        path: r.evidence_ref || "",
        excerpt: `display_status=${r.display_status || "-"} · evidencia: ${r.evidence_ref}${featPart ? " · feature: " + featPart : ""}`,
      }));
    }

    case "links-drift": {
      // Links declarados cuyo target_ref no existe en el repo (link_status='planned'
      // o 'drift'). Apunta a posibles brechas o nombres incorrectos en la matriz.
      return db
        .prepare(
          `SELECT source_ref, target_type, target_ref, evidence_ref, link_status
           FROM ai_trace_links
           WHERE link_status IN ('planned','drift')
             AND target_type IN ('codigo','test','api','bd','prototipo')
           ORDER BY source_ref, target_type, target_ref`,
        )
        .all()
        .map((r) => ({
          t: "drift",
          ref: `${r.source_ref} → ${r.target_type}:${r.target_ref}`,
          path: r.evidence_ref || "",
          excerpt: `link_status=${r.link_status}`,
        }));
    }

    case "decisions-about": {
      if (!a) return [];
      const like = `%${a.toLowerCase()}%`;
      return db
        .prepare(
          `SELECT decision_ref, title, status, adr_path, tags FROM ai_decisions
           WHERE LOWER(IFNULL(rationale,'') || ' ' || IFNULL(title,'') || ' ' || IFNULL(tags,'')) LIKE ?`,
        )
        .all(like)
        .map((r) => ({
          t: "decision",
          ref: r.decision_ref || r.title,
          path: r.adr_path || "",
          excerpt: `${r.title} · ${r.status}${r.tags ? " · tags: " + r.tags : ""}`,
        }));
    }

    default:
      return { error: `preset desconocido: ${key}` };
  }
}

function parseEmbedding(value) {
  if (!value) {
    throw new Error("--embedding es requerido para busqueda semantica");
  }
  const raw = fs.existsSync(value) ? fs.readFileSync(value, "utf8") : value;
  const parsed = raw.trim().startsWith("[")
    ? JSON.parse(raw)
    : raw.split(",").map((item) => Number(item.trim()));
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((item) => typeof item !== "number" || Number.isNaN(item))) {
    throw new Error("--embedding debe ser JSON array o CSV numerico");
  }
  return parsed;
}

function loadSqliteVec(db, root, extensionPath) {
  if (!extensionPath) {
    throw new Error("--sqlite-vec-extension es requerido para usar sqlite-vec");
  }
  const resolved = resolveInputPath(root, extensionPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`No existe extension sqlite-vec: ${resolved}`);
  }
  if (typeof db.enableLoadExtension === "function") {
    db.enableLoadExtension(true);
  }
  if (typeof db.loadExtension !== "function") {
    throw new Error("La version actual de node:sqlite no expone loadExtension");
  }
  db.loadExtension(resolved);
  db.exec(fs.readFileSync(path.join(root, "ai", "memory", "schema-sqlite-vec.sql"), "utf8"));
}

function importEmbeddings(db, root, args) {
  if (!args.file) {
    throw new Error("--file es requerido. Usa JSONL con {\"chunkId\": 1, \"embedding\": [...]}");
  }
  loadSqliteVec(db, root, args["sqlite-vec-extension"]);
  const filePath = resolveInputPath(root, args.file);
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter((line) => line.trim());
  const deleteEmbedding = db.prepare("DELETE FROM vec_document_chunks WHERE rowid = ?");
  const insertEmbedding = db.prepare("INSERT INTO vec_document_chunks(rowid, embedding) VALUES (?, ?)");
  let imported = 0;
  db.exec("BEGIN");
  try {
    for (const line of lines) {
      const item = JSON.parse(line);
      if (!Number.isInteger(item.chunkId) || !Array.isArray(item.embedding)) {
        throw new Error("Cada linea debe tener chunkId integer y embedding array");
      }
      deleteEmbedding.run(item.chunkId);
      insertEmbedding.run(item.chunkId, JSON.stringify(item.embedding));
      imported += 1;
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return imported;
}

function semanticSearch(db, root, args, limit) {
  loadSqliteVec(db, root, args["sqlite-vec-extension"]);
  const embedding = JSON.stringify(parseEmbedding(args.embedding));
  return db.prepare(`
    SELECT c.id AS chunkId, d.path, d.kind, d.phase, c.heading, c.content, v.distance
    FROM vec_document_chunks v
    JOIN ai_document_chunks c ON c.id = v.rowid
    JOIN ai_documents d ON d.id = c.document_id
    WHERE v.embedding MATCH ?
    ORDER BY v.distance
    LIMIT ?
  `).all(embedding, limit).map((row) => ({
    path: row.path,
    chunkId: row.chunkId,
    kind: row.kind,
    phase: row.phase,
    heading: row.heading,
    score: Number(row.distance).toFixed(4),
    excerpt: row.content.replace(/\s+/g, " ").slice(0, 260),
  }));
}

// ── Busqueda semantica sin dependencias ─────────────────────────────────────
// Embedder local determinista: hashing trick sobre tokens + trigramas de
// caracter, vector L2-normalizado. No es un modelo de lenguaje: encuentra
// chunks que comparten vocabulario y morfologia. Cero dependencias, cero
// extension nativa, reproducible. sqlite-vec sigue disponible como acelerador
// opcional para corpus grandes (ver semanticSearch + import-embeddings).

const LOCAL_EMBED_MODEL = "local-hash-v1";
const LOCAL_EMBED_DIM = 256;

function hashFeature(feature) {
  // FNV-1a 32-bit.
  let h = 2166136261;
  for (let i = 0; i < feature.length; i += 1) {
    h ^= feature.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function localEmbedding(text, dim = LOCAL_EMBED_DIM) {
  const vector = new Float64Array(dim);
  const normalized = stripAccents(String(text || "").toLowerCase());
  const tokens = normalized.split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
  const tf = new Map();
  for (const token of tokens) tf.set(token, (tf.get(token) || 0) + 1);
  const add = (feature, weight) => {
    const h = hashFeature(feature);
    const bucket = h % dim;
    const sign = h & 1 ? 1 : -1;
    vector[bucket] += weight * sign;
  };
  for (const [token, count] of tf) {
    const weight = 1 + Math.log(count);
    add(`w:${token}`, weight);
    const padded = `  ${token}  `;
    for (let i = 0; i < padded.length - 2; i += 1) {
      add(`t:${padded.slice(i, i + 3)}`, 0.5 * weight);
    }
  }
  let magnitude = 0;
  for (let i = 0; i < dim; i += 1) magnitude += vector[i] * vector[i];
  magnitude = Math.sqrt(magnitude) || 1;
  const out = new Array(dim);
  for (let i = 0; i < dim; i += 1) out[i] = vector[i] / magnitude;
  return out;
}

function cosineSimilarity(a, b) {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i += 1) dot += a[i] * b[i];
  return dot;
}

function embedDocuments(db, { force = false } = {}) {
  const selectChunks = force
    ? db.prepare(`
        SELECT c.id AS id, c.heading AS heading, c.content AS content
        FROM ai_document_chunks c
      `)
    : db.prepare(`
        SELECT c.id AS id, c.heading AS heading, c.content AS content
        FROM ai_document_chunks c
        LEFT JOIN ai_chunk_embeddings e ON e.chunk_id = c.id AND e.model = ?
        WHERE e.chunk_id IS NULL
      `);
  const rows = force ? selectChunks.all() : selectChunks.all(LOCAL_EMBED_MODEL);
  const upsert = db.prepare(`
    INSERT INTO ai_chunk_embeddings(chunk_id, model, dim, vector, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(chunk_id) DO UPDATE SET
      model = excluded.model, dim = excluded.dim,
      vector = excluded.vector, created_at = CURRENT_TIMESTAMP
  `);
  let embedded = 0;
  // v12.27: progress events `[progress] X/Y chunks` cada ~5%.
  const totalToEmbed = rows.length;
  const tickEmbed = Math.max(1, Math.min(50, Math.floor(totalToEmbed / 20) || 1));
  if (totalToEmbed > 0) process.stdout.write(`[progress] 0/${totalToEmbed} chunks\n`);
  db.exec("BEGIN");
  try {
    for (const row of rows) {
      const vector = localEmbedding(`${row.heading || ""} ${row.content || ""}`);
      upsert.run(row.id, LOCAL_EMBED_MODEL, LOCAL_EMBED_DIM, JSON.stringify(vector));
      embedded += 1;
      if (embedded === totalToEmbed || embedded % tickEmbed === 0) {
        process.stdout.write(`[progress] ${embedded}/${totalToEmbed} chunks\n`);
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  const total = countRows(db, "ai_chunk_embeddings");
  return { embedded, total, model: LOCAL_EMBED_MODEL, dim: LOCAL_EMBED_DIM };
}

function semanticSearchLocal(db, queryVector, { model = null, dim = null } = {}, limit = 8) {
  let sql = `
    SELECT e.chunk_id AS chunkId, e.vector AS vector, e.dim AS dim,
           d.path AS path, d.kind AS kind, d.phase AS phase,
           c.heading AS heading, c.content AS content
    FROM ai_chunk_embeddings e
    JOIN ai_document_chunks c ON c.id = e.chunk_id
    JOIN ai_documents d ON d.id = c.document_id
  `;
  const params = [];
  if (model) {
    sql += " WHERE e.model = ?";
    params.push(model);
  } else if (dim) {
    sql += " WHERE e.dim = ?";
    params.push(dim);
  }
  const rows = db.prepare(sql).all(...params);
  return rows
    .map((row) => {
      let stored;
      try {
        stored = JSON.parse(row.vector);
      } catch {
        stored = [];
      }
      return { row, score: cosineSimilarity(queryVector, stored) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.row.path.localeCompare(b.row.path))
    .slice(0, limit)
    .map((item) => ({
      path: item.row.path,
      chunkId: item.row.chunkId,
      kind: item.row.kind,
      phase: item.row.phase,
      heading: item.row.heading,
      score: item.score.toFixed(3),
      excerpt: item.row.content.replace(/\s+/g, " ").slice(0, 260),
    }));
}

// ── Visor de proyecto (v12.70) ──────────────────────────────────────────────
// Construye un arbol de archivos del proyecto (podado) y lee archivos de forma
// segura para la pestana "Proyecto" del panel embebido.
const FILE_VIEWER_IGNORE_DIRS = new Set([
  ".git", "node_modules", ".next", ".angular", ".cache", ".gradle", "target",
  "dist", "build", "bin", "out", "coverage", "playwright-report", "test-results",
  ".tmp", "__pycache__", ".venv", ".idea", ".vscode",
]);
const FILE_VIEWER_IGNORE_FILE_RE = /\.(db|db-wal|db-shm|log|lock)$|^\.DS_Store$/i;
const FILE_VIEWER_MAX_ENTRIES = 6000;
const FILE_VIEWER_IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "svg"]);
const FILE_VIEWER_MAX_TEXT = 512 * 1024;

function buildFileTree(rootDir) {
  let count = 0;
  function walk(absDir, relDir, depth) {
    if (depth > 12) return [];
    let entries;
    try { entries = fs.readdirSync(absDir, { withFileTypes: true }); } catch { return []; }
    entries.sort((a, b) => {
      const ad = a.isDirectory() ? 0 : 1, bd = b.isDirectory() ? 0 : 1;
      if (ad !== bd) return ad - bd;
      return a.name.localeCompare(b.name);
    });
    const out = [];
    for (const e of entries) {
      if (count >= FILE_VIEWER_MAX_ENTRIES) break;
      const rel = relDir ? relDir + "/" + e.name : e.name;
      if (e.isDirectory()) {
        if (FILE_VIEWER_IGNORE_DIRS.has(e.name)) continue;
        count += 1;
        out.push({ name: e.name, path: rel, type: "dir", children: walk(path.join(absDir, e.name), rel, depth + 1) });
      } else if (e.isFile()) {
        if (FILE_VIEWER_IGNORE_FILE_RE.test(e.name)) continue;
        count += 1;
        let size = 0; try { size = fs.statSync(path.join(absDir, e.name)).size; } catch { /* ignore */ }
        out.push({ name: e.name, path: rel, type: "file", size });
      }
    }
    return out;
  }
  return { root: path.basename(rootDir), truncated: count >= FILE_VIEWER_MAX_ENTRIES, children: walk(rootDir, "", 0) };
}

function fvEsc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Palabras clave para resaltado generico (cubre JS/TS/Java/Kotlin/Go/Python/etc.).
const HL_KW = new Set("function,return,const,let,var,if,else,for,while,do,switch,case,break,continue,class,new,import,export,from,as,default,async,await,try,catch,finally,throw,typeof,instanceof,in,of,extends,super,this,null,true,false,undefined,void,yield,delete,public,private,protected,static,readonly,interface,type,enum,implements,namespace,package,abstract,final,override,fun,val,def,lambda,with,pass,raise,elif,nil,func,struct,impl,trait,use,mod,pub,match,where".split(","));

// Resaltado line-local en una sola pasada (cada caracter pertenece a un token).
function hlLine(raw, ext) {
  const allowSlash = /^(js|mjs|cjs|ts|tsx|jsx|java|kt|kts|go|rs|c|h|cpp|cc|cs|scss|less|json5|swift|php)$/.test(ext);
  const allowHash = /^(sh|bash|zsh|yaml|yml|py|toml|env|conf|ini|dockerfile|gitignore|properties|mk)$/.test(ext);
  const parts = ['"(?:[^"\\\\]|\\\\.)*"', "'(?:[^'\\\\]|\\\\.)*'", "`(?:[^`\\\\]|\\\\.)*`"];
  if (allowSlash) parts.push("\\/\\/[^\\n]*");
  if (allowHash) parts.push("#[^\\n]*");
  parts.push("\\b\\d+(?:\\.\\d+)?\\b");
  parts.push("[A-Za-z_$][A-Za-z0-9_$]*");
  const re = new RegExp(parts.join("|"), "g");
  let out = "", last = 0, m;
  while ((m = re.exec(raw)) !== null) {
    out += fvEsc(raw.slice(last, m.index));
    const tok = m[0];
    let cls = null;
    if (tok[0] === '"' || tok[0] === "'" || tok[0] === "`") cls = "str";
    else if (tok.startsWith("//")) { cls = (m.index > 0 && raw[m.index - 1] === ":") ? null : "com"; }
    else if (tok[0] === "#") cls = "com";
    else if (/^\d/.test(tok)) cls = "num";
    else if (HL_KW.has(tok)) cls = "kw";
    out += cls ? '<span class="hl-' + cls + '">' + fvEsc(tok) + "</span>" : fvEsc(tok);
    last = m.index + tok.length;
  }
  out += fvEsc(raw.slice(last));
  return out;
}

// Render Markdown -> HTML compacto (headings, listas, tablas, code fences, inline).
function mdInline(escaped) {
  let s = escaped;
  s = s.replace(/`([^`]+)`/g, (m, c) => "<code>" + c + "</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^\w])\*([^*\n]+)\*(?=[^\w]|$)/g, "$1<em>$2</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
function mdToHtml(src) {
  const lines = String(src).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let inCode = false, codeBuf = [], listType = null, tableBuf = [];
  const closeList = () => { if (listType) { out.push("</" + listType + ">"); listType = null; } };
  const flushTable = () => {
    if (!tableBuf.length) { return; }
    const rows = tableBuf; tableBuf = [];
    const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => mdInline(fvEsc(c.trim())));
    let html = "<table><thead><tr>" + cells(rows[0]).map((c) => "<th>" + c + "</th>").join("") + "</tr></thead><tbody>";
    for (let k = 2; k < rows.length; k += 1) html += "<tr>" + cells(rows[k]).map((c) => "<td>" + c + "</td>").join("") + "</tr>";
    out.push(html + "</tbody></table>");
  };
  for (const ln of lines) {
    const fence = ln.match(/^```(\w*)/);
    if (fence) {
      if (inCode) { out.push('<pre class="md-code"><code>' + fvEsc(codeBuf.join("\n")) + "</code></pre>"); inCode = false; codeBuf = []; }
      else { closeList(); flushTable(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(ln); continue; }
    if (/^\s*\|.*\|\s*$/.test(ln)) { tableBuf.push(ln.trim()); continue; }
    if (tableBuf.length) flushTable();
    const h = ln.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeList(); out.push("<h" + h[1].length + ">" + mdInline(fvEsc(h[2])) + "</h" + h[1].length + ">"); continue; }
    if (/^(\s*[-*_]){3,}\s*$/.test(ln)) { closeList(); out.push("<hr/>"); continue; }
    const bq = ln.match(/^>\s?(.*)$/);
    if (bq) { closeList(); out.push("<blockquote>" + mdInline(fvEsc(bq[1])) + "</blockquote>"); continue; }
    const ul = ln.match(/^\s*[-*+]\s+(.*)$/);
    const ol = ln.match(/^\s*\d+\.\s+(.*)$/);
    if (ul) { if (listType !== "ul") { closeList(); out.push("<ul>"); listType = "ul"; } out.push("<li>" + mdInline(fvEsc(ul[1])) + "</li>"); continue; }
    if (ol) { if (listType !== "ol") { closeList(); out.push("<ol>"); listType = "ol"; } out.push("<li>" + mdInline(fvEsc(ol[1])) + "</li>"); continue; }
    if (/^\s*$/.test(ln)) { closeList(); continue; }
    closeList();
    out.push("<p>" + mdInline(fvEsc(ln)) + "</p>");
  }
  if (inCode) out.push('<pre class="md-code"><code>' + fvEsc(codeBuf.join("\n")) + "</code></pre>");
  closeList(); flushTable();
  return out.join("\n");
}

function readFileForViewer(abs, rel) {
  const size = fs.statSync(abs).size;
  const ext = (rel.split(".").pop() || "").toLowerCase();
  if (FILE_VIEWER_IMAGE_EXT.has(ext)) {
    if (size > 2 * 1024 * 1024) return { path: rel, size, kind: "too-large", ext };
    const b64 = fs.readFileSync(abs).toString("base64");
    const mime = ext === "svg" ? "image/svg+xml" : ("image/" + (ext === "jpg" ? "jpeg" : ext));
    return { path: rel, size, kind: "image", ext, dataUrl: "data:" + mime + ";base64," + b64 };
  }
  if (size > FILE_VIEWER_MAX_TEXT) return { path: rel, size, kind: "too-large", ext };
  const buf = fs.readFileSync(abs);
  if (buf.subarray(0, 8192).includes(0)) return { path: rel, size, kind: "binary", ext };
  const content = buf.toString("utf8");
  if (ext === "md" || ext === "markdown") {
    return { path: rel, size, kind: "markdown", ext, content, html: mdToHtml(content) };
  }
  const lines = content.split("\n").map((l) => hlLine(l, ext));
  const kind = (ext === "html" || ext === "htm") ? "html" : "text";
  return { path: rel, size, kind, ext, content, lines };
}

// ── Comandos de Sprint 1+2+3+4+5 ────────────────────────────────────────────

// S1.2 regenerate-context: reescribe las secciones marcadas con
// <!-- auto:start name=... --> / <!-- auto:end --> en AI_CONTEXT.md a partir
// de la BD. Las zonas sin marcador (Identidad, Proximos pasos) NO se tocan.
function regenerateAiContext(root, db) {
  const filePath = path.join(root, "AI_CONTEXT.md");
  if (!fs.existsSync(filePath)) {
    return { updated: false, reason: "AI_CONTEXT.md no existe en la raiz" };
  }
  const original = fs.readFileSync(filePath, "utf8");
  const features = buildFeaturesBlock(db);
  const gates = buildGatesBlock(db);
  const sessions = buildRecentSessionsBlock(db);
  const decisions = buildRecentDecisionsBlock(db); // v12.45
  // v12.31: leer version desde package.json para que `Version actual` ya no
  // se quede congelada cuando se bump-ea el template.
  let versionStr = "desconocida";
  try {
    const pkgPath = path.join(root, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.version) versionStr = `v${pkg.version}`;
    }
  } catch { /* no-op */ }
  // v12.32: zona `stack` auto-regenerable. Para el template canonico lee del
  // package.json (`engines.node`) + stacks de referencia disponibles. Para
  // proyectos generados, lee `template.config.json`.
  const stackStr = (() => {
    try {
      const tcPath = path.join(root, "template.config.json");
      if (fs.existsSync(tcPath)) {
        const tc = JSON.parse(fs.readFileSync(tcPath, "utf8"));
        const stack = tc.project?.stack || tc.stack;
        if (stack) return `Stack: ${stack}`;
      }
      const pkgPath = path.join(root, "package.json");
      const nodeReq = fs.existsSync(pkgPath) ? (JSON.parse(fs.readFileSync(pkgPath, "utf8")).engines?.node || "") : "";
      const stacksDir = path.join(root, "stacks");
      const stacks = fs.existsSync(stacksDir)
        ? fs.readdirSync(stacksDir).filter((d) => fs.statSync(path.join(stacksDir, d)).isDirectory())
        : [];
      const parts = [];
      if (nodeReq) parts.push(`Node ${nodeReq}`);
      if (stacks.length) parts.push(`stacks de referencia: ${stacks.join(", ")}`);
      return parts.length ? parts.join(" · ") : "Stack: no declarado";
    } catch { return "Stack: no declarado"; }
  })();
  const generators = {
    version: versionStr,
    stack: stackStr,
    features,
    "gates-pendientes": gates,
    "sesiones-recientes": sessions,
    "decisiones-recientes": decisions, // v12.45
    "ultima-actualizacion": new Date().toISOString().replace("T", " ").slice(0, 16),
  };
  const re = /(<!--\s*auto:start\s+name=([a-z0-9-]+)\s*-->)([\s\S]*?)(<!--\s*auto:end\s*-->)/g;
  let changed = false;
  const next = original.replace(re, (full, start, name, _body, end) => {
    if (!(name in generators)) return full;
    changed = true;
    return `${start}\n${generators[name]}\n${end}`;
  });
  if (changed) {
    fs.writeFileSync(filePath, next, "utf8");
    return { updated: true, sections: Object.keys(generators).filter((k) => next.includes(`auto:start name=${k}`)) };
  }
  return {
    updated: false,
    reason:
      "AI_CONTEXT.md no contiene zonas <!-- auto:start name=... -->. Agrega marcadores para activar la regeneracion.",
  };
}

function buildFeaturesBlock(db) {
  // Una fila por feature scope (specs/<feature>) con su estado consolidado.
  const rows = db
    .prepare(`
      SELECT phase_scope, gate, status FROM ai_gate_runs
      WHERE phase_scope LIKE 'specs/%'
      ORDER BY phase_scope, gate
    `)
    .all();
  const byFeature = new Map();
  for (const r of rows) {
    const feature = r.phase_scope.replace(/^specs\//, "");
    if (!byFeature.has(feature)) byFeature.set(feature, []);
    byFeature.get(feature).push(r);
  }
  if (byFeature.size === 0) {
    return "| Feature | Fase | Estado | Gate bloqueante |\n|---|---|---|---|\n| _(sin features con gates registrados)_ | - | - | - |";
  }
  const lines = ["| Feature | Estado consolidado | Gates |"];
  lines.push("|---|---|---|");
  for (const [feature, gates] of byFeature) {
    const blocking = gates.find((g) => !/aprob|listo|complet|cerrad|valid/i.test(g.status));
    const consolidated = blocking ? `Bloqueado: ${blocking.gate}` : "OK";
    const gateSummary = gates.map((g) => `${g.gate}=${g.status}`).join("; ");
    lines.push(`| ${feature} | ${consolidated} | ${gateSummary} |`);
  }
  return lines.join("\n");
}

function buildGatesBlock(db) {
  const rows = db
    .prepare(`
      SELECT gate, phase_scope, status, actor, decided_at FROM ai_gate_runs
      WHERE status NOT LIKE 'Aprob%' AND status NOT LIKE 'Listo%' AND status NOT LIKE 'Cerrad%'
      ORDER BY phase_scope, gate
    `)
    .all();
  if (rows.length === 0) return "- _(no hay gates pendientes registrados)_";
  return rows
    .map(
      (r) =>
        `- \`${r.gate}\` en \`${r.phase_scope}\` — ${r.status}${r.actor ? ` (ultimo: ${r.actor}${r.decided_at ? `, ${r.decided_at.slice(0, 10)}` : ""})` : ""}`,
    )
    .join("\n");
}

function buildRecentSessionsBlock(db) {
  const rows = db
    .prepare(`
      SELECT occurred_at, agent, summary FROM ai_session_events
      ORDER BY occurred_at DESC LIMIT 3
    `)
    .all();
  if (rows.length === 0) return "- _(sin entradas en SESSION_LOG.md)_";
  return rows
    .map((r) => `- **${r.occurred_at}** — ${r.agent || "(sin agente)"} — ${r.summary}`)
    .join("\n");
}

// v12.45: bloque de decisiones recientes (ADR/decisiones-ux) para AI_CONTEXT.md.
// Toma las ultimas 5 por decided_at (si existe) o por title cuando no hay fecha.
function buildRecentDecisionsBlock(db) {
  let rows = [];
  try {
    rows = db
      .prepare(`
        SELECT title, status, decision_ref, adr_path, decided_at FROM ai_decisions
        WHERE decided_at IS NOT NULL
        ORDER BY decided_at DESC LIMIT 5
      `)
      .all();
    if (rows.length === 0) {
      rows = db
        .prepare(`SELECT title, status, decision_ref, adr_path, decided_at FROM ai_decisions ORDER BY title DESC LIMIT 5`)
        .all();
    }
  } catch { /* tabla puede no existir aun */ }
  if (!rows || rows.length === 0) return "- _(sin ADR / decisiones registradas)_";
  return rows
    .map((r) => {
      const date = r.decided_at ? `**${r.decided_at}** — ` : "";
      const ref = r.decision_ref ? `\`${r.decision_ref}\` ` : "";
      const status = r.status ? ` _(${r.status})_` : "";
      const link = r.adr_path ? ` — [ver](${r.adr_path})` : "";
      return `- ${date}${ref}${r.title}${status}${link}`;
    })
    .join("\n");
}

// S1.3 freshness: indica si la BD esta atrasada respecto a los Markdown.
// v12.39: tolerancia explicita para evitar falsos STALE por precision de
// timestamp. SQLite CURRENT_TIMESTAMP guarda segundos (`xx:xx:34`) y el
// filesystem reporta milisegundos (`xx:xx:34.524`). Cuando regenerate-context
// modifica AI_CONTEXT.md justo antes de index-docs, los 524ms de diferencia
// generaban STALE perpetuo aunque la BD si tenia los datos. Tolerancia 2000ms.
// v12.40: configurable via env MEMORY_FRESHNESS_TOLERANCE_MS (default 2000).
//   0     -> sin tolerancia (modo estricto)
//   2000  -> default
//   60000 -> 1 minuto (util en CI con clock skew entre runners)
const FRESHNESS_TOLERANCE_MS = (() => {
  const env = Number(process.env.MEMORY_FRESHNESS_TOLERANCE_MS);
  if (Number.isFinite(env) && env >= 0) return env;
  return 2000;
})();

function memoryFreshness(root, db) {
  let newestSource = 0;
  for (const file of collectFiles(root)) {
    const stat = fs.statSync(file);
    if (stat.mtimeMs > newestSource) newestSource = stat.mtimeMs;
  }
  const row = db
    .prepare("SELECT MAX(updated_at) AS ts FROM ai_documents")
    .get();
  const lastIndexed = row && row.ts ? new Date(row.ts).getTime() : 0;
  if (!newestSource) return { stale: false, lastIndexed: null, newestSource: null, toleranceMs: FRESHNESS_TOLERANCE_MS };
  // Tolerancia: si el delta es <2s, no es STALE real (precision de timestamp).
  const delta = newestSource - lastIndexed;
  const stale = delta > FRESHNESS_TOLERANCE_MS;
  return {
    stale,
    lastIndexed: lastIndexed ? new Date(lastIndexed).toISOString() : null,
    newestSource: new Date(newestSource).toISOString(),
    toleranceMs: FRESHNESS_TOLERANCE_MS,
    deltaMs: delta,
  };
}

// S2.1 context-pack: bundle JSON con todo lo relevante para un topic.
function contextPack(db, topic, limit = 5) {
  const chunks = search(db, topic, limit);
  // RF/HU mencionados en el topic
  const refMatches = [...String(topic).matchAll(/\b(RF-\d+|RNF-\d+|HU-\d+|ADR-\d+|gate-[a-z0-9-]+)\b/gi)].map(
    (m) => m[1],
  );
  const refs = [...new Set(refMatches.map((r) => r.toUpperCase()))];

  const traceLinks = [];
  const gateRuns = [];
  const decisions = [];
  const evidence = [];
  const openQuestions = [];

  for (const ref of refs) {
    const links = db
      .prepare(
        `SELECT source_type, source_ref, target_type, target_ref, relation, evidence_ref
         FROM ai_trace_links
         WHERE source_ref = ? OR target_ref LIKE ?`,
      )
      .all(ref, `%${ref}%`);
    for (const r of links) traceLinks.push(r);
    if (/^gate-/i.test(ref)) {
      for (const r of db.prepare("SELECT * FROM ai_gate_runs WHERE gate = ?").all(ref.toLowerCase())) {
        gateRuns.push(r);
      }
    }
    if (/^ADR-/i.test(ref)) {
      for (const r of db.prepare("SELECT * FROM ai_decisions WHERE decision_ref = ?").all(ref.toUpperCase())) {
        decisions.push(r);
      }
    }
  }

  // Tambien gates / preguntas que mencionen el topic
  const likeTopic = `%${topic}%`;
  for (const r of db
    .prepare("SELECT * FROM ai_gate_runs WHERE phase_scope LIKE ? OR status LIKE ? LIMIT 8")
    .all(likeTopic, likeTopic)) {
    if (!gateRuns.find((x) => x.id === r.id)) gateRuns.push(r);
  }
  for (const r of db
    .prepare(
      "SELECT * FROM ai_open_questions WHERE question LIKE ? OR source_ref LIKE ? LIMIT 8",
    )
    .all(likeTopic, likeTopic)) {
    openQuestions.push(r);
  }
  for (const r of db
    .prepare(
      "SELECT * FROM ai_evidence_items WHERE description LIKE ? OR path LIKE ? LIMIT 8",
    )
    .all(likeTopic, likeTopic)) {
    evidence.push(r);
  }

  return {
    topic,
    generatedAt: new Date().toISOString(),
    refs,
    chunks,
    traceLinks,
    gateRuns,
    decisions,
    evidence,
    openQuestions,
  };
}

// S2.2 next-task: encuentra una tarea desbloqueada por reglas declarativas.
function nextTask(db) {
  // Regla 1: RF con prototipo validado pero sin trace de codigo/test.
  const rfsWithoutCode = db
    .prepare(
      `SELECT DISTINCT t.source_ref AS rf, t.evidence_ref
       FROM ai_trace_links t
       WHERE t.source_type = 'RF'
         AND t.target_type = 'prototipo'
         AND NOT EXISTS (
           SELECT 1 FROM ai_trace_links t2
           WHERE t2.source_ref = t.source_ref
             AND t2.target_type IN ('codigo', 'test')
         )
       ORDER BY t.source_ref`,
    )
    .all();
  if (rfsWithoutCode.length > 0) {
    return {
      priority: "alta",
      rule: "RF con prototipo pero sin codigo+test",
      action: `Implementar codigo y test para ${rfsWithoutCode[0].rf}. Ver evidencia: ${rfsWithoutCode[0].evidence_ref}`,
      candidates: rfsWithoutCode.slice(0, 5),
    };
  }
  // Regla 2: gate pendiente con evidencia registrada.
  const gatesPending = db
    .prepare(
      `SELECT gate, phase_scope, status, summary
       FROM ai_gate_runs
       WHERE status NOT LIKE 'Aprob%' AND status NOT LIKE 'Cerrad%'
       ORDER BY phase_scope`,
    )
    .all();
  if (gatesPending.length > 0) {
    return {
      priority: "media",
      rule: "gate pendiente — revisar y aprobar/escalar",
      action: `Revisar \`${gatesPending[0].gate}\` en ${gatesPending[0].phase_scope}. Evidencia: ${gatesPending[0].summary}`,
      candidates: gatesPending.slice(0, 5),
    };
  }
  // Regla 3: preguntas abiertas.
  const open = db.prepare("SELECT * FROM ai_open_questions WHERE status = 'open' LIMIT 5").all();
  if (open.length > 0) {
    return {
      priority: "baja",
      rule: "preguntas abiertas — resolver para destrabar avance",
      action: `Resolver: ${open[0].question}`,
      candidates: open,
    };
  }
  return { priority: "ninguna", rule: "sin tareas detectadas por reglas", action: "Define la siguiente meta manualmente", candidates: [] };
}

// S2.3 diff-since: cambios en trazabilidad/gates/ADRs/sesiones desde un commit/fecha.
function diffSince(root, db, ref) {
  let sinceISO = ref;
  // Si parece un commit/branch, pedir fecha a git.
  if (!/^\d{4}-\d{2}-\d{2}/.test(ref)) {
    try {
      const r = spawnSync("git", ["log", "-1", "--format=%aI", ref], {
        cwd: root,
        encoding: "utf8",
        timeout: 2000,
        windowsHide: true,
      });
      if (r.status === 0 && r.stdout.trim()) sinceISO = r.stdout.trim();
    } catch {
      /* fallback */
    }
  }
  const sessions = db
    .prepare("SELECT * FROM ai_session_events WHERE occurred_at >= ? ORDER BY occurred_at")
    .all(sinceISO);
  const gates = db
    .prepare(
      "SELECT * FROM ai_gate_runs WHERE decided_at IS NOT NULL AND decided_at >= ? ORDER BY decided_at",
    )
    .all(sinceISO);
  const decisions = db
    .prepare(
      "SELECT * FROM ai_decisions WHERE decided_at IS NOT NULL AND decided_at >= ? ORDER BY decided_at",
    )
    .all(sinceISO);
  return { since: sinceISO, sessions, gates, decisions };
}

// S3.1 harvest-trace: escanea source code por @trace/@implements/@covers y
// emite trace_links de tipo source con confianza 0.8 (inferido).
const HARVEST_SOURCE_DIRS = ["src", "backend", "frontend", "tests"];
const HARVEST_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".cjs",
  ".java", ".kt",
  ".py",
  ".go",
  ".rs",
  ".cs",
]);

function harvestTraceFromSource(root, db) {
  const files = [];
  const walk = (abs) => {
    if (!fs.existsSync(abs)) return;
    const stat = fs.statSync(abs);
    const rel = normalizeRelative(root, abs);
    if (isIgnored(rel)) return;
    if (stat.isDirectory()) {
      for (const e of fs.readdirSync(abs)) walk(path.join(abs, e));
    } else if (
      stat.isFile() &&
      HARVEST_EXTENSIONS.has(path.extname(abs).toLowerCase())
    ) {
      files.push(abs);
    }
  };
  for (const d of HARVEST_SOURCE_DIRS) walk(path.resolve(root, d));

  // Limpiar links previos de tipo source (cosechados) antes de repoblar.
  // v12.22: tambien se identifican por origin='source-harvest' para futura limpieza.
  db.exec("DELETE FROM ai_trace_links WHERE source_type = 'source' OR origin = 'source-harvest'");
  // v12.41: harvest siempre genera links de tipo 'codigo' (target HU/RF/RNF/ADR
  // que son documentales). El display_status apropiado es 'documented' para los
  // documentales (HU/RF/RNF/ADR). Se calcula por fila.
  const insert = db.prepare(`
    INSERT INTO ai_trace_links(
      source_type, source_ref, target_type, target_ref, relation,
      confidence, evidence_ref, link_status, origin, source_file, display_status
    )
    VALUES ('source', ?, ?, ?, ?, ?, ?, 'implemented', 'source-harvest', ?, 'documented')
  `);
  const tagRe = /@(trace|implements|covers|fixes)\s+(RF-\d+|RNF-\d+|HU-\d+|ADR-\d+)/gi;
  let count = 0;
  db.exec("BEGIN");
  try {
    for (const file of files) {
      const rel = normalizeRelative(root, file);
      const text = fs.readFileSync(file, "utf8");
      let m;
      while ((m = tagRe.exec(text)) !== null) {
        const tag = m[1].toLowerCase();
        const target = m[2].toUpperCase();
        const relation =
          tag === "trace"
            ? "trazado-en"
            : tag === "implements"
              ? "implementa"
              : tag === "covers"
                ? "cubre-test"
                : "corrige";
        const targetType = target.startsWith("HU-")
          ? "HU"
          : target.startsWith("ADR-")
            ? "ADR"
            : target.startsWith("RNF-")
              ? "RNF"
              : "RF";
        // v12.32: separar source_file (path al archivo de codigo) de evidence_ref
        // (cita semantica del trace tag con linea aproximada). Antes ambos eran
        // iguales (rel). Ahora evidence_ref = "src/foo.ts:42 @trace RF-02".
        const upTo = text.slice(0, m.index);
        const line = upTo.split("\n").length;
        const evidenceRef = `${rel}:${line} @${tag} ${target}`;
        insert.run(rel, targetType, target, relation, 0.8, evidenceRef, rel);
        count += 1;
      }
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return { count, files: files.length };
}

// S4.4 check-spec-dedup: detecta specs semanticamente cercanas usando los
// embeddings locales. Reporta pares con cosine >= threshold.
function checkSpecDedup(db, threshold = 0.85) {
  // Solo comparar chunks de archivos en specs/ que sean spec-funcional u objetivo
  const rows = db
    .prepare(
      `SELECT e.chunk_id AS chunkId, e.vector AS vector, e.dim AS dim,
              d.path AS path, c.heading AS heading
       FROM ai_chunk_embeddings e
       JOIN ai_document_chunks c ON c.id = e.chunk_id
       JOIN ai_documents d ON d.id = c.document_id
       WHERE d.path LIKE 'specs/%/spec-funcional.md'
         AND e.model = 'local-hash-v1'`,
    )
    .all();
  const parsed = rows.map((r) => ({
    chunkId: r.chunkId,
    path: r.path,
    heading: r.heading,
    vec: JSON.parse(r.vector),
  }));
  const pairs = [];
  for (let i = 0; i < parsed.length; i += 1) {
    for (let j = i + 1; j < parsed.length; j += 1) {
      if (parsed[i].path === parsed[j].path) continue;
      const s = cosineSimilarity(parsed[i].vec, parsed[j].vec);
      if (s >= threshold) {
        pairs.push({
          score: s,
          a: { path: parsed[i].path, heading: parsed[i].heading },
          b: { path: parsed[j].path, heading: parsed[j].heading },
        });
      }
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  return pairs;
}

// S5.1 watch: re-ejecuta index-docs + sync-memory + embed-docs en cambios.
// Modos:
//   once          - hace una sola sincronizacion y sale (para hooks/CI)
//   interval=Ns   - polling cada N segundos (alternativa a fs.watch)
//   default       - fs.watch sobre directorios con debounce 1.5s + banner
//                   de keep-alive cada 5 min
async function watchMemory(root, dbPath, options = {}) {
  const { once = false, intervalSec = 0 } = options;
  const debounceMs = 1500;
  const idleBannerMs = 5 * 60 * 1000; // 5 minutos
  let pending = null;
  let lastRunAt = 0;
  let syncsCount = 0;

  const ensureDbAndRun = async () => {
    const db = await ensureDatabase(root, dbPath);
    try {
      const r1 = indexDocuments(root, db, { force: false });
      const r2 = syncMemory(root, db);
      const r3 = embedDocuments(db, { force: false });
      lastRunAt = Date.now();
      syncsCount += 1;
      console.log(
        `[watch] re-sync ok — docs:${r1.indexed} sync:${r2.traceLinks + r2.gateRuns + r2.evidence + r2.decisions + r2.openQuestions + r2.sessionEvents} embed:${r3.embedded}`,
      );
    } catch (e) {
      console.error(`[watch] error: ${e.message}`);
    } finally {
      db.close();
    }
  };

  // Modo once: una sola corrida y salida.
  if (once) {
    await ensureDbAndRun();
    return { mode: "once", syncs: syncsCount };
  }

  const trigger = () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      pending = null;
      ensureDbAndRun();
    }, debounceMs);
  };

  // Modo interval (polling).
  if (intervalSec && intervalSec > 0) {
    console.log(`[watch] polling cada ${intervalSec}s. Ctrl+C para salir.`);
    await ensureDbAndRun();
    setInterval(ensureDbAndRun, intervalSec * 1000);
  } else {
    // Modo fs.watch (default).
    const watchDirs = ["docs", "specs", "ai", "qa", "."];
    for (const d of watchDirs) {
      const abs = path.resolve(root, d);
      if (!fs.existsSync(abs)) continue;
      try {
        fs.watch(abs, { recursive: true }, (_event, filename) => {
          if (!filename) return;
          if (!filename.toLowerCase().endsWith(".md")) return;
          if (filename.includes(".db") || filename.includes("/.git/") || filename.includes("\\.git\\"))
            return;
          trigger();
        });
      } catch (e) {
        console.error(`[watch] no se pudo observar ${d}: ${e.message}`);
      }
    }
    console.log(`[watch] observando ${watchDirs.join(", ")} (debounce ${debounceMs}ms). Ctrl+C para salir.`);
    await ensureDbAndRun();
  }

  // Banner de inactividad: cada 5 min muestra que sigue vivo si no hubo cambios.
  setInterval(() => {
    const idleMin = Math.round((Date.now() - lastRunAt) / 60000);
    if (idleMin >= 5) {
      console.log(`[watch] activo · sin cambios desde hace ${idleMin} min · ${syncsCount} re-sync acumulados`);
    }
  }, idleBannerMs);
}

// S5.2 template-drift: compara un proyecto generado vs lo que el template
// emitiria hoy con su config. Reporta diffs por archivo.
function parseIntervalSeconds(value) {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return 0;
  const m = s.match(/^(\d+)\s*(s|sec|seg|m|min|h|hr)?$/);
  if (!m) return 0;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const unit = m[2] || "s";
  if (unit.startsWith("h")) return n * 3600;
  if (unit.startsWith("m")) return n * 60;
  return n;
}

// install-hooks: instala (o desinstala) un pre-commit hook que mantiene la
// memoria fresca al hacer commit. El hook es opcional, no bloquea el commit
// si falla (la BD es reconstruible y .gitignored).
function installPreCommitHook(root, { uninstall = false } = {}) {
  const gitDir = path.resolve(root, ".git");
  if (!fs.existsSync(gitDir) || !fs.statSync(gitDir).isDirectory()) {
    console.error(`Error: no se encontro repo git en ${root} (.git no existe). Inicializa con 'git init'.`);
    return 1;
  }
  const hooksDir = path.join(gitDir, "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });
  const hookPath = path.join(hooksDir, "pre-commit");
  const marker = "# auto-installed by ai-framework-agent install-hooks";

  if (uninstall) {
    if (!fs.existsSync(hookPath)) {
      console.log("No hay pre-commit hook instalado por ai-framework-agent. Nada que desinstalar.");
      return 0;
    }
    const existing = fs.readFileSync(hookPath, "utf8");
    if (!existing.includes(marker)) {
      console.error(
        "El hook pre-commit existe pero no fue instalado por ai-framework-agent. No lo toco para no destruir trabajo manual.",
      );
      return 1;
    }
    fs.unlinkSync(hookPath);
    console.log(`OK. Hook desinstalado: ${hookPath}`);
    return 0;
  }

  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf8");
    if (!existing.includes(marker)) {
      console.error(
        `Error: ya existe ${hookPath} y no fue creado por ai-framework-agent. Mueve/respalda el archivo o usa --uninstall manualmente.`,
      );
      return 1;
    }
    // Mismo hook ya instalado: lo reescribo para refrescar (idempotente).
  }

  const script = `#!/bin/sh
${marker}
# Sincroniza la memoria del agente (ai/memory/framework-agent.db) antes del commit.
# La BD es reconstruible y .gitignored: este hook solo mantiene la memoria local fresca
# para que el agente IA tenga datos actuales al consultarla.
# No bloquea el commit si falla.

if command -v node >/dev/null 2>&1; then
  node scripts/ai-framework-agent.mjs watch --once >/dev/null 2>&1 || true
fi

exit 0
`;
  fs.writeFileSync(hookPath, script, "utf8");
  try {
    fs.chmodSync(hookPath, 0o755);
  } catch {
    // Windows: chmod puede fallar pero los hooks .sh funcionan via Git Bash.
  }
  console.log(`OK. Pre-commit hook instalado: ${hookPath}`);
  console.log("Cada 'git commit' ahora ejecuta 'watch --once' (sync rapido de la memoria).");
  console.log("Para desinstalar: node scripts/ai-framework-agent.mjs install-hooks --uninstall");
  return 0;
}

function templateDriftReport(root, dest, ctx) {
  const expected = allDocumentationFiles(ctx);
  const diffs = [];
  for (const [rel, content] of expected) {
    const destFile = path.join(dest, ...rel.split("/"));
    if (!fs.existsSync(destFile)) {
      diffs.push({ path: rel, status: "missing" });
      continue;
    }
    const current = fs.readFileSync(destFile, "utf8");
    if (current.trim() === content.trim()) {
      diffs.push({ path: rel, status: "match" });
    } else {
      const expectedLines = content.split(/\r?\n/).length;
      const currentLines = current.split(/\r?\n/).length;
      diffs.push({
        path: rel,
        status: "drift",
        expectedLines,
        currentLines,
        delta: currentLines - expectedLines,
      });
    }
  }
  return diffs;
}

// ── generate-prototype-hub: autogenera prototype/index.html desde specs/+BD ──
// Lee specs/<feature>/decisiones-ux.md y traceability.md, mas la BD de memoria,
// y rellena las zonas <!-- @auto:start name=X --> de la plantilla
// plantillas/fase-2-ux-ui/prototype-hub.html.tmpl. Idempotente: si el hub
// existe, conserva las zonas no-auto del HTML actual.

// Acentos del hub derivados de una sola marca. No cambian el look and feel por
// feature; solo dan contraste leve entre cards dentro del mismo sistema visual.
function hubSpecColor(root, index) {
  let hue = 222;
  let sat = 55;
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, "template.config.json"), "utf8"));
    if (typeof cfg?.prototype?.brand_hue === "number") hue = (((cfg.prototype.brand_hue % 360) + 360) % 360);
    if (typeof cfg?.prototype?.brand_saturation === "number") sat = Math.max(0, Math.min(100, cfg.prototype.brand_saturation));
  } catch {
    // Mantiene defaults si aun no existe config del proyecto.
  }
  const lightness = [38, 44, 50, 56][index % 4];
  return `hsl(${hue} ${sat}% ${lightness}%)`;
}

function readSpecsDir(root) {
  const specsDir = path.join(root, "specs");
  if (!fs.existsSync(specsDir)) return [];
  return fs
    .readdirSync(specsDir)
    .filter((name) => /^\d+-/.test(name))
    .filter((name) => fs.statSync(path.join(specsDir, name)).isDirectory())
    .sort();
}

function readSpecMeta(root, featureDir) {
  const base = path.join(root, "specs", featureDir);
  const meta = {
    feature: featureDir,
    num: featureDir.split("-")[0],
    slug: featureDir.replace(/^\d+-/, ""),
    title: featureDir.replace(/^\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    domain: null,
    actors: [],
    description: "",
    invariants: [],
    status: "pendiente",
    statusClass: "pendiente",
    journeyName: "",
    artifacts: {},
  };
  // decisiones-ux.md
  const decisionesPath = path.join(base, "prototype-html5", "decisiones-ux.md");
  if (fs.existsSync(decisionesPath)) {
    const text = fs.readFileSync(decisionesPath, "utf8");
    const m = (re) => (text.match(re) || [])[1]?.trim() || "";
    meta.domain = m(/Dominio[^\n:]*:\s*([^\n]+)/i);
    const actorLine = m(/Actor[^\n:]*:\s*([^\n]+)/i);
    if (actorLine) {
      meta.actors = actorLine
        .split(/[,;/]| y /)
        .map((a) => a.trim().replace(/\([^)]*\)/g, "").trim())
        .filter(Boolean)
        .filter((a) => !/^<|^TODO|^PENDIENTE/i.test(a));
    }
    meta.journeyName = m(/Tarea principal[^\n:]*:\s*([^\n]+)/i).slice(0, 40);
  }
  // spec-funcional.md para descripcion + objetivo
  const specPath = path.join(base, "spec-funcional.md");
  if (fs.existsSync(specPath)) {
    const text = fs.readFileSync(specPath, "utf8");
    const obj = (text.match(/##\s*Objetivo\s*\n([\s\S]*?)(?=\n##|$)/i) || [])[1];
    if (obj) meta.description = sanitizeInline(obj).slice(0, 240);
    if (!meta.title || /^\d/.test(meta.title)) {
      const h1 = (text.match(/^#\s+(?:Spec funcional\s*-\s*)?(.+)$/m) || [])[1];
      if (h1) meta.title = h1.trim();
    }
  }
  // traceability.md → invariantes (top-3 trace links) + estado
  const tracePath = path.join(base, "traceability.md");
  if (fs.existsSync(tracePath)) {
    const text = fs.readFileSync(tracePath, "utf8");
    for (const table of parseMarkdownTables(text)) {
      const rfIdx = table.headers.findIndex((h) => h === "rf" || h === "requerimiento" || h === "origen");
      const estadoIdx = table.headers.findIndex((h) => h === "estado");
      if (rfIdx === -1) continue;
      for (const row of table.rows) {
        const rf = cleanCell(row[rfIdx]);
        if (!rf) continue;
        const estado = estadoIdx >= 0 ? cleanCell(row[estadoIdx]) : "";
        if (meta.invariants.length < 4) {
          // Frase corta basada en el RF + algun target
          const codigoIdx = table.headers.findIndex((h) => h === "codigo");
          const apiIdx = table.headers.findIndex((h) => h === "api");
          const target = (codigoIdx >= 0 && cleanCell(row[codigoIdx])) || (apiIdx >= 0 && cleanCell(row[apiIdx])) || "";
          const inv = target ? `${rf}: ${target.slice(0, 50)}` : rf;
          meta.invariants.push({ icon: rf.startsWith("RNF") ? "🔒" : "🔴", text: inv });
        }
        if (estado && /valid|aprob|listo|complet/i.test(estado)) {
          meta.status = "Validado";
          meta.statusClass = "validado";
        } else if (estado && /bloque|falla|recha/i.test(estado)) {
          meta.status = "Bloqueado";
          meta.statusClass = "bloqueado";
        } else if (estado && /revis|review/i.test(estado)) {
          meta.status = "En revision";
          meta.statusClass = "en-revision";
        }
      }
    }
  }
  // Cobertura: existencia de artefactos
  const checkFile = (rel) => fs.existsSync(path.join(base, rel));
  meta.artifacts = {
    prototype: checkFile("prototype-html5/index.html"),
    "ui-test-cases": checkFile("ui-test-cases.md"),
    "api-contract": checkFile("api-contract.md"),
    "spec-funcional": checkFile("spec-funcional.md"),
    "spec-tecnica": checkFile("spec-tecnica.md"),
    "spec-tareas": checkFile("spec-tareas.md"),
    traceability: checkFile("traceability.md"),
  };
  if (!meta.description) {
    meta.description = `Vertical funcional ${meta.num} del producto.`;
  }
  return meta;
}

function deriveActors(specsMeta) {
  // Une todos los actores declarados y devuelve unicos con emoji.
  const seen = new Map();
  for (const s of specsMeta) {
    for (const a of s.actors) {
      const key = stripAccents(a.toLowerCase()).replace(/[^a-z]/g, "").slice(0, 20);
      if (!key) continue;
      if (!seen.has(key)) {
        seen.set(key, { name: a.toUpperCase(), emoji: guessActorEmoji(a), specs: [] });
      }
      seen.get(key).specs.push(s);
    }
  }
  return [...seen.values()];
}

function guessActorEmoji(actor) {
  const a = stripAccents(actor.toLowerCase());
  if (/(nino|kid|child|infant)/.test(a)) return "👧";
  if (/(joven|teen)/.test(a)) return "🎓";
  if (/(padre|madre|familia|parent)/.test(a)) return "👨‍👩‍👧";
  if (/(operador|operator)/.test(a)) return "👷";
  if (/(supervisor)/.test(a)) return "👤";
  if (/(auditor|audit)/.test(a)) return "🔍";
  if (/(admin|administ)/.test(a)) return "🛡️";
  if (/(editor|content)/.test(a)) return "✏️";
  if (/(client|customer|usuario)/.test(a)) return "👤";
  if (/(analista|analyst)/.test(a)) return "📊";
  if (/(director|gerente|manager)/.test(a)) return "💼";
  if (/(visor|viewer|guest)/.test(a)) return "👁";
  return "👤";
}

function buildHubData(root, db) {
  const features = readSpecsDir(root);
  const specs = features.map((f, i) => {
    const meta = readSpecMeta(root, f);
    meta.color = hubSpecColor(root, i);
    return meta;
  });
  const actors = deriveActors(specs);

  // Status global
  let globalStatus = "ok";
  let globalLabel = "✓ TODOS VALIDADOS";
  const pendings = specs.filter((s) => s.statusClass !== "validado");
  if (pendings.length > 0) {
    globalStatus = "warn";
    globalLabel = `⏳ ${pendings.length} VALIDACION${pendings.length === 1 ? "" : "ES"} HUMANA PENDIENTE${pendings.length === 1 ? "" : "S"}`;
  }

  // Decisiones transversales: ADRs aceptadas/propuestas + decisiones-ux comunes
  const decisions = [];
  if (db) {
    try {
      const rows = db
        .prepare(
          "SELECT title, status, decision_ref FROM ai_decisions WHERE decision_ref LIKE 'ADR-%' ORDER BY decision_ref LIMIT 8",
        )
        .all();
      for (const r of rows) {
        decisions.push(`${r.decision_ref}: ${r.title.replace(/^ADR-\d+\s*-\s*/, "").trim()} — ${r.status}`);
      }
    } catch {}
  }
  // Decisiones inherentes al template
  decisions.push("Politica de simulacion: el hub conserva el banner; los prototipos individuales NO lo llevan (regla v12.20).");
  decisions.push("Goldens nivel 3 son piso de calidad: los prototipos se calibran contra `ejemplos/fase-2-ux-ui/prototype-html5-golden/`.");
  decisions.push("Auto-rating obligatorio (`generar-prototipo-html5-ejecutable.md`) antes de declarar un prototipo listo.");
  return { specs, actors, globalStatus, globalLabel };
}

function renderHubJourneys(specs, actors) {
  if (actors.length === 0) {
    return "      <p style=\"color:var(--neutral-500);font-size:13px\">Aun no hay actores declarados en los `decisiones-ux.md` de las specs.</p>";
  }
  return actors
    .map((actor) => {
      const steps = actor.specs
        .map(
          (s) => `
        <a class="j-node" href="../specs/${s.feature}/prototype-html5/index.html?from=hub&demo-mode=true&role=${encodeURIComponent(actor.id || 'default')}" target="_blank" style="--card-clr:${s.color}">
          <span class="j-num">${s.num}</span>
          <span class="j-name">${escapeHtml(s.title)}</span>
        </a>`,
        )
        .join('<span class="j-arrow"></span>');
      return `      <div class="journey-row">
        <div class="journey-actor-label"><div class="actor-pill">${actor.emoji} ${escapeHtml(actor.name)}</div></div>
        <div class="journey-steps">${steps}
        </div>
      </div>`;
    })
    .join("\n");
}

function renderHubSpecs(specs) {
  if (specs.length === 0) return "      <p style=\"color:var(--neutral-500);font-size:13px\">No hay specs en `specs/` aun.</p>";
  return specs
    .map((s) => {
      const invariants = s.invariants
        .map((inv) => `        <li><span class="inv-icon">${inv.icon}</span>${escapeHtml(inv.text)}</li>`)
        .join("\n");
      const actorChips = s.actors
        .slice(0, 3)
        .map((a) => `<span class="actor-chip">${guessActorEmoji(a)} ${escapeHtml(a.toUpperCase())}</span>`)
        .join("");
      return `      <div class="spec-card" style="--card-clr:${s.color}">
        <div class="card-top">
          <span class="spec-num-badge">SPEC ${s.num}</span>
          <span class="status-pill ${s.statusClass}">${s.statusClass === "validado" ? "✓" : s.statusClass === "bloqueado" ? "✗" : "⏳"} ${escapeHtml(s.status)}</span>
        </div>
        <h3 class="spec-title">${escapeHtml(s.title)}</h3>
        <p class="spec-desc">${escapeHtml(s.description)}</p>
        ${
          invariants
            ? `<ul class="invariants">
${invariants}
        </ul>`
            : ""
        }
        <div class="card-bottom">
          <div class="actor-chips">${actorChips}</div>
          ${s.artifacts.prototype ? `<a class="open-btn" href="../specs/${s.feature}/prototype-html5/index.html?from=hub&demo-mode=true" target="_blank">Abrir →</a>` : `<span class="open-btn" style="opacity:0.5;cursor:not-allowed">Pendiente</span>`}
        </div>
      </div>`;
    })
    .join("\n");
}

function renderHubActors(actors) {
  if (actors.length === 0) return "      <p style=\"color:var(--neutral-500);font-size:13px\">Aun no hay actores declarados.</p>";
  return actors
    .map((a) => {
      const specTags = a.specs.map((s) => `<span class="spec-tag">${s.num}</span>`).join("");
      const desc = `Toca ${a.specs.length} vertical${a.specs.length === 1 ? "" : "es"} del producto. ${a.specs[0]?.description?.slice(0, 80) || ""}`;
      return `      <div class="actor-card">
        <div class="actor-emoji">${a.emoji}</div>
        <div class="actor-name">${escapeHtml(a.name)}</div>
        <div class="actor-role">${a.specs.length} spec${a.specs.length === 1 ? "" : "s"}</div>
        <div class="actor-desc">${escapeHtml(desc)}</div>
        <div class="actor-spec-tags">${specTags}</div>
      </div>`;
    })
    .join("\n");
}

function renderHubCoverage(specs) {
  const artifactKeys = ["prototype", "ui-test-cases", "api-contract", "spec-funcional", "spec-tecnica", "spec-tareas", "traceability"];
  const head = `<table class="cov">
        <thead>
          <tr>
            <th>Spec</th>
            <th>Feature</th>
            ${artifactKeys.map((k) => `<th>${k}</th>`).join("\n            ")}
            <th>Estado SPDD</th>
          </tr>
        </thead>
        <tbody>`;
  const rows = specs
    .map((s) => {
      const cells = artifactKeys
        .map((k) => (s.artifacts[k] ? `<td><span class="ok">✓</span></td>` : `<td><span class="missing">✗</span></td>`))
        .join("\n            ");
      const statusCell =
        s.statusClass === "validado"
          ? `<td><span class="cov-status val">Validado</span></td>`
          : s.statusClass === "bloqueado"
            ? `<td><span class="cov-status bloc">Bloqueado</span></td>`
            : `<td><span class="cov-status pend">Pendiente</span></td>`;
      return `          <tr>
            <td><div class="row-num"><div class="dot" style="background:${s.color}"></div><a class="sp-link" href="../specs/${s.feature}/" target="_blank">${s.num}</a></div></td>
            <td>${escapeHtml(s.title)}</td>
            ${cells}
            ${statusCell}
          </tr>`;
    })
    .join("\n");
  return `      ${head}
${rows}
        </tbody>
      </table>`;
}

function renderHubDecisions(decisions) {
  return `      <ul>
${decisions.map((d) => `        <li>${escapeHtml(d)}</li>`).join("\n")}
      </ul>`;
}

function renderHubDoclinks(specs) {
  return specs
    .map(
      (s) => `      <a class="doc-link" href="../specs/${s.feature}/"><span class="icon">📁</span>${s.num} — ${escapeHtml(s.title)}</a>`,
    )
    .join("\n");
}

function renderHubStack(stack) {
  const stackTags = [];
  const stackMap = {
    "quarkus-angular": ["Quarkus 3.x", "Angular 21", "Java 21", "PostgreSQL", "Keycloak OIDC"],
    "spring-react": ["Spring Boot 3", "React 18", "Java 21", "PostgreSQL", "Keycloak OIDC"],
    "java-monolith": ["Spring Boot 3", "Thymeleaf", "Java 21", "PostgreSQL", "Keycloak OIDC"],
    "node-next": ["Next.js 14", "Node 20", "TypeScript 5", "PostgreSQL", "Keycloak OIDC"],
  };
  const tags = stackMap[stack] || ["Stack del proyecto", "Ver template.config.json"];
  tags.push("OpenTelemetry", "Prometheus + Grafana", "Vault / Secrets");
  return tags.map((t) => `      <span class="stack-tag">${escapeHtml(t)}</span>`).join("\n");
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replaceAutoZone(html, name, content) {
  const re = new RegExp(
    `(<!--\\s*@auto:start\\s+name=${name}\\s*-->)([\\s\\S]*?)(<!--\\s*@auto:end\\s*-->)`,
    "i",
  );
  if (!re.test(html)) return html;
  return html.replace(re, (_m, start, _body, end) => `${start}\n${content}\n      ${end}`);
}

function generatePrototypeHub(root, db, options = {}) {
  const tplPath = path.join(root, "plantillas", "fase-2-ux-ui", "prototype-hub.html.tmpl");
  if (!fs.existsSync(tplPath)) {
    throw new Error(`No existe la plantilla: ${tplPath}`);
  }
  const outPath = path.join(root, "prototype", "index.html");
  const data = buildHubData(root, db);

  // Producto y stack desde template.config.example.json
  let productName = "Project Template";
  let stack = "node-next";
  let templateVersion = "0.1";
  const cfgPath = path.join(root, "template.config.example.json");
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      productName = cfg.project?.name || cfg.product?.name || productName;
      stack = cfg.stack || stack;
    } catch {}
  }
  const manifestPath = path.join(root, ".github", ".release-please-manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      templateVersion = m["."] || templateVersion;
    } catch {}
  }
  const today = new Date().toISOString().slice(0, 10);

  // Si --auto-only y existe el hub, partir del HTML actual; si no, de la plantilla.
  let html;
  if (options.autoOnly && fs.existsSync(outPath)) {
    html = fs.readFileSync(outPath, "utf8");
  } else {
    html = fs.readFileSync(tplPath, "utf8");
    // Reemplaza placeholders {{X}}
    const brand = "#2563EB";
    const brandDark = "#1D4ED8";
    const brandSoft = "#DBEAFE";
    const totalFlows = data.specs.reduce((s, x) => s + (x.actors.length || 1), 0);
    const placeholders = {
      PRODUCT_NAME: productName,
      BRAND_COLOR: brand,
      BRAND_DARK: brandDark,
      BRAND_SOFT: brandSoft,
      SPEC_COUNT: String(data.specs.length),
      PROTOTYPE_COUNT: String(data.specs.filter((s) => s.artifacts.prototype).length),
      ACTOR_COUNT: String(data.actors.length),
      FLOW_COUNT: String(totalFlows),
      STATUS_CLASS: data.globalStatus,
      STATUS_LABEL: data.globalLabel,
      TODAY_DATE: today,
      TEMPLATE_VERSION: templateVersion,
    };
    for (const [key, val] of Object.entries(placeholders)) {
      html = html.replace(new RegExp("\\{\\{" + key + "\\}\\}", "g"), val);
    }
  }

  // Rellenar zonas @auto
  html = replaceAutoZone(html, "journeys", renderHubJourneys(data.specs, data.actors));
  html = replaceAutoZone(html, "specs", renderHubSpecs(data.specs));
  html = replaceAutoZone(html, "actors", renderHubActors(data.actors));
  html = replaceAutoZone(html, "coverage", renderHubCoverage(data.specs));
  html = replaceAutoZone(html, "decisions", renderHubDecisions(buildHubData(root, db).globalStatus === "ok" ? ["Politica de simulacion: hub conserva banner; prototipos individuales NO (regla v12.20).", "Goldens nivel 3 son piso de calidad: los prototipos se calibran contra ejemplos/fase-2-ux-ui/prototype-html5-golden/.", "Auto-rating obligatorio (generar-prototipo-html5-ejecutable.md) antes de declarar un prototipo listo."] : ["Politica de simulacion: hub conserva banner; prototipos individuales NO (regla v12.20).", "Goldens nivel 3 son piso de calidad.", "Auto-rating obligatorio antes de declarar un prototipo listo."]));
  html = replaceAutoZone(html, "doclinks", renderHubDoclinks(data.specs));
  html = replaceAutoZone(html, "stack", renderHubStack(stack));

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, "utf8");
  return {
    outPath,
    specs: data.specs.length,
    prototypes: data.specs.filter((s) => s.artifacts.prototype).length,
    actors: data.actors.length,
    status: data.globalLabel,
  };
}

function hasClearRequirement(text) {
  const actorRequirement = /\b(usuario|operador|administrador|cliente|sistema|servicio|api|actor|analista|supervisor)\s+(debe|deben|puede|pueden|podra|podran|necesita|necesitan|requiere|requieren|tiene que|tienen que)\b/;
  const action = /\b(registrar|crear|actualizar|consultar|listar|adjuntar|aprobar|rechazar|cambiar|eliminar|generar|descargar|subir|ver|buscar|notificar|asignar)\b/;
  return actorRequirement.test(text) && action.test(text);
}

function hasTechnicalDecision(text) {
  const decisionVerb = /\b(quiero|queremos|vamos a|usar|adoptar|elegir|seleccionar|decidir)\b/;
  const technology = /\b(quarkus|angular|react|spring|sqlite|duckdb|postgres|kubernetes|keycloak|oidc|jwt|microservicios|monolito|stack|tecnologia|framework)\b/;
  return decisionVerb.test(text) && technology.test(text);
}

function hasUxIntent(text) {
  return /\b(ux|ui|experiencia|journey|journeys|pantalla|pantallas|wireframe|wireframes|prototipo|penpot|mock|interfaz|formulario|design system|componentes reutilizables|mapping)\b/.test(text);
}

function hasFrontendSpddIntent(text) {
  const frontend = /\b(frontend|angular|componente|componentes|pantalla|ui|interfaz)\b/.test(text);
  const spdd = /\b(spdd|prototype driven|prototipo|penpot|wireframe|mapping|mock|construir|implementar|build)\b/.test(text);
  return frontend && spdd;
}

function hasPrototypeIntent(text) {
  return /\b(prototype|prototipo|html5|html 5|html-first|penpot|mcp|mock navegable|navegable)\b/.test(text);
}

function routeIntent(intent) {
  const text = intent.toLowerCase();
  if (/(crear|instanciar|bootstrap|nuevo).*(proyecto|servicio|repo)|ruta destino/.test(text)) {
    return {
      intent: "crear proyecto real",
      phase: "0-3",
      command: "/plan + bootstrap",
      gate: "gate-0-1 y gate-2-3",
      agent: "ai/agents/enterprise-ai-framework-agent.md",
      prompt: "ai/prompts/crear-proyecto-real-desde-template.md",
      runbook: "ai/runbooks/crear-proyecto-real-con-agente.md",
    };
  }
  if (hasTechnicalDecision(text)) {
    return {
      intent: "decision tecnica",
      phase: "3",
      mode: "estructurado",
      command: "/document + /review",
      gate: "gate-documentation-ready y gate-2-3",
      skill: "ai/skills/architecture.skill.md",
      reference: "ai/references/documentation-orchestration.md",
    };
  }
  if (/(spdd|spec \+ prototype|prototype driven|prototipo aprobado|validar prototipo)/.test(text) && !/(construir|implementar|build|codigo|tdd)/.test(text)) {
    return {
      intent: "spdd approved",
      phase: "2-4",
      mode: "estructurado",
      command: "/ux + /prototype + /review",
      gate: "gate-prototype-ready y gate-spdd-approved",
      skill: "ai/skills/spec-prototype-driven-frontend.skill.md",
      reference: "ai/references/frontend-spdd-workflow.md",
    };
  }
  if (hasPrototypeIntent(text) && !/(construir|implementar|build|codigo|tdd)/.test(text)) {
    return {
      intent: "prototipo ux",
      phase: "2",
      mode: "estructurado",
      command: "/prototype",
      gate: "gate-prototype-ready",
      skill: /penpot|mcp/.test(text)
        ? "ai/skills/penpot-ai-prototyping.skill.md"
        : "ai/skills/html5-prototyping.skill.md",
      reference: "ai/references/frontend-spdd-workflow.md",
    };
  }
  if (hasFrontendSpddIntent(text) && /(construir|implementar|build|codigo|tdd)/.test(text)) {
    return {
      intent: "frontend spdd",
      phase: "5",
      mode: "estructurado",
      command: "/build + /review + /test",
      gate: "gate-frontend-spdd-ready y gate-4-6",
      skill: "ai/skills/spec-prototype-driven-frontend.skill.md",
      reference: "ai/references/frontend-spdd-workflow.md",
    };
  }
  if (hasUxIntent(text)) {
    return {
      intent: "product design ux",
      phase: "2",
      mode: "exploratorio o estructurado segun fuente",
      command: "/ux",
      gate: "gate-ux-ready",
      skill: "ai/skills/spec-driven-product-design.skill.md",
      reference: "ai/references/product-design-workflow.md",
    };
  }
  if (hasClearRequirement(text)) {
    return {
      intent: "requerimiento claro a specs",
      phase: "4",
      mode: "estructurado",
      command: "/document + /spec",
      gate: "gate-documentation-ready y gate-4-6",
      skill: "ai/skills/spec-writer.skill.md",
      reference: "ai/references/documentation-orchestration.md",
    };
  }
  if (/(documentar|documentacion|intake|necesidades iniciales|nota|acta|conversacion)/.test(text)) {
    return {
      intent: "documentacion orquestada",
      phase: "0-4",
      mode: "exploratorio o estructurado segun fuente",
      command: "/document",
      gate: "gate-documentation-ready",
      skill: "ai/skills/documentation-orchestration.skill.md",
      reference: "ai/references/documentation-orchestration.md",
    };
  }
  if (/(code review|revision de codigo|revisar cambio|review de codigo)/.test(text)) {
    return {
      intent: "revision de codigo",
      phase: "5-6",
      mode: "estructurado",
      command: "/review",
      gate: "gate-4-6",
      skill: "ai/skills/requesting-code-review.skill.md",
      reference: "ai/references/feature-delivery-workflow.md",
    };
  }
  if (/(worktree|tdd|red[- ]green|red green|refactor|build|construccion|implementar|codigo|ejecutar plan|executing-plans|subagent|subagente)/.test(text)) {
    return {
      intent: "delivery de feature",
      phase: "5",
      mode: "estructurado",
      command: "/build + /review + /test",
      gate: "gate-4-6",
      skill: "ai/skills/executing-plans.skill.md",
      reference: "ai/references/feature-delivery-workflow.md",
    };
  }
  if (/(spec|feature|historia|sdd)/.test(text)) {
    return { intent: "feature a specs", phase: "4", mode: "estructurado", command: "/document + /spec", gate: "gate-documentation-ready y gate-4-6" };
  }
  if (/(qa|prueba|test|evidencia)/.test(text)) {
    return { intent: "QA y evidencia", phase: "6", command: "/test", gate: "gate-4-6" };
  }
  if (/(deploy|release|ship|produccion|rollback)/.test(text)) {
    return { intent: "release/deploy", phase: "7", command: "/ship", gate: "gate-7-8" };
  }
  if (/(operacion|metricas|monitoreo|incidente)/.test(text)) {
    return { intent: "operacion", phase: "8", command: "/review", gate: "gate-7-8" };
  }
  if (/(arquitectura|adr|tecnolog|c4)/.test(text)) {
    return { intent: "arquitectura", phase: "3", mode: "estructurado", command: "/document + /review", gate: "gate-documentation-ready y gate-2-3" };
  }
  return { intent: "discovery/documentacion inicial", phase: "0-1", mode: "exploratorio", command: "/document + /plan", gate: "gate-documentation-ready y gate-0-1" };
}

function resolveInputPath(root, inputPath) {
  if (!inputPath) return null;
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath);
}

function readJson(filePath) {
  let raw = fs.readFileSync(filePath, "utf8");
  // Strip UTF-8 BOM if present
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  // Normalize CRLF to LF to avoid strict-mode JSON errors on Windows
  raw = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON invalido en ${filePath}: ${err.message}`);
  }
}

function writeFileEnsured(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
}

function copyTemplateFileIfExists(root, dest, relativePath) {
  const source = path.join(root, ...relativePath.split("/"));
  if (!fs.existsSync(source)) return false;
  const target = path.join(dest, ...relativePath.split("/"));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

function projectContext(config, stack) {
  const project = config.project;
  return {
    name: project.name,
    slug: project.slug,
    stack,
    apiServiceName: project.apiServiceName,
    webComponentName: project.webComponentName,
    apiResourceName: project.apiResourceName,
    apiResourcePlural: project.apiResourcePlural,
    apiResourcePath: project.apiResourcePath,
    javaBasePackage: project.javaBasePackage,
    databaseName: project.databaseName ?? project.slug.replace(/-/g, "_"),
    featureFlagPrefix: project.featureFlagPrefix ?? project.slug,
    owner: project.backstageOwner,
    system: project.backstageSystem,
    databaseResourceName: project.databaseResourceName,
    costCenter: project.costCenter,
    githubOrganization: config.github.organization,
    githubRepository: config.github.repository,
    supportUrl: config.support.url,
    containerImage: config.runtime.containerImage,
    devDomain: config.terraform.devDomain,
    stagingDomain: config.terraform.stagingDomain,
    prodDomain: config.terraform.prodDomain,
    portalUrl: config.catalog.portalUrl,
    apiUrl: config.catalog.apiUrl,
    oidcIssuer: config.auth.oidcIssuer,
    oidcAudience: config.auth.oidcAudience,
    oidcRolesClaim: config.auth.oidcRolesClaim,
    prometheusUrl: config.observability.prometheusUrl,
    grafanaUrl: config.observability.grafanaUrl,
    drTier: config.dr.tier,
    rto: config.dr.rto,
    rpo: config.dr.rpo,
    secretsProvider: config.secrets.provider,
    secretsPath: config.secrets.kvPath,
    feature: `001-${project.apiResourcePlural}`,
  };
}

function documentationFiles(ctx) {
  return new Map([
    ["README.md", `# ${ctx.name}

Proyecto real ${ctx.name} con stack ${ctx.stack}, autenticacion OIDC, autorizacion RBAC y trazabilidad operacional.

## Estado inicial
- Stack: ${ctx.stack}.
- Backend: ${ctx.apiServiceName}.
- Frontend: ${ctx.webComponentName}.
- API principal: ${ctx.apiResourcePath}.
- Paquete Java: ${ctx.javaBasePackage}.
- Sistema Backstage: ${ctx.system}.
- Owner: ${ctx.owner}.

## Primeros comandos
\`\`\`powershell
cd backend
mvn quarkus:dev

cd ..\\frontend
npm install
npm run start
\`\`\`

## Documentacion
- [Indice de documentacion](docs/README.md)
- [Vision del proyecto](docs/fase-0-iniciacion/00.01-vision-proyecto.md)
- [Analisis y requerimientos](docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [Arquitectura](docs/fase-3-arquitectura/03.00-arquitectura.md)
- [Spec inicial](specs/${ctx.feature}/spec-funcional.md)
`],
    ["AGENTS.md", `# AGENTS.md

## Proposito
Este repositorio contiene el proyecto real ${ctx.name}. Los agentes deben trabajar con metodologia AI-first, fases 0-8, Spec-Driven Development (SDD), trazabilidad y quality gates.

## Lectura inicial obligatoria
- docs/README.md
- docs/fase-0-iniciacion/00.01-vision-proyecto.md
- docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md
- docs/fase-2-ux-ui/02.09-spec-driven-product-design.md
- docs/fase-3-arquitectura/03.00-arquitectura.md
- specs/${ctx.feature}/spec-funcional.md
- docs/transversal/90.33-flujo-delivery-ia-proveedores.md
- docs/transversal/90.34-product-design-y-spdd-frontend.md

## Reglas
- No avanzar a construccion sin spec funcional y tecnica.
- No construir frontend sin revisar \`/ux\`, prototipo, sistema de componentes y mapping cuando aplica.
- No ejecutar codigo por proveedor IA sin tareas pequenas, rutas permitidas, TDD y evidencia.
- No cambiar arquitectura sin ADR.
- No cerrar QA sin evidencia.
- No cerrar deploy sin rollback y monitoreo.
- Toda salida debe terminar en ruta canonica del proyecto.

## Dominio del proyecto
- El dominio es ${ctx.name} (recurso: ${ctx.apiResourcePlural}).
- NO usar como base el caso de ejemplo del template (expedientes, bandeja, gestion documental).
- Toda referencia en specs/, docs/ y ai/ debe hablar del dominio real: ${ctx.apiResourcePlural}.
- Si detectas texto de expedientes/bandeja que no fue reemplazado, corrigelo antes de avanzar.

## Anti-patrones criticos
- Copiar specs de ejemplo (001-bandeja-trabajo-expedientes) como si fueran del proyecto real.
- Generar archivos fuera de las rutas canonicas del proyecto.
- Declarar gates como aprobados sin evidencia real.
- Construir frontend o backend sin gate-spdd-approved cuando la feature es visual.
- Mezclar tareas de incrementos futuros en el MVP actual.

## Gates al inicio del proyecto
- gate-0-1: PENDIENTE - validar vision y requerimientos con el negocio.
- gate-ux-ready: PENDIENTE - product-design.md requiere validacion humana.
- gate-spdd-approved: PENDIENTE - prototipo requiere validacion antes de SDD.
- gate-4-6: NO APLICA todavia - esperar a que SPDD este aprobado.
`],
    ["AI_CONTEXT.md", `# AI_CONTEXT

> Primer archivo que un agente IA debe leer al retomar este proyecto.
> \`AGENTS.md\` explica COMO debe trabajar el agente. Este archivo explica EN QUE
> ESTADO esta el proyecto AHORA. Mantenlo corto y vivo: actualizalo al cerrar
> cada fase, feature o gate, y corre \`sync-memory\` despues.

## Identidad
- Proyecto: ${ctx.name}.
- Dominio: ${ctx.apiResourcePlural}.
- <!-- auto:start name=stack -->Stack: ${ctx.stack}<!-- auto:end -->
- Version actual: <!-- auto:start name=version -->v0.1.0<!-- auto:end -->

## Estado actual
- Fase activa: 0 - iniciacion.
- Resumen en una linea: proyecto recien instanciado desde el template; pendiente validar vision y requerimientos.
- Ultima actualizacion: instanciacion inicial.

## Features y su estado
Ver matriz global en \`TRACEABILITY_MATRIX.md\`.

<!-- auto:start name=features -->
| Feature | Fase | Estado | Gate bloqueante |
|---|---|---|---|
| ${ctx.feature} | 0-1 | Spec inicial generada | gate-0-1 |
<!-- auto:end -->

## Gates pendientes

<!-- auto:start name=gates-pendientes -->
- gate-0-1: validar vision y requerimientos con el negocio.
- gate-ux-ready: product-design.md requiere validacion humana.
- gate-spdd-approved: prototipo requiere validacion antes de SDD.
<!-- auto:end -->

## Sesiones recientes

<!-- auto:start name=sesiones-recientes -->
- _(sin entradas en SESSION_LOG.md)_
<!-- auto:end -->

## Decisiones recientes

<!-- auto:start name=decisiones-recientes -->
- _(sin ADR / decisiones registradas)_
<!-- auto:end -->

<!-- auto:start name=ultima-actualizacion -->
_Ultima regeneracion: pendiente (corre \`npm run memory:context\`)._
<!-- auto:end -->

## Proximos pasos
1. Validar vision y requerimientos (fase 0-1).
2. Generar Product Design y SPDD para ${ctx.feature}.
3. Prototipar la feature visual con \`/prototype --mode html5\`.

## Como cargar contexto rapido
\`\`\`sh
node scripts/ai-framework-agent.mjs index-docs
node scripts/ai-framework-agent.mjs sync-memory
node scripts/ai-framework-agent.mjs status
node scripts/ai-framework-agent.mjs search --query "<tema>"
\`\`\`
La BD \`ai/memory/framework-agent.db\` es un indice reconstruible. La fuente de
verdad son los Markdown. Si la BD contradice un Markdown, gana el Markdown.

## Punteros clave
- \`AGENTS.md\` - contrato de trabajo del agente.
- \`PROJECT_MAP.md\` - donde vive cada cosa.
- \`TRACEABILITY_MATRIX.md\` - matriz global de trazabilidad.
- \`GLOSSARY.md\` - terminos del framework y del dominio.
- \`docs/README.md\` - indice de documentacion por fase.
- \`specs/${ctx.feature}/spec-funcional.md\` - spec inicial de la feature.

## Como actualizar este archivo
- Actualiza \`Estado actual\` y \`Proximos pasos\` al cerrar cada sesion de trabajo.
- Actualiza \`Features y su estado\` y \`Gates pendientes\` al mover un gate.
- Tras actualizar, corre \`sync-memory\` para reflejarlo en la memoria del agente.
`],
    ["PROJECT_MAP.md", `# PROJECT_MAP

> Mapa de navegacion del repositorio. Responde "donde vive cada cosa" para que
> un agente IA no tenga que explorar a ciegas.

## Arbol de carpetas
| Ruta | Proposito |
|---|---|
| \`docs/\` | Documentacion oficial por fase 0-8 y transversal. Fuente de verdad metodologica. |
| \`specs/\` | Specs por feature: spec-funcional, spec-tecnica, spec-tareas, traceability, api-contract. |
| \`ai/\` | Capa IA: agents, commands, skills, prompts, quality-gates, references, memory. |
| \`ai/memory/\` | Schema SQLite + BD local reconstruible del agente. |
| \`backend/\` | Codigo backend del proyecto (${ctx.apiServiceName}). |
| \`frontend/\` | Codigo frontend del proyecto (${ctx.webComponentName}). |
| \`qa/\` | Casos de prueba y evidencia de QA por fase. |
| \`ops/\` | Operacion: infra, despliegue, runbooks, observabilidad. |
| \`contracts/\` | Contratos API (OpenAPI) y eventos. |
| \`ci/\` | Scripts y baseline de integracion continua. |
| \`scripts/\` | Automatizacion: agente interno, validadores. |

## Rutas canonicas por tipo de artefacto
| Necesito... | Esta en... |
|---|---|
| Vision y requerimientos | \`docs/fase-0-iniciacion/\`, \`docs/fase-1-analisis-requerimientos/\` |
| Diseno de producto / UX / SPDD | \`docs/fase-2-ux-ui/\`, \`specs/${ctx.feature}/product-design.md\`, \`spdd-frontend.md\` |
| Prototipo navegable | \`specs/${ctx.feature}/prototype-html5/index.html\` |
| Arquitectura y decisiones | \`docs/fase-3-arquitectura/\`, ADRs en \`docs/fase-3-arquitectura/adr/\` |
| Spec funcional/tecnica/tareas | \`specs/${ctx.feature}/spec-funcional.md\`, \`spec-tecnica.md\`, \`spec-tareas.md\` |
| Trazabilidad de una feature | \`specs/${ctx.feature}/traceability.md\` |
| Trazabilidad global | \`TRACEABILITY_MATRIX.md\` |
| Contratos API | \`contracts/api/\`, \`specs/${ctx.feature}/api-contract.md\` |
| Quality gates | \`ai/quality-gates/\` |
| Memoria consultable | \`ai/memory/framework-agent.db\` (via \`scripts/ai-framework-agent.mjs\`) |

## Punto de entrada para un agente IA
1. \`AI_CONTEXT.md\` - estado actual del proyecto.
2. \`AGENTS.md\` - contrato de trabajo.
3. Este \`PROJECT_MAP.md\` - donde buscar.
4. \`node scripts/ai-framework-agent.mjs search --query "<tema>"\` - ubicar contexto.
5. Abrir solo los Markdown relevantes que devuelve la busqueda.
`],
    ["TRACEABILITY_MATRIX.md", `# TRACEABILITY_MATRIX

> Matriz global de trazabilidad: rollup de todas las features del proyecto.
> Cada feature mantiene su \`specs/<feature>/traceability.md\` con el detalle;
> este archivo consolida la vista. \`node scripts/ai-framework-agent.mjs sync-memory\`
> parsea este archivo y las \`traceability.md\` por feature para poblar la memoria.

## Matriz global
| Feature | RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|---|
| ${ctx.feature} | RF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/${ctx.apiResourcePlural} | ${ctx.apiResourceName} | ${ctx.apiResourceName}QueryService | ${ctx.apiResourceName}QueryTest | Spec inicial | spec-funcional.md |

## Estado de gates por feature
| Feature | Gate | Estado | Evidencia |
|---|---|---|---|
| ${ctx.feature} | gate-0-1 | Pendiente | docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md |
| ${ctx.feature} | gate-prototype-ready | Pendiente | specs/${ctx.feature}/prototype-validation.md |

## Requerimientos sin implementacion
- RF-01: definido en spec inicial, sin codigo ni test.

## Decisiones transversales
- Markdown es la fuente de verdad; la BD es un indice reconstruible.

## Preguntas abiertas globales
- Confirmar alcance del MVP con el negocio.
`],
    ["GLOSSARY.md", `# GLOSSARY

> Glosario unico del proyecto: terminos del framework AI-first y terminos del
> dominio de negocio. Evita que un agente IA interprete mal un termino.

## Terminos del framework
| Termino | Definicion |
|---|---|
| RF | Requerimiento funcional. Capacidad observable que el sistema debe ofrecer. |
| RNF | Requerimiento no funcional. Restriccion de calidad: performance, seguridad. |
| HU | Historia de usuario. Necesidad expresada desde el actor. |
| Fase 0-8 | Etapas del ciclo: iniciacion, analisis, UX/UI, arquitectura, SDD, construccion, QA, deploy, operacion. |
| SDD | Spec-Driven Development. Construir desde spec funcional + tecnica + tareas. |
| SPDD | Spec-Prototype-Driven Development. Validar UX con prototipo antes de SDD. |
| ADR | Architecture Decision Record. Decision tecnica con contexto y consecuencias. |
| Gate | Quality gate. Punto de control que bloquea avanzar si no se cumple. |
| Trazabilidad | Cadena RF -> HU -> diseno -> prototipo -> API -> BD -> codigo -> test -> evidencia. |
| Memoria del agente | BD SQLite reconstruible que indexa Markdown y trazabilidad. |
| Fuente de verdad | Los Markdown del repo. La BD es indice; si contradice un Markdown, gana el Markdown. |

## Terminos del dominio
| Termino | Definicion |
|---|---|
| ${ctx.apiResourceName} | Recurso principal del dominio (${ctx.apiResourcePlural}). Completar con la definicion de negocio. |

## Sinonimos y formas no permitidas
| No usar | Usar |
|---|---|
| <sinonimo informal> | <termino canonico> |
`],
    ["SESSION_LOG.md", `# SESSION_LOG

> Bitacora append-only de sesiones de trabajo del agente IA y del equipo.
> Cada sesion deja un registro estructurado: que cambio, que quedo pendiente,
> con que links de evidencia. \`sync-memory\` parsea este archivo y puebla
> \`ai_session_events\`.

## Reglas
- Append-only; cronologico descendente (la mas reciente arriba).
- Formato de entrada (parser regex):
  - \`## <YYYY-MM-DD HH:MM> — <Titulo>\`
  - \`- Agente:\`, \`- Resumen:\`, \`- Cambios:\`, \`- Pendiente:\`, \`- Evidencia:\`.

## Entradas

## ${new Date().toISOString().slice(0, 16).replace("T", " ")} — Instanciacion inicial de ${ctx.name}
- Agente: template-generator
- Resumen: proyecto recien instanciado desde el template. Pendiente validar vision y requerimientos.
- Cambios:
  - Estructura base (docs/, specs/, ai/, src/, tests/, qa/, ops/)
  - Spec inicial \`specs/${ctx.feature}/\`
- Pendiente:
  - Validar vision y requerimientos con el negocio (gate-0-1)
  - Generar Product Design y SPDD de ${ctx.feature}
- Evidencia:
  - Markdown de fases 0-8 generados por scripts/ai-framework-agent.mjs
`],
    ["package.json", `${JSON.stringify({
  name: ctx.feature ? `@org/${ctx.feature}` : "@org/project",
  version: "0.1.0",
  private: true,
  type: "module",
  description: `${ctx.name} - scripts de memoria viva del agente IA (Node 22+). Los stacks (backend/frontend) traen su propio package.json en sus subcarpetas.`,
  engines: { node: ">=22.0.0" },
  scripts: {
    "memory:bootstrap": "node scripts/ai-framework-agent.mjs init-memory && node scripts/ai-framework-agent.mjs index-docs && node scripts/ai-framework-agent.mjs sync-memory && node scripts/ai-framework-agent.mjs regenerate-context && node scripts/ai-framework-agent.mjs index-docs && node scripts/ai-framework-agent.mjs embed-docs",
    "memory:bootstrap:quick": "node scripts/ai-framework-agent.mjs init-memory && node scripts/ai-framework-agent.mjs index-docs && node scripts/ai-framework-agent.mjs sync-memory && node scripts/ai-framework-agent.mjs regenerate-context && node scripts/ai-framework-agent.mjs index-docs",
    "memory:sync": "node scripts/ai-framework-agent.mjs sync-memory && node scripts/ai-framework-agent.mjs regenerate-context && node scripts/ai-framework-agent.mjs index-docs && node scripts/ai-framework-agent.mjs embed-docs",
    "memory:sync:quick": "node scripts/ai-framework-agent.mjs sync-memory && node scripts/ai-framework-agent.mjs regenerate-context && node scripts/ai-framework-agent.mjs index-docs",
    "memory:index": "node scripts/ai-framework-agent.mjs index-docs",
    "memory:embed": "node scripts/ai-framework-agent.mjs embed-docs",
    "memory:context": "node scripts/ai-framework-agent.mjs regenerate-context",
    "memory:report": "node scripts/ai-framework-agent.mjs memory-report",
    "memory:serve": "node scripts/ai-framework-agent.mjs memory-serve",
    "memory:watch": "node scripts/ai-framework-agent.mjs watch",
    "memory:query": "node scripts/ai-framework-agent.mjs memory-query",
    "memory:context-pack": "node scripts/ai-framework-agent.mjs context-pack",
    "memory:next-task": "node scripts/ai-framework-agent.mjs next-task",
    "memory:harvest-trace": "node scripts/ai-framework-agent.mjs harvest-trace",
    "memory:install-hooks": "node scripts/ai-framework-agent.mjs install-hooks",
    "check:docs": "node ci/scripts/check-docs.mjs",
    "check:trace-drift": "node ci/scripts/check-trace-drift.mjs",
    "check:trace-coverage": "node ci/scripts/check-trace-coverage.mjs",
    "check:prototype-hub": "node ci/scripts/check-prototype-hub.mjs",
    "check:prototype-html5": "node ci/scripts/check-html5-prototype-quality.mjs",
    "check:ai-artifacts": "node ci/scripts/check-ai-artifacts.mjs",
    "check:markdown-paths": "node ci/scripts/check-markdown-paths.mjs",
    "check:bd-documented": "node ci/scripts/check-bd-documented.mjs",
    "check:api-documented": "node ci/scripts/check-api-documented.mjs",
    "check:test-documented": "node ci/scripts/check-test-documented.mjs",
    "check:runbook-documented": "node ci/scripts/check-runbook-documented.mjs",
    "check:evidence-exists": "node ci/scripts/check-evidence-exists.mjs",
    "check:gates-mentioned": "node ci/scripts/check-gates-mentioned.mjs",
    "check:status-coherence": "node ci/scripts/check-status-coherence.mjs",
    "check:orphan-evidence": "node ci/scripts/check-orphan-evidence.mjs",
    "check:prototype-diversity": "node ci/scripts/check-prototype-diversity.mjs",
    "check:openapi-coverage": "node ci/scripts/check-openapi-coverage.mjs",
    "check:prototype-cross-links": "node ci/scripts/check-prototype-cross-links.mjs",
    "check:prototype-bidirectional-links": "node ci/scripts/check-prototype-bidirectional-links.mjs",
    "check:prototype-location": "node ci/scripts/check-prototype-location.mjs",
    "check:prototype-domain-mismatch": "node ci/scripts/check-prototype-domain-mismatch.mjs",
    "check:auto-zones": "node ci/scripts/check-auto-zones.mjs",
    "check:prototype-visible-product": "node ci/scripts/check-prototype-visible-product.mjs",
    "check:prototype-contract": "node ci/scripts/check-prototype-contract.mjs",
    "check:architecture-baseline": "node ci/scripts/check-architecture-baseline.mjs",
    "check:prototype-coverage": "node ci/scripts/check-prototype-coverage.mjs",
    "check:prototype-spa-coherence": "node ci/scripts/check-prototype-spa-coherence.mjs",
    "check:prototype-mock-data": "node ci/scripts/check-prototype-mock-data.mjs",
    "check:phase-validator-sync": "node ci/scripts/check-phase-validator-sync.mjs",
    "check:plantillas": "node ci/scripts/check-plantillas.mjs",
    "plantillas:sync": "node scripts/sync-plantillas.mjs",
    "check:prototype-portfolio": "npm run check:prototype-html5 -- --strict && npm run check:prototype-visible-product -- --strict",
    "check:gate-status-format": "node ci/scripts/check-gate-status-format.mjs",
    "check:release-binding": "node ci/scripts/check-release-binding.mjs",
    "check:runbook-binding": "node ci/scripts/check-runbook-binding.mjs",
    "check:feature-dependencies": "node ci/scripts/check-feature-dependencies.mjs",
    "check:phase-contract": "node ci/scripts/check-phase-contract.mjs",
    "check:validation-coverage": "node ci/scripts/check-validation-coverage.mjs",
    "roadmap:next": "node scripts/roadmap-next.mjs",
    "roadmap:next:text": "node scripts/roadmap-next.mjs --format text",
    "roadmap:sync": "node scripts/roadmap-sync.mjs",
    "roadmap:prompt": "node scripts/roadmap-prompt.mjs",
    "roadmap:audit": "node scripts/roadmap-audit.mjs",
    "roadmap:claim": "node scripts/roadmap-claim.mjs",
    "roadmap:release": "node scripts/roadmap-release.mjs",
    "check:roadmap-state": "node scripts/roadmap-sync.mjs --check",
    "pre-flight-gate": "node scripts/pre-flight-gate.mjs",
    "check:instantiation": "node ci/scripts/check-template-instantiation.mjs --mode instantiated --root .",
    "generate:openapi": "node scripts/generate-openapi.mjs",
    "generate:openapi:check": "node scripts/generate-openapi.mjs --check",
    "scaffold:project": "node scripts/scaffold-project.mjs",
    "check:template": "npm run check:docs && npm run check:prototype-hub && npm run check:ai-artifacts && npm run check:markdown-paths",
    "check:project": "npm run check:trace-drift && npm run check:trace-coverage && npm run check:bd-documented && npm run check:api-documented && npm run check:test-documented && npm run check:runbook-documented && npm run check:evidence-exists && npm run check:gates-mentioned && npm run check:status-coherence && npm run check:orphan-evidence && npm run check:prototype-diversity -- --strict && npm run check:openapi-coverage && npm run check:prototype-cross-links && npm run check:prototype-bidirectional-links && npm run check:prototype-location && npm run check:prototype-domain-mismatch && npm run check:auto-zones && npm run check:prototype-portfolio && npm run check:gate-status-format && npm run check:release-binding && npm run check:runbook-binding && npm run check:feature-dependencies && npm run check:phase-contract && npm run check:prototype-contract && npm run check:prototype-coverage && npm run check:prototype-spa-coherence && npm run check:prototype-mock-data && npm run check:architecture-baseline && npm run check:phase-validator-sync && npm run check:plantillas && npm run check:validation-coverage && npm run check:instantiation",
    "check:all": "npm run check:template && npm run check:project",
    "validate": "node scripts/validate.mjs",
    "release:prep": "npm run roadmap:sync && npm run memory:sync && npm run check:all && node scripts/roadmap-sync.mjs --check --strict",
    "scaffold:feature": "node scripts/scaffold-feature.mjs",
    "scaffold:prototype": "node scripts/scaffold-prototype.mjs",
    "scaffold:project": "node scripts/scaffold-project.mjs",
    "template:upgrade": "node scripts/template-upgrade.mjs",
    "template:upgrade:apply": "node scripts/template-upgrade.mjs --apply",
    "roadmap:status": "node scripts/roadmap-status.mjs",
    "roadmap:status:json": "node scripts/roadmap-status.mjs --json",
    "prototype:hub": "node scripts/ai-framework-agent.mjs generate-prototype-hub",
    "prototype:hub:auto": "node scripts/ai-framework-agent.mjs generate-prototype-hub --auto-only",
    "prototype:contract": "node scripts/prototype-contract.mjs",
    "prototype:prompt": "node scripts/prototype-prompt.mjs",
  },
}, null, 2)}\n`],
    ["INSTANCIACION_PROYECTO_REAL.md", `# Instanciacion en proyecto real (memoria viva + trazabilidad semantica)

[README principal](README.md) · [AI_CONTEXT](AI_CONTEXT.md) · [Glosario](GLOSSARY.md)
· [Trazabilidad](TRACEABILITY_MATRIX.md) · [SESSION_LOG](SESSION_LOG.md)

> Guia obligatoria para **cualquier agente IA** (Claude Code, Codex, Cursor,
> Copilot Workspace, Gemini Code, etc.) que abra este repo. Lee primero esta
> hoja, despues \`AI_CONTEXT.md\`.

## TL;DR (3 comandos)

\`\`\`bash
# 1) Bootstrap: BD, indices, embeddings, contexto vivo
npm run memory:bootstrap

# 2) En cada sesion (o pre-commit): re-sincroniza la BD desde Markdown
npm run memory:sync

# 3) Preguntar a la memoria sin re-leer el repo entero
npm run memory:query -- --preset rf-implemented
npm run memory:query -- --preset rf-planned
npm run memory:query -- --preset rf-validated
npm run memory:query -- --preset links-drift
\`\`\`

Requiere **Node 22.x** (\`node:sqlite\` es built-in).

## Que debe hacer el agente al abrir el repo

1. Leer estos 5 archivos en orden:
   1. \`INSTANCIACION_PROYECTO_REAL.md\` (este)
   2. \`AI_CONTEXT.md\` - estado actual, decisiones, tareas
   3. \`PROJECT_MAP.md\` - donde vive cada cosa
   4. \`TRACEABILITY_MATRIX.md\` - RF/HU consolidados
   5. \`GLOSSARY.md\` - terminos del dominio
2. Si no existe la BD: \`npm run memory:bootstrap\`.
3. Si la BD existe pero hubo cambios: \`npm run memory:sync\`.
4. Leer las ultimas 3 entradas de \`SESSION_LOG.md\`.
5. \`npm run memory:next-task\`.

## Que debe hacer al cerrar una sesion

1. Append a \`SESSION_LOG.md\` con el formato del archivo.
2. \`npm run memory:sync\` y \`npm run memory:context\`.

## Trazabilidad: \`planned\` vs \`implemented\` vs \`validated\`

| \`link_status\` | Significado                                                       |
|-----------------|-------------------------------------------------------------------|
| \`planned\`     | Declarado en la matriz, **target_ref NO existe** en el repo       |
| \`implemented\` | Declarado **Y** existe en el repo (archivo/clase/test detectado)  |
| \`validated\`   | \`implemented\` + el Estado de la fila marca aprobacion           |

**Regla**: si vas a llenar \`Codigo\` o \`Test\` en \`traceability.md\`,
verifica que el archivo realmente existe. Si no, deja \`-\`.

## Validacion continua (CI)

\`\`\`bash
npm run check:docs               # links rotos, headings duplicados
npm run check:trace-drift        # links apuntan a artefactos que existen
npm run check:trace-coverage     # RFs en fase >=5 con codigo + test reales
npm run check:prototype-hub      # 10 secciones del hub
npm run check:all                # todos
\`\`\`

> Esta guia viene del template canonico \`project-template\`. Para detalles
> avanzados (presets, errores comunes, diferencias por agente IA, comandos
> del dia a dia), consulta la version raiz del template:
> \`INSTANCIACION_PROYECTO_REAL.md\` ahi.
`],
    ["docs/README.md", `# Indice de documentacion

[README principal](../README.md)

Esta documentacion describe el proyecto real ${ctx.name}.

## Fases
- [Fase 0 - Iniciacion](fase-0-iniciacion/README.md)
- [Fase 1 - Analisis y requerimientos](fase-1-analisis-requerimientos/README.md)
- [Fase 2 - UX/UI](fase-2-ux-ui/README.md)
- [Fase 3 - Arquitectura](fase-3-arquitectura/README.md)
- [Fase 4 - SDD](fase-4-sdd/README.md)
- [Fase 5 - Construccion](fase-5-construccion/README.md)
- [Fase 6 - QA](fase-6-qa/README.md)
- [Fase 7 - Deploy](fase-7-deploy/README.md)
- [Fase 8 - Operacion](fase-8-operacion/README.md)

## Operacion IA por fases
| Fase | Entrada | Command IA | Gate | Task packet |
|---|---|---|---|---|
| 0 | idea y contexto inicial | /document + /plan | gate-0-1 | [fase-0-iniciacion.task.md](../ai/tasks/fase-0-iniciacion.task.md) |
| 1 | vision y alcance | /document + /plan | gate-0-1 | [fase-1-requerimientos.task.md](../ai/tasks/fase-1-requerimientos.task.md) |
| 2 | RF, HU y specs | /ux | gate-ux-ready | [fase-2-ux.task.md](../ai/tasks/fase-2-ux.task.md) |
| 3 | requerimientos, UX y restricciones | /review | gate-2-3 | [fase-3-arquitectura.task.md](../ai/tasks/fase-3-arquitectura.task.md) |
| 4 | RF/HU, UX y ADR | /spec | gate-4-6 | [fase-4-sdd.task.md](../ai/tasks/fase-4-sdd.task.md) |
| 5 | specs aprobadas + prototipo si es frontend | /build | gate-4-6 y gate-frontend-spdd-ready si aplica | [fase-5-construccion.task.md](../ai/tasks/fase-5-construccion.task.md) |
| 6 | codigo y specs | /test | gate-4-6 | [fase-6-qa.task.md](../ai/tasks/fase-6-qa.task.md) |
| 7 | build candidato y evidencia QA | /ship | gate-7-8 | [fase-7-deploy.task.md](../ai/tasks/fase-7-deploy.task.md) |
| 8 | produccion y metricas | /review + /ship | gate-7-8 | [fase-8-operacion.task.md](../ai/tasks/fase-8-operacion.task.md) |

## Transversales
- [Documentacion transversal](transversal/README.md)
- [Flujo de delivery IA para proveedores](transversal/90.33-flujo-delivery-ia-proveedores.md)
- [Product Design y SPDD Frontend](transversal/90.34-product-design-y-spdd-frontend.md)
`],
    ["docs/fase-0-iniciacion/README.md", `# Fase 0 - Iniciacion

[README principal](../../README.md) | [Indice docs](../README.md)

## Proposito
Alinear el punto de partida de ${ctx.name}: problema, objetivo, alcance, roadmap, estimacion y roles.

## Entregables
- [Vision del proyecto](00.01-vision-proyecto.md)
- [Roadmap](00.02-roadmap.md)
- [Estimacion de tiempo y costo](00.03-estimacion-tiempo-costo.md)
- [Roles y responsabilidades](00.04-roles-y-responsabilidades.md)

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | idea inicial, necesidad, restricciones conocidas y stakeholders |
| Command IA | /document + /plan |
| Agente | enterprise-documentation-orchestrator-agent |
| Skills | documentation-orchestration, framework-governance |
| Artefactos | vision, roadmap, estimacion, roles y preguntas abiertas |
| Gate | gate-documentation-ready y gate-0-1 |
| Evidencia | entrada inicial -> vision -> roadmap -> roles |
| Red flags | alcance sin no alcance, stakeholders ausentes, supuestos no declarados |
| Task packet | [fase-0-iniciacion.task.md](../../ai/tasks/fase-0-iniciacion.task.md) |
`],
    ["docs/fase-0-iniciacion/00.01-vision-proyecto.md", `# Vision del proyecto

[README principal](../../README.md) | [Indice docs](../README.md)

## Problema
Los equipos que gestionan ${ctx.apiResourcePlural} necesitan consultar ${ctx.apiResourcePlural}s de trabajo, cambiar estados con reglas claras y conservar historial auditable. Sin una solucion central, la trazabilidad depende de controles manuales, correos y revisiones tardias.

## Objetivo
Implementar ${ctx.name} como sistema web con API segura para operar ${ctx.apiResourcePlural} desde una ${ctx.apiResourcePlural}, registrar cambios de estado y consultar historial de auditoria.

## Alcance
- Gestion de ${ctx.apiResourcePlural}.
- Consulta y filtros por estado, prioridad y responsable.
- Cambio de estado con autorizacion RBAC.
- Historial de auditoria visible.
- Autenticacion OIDC y autorizacion por roles.
- Observabilidad basica para API y frontend.

## No alcance
- Motor BPM completo.
- Analitica avanzada de procesos.
- Migracion historica masiva.
- Firma digital avanzada.
- Integraciones externas no priorizadas para el MVP.

## Stakeholders
- Sponsor: area responsable de gestion documental.
- Product Owner: responsable funcional de ${ctx.name}.
- Business Analyst: responsable de reglas y trazabilidad.
- Tech Lead: responsable de implementacion.
- Security Lead: responsable de OIDC, RBAC y auditoria.
- Operaciones/SRE: responsable de despliegue, monitoreo y continuidad.

## Restricciones
- Stack base: ${ctx.stack}.
- API: ${ctx.apiResourcePath}.
- IAM: OIDC con issuer ${ctx.oidcIssuer}.
- Contenedor principal: ${ctx.containerImage}.
- DR: ${ctx.drTier} con RTO ${ctx.rto} y RPO ${ctx.rpo}.

## Metricas de exito
- 95% de consultas de ${ctx.apiResourcePlural} responden en menos de 2 segundos.
- 100% de cambios de estado quedan auditados.
- 0 cambios de estado sin rol autorizado.
- Disponibilidad objetivo inicial de 99.5%.
`],
    ["docs/fase-0-iniciacion/00.02-roadmap.md", `# Roadmap

[README principal](../../README.md) | [Indice docs](../README.md)

## Hitos
| Hito | Objetivo | Salida |
|---|---|---|
| H0 | Alineacion inicial | vision, alcance, roles y riesgos |
| H1 | Discovery funcional | RF, RNF, reglas, backlog y UX base |
| H2 | Arquitectura inicial | ADR-001, C4, despliegue y seguridad |
| H3 | MVP SDD | specs de ${ctx.apiResourcePlural}, estado e historial |
| H4 | Construccion | backend, frontend y pruebas |
| H5 | Salida controlada | QA, runbook, rollback y monitoreo |

## Backlog inicial
1. Gestion de ${ctx.apiResourcePlural}.
2. Cambio de estado con validacion.
3. Historial de auditoria.
4. Seguridad OIDC/RBAC.
5. Observabilidad y runbook.
`],
    ["docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md", `# Estimacion de tiempo y costo

[README principal](../../README.md) | [Indice docs](../README.md)

## Supuestos
- Equipo base: PO, BA, Tech Lead, Backend, Frontend, QA y DevOps.
- Stack ${ctx.stack} ya aprobado como base inicial.
- Ambientes dev, staging y prod disponibles.

## Estimacion inicial
| Bloque | Duracion estimada | Roles principales |
|---|---:|---|
| Discovery y requerimientos | 1-2 semanas | PO, BA, UX |
| Arquitectura y seguridad | 1 semana | ARQ, TL, SEC |
| SDD MVP | 1 semana | BA, TL, QA |
| Construccion MVP | 3-5 semanas | FE, BE, TL |
| QA y release | 1-2 semanas | QA, DevOps, SRE |
`],
    ["docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md", `# Roles y responsabilidades

[README principal](../../README.md) | [Indice docs](../README.md)

## Roles asignados
| Rol | Responsabilidad en ${ctx.name} |
|---|---|
| Product Owner (PO) | Prioriza alcance y acepta funcionalidades |
| Business Analyst (BA) | Modela reglas, RF/RNF y trazabilidad |
| Arquitecto de Solucion (ARQ) | Define arquitectura y ADR |
| Tech Lead (TL) | Asegura implementacion coherente |
| Frontend Developer (FE) | Implementa Angular y experiencia web |
| Backend Developer (BE) | Implementa Quarkus, dominio e integraciones |
| QA Engineer (QA) | Define pruebas y evidencias |
| DevOps Engineer (DevOps) | Automatiza CI/CD y ambientes |
| Security Lead (SEC) | Valida OIDC, RBAC y auditoria |
| Operaciones/SRE (SRE) | Opera monitoreo, runbook y continuidad |
`],
  ]);
}

function additionalDocumentationFiles(ctx) {
  return new Map([
    ["docs/fase-1-analisis-requerimientos/README.md", `# Fase 1 - Analisis y requerimientos

[README principal](../../README.md) | [Indice docs](../README.md)

## Proposito
Convertir la vision inicial de ${ctx.name} en actores, modulos, requerimientos funcionales, requerimientos no funcionales, reglas de negocio y backlog inicial.

## Entregables
- [Analisis y requerimientos](01.00-analisis-requerimientos.md)

## Rutas relacionadas
- [Spec inicial de ${ctx.apiResourcePlural}](../../specs/${ctx.feature}/spec-funcional.md)
- [Entregables por fase](../transversal/90.10-entregables-minimos-por-fase.md)

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | vision, alcance, actores, notas de negocio y restricciones |
| Command IA | /document + /plan |
| Agente | enterprise-documentation-orchestrator-agent |
| Skills | requirements-discovery, documentation-orchestration |
| Artefactos | RF, RNF, reglas de negocio, backlog inicial y preguntas abiertas |
| Gate | gate-documentation-ready y gate-0-1 |
| Evidencia | vision -> RF/RNF -> backlog -> trazabilidad inicial |
| Red flags | requerimientos sin actor, reglas sin criterio verificable, HU sin resultado esperado |
| Task packet | [fase-1-requerimientos.task.md](../../ai/tasks/fase-1-requerimientos.task.md) |
`],
    ["docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md", `# Analisis y requerimientos

[README principal](../../README.md) | [Indice docs](../README.md)

## Actores
- Operador: consulta ${ctx.apiResourcePlural} y ejecuta acciones permitidas.
- Aprobador: valida y aprueba transiciones sensibles.
- Administrador: configura roles y parametros operativos.
- Auditor: consulta historial y evidencia.

## Modulos
- Modulo de ${ctx.apiResourcePlural}.
- Gestion de estados.
- Historial y auditoria.
- Seguridad y permisos.
- Observabilidad operativa.

## Requerimientos funcionales
| ID | Actor | Requerimiento | Resultado esperado |
|---|---|---|---|
| RF-01 | Operador | Consultar ${ctx.apiResourcePlural} asignados | Lista filtrable y ordenada |
| RF-02 | Operador | Ver detalle de un expediente | Datos principales y estado actual |
| RF-03 | Operador | Cambiar estado permitido | Transicion registrada y auditada |
| RF-04 | Aprobador | Aprobar transiciones sensibles | Estado final actualizado |
| RF-05 | Auditor | Consultar historial | Eventos con fecha, usuario y accion |

## Requerimientos no funcionales
- RNF-01 Seguridad: OIDC y RBAC para ${ctx.apiResourceName}:read, write y approve.
- RNF-02 Auditoria: todo cambio de estado queda registrado.
- RNF-03 Performance: ${ctx.apiResourcePlural} responde en menos de 2 segundos para carga nominal.
- RNF-04 Disponibilidad: objetivo inicial de 99.5%.
- RNF-05 Observabilidad: logs, metricas y trazas para API critica.

## Reglas de negocio
- Solo usuarios con permiso ${ctx.apiResourceName}:write pueden cambiar estado.
- Solo usuarios con permiso ${ctx.apiResourceName}:approve pueden aprobar transiciones sensibles.
- No se permite una transicion fuera del flujo autorizado.
- Todo cambio registra usuario, fecha, estado anterior, estado nuevo y motivo.

## Integraciones
- IdP OIDC: ${ctx.oidcIssuer}.
- Observabilidad: Prometheus ${ctx.prometheusUrl} y Grafana ${ctx.grafanaUrl}.
- Base de datos: ${ctx.databaseName}.

## Backlog inicial
1. HU-01 Consultar ${ctx.apiResourcePlural}.
2. HU-02 Ver detalle de expediente.
3. HU-03 Cambiar estado.
4. HU-04 Consultar historial de auditoria.
5. HU-05 Validar permisos por rol.
`],
    ["docs/fase-2-ux-ui/README.md", `# Fase 2 - UX/UI

[README principal](../../README.md) | [Indice docs](../README.md)

## Proposito
Definir la experiencia operativa inicial de ${ctx.name}: usuarios, journeys, pantallas principales, estados de interfaz y Product Design antes de construir.

## Entregables
- [UX/UI](02.00-ux-ui.md)
- [Spec-Driven Product Design](02.09-spec-driven-product-design.md)
- [SPDD](02.10-spdd-spec-prototype-driven-development.md)
- [Checklist Product Design](02.11-checklist-product-design.md)
- [Checklist SPDD](02.12-checklist-spdd.md)

## Rutas relacionadas
- [Analisis y requerimientos](../fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [Spec inicial de ${ctx.apiResourcePlural}](../../specs/${ctx.feature}/spec-funcional.md)

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | RF, HU, specs funcionales, actores y reglas de negocio |
| Command IA | /ux |
| Agente | product-design-agent, ux-orchestrator-agent |
| Skills | spec-driven-product-design, spec-prototype-driven-frontend, html5-prototyping, penpot-ai-prototyping, browser-testing |
| Artefactos | product design, SPDD inicial, prototype.md, prototype-validation.md, prototype-html5/ o link/export Penpot |
| Gate | gate-ux-ready, gate-prototype-ready, gate-spdd-approved |
| Evidencia | RF/HU/spec -> Product Design -> SPDD inicial -> prototipo -> validacion |
| Red flags | pantalla sin actor, prototipo sin estados, gate aprobado sin evidencia |
| Task packet | [fase-2-ux.task.md](../../ai/tasks/fase-2-ux.task.md) |
`],
    ["docs/fase-2-ux-ui/02.00-ux-ui.md", `# UX/UI

[README principal](../../README.md) | [Indice docs](../README.md)

## Usuarios
- Operador de ${ctx.apiResourcePlural}.
- Aprobador.
- Auditor.
- Administrador.

## Journeys principales
| Journey | Pasos |
|---|---|
| Consulta de ${ctx.apiResourcePlural} | ingresar, filtrar, seleccionar ${ctx.apiResourceName} |
| Cambio de estado | abrir detalle, elegir accion, indicar motivo, confirmar |
| Auditoria | buscar expediente, abrir historial, revisar eventos |

## Pantallas principales
- Login OIDC.
- Modulo de ${ctx.apiResourcePlural}.
- Detalle de expediente.
- Modal de cambio de estado.
- Historial de auditoria.
- Pantalla de error o acceso denegado.

## Estados UX
- Cargando.
- Sin resultados.
- Error de API.
- Acceso denegado.
- Confirmacion de cambio exitoso.
`],
    ["docs/fase-2-ux-ui/02.09-spec-driven-product-design.md", `# Spec-Driven Product Design

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [UX/UI](02.00-ux-ui.md)
- Siguiente: [SPDD](02.10-spdd-spec-prototype-driven-development.md)
<!-- nav-guided:end -->

## Objetivo
Convertir RF, HU y reglas de ${ctx.name} en claridad de producto antes de prototipar o construir.

## Roles
| Rol | Responsabilidad |
|---|---|
| Product Owner | prioriza necesidad y valor |
| BA | ordena reglas, actores y criterios |
| UX/UI | prepara insumos para SPDD |
| Negocio | valida lenguaje y excepciones |
| IA | estructura, detecta huecos y prepara entregables |

## Flujo
\`\`\`text
RF/HU -> /ux -> Product Design -> problema, usuarios, journey, hipotesis, alcance, metricas -> SPDD
\`\`\`

## Evidencia
- problema,
- objetivo,
- usuarios principales,
- journey conceptual,
- alcance y no alcance,
- metricas de exito,
- validacion inicial,
- trazabilidad hacia SPDD.
`],
    ["docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md", `# SPDD - Spec + Prototype Driven Development

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Spec-Driven Product Design](02.09-spec-driven-product-design.md)
- Siguiente: [Checklist Product Design](02.11-checklist-product-design.md)
<!-- nav-guided:end -->

## Objetivo
Validar como sera la experiencia de ${ctx.name} mediante spec inicial y prototipo antes de cerrar SDD tecnico o construir front/back.

## Flujo
\`\`\`text
Product Design -> SPDD inicial -> /prototype -> gate-prototype-ready -> validacion humana -> gate-spdd-approved -> SDD -> Construccion Front + Back
\`\`\`

## Salidas por feature
- specs/${ctx.feature}/spdd-frontend.md
- specs/${ctx.feature}/prototype.md
- specs/${ctx.feature}/prototype-validation.md
- specs/${ctx.feature}/ui-test-cases.md
- specs/${ctx.feature}/traceability.md

## Gate
- gate-prototype-ready.
- gate-spdd-approved.
`],
    ["docs/fase-2-ux-ui/02.11-checklist-product-design.md", `# Checklist Product Design

[README principal](../../README.md) | [Indice docs](../README.md) | [Volver a la fase](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [SPDD - Spec + Prototype Driven Development](02.10-spdd-spec-prototype-driven-development.md)
- Siguiente: [Checklist SPDD](02.12-checklist-spdd.md)
<!-- nav-guided:end -->

## Objetivo
Verificar que Product Design esta completo antes de pasar a SPDD.

## Checklist de salida

### Problema y objetivo
- [ ] El problema que resuelve la feature esta descrito en una oracion clara.
- [ ] El objetivo esta redactado en terminos de valor para el usuario, no de implementacion tecnica.
- [ ] Se identificaron las hipotesis de solucion y estan diferenciadas de hechos confirmados.

### Usuarios y personas
- [ ] Los actores principales estan nombrados con su rol en el sistema.
- [ ] Hay al menos un journey de usuario descrito para el flujo principal.
- [ ] Se documentaron restricciones de contexto relevantes (accesibilidad, dispositivo, idioma).

### Alcance
- [ ] El alcance del MVP para esta feature esta acotado.
- [ ] Hay una lista de lo que queda fuera de alcance inicial con justificacion breve.
- [ ] Las features candidatas estan priorizadas o al menos listadas.

### Metricas y validacion
- [ ] Hay al menos una metrica de exito medible.
- [ ] El producto o flujo tiene validacion inicial de negocio o preguntas abiertas documentadas.
- [ ] Las decisiones pendientes estan marcadas como supuestos con responsable asignado.

### Trazabilidad
- [ ] La salida tiene referencia a los RF/HU que la originaron.
- [ ] \`specs/<feature>/product-design.md\` esta creado o actualizado.
- [ ] La salida es suficiente para iniciar SPDD.

## Gate de salida
\`gate-ux-ready\` - ver \`../../ai/quality-gates/gate-ux-ready.md\`

## Rutas relacionadas
- [Spec-Driven Product Design](02.09-spec-driven-product-design.md)
- [SPDD](02.10-spdd-spec-prototype-driven-development.md)
- [Checklist SPDD](02.12-checklist-spdd.md)
- [Gate UX Ready](../../ai/quality-gates/gate-ux-ready.md)
`],
    ["docs/fase-2-ux-ui/02.12-checklist-spdd.md", `# Checklist SPDD

[README principal](../../README.md) | [Indice docs](../README.md) | [Volver a la fase](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Checklist Product Design](02.11-checklist-product-design.md)
- Siguiente: [Arquitectura](../fase-3-arquitectura/README.md)
<!-- nav-guided:end -->

## Objetivo
Verificar que SPDD esta completo y aprobado antes de pasar a SDD tecnico o construccion.

## Checklist de entrada (antes de iniciar SPDD)
- [ ] \`specs/<feature>/product-design.md\` existe y tiene gate-ux-ready aplicado.
- [ ] El actor principal y el flujo de la feature estan definidos.
- [ ] Hay al menos un RF/HU de referencia.

## Checklist de ejecucion SPDD

### Spec inicial y flujo UX
- [ ] \`specs/<feature>/spdd-frontend.md\` esta creado.
- [ ] El flujo de pantallas esta descrito paso a paso.
- [ ] Cada pantalla tiene actor, objetivo y reglas visibles.

### Estados UI
- [ ] Estado \`loading\` definido para operaciones asincronas.
- [ ] Estado \`empty\` definido cuando no hay datos.
- [ ] Estado \`error\` de validacion definido.
- [ ] Estado \`error de servicio\` definido.
- [ ] Estado \`success\` definido con confirmacion visible.
- [ ] Estado \`unauthorized\` definido para permisos insuficientes.

### Validaciones y permisos
- [ ] Los campos obligatorios estan identificados en el prototipo.
- [ ] Las reglas de validacion visibles estan documentadas.
- [ ] Los permisos visibles (que ve cada rol) estan descritos.

### Prototipo
- [ ] \`specs/<feature>/prototype.md\` esta creado con wireframes o descripcion de pantallas.
- [ ] Los componentes principales estan nombrados con referencia al design system.
- [ ] El prototipo es suficiente para que negocio pueda validar sin ambiguedad.

### Validacion del prototipo
- [ ] \`specs/<feature>/prototype-validation.md\` esta creado.
- [ ] Hay registro de quien valido o acepto observaciones.
- [ ] Las divergencias entre spec inicial y prototipo estan documentadas y resueltas o aceptadas.

### Casos de prueba UI
- [ ] \`specs/<feature>/ui-test-cases.md\` esta creado.
- [ ] Hay al menos un caso de prueba por estado UI critico.
- [ ] Los criterios de aceptacion visuales estan verificables.

### Trazabilidad
- [ ] \`specs/<feature>/traceability.md\` usa la matriz RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia.
- [ ] El prototipo validado esta enlazado con los componentes previstos.
- [ ] Se ejecuto \`node scripts/ai-framework-agent.mjs sync-memory\` para reflejar la trazabilidad en la memoria del agente.

## Checklist de salida (gate-spdd-approved)
- [ ] Product Design aprobado.
- [ ] Prototipo validado por negocio o UX.
- [ ] Todos los estados UI cubiertos.
- [ ] Divergencias documentadas y resueltas.
- [ ] \`gate-spdd-approved\` aplicado formalmente.

## Regla de bloqueo
No cerrar SDD ni iniciar construccion frontend sin este checklist aprobado o sin documentar explicitamente que la feature no tiene superficie visual.

## Gate de salida
\`gate-spdd-approved\` - ver \`../../ai/quality-gates/gate-spdd-approved.md\`

## Rutas relacionadas
- [Checklist Product Design](02.11-checklist-product-design.md)
- [SPDD](02.10-spdd-spec-prototype-driven-development.md)
- [Gate SPDD Approved](../../ai/quality-gates/gate-spdd-approved.md)
- [Construccion SPDD Frontend](../fase-5-construccion/05.01-spec-prototype-driven-development-frontend.md)
`],
    ["docs/fase-3-arquitectura/README.md", `# Fase 3 - Arquitectura

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Checklist SPDD](../fase-2-ux-ui/02.12-checklist-spdd.md)
- Siguiente: [Arquitectura](03.00-arquitectura.md)
<!-- nav-guided:end -->

## Proposito
Registrar la arquitectura inicial de ${ctx.name}, las decisiones tecnologicas, la estrategia de despliegue y las ADR asociadas.

## Entregables
- [Arquitectura](03.00-arquitectura.md)
- [Decisiones tecnologicas](03.01-decisiones-tecnologia.md)
- [Plan de despliegue](03.03-plan-despliegue.md)
- [ADR](adr/README.md)

## Rutas relacionadas
- [Runbook de deploy](../../ops/fase-7-deploy/runbook.md)
- [Rollback](../../ops/fase-7-deploy/rollback.md)

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | RF/RNF, UX, restricciones, stack y decisiones abiertas |
| Command IA | /review |
| Agente | architecture-agent |
| Skills | architecture-review, adr-writing, deployment-planning |
| Artefactos | arquitectura, decisiones tecnologicas, ADR, plan despliegue y riesgos |
| Gate | gate-2-3 |
| Evidencia | requerimientos + UX -> arquitectura -> ADR -> despliegue |
| Red flags | decision tecnica sin ADR, seguridad sin modelo, despliegue sin rollback |
| Task packet | [fase-3-arquitectura.task.md](../../ai/tasks/fase-3-arquitectura.task.md) |
`],
    ["docs/fase-3-arquitectura/03.00-arquitectura.md", `# Arquitectura

[README principal](../../README.md) | [Indice docs](../README.md)

## Estilo de arquitectura
${ctx.name} usa frontend Angular desacoplado y backend Quarkus modular. El MVP prioriza baja complejidad operativa, seguridad OIDC/RBAC y trazabilidad de cambios.

## Frontend
- Aplicacion Angular 21 en workspace Nx.
- App principal: ${ctx.webComponentName}.
- Consumo de API ${ctx.apiResourcePath}.

## Backend
- Servicio Quarkus: ${ctx.apiServiceName}.
- Paquete Java: ${ctx.javaBasePackage}.
- API REST para ${ctx.apiResourcePlural}, salud y seguridad.

## Base de datos
- Base principal: ${ctx.databaseName}.
- Migraciones con Flyway.
- Auditoria de cambios de estado como entidad de dominio.

## Seguridad
- OIDC issuer: ${ctx.oidcIssuer}.
- Audience: ${ctx.oidcAudience}.
- Claim de roles: ${ctx.oidcRolesClaim}.
- Permisos: ${ctx.apiResourceName}:read, ${ctx.apiResourceName}:write, ${ctx.apiResourceName}:approve.

## Observabilidad
- Prometheus: ${ctx.prometheusUrl}.
- Grafana: ${ctx.grafanaUrl}.
- Logs con redaccion de PII.

## Despliegue
- Imagen: ${ctx.containerImage}.
- Dominios: ${ctx.devDomain}, ${ctx.stagingDomain}, ${ctx.prodDomain}.
- DR: ${ctx.drTier}, RTO ${ctx.rto}, RPO ${ctx.rpo}.
`],
    ["docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md", `# Decisiones tecnologicas

[README principal](../../README.md) | [Indice docs](../README.md)

## Stack aprobado
| Capa | Decision | Justificacion |
|---|---|---|
| Frontend | Angular 21 en Nx | Modularidad, tipado y escalabilidad de UI |
| Backend | Quarkus 3 con Java | Bajo footprint, buen arranque y soporte cloud-native |
| Seguridad | OIDC + RBAC | Integracion con IdP y control granular |
| Datos | Base relacional + Flyway | Consistencia e historial auditable |
| Observabilidad | Prometheus + Grafana | Metricas operativas y soporte SRE |

## ADR relacionado
- [ADR-001 - Stack Quarkus Angular y Keycloak](adr/ADR-001-stack-quarkus-angular-keycloak.md)
`],
    ["docs/fase-3-arquitectura/03.03-plan-despliegue.md", `# Plan de despliegue

[README principal](../../README.md) | [Indice docs](../README.md)

## Ambientes
- Dev: ${ctx.devDomain}.
- Staging: ${ctx.stagingDomain}.
- Produccion: ${ctx.prodDomain}.

## Pipeline y estrategia de release
- Build backend Quarkus.
- Build frontend Angular.
- Publicacion de imagen ${ctx.containerImage}.
- Deploy progresivo con validacion de salud.

## Configuracion y secretos
- Provider de secretos: ${ctx.secretsProvider}.
- Ruta: ${ctx.secretsPath}.
- OIDC y observabilidad via variables de entorno.

## Criterios de salida
- Tests backend y frontend verdes.
- check-docs sin hallazgos.
- check-template-instantiation sin tokens pendientes.
- Runbook y rollback disponibles.

## Rollback
- Revertir imagen a version anterior.
- Restaurar configuracion previa.
- Verificar API health y metricas principales.

## Monitoreo
- Error rate.
- Latencia p95.
- Disponibilidad.
- Fallos de autenticacion/autorizacion.
`],
    ["docs/fase-3-arquitectura/adr/README.md", `# ADR

[README principal](../../../README.md) | [Indice docs](../../README.md)

## ADR registrados
- [ADR-001 - Stack Quarkus Angular y Keycloak](ADR-001-stack-quarkus-angular-keycloak.md)
`],
    ["docs/fase-3-arquitectura/adr/ADR-001-stack-quarkus-angular-keycloak.md", `# ADR-001 - Stack Quarkus Angular y Keycloak

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

## Decision
Usar ${ctx.stack} con backend Quarkus, frontend Angular en Nx y autenticacion OIDC integrada con Keycloak u otro IdP compatible.

## Contexto
${ctx.name} requiere una API segura, frontend modular y operacion preparada para ambientes cloud. El dominio necesita auditoria de transiciones y control de permisos por rol.

## Opciones consideradas
- Quarkus + Angular.
- Spring Boot + React.
- Next.js full-stack.
- Java monolith sin frontend dedicado.

## Consecuencias
- Se obtiene separacion clara entre API y UI.
- Se aprovecha Quarkus para servicios ligeros y cloud-native.
- Angular/Nx facilita modularidad frontend.
- El equipo debe mantener dos pipelines de build.
- La seguridad OIDC/RBAC queda como requisito base.

## Trazabilidad
- Vision: ../../fase-0-iniciacion/00.01-vision-proyecto.md
- Requerimientos: ../../fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md
- Plan despliegue: ../03.03-plan-despliegue.md
`],
    ["docs/fase-4-sdd/README.md", `# Fase 4 - Spec-Driven Development

[README principal](../../README.md) | [Indice docs](../README.md)

## Proposito
Convertir requerimientos aprobados de ${ctx.name} en specs funcionales, tecnicas y tareas construibles.

## Entregables canonicos
- [Indice de specs](../../specs/README.md)
- [Spec funcional - ${ctx.name}](../../specs/${ctx.feature}/spec-funcional.md)
- [Spec tecnica - ${ctx.name}](../../specs/${ctx.feature}/spec-tecnica.md)
- [Spec tareas - ${ctx.name}](../../specs/${ctx.feature}/spec-tareas.md)

## Gate aplicable
- gate-documentation-ready.
- gate-4-6 antes de construccion y QA.

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | RF/HU aprobadas, UX validado, ADR vigentes y restricciones tecnicas |
| Command IA | /spec |
| Agente | spec-writer-agent |
| Skills | spec-writing, writing-plans, acceptance-criteria, technical-design |
| Artefactos | spec-funcional.md, spec-tecnica.md, spec-tareas.md |
| Gate | gate-4-6 |
| Evidencia | RF/HU -> spec funcional -> spec tecnica -> tareas pequenas |
| Red flags | spec sin criterios de aceptacion, tareas sin rutas permitidas, feature sin test plan |
| Task packet | [fase-4-sdd.task.md](../../ai/tasks/fase-4-sdd.task.md) |

## Regla para proveedor IA
No pasar a construccion si \`spec-tareas.md\` no declara tareas pequenas con objetivo, entradas, rutas permitidas, ciclo TDD, comandos de verificacion y evidencia esperada.
`],
    ["docs/fase-5-construccion/README.md", `# Fase 5 - Construccion

[README principal](../../README.md) | [Indice docs](../README.md)

## Proposito
Materializar las specs de ${ctx.name} en codigo backend, frontend, pruebas unitarias y automatizaciones de build. Si el cambio toca frontend, aplicar SPDD desde spec + prototipo.

## Entregables canonicos
- [Spec tecnica inicial](../../specs/${ctx.feature}/spec-tecnica.md)
- [Spec tareas inicial](../../specs/${ctx.feature}/spec-tareas.md)
- [SPDD Frontend](05.01-spec-prototype-driven-development-frontend.md)
- [Spec tecnica inicial](../../specs/${ctx.feature}/spec-tecnica.md)
- [Spec tareas inicial](../../specs/${ctx.feature}/spec-tareas.md)

## Criterios de avance
- Codigo trazado a spec.
- Pruebas unitarias relevantes.
- Seguridad OIDC/RBAC respetada.
- Sin cambios de arquitectura sin ADR.

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | specs aprobadas, ADR, arquitectura, criterios de aceptacion y prototipo/mapping si aplica frontend |
| Command IA | /build |
| Agente | build-agent, frontend-spdd-agent |
| Skills | using-git-worktrees, executing-plans, test-driven-development, spec-prototype-driven-frontend, backend-implementation, frontend-implementation |
| Artefactos | codigo backend, codigo frontend, pruebas unitarias y notas tecnicas |
| Gate | gate-4-6 y gate-frontend-spdd-ready si aplica |
| Evidencia | spec -> tarea -> prueba red/green -> codigo -> resultado de build |
| Red flags | codigo sin spec, cambio de contrato sin ADR, pruebas omitidas, tarea sin evidencia TDD |
| Task packet | [fase-5-construccion.task.md](../../ai/tasks/fase-5-construccion.task.md) |

## Regla para proveedor IA
Ejecuta una tarea por vez desde \`spec-tareas.md\`, preferiblemente en worktree o rama dedicada. Si cambia comportamiento, registra red, green y refactor. Si es frontend, valida UX/prototipo/mapping antes de tocar codigo.
`],
    ["docs/fase-5-construccion/05.01-spec-prototype-driven-development-frontend.md", `# Spec + Prototype Driven Development Frontend

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Fase 5 - Construccion](README.md)
- Siguiente: [Fase 6 - QA](../fase-6-qa/README.md)
<!-- nav-guided:end -->

## Objetivo
Construir frontend de ${ctx.name} desde spec aprobada, prototipo validado, criterios UI y trazabilidad SPDD.

## Entradas
- docs/fase-2-ux-ui/02.00-ux-ui.md.
- docs/transversal/90.34-product-design-y-spdd-frontend.md.
- specs/${ctx.feature}/prototype.md.
- specs/${ctx.feature}/prototype-validation.md.
- specs/${ctx.feature}/spec-funcional.md.
- specs/${ctx.feature}/spec-tecnica.md.
- specs/${ctx.feature}/spec-tareas.md.

## Flujo
\`\`\`text
UX + prototipo + spec -> tarea frontend -> TDD -> implementacion -> verificacion -> review -> gate-frontend-spdd-ready
\`\`\`

## Reglas
- No crear componentes sin revisar el prototipo validado y la trazabilidad.
- No conectar API real durante prototipado HTML5/Penpot; hacerlo solo en construccion posterior a SDD aprobado.
- No cerrar tarea frontend sin prueba o evidencia browser/manual.
- Registrar diferencias entre prototipo y codigo.

## Evidencia
- tarea ejecutada,
- componente o ruta impactada,
- prueba red/green o justificacion,
- comandos frontend,
- evidencia browser si aplica,
- review cuando cambia UX critica, accesibilidad, contrato o seguridad.
`],
    ["docs/fase-6-qa/README.md", `# Fase 6 - QA

[README principal](../../README.md) | [Indice docs](../README.md)

## Proposito
Validar que ${ctx.name} cumple los criterios funcionales, tecnicos, de seguridad y operacion antes de release.

## Entregables canonicos
- [Plan de pruebas](../../qa/fase-6-qa/plan-pruebas.md)
- Evidencias de ejecucion en ../../qa/fase-6-qa/evidencias/
- Defectos y resolucion en ../../qa/fase-6-qa/defectos.md cuando aplique.

## Gate aplicable
- gate-4-6 con evidencia QA.

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | codigo, specs, criterios de aceptacion y riesgos |
| Command IA | /test |
| Agente | qa-agent |
| Skills | qa-planning, test-evidence, defect-triage, requesting-code-review |
| Artefactos | plan de pruebas, evidencias, defectos y recomendacion de salida |
| Gate | gate-4-6 |
| Evidencia | spec -> tarea -> casos -> ejecucion -> evidencia -> decision |
| Red flags | QA sin evidencia, defectos sin severidad, criterios no probados, cambios criticos sin review |
| Task packet | [fase-6-qa.task.md](../../ai/tasks/fase-6-qa.task.md) |

## Regla para proveedor IA
Revisa que las tareas criticas tengan evidencia TDD y code review antes de recomendar release candidato.
`],
    ["docs/fase-7-deploy/README.md", `# Fase 7 - Deploy

[README principal](../../README.md) | [Indice docs](../README.md)

## Proposito
Preparar y ejecutar la salida controlada de ${ctx.name} con runbook, rollback, ambientes y monitoreo inicial.

## Entregables canonicos
- [Runbook de deploy](../../ops/fase-7-deploy/runbook.md)
- [Rollback](../../ops/fase-7-deploy/rollback.md)
- [Plan de despliegue](../fase-3-arquitectura/03.03-plan-despliegue.md)

## Gate aplicable
- gate-7-8 antes de produccion.

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | build candidato, evidencia QA, configuracion, ADR y plan despliegue |
| Command IA | /ship |
| Agente | release-agent |
| Skills | shipping-and-launch, rollback-planning, release-readiness, finishing-development-branch |
| Artefactos | runbook, rollback, checklist deploy, notas de release y evidencia smoke |
| Gate | gate-7-8 |
| Evidencia | branch -> PR/merge -> pipeline -> smoke -> monitoreo -> rollback |
| Red flags | deploy sin rollback, sin monitoreo, sin aprobacion, sin smoke o con branch no cerrable |
| Task packet | [fase-7-deploy.task.md](../../ai/tasks/fase-7-deploy.task.md) |

## Regla para proveedor IA
No proponer merge o release sin checks finales, resumen de cambios, riesgos residuales y estado de worktree/rama.
`],
    ["docs/fase-8-operacion/README.md", `# Fase 8 - Operacion

[README principal](../../README.md) | [Indice docs](../README.md)

## Proposito
Operar ${ctx.name} despues del release con metricas, soporte, continuidad y backlog evolutivo.

## Entregables canonicos
- [Operacion](../../ops/fase-8-operacion/operacion.md)
- [Metricas](../../ops/fase-8-operacion/metricas.md)
- [Runbook de deploy](../../ops/fase-7-deploy/runbook.md)
- [Rollback](../../ops/fase-7-deploy/rollback.md)

## Gate aplicable
- gate-7-8 con monitoreo y rollback disponibles.

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | produccion, metricas, incidentes, feedback y backlog evolutivo |
| Command IA | /review + /ship |
| Agente | operations-agent |
| Skills | operations-review, incident-analysis, continuous-improvement |
| Artefactos | operacion, metricas, postmortems, backlog evolutivo y mejoras |
| Gate | gate-7-8 |
| Evidencia | metricas -> hallazgos -> acciones -> seguimiento |
| Red flags | operacion sin metricas, incidente sin postmortem, mejora sin owner |
| Task packet | [fase-8-operacion.task.md](../../ai/tasks/fase-8-operacion.task.md) |
`],
    ["docs/transversal/README.md", `# Documentacion transversal

[README principal](../../README.md) | [Indice docs](../README.md)

## Proposito
Centralizar reglas comunes de ${ctx.name}: entregables minimos, checklist, trazabilidad y controles que cruzan varias fases.

## Entregables
- [Entregables minimos por fase](90.10-entregables-minimos-por-fase.md)
- [Checklist de entregables](90.11-checklist-entregables.md)
- [Operacion IA por fase](90.12-operacion-ia-por-fase.md)
- [Flujo de delivery IA para proveedores](90.33-flujo-delivery-ia-proveedores.md)
- [Product Design y SPDD Frontend](90.34-product-design-y-spdd-frontend.md)
`],
    ["docs/transversal/90.10-entregables-minimos-por-fase.md", `# Entregables minimos por fase

[README principal](../../README.md) | [Indice docs](../README.md)

## Vista del proyecto
| Fase | Entregables de ${ctx.name} | Estado |
|---|---|---|
| 0 | vision, roadmap, estimacion, roles | inicial |
| 1 | actores, modulos, RF, RNF, reglas y backlog | inicial |
| 2 | product design, journeys, pantallas, estados UX, prototipo y mapping | inicial |
| 3 | arquitectura, decisiones, ADR y despliegue | inicial |
| 4 | specs por feature | iniciado con 001 |
| 5 | backend, frontend, SPDD frontend y pruebas unitarias | iniciado con stack ${ctx.stack} |
| 6 | plan de pruebas | inicial |
| 7 | runbook y rollback | inicial |
| 8 | operacion y metricas | inicial |
`],
    ["docs/transversal/90.11-checklist-entregables.md", `# Checklist de entregables

[README principal](../../README.md) | [Indice docs](../README.md)

## Gate 0-1
- [x] Vision inicial disponible.
- [x] Requerimientos iniciales disponibles.
- [x] Roadmap inicial disponible.
- [x] Roles base disponibles.
- [ ] Validacion de negocio pendiente.

## Gate 2-3
- [x] Gate UX Ready inicial con observaciones.
- [x] Product Design inicial disponible para ${ctx.apiResourcePlural}.
- [x] Arquitectura inicial disponible.
- [x] Decision de stack registrada en ADR-001.
- [x] Plan de despliegue inicial disponible.
- [ ] C4 detallado pendiente.

## Gate 4-6
- [x] Spec funcional inicial para ${ctx.apiResourcePlural}.
- [x] Spec tecnica inicial para ${ctx.apiResourcePlural}.
- [x] Tareas iniciales.
- [x] SPDD Frontend documentado como regla de construccion frontend.
- [ ] Tareas con TDD y evidencia por slice pendientes de ejecucion.
- [ ] Revision de codigo pendiente.
- [ ] Evidencia QA pendiente.

## Gate 7-8
- [x] Runbook inicial.
- [x] Rollback inicial.
- [x] Metricas iniciales.
- [ ] Ensayo operativo pendiente.
`],
    ["docs/transversal/90.12-operacion-ia-por-fase.md", `# Operacion IA por fase

[README principal](../../README.md) | [Indice docs](../README.md)

## Objetivo
Definir como un proveedor IA debe ejecutar cada fase de ${ctx.name} sin perder trazabilidad, rutas canonicas, gates ni evidencia.

## Contrato comun para proveedores IA
| Campo | Regla |
|---|---|
| Lectura inicial | AGENTS.md, docs/README.md, ai/README.md y el task packet de la fase |
| Escritura | Solo en rutas canonicas indicadas por el task packet |
| Supuestos | Deben quedar declarados en el artefacto afectado |
| Preguntas abiertas | Deben registrarse cuando falte informacion critica |
| Validacion | Ejecutar gates y documentar evidencia |
| Aprobacion humana | No sustituir aprobaciones humanas de negocio, arquitectura, QA o release |

## Matriz operacional
| Fase | Command IA | Agente | Gate | Task packet |
|---|---|---|---|---|
| 0 | /document + /plan | enterprise-documentation-orchestrator-agent | gate-0-1 | ../../ai/tasks/fase-0-iniciacion.task.md |
| 1 | /document + /plan | enterprise-documentation-orchestrator-agent | gate-0-1 | ../../ai/tasks/fase-1-requerimientos.task.md |
| 2 | /ux | product-design-agent, ux-orchestrator-agent | gate-ux-ready | ../../ai/tasks/fase-2-ux.task.md |
| 3 | /review | architecture-agent | gate-2-3 | ../../ai/tasks/fase-3-arquitectura.task.md |
| 4 | /spec | spec-writer-agent | gate-4-6 | ../../ai/tasks/fase-4-sdd.task.md |
| 5 | /build | build-agent, frontend-spdd-agent | gate-4-6 y gate-frontend-spdd-ready si aplica | ../../ai/tasks/fase-5-construccion.task.md |
| 6 | /test | qa-agent | gate-4-6 | ../../ai/tasks/fase-6-qa.task.md |
| 7 | /ship | release-agent | gate-7-8 | ../../ai/tasks/fase-7-deploy.task.md |
| 8 | /review + /ship | operations-agent | gate-7-8 | ../../ai/tasks/fase-8-operacion.task.md |

## Evidencia minima por ejecucion IA
- Task packet usado.
- Archivos leidos.
- Archivos creados o actualizados.
- Gate aplicado.
- Resultado del gate.
- Preguntas abiertas.
- Siguiente paso recomendado.
`],
    ["docs/transversal/90.33-flujo-delivery-ia-proveedores.md", `# Flujo de delivery IA para proveedores

[README principal](../../README.md) | [Indice docs](../README.md)

## Objetivo
Guiar a un proveedor IA desde una idea, RF/HU o spec hasta codigo revisado, probado y listo para release de ${ctx.name}.

## Flujo canonico
\`\`\`text
Product Design
  -> SPDD si hay experiencia visual
  -> gate-spdd-approved
  -> /spec
  -> spec aprobada
  -> writing-plans
  -> worktree/rama
  -> executing-plans
  -> TDD red-green-refactor
  -> code review
  -> QA/evidencia
  -> cierre branch/PR
\`\`\`

## Reglas
- No construir sin spec funcional, spec tecnica y spec de tareas.
- No cerrar SDD ni construir feature visual sin gate-spdd-approved.
- No ejecutar tareas genericas; cada tarea debe tener objetivo, entradas, rutas permitidas, TDD, comandos y evidencia.
- No cambiar arquitectura, datos, seguridad o contratos sin ADR o actualizacion de spec.
- No cerrar tarea sin prueba o razon explicita de evidencia manual.
- No cerrar rama sin QA, resumen de cambios y riesgos residuales.

## Aplicacion a ${ctx.name}
| Paso | Ruta o artefacto |
|---|---|
| Product Design | docs/fase-2-ux-ui/02.09-spec-driven-product-design.md |
| SPDD | docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md |
| Specs | specs/${ctx.feature}/ |
| Plan ejecutable | specs/${ctx.feature}/spec-tareas.md |
| Construccion | backend/ y frontend/ |
| QA | qa/fase-6-qa/ |
| Release | ops/fase-7-deploy/ |

## Evidencia minima
- Alternativas y recomendacion si hubo ambiguedad.
- Tareas pequenas con IDs estables.
- Rama o worktree usado.
- Evidencia red-green-refactor o justificacion.
- Revision de codigo en cambios criticos.
- Resultado de pruebas y QA.
- Resumen de PR/merge o bloqueo.
`],
    ["docs/transversal/90.25-threat-modeling.md", `# Threat modeling

[README principal](../../README.md) | [Indice docs](../README.md) | [Volver a transversal](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Operacion IA por fase](90.12-operacion-ia-por-fase.md)
- Siguiente: [Contract governance](90.26-contract-governance.md)
<!-- nav-guided:end -->


## Contenido
- [Objetivo](#objetivo)
- [Cuando hacer threat modeling](#cuando-hacer-threat-modeling)
- [Metodologia: STRIDE por componente](#metodologia-stride-por-componente)
- [Plantilla por feature](#plantilla-por-feature)
- [Crosswalk con DPIA y compliance](#crosswalk-con-dpia-y-compliance)
- [Backlog de mitigaciones](#backlog-de-mitigaciones)
- [Integracion con CI y revision](#integracion-con-ci-y-revision)
- [Anti-patrones](#anti-patrones)
- [Referencias](#referencias)

<a id="objetivo"></a>
## Objetivo
Hacer explicito y revisable el analisis de amenazas a nivel feature y a nivel sistema. El objetivo no es producir un documento perfecto, sino entrenar a quien construye a pensar en abuso, no solo en uso. Cada feature critica genera un threat model versionado, ligado al spec y al ADR.

Este documento define la metodologia (STRIDE) y la plantilla; el modelado real vive junto al codigo: \`specs/<feature>/threat-model.md\`.

<a id="cuando-hacer-threat-modeling"></a>
## Cuando hacer threat modeling
Obligatorio:
- Cualquier feature que toca autenticacion, autorizacion o sesion.
- Cualquier feature que recibe input de usuario y lo persiste o ejecuta.
- Cualquier integracion saliente con sistema externo (webhook, API, file upload, OAuth).
- Cualquier feature que procesa o expone datos personales (cruza con DPIA en \`90.16\`).
- Cualquier cambio arquitectonico que mueva un trust boundary (nuevo servicio, nuevo proveedor, nueva region).

Recomendado:
- Cualquier endpoint nuevo.
- Cualquier migracion que rota datos sensibles.
- Cualquier ADR de seguridad o supply chain.

<a id="metodologia-stride-por-componente"></a>
## Metodologia: STRIDE por componente
Para cada componente identificado en el data flow diagram (DFD) de la feature, evaluar las seis categorias STRIDE. El DFD minimo viable son cuatro elementos: external entity, process, data store, trust boundary.

| Categoria | Pregunta gatillo | Mitigacion baseline |
| --- | --- | --- |
| **S**poofing | Puede otro actor suplantar a un actor legitimo? | AuthN OIDC + MFA en flujos sensibles; mTLS service-to-service; firma de webhooks. |
| **T**ampering | Puede modificarse el dato en transito o en reposo sin detectarlo? | TLS 1.3 obligatorio; integrity checks (HMAC, firmas); audit log immutable (\`contracts/events/audit-log.schema.json\`). |
| **R**epudiation | Puede el actor negar haber realizado la accion? | Audit trail con timestamp + actor + IP + sesion; logs append-only. |
| **I**nformation disclosure | Puede leer dato quien no deberia? | RBAC + ABAC (\`03.08-auth-authz.md\`); cifrado en reposo; redaccion PII (\`pii-redact.ts\` / \`PiiRedactor.java\`); minimo privilegio en queries. |
| **D**enial of service | Puede saturarse el servicio o componente? | Rate limiting; circuit breakers; HPA + PDB; quotas en multi-tenant; backpressure. |
| **E**levation of privilege | Puede un actor obtener mas permisos de los asignados? | Validacion de claims en cada hop; CSRF tokens; SSRF allowlist; deny-by-default en NetworkPolicy. |

Una feature puede tener varios componentes; el threat model los enumera por separado.

<a id="plantilla-por-feature"></a>
## Plantilla por feature
Crear \`specs/<feature>/threat-model.md\` con esta estructura:

\`\`\`markdown
# Threat model - <feature>

## Contexto
- Feature: <slug>
- Owner: <persona / squad>
- Spec: ../<feature>/spec.md
- Datos sensibles tocados: <lista; cruzar con ROPA si aplica>

## Data Flow Diagram
<descripcion textual o mermaid del DFD>

## Componentes
- C1: <Browser> (external entity)
- C2: <API gateway> (process)
- C3: <Service handler> (process)
- C4: <DB / cache> (data store)
- TB: <trust boundary entre red publica y privada>

## Amenazas identificadas
| ID  | Componente | STRIDE | Amenaza concreta                                     | Mitigacion existente               | Mitigacion propuesta                       | Riesgo residual |
| --- | ---------- | ------ | ---------------------------------------------------- | ---------------------------------- | ------------------------------------------ | --------------- |
| T-1 | C2         | S      | Token aceptado sin validar audience                  | jwtVerify con audience configurado | -                                          | Bajo            |
| T-2 | C3         | I      | Log emite payload con DNI cuando hay error           | -                                  | Aplicar redact() en error handler          | Aceptable tras  |
| T-3 | C4         | D      | Query unbounded por usuario externo agota conexiones | Pool maximo                        | Rate limit por usuario + paginacion forzada | Aceptable tras  |

## Decisiones aceptadas
- Riesgos cuyo dueno acepta sin mitigar: <con justificacion explicita>.
- Plazo para revisar la decision: <fecha>.

## Action items
- AI-1: Implementar redaccion en error handler [responsable, fecha].
- AI-2: Anadir rate limit por usuario en endpoint X [responsable, fecha].

## Aprobacion
- Autor: <persona>
- Revisado por: <security lead>
- Fecha: YYYY-MM-DD
\`\`\`

<a id="crosswalk-con-dpia-y-compliance"></a>
## Crosswalk con DPIA y compliance
- Si el threat model identifica datos personales sensibles, el equipo dispara DPIA segun \`90.16-privacidad-compliance.md\`. El threat model y la DPIA citan al otro reciprocamente.
- Si el threat model expone una restriccion regulatoria (financiera, salud, sector publico), se anade nota explicita y se levanta ADR con los controles especificos.
- Si una mitigacion afecta el ROPA, se actualiza el ROPA en el mismo PR.

<a id="backlog-de-mitigaciones"></a>
## Backlog de mitigaciones
Las amenazas con mitigacion propuesta pero no implementada se rastrean como issues con label \`threat-model\` y prioridad por riesgo residual. Las amenazas aceptadas sin mitigar tienen fecha de revision obligatoria.

El equipo de seguridad revisa el backlog mensualmente. La definicion de hecho de una feature critica incluye: "todas las amenazas con riesgo residual mayor a aceptable estan mitigadas".

<a id="integracion-con-ci-y-revision"></a>
## Integracion con CI y revision
- El template de pull request (\`.github/pull_request_template.md\`) incluye casilla "Threat model adjunto si aplica".
- Para features marcadas como obligatorias arriba, CI puede marcar warning si el PR toca codigo sensible y no incluye \`specs/<feature>/threat-model.md\`.
- Las amenazas T-X se referencian en commits con \`Refs: TM-T-1\` cuando el commit es la mitigacion.

<a id="anti-patrones"></a>
## Anti-patrones
- Hacer threat modeling solo al final del proyecto: pierde la oportunidad de moldear la arquitectura.
- Descargar la responsabilidad solo en seguridad: el dueno de la feature debe participar.
- Enumerar amenazas sin riesgo residual: no se sabe que decidir.
- Aceptar riesgos sin fecha de revision: amenazas viejas se vuelven invisibles.
- Confundir threat model con pen-test: son complementarios, no sustitutos.

<a id="referencias"></a>
## Referencias
- [STRIDE - Microsoft Threat Modeling](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
`],
    ["docs/transversal/90.26-contract-governance.md", `# Contract governance

[README principal](../../README.md) | [Indice docs](../README.md) | [Volver a transversal](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Threat modeling](90.25-threat-modeling.md)
- Siguiente: [Integracion selectiva con agent-skills](90.29-integracion-selectiva-agent-skills.md)
<!-- nav-guided:end -->


## Contenido
- [Objetivo](#objetivo)
- [Versionado del contrato](#versionado-del-contrato)
- [Cambios breaking vs non-breaking](#cambios-breaking-vs-non-breaking)
- [Politica de deprecation](#politica-de-deprecation)
- [Patron expand-contract](#patron-expand-contract)
- [Validacion automatica en CI](#validacion-automatica-en-ci)
- [Excepciones](#excepciones)
- [Comunicacion a consumidores](#comunicacion-a-consumidores)
- [Anti-patrones](#anti-patrones)
- [Referencias](#referencias)

<a id="objetivo"></a>
## Objetivo
Hacer revisables las decisiones que rompen contratos publicos antes de mergeear, no despues de que un consumidor se entere en produccion. Aplica a \`contracts/api/openapi.yaml\` (REST), \`contracts/events/asyncapi.yaml\` (eventos) y los JSON Schemas de \`contracts/events/\`.

El gating es automatico: el job \`contract-governance\` del workflow \`template.yml\` ejecuta \`ci/scripts/check-openapi-diff.mjs\` contra el contrato del baseline (rama \`main\`). Si detecta cambios breaking sin la label \`contract-breaking-approved\`, el PR queda bloqueado.

<a id="versionado-del-contrato"></a>
## Versionado del contrato
- El contrato sigue **SemVer**: MAJOR.MINOR.PATCH.
- **MAJOR** sube ante un cambio breaking (ver lista abajo). Requiere convivencia de la version anterior por al menos 90 dias.
- **MINOR** sube ante adiciones non-breaking (campo opcional nuevo, endpoint nuevo, codigo de respuesta nuevo no removible).
- **PATCH** sube ante cambios cosmeticos (descripcion, ejemplos, orden de propiedades).
- La version del contrato vive en \`contracts/api/openapi.yaml#info.version\` y en \`contracts/events/asyncapi.yaml#info.version\`. El campo es source of truth.

<a id="cambios-breaking-vs-non-breaking"></a>
## Cambios breaking vs non-breaking

| Tipo de cambio | Categoria | Justificacion |
| --- | --- | --- |
| Eliminar un endpoint o operationId | Breaking | Cliente que lo invoca falla. |
| Cambiar el tipo de un campo (string -> number) | Breaking | Deserializacion del cliente falla. |
| Convertir un campo opcional en \`required\` en un request body | Breaking | Clientes que no lo envian fallan con 400. |
| Eliminar un campo de una respuesta | Breaking | Clientes que lo leen ven undefined. |
| Eliminar un valor de un \`enum\` de respuesta | Breaking | Cliente con switch exhaustivo no contempla el caso. |
| Eliminar un \`responseCode\` documentado (4xx/5xx) | Breaking | Cliente con error handling especifico falla en silencio. |
| Cambiar un \`securityScheme\` requerido (ej. anadir \`mtls\`) | Breaking | Clientes sin la nueva auth fallan con 401. |
| Renombrar un campo | Breaking | Cliente que lo lee/envia falla. Se trata como remove + add. |
| Anadir un campo opcional a un response | Non-breaking | Clientes JSON tolerantes lo ignoran. |
| Anadir un endpoint nuevo | Non-breaking | Clientes existentes no lo invocan. |
| Anadir un valor nuevo a un \`enum\` de request body | Non-breaking | Clientes que envian valores legacy siguen siendo validos. |
| Anadir un valor nuevo a un \`enum\` de response | **Breaking debil** | Clientes con switch exhaustivo pueden fallar; documentar como \`MINOR\` con nota. |
| Cambiar texto de descripciones, ejemplos | Non-breaking | Cosmetico. |
| Marcar un campo como \`deprecated: true\` | Non-breaking | Cliente sigue funcionando; senal para migrar. |

Resumen operativo: **toda modificacion debe ser un cambio aditivo o una eliminacion con deprecation previa de 90 dias**.

<a id="politica-de-deprecation"></a>
## Politica de deprecation
1. Marcar el campo, endpoint o codigo con \`deprecated: true\` y nota explicita en \`description\` indicando: motivo, alternativa, fecha minima de retiro.
2. Anunciar a los consumidores conocidos via canal acordado (mailing list, status page, Slack \`#api-consumers\`).
3. Mantener funcional al menos 90 dias calendario.
4. Auditar uso (telemetria del API gateway): si el deprecation tiene trafico residual, extender ventana o contactar al consumidor especifico.
5. Tras los 90 dias y verificacion de cero trafico, abrir PR de remocion con label \`contract-breaking-approved\`. El PR sube \`MAJOR\` y referencia el anuncio original.

<a id="patron-expand-contract"></a>
## Patron expand-contract
Para evolucionar sin romper:

1. **Expand**: anadir el nuevo campo/endpoint en MINOR; el viejo sigue funcionando.
2. **Migrate**: clientes adoptan el nuevo. Telemetria muestra adopcion.
3. **Contract**: marcar el viejo como \`deprecated\`; abrir el reloj de 90 dias.
4. **Remove**: tras la ventana, eliminarlo en una MAJOR.

Aplica tambien a campos: para renombrar \`customerId\` -> \`clientId\`, primero coexisten ambos en MINOR (el handler escribe ambos en respuestas; acepta cualquiera en requests), luego se deprecia el viejo, luego se elimina.

<a id="validacion-automatica-en-ci"></a>
## Validacion automatica en CI
El job \`contract-governance\` corre \`node ci/scripts/check-openapi-diff.mjs --base origin/main --head HEAD\`:

- Parsea ambos contratos OpenAPI (parser pragmatico sin dependencias externas, suficiente para el subset que usamos).
- Reporta breakings con \`path: <pointer>: <razon>\`.
- Sale con codigo distinto de cero si hay breakings sin label.

Para introducir un breaking aprobado:
1. Crear PR.
2. Solicitar revision al Tech Lead + Product Owner.
3. Una vez aprobado el deprecation plan, aplicar la label \`contract-breaking-approved\` al PR.
4. El job pasa con warning. La descripcion del PR debe enlazar al anuncio publico.

<a id="excepciones"></a>
## Excepciones
- **Endpoints internos sin SLA externo**: pueden marcarse con \`x-internal: true\` en el path; el check los ignora.
- **Pre-1.0 (alpha/beta)**: el contrato puede romperse libremente mientras \`info.version\` < \`1.0.0\`. Documentar en el README del repo.
- **Bug fixes de seguridad**: si un campo debe removerse por motivo de seguridad (PII filtrada por error), se aprueba como breaking emergency con label \`security-breaking\` y notificacion proactiva a consumidores.

<a id="comunicacion-a-consumidores"></a>
## Comunicacion a consumidores
- **Status page**: cualquier breaking publica el anuncio con 90 dias de antelacion en la status page del producto.
- **Changelog del API**: \`contracts/CHANGELOG.md\` (separado del CHANGELOG del repo) registra cada cambio con fecha y categoria.
- **Webhooks de "discovery"**: si la organizacion expone un Backstage publico, los \`API\` kinds de \`catalog/apis/\` muestran lifecycle (\`production\` / \`deprecated\` / \`experimental\`).
- **Newsletter API**: para consumidores externos, mailing list mensual con cambios.

<a id="anti-patrones"></a>
## Anti-patrones
- "Lo cambio en el codigo y actualizo el OpenAPI despues": rompe el contrato como source of truth.
- "Si el cliente no usa ese campo, no es breaking": no se sabe quien lo usa hasta que rompe.
- Saltar deprecation porque "es interno": las interfaces internas tambien tienen consumidores; el costo de una migracion sorpresiva es alto incluso intramuros.
- Subir \`MAJOR\` sin notificar: rompe la confianza con consumidores externos.
- "Lo arreglo en el siguiente release": en breaking, no hay siguiente release; el cliente esta roto desde el deploy.

<a id="referencias"></a>
## Referencias
- [Stoplight breaking changes](https://meta.stoplight.io/docs/platform/branches/changelog/breaking-non-breaking-changes.md)
- [OpenAPI specification](https://spec.openapis.org/oas/v3.1.0)
`],
    ["docs/transversal/90.29-integracion-selectiva-agent-skills.md", `# Integracion selectiva con agent-skills

[README principal](../../README.md) | [Indice docs](../README.md) | [Volver a transversal](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Contract governance](90.26-contract-governance.md)
- Siguiente: [Principios SOLID y diseno modular](90.30-principios-solid-diseno-modular.md)
<!-- nav-guided:end -->

## Objetivo
Explicar como aprovechar patrones valiosos de \`agent-skills\` sin reemplazar el modelo documental por fases de esta plantilla.

## Regla de integracion
- El repositorio mantiene su propia estructura \`docs/\`, \`specs/\`, \`src/\`, \`tests/\`, \`qa/\` y \`ops/\`.
- \`agent-skills\` se toma como referencia de enforcement: lifecycle, red flags, anti-rationalizations y verificacion.
- La integracion es selectiva; no se importa el catalogo externo completo.

## Mapeo por fase
| Fase o foco | Patron de referencia | Aterrizaje local |
|---|---|---|
| Fase 0 - Iniciacion | \`idea-refine\` | \`ai/skills/idea-refine.skill.md\`, \`/plan\` |
| Fase 1 - Analisis | \`spec-driven-development\` | \`ai/skills/requirements-quality.skill.md\`, \`/plan\`, \`/review\` |
| Fase 4 - SDD | \`planning-and-task-breakdown\` | \`ai/skills/spec-writer.skill.md\`, \`/spec\` |
| Fase 5 - Construccion | \`incremental-implementation\`, \`source-driven-development\` | \`ai/skills/backend.skill.md\`, \`ai/skills/frontend.skill.md\`, \`ai/skills/source-driven-development.skill.md\`, \`/build\` |
| Frontend | \`frontend-ui-engineering\`, \`browser-testing\` | \`ai/skills/frontend.skill.md\`, \`ai/skills/browser-testing.skill.md\`, \`/test\` |
| APIs | \`api-and-interface-design\` | \`ai/prompts/generar-spec-tecnica.md\`, \`ai/skills/backend.skill.md\` |
| QA | \`debugging-and-error-recovery\`, \`code-review-and-quality\` | \`ai/skills/debugging-workflow.skill.md\`, \`ai/skills/qa.skill.md\`, \`/review\`, \`/test\` |
| Deploy | \`ci-cd-and-automation\`, \`shipping-and-launch\` | \`ai/skills/devops.skill.md\`, \`ai/skills/shipping-and-launch.skill.md\`, \`/ship\` |
| Operacion | \`performance-optimization\`, \`security-and-hardening\` | \`ai/skills/performance-optimization.skill.md\`, \`ai/skills/security-hardening.skill.md\`, \`/review\` |

## Artefactos AI-first relacionados
- \`ai/commands/\`
- \`ai/quality-gates/\`
- \`ai/external-agent-skills.md\`
- \`docs/transversal/90.28-anatomia-operativa-de-agents-prompts-skills.md\`

## Resultado esperado
La plantilla sigue siendo el mapa enterprise del proyecto, pero ahora su capa de IA se comporta con mas disciplina operativa: comandos lifecycle, gates dedicados, skills endurecidas y evidencia mas visible por fase.
`],
    ["docs/transversal/90.30-principios-solid-diseno-modular.md", `# Principios SOLID y diseno modular

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Integracion selectiva con agent-skills](90.29-integracion-selectiva-agent-skills.md)
- Siguiente: [Flujo de delivery IA para proveedores](90.33-flujo-delivery-ia-proveedores.md)
<!-- nav-guided:end -->

## Objetivo
Hacer explicito el uso de SOLID como criterio de diseno para arquitectura, specs tecnicas, implementacion y revision de codigo en ${ctx.name}. No reemplaza SDD, ADR ni pruebas; funciona como una regla de calidad para evitar acoplamiento accidental y codigo dificil de evolucionar.

## Cuando aplica
- Al definir capas, modulos, puertos, adaptadores, componentes UI, stores, servicios o casos de uso.
- Al revisar cambios que agregan reglas de negocio, integraciones, permisos, validaciones o flujos de datos.
- Al decidir si una abstraccion es necesaria o si el cambio puede mantenerse simple.

## Principios
| Principio | Criterio practico |
|---|---|
| S - Single Responsibility | Cada clase, componente, modulo o caso de uso tiene una razon principal de cambio. |
| O - Open/Closed | El comportamiento se puede extender sin reescribir contratos estables ni romper consumidores. |
| L - Liskov Substitution | Una implementacion puede reemplazar a otra sin cambiar el comportamiento esperado del contrato. |
| I - Interface Segregation | Las interfaces, puertos o props no obligan a depender de metodos o datos que no se usan. |
| D - Dependency Inversion | Dominio y aplicacion dependen de abstracciones; infraestructura, SDKs y frameworks quedan en bordes. |

## Uso por fase
| Fase | Como se evidencia |
|---|---|
| Fase 1 - Analisis | RNF de mantenibilidad, modularidad y facilidad de cambio declarados. |
| Fase 3 - Arquitectura | Capas, boundaries, dependencias y excepciones documentadas en arquitectura o ADR. |
| Fase 4 - SDD | spec tecnica explica responsabilidades, contratos, dependencias y pruebas por boundary. |
| Fase 5 - Construccion | Codigo organizado por responsabilidad y probado sin acoplar dominio a infraestructura. |
| Fase 6 - QA/Review | Evidencia de build/test y revision de red flags de acoplamiento, duplicacion o abstraccion innecesaria. |

## Reglas de aplicacion
- Usa SOLID para reducir riesgo de cambio, no para crear arquitectura accidental.
- Si una excepcion a SOLID simplifica el MVP, documenta la razon y el criterio para revisarla luego.
- Si un cambio toca contratos, permisos, datos o integraciones, revisa dependencias antes de cerrar la feature.
- En frontend, aplica SOLID a componentes, stores, hooks, services y boundaries entre UI, estado y API.
- En backend, aplica SOLID a casos de uso, puertos, adaptadores, servicios de dominio y controladores.

## Red flags
- Un componente o clase mezcla UI, reglas de negocio, persistencia y llamadas externas.
- Una interfaz obliga a implementar metodos que el consumidor no necesita.
- Un test solo funciona con una implementacion concreta aunque el contrato promete abstraccion.
- Cambiar una regla de negocio exige modificar controladores, repositorios, DTOs y clientes sin boundary claro.
- Se crea una abstraccion generica sin segundo caso real, prueba o decision tecnica que la justifique.

## Evidencia minima
- Referencia a la feature o spec que origina el cambio.
- Archivos modificados por capa o responsabilidad.
- Pruebas unitarias, integracion o e2e asociadas al boundary afectado.
- Resultado de build/test ejecutado.
- ADR o nota tecnica si se introduce una excepcion relevante.
`],
    ["docs/transversal/90.34-product-design-y-spdd-frontend.md", `# Product Design y SPDD Frontend

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Flujo de delivery IA para proveedores](90.33-flujo-delivery-ia-proveedores.md)
- Siguiente: [Volver al indice de documentacion](../README.md)
<!-- nav-guided:end -->

## Objetivo
Definir el orden Product Design -> SPDD -> SDD -> Construccion para que ${ctx.name} tenga algo mostrable antes de construir.

## Relacion correcta
| Momento | Resultado | Gate |
|---|---|---|
| Product Design | claridad de producto | gate-ux-ready |
| SPDD | prototipo validado | gate-spdd-approved |
| SDD | specs front/back construibles | gate-4-6 |
| Construccion | codigo y pruebas | gate-4-6 |

## Flujo
\`\`\`text
RF/HU -> /ux -> Product Design -> SPDD inicial -> /prototype -> gate-prototype-ready -> validacion humana -> gate-spdd-approved -> /spec -> SDD -> /build -> Front + Back
\`\`\`

## Regla
/ux no es opcional cuando la feature modifica experiencia, pantalla, prototipo o frontend. Ninguna feature visual pasa a SDD final ni construccion sin gate-spdd-approved.

## Evidencia para proveedor IA
- RF/HU que alimenta la pantalla,
- wireframe o prototipo,
- componente Penpot y componente Angular esperado,
- validacion de prototipo,
- impactos a API, permisos, errores y validaciones,
- tarea de spec-tareas.md.
`],
    ["ai/README.md", `# AI operacional

[README principal](../README.md)

## Uso en ${ctx.name}
La capa IA del proyecto opera como apoyo para documentacion, specs, revision, QA, release y operacion.

## Ejecucion por proveedor IA
- [Provider manifest](provider-manifest.json)
- [Task packets](tasks/README.md)
- [Agents](agents/README.md)
- [Commands](commands/README.md)
- [Skills](skills/README.md)
- [References](references/README.md)
- [Quality gates](quality-gates/README.md)
- [Prompts generados](prompts/generated/README.md)
- [Flujo de delivery IA](../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)
- [Product Design y SPDD Frontend](../docs/transversal/90.34-product-design-y-spdd-frontend.md)

## Entrada recomendada
\`\`\`powershell
node C:\\template\\project-template\\scripts\\ai-framework-agent.mjs document --source intake\\necesidades-iniciales.md
\`\`\`

## Reglas
- Toda salida debe terminar en ruta canonica.
- No cambiar arquitectura sin ADR.
- No construir frontend sin revisar UX/prototipo/mapping cuando aplica.
- No avanzar a construccion sin spec funcional y tecnica.
- No cerrar QA sin evidencia.
`],
    ["ai/provider-manifest.json", `{
  "projectName": "${ctx.name}",
  "projectSlug": "${ctx.slug}",
  "javaBasePackage": "${ctx.javaBasePackage}",
  "containerImage": "${ctx.containerImage}",
  "apiResourcePlural": "${ctx.apiResourcePlural}",
  "apiResourcePath": "${ctx.apiResourcePath}",
  "status": "ready-for-ai-provider",
  "methodology": "enterprise-ai-first-phases-0-8",
  "canonicalIndex": "docs/README.md",
  "taskIndex": "ai/tasks/README.md",
  "rules": [
    "read AGENTS.md before executing any task",
    "write only to canonical paths declared by the task packet",
    "for visual features, do not close SDD or build front/back without gate-spdd-approved",
    "before build, ensure spec-tareas.md has small tasks, allowed paths, TDD steps and verification commands",
    "before frontend build, ensure /ux artifacts, prototype or wireframes, component system and Penpot Angular mapping exist or are explicitly not applicable",
    "use an isolated branch or worktree for code changes when possible",
    "leave TDD, test and review evidence for critical changes",
    "do not invent business rules",
    "declare assumptions and open questions",
    "apply the gate declared by the task packet",
    "do not replace human approval"
  ],
  "phases": [
    {
      "phase": "0",
      "name": "Iniciacion",
      "task": "ai/tasks/fase-0-iniciacion.task.md",
      "command": "/document + /plan",
      "gate": "gate-0-1"
    },
    {
      "phase": "1",
      "name": "Analisis y requerimientos",
      "task": "ai/tasks/fase-1-requerimientos.task.md",
      "command": "/document + /plan",
      "gate": "gate-0-1"
    },
    {
      "phase": "2",
      "name": "UX/UI",
      "task": "ai/tasks/fase-2-ux.task.md",
      "command": "/ux",
      "gate": "gate-ux-ready"
    },
    {
      "phase": "3",
      "name": "Arquitectura",
      "task": "ai/tasks/fase-3-arquitectura.task.md",
      "command": "/review",
      "gate": "gate-2-3"
    },
    {
      "phase": "4",
      "name": "Spec-Driven Development",
      "task": "ai/tasks/fase-4-sdd.task.md",
      "command": "/spec",
      "gate": "gate-4-6"
    },
    {
      "phase": "5",
      "name": "Construccion",
      "task": "ai/tasks/fase-5-construccion.task.md",
      "command": "/build",
      "gate": "gate-4-6"
    },
    {
      "phase": "6",
      "name": "QA",
      "task": "ai/tasks/fase-6-qa.task.md",
      "command": "/test",
      "gate": "gate-4-6"
    },
    {
      "phase": "7",
      "name": "Deploy",
      "task": "ai/tasks/fase-7-deploy.task.md",
      "command": "/ship",
      "gate": "gate-7-8"
    },
    {
      "phase": "8",
      "name": "Operacion",
      "task": "ai/tasks/fase-8-operacion.task.md",
      "command": "/review + /ship",
      "gate": "gate-7-8"
    }
  ]
}`],
    ["ai/tasks/README.md", `# AI task packets

[README principal](../README.md)

## Proposito
Estos task packets dejan a ${ctx.name} listo para ejecucion por un proveedor IA con acceso a archivos. Cada packet define rol, entradas, salidas, reglas, gate y evidencia.

## Regla transversal para delivery
Antes de Fase 5, la feature debe tener tareas pequenas y verificables. El ciclo esperado es:

\`\`\`text
/ux si aplica UX/frontend -> /prototype -> gate-spdd-approved -> /spec -> writing-plans -> /build + TDD -> /review -> /test -> /ship
\`\`\`

Referencia: [Flujo de delivery IA](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md).
Referencia frontend: [Product Design y SPDD Frontend](../../docs/transversal/90.34-product-design-y-spdd-frontend.md).

## Secuencia
- [Fase 0 - Iniciacion](fase-0-iniciacion.task.md)
- [Fase 1 - Requerimientos](fase-1-requerimientos.task.md)
- [Fase 2 - UX](fase-2-ux.task.md)
- [Fase 3 - Arquitectura](fase-3-arquitectura.task.md)
- [Fase 4 - SDD](fase-4-sdd.task.md)
- [Fase 5 - Construccion](fase-5-construccion.task.md)
- [Fase 6 - QA](fase-6-qa.task.md)
- [Fase 7 - Deploy](fase-7-deploy.task.md)
- [Fase 8 - Operacion](fase-8-operacion.task.md)
`],
    ["ai/tasks/fase-0-iniciacion.task.md", `# AI Task - Fase 0 - Iniciacion

## Rol
Actua como enterprise-documentation-orchestrator-agent.

## Objetivo
Completar o revisar la base inicial de ${ctx.name}: vision, roadmap, estimacion y roles.

## Lee primero
- [AGENTS.md](../../AGENTS.md)
- [docs/README.md](../../docs/README.md)
- [Vision del proyecto](../../docs/fase-0-iniciacion/00.01-vision-proyecto.md)

## Crea o actualiza
- docs/fase-0-iniciacion/00.01-vision-proyecto.md
- docs/fase-0-iniciacion/00.02-roadmap.md
- docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md
- docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md

## Reglas
- No inventes restricciones.
- Declara supuestos.
- Registra preguntas abiertas.
- Manten trazabilidad entrada -> artefactos.

## Gate
Aplica gate-documentation-ready y gate-0-1.

## Resultado esperado
Base inicial lista para requerimientos, UX y arquitectura.
`],
    ["ai/tasks/fase-1-requerimientos.task.md", `# AI Task - Fase 1 - Requerimientos

## Rol
Actua como enterprise-documentation-orchestrator-agent con foco en discovery.

## Objetivo
Convertir la vision de ${ctx.name} en RF, RNF, reglas, backlog inicial y preguntas abiertas.

## Lee primero
- [AGENTS.md](../../AGENTS.md)
- [Vision del proyecto](../../docs/fase-0-iniciacion/00.01-vision-proyecto.md)
- [Analisis y requerimientos](../../docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)

## Crea o actualiza
- docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md
- docs/transversal/90.11-checklist-entregables.md

## Reglas
- Cada requerimiento debe tener actor.
- Cada regla debe ser verificable.
- Si aparece una feature construible, deja referencia para fase 4.

## Gate
Aplica gate-documentation-ready y gate-0-1.

## Resultado esperado
Requerimientos listos para Fase 2 UX y Fase 3 Arquitectura.
`],
    ["ai/tasks/fase-2-ux.task.md", `# AI Task - Fase 2 UX - ${ctx.name}

## Rol
Actua como product-design-agent y ux-orchestrator-agent.

## Objetivo
Transformar RF, HU y specs iniciales en Product Design, SPDD inicial y prototipo UX navegable HTML5 o Penpot.

## Lee primero
- [AGENTS.md](../../AGENTS.md)
- [Analisis y requerimientos](../../docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [UX/UI](../../docs/fase-2-ux-ui/02.00-ux-ui.md)
- [Spec-Driven Product Design](../../docs/fase-2-ux-ui/02.09-spec-driven-product-design.md)
- [SPDD](../../docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md)
- [Checklist Product Design](../../docs/fase-2-ux-ui/02.11-checklist-product-design.md)
- [Checklist SPDD](../../docs/fase-2-ux-ui/02.12-checklist-spdd.md)
- [Spec funcional](../../specs/${ctx.feature}/spec-funcional.md)
- [Spec tecnica](../../specs/${ctx.feature}/spec-tecnica.md)

## Crea o actualiza
- docs/fase-2-ux-ui/02.01-flujos-usuario.md
- docs/fase-2-ux-ui/02.09-spec-driven-product-design.md
- docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md
- docs/fase-2-ux-ui/02.11-checklist-product-design.md
- docs/fase-2-ux-ui/02.12-checklist-spdd.md
- specs/${ctx.feature}/product-design.md
- specs/${ctx.feature}/spdd-frontend.md
- specs/${ctx.feature}/prototype.md
- specs/${ctx.feature}/prototype-validation.md
- specs/${ctx.feature}/ui-test-cases.md
- specs/${ctx.feature}/traceability.md
- specs/${ctx.feature}/prototype-html5/index.html si se requiere validacion rapida
- ai/prompts/generated/ux-${ctx.feature}.md
- ai/prompts/generated/prototype-html5-${ctx.feature}.md
- ai/prompts/generated/penpot-${ctx.feature}.md si se requiere formalizacion visual

## Reglas
- No inventes reglas funcionales.
- Si hay ambiguedad relevante, propone dos alternativas y recomienda una.
- Cada pantalla debe indicar actor y objetivo.
- Incluye estados loading, empty, error y unauthorized cuando aplique.
- Simula roles, permisos, validaciones, datos mock y feedback UX.
- Usa componentes reutilizables en Penpot si se formaliza visualmente.
- Manten trazabilidad RF/HU/spec -> Product Design -> SPDD -> prototipo.

## Gate
Aplica gate-ux-ready.
Si la feature es visual, aplica gate-prototype-ready cuando exista prototipo revisable.
Aplica gate-spdd-approved solo despues de validacion humana del prototipo.

## Resultado esperado
UX listo para validacion humana, prototipo HTML5/Penpot revisable y gates declarados.
`],
    ["ai/tasks/fase-3-arquitectura.task.md", `# AI Task - Fase 3 - Arquitectura

## Rol
Actua como architecture-agent.

## Objetivo
Revisar y completar arquitectura, decisiones tecnologicas, ADR y despliegue de ${ctx.name}.

## Lee primero
- [Analisis y requerimientos](../../docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [UX/UI](../../docs/fase-2-ux-ui/02.00-ux-ui.md)
- [Product Design](../../docs/fase-2-ux-ui/02.09-spec-driven-product-design.md)
- [SPDD Frontend](../../docs/transversal/90.34-product-design-y-spdd-frontend.md)
- [Arquitectura](../../docs/fase-3-arquitectura/03.00-arquitectura.md)
- [ADR-001](../../docs/fase-3-arquitectura/adr/ADR-001-stack-quarkus-angular-keycloak.md)
- [Principios SOLID y diseno modular](../../docs/transversal/90.30-principios-solid-diseno-modular.md)

## Crea o actualiza
- docs/fase-3-arquitectura/03.00-arquitectura.md
- docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md
- docs/fase-3-arquitectura/03.03-plan-despliegue.md
- docs/fase-3-arquitectura/adr/

## Reglas
- No cambiar tecnologia sin ADR.
- Declara riesgos y tradeoffs.
- Manten seguridad, despliegue y observabilidad visibles.
- Documenta capas, boundaries y dependencias con criterio SOLID: SRP por modulo, DIP en puertos y adaptadores, ISP en contratos de API.
- Si una excepcion a SOLID simplifica el MVP, documenta la razon en ADR o nota tecnica.

## Gate
Aplica gate-2-3.

## Resultado esperado
Arquitectura lista para specs y construccion.
`],
    ["ai/tasks/fase-4-sdd.task.md", `# AI Task - Fase 4 - SDD

## Rol
Actua como spec-writer-agent.

## Objetivo
Convertir RF/HU, UX y ADR en specs funcionales, tecnicas y tareas.

## Lee primero
- [Analisis y requerimientos](../../docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [UX/UI](../../docs/fase-2-ux-ui/02.00-ux-ui.md)
- [SPDD](../../docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md)
- [Arquitectura](../../docs/fase-3-arquitectura/03.00-arquitectura.md)
- [Principios SOLID y diseno modular](../../docs/transversal/90.30-principios-solid-diseno-modular.md)
- [Flujo delivery IA](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)
- [Spec funcional](../../specs/${ctx.feature}/spec-funcional.md)

## Crea o actualiza
- specs/${ctx.feature}/spec-funcional.md
- specs/${ctx.feature}/spec-tecnica.md
- specs/${ctx.feature}/api-contract.md
- specs/${ctx.feature}/spec-tareas.md
- specs/${ctx.feature}/ui-test-cases.md
- specs/${ctx.feature}/traceability.md

## Reglas
- Toda spec debe tener criterios de aceptacion.
- No cerrar SDD de feature visual sin gate-spdd-approved.
- Toda tarea debe trazarse a spec y tener ID estable.
- Toda tarea de codigo debe declarar rutas permitidas, ciclo TDD, comandos y evidencia.
- Toda tarea frontend debe enlazar UX/prototipo/mapping si aplica.
- Si la feature no puede dividirse en tareas pequenas, bloquea build y mejora \`spec-tareas.md\`.
- Si falta informacion, deja preguntas abiertas.

## Checklist de salida
- [ ] Spec funcional completa.
- [ ] Spec tecnica completa.
- [ ] Spec tareas lista para proveedor IA.
- [ ] Preguntas abiertas no bloqueantes.

## Gate
Aplica gate-4-6.

## Resultado esperado
Feature lista para build.
`],
    ["ai/tasks/fase-5-construccion.task.md", `# AI Task - Fase 5 - Construccion

## Rol
Actua como build-agent.

## Objetivo
Implementar specs aprobadas de ${ctx.name} en backend, frontend y pruebas unitarias.

## Lee primero
- [Spec funcional](../../specs/${ctx.feature}/spec-funcional.md)
- [Spec tecnica](../../specs/${ctx.feature}/spec-tecnica.md)
- [Spec tareas](../../specs/${ctx.feature}/spec-tareas.md)
- [Product Design](../../docs/fase-2-ux-ui/02.09-spec-driven-product-design.md)
- [SPDD Frontend](../../docs/transversal/90.34-product-design-y-spdd-frontend.md)
- [SPDD Frontend](../../docs/fase-5-construccion/05.01-spec-prototype-driven-development-frontend.md)
- [Arquitectura](../../docs/fase-3-arquitectura/03.00-arquitectura.md)
- [Principios SOLID y diseno modular](../../docs/transversal/90.30-principios-solid-diseno-modular.md)
- [Flujo delivery IA](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)

## Crea o actualiza
- backend/
- frontend/
- specs/${ctx.feature}/spec-tareas.md

## Reglas
- No implementar features sin spec.
- No cambiar arquitectura sin ADR.
- Trabaja en rama o worktree aislado si hay cambios de codigo.
- Ejecuta una tarea por vez desde \`spec-tareas.md\`.
- Aplica TDD red-green-refactor en cambios de comportamiento.
- Si la tarea es frontend, valida spec + prototipo + mapping antes de codigo.
- Pide review antes de QA si cambia contrato, seguridad, datos o UX critica.
- En review: verifica SRP (cada clase/componente tiene una razon de cambio), DIP (dominio no depende de infraestructura), ISP (contratos no obligan a metodos no usados). Si hay violacion relevante, abre nota tecnica o ADR antes de cerrar la tarea.

## Ejecucion esperada
1. Selecciona tarea pendiente.
2. Declara archivos a modificar.
3. Si es frontend, declara prototipo/mapping origen.
4. Escribe prueba red.
5. Implementa green.
6. Refactoriza.
7. Ejecuta comandos de verificacion.
8. Actualiza estado/evidencia de tarea.

## Gate
Aplica gate-4-6.

## Resultado esperado
Codigo trazado a specs y listo para QA.
`],
    ["ai/tasks/fase-6-qa.task.md", `# AI Task - Fase 6 - QA

## Rol
Actua como qa-agent.

## Objetivo
Validar ${ctx.name} contra specs, riesgos y criterios de aceptacion.

## Lee primero
- [Plan de pruebas](../../qa/fase-6-qa/plan-pruebas.md)
- [Spec funcional](../../specs/${ctx.feature}/spec-funcional.md)
- [Spec tecnica](../../specs/${ctx.feature}/spec-tecnica.md)
- [Spec tareas](../../specs/${ctx.feature}/spec-tareas.md)
- [Flujo delivery IA](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)

## Crea o actualiza
- qa/fase-6-qa/plan-pruebas.md
- qa/fase-6-qa/evidencias/
- qa/fase-6-qa/defectos.md

## Reglas
- No cerrar QA sin evidencia.
- Defectos deben tener severidad y estado.
- Registra cobertura contra criterios de aceptacion.
- Verifica evidencia TDD en tareas criticas.
- Verifica code review en cambios de contrato, seguridad, datos o UX critica.

## Gate
Aplica gate-4-6.

## Resultado esperado
Release candidato aprobado o bloqueado con observaciones.
`],
    ["ai/tasks/fase-7-deploy.task.md", `# AI Task - Fase 7 - Deploy

## Rol
Actua como release-agent.

## Objetivo
Preparar salida controlada de ${ctx.name} con runbook, rollback y monitoreo.

## Lee primero
- [Runbook](../../ops/fase-7-deploy/runbook.md)
- [Rollback](../../ops/fase-7-deploy/rollback.md)
- [Plan despliegue](../../docs/fase-3-arquitectura/03.03-plan-despliegue.md)
- [Plan QA](../../qa/fase-6-qa/plan-pruebas.md)
- [Flujo delivery IA](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)

## Crea o actualiza
- ops/fase-7-deploy/runbook.md
- ops/fase-7-deploy/rollback.md
- releases/

## Reglas
- No cerrar deploy sin rollback.
- No cerrar deploy sin monitoreo.
- Registra evidencia de smoke.
- No proponer PR/merge sin checks finales, resumen de cambios y riesgos residuales.
- Declara si el worktree/rama queda listo para limpiar, conservar o bloquear.

## Gate
Aplica gate-7-8.

## Resultado esperado
Release controlado o bloqueado con razones.
`],
    ["ai/tasks/fase-8-operacion.task.md", `# AI Task - Fase 8 - Operacion

## Rol
Actua como operations-agent.

## Objetivo
Operar ${ctx.name} con metricas, incidentes, continuidad y mejora continua.

## Lee primero
- [Operacion](../../ops/fase-8-operacion/operacion.md)
- [Metricas](../../ops/fase-8-operacion/metricas.md)
- [Runbook](../../ops/fase-7-deploy/runbook.md)
- [Rollback](../../ops/fase-7-deploy/rollback.md)

## Crea o actualiza
- ops/fase-8-operacion/operacion.md
- ops/fase-8-operacion/metricas.md
- ops/fase-8-operacion/postmortems/
- docs/fase-0-iniciacion/00.02-roadmap.md

## Reglas
- Incidentes relevantes requieren postmortem.
- Mejoras deben tener owner o siguiente paso.
- No ocultes riesgos operativos.

## Gate
Aplica gate-7-8.

## Resultado esperado
Operacion con seguimiento y backlog evolutivo trazable.
`],
    ["ai/agents/README.md", `# Agents

[README principal](../README.md)

## Agentes disponibles
- [Enterprise Documentation Orchestrator Agent](enterprise-documentation-orchestrator-agent.md)
- [Product Design Agent](product-design-agent.md)
- [UX Orchestrator Agent](ux-orchestrator-agent.md)
- [Architecture Agent](architecture-agent.md)
- [Spec Writer Agent](spec-writer-agent.md)
- [Build Agent](build-agent.md)
- [Frontend SPDD Agent](frontend-spdd-agent.md)
- [QA Agent](qa-agent.md)
- [Release Agent](release-agent.md)
- [Operations Agent](operations-agent.md)
`],
    ["ai/agents/enterprise-documentation-orchestrator-agent.md", `# Agent - Enterprise Documentation Orchestrator

## Mision
Guiar a ${ctx.name} desde ideas o requerimientos hasta artefactos canonicos trazables y validados.

## Usa
- /document
- /plan
- gate-documentation-ready

## Reglas
- No producir documentacion suelta.
- Toda salida termina en ruta canonica.
- Si falta informacion critica, declarar preguntas abiertas.
`],
    ["ai/agents/product-design-agent.md", `# Agent - Product Design

## Mision
Convertir RF, HU y reglas de ${ctx.name} en experiencia validable antes de construir.

## Usa
- /ux
- gate-ux-ready

## Reglas
- Identificar objetivo, actor y resultado por flujo.
- Proponer dos alternativas si hay ambiguedad relevante.
- No prototipar funcionalidad sin RF/HU/spec o pregunta abierta.
- Dejar trazabilidad RF/HU/spec -> Product Design -> SPDD -> prototipo.
`],
    ["ai/agents/ux-orchestrator-agent.md", `# Agent - UX Orchestrator

## Mision
Transformar RF, HU y specs en Product Design, SPDD inicial, estados UI y prototipo HTML5/Penpot validable.

## Usa
- /ux
- /prototype
- gate-ux-ready
- gate-prototype-ready

## Reglas
- No inventar reglas de negocio.
- Toda pantalla debe tener actor, objetivo y estados relevantes.
- Todo prototipo debe cubrir navegacion, roles, validaciones, datos mock y feedback UX.
- Todo prototipo Penpot debe usar componentes reutilizables si se formaliza visualmente.
- Mantener trazabilidad RF/HU/spec -> Product Design -> SPDD -> prototipo.
`],
    ["ai/agents/architecture-agent.md", `# Agent - Architecture

## Mision
Revisar arquitectura, decisiones tecnologicas, despliegue y ADR.

## Usa
- /review
- gate-2-3

## Reglas
- Toda decision tecnica relevante requiere ADR.
- Seguridad, observabilidad y deploy deben quedar visibles.
`],
    ["ai/agents/spec-writer-agent.md", `# Agent - Spec Writer

## Mision
Convertir RF/HU, UX y ADR en specs funcionales, tecnicas y tareas.

## Usa
- /spec
- gate-4-6

## Reglas
- Toda spec debe incluir criterios de aceptacion.
- Toda tarea debe estar trazada.
`],
    ["ai/agents/build-agent.md", `# Agent - Build

## Mision
Implementar specs aprobadas en backend, frontend y pruebas.

## Usa
- /build
- gate-4-6

## Reglas
- No implementar sin spec aprobada.
- No cambiar arquitectura sin ADR.
- Ejecutar una tarea por vez desde spec-tareas.md.
- Registrar evidencia TDD red-green-refactor.
`],
    ["ai/agents/frontend-spdd-agent.md", `# Agent - Frontend SPDD

## Mision
Construir frontend desde spec aprobada, prototipo validado y trazabilidad SPDD.

## Usa
- /build
- /review
- /test
- gate-frontend-spdd-ready

## Reglas
- No implementar UI sin origen en UX/spec.
- No crear componentes sin revisar prototipo validado y criterios UI.
- Registrar diferencias contra prototipo.
- Dejar pruebas o evidencia browser/manual.
`],
    ["ai/agents/qa-agent.md", `# Agent - QA

## Mision
Validar features con plan, evidencia, defectos y recomendacion de salida.

## Usa
- /test
- gate-4-6

## Reglas
- QA sin evidencia queda bloqueado.
- Defectos deben tener severidad y estado.
- Cambios criticos requieren code review.
`],
    ["ai/agents/release-agent.md", `# Agent - Release

## Mision
Preparar despliegue controlado con runbook, rollback, smoke y monitoreo.

## Usa
- /ship
- gate-7-8

## Reglas
- No deploy sin rollback.
- No deploy sin monitoreo.
- No cerrar branch sin checks finales y riesgos residuales.
`],
    ["ai/agents/operations-agent.md", `# Agent - Operations

## Mision
Mantener operacion, metricas, incidentes y backlog evolutivo.

## Usa
- /review
- /ship
- gate-7-8

## Reglas
- Incidentes relevantes requieren postmortem.
- Mejoras deben quedar trazadas.
`],
    ["ai/commands/README.md", `# Commands

[README principal](../README.md)

## Comandos IA
- /document: documentacion formal y trazable.
- /plan: planificacion inicial.
- /ux: RF/HU/specs hacia Product Design y SPDD inicial.
- /prototype: genera o actualiza prototipo HTML5/Penpot y evidencia de validacion.
- /review: arquitectura, ADR y revisiones.
- /spec: specs funcionales, tecnicas y tareas.
- /build: implementacion con worktree, TDD y trazabilidad.
- /test: QA, TDD y evidencia.
- /ship: cierre de branch/PR y release/deploy.

## Flujo de delivery IA
- /ux si aplica UX/frontend -> /prototype HTML5/Penpot -> gate-prototype-ready -> gate-spdd-approved -> /spec -> writing-plans -> /build + TDD -> /review -> /test -> /ship.

## Frontend
- /ux produce Product Design y SPDD inicial.
- /prototype produce prototipo HTML5/Penpot y evidencia revisable.
- /build usa SPDD Frontend cuando hay pantallas o componentes.
`],
    ["ai/commands/document-command.md", `# Command \`/document\`

## Objetivo
Guiar y producir documentacion formal del proyecto usando fases, plantillas, agents, prompts, skills, references, quality gates y rutas canonicas.

\`/document\` es la entrada recomendada cuando el usuario no sabe por donde empezar o cuando trae informacion en bruto. No reemplaza \`/plan\` ni \`/spec\`; los puede combinar segun la fase detectada.

## Fases donde aplica mejor
- \`0 - Iniciacion\`
- \`1 - Analisis y requerimientos\`
- \`2 - UX/UI\`
- \`3 - Arquitectura\`
- \`4 - Spec-Driven Development (SDD)\`
- transversalmente cuando se necesita ordenar informacion.

## Required inputs
- idea, requerimiento, necesidad o fuente escrita,
- fase conocida o inferida,
- artefactos existentes si aplica,
- ruta destino si se debe crear o actualizar un archivo.

## Process
1. Identificar la fase.
2. Detectar modo de trabajo: exploratorio o estructurado.
3. Revisar entregables minimos.
4. Hacer preguntas minimas.
5. Elegir plantilla o artefacto destino.
6. Crear o actualizar artefactos.
7. Validar con gate.
8. Registrar trazabilidad.
9. Recomendar siguiente paso.

## Diferencia critica con \`/ux\`
\`/document\` formaliza informacion que ya existe o se va aclarando: vision, requerimientos, decisiones, ADR, fases. Su salida son artefactos documentales canonicos.

\`/ux\` produce Product Design y SPDD: decide que experiencia necesita el usuario y la valida con prototipo. Su salida es algo mostrable antes de construir.

\`/document\` puede alimentar Fase 2, pero no puede reemplazar \`/ux\`. Si la necesidad implica experiencia visual, journeys, pantallas o prototipo, la entrada correcta es \`/ux\`.

## Intake como entrada, no como comando separado
Si el usuario ya tiene notas, ideas o necesidades en un archivo, usa \`/document\` con esa fuente:

\`\`\`text
/document --source intake/necesidades-iniciales.md
\`\`\`

No existe un \`/intake\` separado para evitar duplicar la entrada de idea inicial. El modo mas completo es \`/document\`, que soporta conversacion guiada y archivo fuente.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Es solo para entender | Entonces debe quedar como supuesto o pregunta abierta |
| Luego lo paso al documento | El valor esta en formalizar ahora |
| No se la fase | El agente debe inferirla y declararla |
| Es un intake plano | El intake es fuente; el resultado debe vivir en rutas canonicas |

## Red flags
- No hay archivo destino.
- No hay fase detectada.
- Hay decision tecnica sin ADR.
- Hay feature construible sin spec.
- Hay entregable incompleto sin pregunta abierta.
- Se crea documentacion fuera de ruta canonica.

## Verification evidence
- fase detectada,
- modo recomendado,
- archivos destino,
- contenido generado o propuesto,
- preguntas abiertas,
- gate aplicado,
- trazabilidad entrada -> artefacto.

## Artefactos relacionados
- \`../agents/enterprise-ai-framework-agent.md\`
- \`../skills/documentation-orchestration.skill.md\`
- \`../references/documentation-orchestration.md\`
- \`../quality-gates/gate-documentation-ready.md\`
- \`../prompts/generated/README.md\`
`],
    ["ai/commands/ux-command.md", `# Command \`/ux\`

## Objetivo
Generar o actualizar Fase 2 desde RF, HU, specs o documentacion inicial, aplicando Product Design y SPDD para tener algo validable y mostrable antes de construir.

## Fases donde aplica mejor
- \`2 - UX/UI\`
- transversalmente cuando cambian RF/HU/specs que impactan pantallas o prototipo.

## Required inputs
- RF, HU o specs existentes,
- contexto de actores,
- criterios UX/UI,
- feature objetivo.

## Process
1. Leer requerimientos, specs y arquitectura disponible.
2. Generar o actualizar Product Design: problema, objetivo, usuarios, journey, alcance, hipotesis y metricas.
3. Proponer dos alternativas si hay ambiguedad relevante.
4. Generar SPDD: flujo UX, pantallas, estados UI, validaciones visibles, permisos y criterios UI.
5. Preparar insumos para \`/prototype\` HTML5 o Penpot segun necesidad.
6. Registrar ruta del prototipo y estado de validacion.
7. Actualizar traceability por feature.
8. Validar \`gate-ux-ready\`; \`gate-prototype-ready\` y \`gate-spdd-approved\` se aplican con \`/prototype\` y validacion humana.

## Diferencia critica con \`/document\`
\`/ux\` produce Product Design y SPDD: decide que experiencia necesita el usuario y la valida con spec inicial y prototipo. Su salida es algo validable y mostrable antes de construir front/back.

\`/document\` formaliza informacion existente en artefactos canonicos. No produce prototipo, no valida experiencia y no reemplaza este comando.

Para features visuales, \`/ux\` siempre precede a \`/spec\`. Sin \`gate-spdd-approved\`, \`/spec\` no puede cerrar SDD ni iniciar construccion frontend.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El prototipo puede ser pantallas sueltas | Debe cubrir flujo, estados, roles, validaciones, navegacion y feedback |
| HTML5 ya es frontend productivo | HTML5 valida experiencia; construccion real empieza despues de SDD aprobado |
| Penpot es solo visual | Debe dejar trazabilidad con RF/HU/spec y validacion registrada |

## Red flags
- Pantallas sin actor u objetivo.
- Prototipo sin navegacion entre pantallas.
- Estados loading, empty, error o unauthorized ausentes.
- Cambios UX sin actualizar specs o preguntas abiertas.

## Verification evidence
- flujos actualizados,
- SPDD inicial,
- prototype.md actualizado,
- prototype-validation.md preparado o actualizado,
- prototipo HTML5/Penpot revisable,
- gate UX Ready aplicado,
- gate Prototype Ready aplicado cuando corresponde,
- gate SPDD Approved solo con validacion humana.

## Artefactos relacionados
- \`../skills/ux-flow-to-mock.skill.md\`
- \`../skills/spec-driven-product-design.skill.md\`
- \`../skills/html5-prototyping.skill.md\`
- \`../skills/penpot-ai-prototyping.skill.md\`
- \`../quality-gates/gate-ux-ready.md\`
- \`../quality-gates/gate-prototype-ready.md\`
- \`../quality-gates/gate-spdd-approved.md\`
`],
    ["ai/commands/spec-command.md", `# Command \`/spec\`

## Objetivo
Convertir requerimientos priorizados y SPDD aprobado en \`spec funcional\`, \`spec tecnica\`, contratos y tareas ejecutables.

## Fases donde aplica mejor
- \`4 - Spec-Driven Development (SDD)\`

## Required inputs
- RF, HU o slice priorizado,
- reglas de negocio,
- arquitectura y ADR aplicables,
- \`gate-spdd-approved\` si la feature toca experiencia visual,
- UX/prototipo/mapping si la feature toca frontend.

## Process
1. Validar que el alcance ya esta priorizado.
2. Si la feature es visual, validar que SPDD esta aprobado o bloqueado con observaciones aceptadas.
3. Escribir o cerrar \`spec funcional\`.
4. Derivar \`spec tecnica\`.
5. Crear o actualizar \`api-contract.md\` cuando haya backend afectado por UX.
6. Crear \`spec de tareas\` con tareas pequenas, rutas permitidas, TDD, comandos y evidencia.
7. Si hay frontend, vincular cada tarea visible a SPDD/prototipo/mapping.
8. Verificar trazabilidad a RF/HU, riesgos y pruebas.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| La tecnica la resolvemos sobre la marcha | No se construye sin \`spec tecnica\` minima |
| La tarea es obvia | Debe quedar particionada y trazable |

## Red flags
- No hay HU o requerimiento origen.
- Faltan reglas de negocio o restricciones.
- La feature cambia arquitectura y no dispara ADR.
- La feature visual no tiene \`gate-spdd-approved\`.
- La feature frontend ignora prototipo o mapping existente.

## Verification evidence
- \`spec funcional\` creada o actualizada,
- \`spec tecnica\` creada o actualizada,
- \`api-contract.md\` creado o actualizado si aplica,
- \`spec de tareas\` creada o actualizada,
- trazabilidad explicita a origen y pruebas.

## Artefactos relacionados
- \`../prompts/generar-spec-funcional.md\`
- \`../prompts/generar-spec-tecnica.md\`
- \`../skills/spec-writer.skill.md\`
- \`../skills/writing-plans.skill.md\`
- \`../quality-gates/gate-4-6.md\`
`],
    ["ai/commands/review-command.md", `# Command \`/review\`

## Objetivo
Revisar consistencia, riesgo, calidad o salud de un artefacto, cambio o fase.

## Fases donde aplica mejor
- \`1 - Analisis\`
- \`2 - UX/UI\`
- \`3 - Arquitectura\`
- \`5 - Construccion\`
- \`6 - QA\`
- \`8 - Operacion\`

## Required inputs
- artefacto o cambio a revisar,
- contexto minimo del dominio,
- criterio de revision esperado.

## Process
1. Identificar la pregunta de revision.
2. Cargar referencias minimas necesarias.
3. Buscar inconsistencias, riesgos y huecos.
4. Si revisas Fase 2 o frontend, comparar RF/HU/spec -> UX -> prototipo -> codigo.
5. Emitir hallazgos y evidencia.
6. Proponer siguiente paso.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Se entiende por contexto | Si no queda visible, es un hueco real |
| No hace falta revisar porque nadie toco mucho | Poco cambio tambien puede romper contratos o gates |

## Red flags
- No hay criterio explicito de revision.
- Se opina sin evidencia.
- La revision mezcla hallazgos con cambios no pedidos.

## Verification evidence
- hallazgos priorizados,
- referencias o rutas concretas,
- riesgos residuales o supuestos.

## Artefactos relacionados
- \`../skills/requirements-quality.skill.md\`
- \`../skills/requesting-code-review.skill.md\`
- \`../skills/spec-driven-product-design.skill.md\`
- \`../skills/spec-prototype-driven-frontend.skill.md\`
- \`../skills/operations-review.skill.md\`
- \`../skills/security-hardening.skill.md\`
- \`../skills/performance-optimization.skill.md\`
`],
    ["ai/commands/test-command.md", `# Command \`/test\`

## Objetivo
Validar calidad con evidencia antes de aprobar una feature o release.

## Fases donde aplica mejor
- \`6 - QA\`

## Required inputs
- specs o criterios de aceptacion,
- riesgos conocidos,
- componentes afectados.

## Process
1. Derivar escenarios criticos desde specs y riesgos.
2. Verificar que las tareas criticas dejaron evidencia TDD o justificacion.
3. Elegir tipos de prueba necesarios.
4. Si es frontend, comparar UX/prototipo/mapping contra implementacion.
5. Ejecutar pruebas y recolectar evidencia.
6. Registrar defectos y bloqueantes.
7. Comparar contra el gate correspondiente.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Paso QA porque el flujo feliz funciona | Hace falta evidencia y cobertura por riesgo |
| No hace falta e2e porque ya compila | Compilar no valida integracion ni UX |

## Red flags
- No hay evidencia verificable.
- Frontend sin evidencia de estados UX o consistencia con prototipo.
- Los riesgos no se reflejan en la estrategia de pruebas.
- No existe criterio de salida.

## Verification evidence
- pruebas ejecutadas,
- resultado y cobertura basica,
- defectos abiertos o aceptados,
- evidencia enlazada a la feature o release.

## Artefactos relacionados
- \`../skills/qa.skill.md\`
- \`../skills/test-driven-development.skill.md\`
- \`../skills/browser-testing.skill.md\`
- \`../skills/spec-prototype-driven-frontend.skill.md\`
- \`../quality-gates/gate-frontend-spdd-ready.md\`
- \`../quality-gates/gate-4-6.md\`
`],
    ["ai/commands/build-command.md", `# Command \`/build\`

## Objetivo
Implementar el slice minimo trazable desde specs hasta codigo y pruebas.

Cuando el slice es frontend, aplicar Spec + Prototype Driven Development: la implementacion debe partir de spec aprobada, prototipo validado, criterios UI y trazabilidad SPDD.

En la metodologia actual, SPDD debe estar aprobado antes de \`/build\`; este comando consume \`gate-spdd-approved\`, no lo reemplaza.

## Fases donde aplica mejor
- \`5 - Construccion\`

## Required inputs
- \`spec funcional\`,
- \`spec tecnica\`,
- tareas de implementacion,
- \`gate-spdd-approved\` si la feature es visual,
- UX/prototipo y mapping cuando la feature toca frontend,
- stack o modulo afectado.

## Process
1. Validar specs y contratos.
2. Si es frontend, validar consistencia spec + prototipo + mapping.
3. Preparar worktree o rama dedicada cuando se modifique codigo.
4. Seleccionar una tarea pequena de \`spec-tareas.md\`.
5. Ejecutar ciclo TDD: red, green y refactor.
6. Ejecutar build/test minimo del stack.
7. Actualizar trazabilidad y estado de la tarea.
8. Pedir \`/review\` antes de seguir si cambia contrato, seguridad, datos, accesibilidad o UX critica.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Agrego tests despues | No se acepta sin prueba minima |
| El contrato se entiende | Debe quedar explicito en specs o contratos |

## Red flags
- No hay \`spec tecnica\`.
- Frontend sin prototipo, wireframe o mapping cuando aplica.
- No hay criterio de aceptacion.
- Se cambia contrato sin ADR o sin actualizar la spec.

## Verification evidence
- comando de build/test ejecutado,
- resultado de build/test,
- archivos modificados,
- trazabilidad feature -> codigo -> test.

## Artefactos relacionados
- \`../skills/backend.skill.md\`
- \`../skills/frontend.skill.md\`
- \`../skills/spec-prototype-driven-frontend.skill.md\`
- \`../skills/source-driven-development.skill.md\`
- \`../skills/using-git-worktrees.skill.md\`
- \`../skills/executing-plans.skill.md\`
- \`../skills/test-driven-development.skill.md\`
- \`../skills/debugging-workflow.skill.md\`
- \`../quality-gates/gate-frontend-spdd-ready.md\`
`],
    ["ai/commands/ship-command.md", `# Command \`/ship\`

## Objetivo
Liberar cambios con readiness real, gates, rollback y monitoreo.

## Fases donde aplica mejor
- \`7 - Deploy\`

## Required inputs
- resultados QA,
- componentes afectados,
- estrategia de despliegue,
- runbook y rollback.

## Process
1. Verificar gate de salida.
2. Confirmar que la branch o worktree de desarrollo esta cerrable.
3. Revisar pipeline, rollback y accesos.
4. Confirmar smoke checks y monitoreo.
5. Preparar PR/merge o release con resumen de cambios y riesgos.
6. Liberar con estrategia segura.
7. Registrar evidencia y seguimiento post-release.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Si falla, hacemos rollback manual luego | El rollback debe estar definido antes de liberar |
| El monitoreo ya lo vemos en produccion | No se libera sin senales objetivas preparadas |

## Red flags
- No existe rollback real.
- Falta monitoreo o smoke check.
- Hay bloqueantes QA sin resolver ni aceptar.

## Verification evidence
- gate de release cumplido,
- smoke checks pre y post deploy,
- rollback y responsables visibles,
- release trazada a artefactos oficiales.

## Artefactos relacionados
- \`../prompts/preparar-release.md\`
- \`../skills/release-readiness.skill.md\`
- \`../skills/shipping-and-launch.skill.md\`
- \`../skills/finishing-development-branch.skill.md\`
- \`../quality-gates/gate-7-8.md\`
`],
    ["ai/commands/plan-command.md", `# Command \`/plan\`

## Objetivo
Estructurar el trabajo antes de ejecutar cambios, discovery o decisiones.

## Fases donde aplica mejor
- \`0 - Iniciacion\`
- \`1 - Analisis\`
- \`2 - UX/UI\`
- \`3 - Arquitectura\`

## Required inputs
- vision, idea o requerimientos disponibles,
- restricciones visibles,
- fase o objetivo esperado.

## Process
1. Identificar la fase y la intencion real.
2. Separar problema, alcance, riesgos y huecos.
3. Si hay ambiguedad, explorar dos alternativas y comparar trade-offs.
4. Elegir artefactos de salida oficiales.
5. Proponer el siguiente paso ejecutable mas pequeno.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Ya lo iremos entendiendo al construir | No se avanza sin una salida minima de fase |
| La idea esta clara en la reunion | Debe quedar estructurada en rutas oficiales |

## Red flags
- No hay problema ni objetivo separados.
- No existe ruta de salida definida.
- El plan intenta decidir tecnologia sin contexto suficiente.

## Verification evidence
- artefacto de salida declarado,
- supuestos y preguntas abiertas visibles,
- siguiente paso concreto recomendado.

## Artefactos relacionados
- \`../prompts/transformar-idea-a-documentacion-inicial.md\`
- \`../prompts/refinar-requerimientos.md\`
- \`../skills/using-project-skills.skill.md\`
- \`../skills/brainstorming.skill.md\`
- \`../skills/idea-refine.skill.md\`
`],
    ["ai/skills/README.md", `# Skills

[README principal](../README.md)

## Skills principales
- [Documentation Orchestration](documentation-orchestration.skill.md)
- [Requirements to UX](requirements-to-ux.skill.md)
- [Spec-Driven Product Design](spec-driven-product-design.skill.md)
- [HTML5 Prototyping](html5-prototyping.skill.md)
- [Penpot AI Prototyping](penpot-ai-prototyping.skill.md)
- [Spec Writing](spec-writing.skill.md)
- [Spec + Prototype Driven Frontend](spec-prototype-driven-frontend.skill.md)
- [Writing Plans](writing-plans.skill.md)
- [Using Git Worktrees](using-git-worktrees.skill.md)
- [Executing Plans](executing-plans.skill.md)
- [Test Driven Development](test-driven-development.skill.md)
- [Requesting Code Review](requesting-code-review.skill.md)
- [Finishing Development Branch](finishing-development-branch.skill.md)
- [Release Readiness](release-readiness.skill.md)
`],
    ["ai/skills/documentation-orchestration.skill.md", `# Skill - Documentation Orchestration

## Objetivo
Convertir entradas informales en artefactos canonicos con fase, gate y trazabilidad.

## Red flags
- Documento sin ruta canonica.
- Requerimiento sin actor.
- Decision sin ADR.
`],
    ["ai/skills/requirements-to-ux.skill.md", `# Skill - Requirements to UX

## Objetivo
Transformar RF, HU y specs en flujos de usuario y estados de pantalla.

## Red flags
- Pantalla sin actor.
- Flujo sin criterio de salida.
- UX sin trazabilidad a RF.
`],
    ["ai/skills/spec-driven-product-design.skill.md", `# Skill - Spec-Driven Product Design

## Objetivo
Transformar RF, HU y notas de negocio de ${ctx.name} en experiencia validable antes de construir.

## Red flags
- Pantalla sin actor.
- Journey sin resultado esperado.
- Prototipo con funcionalidad no documentada.
- Estados loading, empty, error o unauthorized ausentes.
`],
["ai/skills/html5-prototyping.skill.md", `# Skill - HTML5 Prototyping

## Objetivo
Generar prototipos HTML5 navegables desde Product Design y SPDD para validar UX rapidamente antes de construir frontend real.

## Red flags
- Prototipo sin navegacion entre pantallas.
- Estados loading, empty, error, success o permission denied ausentes.
- Formulario sin validaciones visibles.
- HTML5 tratado como frontend productivo.
`],
["ai/skills/penpot-ai-prototyping.skill.md", `# Skill - Penpot AI Prototyping

## Objetivo
Convertir Product Design y SPDD en instrucciones, prompts o cambios directos en Penpot para formalizar prototipos visuales.

## Red flags
- Prompt Penpot tratado como prototipo aprobado.
- Prototipo sin link/export/evidencia.
- IA modificando Penpot sin revision humana.
- Componentes sin variantes ni estados UI.
`],
["ai/skills/spec-prototype-driven-frontend.skill.md", `# Skill - Spec + Prototype Driven Frontend

## Objetivo
Implementar frontend desde spec aprobada, prototipo validado y trazabilidad SPDD.

## Red flags
- Componente nuevo sin origen en prototipo validado o spec.
- Estado del prototipo ausente en codigo.
- Tarea cerrada sin prueba o evidencia.
`],
    ["ai/skills/spec-writing.skill.md", `# Skill - Spec Writing

## Objetivo
Crear specs funcionales, tecnicas y tareas trazables.

## Red flags
- Criterios de aceptacion ausentes.
- Tareas sin trazabilidad.
`],
    ["ai/skills/writing-plans.skill.md", `# Skill - Writing Plans

## Objetivo
Convertir specs en tareas pequenas, concretas y verificables para proveedor IA.

## Red flags
- Tarea generica sin archivos permitidos.
- Tarea sin ciclo TDD.
- Tarea sin comando de verificacion.
`],
    ["ai/skills/using-git-worktrees.skill.md", `# Skill - Using Git Worktrees

## Objetivo
Ejecutar cambios de codigo en rama o worktree aislado.

## Red flags
- Cambios directos en main.
- Rama sin referencia a la feature.
- Cambios mezclados de varias features.
`],
    ["ai/skills/executing-plans.skill.md", `# Skill - Executing Plans

## Objetivo
Ejecutar una tarea por vez, actualizar estado y dejar evidencia.

## Red flags
- Varias tareas mezcladas.
- Cambios fuera de rutas permitidas.
- Estado de tareas sin actualizar.
`],
    ["ai/skills/test-driven-development.skill.md", `# Skill - Test Driven Development

## Objetivo
Aplicar red-green-refactor en cambios de comportamiento.

## Red flags
- No se vio prueba fallar antes.
- La prueba no se traza a criterio de aceptacion.
- Se implementa demasiado antes del test.
`],
    ["ai/skills/requesting-code-review.skill.md", `# Skill - Requesting Code Review

## Objetivo
Revisar cambios entre tareas criticas y antes de QA.

## Red flags
- Diff sin spec asociada.
- Tests omitidos.
- Cambios de contrato o seguridad sin revision.
`],
    ["ai/skills/finishing-development-branch.skill.md", `# Skill - Finishing Development Branch

## Objetivo
Cerrar rama o worktree con checks finales, resumen, evidencia y limpieza.

## Red flags
- Rama con tareas abiertas.
- PR sin riesgos residuales.
- Worktree eliminado antes de integrar o descartar.
`],
    ["ai/skills/release-readiness.skill.md", `# Skill - Release Readiness

## Objetivo
Verificar que deploy, rollback, monitoreo y QA esten listos.

## Red flags
- Deploy sin rollback.
- Smoke test ausente.
`],
    ["ai/skills/security-hardening.skill.md", `# Skill Security Hardening

## Objetivo
Endurecer cambios o artefactos con controles minimos de seguridad antes de liberar u operar.

## Aplicala cuando
- el cambio toca autenticacion, autorizacion, secretos, datos o despliegue,
- aparece una dependencia o integracion sensible,
- se prepara una revision previa a release.

## No la apliques cuando
- la solicitud no tiene superficie de riesgo relevante,
- aun faltan decisiones basicas de producto o arquitectura.

## Entradas minimas
- cambio o artefacto a revisar,
- riesgos visibles,
- contexto de datos, IAM o infraestructura.

## Flujo recomendado
1. Identifica superficie de riesgo.
2. Revisa controles minimos aplicables.
3. Senala gaps y mitigaciones.
4. Verifica trazabilidad a arquitectura, ADR o runbook.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Eso lo vemos en pentest | El baseline debe quedar antes de liberar |
| El proveedor ya lo resuelve | Igual hay que declarar la responsabilidad local |

## Red flags
- Secretos o IAM tratados como detalle menor.
- No hay auditoria o trazabilidad de seguridad.
- Cambio sensible sin owner ni mitigacion.

## Verification evidence
- controles revisados,
- riesgos y mitigaciones visibles,
- artefactos actualizados en fase 3, QA o ops si aplica.

## Referencias
- \`../references/security-and-risk.md\`
- \`../references/quality-release-and-operations.md\`
`],
    ["ai/skills/backend.skill.md", `# Skill Backend

## Objetivo
Mantener una forma consistente de implementar backend a partir de una \`spec tecnica\`.

## Aplicala cuando
- una feature ya tiene contratos y reglas claras,
- hay que aterrizar dominio, aplicacion o infraestructura,
- se quiere revisar consistencia tecnica antes de codificar.

## No la apliques cuando
- aun no existe \`spec funcional\` o reglas claras,
- el cambio es principalmente de UX o discovery y no de backend.

## Entradas minimas
- \`spec tecnica\`,
- arquitectura aplicable,
- estrategia de pruebas.

## Criterios que debe reforzar
- respeto por contratos y errores,
- reglas de negocio explicitadas,
- SOLID aplicado sin sobrearquitectura,
- pruebas tecnicas alineadas al riesgo.

## Flujo recomendado
1. Lee la \`spec funcional\` y la \`spec tecnica\`.
2. Deriva contratos, datos, errores y seguridad.
3. Define componentes backend y pruebas relevantes.
4. Verifica impacto en integraciones, observabilidad y auditoria.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Agrego tests despues | No se acepta sin prueba minima |
| El contrato se entiende | Debe estar explicito en specs o contracts |
| El cambio es interno, no impacta afuera | Igual debe revisarse trazabilidad y riesgo |

## Red flags
- No hay \`spec tecnica\`.
- No hay criterio de aceptacion o prueba asociada.
- Se cambia contrato o error handling sin actualizar trazabilidad.
- Controladores, casos de uso, dominio e infraestructura quedan mezclados sin boundary claro.
- El cambio toca seguridad o auditoria y no se refleja en fase 3, QA u ops.

## Verification evidence
- comando de build o test ejecutado,
- resultado de build o test,
- archivos modificados,
- evidencia de responsabilidades y dependencias revisadas contra SOLID,
- trazabilidad feature -> codigo -> test.

## Salidas tipicas
- componentes backend,
- pruebas unitarias e integracion,
- actualizaciones menores en specs si cambia el detalle tecnico.

## Referencias
- \`../references/documentation-and-traceability.md\`
- \`../references/security-and-risk.md\`
- \`../references/quality-release-and-operations.md\`
- \`../../docs/transversal/90.30-principios-solid-diseno-modular.md\`
`],
    ["ai/skills/frontend.skill.md", `# Skill Frontend

## Objetivo
Mantener una forma consistente de bajar UX y specs a modulos frontend claros y verificables.

## Aplicala cuando
- una pantalla o flujo ya fue priorizado,
- existe una definicion UX suficientemente clara,
- se necesita revisar estados, mensajes y navegacion.

## No la apliques cuando
- el flujo UX aun no esta claro,
- el trabajo principal es de arquitectura o backend.

## Entradas minimas
- UX/UI,
- \`spec funcional\`,
- contratos o \`spec tecnica\`.

## Criterios que debe reforzar
- coherencia con UX,
- estados de carga, vacio y error,
- separacion SOLID entre UI, estado, servicios y adaptadores,
- trazabilidad con criterios de aceptacion.

## Flujo recomendado
1. Revisa UX, \`spec funcional\` y \`spec tecnica\`.
2. Separa rutas, componentes, estados y mensajes.
3. Define impacto en datos mock o contratos.
4. Verifica pruebas UI, accesibilidad y e2e.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El happy path ya funciona | Faltan vacios, errores y validaciones |
| A11y la vemos luego | Los flujos criticos salen con baseline accesible |
| No hace falta e2e porque compila | Compilar no valida UX real ni integracion |

## Red flags
- No hay journey o pantalla base clara.
- Faltan estados de carga, vacio o error.
- No existe prueba visible del flujo critico.
- Componentes, stores y servicios mezclan responsabilidades sin boundary claro.
- La UI contradice criterios de aceptacion o contratos.

## Verification evidence
- pruebas frontend o e2e ejecutadas,
- resultado de build o test,
- archivos modificados,
- evidencia de responsabilidades y dependencias revisadas contra SOLID,
- trazabilidad feature -> UX -> codigo -> test.

## Salidas tipicas
- modulos UI,
- validaciones y mensajes,
- pruebas frontend y e2e.

## Referencias
- \`../references/ux-accessibility-and-mocks.md\`
- \`../references/documentation-and-traceability.md\`
- \`../../docs/transversal/90.30-principios-solid-diseno-modular.md\`
`],
    ["ai/skills/browser-testing.skill.md", `# Skill Browser Testing

## Objetivo
Validar comportamiento navegador a navegador, e2e, a11y y estados visibles con evidencia reproducible.

## Aplicala cuando
- una feature toca flujos visibles al usuario,
- hace falta validar UX real, e2e o accesibilidad,
- se prepara QA o release de frontend.

## No la apliques cuando
- el cambio es puramente backend sin superficie visible,
- no existe un flujo o ambiente navegable minimo.

## Entradas minimas
- flujo UX o feature,
- criterios de aceptacion,
- ambiente o mock navegable.

## Flujo recomendado
1. Identifica escenarios criticos visibles.
2. Ejecuta pruebas e2e y, si aplica, a11y.
3. Verifica happy path, errores, vacios y confirmaciones.
4. Registra evidencia y defectos.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Si paso unit tests, no hace falta navegador | UI real y e2e validan otra capa de riesgo |
| A11y la vemos despues | Flujos criticos deben nacer con baseline accesible |

## Red flags
- No hay prueba del flujo visible.
- No se revisaron errores o estados vacios.
- La accesibilidad se omite en flujos criticos.

## Verification evidence
- pruebas e2e ejecutadas,
- evidencias de navegador o reportes,
- defectos visibles registrados.

## Referencias
- \`../references/ux-accessibility-and-mocks.md\`
- \`../references/quality-release-and-operations.md\`
`],
    ["ai/skills/source-driven-development.skill.md", `# Skill Source-Driven Development

## Objetivo
Mantener la implementacion alineada al codigo, contratos y pruebas reales, evitando deriva entre spec y source.

## Aplicala cuando
- una feature ya esta en construccion,
- el codigo existente impone limites o integraciones reales,
- hace falta ajustar specs segun lo aprendido del source.

## No la apliques cuando
- todavia no existen specs minimas,
- el trabajo sigue siendo discovery de alto nivel.

## Entradas minimas
- specs de la feature,
- codigo afectado,
- pruebas actuales.

## Flujo recomendado
1. Lee specs y source real.
2. Detecta donde el source contradice o matiza la spec.
3. Ajusta implementacion o trazabilidad sin ocultar el desvio.
4. Actualiza pruebas y documentacion derivada.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El source manda, luego vemos la spec | Si cambia el comportamiento, la spec debe actualizarse |
| Nadie usa esa ruta | Si existe en el source, hay que validar su impacto |

## Red flags
- El codigo ya no refleja la spec.
- Se cambiaron contratos sin actualizar pruebas.
- Se parchea comportamiento sin trazabilidad.

## Verification evidence
- archivos de codigo revisados,
- archivos de prueba ajustados,
- spec o trazabilidad actualizada si hacia falta.

## Referencias
- \`../references/documentation-and-traceability.md\`
`],
    ["ai/skills/performance-optimization.skill.md", `# Skill Performance Optimization

## Objetivo
Identificar y priorizar mejoras de performance con evidencia y trade-offs claros.

## Aplicala cuando
- existe una degradacion visible o una meta de rendimiento,
- QA o operacion muestran latencia, carga o costo anomalo,
- un cambio puede impactar SLI/SLO.

## No la apliques cuando
- no existe ninguna senal o metrica base,
- la necesidad real es funcional y no de performance.

## Entradas minimas
- sintoma o objetivo de performance,
- metricas o evidencia actual,
- componente o flujo afectado.

## Flujo recomendado
1. Definir metrica objetivo.
2. Medir baseline actual.
3. Identificar cuello de botella probable.
4. Proponer mejora con trade-off explicito.
5. Verificar impacto despues del cambio.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Se siente lento | Hace falta baseline medible |
| Optimizamos todo de una vez | Se prioriza el mayor cuello de botella primero |

## Red flags
- No hay metrica base.
- Se confunde performance con percepcion sin evidencia.
- La mejora propuesta no indica costo o trade-off.

## Verification evidence
- baseline medido,
- cambio propuesto o aplicado,
- resultado comparativo,
- impacto esperado en SLI/SLO o costo.

## Referencias
- \`../references/quality-release-and-operations.md\`
- \`../references/security-and-risk.md\`
`],
    ["ai/skills/debugging-workflow.skill.md", `# Skill Debugging Workflow

## Objetivo
Investigar fallos de forma disciplinada, reproduciendo sintomas y reduciendo el espacio de causa probable.

## Aplicala cuando
- hay un bug reproducible o intermitente,
- falla una prueba, un build o un flujo,
- hace falta proponer una hipotesis tecnica con evidencia.

## No la apliques cuando
- la solicitud real es discovery o documentacion funcional,
- no existe ningun sintoma observable todavia.

## Entradas minimas
- sintoma o error,
- contexto de reproduccion,
- logs, pruebas o pasos disponibles.

## Flujo recomendado
1. Reproducir el fallo.
2. Reducir el caso al minimo.
3. Formular hipotesis.
4. Validar o descartar hipotesis con evidencia.
5. Aplicar fix minimo y volver a probar.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Seguro es flaky | Primero hay que intentar reproducir o aislar el patron |
| Meto un parche defensivo | Sin causa probable validada, el riesgo sigue abierto |

## Red flags
- No hay reproduccion del fallo.
- Se cambia demasiado codigo de una vez.
- El fix no agrega o ajusta pruebas.

## Verification evidence
- pasos de reproduccion,
- prueba o log que falla,
- prueba o evidencia que pasa tras el fix,
- archivos modificados y alcance del cambio.

## Referencias
- \`../references/documentation-and-traceability.md\`
- \`../references/quality-release-and-operations.md\`
`],
    ["ai/references/README.md", `# References

[README principal](../README.md)

## Referencias disponibles
- [Feature Delivery Workflow](feature-delivery-workflow.md)
- [Product Design Workflow](product-design-workflow.md)
- [Frontend SPDD Workflow](frontend-spdd-workflow.md)
`],
    ["ai/references/feature-delivery-workflow.md", `# Reference - Feature Delivery Workflow

## Objetivo
Dar a proveedores IA un flujo operativo para entregar features de ${ctx.name} sin saltarse specs, TDD, review, QA ni cierre de rama.

## Flujo
\`\`\`text
brainstorming -> Product Design -> SPDD -> prototype -> SDD -> writing-plans -> worktree -> executing-plans -> TDD -> review -> QA -> finish branch
\`\`\`

## Evidencia minima
- dos alternativas si hubo ambiguedad,
- tareas pequenas con rutas permitidas,
- prueba red y green o justificacion,
- review en cambios criticos,
- QA y riesgos residuales,
- estado de branch/worktree.
`],
    ["ai/references/product-design-workflow.md", `# Reference - Product Design Workflow

## Objetivo
Guiar Fase 2 de ${ctx.name} desde RF/HU hasta Product Design, SPDD y prototipo HTML5/Penpot validable.

## Flujo
\`\`\`text
RF/HU -> /ux -> Product Design -> SPDD inicial -> /prototype -> gate-prototype-ready -> validacion humana -> gate-spdd-approved
\`\`\`

## Evidencia minima
- objetivo y actor,
- estados UX,
- prototype.md,
- prototype-validation.md,
- prototipo HTML5 o link/export Penpot,
- roles, validaciones, navegacion y feedback,
- preguntas abiertas.
`],
    ["ai/references/frontend-spdd-workflow.md", `# Reference - Frontend SPDD Workflow

## Objetivo
Guiar la construccion frontend de ${ctx.name} desde spec + prototipo con TDD y evidencia.

## Flujo
\`\`\`text
UX/prototipo + specs -> tarea -> TDD -> implementacion -> test/browser evidence -> review
\`\`\`

## Evidencia minima
- tarea con ID,
- prototipo validado origen,
- componente Angular esperado,
- prueba red/green o justificacion,
- comandos ejecutados,
- diferencias contra prototipo.
`],
    ["ai/quality-gates/README.md", `# Quality gates

[README principal](../README.md)

## Gates
- [Gate Documentation Ready](gate-documentation-ready.md)
- [Gate 0-1](gate-0-1.md)
- [Gate UX Ready](gate-ux-ready.md)
- [Gate Prototype Ready](gate-prototype-ready.md)
- [Gate SPDD Approved](gate-spdd-approved.md)
- [Gate 2-3](gate-2-3.md)
- [Gate Frontend SPDD Ready](gate-frontend-spdd-ready.md)
- [Gate 4-6](gate-4-6.md)
- [Gate 7-8](gate-7-8.md)
`],
    ["ai/quality-gates/gate-documentation-ready.md", `# Gate Documentation Ready

## Evidencia minima
- fase asociada.
- ruta canonica.
- objetivo claro.
- entradas usadas.
- supuestos y preguntas abiertas.
- trazabilidad.
- siguiente paso.
`],
    ["ai/quality-gates/gate-0-1.md", `# Gate 0-1

## Evidencia minima
- vision.
- alcance y no alcance.
- roles.
- RF/RNF iniciales.
- preguntas abiertas.
`],
    ["ai/quality-gates/gate-ux-ready.md", `# Gate UX Ready

## Evidencia minima
- objetivo de producto y actor.
- flujos por actor.
- estados loading, empty, error y unauthorized.
- criterios UX/UI iniciales.
- Product Design y SPDD inicial.
- trazabilidad RF/HU/spec -> Product Design -> SPDD.
`],
["ai/quality-gates/gate-prototype-ready.md", `# Gate Prototype Ready

## Evidencia minima
- prototipo HTML5 o Penpot revisable.
- navegacion entre pantallas principales.
- estados loading, empty, error, success y permission denied cuando apliquen.
- validaciones visibles.
- roles/permisos simulados.
- datos mock.
- feedback UX: toast, modal, confirmacion o progreso segun flujo.
- prototype.md actualizado.
- prototype-validation.md preparado.
`],
    ["ai/quality-gates/gate-spdd-approved.md", `# Gate SPDD Approved

## Evidencia minima
- spec funcional inicial.
- flujo UX.
- prototipo HTML5/Penpot validado humanamente.
- validacion de prototipo registrada.
- estados UI.
- componentes principales.
- validaciones visibles.
- criterios de aceptacion UI.
- permisos visibles.
- observaciones resueltas o aceptadas.
- trazabilidad Product Design -> SPDD -> SDD.
`],
    ["ai/quality-gates/gate-frontend-spdd-ready.md", `# Gate Frontend SPDD Ready

## Evidencia minima
- UX/prototipo o wireframe usado.
- prototipo validado y criterios UI revisados.
- spec funcional, tecnica y tareas usadas.
- componentes reutilizables respetados.
- TDD o evidencia equivalente.
- comandos frontend ejecutados.
- diferencias contra prototipo registradas.
`],
    ["ai/quality-gates/gate-2-3.md", `# Gate 2-3

## Evidencia minima
- arquitectura.
- decisiones tecnologicas.
- ADR.
- plan de despliegue.
- riesgos.
`],
    ["ai/quality-gates/gate-4-6.md", `# Gate 4-6

## Evidencia minima
- specs funcionales.
- specs tecnicas.
- tareas pequenas y verificables.
- rama o worktree trazable si hubo codigo.
- evidencia red-green-refactor o justificacion.
- gate-spdd-approved si la feature es visual.
- gate-frontend-spdd-ready si aplica implementacion frontend.
- codigo trazado.
- pruebas, code review y QA.
`],
    ["ai/quality-gates/gate-7-8.md", `# Gate 7-8

## Evidencia minima
- branch o worktree cerrable.
- resumen PR/merge o release.
- runbook.
- rollback.
- monitoreo.
- smoke test.
- metrica operativa.
`],
    ["ai/prompts/generated/README.md", `# Prompts generados

[README principal](../../README.md)

## Prompts disponibles
- [UX ${ctx.feature}](ux-${ctx.feature}.md)
- [Prototype HTML5 ${ctx.feature}](prototype-html5-${ctx.feature}.md)
- [Penpot ${ctx.feature}](penpot-${ctx.feature}.md)
`],
    [`ai/prompts/generated/ux-${ctx.feature}.md`, `# Prompt generado - UX ${ctx.name}

## Rol
Actua como product-design-agent y ux-orchestrator-agent.

## Entrada
- docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md
- docs/fase-2-ux-ui/02.09-spec-driven-product-design.md
- specs/${ctx.feature}/spec-funcional.md
- specs/${ctx.feature}/spec-tecnica.md

## Instruccion
Genera o actualiza Product Design y SPDD inicial para ${ctx.name}. Product Design debe aclarar problema, usuarios, journey, alcance y metricas. SPDD debe dejar flujo UX, pantallas, estados UI, roles/permisos, validaciones visibles y entradas para /prototype. No inventes reglas de negocio ni marques gate-spdd-approved sin validacion humana.

## Salida
- docs/fase-2-ux-ui/02.09-spec-driven-product-design.md
- docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md
- specs/${ctx.feature}/product-design.md
- specs/${ctx.feature}/spdd-frontend.md
- specs/${ctx.feature}/prototype.md
- specs/${ctx.feature}/prototype-validation.md
- specs/${ctx.feature}/ui-test-cases.md
- specs/${ctx.feature}/traceability.md
`],
[`ai/prompts/generated/prototype-html5-${ctx.feature}.md`, `# Prompt generado - Prototype HTML5 ${ctx.name}

## Rol
Actua como UX Designer + Frontend Architect.

## Entrada
- specs/${ctx.feature}/product-design.md
- specs/${ctx.feature}/spdd-frontend.md
- specs/${ctx.feature}/ui-test-cases.md

## Instruccion
Genera un prototipo HTML5 navegable y autocontenido para ${ctx.name}. Usa HTML5 semantico, CSS responsive y JavaScript vanilla. No uses backend ni frameworks externos. Incluye navegacion simulada, datos mock, validaciones, roles/permisos, estados loading, empty, error, success y permission denied, modal de confirmacion, toast y progreso cuando aplique.

## Salida
- specs/${ctx.feature}/prototype-html5/index.html
- specs/${ctx.feature}/prototype.md actualizado
- specs/${ctx.feature}/prototype-validation.md preparado
`],
    [`ai/prompts/generated/penpot-${ctx.feature}.md`, `# Prompt generado - Penpot ${ctx.name}

## Rol
Actua como penpot-prototype-agent.

## Entrada
- docs/fase-2-ux-ui/02.01-flujos-usuario.md
- specs/${ctx.feature}/product-design.md
- specs/${ctx.feature}/spdd-frontend.md
- specs/${ctx.feature}/ui-test-cases.md

## Instruccion
Genera instrucciones Penpot para ${ctx.name}. Incluye pantallas principales, estados vacios, errores y acceso denegado. Debe crear componentes reutilizables, grid 12 columnas, spacing 8 / 16 / 24 / 32, variantes, estados y criterios de validacion. Un prompt Penpot no equivale a prototipo aprobado.

## Salida
- ai/prompts/generated/crear-prototipo-penpot-${ctx.feature}.md
- specs/${ctx.feature}/prototype.md actualizado con link/export cuando exista
- specs/${ctx.feature}/prototype-validation.md preparado
`],
    ["tests/README.md", `# Tests

[README principal](../README.md)

## Estructura
- [unit/](unit/README.md): pruebas unitarias de dominio.
- [integration/](integration/README.md): pruebas de integracion de API.
- [e2e/](e2e/README.md): pruebas end-to-end de flujos criticos.

## Estado inicial
PENDIENTE: Crear pruebas por feature segun spec-tareas.md y gate-4-6.
`],
    ["tests/unit/README.md", `# Tests unitarios

[README principal](../../README.md)

PENDIENTE: Agregar pruebas de dominio y casos de uso por feature.
`],
    ["tests/integration/README.md", `# Tests de integracion

[README principal](../../README.md)

PENDIENTE: Agregar pruebas de API y persistencia por feature.
`],
    ["tests/e2e/README.md", `# Tests end-to-end

[README principal](../../README.md)

PENDIENTE: Agregar e2e de flujos criticos una vez que exista ambiente navegable.
`],
    ["specs/README.md", `# Specs

[README principal](../README.md)

## Features iniciales
- [${ctx.feature}](${ctx.feature}/spec-funcional.md)

## Estructura esperada por feature visual
- product-design.md
- spdd-frontend.md
- prototype.md
- prototype-validation.md
- spec-funcional.md
- spec-tecnica.md
- api-contract.md
- spec-tareas.md
- ui-test-cases.md
- traceability.md
- prototype-html5/ si se requiere validacion navegable rapida
`],
    [`specs/${ctx.feature}/product-design.md`, `# Product Design - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Problema
SUPUESTO: Los usuarios necesitan gestionar ${ctx.apiResourcePlural} sin depender de procesos manuales o herramientas dispersas.

## Objetivo
SUPUESTO: Proveer acceso centralizado a ${ctx.apiResourcePlural} con filtros y trazabilidad.

## Usuarios
- Operador.
- Aprobador.
- Auditor.

## Journey
Ingresar -> ver ${ctx.apiResourcePlural} -> filtrar -> revisar detalle -> decidir siguiente accion.

## Hipotesis
Un modulo centralizado con estados visibles y filtros reducira busqueda manual y errores operativos.

## Metricas
- tiempo para ubicar expediente,
- consultas resueltas,
- reduccion de solicitudes manuales.
`],
    [`specs/${ctx.feature}/spdd-frontend.md`, `# SPDD Frontend - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Flujo UX
SUPUESTO: Consulta de ${ctx.apiResourcePlural} con filtros, resumen y detalle.

## Pantallas
- Login OIDC.
- Modulo ${ctx.apiResourcePlural}.
- Detalle.
- Empty.
- Error.
- Unauthorized.

## Estados UI
- Loading.
- Empty.
- Error.
- Success.
- Unauthorized.

## Componentes
- AppShell.
- SearchInput.
- FilterSelect.
- DataTable.
- StatusBadge.
- PriorityBadge.
- DetailPanel.

## Gate
- gate-prototype-ready: PENDIENTE hasta crear prototipo revisable.
- gate-spdd-approved: PENDIENTE hasta validacion humana.
`],
    [`specs/${ctx.feature}/prototype.md`, `# Prototype - ${ctx.name}

## Objetivo
Mostrar el flujo antes de construir front/back.

## Pantallas cubiertas
- Login.
- Modulo ${ctx.apiResourcePlural}.
- Detalle.
- Empty.
- Error.
- Unauthorized.

## Evidencia
- HTML5: specs/${ctx.feature}/prototype-html5/index.html (si aplica)
- Penpot: PENDIENTE

## Estado
PENDIENTE de validacion humana.
`],
    [`specs/${ctx.feature}/prototype-validation.md`, `# Prototype Validation - ${ctx.name}

## Resultado
PENDIENTE.

## Observaciones
- Confirmar estados definitivos.
- Confirmar indicador SLA.
- Confirmar acciones por rol.

## Gate
- gate-prototype-ready: PENDIENTE.
- gate-spdd-approved: PENDIENTE.
`],
    // Prototipo HTML5 emitido como seed nivel 2 desde html5PrototypeFiles(ctx).
    // hydrateRealProjectDocumentation y hydrateUxProjectArtifacts lo aplican como
    // fuente única para evitar emitir un patrón pobre desde aquí.
    // Prototipo HTML5 emitido como seed nivel 2 desde html5PrototypeFiles(ctx).
    // hydrateRealProjectDocumentation y hydrateUxProjectArtifacts lo aplican como
    // fuente única para evitar emitir un patrón pobre desde aquí.
    [`specs/${ctx.feature}/spec-funcional.md`, `# Spec funcional - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Objetivo
Permitir que el operador consulte ${ctx.apiResourcePlural} asignados y priorice su trabajo diario.

## Trazabilidad
- RF-01 Consultar ${ctx.apiResourcePlural} asignados.
- RF-02 Ver detalle de expediente.

## Actores
- Operador.
- Aprobador.

## Flujo principal
1. El usuario inicia sesion.
2. El sistema obtiene roles desde OIDC.
3. El usuario abre el modulo.
4. El sistema lista ${ctx.apiResourcePlural} permitidos.
5. El usuario filtra por estado, prioridad o responsable.
6. El usuario abre el detalle.

## Criterios de aceptacion
- Solo se muestran ${ctx.apiResourcePlural} permitidos por rol.
- La lista permite filtros basicos.
- La respuesta de API incluye identificador, estado, prioridad y responsable.
- El acceso sin token retorna 401.
`],
    [`specs/${ctx.feature}/spec-tecnica.md`, `# Spec tecnica - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Backend
- Endpoint base: ${ctx.apiResourcePath}.
- Seguridad: permiso ${ctx.apiResourceName}:read.
- Paquete Java: ${ctx.javaBasePackage}.

## Frontend
- Angular/Nx.
- Componente de ${ctx.apiResourcePlural} en frontend/apps/web.
- Servicios de datos en librerias data-access.

## Modelo de datos

> Regla (validador \`check-bd-documented\`): toda tabla declarada en la columna
> \`BD\` de \`traceability.md\` de esta feature debe aparecer aqui como
> \`Tabla \\\`<nombre>\\\`\` con sus columnas. Si esta tabla la genera otra
> feature, basta con que viva en *alguna* \`spec-tecnica.md\` del repo.

Tabla \`${ctx.apiResourceName}\` (cuando se implemente la entity vivira en
\`src/backend/infrastructure/${ctx.apiResourcePlural}/\` segun los Componentes
impactados):

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| numero | TEXT | unico, formato ${ctx.apiResourceName.toUpperCase()}-YYYY-NNNN |
| estado | TEXT | catalogo de estados |
| prioridad | TEXT | enum (alta/media/baja) |
| responsable_id | UUID FK | apunta a \`usuario.id\` |
| fecha_actualizacion | TIMESTAMPTZ | indice descendente |

Indices: \`(estado, prioridad)\` para listados y \`(responsable_id, fecha_actualizacion DESC)\`
para "mis pendientes". Restricciones: \`numero\` UNIQUE.

## Pruebas
- Unitarias de RBAC.
- Contract test de API.
- E2E de consulta de ${ctx.apiResourcePlural}.

## Delivery IA
- Las tareas deben ejecutarse desde \`spec-tareas.md\`.
- Cambios de comportamiento requieren TDD red-green-refactor.
- Cambios de contrato, seguridad o datos requieren review antes de QA.
`],
    [`specs/${ctx.feature}/api-contract.md`, `# API Contract - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Endpoint
GET ${ctx.apiResourcePath}

## Permiso
${ctx.apiResourceName}:read

## Query params
- q
- estado
- prioridad
- responsable
- page
- size

## Response
- id
- numero
- estado
- prioridad
- responsable
- fechaActualizacion
- accionesPermitidas

## Errores
- 401.
- 403.
- 500 controlado.
`],
    [`specs/${ctx.feature}/ui-test-cases.md`, `# UI Test Cases - ${ctx.name}

| Caso | Resultado esperado |
|---|---|
| Cargar ${ctx.apiResourcePlural} | listado visible |
| Sin resultados | empty state |
| Error de servicio | error state |
| Acceso denegado | unauthorized state |
| Filtrar por estado | listado filtrado |
`],
    [`specs/${ctx.feature}/traceability.md`, `# Traceability - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Proposito
Matriz viva que conecta cada requerimiento con su diseno, prototipo, API, datos,
codigo, prueba, estado y evidencia. \`node scripts/ai-framework-agent.mjs sync-memory\`
parsea este Markdown para poblar la memoria del agente IA.

## Flujo
\`\`\`text
Product Design -> SPDD -> Prototipo -> SDD -> Construccion -> QA
\`\`\`

## Matriz de trazabilidad

> Reglas de llenado (v12.22+):
> - Usa \`-\` (guion) en \`Codigo\` y \`Test\` mientras esos artefactos NO existan en el repo.
> - Llena el nombre real cuando el archivo/clase/test exista. \`sync-memory\` distingue
>   automaticamente \`planned\` vs \`implemented\` y \`validated\` por columna \`link_status\`.
> - Si pones un nombre que no existe, \`check-trace-drift\` lo reportara como drift.
> - \`Estado\` puede ser: "En diseno SDD" | "En construccion" | "Validado" | "Bloqueado".

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/${ctx.apiResourcePlural} | ${ctx.apiResourceName} | - | - | En diseno SDD | prototype-validation.md |
| RNF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/${ctx.apiResourcePlural} | ${ctx.apiResourceName} (indices) | - | - | En diseno SDD | api-contract.md |
| RNF-02 | HU-01 | spdd-frontend.md | prototype-html5/index.html | 401/403 | rbac | - | - | En diseno SDD | docs/fase-3-arquitectura/03.08-auth-authz.md |

## Gates
| Gate | Estado | Evidencia |
|---|---|---|
| gate-prototype-ready | Pendiente | prototype-validation.md |
| gate-spdd-approved | Pendiente | spdd-frontend.md |

## Decisiones
- El prototipo aprobado alimenta campos, filtros, permisos y estados de error del API contract.

## Preguntas abiertas
- Catalogo final de estados.
- Indicador SLA para prioridad alta.
`],
    [`specs/${ctx.feature}/spec-tareas.md`, `# Spec tareas - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Contexto
- Feature: ${ctx.feature}.
- Product Design: product-design.md.
- SPDD: spdd-frontend.md y prototype-validation.md.
- Rama sugerida: feat/${ctx.feature}.
- Worktree sugerido: ../worktrees/${ctx.feature}.
- Gate previo visual: gate-spdd-approved.
- Gate construccion: gate-4-6.

## T-001 - Contrato de consulta de ${ctx.apiResourcePlural}
Estado: pendiente

Objetivo:
Definir y validar el contrato de consulta de ${ctx.apiResourcePlural}.

Entradas:
- spec-funcional.md.
- spec-tecnica.md.
- ADR-001.

Archivos permitidos:
- backend/.
- specs/${ctx.feature}/spec-tecnica.md.

Ciclo TDD:
1. Red: crear prueba de contrato para GET ${ctx.apiResourcePath} con permiso ${ctx.apiResourceName}:read.
2. Green: implementar respuesta minima con campos id, numero, estado, prioridad y responsable.
3. Refactor: separar DTO, recurso y servicio si aplica.

Comandos de verificacion:
\`\`\`powershell
cd backend
mvn test
\`\`\`

Evidencia esperada:
- prueba de contrato creada,
- test pasando,
- trazabilidad a RF-01.

## T-002 - Frontend desde prototipo validado
Estado: pendiente

Objetivo:
Implementar o ajustar el modulo ${ctx.apiResourcePlural} Angular con filtros, tabla, detalle y estados UX.

Entradas:
- specs/${ctx.feature}/prototype.md.
- specs/${ctx.feature}/prototype-validation.md.
- docs/fase-5-construccion/05.01-spec-prototype-driven-development-frontend.md.
- spec-funcional.md.

Archivos permitidos:
- frontend/apps/web/.
- frontend/libs/feature-${ctx.apiResourcePlural}/.

Ciclo TDD:
1. Red: crear prueba de componente para estado empty o filtro por estado.
2. Green: implementar comportamiento minimo.
3. Refactor: extraer datos mock y nombres consistentes con el prototipo validado.

Comandos de verificacion:
\`\`\`powershell
cd frontend
npm run typecheck
npm run test
\`\`\`

Evidencia esperada:
- prueba de componente o unit test,
- typecheck pasando,
- diferencias contra prototipo registradas si existen,
- trazabilidad a UX y RF-01.

## T-003 - Revision y evidencia QA
Estado: pendiente

Objetivo:
Revisar cambios criticos y registrar evidencia QA para gate-4-6.

Entradas:
- T-001 y T-002 completadas.
- qa/fase-6-qa/plan-pruebas.md.

Archivos permitidos:
- qa/fase-6-qa/.
- specs/${ctx.feature}/spec-tareas.md.

Ciclo TDD:
1. Red: no aplica; tarea de evidencia.
2. Green: ejecutar pruebas definidas.
3. Refactor: consolidar defectos y observaciones.

Comandos de verificacion:
\`\`\`powershell
cd backend
mvn test

cd ..\\frontend
npm run typecheck
npm run test
\`\`\`

Evidencia esperada:
- resultado de pruebas,
- code review de cambios criticos,
- defectos o riesgos residuales,
- gate-4-6 aprobado, aprobado con observaciones o bloqueado.
`],
    ["qa/fase-6-qa/plan-pruebas.md", `# Plan de pruebas

[README principal](../../README.md)

## Alcance
Validar ${ctx.apiResourcePlural}, flujos de negocio, seguridad y observabilidad de ${ctx.name}.

## Tipos de prueba
- Unitarias backend.
- Unitarias frontend.
- Integracion API.
- Seguridad RBAC.
- Smoke de despliegue.

## Evidencia requerida
- Resultados de tests.
- Capturas o logs de smoke.
- Defectos y resolucion.
`],
    ["ops/fase-7-deploy/runbook.md", `# Runbook de deploy

[README principal](../../README.md)

## Objetivo
Liberar ${ctx.name} de forma controlada.

## Pasos
1. Verificar build backend y frontend.
2. Publicar imagen ${ctx.containerImage}.
3. Aplicar configuracion de ambiente.
4. Desplegar en staging.
5. Ejecutar smoke test.
6. Aprobar salida a produccion.
7. Monitorear metricas iniciales.
`],
    ["ops/fase-7-deploy/rollback.md", `# Rollback

[README principal](../../README.md)

## Criterios de activacion
- Error rate sobre umbral.
- Latencia p95 degradada.
- Fallo de autenticacion generalizado.
- Incidente funcional bloqueante.

## Procedimiento
1. Congelar nuevos despliegues.
2. Restaurar imagen previa.
3. Revertir configuracion si aplica.
4. Validar health checks.
5. Comunicar estado a stakeholders.
`],
    ["ops/fase-8-operacion/operacion.md", `# Operacion

[README principal](../../README.md)

## Operacion diaria
- Revisar dashboards.
- Revisar alertas.
- Validar jobs de CI/CD.
- Gestionar backlog evolutivo.

## Responsables
- SRE: disponibilidad y alertas.
- DevOps: pipeline y ambientes.
- Tech Lead: soporte tecnico.
- PO: priorizacion evolutiva.
`],
    ["ops/fase-8-operacion/metricas.md", `# Metricas

[README principal](../../README.md)

## Metricas iniciales
- Disponibilidad.
- Latencia p95.
- Error rate.
- Cambios de estado por dia.
- Expedientes pendientes por estado.
- Fallos de autorizacion.
`],
    ["frontend/libs/ui/README.md", `# UI library

Componentes compartidos de ${ctx.name} para Angular/Nx.

## Uso previsto
- Componentes de tabla y filtros de ${ctx.apiResourcePlural}.
- Componentes de estado visual y feedback operativo.
- Componentes de confirmacion y mensajes operativos.
`],
  ]);
}

function allDocumentationFiles(ctx) {
  return new Map([...documentationFiles(ctx), ...additionalDocumentationFiles(ctx)]);
}

function html5PrototypeFiles(ctx) {
  // Seed de nivel 2 — patrón saas-operativo (genérico, suficiente para pasar el validador).
  // El usuario debe ejecutar /prototype --mode html5 para regenerar a nivel 3
  // siguiendo ai/prompts/generar-prototipo-html5-ejecutable.md y el golden de su dominio.
  return new Map([
    [`specs/${ctx.feature}/prototype-html5/index.html`, html5SeedIndex(ctx)],
    [`specs/${ctx.feature}/prototype-html5/flujo.md`, html5SeedFlujo(ctx)],
    [`specs/${ctx.feature}/prototype-html5/decisiones-ux.md`, html5SeedDecisiones(ctx)],
  ]);
}

export function html5SeedIndex(ctx) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${ctx.name} — Bandeja operativa</title>
<style>
  /* === DESIGN TOKENS === */
  :root {
    --brand: #1F4E79;
    --brand-dark: #163A5C;
    --brand-light: #E8F0F9;
    --brand-mid: #C9DCEF;
    --success: #047857;
    --warning: #B45309;
    --danger: #B91C1C;
    --neutral-50: #F9FAFB;
    --neutral-100: #F3F4F6;
    --neutral-200: #E5E7EB;
    --neutral-300: #D1D5DB;
    --neutral-400: #9CA3AF;
    --neutral-500: #6B7280;
    --neutral-600: #4B5563;
    --neutral-700: #374151;
    --neutral-800: #1F2937;
    --neutral-900: #111827;
    --sidebar-w: 220px;
    --topbar-h: 56px;
    --banner-h: 28px;
    --font: 'Segoe UI', system-ui, sans-serif;
    --radius: 6px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.12);
    --transition: 0.18s ease;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); background: var(--neutral-100); color: var(--neutral-800); min-height: 100vh; }
  button, input, select { font: inherit; }

  .hub-link { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--neutral-400); text-decoration: none; padding: 4px 8px; border-radius: var(--radius); transition: var(--transition); }
  .hub-link:hover { background: var(--neutral-100); color: var(--brand); }

  .topbar { position: fixed; top: 0; left: 0; right: 0; height: var(--topbar-h); background: #fff; border-bottom: 1px solid var(--neutral-200); display: flex; align-items: center; padding: 0 20px; gap: 16px; z-index: 100; box-shadow: var(--shadow-sm); }
  .topbar-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; color: var(--brand); }
  .topbar-brand .logo { width: 30px; height: 30px; background: var(--brand); border-radius: 7px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 800; }
  .topbar-search { flex: 1; max-width: 380px; position: relative; }
  .topbar-search input { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid var(--neutral-300); border-radius: var(--radius); font-size: 13px; background: var(--neutral-50); outline: none; }
  .topbar-search input:focus { border-color: var(--brand); background: #fff; }
  .topbar-search .ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--neutral-400); }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .user-menu { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 10px; border-radius: var(--radius); }
  .user-menu:hover { background: var(--neutral-100); }
  .user-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--brand); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; }
  .user-meta { font-size: 12px; line-height: 1.3; }
  .user-meta strong { display: block; font-size: 13px; color: var(--neutral-800); }
  .role-tag { display: inline-flex; padding: 2px 7px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: #EDE9FE; color: #5B21B6; }

  .app-layout { margin-top: var(--topbar-h); }

  .sidebar { width: var(--sidebar-w); background: #fff; border-right: 1px solid var(--neutral-200); position: fixed; top: var(--topbar-h); bottom: 0; left: 0; padding: 14px 0; }
  .sidebar-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--neutral-400); padding: 4px 16px; display: block; }
  .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 9px 16px; color: var(--neutral-600); font-size: 13px; cursor: pointer; transition: var(--transition); }
  .sidebar-item:hover { background: var(--neutral-100); color: var(--neutral-800); }
  .sidebar-item.active { background: var(--brand-light); color: var(--brand); font-weight: 600; border-left: 3px solid var(--brand); padding-left: 13px; }

  .main-content { margin-left: var(--sidebar-w); padding: 22px 24px; }
  .page-header { display: flex; justify-content: space-between; margin-bottom: 18px; gap: 16px; flex-wrap: wrap; }
  .page-title h1 { font-size: 22px; font-weight: 700; color: var(--neutral-900); }
  .page-title .breadcrumb { font-size: 12px; color: var(--neutral-500); margin-bottom: 4px; }
  .page-title p { font-size: 13px; color: var(--neutral-500); margin-top: 2px; }

  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: var(--transition); }
  .btn-primary { background: var(--brand); color: #fff; }
  .btn-primary:hover { background: var(--brand-dark); }
  .btn-secondary { background: #fff; color: var(--neutral-700); border: 1px solid var(--neutral-300); }
  .btn-secondary:hover { background: var(--neutral-50); }
  .btn-ghost { background: transparent; color: var(--neutral-600); }

  .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
  .kpi-card { background: #fff; border: 1px solid var(--neutral-200); border-radius: var(--radius); padding: 14px 18px; box-shadow: var(--shadow-sm); }
  .kpi-card.highlight { border-color: var(--brand); }
  .kpi-card.highlight .kpi-value { color: var(--brand); }
  .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.7px; color: var(--neutral-500); font-weight: 600; }
  .kpi-value { font-size: 26px; font-weight: 800; color: var(--neutral-900); margin-top: 4px; }
  .kpi-delta { font-size: 11px; margin-top: 4px; color: var(--neutral-500); }
  .kpi-delta.up { color: var(--success); }

  .filter-bar { background: #fff; border: 1px solid var(--neutral-200); border-radius: var(--radius); padding: 12px 14px; margin-bottom: 14px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .filter-group { display: flex; align-items: center; gap: 8px; }
  .filter-group label { font-size: 12px; color: var(--neutral-600); }
  .filter-select { padding: 6px 10px; border: 1px solid var(--neutral-300); border-radius: var(--radius); font-size: 12px; background: #fff; min-width: 130px; }
  .filter-count { font-size: 12px; color: var(--neutral-500); margin-left: auto; }

  .table-card { background: #fff; border: 1px solid var(--neutral-200); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); }
  table { width: 100%; border-collapse: collapse; }
  thead { background: var(--neutral-50); }
  th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--neutral-500); border-bottom: 1px solid var(--neutral-200); }
  td { padding: 12px 14px; font-size: 13px; color: var(--neutral-700); border-bottom: 1px solid var(--neutral-100); }
  tbody tr { cursor: pointer; transition: var(--transition); }
  tbody tr:hover td { background: var(--neutral-50); }

  .badge { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; margin-right: 5px; }
  .badge-pending { background: #FEF3C7; color: #92400E; }
  .badge-in-review { background: #DBEAFE; color: #1E40AF; }
  .badge-approved { background: #D1FAE5; color: #065F46; }
  .badge-closed { background: var(--neutral-100); color: var(--neutral-500); }

  .priority { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; }
  .priority-dot { width: 8px; height: 8px; border-radius: 50%; }
  .priority-high { color: var(--danger); }
  .priority-high .priority-dot { background: var(--danger); }
  .priority-medium { color: var(--warning); }
  .priority-medium .priority-dot { background: var(--warning); }
  .priority-low { color: var(--success); }
  .priority-low .priority-dot { background: var(--success); }

  .empty-state, .loading-state, .error-state { text-align: center; padding: 56px 24px; display: none; }
  .empty-state.visible, .loading-state.visible, .error-state.visible { display: block; }
  .state-ico { font-size: 42px; margin-bottom: 14px; opacity: 0.5; }
  .empty-state h3, .error-state h3 { font-size: 16px; font-weight: 600; color: var(--neutral-700); margin-bottom: 6px; }
  .empty-state p, .error-state p, .loading-state p { font-size: 13px; color: var(--neutral-500); margin-bottom: 18px; }
  .spinner { width: 32px; height: 32px; border: 3px solid var(--neutral-200); border-top-color: var(--brand); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 14px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 200; display: flex; flex-direction: column; gap: 10px; }
  .toast { background: var(--neutral-800); color: #fff; padding: 12px 16px; border-radius: var(--radius); font-size: 13px; min-width: 280px; box-shadow: var(--shadow-md); animation: slidein 0.25s ease; }
  .toast.success { background: var(--success); }
  .toast.error { background: var(--danger); }
  @keyframes slidein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .seed-warning { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: var(--radius); padding: 12px 14px; font-size: 12px; color: #92400E; margin-bottom: 16px; }
  .seed-warning strong { color: #78350F; }

  @media (max-width: 1100px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 900px) { .sidebar { display: none; } .main-content { margin-left: 0; padding: 14px; } .kpi-row { grid-template-columns: 1fr 1fr; } }
</style>
</head>
<body>

<header class="topbar">
  <div class="topbar-brand">
    <div class="logo">${ctx.feature.charAt(0).toUpperCase()}</div>
    ${ctx.name}
  </div>
  <a class="hub-link" href="../../../prototype/index.html" title="Volver al hub del producto">← Hub</a>
  <div class="topbar-search">
    <span class="ico">🔍</span>
    <input type="text" placeholder="Buscar por número o responsable..." oninput="handleSearch(this.value)">
  </div>
  <div class="topbar-right">
    <div class="user-menu">
      <div class="user-avatar">MR</div>
      <div class="user-meta">
        <strong>María Rodríguez</strong>
        <span class="role-tag">Supervisora</span>
      </div>
    </div>
  </div>
</header>

<div class="app-layout">
  <aside class="sidebar">
    <span class="sidebar-label">Operación</span>
    <a class="sidebar-item active" data-view="bandeja" onclick="setView('bandeja')">📋 Bandeja</a>
    <a class="sidebar-item" data-view="mios" onclick="setView('mios')">👤 Mis ${ctx.apiResourcePlural}</a>
    <a class="sidebar-item" data-view="archivo" onclick="setView('archivo')">📂 Archivo</a>
    <span class="sidebar-label">Reportes</span>
    <a class="sidebar-item" data-view="seguimiento" onclick="setView('seguimiento')">📊 Seguimiento</a>
    <a class="sidebar-item" data-view="auditoria" onclick="setView('auditoria')">🛡️ Auditoría</a>
  </aside>

  <main class="main-content">

    <div class="seed-warning">
      <strong>SEED nivel 2.</strong> Este prototipo es un punto de partida genérico saas-operativo.
      Antes de validar con stakeholders, ejecuta <code>/prototype --mode html5</code> y regenera siguiendo
      el golden de tu dominio en <code>ejemplos/fase-2-ux-ui/prototype-html5-golden/</code>.
      Auto-rating obligatorio: <code>node ci/scripts/check-html5-prototype-quality.mjs --spec specs/${ctx.feature} --strict</code>.
    </div>

    <div class="page-header">
      <div class="page-title">
        <div class="breadcrumb">Inicio · <span id="breadcrumbCurrent">Bandeja</span></div>
        <h1 id="pageTitle">Bandeja de ${ctx.apiResourcePlural}</h1>
        <p>Listado operativo con filtros y detalle por registro.</p>
      </div>
      <div>
        <button class="btn btn-secondary" onclick="handleExport()">⬇ Exportar</button>
        <button class="btn btn-primary" onclick="handleNew()">+ Nuevo</button>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card highlight"><div class="kpi-label">Pendientes</div><div class="kpi-value">6</div><div class="kpi-delta up">↑ 2 vs ayer</div></div>
      <div class="kpi-card"><div class="kpi-label">En revisión</div><div class="kpi-value">3</div><div class="kpi-delta">Sin cambio</div></div>
      <div class="kpi-card"><div class="kpi-label">Aprobados hoy</div><div class="kpi-value">9</div><div class="kpi-delta up">↑ 3 vs ayer</div></div>
      <div class="kpi-card"><div class="kpi-label">Tiempo promedio</div><div class="kpi-value">2.4h</div><div class="kpi-delta">Sin cambio</div></div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <label>Estado</label>
        <select class="filter-select" id="filterStatus" onchange="applyFilters()">
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="in-review">En revisión</option>
          <option value="approved">Aprobado</option>
          <option value="closed">Cerrado</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Prioridad</label>
        <select class="filter-select" id="filterPriority" onchange="applyFilters()">
          <option value="">Todas</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>
      <span class="filter-count" id="filterCount"></span>
      <button class="btn btn-ghost" onclick="clearFilters()">Limpiar filtros</button>
    </div>

    <div class="table-card">
      <div class="loading-state" id="loadingState">
        <div class="spinner"></div>
        <p>Cargando ${ctx.apiResourcePlural}…</p>
      </div>
      <div class="error-state" id="errorState">
        <div class="state-ico">⚠️</div>
        <h3>No se pudo cargar la bandeja</h3>
        <p>Hubo un problema de conexión. Verifica tu red e intenta de nuevo.</p>
        <button class="btn btn-primary" onclick="retryLoad()">Reintentar carga</button>
      </div>
      <div class="empty-state" id="emptyState">
        <div class="state-ico">🔍</div>
        <h3>No hay resultados con esos filtros</h3>
        <p>Prueba cambiando los criterios de búsqueda o limpia los filtros activos.</p>
        <button class="btn btn-secondary" onclick="clearFilters()">Limpiar filtros</button>
      </div>
      <table id="caseTable">
        <thead>
          <tr>
            <th>Número</th>
            <th>Asunto</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Última actualización</th>
            <th>Responsable</th>
          </tr>
        </thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>

  </main>
</div>

<div class="toast-container" id="toastContainer"></div>

<script>
const MOCK_RECORDS = [
  { id:'REG-2024-0009', subject:'${ctx.apiResourcePlural} — caso operativo 09', priority:'high',   status:'pending',   date:'2024-11-12', owner:'María Rodríguez' },
  { id:'REG-2024-0008', subject:'${ctx.apiResourcePlural} — caso operativo 08', priority:'high',   status:'in-review', date:'2024-11-11', owner:'Roberto Gómez' },
  { id:'REG-2024-0007', subject:'${ctx.apiResourcePlural} — caso operativo 07', priority:'medium', status:'pending',   date:'2024-11-11', owner:'María Rodríguez' },
  { id:'REG-2024-0006', subject:'${ctx.apiResourcePlural} — caso operativo 06', priority:'medium', status:'approved',  date:'2024-11-09', owner:'Javier Lima' },
  { id:'REG-2024-0005', subject:'${ctx.apiResourcePlural} — caso operativo 05', priority:'low',    status:'pending',   date:'2024-11-08', owner:'Sin asignar' },
  { id:'REG-2024-0004', subject:'${ctx.apiResourcePlural} — caso operativo 04', priority:'medium', status:'in-review', date:'2024-11-07', owner:'Roberto Gómez' },
  { id:'REG-2024-0003', subject:'${ctx.apiResourcePlural} — caso operativo 03', priority:'low',    status:'approved',  date:'2024-11-05', owner:'Javier Lima' },
  { id:'REG-2024-0002', subject:'${ctx.apiResourcePlural} — caso operativo 02', priority:'high',   status:'closed',    date:'2024-11-02', owner:'María Rodríguez' },
];

const STATUS_LABELS = {
  'pending':   { label:'Pendiente',   cls:'badge-pending' },
  'in-review': { label:'En revisión', cls:'badge-in-review' },
  'approved':  { label:'Aprobado',    cls:'badge-approved' },
  'closed':    { label:'Cerrado',     cls:'badge-closed' },
};
const PRIORITY_LABELS = {
  'high':   { label:'Alta',  cls:'priority-high' },
  'medium': { label:'Media', cls:'priority-medium' },
  'low':    { label:'Baja',  cls:'priority-low' },
};

let filtered = [...MOCK_RECORDS];
let searchTerm = '';

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loadingState').classList.add('visible');
  document.getElementById('caseTable').style.display = 'none';
  setTimeout(() => {
    document.getElementById('loadingState').classList.remove('visible');
    document.getElementById('caseTable').style.display = '';
    renderTable();
    updateCount();
  }, 700);
});

function setView(view) {
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  const titles = { bandeja:'Bandeja', mios:'Mis registros', archivo:'Archivo', seguimiento:'Seguimiento', auditoria:'Auditoría' };
  document.getElementById('pageTitle').textContent = titles[view] || 'Bandeja';
  document.getElementById('breadcrumbCurrent').textContent = titles[view] || 'Bandeja';
  if (view !== 'bandeja') showToast('Vista "' + titles[view] + '" — disponible en próxima iteración');
}

function applyFilters() {
  const status = document.getElementById('filterStatus').value;
  const priority = document.getElementById('filterPriority').value;
  filtered = MOCK_RECORDS.filter(r => {
    if (status && r.status !== status) return false;
    if (priority && r.priority !== priority) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!(r.id + r.subject + r.owner).toLowerCase().includes(s)) return false;
    }
    return true;
  });
  renderTable();
  updateCount();
}

function handleSearch(v) { searchTerm = v.trim(); applyFilters(); }
function clearFilters() {
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterPriority').value = '';
  searchTerm = '';
  applyFilters();
  showToast('Filtros limpiados');
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  const tbl = document.getElementById('caseTable');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';
  if (filtered.length === 0) { tbl.style.display = 'none'; empty.classList.add('visible'); return; }
  tbl.style.display = ''; empty.classList.remove('visible');
  for (const r of filtered) {
    const st = STATUS_LABELS[r.status]; const pr = PRIORITY_LABELS[r.priority];
    const tr = document.createElement('tr');
    tr.innerHTML = '<td><strong>' + r.id + '</strong></td>' +
      '<td>' + r.subject + '</td>' +
      '<td><span class="priority ' + pr.cls + '"><span class="priority-dot"></span>' + pr.label + '</span></td>' +
      '<td><span class="badge ' + st.cls + '">' + st.label + '</span></td>' +
      '<td>' + r.date + '</td>' +
      '<td>' + r.owner + '</td>';
    tr.addEventListener('click', () => showToast('Abriendo detalle de ' + r.id + ' — implementa el panel de detalle al regenerar'));
    tbody.appendChild(tr);
  }
}

function updateCount() {
  document.getElementById('filterCount').textContent = filtered.length + ' de ' + MOCK_RECORDS.length + ' registros';
}

function handleExport() { showToast('Exportación simulada — usa /prototype para regenerar', 'success'); }
function handleNew()    { showToast('Formulario "Nuevo" pendiente — usa /prototype para regenerar'); }
function retryLoad() {
  document.getElementById('errorState').classList.remove('visible');
  document.getElementById('loadingState').classList.add('visible');
  setTimeout(() => {
    document.getElementById('loadingState').classList.remove('visible');
    document.getElementById('caseTable').style.display = '';
    renderTable();
  }, 600);
}

function showToast(msg, kind) {
  const t = document.createElement('div');
  t.className = 'toast' + (kind ? ' ' + kind : '');
  t.textContent = msg;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Demo: doble-click en el avatar dispara error simulado para mostrar estado error
document.querySelector('.user-avatar').addEventListener('dblclick', () => {
  document.getElementById('caseTable').style.display = 'none';
  document.getElementById('errorState').classList.add('visible');
  showToast('Error simulado de conexión', 'error');
});
</script>
</body>
</html>
`;
}

export function html5SeedFlujo(ctx) {
  return `# Flujo prototipo HTML5 — ${ctx.name}

> SEED nivel 2 — generado automáticamente como punto de partida.
> Antes de validar con stakeholders, regenera con \`/prototype --mode html5\` siguiendo
> el golden de tu dominio en \`ejemplos/fase-2-ux-ui/prototype-html5-golden/\`.

## Tarea principal recorrible (happy path)

\`\`\`
Bandeja de ${ctx.apiResourcePlural}
  └─ Filtrar por estado / prioridad
      └─ Click en fila
          └─ (panel de detalle — pendiente, regenerar para nivel 3)
\`\`\`

## Pantallas y estados cubiertos

| Vista | Cómo se llega | Estados cubiertos |
|---|---|---|
| Bandeja | URL inicial, sidebar "Bandeja" | success, loading, empty, error |
| Mis registros | Sidebar | placeholder con toast |
| Archivo | Sidebar | placeholder con toast |
| Seguimiento | Sidebar | placeholder con toast |
| Auditoría | Sidebar | placeholder con toast |

## Estados UI

| Estado | Cómo se dispara |
|---|---|
| Loading | Carga inicial (700 ms) |
| Empty | Combinación de filtros sin coincidencias |
| Error | Doble-click en el avatar del topbar (disparador de demo) |
| Success | Toast verde tras exportar |

## Datos mock

8 registros con variedad de prioridades (alta/media/baja) y estados (pendiente / en revisión / aprobado / cerrado). Datos planos — al regenerar incluir tipos de dominio, fechas reales y descripciones específicas.

## Limitaciones del seed

- Sin panel de detalle.
- Sin diferencias por rol/perfil.
- Sin historial / auditoría reales.
- Sin transiciones de estado entre acciones.
- Sin modal de confirmación.

Estas piezas se completan al regenerar con el prompt ejecutable y el golden del dominio.
`;
}

export function html5SeedDecisiones(ctx) {
  return `# Decisiones UX prototipo HTML5 — ${ctx.name}

> SEED nivel 2 — los campos están en blanco para forzar al agente a rellenarlos
> ANTES de regenerar el prototipo. El validador exige los seis primeros campos
> con su label exacto para validar B6/B7/B9.

## Decisión de patrón de producto

- Dominio del spec: <COMPLETAR — streaming / saas-operativo / ecommerce / educación / salud / dashboard / otro>
- Actor principal: <COMPLETAR — operador / supervisor / cliente / paciente / etc.>
- Tarea principal navegable de inicio a fin: <COMPLETAR>
- Patrón visual elegido: <COMPLETAR>
- Por qué NO se usa una shell genérica sidenav+tabla: <COMPLETAR>
- Interacciones del prototipo (mínimo 3, expresadas como acciones reales del producto): <COMPLETAR>
- Limitaciones conocidas: <COMPLETAR>

## Golden de referencia

- Path: \`ejemplos/fase-2-ux-ui/prototype-html5-golden/<elegido>/index.html\`
- Por qué este golden: <COMPLETAR>
- Patrones estructurales que voy a replicar (cita o anclaje): <COMPLETAR>
- Tokens base reutilizados de \`:root\` (≥ 8): <COMPLETAR>

## Estado del seed

Este archivo describe un seed nivel 2 emitido automáticamente por el generador del template.
- Patrón visual del seed: saas-operativo (topbar + sidebar + KPI + filtros + tabla + estados).
- Si tu dominio NO es saas-operativo, **regenera** con \`/prototype --mode html5\` siguiendo el golden adecuado.
- Si tu dominio sí es saas-operativo, valida el pre-flight de arriba y luego sube a nivel 3 añadiendo: panel de detalle lateral, diferencias por rol, historial completo, modal de confirmación.

## Verificación

\`\`\`sh
node ci/scripts/check-html5-prototype-quality.mjs --spec specs/${ctx.feature} --strict
\`\`\`

Sin completar la sección "Decisión de patrón de producto" arriba, el validador reporta observaciones O4. Sin alcanzar nivel 2, queda BLOQUEADO.
`;
}

function markdownTitle(content, fallback) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.basename(fallback, ".md");
}

function docsRelativeLink(fromRelativePath, toRelativePath) {
  return path.posix.relative(path.posix.dirname(fromRelativePath), toRelativePath) || path.posix.basename(toRelativePath);
}

function navTargetLabel(targetRelativePath, titleByPath) {
  if (targetRelativePath === "README.md") return "README principal";
  return titleByPath.get(targetRelativePath) ?? path.basename(targetRelativePath, ".md");
}

function navBlockForDocsPath(relativePath, titleByPath) {
  const index = GENERATED_DOC_NAV_ORDER.indexOf(relativePath);
  if (index < 0) return "";
  const previousPath = index === 0 ? "README.md" : GENERATED_DOC_NAV_ORDER[index - 1];
  const nextPath =
    index === GENERATED_DOC_NAV_ORDER.length - 1 ? GENERATED_DOC_NAV_ORDER[0] : GENERATED_DOC_NAV_ORDER[index + 1];
  const previousLink = docsRelativeLink(relativePath, previousPath);
  const nextLink = docsRelativeLink(relativePath, nextPath);
  return [
    "<!-- nav-guided:start -->",
    "## Navegacion guiada",
    `- Anterior: [${navTargetLabel(previousPath, titleByPath)}](${previousLink})`,
    `- Siguiente: [${navTargetLabel(nextPath, titleByPath)}](${nextLink})`,
    "<!-- nav-guided:end -->",
  ].join("\n");
}

function withDocsNavigation(relativePath, content, titleByPath) {
  if (!relativePath.startsWith("docs/") || content.includes("<!-- nav-guided:start -->")) return content;
  const nav = navBlockForDocsPath(relativePath, titleByPath);
  if (!nav) return content;
  const lines = content.trim().split(/\r?\n/);
  let insertAt = 1;
  while (insertAt < lines.length && lines[insertAt].trim() === "") insertAt += 1;
  if (lines[insertAt]?.includes("[README principal]")) {
    insertAt += 1;
    while (insertAt < lines.length && lines[insertAt].trim() === "") insertAt += 1;
  }
  return [...lines.slice(0, insertAt), "", nav, "", ...lines.slice(insertAt)].join("\n");
}

function hydrateRealProjectDocumentation(dest, config, stack) {
  const ctx = projectContext(config, stack);
  const files = allDocumentationFiles(ctx);
  files.delete(`specs/${ctx.feature}/prototype-html5/styles.css`);
  files.delete(`specs/${ctx.feature}/prototype-html5/app.js`);
  files.delete(`specs/${ctx.feature}/prototype-html5/mock-data.js`);
  for (const [relativePath, content] of html5PrototypeFiles(ctx)) {
    files.set(relativePath, content);
  }

  // v12.22: package.json necesita tratamiento especial para no pisar el del
  // stack (caso node-next: Next.js vive en la raiz y trae deps). Si ya existe
  // un package.json en destino, fusionamos solo nuestros `memory:*` y
  // `check:*` scripts dentro de el; preservamos name/version/dependencies/etc.
  const ourPackageJson = files.get("package.json");
  files.delete("package.json");

  const titleByPath = new Map();
  for (const [relativePath, content] of files) {
    titleByPath.set(relativePath, markdownTitle(content, relativePath));
  }
  for (const [relativePath, content] of files) {
    writeFileEnsured(path.join(dest, ...relativePath.split("/")), withDocsNavigation(relativePath, content, titleByPath));
  }

  // Manejo especial de package.json: merge si existe, escribir si no.
  if (ourPackageJson) {
    mergeOrWritePackageJson(path.join(dest, "package.json"), ourPackageJson);
  }

  let copied = 0;
  const root = repoRoot();
  for (const relativePath of LIVE_FRAMEWORK_FILES_TO_COPY) {
    if (copyTemplateFileIfExists(root, dest, relativePath)) copied += 1;
  }
  return files.size + copied;
}

// v12.22: fusiona nuestros scripts memory:* y check:* dentro de un
// package.json existente (caso stacks que ponen el package.json en la raiz,
// como node-next). Preserva name, version, dependencies, devDependencies, etc.
// Si no existe, escribe el nuestro tal cual.
function mergeOrWritePackageJson(absolutePath, ourContent) {
  const ours = JSON.parse(ourContent);
  if (!fs.existsSync(absolutePath)) {
    writeFileEnsured(absolutePath, JSON.stringify(ours, null, 2) + "\n");
    return;
  }
  let existing;
  try {
    existing = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch {
    // si el existente no es JSON valido, hacemos backup y escribimos el nuestro
    fs.renameSync(absolutePath, absolutePath + ".pre-v12.22.bak");
    writeFileEnsured(absolutePath, JSON.stringify(ours, null, 2) + "\n");
    return;
  }
  const ourScripts = ours.scripts || {};
  const existingScripts = existing.scripts || {};
  // Fusion: nuestros memory:* y check:* tienen prioridad; el resto del package.json se preserva.
  const mergedScripts = { ...existingScripts };
  for (const [k, v] of Object.entries(ourScripts)) {
    // Solo agregar si no choca con un script existente del stack
    if (!Object.prototype.hasOwnProperty.call(existingScripts, k)) {
      mergedScripts[k] = v;
    }
  }
  existing.scripts = mergedScripts;
  // Asegurar engines.node >= 22 (memoria viva usa node:sqlite built-in)
  existing.engines = existing.engines || {};
  if (!existing.engines.node) existing.engines.node = ours.engines.node || ">=22.0.0";
  writeFileEnsured(absolutePath, JSON.stringify(existing, null, 2) + "\n");
}

function collectMarkdownFiles(root) {
  const files = [];
  const visit = (current) => {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      const relative = normalizeRelative(root, absolute);
      if (entry.isDirectory()) {
        if (!isIgnored(relative)) visit(absolute);
        continue;
      }
      if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".md") {
        files.push(absolute);
      }
    }
  };
  visit(root);
  return files.sort();
}

function validateGeneratedDocumentation(dest) {
  const findings = [];
  for (const file of collectMarkdownFiles(dest)) {
    const text = fs.readFileSync(file, "utf8");
    const relative = normalizeRelative(dest, file);
    for (const pattern of TEMPLATE_LIKE_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${relative}: contiene texto con apariencia de plantilla (${pattern})`);
      }
    }
  }
  return findings;
}

function projectPathFromUxArgs(args, root) {
  const raw = args.project ?? args.dest;
  return raw ? resolveInputPath(root, raw) : null;
}

function generatedProjectContext(projectPath, args = {}) {
  const manifestPath = path.join(projectPath, "ai", "provider-manifest.json");
  const packagePath = path.join(projectPath, "frontend", "package.json");
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};
  const packageJson = fs.existsSync(packagePath) ? readJson(packagePath) : {};
  const slug = manifest.projectSlug ?? "proyecto";
  return {
    name: manifest.projectName ?? "Proyecto",
    slug,
    dockerProject: slug.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "proyecto",
    feature: args.feature ?? `001-${manifest.apiResourcePlural ?? slug}`,
    webPackage: packageJson.name ?? "app-web",
    apiPath: manifest.apiResourcePath ?? `/api/${slug}`,
    apiResourcePath: manifest.apiResourcePath ?? `/api/${slug}`,
    apiResourceName: manifest.apiResourceName ?? slug,
    apiResourcePlural: manifest.apiResourcePlural ?? slug,
    javaBasePackage: manifest.javaBasePackage ?? `com.acme.${slug}`,
    containerImage: manifest.containerImage ?? `ghcr.io/acme/${slug}-api`,
  };
}

function uxPhaseFiles(ctx) {
  return new Map([
    ["docs/fase-2-ux-ui/README.md", `# Fase 2 - UX/UI

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Analisis y requerimientos](../fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- Siguiente: [UX/UI](02.00-ux-ui.md)
<!-- nav-guided:end -->

## Proposito
Definir la experiencia operativa inicial de ${ctx.name}: usuarios, journeys, pantallas principales, estados de interfaz, SPDD inicial y prototipo HTML5/Penpot validable antes de construir.

## Entregables
- [UX/UI](02.00-ux-ui.md)
- [Flujos de usuario](02.01-flujos-usuario.md)
- [Spec-Driven Product Design](02.09-spec-driven-product-design.md)
- [SPDD](02.10-spdd-spec-prototype-driven-development.md)
- [Checklist Product Design](02.11-checklist-product-design.md)
- [Checklist SPDD](02.12-checklist-spdd.md)
- [Penpot AI Prototyping](02.13-penpot-ai-prototyping.md)
- [HTML5-first Prototyping](02.14-html5-first-prototyping.md)

## Rutas relacionadas
- [Analisis y requerimientos](../fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [Spec inicial de ${ctx.apiResourcePlural}](../../specs/${ctx.feature}/spec-funcional.md)
- [Prototype](../../specs/${ctx.feature}/prototype.md)
- [Prototype validation](../../specs/${ctx.feature}/prototype-validation.md)
- [Prototype HTML5](../../specs/${ctx.feature}/prototype-html5/index.html)
- [Operacion Penpot](../../ops/prototyping/penpot/README.md)
- [Task packet UX](../../ai/tasks/fase-2-ux.task.md)
`],
    ["docs/fase-2-ux-ui/02.00-ux-ui.md", `# UX/UI - ${ctx.name}

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Fase 2](README.md)
- Siguiente: [Flujos de usuario](02.01-flujos-usuario.md)
<!-- nav-guided:end -->

## Usuarios
- Operador.
- Aprobador.
- Auditor.
- Administrador.

## Pantallas principales
- Login OIDC.
- Modulo de ${ctx.apiResourcePlural}.
- Detalle.
- Confirmacion.
- Historial o auditoria.
- Pantalla de error o acceso denegado.

## Estados UX minimos
- Cargando.
- Sin resultados.
- Error.
- Exito.
- Acceso denegado.

## Feedback UX minimo
- Toast de notificacion.
- Modal de confirmacion.
- Indicador de progreso cuando aplique.
`],
    ["docs/fase-2-ux-ui/02.01-flujos-usuario.md", `# Flujos de usuario - ${ctx.name}

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [UX/UI](02.00-ux-ui.md)
- Siguiente: [Spec-Driven Product Design](02.09-spec-driven-product-design.md)
<!-- nav-guided:end -->

## Flujo principal
1. El usuario ingresa al sistema.
2. El sistema valida sesion y roles via OIDC.
3. El usuario abre el modulo de ${ctx.apiResourcePlural}.
4. El sistema presenta datos permitidos por rol.
5. El usuario filtra, revisa detalle y ejecuta la accion permitida.
6. El sistema muestra confirmacion, progreso o resultado.

## Flujos alternos
- Sin resultados: mostrar estado empty con accion para limpiar filtros.
- Error: mostrar mensaje seguro y accion de reintento.
- Acceso denegado: bloquear accion sin exponer datos sensibles.

## Preguntas abiertas
- Confirmar roles definitivos.
- Confirmar validaciones obligatorias.
- Confirmar eventos de auditoria visibles.
`],
    ["docs/fase-2-ux-ui/02.09-spec-driven-product-design.md", `# Spec-Driven Product Design - ${ctx.name}

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Flujos de usuario](02.01-flujos-usuario.md)
- Siguiente: [SPDD](02.10-spdd-spec-prototype-driven-development.md)
<!-- nav-guided:end -->

## Objetivo
Definir el producto antes de construir ${ctx.apiResourcePlural}, usando RF/HU, reglas visibles y validacion UX.

## Alternativas
| Alternativa | Descripcion | Trade-off |
|---|---|---|
| Vista operativa densa | Prioriza busqueda, filtros y tabla | eficiente en desktop, requiere cuidado responsive |
| Vista guiada por pasos | Prioriza claridad de flujo | mas simple para usuarios nuevos, menos rapida para operacion |

## Recomendacion
SUPUESTO: usar vista operativa densa para perfiles internos y pasos guiados solo en acciones criticas.

## Salida esperada
- specs/${ctx.feature}/product-design.md.
- problema, objetivo, usuarios, journey, alcance y metricas.
- insumos para SPDD inicial.
`],
    ["docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md", `# SPDD - Spec + Prototype Driven Development - ${ctx.name}

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Spec-Driven Product Design](02.09-spec-driven-product-design.md)
- Siguiente: [Checklist Product Design](02.11-checklist-product-design.md)
<!-- nav-guided:end -->

## Objetivo
Validar ${ctx.name} como experiencia mostrable antes de cerrar SDD o construir front/back.

## Flujo operativo
\`\`\`text
Product Design -> SPDD inicial -> /prototype -> gate-prototype-ready -> validacion humana -> gate-spdd-approved -> /spec
\`\`\`

## Salida esperada
- specs/${ctx.feature}/spdd-frontend.md.
- specs/${ctx.feature}/prototype.md.
- specs/${ctx.feature}/prototype-validation.md.
- specs/${ctx.feature}/ui-test-cases.md.
- specs/${ctx.feature}/traceability.md.

## Regla
prototype.md no equivale a prototipo aprobado. gate-spdd-approved solo puede aprobarse despues de evidencia de prototipo y validacion humana.
`],
    ["docs/fase-2-ux-ui/02.11-checklist-product-design.md", `# Checklist Product Design - ${ctx.name}

[README principal](../../README.md) | [Indice docs](../README.md)

## Checklist
| Evidencia | Estado |
|---|---|
| Problema y objetivo definidos | PENDIENTE |
| Usuarios y roles visibles | PENDIENTE |
| Journey principal documentado | PENDIENTE |
| Alcance y no alcance definidos | PENDIENTE |
| Metricas de exito propuestas | PENDIENTE |
| Supuestos y preguntas abiertas registrados | PENDIENTE |
`],
    ["docs/fase-2-ux-ui/02.12-checklist-spdd.md", `# Checklist SPDD - ${ctx.name}

[README principal](../../README.md) | [Indice docs](../README.md)

## Checklist
| Evidencia | Estado |
|---|---|
| SPDD inicial existe | PENDIENTE |
| Pantallas principales definidas | PENDIENTE |
| Estados loading/empty/error/success/permission denied cubiertos | PENDIENTE |
| Validaciones visibles definidas | PENDIENTE |
| Roles/permisos visibles definidos | PENDIENTE |
| Prototipo HTML5 o Penpot revisable | PENDIENTE |
| prototype.md actualizado | PENDIENTE |
| prototype-validation.md preparado | PENDIENTE |
| gate-prototype-ready evaluado | PENDIENTE |
| gate-spdd-approved con validacion humana | PENDIENTE |
`],
    ["docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md", `# Penpot AI Prototyping - ${ctx.name}

[README principal](../../README.md) | [Indice docs](../README.md)

## Objetivo
Usar Penpot para formalizar prototipos visuales SPDD cuando se requiere colaboracion UX, design system o handoff visual.

## Regla
Un prompt Penpot no equivale a prototipo aprobado. La aprobacion requiere link/export/evidencia y prototype-validation.md actualizado.

## Entradas
- specs/${ctx.feature}/product-design.md.
- specs/${ctx.feature}/spdd-frontend.md.
- specs/${ctx.feature}/ui-test-cases.md.
- ai/prompts/generar-prototipo-penpot-desde-spdd.md.
`],
    ["docs/fase-2-ux-ui/02.14-html5-first-prototyping.md", `# HTML5-first Prototyping - ${ctx.name}

[README principal](../../README.md) | [Indice docs](../README.md)

## Objetivo
Acelerar la validacion UX generando prototipos HTML5 navegables desde SPDD antes de formalizar diseno en Penpot o construir Angular.

## Regla
HTML5 Prototype no reemplaza frontend productivo. Debe abrirse sin build, usar datos mock y cubrir flujo, estados, validaciones, roles, navegacion y feedback UX.

## Salida canonica
- specs/${ctx.feature}/prototype-html5/index.html.
- specs/${ctx.feature}/prototype.md.
- specs/${ctx.feature}/prototype-validation.md.
`],
    [`specs/${ctx.feature}/product-design.md`, `# Product Design - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Problema
SUPUESTO: Los usuarios necesitan gestionar ${ctx.apiResourcePlural} sin depender de procesos manuales o herramientas dispersas.

## Objetivo
SUPUESTO: Proveer acceso centralizado a ${ctx.apiResourcePlural} con filtros, estados y trazabilidad.

## Usuarios
- Operador.
- Aprobador.
- Auditor.

## Journey
Ingresar -> abrir modulo -> filtrar -> revisar detalle -> confirmar accion -> revisar resultado.

## Hipotesis
Un modulo centralizado con estados visibles y prototipo validado reducira busqueda manual y errores operativos.

## Metricas
- tiempo para ubicar informacion,
- consultas resueltas,
- reduccion de solicitudes manuales.
`],
    [`specs/${ctx.feature}/spdd-frontend.md`, `# SPDD Frontend - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Flujo UX
SUPUESTO: Gestion de ${ctx.apiResourcePlural} con filtros, resumen, detalle, confirmacion y seguimiento.

## Pantallas
- Dashboard o lista principal.
- Configuracion de filtros.
- Confirmacion de accion.
- Seguimiento o detalle.
- Historial/auditoria.
- Empty.
- Error.
- Permission denied.

## Estados UI
- Loading.
- Empty.
- Error.
- Success.
- Permission denied.

## Componentes previstos
- AppShell.
- SearchInput.
- FilterSelect.
- DataTable.
- StatusBadge.
- DetailPanel.
- ConfirmModal.
- Toast.
- ProgressIndicator.

## Validaciones visibles
- Campos obligatorios.
- Rangos invalidos.
- Permisos insuficientes.
`],
    [`specs/${ctx.feature}/prototype.md`, `# Prototype - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Herramienta
HTML5-first por defecto. Penpot si se requiere formalizacion visual.

## Ruta HTML5
prototype-html5/index.html

## Link Penpot
PENDIENTE si aplica.

## Pantallas cubiertas
- Dashboard/lista principal.
- Filtros.
- Confirmacion.
- Seguimiento o detalle.
- Historial/auditoria.
- Empty.
- Error.
- Permission denied.

## Estado
PENDIENTE de validacion humana.
`],
    [`specs/${ctx.feature}/prototype-validation.md`, `# Prototype Validation - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Validacion
| Criterio | Estado | Observacion |
|---|---|---|
| Flujo extremo a extremo entendible | PENDIENTE | |
| Estados loading/empty/error/success claros | PENDIENTE | |
| Roles/permisos visibles | PENDIENTE | |
| Validaciones entendibles | PENDIENTE | |
| Navegacion funcional | PENDIENTE | |
| Feedback UX visible | PENDIENTE | |
| Se puede abrir sin build | PENDIENTE | |
| Requiere formalizacion Penpot | PENDIENTE | |

## Decision
PENDIENTE: gate-spdd-approved requiere validacion humana explicita.
`],
    [`specs/${ctx.feature}/ui-test-cases.md`, `# UI Test Cases - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

| Caso | Estado esperado |
|---|---|
| Carga inicial | loading y luego datos mock |
| Filtros sin resultados | empty state y limpiar filtros |
| Error simulado | mensaje seguro y reintento |
| Accion permitida | confirmacion, progreso y success |
| Accion sin permiso | permission denied |
| Validacion incorrecta | mensaje junto al campo |
`],
    [`specs/${ctx.feature}/traceability.md`, `# Traceability - ${ctx.name}

[README principal](../../README.md) | [Specs](../README.md)

## Proposito
Matriz viva que conecta requerimiento, diseno, prototipo, API, datos, codigo,
prueba, estado y evidencia. \`node scripts/ai-framework-agent.mjs sync-memory\`
la parsea para poblar la memoria del agente IA.

## Matriz de trazabilidad

> Reglas de llenado (v12.22+):
> - Usa \`-\` (guion) en \`Codigo\` y \`Test\` mientras esos artefactos NO existan en el repo.
> - Llena el nombre real cuando el archivo/clase/test exista. \`sync-memory\` distingue
>   automaticamente \`planned\` vs \`implemented\` y \`validated\` por columna \`link_status\`.
> - Si pones un nombre que no existe, \`check-trace-drift\` lo reportara como drift.

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/${ctx.apiResourcePlural} | ${ctx.apiResourceName} | - | - | Prototipo en revision | prototype-validation.md |
| RF-02 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/${ctx.apiResourcePlural}/{id} | ${ctx.apiResourceName} | - | - | Prototipo en revision | prototype-validation.md |
| RNF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | 401/403 | rbac | - | - | En diseno SDD | docs/fase-3-arquitectura/03.08-auth-authz.md |

## Gates
| Gate | Estado | Evidencia |
|---|---|---|
| gate-prototype-ready | Pendiente | prototype-validation.md |
| gate-spdd-approved | Pendiente | spdd-frontend.md |

## Decisiones
- El prototipo aprobado alimenta campos, filtros, permisos y estados de error del API contract.

## Preguntas abiertas
- Catalogo final de estados.
`],
    [`ai/prompts/generated/ux-${ctx.feature}.md`, `# Prompt generado - UX ${ctx.name}

## Rol
Actua como product-design-agent y ux-orchestrator-agent.

## Entrada
- docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md
- specs/${ctx.feature}/spec-funcional.md

## Instruccion
Genera o actualiza Product Design y SPDD inicial para ${ctx.name}. Incluye problema, usuarios, journey, alcance, metricas, pantallas, estados UI, roles/permisos, validaciones visibles y entradas para /prototype. No marques gate-spdd-approved sin validacion humana.

## Salida
- specs/${ctx.feature}/product-design.md
- specs/${ctx.feature}/spdd-frontend.md
- specs/${ctx.feature}/prototype.md
- specs/${ctx.feature}/prototype-validation.md
- specs/${ctx.feature}/ui-test-cases.md
- specs/${ctx.feature}/traceability.md
`],
    [`ai/prompts/generated/prototype-html5-${ctx.feature}.md`, `# Prompt generado - Prototype HTML5 ${ctx.name}

## Rol
Actua como UX Designer + Frontend Architect.

## Entrada
- specs/${ctx.feature}/product-design.md
- specs/${ctx.feature}/spdd-frontend.md
- specs/${ctx.feature}/ui-test-cases.md

## Instruccion
Genera un unico index.html navegable, con HTML5 semantico, CSS responsive y JavaScript vanilla. No uses frameworks externos ni backend. Usa datos mock, navegacion simulada, validaciones de formulario, historial, modal, toast, progreso y estados empty/loading/error/success/permission denied.

## Salida
- specs/${ctx.feature}/prototype-html5/index.html
- specs/${ctx.feature}/prototype.md actualizado
- specs/${ctx.feature}/prototype-validation.md preparado
`],
    [`ai/prompts/generated/penpot-${ctx.feature}.md`, `# Prompt generado - Penpot ${ctx.name}

## Rol
Actua como penpot-ai-prototyping-agent.

## Entrada
- specs/${ctx.feature}/product-design.md
- specs/${ctx.feature}/spdd-frontend.md
- specs/${ctx.feature}/ui-test-cases.md

## Instruccion
Genera instrucciones para crear o ajustar un prototipo Penpot de ${ctx.name}. Incluye pantallas, componentes reutilizables, estados UI, interacciones, notas de accesibilidad, datos mock y criterios de validacion. Un prompt Penpot no equivale a prototipo aprobado.

## Salida
- ai/prompts/generated/crear-prototipo-penpot-${ctx.feature}.md
- specs/${ctx.feature}/prototype.md actualizado cuando exista link/export
- specs/${ctx.feature}/prototype-validation.md preparado
`],
    [`ai/tasks/fase-2-ux.task.md`, `# AI Task - Fase 2 UX - ${ctx.name}

## Rol
Actua como product-design-agent, ux-orchestrator-agent y prototype-agent.

## Objetivo
Transformar RF, HU y specs iniciales en Product Design, SPDD inicial y prototipo UX navegable HTML5 o Penpot.

## Lee primero
- [AGENTS.md](../../AGENTS.md)
- [Analisis y requerimientos](../../docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [HTML5-first Prototyping](../../docs/fase-2-ux-ui/02.14-html5-first-prototyping.md)
- [Penpot AI Prototyping](../../docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md)
- [Spec funcional](../../specs/${ctx.feature}/spec-funcional.md)

## Crea o actualiza
- specs/${ctx.feature}/product-design.md
- specs/${ctx.feature}/spdd-frontend.md
- specs/${ctx.feature}/prototype.md
- specs/${ctx.feature}/prototype-validation.md
- specs/${ctx.feature}/ui-test-cases.md
- specs/${ctx.feature}/traceability.md
- specs/${ctx.feature}/prototype-html5/index.html si se requiere validacion rapida
- ai/prompts/generated/ux-${ctx.feature}.md
- ai/prompts/generated/prototype-html5-${ctx.feature}.md
- ai/prompts/generated/penpot-${ctx.feature}.md si se requiere formalizacion visual

## Reglas
- No inventes reglas funcionales.
- Cada pantalla debe indicar actor y objetivo.
- Incluye estados loading, empty, error, success y permission denied.
- Simula roles, permisos, validaciones, datos mock y feedback UX.
- Manten trazabilidad RF/HU/spec -> Product Design -> SPDD -> prototipo.

## Gate
- gate-ux-ready: Product Design y SPDD inicial.
- gate-prototype-ready: prototipo revisable.
- gate-spdd-approved: solo con validacion humana del prototipo.

## Resultado esperado
UX listo para validacion humana, prototipo HTML5/Penpot revisable y gates declarados.
`],
  ]);
}
function penpotOperationFiles(ctx) {
  const composeProject = `${ctx.dockerProject}-penpot`;
  return new Map([
    ["ops/prototyping/penpot/README.md", `# Penpot local - Prototipos Fase 2

[README principal](../../../README.md) | [Fase 2 UX](../../../docs/fase-2-ux-ui/README.md)

## Objetivo
Levantar Penpot en Docker para crear y mostrar el prototipo clickable de ${ctx.name} sin depender de SaaS externo.

## Fuente oficial
El \`docker-compose.yaml\` se descarga desde la ruta oficial documentada por Penpot:

\`\`\`text
https://raw.githubusercontent.com/penpot/penpot/main/docker/images/docker-compose.yaml
\`\`\`

Documentacion oficial:

\`\`\`text
https://help.penpot.app/technical-guide/getting-started/docker/
\`\`\`

## Requisitos
- Docker instalado.
- Docker Compose disponible como \`docker compose\`.
- Puerto local \`9001\` libre.
- Acceso a internet la primera vez para descargar el compose y las imagenes.

## Arranque local
\`\`\`powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\\ops\\prototyping\\penpot\\start-penpot.ps1
\`\`\`

Penpot queda disponible en:

\`\`\`text
http://localhost:9001
\`\`\`

## Estado
\`\`\`powershell
.\\ops\\prototyping\\penpot\\status-penpot.ps1
\`\`\`

## Apagado
\`\`\`powershell
.\\ops\\prototyping\\penpot\\stop-penpot.ps1
\`\`\`

## Uso en Fase 2
1. Abrir http://localhost:9001.
2. Crear cuenta local si la instancia lo solicita, o usar el script operacional:

\`\`\`powershell
$password = Read-Host "Clave Penpot local" -AsSecureString
.\\ops\\prototyping\\penpot\\create-prototype-file.ps1 -Email demo@local.penpot -Password $password -CreateProfile
\`\`\`

3. Crear archivo Penpot: ${ctx.name}.
4. Construir pantallas desde:
   - specs/${ctx.feature}/product-design.md
   - specs/${ctx.feature}/spdd-frontend.md
   - specs/${ctx.feature}/ui-test-cases.md
   - ai/prompts/generated/penpot-${ctx.feature}.md
5. El enlace o evidencia Penpot se registra en specs/${ctx.feature}/prototype.md.

## Evidencia para Gate Prototype Ready
- Penpot accesible en http://localhost:9001 o URL final.
- Archivo Penpot creado.
- Libreria de componentes reutilizables creada.
- Pantallas minimas cubiertas.
- Checklist de validacion completo.
- Trazabilidad hacia RF/HU/specs y prototype-validation.md.
- Evidencia operativa registrada en ops/prototyping/penpot/evidence-template.md o un archivo fechado.
`],
    ["ops/prototyping/penpot/create-prototype-file.ps1", `param(
  [string]$BaseUrl = "http://127.0.0.1:9001",
  [string]$Email,
  [securestring]$Password,
  [string]$Fullname = "Demo ${ctx.name}",
  [switch]$CreateProfile,
  [string]$BackendContainer = "${composeProject}-penpot-backend-1",
  [string]$ProjectName = "${ctx.name} - Fase 2 UX",
  [string]$FileName = "${ctx.feature} - Prototipo UX"
)

$ErrorActionPreference = "Stop"

function ConvertFrom-SecureStringToPlainText {
  param([securestring]$Value)
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Get-TransitUuid {
  param(
    [string]$Content,
    [string]$Key
  )
  $pattern = "~:$Key" + '"[,]"~u([^"]+)'
  $match = [regex]::Match($Content, $pattern)
  if (-not $match.Success) {
    throw "No se pudo extraer $Key de la respuesta Penpot."
  }
  $match.Groups[1].Value
}

if (-not $Email) {
  throw "Parametro requerido: -Email"
}

if (-not $Password) {
  $Password = Read-Host "Clave Penpot local" -AsSecureString
}

$plainPassword = ConvertFrom-SecureStringToPlainText -Value $Password

try {
  if ($CreateProfile) {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
      throw "Docker no esta disponible en PATH."
    }

    try {
      docker exec $BackendContainer ./manage.py create-profile --fullname $Fullname --email $Email --password $plainPassword --skip-tutorial --skip-walkthrough
    } catch {
      Write-Warning "No se pudo crear el perfil. Si ya existe, se continuara con login. Detalle: $($_.Exception.Message)"
    }
  }

  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loginBody = @{ email = $Email; password = $plainPassword } | ConvertTo-Json -Compress
  Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/rpc/command/login-with-password" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $session | Out-Null

  $profileResponse = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/rpc/command/get-profile" -Method Get -WebSession $session
  $profileText = [System.Text.Encoding]::UTF8.GetString($profileResponse.Content)
  $teamId = Get-TransitUuid -Content $profileText -Key "default-team-id"

  $projectBody = @{ name = $ProjectName; teamId = $teamId } | ConvertTo-Json -Compress
  $projectResponse = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/rpc/command/create-project" -Method Post -Body $projectBody -ContentType "application/json" -WebSession $session
  $projectText = [System.Text.Encoding]::UTF8.GetString($projectResponse.Content)
  $projectId = Get-TransitUuid -Content $projectText -Key "id"

  $fileBody = @{ name = $FileName; projectId = $projectId; isShared = $true } | ConvertTo-Json -Compress
  $fileResponse = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/rpc/command/create-file" -Method Post -Body $fileBody -ContentType "application/json" -WebSession $session
  $fileText = [System.Text.Encoding]::UTF8.GetString($fileResponse.Content)
  $fileId = Get-TransitUuid -Content $fileText -Key "id"

  $workspaceUrl = "$BaseUrl/#/workspace/$fileId"
  $dashboardUrl = "$BaseUrl/#/dashboard/recent?team-id=$teamId"
  $date = Get-Date -Format "yyyy-MM-dd"
  $evidencePath = Join-Path $PSScriptRoot "evidence-$date.md"

  $evidence = @"
# Evidencia operativa Penpot - $date

[README Penpot local](README.md) | [Checklist](prototype-checklist.md)

## Contexto
- Proyecto: ${ctx.name}
- Feature: ${ctx.feature}
- Fecha: $date
- Responsable: proveedor IA / agente interno

## Ejecucion
- Base URL: $BaseUrl
- Usuario local: $Email
- Proyecto Penpot: $ProjectName
- Archivo Penpot: $FileName

## Identificadores
- Team ID: $teamId
- Project ID: $projectId
- File ID: $fileId
- Workspace URL: $workspaceUrl
- Dashboard URL: $dashboardUrl

## Resultado
- Penpot local accesible: si
- Archivo de prototipo creado: si
- Componentes reutilizables verificados: pendiente
- Frames y conexiones del prototipo: pendiente de construir desde SPDD
- Link/export registrado en prototype.md: pendiente

## Observaciones
- La clave no se guarda en este archivo.
- El archivo Penpot queda listo para poblar frames, componentes reutilizables e interacciones desde la documentacion de Fase 2.
"@

  Set-Content -LiteralPath $evidencePath -Value $evidence -Encoding UTF8

  Write-Host "Penpot project id: $projectId"
  Write-Host "Penpot file id: $fileId"
  Write-Host "Workspace: $workspaceUrl"
  Write-Host "Dashboard: $dashboardUrl"
  Write-Host "Evidencia: $evidencePath"
} finally {
  $plainPassword = $null
}
`],
    ["ops/prototyping/penpot/.env.example", `# Version de imagen Penpot.
# Para demos locales puede dejarse latest. Para entornos compartidos, fijar una version concreta.
PENPOT_VERSION=latest

# URL publica local recomendada por el runbook.
PENPOT_PUBLIC_URI=http://localhost:9001
`],
    ["ops/prototyping/penpot/start-penpot.ps1", `$ErrorActionPreference = "Stop"

$composeUrl = "https://raw.githubusercontent.com/penpot/penpot/main/docker/images/docker-compose.yaml"
$composeFile = Join-Path $PSScriptRoot "docker-compose.yaml"
$envExample = Join-Path $PSScriptRoot ".env.example"
$envFile = Join-Path $PSScriptRoot ".env"
$projectName = "${composeProject}"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker no esta disponible en PATH."
}

if (-not (Test-Path -LiteralPath $composeFile)) {
  Write-Host "Descargando docker-compose.yaml oficial de Penpot..."
  Invoke-WebRequest -Uri $composeUrl -OutFile $composeFile
}

if (-not (Test-Path -LiteralPath $envFile)) {
  Copy-Item -LiteralPath $envExample -Destination $envFile
}

docker compose --env-file $envFile -p $projectName -f $composeFile up -d

Write-Host "Penpot iniciado: http://localhost:9001"
Write-Host "Proyecto Docker Compose: $projectName"
`],
    ["ops/prototyping/penpot/stop-penpot.ps1", `$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.yaml"
$envExample = Join-Path $PSScriptRoot ".env.example"
$envFile = Join-Path $PSScriptRoot ".env"
$projectName = "${composeProject}"

if (-not (Test-Path -LiteralPath $composeFile)) {
  Write-Host "No existe docker-compose.yaml local. Nada que apagar."
  exit 0
}

if (-not (Test-Path -LiteralPath $envFile)) {
  Copy-Item -LiteralPath $envExample -Destination $envFile
}

docker compose --env-file $envFile -p $projectName -f $composeFile down
Write-Host "Penpot detenido."
`],
    ["ops/prototyping/penpot/status-penpot.ps1", `$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.yaml"
$envExample = Join-Path $PSScriptRoot ".env.example"
$envFile = Join-Path $PSScriptRoot ".env"
$projectName = "${composeProject}"

if (Test-Path -LiteralPath $composeFile) {
  if (-not (Test-Path -LiteralPath $envFile)) {
    Copy-Item -LiteralPath $envExample -Destination $envFile
  }
  docker compose --env-file $envFile -p $projectName -f $composeFile ps
} else {
  Write-Host "docker-compose.yaml aun no fue descargado."
}

try {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:9001" -UseBasicParsing -TimeoutSec 5
  Write-Host "Penpot HTTP status: $($response.StatusCode)"
} catch {
  Write-Host "Penpot no responde todavia en http://127.0.0.1:9001"
}
`],
    ["ops/prototyping/penpot/prototype-checklist.md", `# Checklist de prototipo Penpot - Fase 2

[README Penpot local](README.md) | [Prototype](../../../specs/${ctx.feature}/prototype.md)

## Identificacion
- Proyecto: ${ctx.name}
- Feature: ${ctx.feature}
- URL Penpot: pendiente
- Fecha: pendiente

## Pantallas
| Pantalla | Estado |
|---|---|
| Login OIDC | pendiente |
| ${ctx.name} | pendiente |
| Detalle de expediente | pendiente |
| Sin resultados | pendiente |
| Error de servicio | pendiente |
| Acceso denegado | pendiente |

## Validacion
| Criterio | Estado |
|---|---|
| Usa Product Design y SPDD como fuente | pendiente |
| Respeta criterios UX/UI y accesibilidad | pendiente |
| Usa libreria de componentes reutilizables | pendiente |
| Cubre variantes y estados de componentes | pendiente |
| Mantiene nombres consistentes con el prototipo validado | pendiente |
| Link/export registrado en prototype.md | pendiente |
| Cubre happy path | pendiente |
| Cubre empty/error/unauthorized | pendiente |
| Preguntas abiertas registradas | pendiente |

## Evidencia
- Enlace o captura del archivo Penpot: pendiente.
- Participantes de validacion: pendiente.
- Ajustes solicitados: pendiente.
`],
    ["ops/prototyping/penpot/evidence-template.md", `# Evidencia operativa Penpot - Fase 2

[README Penpot local](README.md) | [Checklist](prototype-checklist.md)

## Contexto
- Proyecto: ${ctx.name}
- Feature: ${ctx.feature}
- Fecha: pendiente
- Responsable: pendiente

## Ejecucion
- Comando: .\\ops\\prototyping\\penpot\\start-penpot.ps1
- Compose project: ${composeProject}
- URL local: http://localhost:9001
- Estado HTTP: pendiente

## Contenedores esperados
- penpot-frontend
- penpot-backend
- penpot-exporter
- penpot-postgres
- penpot-valkey
- penpot-mailcatch

## Resultado
- Penpot local accesible: pendiente
- Archivo de prototipo creado: pendiente
- Enlace o captura registrado: pendiente
- Componentes reutilizables verificados: pendiente
- Link/export registrado en prototype.md: pendiente

## Observaciones
- Pendiente.
`],
  ]);
}

function updateTsconfigForUx(projectPath, ctx) {
  const tsconfigPath = path.join(projectPath, "frontend", "tsconfig.base.json");
  if (!fs.existsSync(tsconfigPath)) return;
  const json = readJson(tsconfigPath);
  json.compilerOptions ??= {};
  json.compilerOptions.paths ??= {};
  json.compilerOptions.paths[`@${ctx.webPackage}/feature-${ctx.apiResourcePlural}`] = [
    "libs/feature-${ctx.apiResourcePlural}/src/index.ts",
  ];
  fs.writeFileSync(tsconfigPath, `${JSON.stringify(json, null, 2)}\n`, "utf8");

  const specConfigPath = path.join(projectPath, "frontend", "apps", "web", "tsconfig.spec.json");
  if (!fs.existsSync(specConfigPath)) return;
  const specJson = readJson(specConfigPath);
  specJson.include ??= [];
  if (!specJson.include.includes("src/**/*.spec.ts")) {
    specJson.include.unshift("src/**/*.spec.ts");
  }
  fs.writeFileSync(specConfigPath, `${JSON.stringify(specJson, null, 2)}\n`, "utf8");
}

function hydrateUxProjectArtifacts(projectPath, args = {}) {
  const ctx = generatedProjectContext(projectPath, args);
  const files = new Map([...uxPhaseFiles(ctx), ...penpotOperationFiles(ctx)]);
  for (const [relativePath, content] of html5PrototypeFiles(ctx)) {
    files.set(relativePath, content);
  }
  for (const [relativePath, content] of files) {
    writeFileEnsured(path.join(projectPath, ...relativePath.split("/")), content);
  }
  return files.size;
}

function executeUx(args, root) {
  const projectPath = projectPathFromUxArgs(args, root);
  if (!projectPath) {
    console.error("Error: --project o --dest es requerido");
    return 1;
  }
  if (!fs.existsSync(projectPath)) {
    console.error(`Error: no existe proyecto: ${projectPath}`);
    return 1;
  }

  const artifactCount = hydrateUxProjectArtifacts(projectPath, args);

  console.log(`OK. Artefactos UX y prototipo HTML5 generados: ${artifactCount}`);

  const docsStatus = runNode(root, "ci/scripts/check-docs.mjs", [projectPath]);
  if (docsStatus !== 0) return docsStatus;
  const instantiationStatus = runNode(root, "ci/scripts/check-template-instantiation.mjs", [
    "--mode",
    "instantiated",
    "--root",
    projectPath,
  ]);
  if (instantiationStatus !== 0) return instantiationStatus;

  const documentationFindings = validateGeneratedDocumentation(projectPath);
  if (documentationFindings.length > 0) {
    console.error("Error: documentacion generada aun contiene senales de plantilla:");
    for (const finding of documentationFindings) console.error(`- ${finding}`);
    return 1;
  }

  console.log("OK. Fase 2 UX ejecutada y validada.");
  return 0;
}

function validateCreateArgs(args, root) {
  const errors = [];
  if (!args.stack) errors.push("--stack es requerido");
  if (args.stack && !SUPPORTED_STACKS.has(args.stack)) errors.push(`stack no soportado: ${args.stack}`);
  if (!args.config) errors.push("--config es requerido");
  if (!args.dest) errors.push("--dest es requerido");
  const configPath = resolveInputPath(root, args.config);
  const destPath = resolveInputPath(root, args.dest);
  if (configPath && !fs.existsSync(configPath)) errors.push(`no existe config: ${configPath}`);
  if (destPath && path.resolve(destPath) === root) errors.push("la ruta destino no puede ser el template");
  return { errors, configPath, destPath };
}

function runNode(root, scriptRelative, scriptArgs) {
  const result = spawnSync(process.execPath, [path.join(root, scriptRelative), ...scriptArgs], {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  return result.status ?? 1;
}

function printCreatePlan(args, root) {
  const { errors, configPath, destPath } = validateCreateArgs(args, root);
  console.log("# Plan de creacion de proyecto real");
  console.log("");
  console.log("Documentacion minima a leer:");
  for (const doc of REQUIRED_CREATE_DOCS) {
    console.log(`- ${doc}${fs.existsSync(path.join(root, doc)) ? "" : " (faltante)"}`);
  }
  console.log("");
  if (errors.length > 0) {
    console.log("Bloqueantes:");
    for (const error of errors) console.log(`- ${error}`);
    return 1;
  }

  console.log(`Stack: ${args.stack}`);
  console.log(`Config: ${configPath}`);
  console.log(`Destino: ${destPath}`);
  if (args.source) console.log(`Fuente de negocio: ${resolveInputPath(root, args.source)}`);
  if (args["refresh-existing"]) {
    console.log("Modo: actualizar proyecto existente sin recrear scaffolding");
  }
  console.log("");
  console.log("Comandos:");
  console.log(`node scripts/validate-template-config.mjs --config "${configPath}"`);
  const flags = [
    "scripts/new-service.mjs",
    "--stack", args.stack,
    "--config", `"${configPath}"`,
    "--dest", `"${destPath}"`,
  ];
  if (args["skip-smoke"]) flags.push("--skip-smoke");
  if (args["no-git"]) flags.push("--no-git");
  if (args["refresh-existing"]) {
    console.log(
      `node scripts/ai-framework-agent.mjs create-project --stack ${args.stack} --config "${configPath}" --dest "${destPath}" --refresh-existing`
    );
  } else {
    console.log(`node ${flags.join(" ")}`);
  }
  console.log("");
  console.log("Gates:");
  console.log("- gate-0-1 para fase 0-1");
  console.log("- gate-2-3 si se completa arquitectura inicial");
  console.log("");
  console.log("Red flags:");
  if (fs.existsSync(destPath)) console.log("- La ruta destino ya existe; no ejecutes create-project sin resolverlo.");
  console.log("- La config debe estar instanciada al dominio real.");
  console.log("- El proyecto generado debe validarse con check-docs y check-template-instantiation.");
  return 0;
}

function readDocumentInput(args, root) {
  const chunks = [];
  if (args.intent) chunks.push(args.intent);
  if (args.source) {
    const sourcePath = resolveInputPath(root, args.source);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`No existe source: ${sourcePath}`);
    }
    chunks.push(fs.readFileSync(sourcePath, "utf8"));
  }
  const positional = args._.slice(1).join(" ");
  if (positional) chunks.push(positional);
  return chunks.join("\n\n").trim();
}

function artifactsForRoute(route) {
  if (route.intent === "requerimiento claro a specs" || route.intent === "feature a specs") {
    return [
      "specs/<nnn-feature>/spec-funcional.md",
      "specs/<nnn-feature>/spec-tecnica.md",
      "specs/<nnn-feature>/spec-tareas.md",
    ];
  }
  if (route.intent === "decision tecnica" || route.intent === "arquitectura") {
    return [
      "docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md",
      "docs/fase-3-arquitectura/adr/ADR-XXX-nombre-corto.md",
      "likec4/* si la decision cambia componentes o relaciones",
    ];
  }
  if (route.intent === "QA y evidencia") {
    return ["qa/fase-6-qa/plan-pruebas.md", "qa/fase-6-qa/evidencias/", "qa/fase-6-qa/defectos.md"];
  }
  if (route.intent === "release/deploy") {
    return ["ops/fase-7-deploy/runbook.md", "ops/fase-7-deploy/rollback.md", "releases/"];
  }
  if (route.intent === "operacion") {
    return ["ops/fase-8-operacion/operacion.md", "ops/fase-8-operacion/metricas.md", "docs/fase-0-iniciacion/00.02-roadmap.md"];
  }
  return [
    "docs/fase-0-iniciacion/00.01-vision-proyecto.md",
    "docs/fase-0-iniciacion/00.02-roadmap.md",
    "docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md",
  ];
}

function questionsForRoute(route) {
  if (route.intent === "requerimiento claro a specs" || route.intent === "feature a specs") {
    return [
      "Que campos o datos son obligatorios?",
      "Que reglas de negocio aplican?",
      "Quien puede ejecutar o ver esta capacidad?",
      "Que estados, errores o limites deben considerarse?",
      "Cuales son los criterios de aceptacion?",
    ];
  }
  if (route.intent === "decision tecnica" || route.intent === "arquitectura") {
    return [
      "Que alternativas se compararon?",
      "Que restricciones de equipo, operacion o infraestructura influyen?",
      "Que trade-offs se aceptan?",
      "La decision afecta despliegue, seguridad, datos o costos?",
    ];
  }
  return [
    "Cual es el problema actual?",
    "Quienes son los usuarios o actores?",
    "Que resultado de negocio se espera?",
    "Que restricciones existen?",
    "Que queda fuera del alcance?",
  ];
}

function printDocumentPlan(args, root) {
  const input = readDocumentInput(args, root);
  if (!input) {
    console.error("Error: usa --intent <texto> o --source <archivo>");
    return 1;
  }
  const route = routeIntent(input);
  const source = args.source ? normalizeRelative(root, resolveInputPath(root, args.source)) : "texto directo";
  console.log("# /document");
  console.log("");
  console.log(`Fase detectada: ${route.phase}`);
  console.log(`Modo recomendado: ${route.mode ?? "exploratorio"}`);
  console.log(`Command sugerido: ${route.command}`);
  console.log(`Skill: ${route.skill ?? "ai/skills/documentation-orchestration.skill.md"}`);
  console.log(`Reference: ${route.reference ?? "ai/references/documentation-orchestration.md"}`);
  console.log(`Gate aplicable: ${route.gate}`);
  console.log(`Fuente: ${source}`);
  console.log("");
  console.log("Artefactos a crear o actualizar:");
  for (const artifact of artifactsForRoute(route)) console.log(`- ${artifact}`);
  console.log("");
  console.log("Preguntas necesarias:");
  for (const question of questionsForRoute(route)) console.log(`- ${question}`);
  console.log("");
  console.log("Trazabilidad esperada:");
  console.log(`- Entrada -> artefactos destino`);
  console.log(`- Supuestos y preguntas abiertas visibles`);
  console.log(`- Gate ${route.gate} registrado como evidencia de revision`);
  console.log("");
  console.log("Siguiente paso:");
  console.log("- Completar las preguntas bloqueantes y actualizar los artefactos destino en rutas canonicas.");
  return 0;
}

async function createProject(args, root) {
  const { errors, configPath, destPath } = validateCreateArgs(args, root);
  if (errors.length > 0) {
    for (const error of errors) console.error(`Error: ${error}`);
    return 1;
  }
  const refreshExisting = Boolean(args["refresh-existing"]);
  const destExists = fs.existsSync(destPath);
  if (refreshExisting && !destExists) {
    console.error(`Error: --refresh-existing requiere una ruta destino existente: ${destPath}`);
    return 1;
  }
  if (destExists) {
    const entries = fs.readdirSync(destPath);
    if (refreshExisting) {
      console.log(`==> Actualizando proyecto existente sin recrear scaffolding: ${destPath}`);
    } else if (!args.force || entries.length > 0) {
      console.error(`Error: la ruta destino ya existe: ${destPath}`);
      return 1;
    } else {
      console.log(`==> Reutilizando ruta destino vacia por --force: ${destPath}`);
    }
  }

  console.log("==> Inicializando memoria e indexando documentacion");
  const db = await ensureDatabase(root, dbPathFromArgs(args, root));
  indexDocuments(root, db);
  db.close();

  console.log("==> Validando config");
  const validationStatus = runNode(root, "scripts/validate-template-config.mjs", ["--config", configPath]);
  if (validationStatus !== 0) return validationStatus;

  if (refreshExisting) {
    console.log("==> Omitiendo scaffolding; se actualizan artefactos documentales y UX");
  } else {
    console.log("==> Creando proyecto real");
    const newServiceArgs = ["--stack", args.stack, "--config", configPath, "--dest", destPath];
    if (args["skip-smoke"]) newServiceArgs.push("--skip-smoke");
    if (args["no-git"]) newServiceArgs.push("--no-git");
    if (args.force) newServiceArgs.push("--allow-existing-empty");
    const createStatus = runNode(root, "scripts/new-service.mjs", newServiceArgs);
    if (createStatus !== 0) return createStatus;
  }

  console.log("==> Hidratando documentacion real del proyecto");
  const hydratedCount = hydrateRealProjectDocumentation(destPath, readJson(configPath), args.stack);
  console.log(`OK. Artefactos documentales creados/actualizados: ${hydratedCount}`);

  console.log("==> Hidratando Fase 2 UX, Penpot y prototipo HTML5 inicial");
  const uxCount = hydrateUxProjectArtifacts(destPath, { feature: args.feature });
  console.log(`OK. Artefactos UX/Penpot/HTML5 iniciales creados/actualizados: ${uxCount}`);


  console.log("==> Validando documentacion generada");
  const docsStatus = runNode(root, "ci/scripts/check-docs.mjs", [destPath]);
  if (docsStatus !== 0) return docsStatus;

  console.log("==> Validando instanciacion del proyecto");
  const instantiationStatus = runNode(root, "ci/scripts/check-template-instantiation.mjs", [
    "--mode",
    "instantiated",
    "--root",
    destPath,
  ]);
  if (instantiationStatus !== 0) return instantiationStatus;

  const documentationFindings = validateGeneratedDocumentation(destPath);
  if (documentationFindings.length > 0) {
    console.error("Error: documentacion generada aun contiene senales de plantilla:");
    for (const finding of documentationFindings) console.error(`- ${finding}`);
    return 1;
  }

  console.log("OK. Proyecto real creado con documentacion canonica validada.");
  return 0;
}

// v12.45 (D1/D2/D3): cuerpo de `status` extraido a una funcion para que
// `--watch` lo invoque en loop y `--fail-on-drift` / `--fix` puedan agregar
// salidas y exit codes sin duplicar la logica.
async function runStatusBody(args, root, dbPath) {
  const db = await ensureDatabase(root, dbPath);
  const counts = {
    documents: countRows(db, "ai_documents"),
    chunks: countRows(db, "ai_document_chunks"),
    traceLinks: countRows(db, "ai_trace_links"),
    gateRuns: countRows(db, "ai_gate_runs"),
    evidence: countRows(db, "ai_evidence_items"),
    decisions: countRows(db, "ai_decisions"),
    openQuestions: countRows(db, "ai_open_questions"),
    sessionEvents: countRows(db, "ai_session_events"),
    embeddings: countRows(db, "ai_chunk_embeddings"),
  };
  const fresh = memoryFreshness(root, db);
  const embeddingDrift = Math.max(0, counts.chunks - counts.embeddings);
  const displayStatusBreakdown = {};
  try {
    for (const r of db.prepare(`SELECT display_status, COUNT(*) AS n FROM ai_trace_links GROUP BY display_status`).all()) {
      displayStatusBreakdown[r.display_status || "(null)"] = r.n;
    }
  } catch { /* tabla puede no tener la columna en DB muy vieja */ }
  // v12.45 (D3): --fix corre embed-docs cuando hay drift de embeddings.
  let fixedDrift = 0;
  if (args.fix && embeddingDrift > 0) {
    console.log(`[status --fix] detectado drift de embeddings (${embeddingDrift}); corriendo embed-docs...`);
    try {
      const before = counts.embeddings;
      embedDocuments(db);
      const after = countRows(db, "ai_chunk_embeddings");
      fixedDrift = after - before;
      counts.embeddings = after;
      console.log(`[status --fix] embed-docs OK: +${fixedDrift} embeddings nuevos.`);
    } catch (err) {
      console.error(`[status --fix] embed-docs fallo: ${err.message || err}`);
    }
  }
  // Recompute after --fix.
  const finalDrift = Math.max(0, counts.chunks - counts.embeddings);
  // v12.40: modo --json estructurado para integraciones (CI, dashboards, otros agentes).
  if (args.json) {
    const payload = {
      dbPath,
      fts5: hasFtsTable(db),
      counts,
      freshness: {
        stale: fresh.stale,
        lastIndexed: fresh.lastIndexed,
        newestSource: fresh.newestSource,
        deltaMs: fresh.deltaMs ?? null,
        toleranceMs: fresh.toleranceMs ?? null,
      },
      embeddings: {
        total: counts.embeddings,
        chunks: counts.chunks,
        drift: finalDrift,
        fixedDrift,
      },
      traceLinks: {
        total: counts.traceLinks,
        byDisplayStatus: displayStatusBreakdown,
      },
    };
    console.log(JSON.stringify(payload, null, 2));
    db.close();
    // v12.45 (D1): --fail-on-drift -> exit 1 si stale o drift > 0 (post-fix).
    if (args["fail-on-drift"] && (fresh.stale || finalDrift > 0)) return 1;
    return 0;
  }
  console.log(`DB: ${dbPath}`);
  console.log(`FTS5: ${hasFtsTable(db) ? "activo" : "no disponible"}`);
  console.log(`Documentos:      ${counts.documents}`);
  console.log(`Chunks:          ${counts.chunks}`);
  console.log(`Trace links:     ${counts.traceLinks}`);
  console.log(`Gate runs:       ${counts.gateRuns}`);
  console.log(`Evidence items:  ${counts.evidence}`);
  console.log(`Decisions:       ${counts.decisions}`);
  console.log(`Open questions:  ${counts.openQuestions}`);
  console.log(`Session events:  ${counts.sessionEvents}`);
  console.log(`Embeddings:      ${counts.embeddings}${finalDrift > 0 ? ` (DRIFT: ${finalDrift} chunks sin embedding)` : ""}`);
  if (fresh.newestSource) {
    const tag = fresh.stale ? "STALE" : "fresca";
    let deltaStr = "";
    if (fresh.deltaMs != null && fresh.deltaMs > 1000) {
      deltaStr = ` · delta +${Math.round(fresh.deltaMs / 1000)}s (tolerancia ${Math.round(fresh.toleranceMs / 1000)}s)`;
    }
    console.log(`Freshness:       ${tag} (ultimo indexado ${fresh.lastIndexed || "nunca"}; markdown mas reciente ${fresh.newestSource})${deltaStr}`);
    if (fresh.stale) {
      console.log("  Ejecuta: npm run memory:sync");
    }
  }
  if (finalDrift > 0) {
    console.log(`Embeddings drift: ${finalDrift} chunks sin embedding.`);
    console.log("  Ejecuta: npm run memory:embed   (o corre 'memory:sync' que ya lo hace al final)");
  }
  db.close();
  // v12.45 (D1): exit code 1 si stale o drift cuando --fail-on-drift.
  if (args["fail-on-drift"] && (fresh.stale || finalDrift > 0)) {
    console.error("");
    console.error("FAIL: --fail-on-drift detecto STALE o drift de embeddings.");
    return 1;
  }
  return 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (args.help || !command) {
    usage();
    return 0;
  }

  const root = rootFromArgs(args);
  const dbPath = dbPathFromArgs(args, root);

  if (command === "init-memory") {
    const db = await ensureDatabase(root, dbPath);
    db.close();
    console.log(`OK. Memoria SQLite inicializada: ${dbPath}`);
    return 0;
  }

  if (command === "index-docs") {
    const db = await ensureDatabase(root, dbPath);
    const result = indexDocuments(root, db, { force: Boolean(args.force) });
    db.close();
    console.log(`OK. Documentos indexados: ${result.indexed}. Sin cambios: ${result.skipped}. FTS5: ${result.fts ? "si" : "no"}. DB: ${dbPath}`);
    return 0;
  }

  if (command === "sync-memory") {
    const db = await ensureDatabase(root, dbPath);
    const counts = syncMemory(root, db);
    db.close();
    console.log(`OK. Memoria estructurada sincronizada desde Markdown (${counts.files} archivos). DB: ${dbPath}`);
    console.log(`  Trace links:     ${counts.traceLinks}`);
    console.log(`  Gate runs:       ${counts.gateRuns}`);
    console.log(`  Evidence items:  ${counts.evidence}`);
    console.log(`  Decisions:       ${counts.decisions}`);
    console.log(`  Open questions:  ${counts.openQuestions}`);
    console.log(`  Session events:  ${counts.sessionEvents}`);
    return 0;
  }

  if (command === "embed-docs") {
    const db = await ensureDatabase(root, dbPath);
    const result = embedDocuments(db, { force: Boolean(args.force) });
    db.close();
    console.log(`OK. Embeddings locales generados: ${result.embedded}. Total en BD: ${result.total}. Modelo: ${result.model} (dim ${result.dim}). DB: ${dbPath}`);
    if (result.embedded === 0 && result.total === 0) {
      console.log("  Ejecuta primero index-docs para tener chunks que embeber.");
    }
    return 0;
  }

  if (command === "memory-report") {
    const db = await ensureDatabase(root, dbPath);
    const { outPath, snapshot } = writeMemoryReport(root, db, dbPath);
    db.close();
    console.log(`OK. Reporte HTML estatico de memoria generado: ${outPath}`);
    console.log(`  Trace links ${snapshot.stats.traceLinks} · Gate runs ${snapshot.stats.gateRuns} · Decisiones ${snapshot.stats.decisions} · Preguntas ${snapshot.stats.openQuestions} · Documentos ${snapshot.stats.documents}`);
    console.log("  Abrelo en el navegador. Es autocontenido: no requiere servidor.");
    return 0;
  }

  if (command === "memory-serve") {
    const db = await ensureDatabase(root, dbPath);
    // v12.55: aceptar puerto de 3 formas (orden de prioridad):
    //   1. --port N            (canonico: `node scripts/... memory-serve --port 4320`)
    //   2. positional NNNN     (si npm parsea `npm run memory:serve --port 4320` y lo pasa como positional `4320`)
    //   3. env MEMORY_SERVE_PORT
    //   4. default 4319
    // Tambien soporta --auto-port para buscar siguiente puerto libre si el preferido esta ocupado.
    let port = Number(args.port);
    if (!port) {
      const positional = process.argv.slice(2).find((a, i, arr) => i > 0 && /^\d{2,5}$/.test(a) && arr[i - 1] === "memory-serve");
      if (positional) port = Number(positional);
    }
    if (!port && process.env.MEMORY_SERVE_PORT) port = Number(process.env.MEMORY_SERVE_PORT);
    if (!port) port = 4319;
    const autoPort = !!args["auto-port"];
    let lastError = null;
    let actualPort = port;
    let maxAttempts = autoPort ? 20 : 1;
    while (maxAttempts > 0) {
      try {
        await serveMemory(root, db, dbPath, actualPort);
        break; // exito
      } catch (e) {
        lastError = e;
        if (e?.code === "EADDRINUSE" && autoPort) {
          actualPort += 1;
          maxAttempts -= 1;
          continue;
        }
        // Sin auto-port o error distinto: imprimir mensaje util.
        if (e?.code === "EADDRINUSE") {
          console.error(`\n✗ Puerto ${actualPort} ya esta en uso.\n`);
          console.error(`Soluciones:`);
          console.error(`  1. Usar otro puerto:   node scripts/ai-framework-agent.mjs memory-serve --port ${actualPort + 1}`);
          console.error(`     o via npm:          npm run memory:serve -- --port ${actualPort + 1}`);
          console.error(`     (nota: npm exige '--' para pasar args al script)`);
          console.error(`  2. Auto-buscar libre:  node scripts/ai-framework-agent.mjs memory-serve --auto-port`);
          console.error(`  3. Matar el proceso que tiene el puerto:`);
          console.error(`     Windows: netstat -ano | findstr :${actualPort} && taskkill /PID <pid> /F`);
          console.error(`     Linux:   lsof -ti:${actualPort} | xargs kill -9`);
          process.exit(2);
        }
        throw e;
      }
    }
    if (maxAttempts === 0) {
      console.error(`No se encontro puerto libre tras 20 intentos desde ${port}.`);
      process.exit(2);
    }
    console.log(`Memoria del agente disponible en http://localhost:${actualPort} (bind 127.0.0.1)`);
    if (actualPort !== port) console.log(`(auto-port: ${port} estaba ocupado, se uso ${actualPort})`);
    console.log("Endpoints lectura:    /  /api/snapshot  /api/search?q=<texto>  /api/presets  /api/query?preset=<k>&arg=<a>");
    console.log("Endpoints accion:     /api/actions (GET catalogo)  /api/exec (POST {id, arg?})");
    console.log("UI: tab \"Acciones\" para ejecutar validadores, sync, reportes y generadores manualmente.");
    console.log("Ctrl+C para detener.");
    // El servidor mantiene vivo el proceso; no resolvemos para no cerrar.
    await new Promise(() => {});
    return 0;
  }

  if (command === "status") {
    // v12.45 (D2): --watch refresca cada N segundos (default 5, min 2).
    if (args.watch) {
      const interval = Math.max(2, Number(args.watch === true ? 5 : args.watch));
      const onSig = () => { process.stdout.write("\n[status --watch] detenido por SIGINT\n"); process.exit(0); };
      process.once("SIGINT", onSig);
      // eslint-disable-next-line no-constant-condition
      while (true) {
        process.stdout.write("\x1b[2J\x1b[H");
        process.stdout.write(`[status --watch · refresh cada ${interval}s · Ctrl+C para salir]\n\n`);
        await runStatusBody({ ...args, watch: false, "fail-on-drift": false }, root, dbPath);
        await new Promise((r) => setTimeout(r, interval * 1000));
      }
    }
    const exitCode = await runStatusBody(args, root, dbPath);
    return exitCode;
  }

  if (command === "regenerate-context") {
    const db = await ensureDatabase(root, dbPath);
    const result = regenerateAiContext(root, db);
    db.close();
    if (result.updated) {
      console.log(`OK. AI_CONTEXT.md regenerado. Secciones auto: ${result.sections.join(", ")}`);
    } else {
      console.log(`Sin cambios: ${result.reason}`);
    }
    return 0;
  }

  if (command === "context-pack") {
    const topic = args.topic ?? args.query ?? args._.slice(1).join(" ");
    if (!topic) {
      console.error("Error: --topic es requerido (o pasa el tema como argumento posicional)");
      return 1;
    }
    const db = await ensureDatabase(root, dbPath);
    const pack = contextPack(db, topic, Number(args.limit ?? 5));
    db.close();
    console.log(JSON.stringify(pack, null, 2));
    return 0;
  }

  if (command === "memory-query") {
    // v12.45 (E4): si se pasan filtros combinados (--target-type / --display-status /
    // --feature / --source-type / --link-status) y no se pasa --preset, ejecutar
    // un query libre sobre ai_trace_links con AND de todos los filtros provistos.
    const combinedFilters = ["target-type", "display-status", "feature", "source-type", "link-status"]
      .filter((k) => args[k] !== undefined && args[k] !== null && args[k] !== "");
    if (!args.preset && combinedFilters.length > 0) {
      const db = await ensureDatabase(root, dbPath);
      const wheres = [];
      const params = [];
      if (args["target-type"]) { wheres.push("LOWER(target_type) = ?"); params.push(String(args["target-type"]).toLowerCase()); }
      if (args["source-type"]) { wheres.push("LOWER(source_type) = ?"); params.push(String(args["source-type"]).toLowerCase()); }
      if (args["display-status"]) { wheres.push("display_status = ?"); params.push(String(args["display-status"])); }
      if (args["link-status"]) { wheres.push("link_status = ?"); params.push(String(args["link-status"])); }
      if (args["feature"]) { wheres.push("(source_file LIKE ? OR evidence_ref LIKE ?)"); const f = `%${args["feature"]}%`; params.push(f, f); }
      const sql = `SELECT source_type, source_ref, target_type, target_ref, link_status, display_status, evidence_ref, source_file FROM ai_trace_links${wheres.length ? " WHERE " + wheres.join(" AND ") : ""} ORDER BY source_ref, target_type LIMIT ${Math.max(1, Math.min(2000, Number(args.limit || 200)))}`;
      const rows = db.prepare(sql).all(...params);
      db.close();
      if (args.json) {
        console.log(JSON.stringify(rows, null, 2));
      } else {
        console.log(`${rows.length} resultado(s) · filtros: ${combinedFilters.map((k) => k + "=" + args[k]).join(", ")}`);
        for (const r of rows) {
          const ds = r.display_status || "-";
          const ls = r.link_status || "-";
          console.log(`  [${r.target_type}] ${r.source_ref} -> ${r.target_ref}  display=${ds}  link=${ls}  ev=${r.evidence_ref || "-"}`);
        }
      }
      return 0;
    }
    const preset = args.preset ?? args._.slice(1, 2).join("");
    if (!preset) {
      console.error("Error: --preset es requerido (o usa filtros combinados --target-type / --display-status / --feature / --source-type / --link-status). Presets disponibles:");
      for (const p of MEMORY_QUERY_PRESETS) {
        console.error(`  ${p.key.padEnd(24)} ${p.label}${p.requiresArg ? "  (requiere --arg)" : ""}`);
      }
      return 1;
    }
    if (!MEMORY_QUERY_PRESETS.find((p) => p.key === preset)) {
      console.error(`Error: preset desconocido: ${preset}`);
      return 1;
    }
    const db = await ensureDatabase(root, dbPath);
    const arg = args.arg ?? args._.slice(2).join(" ");
    const rows = runMemoryQuery(db, preset, arg);
    db.close();
    if (rows && rows.error) {
      console.error(`Error: ${rows.error}`);
      return 1;
    }
    if (args.json) {
      console.log(JSON.stringify(rows, null, 2));
    } else {
      const byType = {};
      for (const r of rows) byType[r.t] = (byType[r.t] || 0) + 1;
      const summary = Object.entries(byType)
        .map(([t, n]) => `${t}:${n}`)
        .join(", ");
      console.log(`${rows.length} resultado${rows.length === 1 ? "" : "s"} · preset: ${preset}${arg ? " · arg: " + arg : ""}${summary ? " · " + summary : ""}`);
      for (const r of rows) {
        console.log(`  [${r.t}] ${r.ref}${r.path ? "  (" + r.path + ")" : ""}`);
        if (r.excerpt) console.log(`        ${r.excerpt.slice(0, 200)}`);
      }
    }
    return 0;
  }

  if (command === "next-task") {
    const db = await ensureDatabase(root, dbPath);
    const task = nextTask(db);
    db.close();
    console.log(JSON.stringify(task, null, 2));
    return 0;
  }

  if (command === "diff-since") {
    const ref = args.ref ?? args.since ?? args._.slice(1).join(" ");
    if (!ref) {
      console.error("Error: --ref es requerido (commit, branch o fecha ISO)");
      return 1;
    }
    const db = await ensureDatabase(root, dbPath);
    const diff = diffSince(root, db, ref);
    db.close();
    console.log(JSON.stringify(diff, null, 2));
    return 0;
  }

  if (command === "harvest-trace") {
    const db = await ensureDatabase(root, dbPath);
    const result = harvestTraceFromSource(root, db);
    db.close();
    console.log(
      `OK. Trace links cosechados desde source: ${result.count} (${result.files} archivos escaneados). Confianza 0.8 (inferido).`,
    );
    return 0;
  }

  if (command === "check-spec-dedup") {
    const db = await ensureDatabase(root, dbPath);
    const threshold = Number(args.threshold ?? 0.85);
    const pairs = checkSpecDedup(db, threshold);
    db.close();
    if (pairs.length === 0) {
      console.log(`OK. No hay specs cercanas con cosine >= ${threshold}.`);
      return 0;
    }
    console.log(`Pares de specs con cosine >= ${threshold}:`);
    for (const p of pairs.slice(0, 20)) {
      console.log(`  ${p.score.toFixed(3)}  ${p.a.path}  <->  ${p.b.path}`);
      console.log(`    a: ${p.a.heading}`);
      console.log(`    b: ${p.b.heading}`);
    }
    return 0;
  }

  if (command === "watch") {
    const intervalArg = args.interval ? parseIntervalSeconds(args.interval) : 0;
    if (args.interval && !intervalArg) {
      console.error(`Error: --interval invalido (${args.interval}). Usa 30s, 5m, 1h o un numero en segundos.`);
      return 1;
    }
    const result = await watchMemory(root, dbPath, {
      once: Boolean(args.once),
      intervalSec: intervalArg,
    });
    if (args.once) {
      // Modo once: salimos despues del primer sync.
      return 0;
    }
    await new Promise(() => {}); // mantiene vivo el proceso
    return 0;
  }

  if (command === "install-hooks") {
    return installPreCommitHook(root, { uninstall: Boolean(args.uninstall) });
  }

  // v12.89: registra corrida(s) ya terminada(s) en ai_action_runs (la usa `npm run
  // validate` y el git hook para que las corridas de terminal cuenten en el panel).
  //   record-run --action check-trace-drift --exit 0 --ms 1200
  //   record-run --batch <file.json>   (json: [{action, exit, ms}])
  if (command === "record-run") {
    const origin = args.origin ? String(args.origin) : "cli";
    let entries = [];
    if (args.batch) {
      try { entries = JSON.parse(fs.readFileSync(String(args.batch), "utf8")); }
      catch (e) { console.error(`Error: no se pudo leer --batch ${args.batch}: ${e.message}`); return 1; }
      if (!Array.isArray(entries)) { console.error("Error: --batch debe ser un array JSON."); return 1; }
    } else if (args.action || args.id) {
      entries = [{ action: args.action || args.id, exit: args.exit != null ? Number(args.exit) : 0, ms: args.ms != null ? Number(args.ms) : null }];
    } else {
      console.error("Error: usa --action <id> [--exit N --ms D] o --batch <file.json>.");
      return 1;
    }
    const db = await ensureDatabase(root, dbPath);
    let n = 0;
    try {
      for (const e of entries) {
        const aid = e.action || e.actionId;
        if (!aid) continue;
        const id = recordActionRun(db, { actionId: String(aid), exitCode: e.exit != null ? Number(e.exit) : 0, durationMs: e.ms != null ? Number(e.ms) : null, origin });
        if (id) n += 1;
      }
    } finally {
      db.close();
    }
    console.log(`OK. ${n}/${entries.length} corrida(s) registrada(s) en ai_action_runs (origin ${origin}).`);
    return 0;
  }

  if (command === "generate-prototype-hub") {
    const db = await ensureDatabase(root, dbPath);
    try {
      const result = generatePrototypeHub(root, db, { autoOnly: Boolean(args["auto-only"]) });
      console.log(`OK. Hub regenerado: ${result.outPath}`);
      console.log(`  Specs:        ${result.specs}`);
      console.log(`  Prototipos:   ${result.prototypes}`);
      console.log(`  Actores:      ${result.actors}`);
      console.log(`  Estado:       ${result.status}`);
    } finally {
      db.close();
    }
    return 0;
  }

  if (command === "template-drift") {
    const dest = args.project ?? args.dest;
    if (!dest) {
      console.error("Error: --project (o --dest) es requerido");
      return 1;
    }
    const configPath = args.config;
    if (!configPath) {
      console.error("Error: --config es requerido para calcular la version esperada del template");
      return 1;
    }
    const config = readJson(resolveInputPath(root, configPath));
    const stack = args.stack ?? config.stack;
    if (!stack || !SUPPORTED_STACKS.has(stack)) {
      console.error(`Error: --stack invalido o ausente (${stack || "(ninguno)"})`);
      return 1;
    }
    const ctx = projectContext(config, stack);
    const diffs = templateDriftReport(root, dest, ctx);
    const summary = {
      match: diffs.filter((d) => d.status === "match").length,
      drift: diffs.filter((d) => d.status === "drift").length,
      missing: diffs.filter((d) => d.status === "missing").length,
    };
    console.log(`Resumen: match=${summary.match} drift=${summary.drift} missing=${summary.missing}`);
    const drift = diffs.filter((d) => d.status !== "match");
    for (const d of drift) {
      if (d.status === "missing") {
        console.log(`  - missing: ${d.path}`);
      } else {
        console.log(`  - drift:   ${d.path} (delta ${d.delta > 0 ? "+" : ""}${d.delta} lineas)`);
      }
    }
    return 0;
  }

  if (command === "search") {
    if (!args.query && !(args.semantic && args.embedding)) {
      console.error("Error: --query es requerido (o --semantic --embedding con un vector de proveedor)");
      return 1;
    }
    const db = await ensureDatabase(root, dbPath);
    const limit = Number(args.limit ?? 8);
    let rows;
    if (args.semantic) {
      if (args["sqlite-vec-extension"] && args.embedding) {
        // Acelerador opcional: extension nativa sqlite-vec con vector de proveedor.
        rows = semanticSearch(db, root, args, limit);
      } else if (args.embedding) {
        // Vector de consulta de un proveedor externo, cosine en JS.
        const queryVector = parseEmbedding(args.embedding);
        rows = semanticSearchLocal(db, queryVector, { dim: queryVector.length }, limit);
      } else {
        // Por defecto: embedder local determinista sobre --query. Cero dependencias.
        const queryVector = localEmbedding(args.query);
        rows = semanticSearchLocal(db, queryVector, { model: LOCAL_EMBED_MODEL }, limit);
      }
    } else {
      rows = search(db, args.query, limit);
    }
    for (const row of rows) {
      console.log(`- ${row.path} :: ${row.heading} (chunk ${row.chunkId}, score ${row.score})`);
      console.log(`  ${row.excerpt}`);
    }
    if (rows.length === 0) {
      console.log(
        args.semantic
          ? "Sin resultados. Ejecuta index-docs y embed-docs antes de la busqueda semantica."
          : "Sin resultados. Ejecuta primero index-docs o ajusta --query.",
      );
    }
    db.close();
    return 0;
  }

  if (command === "import-embeddings") {
    const db = await ensureDatabase(root, dbPath);
    try {
      const imported = importEmbeddings(db, root, args);
      console.log(`OK. Embeddings importados: ${imported}.`);
    } finally {
      db.close();
    }
    return 0;
  }

  if (command === "route") {
    const intent = args.intent ?? args._.slice(1).join(" ");
    if (!intent) {
      console.error("Error: --intent es requerido");
      return 1;
    }
    console.log(JSON.stringify(routeIntent(intent), null, 2));
    return 0;
  }

  if (command === "document") {
    return printDocumentPlan(args, root);
  }

  if (command === "ux") {
    return executeUx(args, root);
  }

  if (command === "plan-create") {
    return printCreatePlan(args, root);
  }

  if (command === "create-project") {
    return createProject(args, root);
  }

  console.error(`Command desconocido: ${command}`);
  usage();
  return 1;
}

// Solo ejecutar el CLI cuando este módulo se invoca directamente desde Node.
// Esto permite importar las helpers (html5SeedIndex, html5SeedFlujo, etc.)
// desde tests sin disparar el flujo principal.
const __invokedDirectly = (() => {
  try {
    const argv1 = process.argv[1] ? process.argv[1].replace(/\\/g, "/") : "";
    const here = new URL(import.meta.url).pathname.replace(/\\/g, "/");
    return argv1 && here.endsWith(argv1.split("/").pop());
  } catch { return false; }
})();

if (__invokedDirectly) {
  try {
    process.exit(await main());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
