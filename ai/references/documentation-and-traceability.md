# Referencia: Documentation And Traceability

## Usala cuando
- la salida debe actualizar artefactos oficiales del repositorio,
- estas produciendo o revisando entregables por fase,
- necesitas verificar que no queda texto huerfano.

## Checklist rapido
- Declara la ruta destino real del artefacto.
- Explicita que entrada origina la salida: vision, RF, RNF, HU, spec o ADR.
- Marca supuestos y preguntas abiertas si faltan datos.
- Verifica que el resultado no conserva texto instructivo del template.
- Si el trabajo cambia arquitectura, despliegue o seguridad, enlaza fase 3 o un ADR.
- Si el trabajo cambia comportamiento de una feature, enlaza `spec funcional` y `spec tecnica`.

## Red flags
- Texto correcto pero sin ruta oficial donde vivir.
- Documento final que sigue diciendo "Describe", "Lista" o "Define".
- Resumen de IA sin trazabilidad hacia requerimientos o specs.
- Cambio tecnico que no deja rastro en arquitectura, ADR, QA u operacion.

## Evidencia minima
- ruta actualizada,
- entrada declarada,
- supuestos visibles,
- siguiente paso recomendado si la informacion no alcanza.

## Matriz de trazabilidad viva
- Cada feature mantiene `specs/<feature>/traceability.md` con la matriz: `RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia`.
- Una fila por requerimiento (RF o RNF); celdas sin dato usan `-`.
- La seccion `## Gates` consolida el estado de los quality gates de la feature.
- `node scripts/ai-framework-agent.mjs sync-memory` parsea estos Markdown y puebla la memoria del agente (`ai_trace_links`, `ai_gate_runs`, `ai_evidence_items`, `ai_decisions`, `ai_open_questions`).
- La BD es reconstruible: si contradice un Markdown, gana el Markdown y se reindexa.

## Rutas relacionadas
- `docs/transversal/90.10-entregables-minimos-por-fase.md`
- `docs/transversal/90.11-checklist-entregables.md`
- `docs/transversal/90.14-instanciacion-fases-proyectos-reales.md`
- `ai/memory/README.md`
- `scripts/ai-framework-agent.mjs`
