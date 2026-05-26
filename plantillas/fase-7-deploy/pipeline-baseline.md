# Plantilla de pipeline baseline

> **Plantilla (no es el entregable).** Destino: `varios`. Consolida el entregable en la carpeta destino que indica el README de esta carpeta.

## Objetivo
Explica como el proyecto valida, aprueba y libera cambios desde integracion hasta salida controlada a produccion.

## Flujo minimo esperado
Describe la secuencia minima esperada: checks basicos, pruebas, build candidata, aprobacion, deploy y verificacion posterior.

## Gates minimos
Lista las condiciones que deben cumplirse antes de liberar, por ejemplo build verde, QA aprobado, rollback vigente y aprobacion registrada.

## Aprobacion de release
Indica quien aprueba, en que momento se registra la decision y que evidencia deja el equipo antes del despliegue.

## Relacion con runbook y rollback
Aclara como este baseline se conecta con `ops/fase-7-deploy/runbook.md`, `ops/fase-7-deploy/rollback.md` y el plan de despliegue.

Referencia: `ci/pipeline-baseline.md`
