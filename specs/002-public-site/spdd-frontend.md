# SPDD Frontend - Wakaya ERP Public Site

[README principal](../../README.md) | [Specs](../README.md)

## Flujo UX
El sitio publico debe conducir desde un hero slider dominante hacia booking,
habitaciones destacadas y bloques comerciales amplios antes de pasar a
prereserva manual, con hospedaje como ruta dominante.

## Entrada canonica del flujo
La referencia de arranque para revision visual y walkthrough funcional queda
definida en `prototype-html5/index.html?view=home`.

## Paginas
- Home
- Habitaciones
- Detalle de habitacion
- Eventos
- Full Day

## Estados UI
- Hero slider con slide activo
- Booking band flotante en desktop y apilada en mobile
- Room card hover
- Solicitud enviada
- Empty referencial para disponibilidad
- Error suave de envio

## Componentes previstos
- PublicHeader
- HeroSlider
- BookingBand
- RoomShowcaseGrid
- PromoSplit
- ServicesGrid
- ExperienceSplit
- ImmersiveGallery
- FinalReservationCta
- PreReservationForm
- RequestSuccessState
- PublicFooter

## Interacciones visibles
- navegar slides del hero y seguir CTA hacia habitaciones o consulta
- seleccionar fechas y huespedes en la barra flotante
- abrir una categoria de habitacion
- pasar de detalle a prereserva
- abrir bloques de Eventos o Full Day desde la home
- enviar una solicitud publica

## Reglas de composicion
- usar estructura casi directa de `Parador`
- hero slider ancho y dominante
- booking bar inmediata bajo hero
- habitaciones como primera seccion comercial
- alternar bloques grandes para promo, servicios, eventos/full day y galeria
- evitar apariencia de pagina angosta o landing SaaS
- la home actual del prototipo deja de ser referencia visual
