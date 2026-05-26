# API Contract - Wakaya ERP Public Site

[README principal](../../README.md) | [Specs](../README.md)

## Alcance
Contrato preliminar para la futura conexion del sitio publico con servicios de
consulta y solicitud. No implica que estos endpoints existan todavia.

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
POST /api/public/pre-reservations

Crea una solicitud publica de prereserva.

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

## Reglas del contrato
- todas las respuestas publicas deben ser seguras para web abierta
- no se expone inventario interno por unidad real en esta fase
- la confirmacion final nunca se representa como reserva confirmada automatica
