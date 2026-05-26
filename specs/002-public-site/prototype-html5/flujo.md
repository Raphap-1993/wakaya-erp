# Flujo prototipo HTML5 — Wakaya ERP Public Site

## Tarea principal recorrible (happy path)

Home
  └─ Booking bar flotante
      └─ Habitaciones
          └─ Detalle de habitación
              └─ Solicitud enviada

## Flujos secundarios

- Home -> Eventos -> Solicitud de evento -> Success
- Home -> Full Day -> Solicitud full day -> Success

## Pantallas y estados cubiertos

| Vista | Cómo se llega | Estados cubiertos |
|---|---|---|
| Home | URL inicial | success, loading |
| Habitaciones | CTA "Explorar bungalows" o cards destacadas | success, empty |
| Detalle de habitación | Click en card o CTA "Ver detalle" | success |
| Eventos | Teaser editorial y navegación superior | success, error |
| Full Day | Teaser editorial y navegación superior | success, error |
| Solicitud enviada | Submit del modal de prereserva | success |

## Estados UI

| Estado | Cómo se dispara |
|---|---|
| loading | Al aplicar búsqueda desde el hero |
| empty | Fechas/huéspedes sin coincidencia en la disponibilidad referencial |
| error | Envío demo con email vacío o simulación de falla |
| success | Solicitud enviada con CTA de seguimiento |

## Datos mock

- 3 categorías de habitación: Familiar Laguna, Suite Canopy, Bungalow Río
- 2 formatos de evento: boda íntima y retiro corporativo
- 2 programas de full day: piscina + restaurante, día amazónico familiar
- Tarifas referenciales en PEN con capacidad visible

## Limitaciones del prototipo

- Sin backend
- Sin pago online
- Sin OTAs reales
- Confirmación manual
