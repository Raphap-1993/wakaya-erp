# API Contract - Wakaya ERP Public Site

[README principal](../../README.md) | [Specs](../README.md)

## Alcance
Contrato preliminar para la futura conexion del sitio publico con servicios de
consulta y solicitud. No implica que estos endpoints existan todavia.
El endpoint canonico de intake publico implementado hoy es `POST /api/public/reservations`.

## Endpoint
GET /prototype/public-site/bungalows

Ruta renderizada del prototipo navegable para resultados de hospedaje.
Acepta query params de lectura para conservar el contexto de busqueda:
- `checkIn`
- `checkOut`
- `guests`
- `category`

## Endpoint
GET /prototype/public-site/bungalows/{slug}

Ruta renderizada del prototipo para el detalle de una categoria publica de
bungalow.

## Endpoint
GET /prototype/public-site/bungalows

Variante contractual explicita de la vista de resultados con filtros idempotentes
en query string (`checkIn`, `checkOut`, `guests`, `category`).

## Endpoint
GET /api/public/room-categories

Retorna categorias publicas de habitaciones con:
- slug
- nombre
- capacidad
- precioDesde
- highlights
- heroImage

## Endpoint
GET /api/public/room-categories/{slug}

Retorna detalle publico de una categoria con:
- galeria
- amenidades
- reglas
- tarifaBase
- disponibilidadReferencial

## Endpoint
POST /api/public/reservations

Crea una solicitud publica de prereserva/reserva web en estado `pending_review`.

Body minimo:
- nombreCompleto
- telefono
- correo
- fechaInicio
- fechaFin
- huespedes
- categoria
- mensaje

Respuesta esperada:
- `202 Accepted`
- mensaje de solicitud recibida

## Endpoint
POST /api/public/event-requests

Crea una solicitud publica para eventos.

## Endpoint
POST /api/public/full-day-requests

Crea una solicitud publica para full day.

## Endpoint
POST /public/pre-reservations

Alias contractual del flujo publico visible para la landing/prototipo. Recibe:
- nombreCompleto
- telefono
- correo
- fechaInicio
- fechaFin
- huespedes
- categoria
- mensaje

Respuesta esperada:
- `202 Accepted`
- requestId o referencia visible

## Endpoint
POST /public/event-requests

Alias contractual del flujo publico para eventos. Recibe:
- nombreCompleto
- telefono
- correo
- fechaInicio
- categoria
- mensaje

Respuesta esperada:
- `202 Accepted`
- requestId

## Endpoint
POST /public/full-day-requests

Alias contractual del flujo publico para full day. Recibe:
- nombreCompleto
- telefono
- correo
- fechaInicio
- huespedes
- mensaje

Respuesta esperada:
- `202 Accepted`
- requestId

## Reglas del contrato
- todas las respuestas publicas deben ser seguras para web abierta
- no se expone inventario interno por unidad real en esta fase
- la confirmacion final nunca se representa como reserva confirmada automatica
- la disponibilidad referencial y la tarifa base se leen desde el contrato publico de categorias, no desde inventario unitario interno
