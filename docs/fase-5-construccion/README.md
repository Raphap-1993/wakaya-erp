# Fase 5 - Construccion

[README principal](../../README.md) | [Indice docs](../README.md)


<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Checklist SDD](../fase-4-sdd/04.01-checklist-spec-driven-development.md)
- Siguiente: [Plantilla de proyecto base](05.00-plantilla-proyecto-base.md)
<!-- nav-guided:end -->

## Proposito
Materializar las specs de Wakaya ERP en codigo backend, frontend, pruebas unitarias y automatizaciones de build. Si el cambio toca frontend, aplicar SPDD desde spec + prototipo.

## Entregables canonicos
- [Spec tecnica inicial](../../specs/001-reservations/spec-tecnica.md)
- [Spec tareas inicial](../../specs/001-reservations/spec-tareas.md)
- [SPDD Frontend](05.01-spec-prototype-driven-development-frontend.md)
- [Spec tecnica inicial](../../specs/001-reservations/spec-tecnica.md)
- [Spec tareas inicial](../../specs/001-reservations/spec-tareas.md)

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
Ejecuta una tarea por vez desde `spec-tareas.md`, preferiblemente en worktree o rama dedicada. Si cambia comportamiento, registra red, green y refactor. Si es frontend, valida UX/prototipo/mapping antes de tocar codigo.
