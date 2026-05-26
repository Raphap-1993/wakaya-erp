# Indice de documentacion

[README principal](../README.md)


<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [README principal](../README.md)
- Siguiente: [Fase 0 - Iniciacion](fase-0-iniciacion/README.md)
<!-- nav-guided:end -->

Esta documentacion describe el proyecto real Wakaya ERP.

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
