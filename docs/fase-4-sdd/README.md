# Fase 4 - Spec-Driven Development

[README principal](../../README.md) | [Indice docs](../README.md)


<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-010 - Memoria local AI-first con SQLite, sqlite-vec y DuckDB](../fase-3-arquitectura/adr/ADR-010-memoria-local-ai-first-sqlite-sqlite-vec-duckdb.md)
- Siguiente: [Spec-Driven Development (SDD)](04.00-spec-driven-development.md)
<!-- nav-guided:end -->

## Proposito
Convertir requerimientos aprobados de Wakaya ERP en specs funcionales, tecnicas y tareas construibles.

## Entregables canonicos
- [Indice de specs](../../specs/README.md)
- [Spec funcional - Wakaya ERP](../../specs/001-reservations/spec-funcional.md)
- [Spec tecnica - Wakaya ERP](../../specs/001-reservations/spec-tecnica.md)
- [Spec tareas - Wakaya ERP](../../specs/001-reservations/spec-tareas.md)

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
No pasar a construccion si `spec-tareas.md` no declara tareas pequenas con objetivo, entradas, rutas permitidas, ciclo TDD, comandos de verificacion y evidencia esperada.
