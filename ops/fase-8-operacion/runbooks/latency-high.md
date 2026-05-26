# Runbook: latencia alta

[README principal](../../../README.md) | [Indice docs](../../../docs/README.md) | [Volver a operacion](../README.md)

## Sintoma
La latencia p95 o p99 supera el umbral declarado para el servicio.

## Pasos iniciales
1. Confirmar si el aumento es global o por endpoint.
2. Revisar saturacion de CPU, memoria, base de datos y colas.
3. Comparar con deploys, flags o cambios de trafico recientes.
4. Escalar incidente si el SLO queda en riesgo.
