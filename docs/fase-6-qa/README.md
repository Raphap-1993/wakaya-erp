# Fase 6 - QA

[README principal](../../README.md) | [Indice docs](../README.md)


<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Spec + Prototype Driven Development Frontend](../fase-5-construccion/05.01-spec-prototype-driven-development-frontend.md)
- Siguiente: [Plan de pruebas](06.00-plan-pruebas.md)
<!-- nav-guided:end -->

## Proposito
Validar que Wakaya ERP cumple los criterios funcionales, tecnicos, de seguridad y operacion antes de release.

## Entregables canonicos
- [Plan de pruebas](../../qa/fase-6-qa/plan-pruebas.md)
- [Evidencia local del editor simple y cupos sin bloqueos](06.06-content-workbench-capacity-simplification-local-evidence.md)
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
