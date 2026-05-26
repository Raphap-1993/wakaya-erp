# AI Task - Fase 7 - Deploy

## Rol
Actua como release-agent.

## Objetivo
Preparar salida controlada de Wakaya ERP con runbook, rollback y monitoreo.

## Lee primero
- [Runbook](../../ops/fase-7-deploy/runbook.md)
- [Rollback](../../ops/fase-7-deploy/rollback.md)
- [Plan despliegue](../../docs/fase-3-arquitectura/03.03-plan-despliegue.md)
- [Plan QA](../../qa/fase-6-qa/plan-pruebas.md)
- [Flujo delivery IA](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)

## Crea o actualiza
- ops/fase-7-deploy/runbook.md
- ops/fase-7-deploy/rollback.md
- releases/

## Reglas
- No cerrar deploy sin rollback.
- No cerrar deploy sin monitoreo.
- Registra evidencia de smoke.
- No proponer PR/merge sin checks finales, resumen de cambios y riesgos residuales.
- Declara si el worktree/rama queda listo para limpiar, conservar o bloquear.

## Gate
Aplica gate-7-8.

## Resultado esperado
Release controlado o bloqueado con razones.
