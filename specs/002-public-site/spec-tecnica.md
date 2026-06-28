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

## Modelo de datos canonico para promocion

Tabla `leads`

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| lead_type | TEXT | lodging, event o full_day |
| full_name | TEXT | nombre visible de contacto |
| phone | TEXT | telefono principal |
| email | TEXT | correo del lead |
| start_date | DATE | fecha de inicio solicitada si aplica |
| end_date | DATE | fecha de fin solicitada si aplica |
| guests | INTEGER | numero de huespedes |
| category | TEXT | habitacion, evento o paquete |
| message | TEXT | comentario libre del visitante |
| status | TEXT | pending, qualified, rejected o converted |
| created_at | TIMESTAMPTZ | momento de captura |

Indices: `(lead_type, created_at DESC)`, `(status, created_at DESC)`, `(email)`.

Tabla `requests`

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| request_type | TEXT | pre_reservation, event o full_day |
| public_ref | TEXT | identificador expuesto al visitante |
| lead_id | UUID | referencia logica al lead origen si existe |
| intake_channel | TEXT | web_public por ahora |
| payload_hash | TEXT | huella del payload recibido |
| response_status | TEXT | accepted, queued, failed |
| created_at | TIMESTAMPTZ | momento de recepcion |

Indices: `(request_type, created_at DESC)`, `(public_ref)`, `(response_status, created_at DESC)`.

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
