# API Contract - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Endpoint
GET /api/reservations

## Permiso
reservation:read

## Query params
- q
- estado
- prioridad
- responsable
- page
- size

## Response
- id
- numero
- estado
- prioridad
- responsable
- fechaActualizacion
- accionesPermitidas

## Errores
- 401.
- 403.
- 500 controlado.
