PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ai_documents (
  id INTEGER PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  phase TEXT,
  title TEXT,
  checksum TEXT,
  indexed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS ai_document_chunks (
  id INTEGER PRIMARY KEY,
  document_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  heading TEXT,
  content TEXT NOT NULL,
  token_count INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES ai_documents(id) ON DELETE CASCADE,
  UNIQUE (document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS ai_trace_links (
  id INTEGER PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  relation TEXT NOT NULL,
  confidence REAL,
  evidence_ref TEXT,
  -- Semantica del link (v12.22): distingue lo planificado de lo implementado.
  --   'planned'    : declarado en la matriz, pero el target_ref aun NO existe en el repo.
  --   'implemented': declarado en la matriz Y el target_ref existe en el repo.
  --   'validated'  : implemented + gate de QA aprobado (RF tiene codigo y test).
  --   'inferred'   : cosechado desde @trace en source code (confidence < 1.0).
  --   'drift'      : declarado pero el target_ref existia y ahora no.
  link_status TEXT,
  origin TEXT,        -- 'markdown-matrix' | 'source-harvest' | 'tool' | 'human'
  validated_at TEXT,  -- ISO date cuando paso a 'validated' (gate aprobado)
  -- v12.31: source_file es la ruta relativa del Markdown que produjo el link.
  -- Permite deduplicar (mismo link en TRACEABILITY_MATRIX.md raiz + specs/.../traceability.md)
  -- y rastrear cual matriz declaro la relacion.
  source_file TEXT,
  -- v12.41: display_status enriquece link_status con vocabulario apropiado al
  -- target_type. link_status siempre es planned|implemented|validated|inferred|drift
  -- (semantica de codigo: cosa que existe o no). display_status traduce eso a:
  --   target_type='codigo' o 'test': planned|implemented|validated (igual)
  --   target_type='spdd'/'api'/'bd'/'prototipo'/'sdd'/'pantalla'/'componente':
  --     pending     <- link_status='planned' (declarado, sin doc real)
  --     documented  <- link_status='implemented' (existe en repo)
  --     approved    <- link_status='validated' (Estado de fila aprobado)
  -- Asi un agente IA no confunde "RF tiene prototipo implementado" (sin sentido)
  -- con "RF tiene prototipo documentado". link_status sigue para compat hacia atras.
  display_status TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_trace_links_status ON ai_trace_links(link_status);
CREATE INDEX IF NOT EXISTS idx_ai_trace_links_origin ON ai_trace_links(origin);

CREATE TABLE IF NOT EXISTS ai_gate_runs (
  id INTEGER PRIMARY KEY,
  gate TEXT NOT NULL,
  phase_scope TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT,
  actor TEXT,
  decided_at TEXT,
  evidence_paths TEXT,
  run_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_evidence_items (
  id INTEGER PRIMARY KEY,
  gate_run_id INTEGER,
  evidence_type TEXT NOT NULL,
  path TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gate_run_id) REFERENCES ai_gate_runs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_open_questions (
  id INTEGER PRIMARY KEY,
  phase TEXT,
  question TEXT NOT NULL,
  owner_role TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  source_ref TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_decisions (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  decision_ref TEXT,
  adr_path TEXT,
  rationale TEXT,
  tags TEXT,
  affects TEXT,
  deciders TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Eventos por sesion del agente IA. Append-only desde SESSION_LOG.md.
-- Permite "que paso en las ultimas N sesiones" sin releer prosa.
CREATE TABLE IF NOT EXISTS ai_session_events (
  id INTEGER PRIMARY KEY,
  occurred_at TEXT NOT NULL,
  agent TEXT,
  summary TEXT NOT NULL,
  changes TEXT,
  pending TEXT,
  source_ref TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_session_events_occurred ON ai_session_events(occurred_at);

CREATE INDEX IF NOT EXISTS idx_ai_documents_phase ON ai_documents(phase);
CREATE INDEX IF NOT EXISTS idx_ai_trace_links_source ON ai_trace_links(source_type, source_ref);
CREATE INDEX IF NOT EXISTS idx_ai_trace_links_target ON ai_trace_links(target_type, target_ref);
CREATE INDEX IF NOT EXISTS idx_ai_gate_runs_gate ON ai_gate_runs(gate, status);
CREATE INDEX IF NOT EXISTS idx_ai_open_questions_status ON ai_open_questions(status);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_status ON ai_decisions(status);

-- Busqueda textual rapida con FTS5 (unicode61 + sin diacriticos).
-- Tabla standalone: el rowid coincide con ai_document_chunks.id.
-- Es reconstruible: index-docs la mantiene sincronizada con ai_document_chunks.
CREATE VIRTUAL TABLE IF NOT EXISTS ai_chunks_fts USING fts5(
  path,
  heading,
  content,
  document_id UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Embeddings por chunk para busqueda semantica.
-- Tabla regular: el vector se guarda como JSON, sin depender de la extension
-- nativa sqlite-vec. embed-docs la puebla con un embedder local determinista
-- (model 'local-hash-v1'); import-embeddings puede cargar vectores de un
-- proveedor externo. La busqueda semantica compara con cosine en JS.
-- sqlite-vec sigue siendo un acelerador opcional para corpus grandes
-- (ver schema-sqlite-vec.sql).
CREATE TABLE IF NOT EXISTS ai_chunk_embeddings (
  chunk_id INTEGER PRIMARY KEY,
  model TEXT NOT NULL,
  dim INTEGER NOT NULL,
  vector TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chunk_id) REFERENCES ai_document_chunks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ai_chunk_embeddings_model ON ai_chunk_embeddings(model);

-- Audit trail de acciones ejecutadas desde el panel UI (v12.25).
-- Append-only: cada POST /api/exec crea una fila. stdout/stderr se guardan
-- recortados (tail 4KB) para no inflar la BD. Permite revisar runs recientes
-- desde la sub-tab "Historial" y re-ejecutar con un click.
CREATE TABLE IF NOT EXISTS ai_action_runs (
  id INTEGER PRIMARY KEY,
  action_id TEXT NOT NULL,
  arg TEXT,
  argv TEXT,                 -- argv saneado (JSON), <root> en lugar de path absoluto
  mode TEXT,                 -- 'sync' | 'stream'
  origin TEXT,               -- 'ui' | 'api' | 'cli'
  started_at TEXT NOT NULL,
  finished_at TEXT,
  exit_code INTEGER,
  signal TEXT,
  duration_ms INTEGER,
  timed_out INTEGER,
  cancelled INTEGER,         -- 1 si terminado por DELETE o socket close
  stdout_tail TEXT,          -- ultimos 4KB
  stderr_tail TEXT           -- ultimos 4KB
);
CREATE INDEX IF NOT EXISTS idx_ai_action_runs_started ON ai_action_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_action_runs_action ON ai_action_runs(action_id);

-- Snooze de alertas por accion (v12.30): permite silenciar alertas que son
-- esperadas/by-design (ej. check-trace-drift que falla intencionalmente en
-- el template). Cuando expires_at es NULL, el snooze es permanente.
-- El endpoint /api/action-runs/alerts filtra las acciones con snooze activo.
-- v12.45: kind nullable. Si kind=NULL el snooze silencia TODOS los kinds
-- de alerta del action_id. Si kind='duration-threshold' silencia solo ese.
-- Para mantener compat con DBs existentes (PK en action_id), seguimos con
-- una fila unica por action_id; el cambio es semantico (que kind tapa).
CREATE TABLE IF NOT EXISTS ai_action_snoozes (
  action_id TEXT PRIMARY KEY,
  reason TEXT,
  snoozed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  kind TEXT
);

-- Registro de alertas ya notificadas via webhook (v12.30) — evita re-notificar
-- la misma alerta una y otra vez. Clave: (action_id, fingerprint del estado actual).
CREATE TABLE IF NOT EXISTS ai_alert_notifications (
  action_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  notified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  webhook_status INTEGER,
  PRIMARY KEY (action_id, fingerprint)
);
