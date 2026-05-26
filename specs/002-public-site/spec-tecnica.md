# Spec tecnica - Wakaya ERP Public Site

[README principal](../../README.md) | [Specs](../README.md)

## Objetivo tecnico
Traducir el subproyecto publico a una arquitectura de frontend aislable y
promovible a la app Next.js sin mezclarlo todavia con el backoffice.

## Estrategia
- prototipo HTML5 navegable primero
- promocion posterior a slices reales en Next.js
- datos mock en la fase de prototipo
- wiring real de disponibilidad y formularios en una fase posterior

## Paginas previstas
- `/`
- `/habitaciones`
- `/habitaciones/[slug]`
- `/eventos`
- `/full-day`

## Modelo de datos visible en prototipo
### HabitacionCard
- `slug`
- `nombre`
- `capacidad`
- `precioDesde`
- `highlights[]`
- `heroImage`

### HabitacionDetalle
- `slug`
- `nombre`
- `galeria[]`
- `capacidad`
- `amenidades[]`
- `tarifaBase`
- `reglas[]`
- `ctaLabel`

### SolicitudPublica
- `tipo`
- `nombreCompleto`
- `telefono`
- `correo`
- `fechaInicio`
- `fechaFin`
- `huespedes`
- `categoria`
- `mensaje`

## Fronteras tecnicas
- sin autenticacion publica
- sin pago online
- sin OTA
- sin persistencia real todavia
- sin CMS en esta ronda

## Promocion futura
Una vez aprobado el prototipo, esta superficie debe mapearse a componentes
reales de Next.js bajo una ruta publica del producto y a handlers de solicitud
publica separados del admin.
