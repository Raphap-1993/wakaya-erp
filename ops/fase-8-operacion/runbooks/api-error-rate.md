# Runbook: error rate alto

[README principal](../../../README.md) | [Indice docs](../../../docs/README.md) | [Volver a operacion](../README.md)

## Sintoma
La tasa de errores 5xx supera el umbral definido en el SLO.

## Pasos iniciales
1. Confirmar impacto en dashboard de servicio.
2. Revisar deploys recientes y cambios de feature flags.
3. Revisar logs por `correlationId` y trazas afectadas.
4. Activar rollback si el error coincide con el ultimo release.
