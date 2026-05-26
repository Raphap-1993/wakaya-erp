# ADR-010 - Memoria local AI-first con SQLite, sqlite-vec y DuckDB

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-009 - DR multi-region activo-pasivo](ADR-009-dr-multi-region-activo-pasivo.md)
- Siguiente: [Fase 4 - Spec-Driven Development](../../fase-4-sdd/README.md)
<!-- nav-guided:end -->

## Decision
Adoptar una memoria local por etapas para el agente interno del framework AI-first:
- SQLite como base estructurada y portable.
- sqlite-vec para busqueda semantica local sobre chunks de documentos y evidencias.
- DuckDB como componente opcional para analitica de proyecto.

La memoria local es un indice reconstruible. No reemplaza los archivos oficiales del repositorio.

## Contexto
El framework enterprise AI-first necesita que el agente interno pueda responder preguntas, leer informacion bruta, encontrar relaciones entre artefactos y validar trazabilidad sin depender desde el inicio de infraestructura pesada.

El repositorio ya define metodologia, phases, SDD, agents, prompts, skills, commands, quality gates y references. Falta formalizar como la capa IA puede recordar contexto localmente, buscar de forma semantica y medir madurez o cobertura.

## Opciones consideradas
- SQLite solamente: simple y portable, suficiente para indice, gates, evidencias y trazabilidad estructurada. No resuelve busqueda semantica por si solo.
- SQLite + sqlite-vec: mantiene portabilidad y agrega similitud semantica local. Requiere gestionar extension, dimension de embeddings y riesgo de evolucion por ser pre-v1.
- DuckDB como base principal: fuerte para analitica, pero no es la mejor base transaccional para memoria operacional cotidiana.
- Base vectorial externa: mas escalable para grandes volumenes, pero aumenta operacion, credenciales y dependencia externa.
- No tener memoria local: reduce componentes, pero obliga a releer todo y debilita trazabilidad incremental.

## Consecuencias
- La fuente oficial sigue siendo el repositorio.
- La memoria puede borrarse y reconstruirse desde archivos.
- El agente debe reindexar cuando cambien documentos relevantes.
- sqlite-vec se usa como busqueda semantica local, no como unico criterio de verdad.
- DuckDB se habilita solo cuando existan consultas analiticas reales, por ejemplo cobertura por fase, RF sin spec o specs sin pruebas.
- No se deben indexar secretos ni datos sensibles sin clasificacion.
- La dimension de embeddings se decide segun el modelo elegido y debe registrarse.

## Implementacion
- `ai/memory/README.md` define la memoria operacional.
- `ai/memory/schema-sqlite.sql` define el esquema base para SQLite y sqlite-vec.
- `ai/memory/schema-sqlite-vec.sql` define la extension vectorial opcional.
- `scripts/ai-framework-agent.mjs` inicializa la BD, indexa documentacion, busca contexto y orquesta creacion de proyectos reales.
- `ai/references/local-ai-memory.md` define reglas, entidades, red flags y evidencia.
- `ai/agents/enterprise-ai-framework-agent.md` consume la memoria como apoyo.
- `docs/transversal/90.32-agente-interno-framework-ai-first.md` documenta el uso dentro del framework.

## Modelo de uso
```text
Archivos oficiales del repositorio
  ->
Indexacion local en SQLite
  ->
Chunks + embeddings con sqlite-vec
  ->
Busqueda semantica y trazabilidad
  ->
Analitica opcional con DuckDB
```

## Trazabilidad
- Documento transversal: [`90.32-agente-interno-framework-ai-first.md`](../../transversal/90.32-agente-interno-framework-ai-first.md).
- Agente: [`ai/agents/enterprise-ai-framework-agent.md`](../../../ai/agents/enterprise-ai-framework-agent.md).
- Memoria: [`ai/memory/README.md`](../../../ai/memory/README.md).
- Ejecutable: [`scripts/ai-framework-agent.mjs`](../../../scripts/ai-framework-agent.mjs).
- Referencia: [`ai/references/local-ai-memory.md`](../../../ai/references/local-ai-memory.md).

## Referencias
- [sqlite-vec](https://github.com/asg017/sqlite-vec)
- [DuckDB](https://duckdb.org/)
- [Why DuckDB](https://duckdb.org/why_duckdb)
