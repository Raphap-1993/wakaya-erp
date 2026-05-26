# Fase 8 - Operacion

[README principal](../../README.md) | [Indice docs](../README.md)


<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Estrategias de despliegue seguro](../fase-7-deploy/07.01-estrategias-despliegue-seguro.md)
- Siguiente: [Operacion continua](08.00-operacion-continua.md)
<!-- nav-guided:end -->

## Proposito
Operar Wakaya ERP despues del release con metricas, soporte, continuidad y backlog evolutivo.

## Entregables canonicos
- [Operacion](../../ops/fase-8-operacion/operacion.md)
- [Metricas](../../ops/fase-8-operacion/metricas.md)
- [Runbook de deploy](../../ops/fase-7-deploy/runbook.md)
- [Rollback](../../ops/fase-7-deploy/rollback.md)

## Gate aplicable
- gate-7-8 con monitoreo y rollback disponibles.

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | produccion, metricas, incidentes, feedback y backlog evolutivo |
| Command IA | /review + /ship |
| Agente | operations-agent |
| Skills | operations-review, incident-analysis, continuous-improvement |
| Artefactos | operacion, metricas, postmortems, backlog evolutivo y mejoras |
| Gate | gate-7-8 |
| Evidencia | metricas -> hallazgos -> acciones -> seguimiento |
| Red flags | operacion sin metricas, incidente sin postmortem, mejora sin owner |
| Task packet | [fase-8-operacion.task.md](../../ai/tasks/fase-8-operacion.task.md) |
