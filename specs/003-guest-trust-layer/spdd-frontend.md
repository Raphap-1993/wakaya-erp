# SPDD Frontend - Wakaya Guest Trust Layer

[README principal](../../README.md) | [Specs](../README.md)

## Componentes principales
- `PlayFooter` — expone señales de confianza y navegación secundaria.
- `PublicPoliciesPage` — concentra políticas públicas de hospitalidad.
- `PublicPetFriendlyPage` — explica condiciones de viaje con mascotas.
- `PublicComplaintForm` — intake del Libro de Reclamaciones.
- `AdminComplaintsInbox` — listado y acceso rápido a casos.

## Estados UI

| Estado | Trigger | Comportamiento esperado |
|---|---|---|
| success | carga normal | render de links, contenido legal y formularios |
| validation-error | campos incompletos | mensajes inline claros |
| submission-success | reclamo enviado | código visible + confirmación |
| empty | sin reclamos en admin | mensaje y contexto operativo |
| error | falla de red o servidor | mensaje recuperable y retry |

## Feedback UX
- CTA móvil de booking band con tamaño táctil real.
- Footer con accesos expresivos bajo el texto principal.
- Confirmación visible al enviar reclamo.

## Accesibilidad
- labels asociados a todos los campos del Libro de Reclamaciones
- enlaces con texto visible, no solo icono
- focus visible en links y botones

## Responsive
- mobile: booking band apilada y CTA full width
- desktop: footer con columna editorial + trust shortcuts

## Trazabilidad hacia codigo
- `PlayFooter`
- `booking-band.tsx`
- `public-complaint-form.tsx`
- rutas públicas nuevas en `src/app/[locale]`
