# Product Design - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Problema
Recepción necesita operar llegadas, salidas y asignaciones de bungalow desde una sola superficie. Hoy la validación del contexto de la reserva, la asignación y la trazabilidad todavía no están materializadas en una experiencia visible del producto.

## Objetivo
Convertir el módulo de reservas en una consola diaria para Recepción que permita detectar reservas críticas, revisar el contexto de la estadía y asignar o reasignar bungalow con trazabilidad inmediata.

## Usuarios
- Recepción como actor principal.
- Supervisión como actor secundario para excepciones.
- Auditor como consumidor de trazabilidad.

## Journey
Ingresar a agenda del día -> filtrar reservas críticas -> seleccionar reserva -> revisar detalle lateral -> asignar o reasignar bungalow -> confirmar acción -> validar auditoría reciente.

## Hipótesis
Una agenda operativa con detalle lateral persistente reduce la ambigüedad operativa y acelera la asignación de bungalow en reservas con llegada inmediata.

## Métricas
- tiempo para asignar bungalow a reservas sin asignación,
- reservas críticas resueltas sin salir de la pantalla principal,
- reducción de consultas internas para confirmar el último cambio operativo.
