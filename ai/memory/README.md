# AI Memory

[README principal](../README.md) | [Referencia local](../references/local-ai-memory.md)

## Objetivo
Definir la memoria local del agente interno del framework enterprise AI-first.

La memoria local permite indexar archivos, buscar relaciones y sostener trazabilidad operacional sin reemplazar los documentos oficiales del repositorio.

## Arquitectura por etapas
| Etapa | Componente | Uso |
|---|---|---|
| 1 | SQLite | memoria estructurada, indice de archivos, trazabilidad y gates |
| 2 | sqlite-vec | busqueda semantica sobre chunks de documentos y evidencias |
| 3 | DuckDB | analitica opcional de cobertura, madurez, deuda y salud del proyecto |
| 4 | exportacion | sincronizacion opcional a dashboards o herramientas externas |

## Fuente de verdad
Los archivos del repositorio son la fuente oficial:
- `docs/`
- `specs/`
- `src/`
- `tests/`
- `qa/`
- `ops/`
- `ci/`
- `likec4/`
- `contracts/`

La memoria puede reconstruirse desde esas rutas. Si hay contradiccion, gana el archivo oficial.

## Esquema base
El esquema inicial vive en:
- `schema-sqlite.sql`

El esquema opcional de sqlite-vec vive en:
- `schema-sqlite-vec.sql`

El bloque de sqlite-vec requiere cargar la extension correspondiente antes de crear o consultar tablas vectoriales.

## Ejecutable
El agente interno tiene un CLI operativo:
```powershell
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
node scripts/ai-framework-agent.mjs plan-create --stack quarkus-angular --config .\mi.config.json --dest C:\template\caso-real\mi-proyecto
```

La base portable por defecto se crea en:
- `ai/memory/framework-agent.db`

Ese archivo se ignora en Git porque es memoria reconstruible.

## Flujo de memoria viva
```text
Markdown vivos (docs/, specs/, ai/, qa/)   <- fuente de verdad
        |  index-docs    -> ai_documents + ai_document_chunks + ai_chunks_fts (FTS5)
        |  sync-memory   -> ai_trace_links + ai_gate_runs + ai_evidence_items
        |                   + ai_decisions + ai_open_questions
        v
SQLite framework-agent.db                  <- indice/memoria consultable
        |  search (FTS5)  -> contexto textual ranqueado
        |  consultas SQL  -> trazabilidad, gates, decisiones, preguntas abiertas
        v
Agente IA consulta rapido y abre solo los .md relevantes
```

### index-docs
Indexa el contenido textual de los Markdown y archivos de texto en `ai_documents`
y `ai_document_chunks`, y mantiene la tabla FTS5 `ai_chunks_fts` para busqueda
rapida con ranking `bm25`. Si FTS5 no estuviera disponible, `search` cae a un
scan textual de respaldo.

### sync-memory
Parsea los Markdown oficiales (fuente de verdad) y reconstruye por completo las
tablas estructuradas:
- `ai_trace_links`: desde la matriz de `specs/<feature>/traceability.md`
  (`RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia`).
  Cada celda con dato genera una relacion consultable.
- `ai_gate_runs`: desde la seccion `## Gates` y menciones `` `gate-x`: estado ``
  en specs. `traceability.md` es la vista consolidada y gana sobre menciones sueltas.
- `ai_evidence_items`: desde secciones `## Evidencia`, la columna `Evidencia` de la
  matriz y `prototype-validation.md`.
- `ai_decisions`: desde los ADR (`docs/fase-3-arquitectura/adr/ADR-*.md`),
  los `decisiones-ux.md` y las secciones `## Decisiones`.
- `ai_open_questions`: desde las secciones `## Preguntas abiertas`.

Ademas, **v12.45.1+**, `sync-memory` registra automaticamente los artefactos
canonicos de cada feature (`syncCanonicalArtifacts`):
- Recorre cada `specs/<slug>/` y emite un trace link por archivo canonico
  presente (`spec-funcional.md`, `spec-tecnica.md`, `spec-tareas.md`,
  `api-contract.md`, `traceability.md`, `prototype.md`, `prototype-validation.md`,
  `product-design.md`, `spdd-frontend.md`, `spdd-backend.md`, `ui-test-cases.md`).
- Cada link queda con `source_type='feature'`, `source_ref=<slug>`,
  `target_type='doc'`, `target_ref=<filename>`, `relation='documents'`,
  `evidence_ref='specs/<slug>/<filename>'`, `source_file='specs/<slug>/<filename>'`,
  `link_status='implemented'`, `display_status='documented'`,
  `origin='auto-canonical-artifact'`.
- **Por que importa**: garantiza que cada artefacto canonico aparezca como
  `source_file` de al menos un link aunque su contenido no genere tablas que
  `sync-memory` parsee. Esto evita falsos positivos de `check-orphan-evidence`
  y da al agente IA una vista completa de "que documentacion existe por feature"
  via `memory-query --target-type doc --display-status documented`.
- **Filtrar para excluirlos**: si un agente quiere ver solo trace links de la
  matriz humana, usar `WHERE origin != 'auto-canonical-artifact'`.

Estas cinco tablas son derivadas y reconstruibles: `sync-memory` las vacia y
repuebla en cada corrida. Si la BD contradice un Markdown, gana el Markdown.

### Consultas tipicas para continuidad
```sql
-- Que implementa / falta de un requerimiento
SELECT relation, target_type, target_ref FROM ai_trace_links WHERE source_ref = 'RF-02';
-- Estado de gates por feature
SELECT gate, status FROM ai_gate_runs WHERE phase_scope = 'specs/001-bandeja-trabajo-expedientes';
-- Decisiones pendientes
SELECT decision_ref, title, status FROM ai_decisions WHERE status NOT LIKE 'aprob%';
-- Preguntas abiertas por fase
SELECT phase, question, source_ref FROM ai_open_questions WHERE status = 'open';
```

## Busqueda semantica sin dependencias
`embed-docs` genera un embedding por cada chunk usando un embedder local
determinista (modelo `local-hash-v1`, dim 256). No requiere proveedor externo
ni extension nativa: combina hashing de tokens y trigramas de caracter en un
vector L2-normalizado. Encuentra chunks que comparten vocabulario y morfologia.

Los vectores viven en la tabla regular `ai_chunk_embeddings` (vector como JSON).
La busqueda semantica calcula cosine en JavaScript:
```sh
node scripts/ai-framework-agent.mjs embed-docs               # genera embeddings locales
node scripts/ai-framework-agent.mjs embed-docs --force       # regenera todos
node scripts/ai-framework-agent.mjs search --query "..." --semantic
```

Para usar un proveedor externo (OpenAI, Cohere, etc.):
```sh
node scripts/ai-framework-agent.mjs import-embeddings --file vectors.jsonl
node scripts/ai-framework-agent.mjs search --semantic --embedding "[0.1, ...]"
```
JSONL por linea: `{"chunkId":1, "embedding":[...], "model":"openai-3-small"}`.

`sqlite-vec` (extension nativa) sigue disponible como **acelerador opcional**
para corpus grandes; ver `schema-sqlite-vec.sql`. Sin la extension, el cosine
en JS es suficiente para el orden de magnitud del template (~2500 chunks).

## Front embebido de consulta
Dos formas de revisar la memoria sin escribir SQL:

- `memory-report`: genera `ai/memory/memory-report.html`, un HTML autocontenido
  con un snapshot embebido (trazabilidad, gates, decisiones, evidencia, preguntas,
  documentos y busqueda client-side). Portable, sin servidor; reconstruible, se
  ignora en Git.
- `memory-serve [--port N]`: levanta un servidor Node local que consulta la BD en
  vivo. Endpoints: `/` (UI), `/api/snapshot` (JSON estructurado) y
  `/api/search?q=<texto>` (busqueda FTS5). Datos siempre frescos.

Ambos comparten la misma UI por pestañas. Usa `memory-report` para compartir o
revisar; `memory-serve` para consulta en caliente durante el desarrollo.

## Archivos de contexto vivo
La raiz del proyecto mantiene cuatro Markdown que el agente lee primero y que
`index-docs` indexa:

- `AI_CONTEXT.md`: en que estado esta el proyecto ahora (fase, features, gates, proximos pasos).
- `PROJECT_MAP.md`: donde vive cada cosa en el repositorio.
- `TRACEABILITY_MATRIX.md`: matriz global de trazabilidad; `sync-memory` la parsea.
- `GLOSSARY.md`: terminos del framework y del dominio.

Las plantillas viven en `plantillas/transversal/` y el generador las emite en
cada proyecto real.

## Politica de versionado
No versionar bases reales de memoria en el template.

La memoria local debe poder reconstruirse desde Markdown, specs, contracts, Git y evidencias oficiales. Por eso:
- `ai/memory/*.db` y `ai/memory/*.sqlite` se ignoran en Git **(ubicacion canonica — usar siempre esta)**,
- `.agent/*.db` y `.agent/*.sqlite` se ignoran en proyectos reales **(legacy/opcional — solo si pasas explicitamente `--db .agent/...` a cada comando)**,
- una base solo puede compartirse como ejemplo si se nombra explicitamente `*.example.db` y se documenta su origen,
- si una base contradice un archivo oficial, gana el archivo oficial y se reindexa.

## sqlite-vec en el ejecutable
La etapa 2 se activa con embeddings externos para no acoplar el template a un proveedor unico.

Importar embeddings JSONL:
```powershell
node scripts/ai-framework-agent.mjs import-embeddings --file .\embeddings.jsonl --sqlite-vec-extension C:\tools\sqlite-vec\vec0.dll
```

Cada linea debe usar:
```json
{"chunkId":1,"embedding":[0.1,0.2,0.3]}
```

Buscar con vector:
```powershell
node scripts/ai-framework-agent.mjs search --semantic --embedding "[0.1,0.2,0.3]" --sqlite-vec-extension C:\tools\sqlite-vec\vec0.dll
```

## Politicas
- No indexar secretos.
- Guardar ruta fuente y checksum o version.
- Registrar modelo de embeddings y dimension usada.
- Separar decision propuesta de decision aprobada.
- Asociar evidencia a gate, fase o artefacto.
- Reindexar despues de cambios relevantes.

## Consultas esperadas
- buscar contexto semanticamente relacionado,
- detectar RF sin spec,
- detectar specs sin pruebas,
- listar gates con evidencia incompleta,
- encontrar ADR que respaldan una decision,
- medir cobertura documental por fase.

## Referencias
- `../agents/enterprise-ai-framework-agent.md`
- `../references/local-ai-memory.md`
- `../../scripts/ai-framework-agent.mjs`
- `../../docs/transversal/90.32-agente-interno-framework-ai-first.md`
- `../../docs/fase-3-arquitectura/adr/ADR-010-memoria-local-ai-first-sqlite-sqlite-vec-duckdb.md`
