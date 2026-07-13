# UI Test Cases - Wakaya Bungalow Unit Inventory

[Specs](../README.md) | [Feature](README.md)

## UI-007-01 - Inventario inicial
El resumen muestra Familiar 5, Matrimonial 4, Individual 5, Doble 2 y Triple 1, con códigos únicos en detalle.

## UI-007-02 - Checkout exclusivo
Para 10 a 12 agosto, el dialog anuncia dos noches: 10 y 11; una reserva desde el 12 puede usar la misma unidad.

## UI-007-03 - Bloqueo manual
Al bloquear `IND-03`, esa unidad desaparece de disponibles para todo rango solapado y el evento muestra motivo/actor.

## UI-007-04 - Cancelar bloqueo
Al cancelar con razón, la unidad vuelve a disponibilidad futura y el historial conserva ambos eventos.

## UI-007-05 - Sugerencia
La primera unidad activa/libre por orden aparece con chip `Sugerida`.

## UI-007-06 - Cambio de unidad
Recepción elige otra unidad libre, escribe razón y confirma; auditoría conserva sugerida y elegida.

## UI-007-07 - Carrera
Si la unidad deja de estar libre antes de confirmar, aparece `409`, se ofrece nueva sugerencia y no se pierde el formulario.

## UI-007-08 - Tipo agotado
El público no crea request, muestra mensaje, hasta tres tipos y hasta tres fechas alternativas dentro de 60 días, sin códigos internos.

## UI-007-09 - Servicio no disponible
Si PostgreSQL no puede decidir, el público muestra reintento/WhatsApp y no asume disponibilidad.

## UI-007-10 - Unidad inactiva
Una unidad inactiva conserva historial, no aparece como sugerible y no acepta nuevas asignaciones.

## UI-007-11 - Permisos
`reservation:read` consulta; `reservation:write` bloquea; solo `reservation:assign` confirma/cambia unidad.

## UI-007-12 - Mobile
En 390x844, filtros no tapan resultados, dialogs son legibles y selección por radio funciona con teclado/screen reader.

## UI-007-13 - OTA asignada e idempotente
Un import OTA mapeado asigna una unidad libre. Repetir el mismo evento conserva reserva/unidad y no duplica noches ni auditoría.

## UI-007-14 - OTA sold-out y reintento
Un import OTA agotado crea un solo conflicto sin ocupar noches. Al reintentar tras liberar una unidad, asigna, resuelve el conflicto y no crea una segunda reserva.
