# Fase 3 - Arquitectura

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Rubrica de Calidad de Prototipo HTML5](../fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md)
- Siguiente: [Arquitectura](03.00-arquitectura.md)
<!-- nav-guided:end -->

## Proposito
Registrar la arquitectura inicial de Wakaya ERP, las decisiones tecnologicas, la estrategia de despliegue y las ADR asociadas.

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
