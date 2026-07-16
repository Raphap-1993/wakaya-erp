# Fase 7 - Deploy

[README principal](../../README.md) | [Indice docs](../README.md)


<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Evidencia local de identidad visual pública](../fase-6-qa/06.11-public-visual-identity-evidence.md)
- Siguiente: [Checklist de salida a produccion](07.00-checklist-salida-produccion.md)
<!-- nav-guided:end -->

## Proposito
Preparar y ejecutar la salida controlada de Wakaya ERP con runbook, rollback, ambientes y monitoreo inicial.

## Entregables canonicos
- [Runbook de deploy](../../ops/fase-7-deploy/runbook.md)
- [Rollback](../../ops/fase-7-deploy/rollback.md)
- [Plan de despliegue](../fase-3-arquitectura/03.03-plan-despliegue.md)
- [Preparacion del CMS publico en PM2](07.04-wakaya-public-cms-pm2.md)

## Gate aplicable
- gate-7-8 antes de produccion.
- Estado actual: **PENDIENTE**. Esta verificación es local; no se ejecutó
  despliegue ni se modificó producción.

## Operacion IA de la fase
| Elemento | Definicion |
|---|---|
| Entrada | build candidato, evidencia QA, configuracion, ADR y plan despliegue |
| Command IA | /ship |
| Agente | release-agent |
| Skills | shipping-and-launch, rollback-planning, release-readiness, finishing-development-branch |
| Artefactos | runbook, rollback, checklist deploy, notas de release y evidencia smoke |
| Gate | gate-7-8 |
| Evidencia | branch -> PR/merge -> pipeline -> smoke -> monitoreo -> rollback |
| Red flags | deploy sin rollback, sin monitoreo, sin aprobacion, sin smoke o con branch no cerrable |
| Task packet | [fase-7-deploy.task.md](../../ai/tasks/fase-7-deploy.task.md) |

## Regla para proveedor IA
No proponer merge o release sin checks finales, resumen de cambios, riesgos residuales y estado de worktree/rama.
