# SPDD Frontend - Wakaya ERP Public Site

[README principal](../../README.md) | [Specs](../README.md)

## Flujo UX
El sitio publico debe conducir desde inspiracion y confianza hacia una
prereserva manual, con hospedaje como ruta dominante.

## Paginas
- Home
- Habitaciones
- Detalle de habitacion
- Eventos
- Full Day

## Estados UI
- Hero normal
- Hero con contexto de busqueda
- Card hover
- Solicitud enviada
- Empty referencial para disponibilidad
- Error suave de envio

## Componentes previstos
- PublicHeader
- HeroExperience
- FloatingBookingBar
- RoomCategoryCard
- EditorialTeaser
- GalleryTrustStrip
- PreReservationForm
- RequestSuccessState
- PublicFooter

## Interacciones visibles
- seleccionar fechas y huespedes en la barra flotante
- abrir una categoria de habitacion
- pasar de detalle a prereserva
- abrir teaser de Eventos o Full Day
- enviar una solicitud publica

## Reglas de composicion
- evitar layouts tipo SaaS
- evitar grids identicos para todas las secciones
- usar foto grande y aire editorial
- mantener CTA visibles pero integrados en la narrativa visual
