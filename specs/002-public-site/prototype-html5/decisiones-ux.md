# Decisiones UX prototipo HTML5 — Wakaya ERP Public Site

## Decisión de patrón de producto

- Dominio del spec: hospitality / lodge / reserva guiada
- Actor principal: visitante web que evalúa hospedaje premium
- Tarea principal navegable de inicio a fin: descubrir Wakaya -> revisar habitaciones -> abrir detalle -> enviar prereserva manual
- Patrón visual elegido: otro — hospitality editorial + ecommerce-guided
- Por qué NO se usa una shell genérica sidenav+tabla: el sitio es una superficie pública aspiracional; una shell SaaS rompería la atmósfera premium, la venta emocional del lodge y el journey de conversión.
- Interacciones del prototipo:
  - elegir fechas y huéspedes en la booking bar flotante
  - abrir una categoría de habitación y pasar al detalle
  - enviar una solicitud de prereserva, evento o full day
- Limitaciones conocidas: sin backend real, sin correo real, sin calendario conectado a OTAs, disponibilidad solo referencial

## Golden de referencia

- Path: `ejemplos/fase-2-ux-ui/prototype-html5-golden/ecommerce-checkout/index.html` + `ejemplos/fase-2-ux-ui/prototype-html5-golden/streaming-catalogo-player/index.html`
- Mezcla controlada: `ecommerce-checkout` aporta estructura comercial, CTA y summary guiado; `streaming-catalogo-player` aporta hero editorial, ritmo visual y navegación inmersiva.
- Patrones estructurales que voy a replicar:
  - hero dominante con narrativa y CTA claros
  - topbar ligera con navegación editorial y link discreto al hub
  - bloques secundarios con cards visuales y transiciones a detalle
- Tokens base reutilizados de `:root`:
  - `--brand`
  - `--brand-deep`
  - `--sand`
  - `--forest`
  - `--sunset`
  - `--surface`
  - `--surface-strong`
  - `--ink`
  - `--muted`
  - `--shadow-lg`

## Contrato del prototipo

- Estados: loading, empty, error, success
- Roles: visitante web, huésped potencial, prospecto de evento, prospecto de full day
- Entidades: habitación, categoría, tarifa, solicitud, evento, full day
- RF representados: RF-01 a RF-08
