# Referencia: Local AI Memory

## Usala cuando
- el agente necesita recordar que archivos leyo y que relaciones encontro,
- necesitas busqueda semantica local sobre documentos, specs, ADR o evidencias,
- quieres medir cobertura, drift o salud documental del proyecto,
- necesitas separar memoria operacional de fuente oficial.

## Decision base
- SQLite es la memoria local estructurada y portable.
- sqlite-vec agrega busqueda semantica sobre chunks y evidencias.
- DuckDB es opcional para analitica de proyectos y reporting.

## Uso operativo actual
El ejecutable local del agente usa SQLite con `node:sqlite`:
```powershell
node scripts/ai-framework-agent.mjs init-memory
node scripts/ai-framework-agent.mjs index-docs
node scripts/ai-framework-agent.mjs search --query "gate 0-1"
```

La busqueda semantica con sqlite-vec esta disponible como etapa 2 cuando se entrega una extension sqlite-vec y embeddings externos:
```powershell
node scripts/ai-framework-agent.mjs import-embeddings --file .\embeddings.jsonl --sqlite-vec-extension C:\tools\sqlite-vec\vec0.dll
node scripts/ai-framework-agent.mjs search --semantic --embedding "[0.1,0.2,0.3]" --sqlite-vec-extension C:\tools\sqlite-vec\vec0.dll
```

El template no genera embeddings por defecto para no atarse a un proveedor.

## Principios
- La fuente oficial siempre es el repositorio.
- La memoria se puede borrar y reconstruir desde archivos.
- Los embeddings no deben contener secretos.
- La dimension del vector depende del modelo de embeddings elegido.
- Si una busqueda semantica encuentra una relacion, se debe verificar contra el archivo fuente.

## Entidades recomendadas
| Entidad | Uso |
|---|---|
| `ai_documents` | indice de archivos oficiales y fuentes brutas |
| `ai_document_chunks` | fragmentos buscables por heading y contenido |
| `vec_document_chunks` | embeddings para similitud semantica con sqlite-vec |
| `ai_trace_links` | relaciones entre fuente, RF/RNF, spec, ADR, prueba y evidencia |
| `ai_gate_runs` | ejecuciones o revisiones de quality gates |
| `ai_evidence_items` | evidencia asociada a gates, QA, release u operacion |
| `ai_open_questions` | preguntas abiertas y bloqueantes |
| `ai_decisions` | decisiones propuestas o aprobadas con enlace a ADR si aplica |

## Consultas que debe soportar
- Que archivos originaron este requerimiento?
- Que specs cubren este RF?
- Que pruebas validan esta spec?
- Que ADR respalda esta decision?
- Que evidencia falta para el gate?
- Que documentos hablan semanticamente de seguridad, auditoria o disponibilidad?
- Que fases tienen entregables incompletos?

## Red flags
- La memoria conserva informacion que ya cambio en archivos.
- Se guarda informacion sensible sin clasificar.
- Se aprueba una salida solo porque la busqueda semantica la encontro.
- DuckDB se usa para flujos transaccionales que corresponden a SQLite.
- sqlite-vec se vuelve dependencia obligatoria antes de estabilizar la etapa base.

## Evidencia minima
- fecha de indexacion,
- checksum o indicador de version del archivo,
- fuente del chunk,
- modelo de embedding usado,
- gate o consulta que consumio la memoria,
- archivo oficial que confirma la relacion.

## Rutas relacionadas
- `../memory/README.md`
- `../memory/schema-sqlite.sql`
- `../../scripts/ai-framework-agent.mjs`
- `../../docs/fase-3-arquitectura/adr/ADR-010-memoria-local-ai-first-sqlite-sqlite-vec-duckdb.md`
