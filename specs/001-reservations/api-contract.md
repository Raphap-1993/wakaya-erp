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

## Endpoint
GET /api/reservations/{id}

## Permiso
reservation:read

## Response
- id
- numero
- canal
- estado
- bungalowAsignado
- responsable
- fechas
- huespedes
- auditoriaResumen

## Errores
- 401.
- 403.
- 404.

## Endpoint
POST /api/reservations/{id}/assign

## Permiso
reservation:assign

## Body minimo
- bungalowId
- motivo

## Response
- reservationId
- bungalowId
- occupancyStatus
- auditId

## Errores
- 400 por payload invalido.
- 403.
- 404.
- 409 por solape de inventario.

## Endpoint
POST /api/reservations/{id}/status

## Permiso
reservation:write o reservation:approve segun transicion

## Body minimo
- nuevoEstado
- motivo

## Response
- reservationId
- estadoAnterior
- estadoNuevo
- auditId

## Errores
- 400 por transicion invalida.
- 403.
- 404.
- 409 por regla de negocio.

## Endpoint
GET /api/reservations/{id}/audit

## Permiso
reservation:read

## Response
- reservationId
- eventos[]
- actor
- accion
- timestamp
- motivo

## Errores
- 401.
- 403.
- 404.

## Endpoint
POST /api/public/reservations

## Permiso
public access controlado por validaciones de input y rate limiting

## Body minimo
- nombreCompleto
- telefono
- correo
- fechaInicio
- fechaFin
- huespedes
- categoria
- mensaje

## Response
- reservationId
- reservationNumber
- status `pending_review`

## Errores
- 400 por payload invalido.
- 409 por conflicto de disponibilidad.
- 429 si aplica proteccion anti abuso.
