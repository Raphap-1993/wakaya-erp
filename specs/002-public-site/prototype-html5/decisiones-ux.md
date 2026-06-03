# Decisiones UX prototipo HTML5 — Wakaya ERP Public Site

## Decisión de patrón de producto

- Dominio del spec: hospitality / lodge / reserva guiada
- Actor principal: visitante web que evalúa hospedaje premium
- Tarea principal navegable de inicio a fin: descubrir Wakaya -> revisar habitaciones -> abrir detalle -> enviar prereserva manual
- Patrón visual elegido (streaming / operativo / ecommerce / educación / salud / dashboard / otro): otro — hospitality premium comercial inspirado casi directo en `Parador`
- Por qué NO se usa una shell genérica sidenav+tabla: el sitio es una superficie pública aspiracional; una shell SaaS rompería la atmósfera premium, el peso comercial del hero slider y el journey de conversión.
- Interacciones del prototipo (mínimo 3, expresadas como acciones reales del producto):
  - navegar el hero slider y entrar por CTA principal
  - elegir fechas y huéspedes en la booking bar flotante
  - abrir una categoría de habitación y pasar al detalle
  - enviar una solicitud de prereserva, evento o full day
- Limitaciones conocidas: sin backend real, sin correo real, sin calendario conectado a OTAs, disponibilidad solo referencial

## Golden de referencia

- Path: referencia visual externa `Parador`
- Por qué este golden: aporta hero slider, booking band protagonista, cards comerciales y ritmo hospitality.
- Patrones estructurales que voy a replicar:
  - hero slider dominante con CTA
  - booking band flotante inmediatamente debajo
  - habitaciones destacadas primero
  - bloques promo y galeria en secuencia comercial
- Señales de traduccion a Wakaya:
  - paleta verde Wakaya y neutros calidos
  - fotos de laguna, personas, bungalows y vegetacion
  - copy de hospedaje primero con eventos y full day como lineas secundarias
  - cierre comercial claro sin reutilizar la home actual como base visual

## Contrato del prototipo

- Estados: loading, empty, error, success
- Roles: Visitante web, Huesped potencial, Prospecto de evento, Prospecto de full day
- Entidades: habitación, categoría, tarifa, solicitud, evento, full day
- RF representados: RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08
