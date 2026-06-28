# Spec tecnica - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Backend
- Endpoint base: /api/reservations.
- Endpoint publico de intake: /api/public/reservations.
- Seguridad: permiso reservation:read.
- Implementacion server-first sobre Next.js App Router.
- Permisos esperados: reservation:read, reservation:write, reservation:assign, reservation:approve.

## Frontend
- Next.js + TypeScript.
- Rutas operativas en `src/app/admin/reservations`.
- Componentes y utilidades compartidas en `src/components` y `src/lib`.

## Modelo de datos

> Regla (validador `check-bd-documented`): toda tabla declarada en la columna
> `BD` de `traceability.md` de esta feature debe aparecer aqui como
> `Tabla \`<nombre>\`` con sus columnas. Si esta tabla la genera otra
> feature, basta con que viva en *alguna* `spec-tecnica.md` del repo.

Tabla `reservation`:

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| numero | TEXT | unico, formato RESERVATION-YYYY-NNNN |
| canal | TEXT | web u ota |
| estado | TEXT | catalogo de estados |
| bungalow_id | UUID FK | apunta a `bungalow.id` |
| responsable_id | UUID FK | apunta a `usuario.id` |
| fecha_inicio | DATE | primera noche reservada |
| fecha_fin | DATE | ultima noche reservada |
| fecha_actualizacion | TIMESTAMPTZ | indice descendente |

Indices: `(estado, fecha_actualizacion DESC)` para listados y `(responsable_id, fecha_actualizacion DESC)`
para "mis pendientes". Restricciones: `numero` UNIQUE.

Tabla `bungalow`

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| codigo | TEXT | unico, visible para operacion |
| nombre | TEXT | nombre legible |
| activo | BOOLEAN | habilitado para reservas |
| capacidad | INTEGER | personas maximas |

Restricciones: `codigo` UNIQUE.

Tabla `reservation_occupancy`

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| reservation_id | UUID FK | apunta a `reservation.id` |
| bungalow_id | UUID FK | apunta a `bungalow.id` |
| fecha | DATE | noche bloqueada |
| source | TEXT | web u ota |
| status | TEXT | provisional, confirmed, released |
| fecha_creacion | TIMESTAMPTZ | registro de bloqueo |

Indices: `reservation_id`, `bungalow_id`, `fecha`.
Restriccion unica: `(bungalow_id, fecha)` para evitar solape.

Tabla `reservation_audit`

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| reservation_id | UUID FK | apunta a `reservation.id` |
| actor_id | UUID FK | usuario responsable |
| accion | TEXT | cambio realizado |
| estado_anterior | TEXT | antes del cambio |
| estado_nuevo | TEXT | despues del cambio |
| motivo | TEXT | razon o comentario |
| fecha_creacion | TIMESTAMPTZ | timestamp de auditoria |

Indices: `(reservation_id, fecha_creacion DESC)`.

Tabla `rbac`

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| subject_type | TEXT | usuario, rol o grupo |
| subject_id | TEXT | identificador del sujeto autorizado |
| resource | TEXT | modulo o agregado protegido |
| permission | TEXT | reservation:read, write, assign, approve |
| effect | TEXT | allow o deny |
| scope | TEXT | all, own o policy-bound |
| condition_hash | TEXT | huella de condicion avanzada si aplica |
| updated_at | TIMESTAMPTZ | ultima sincronizacion de la regla |

Indices: `(subject_type, subject_id)`, `(resource, permission)`.

## Persistencia actual
- La implementacion operativa del modulo usa una persistencia SQLite local para el ledger de reservas, ocupacion y auditoria.
- La ruta se controla con `WAKAYA_RESERVATIONS_DB_PATH`; por defecto se recomienda `.data/wakaya-reservations.sqlite` en despliegues locales o de VPS.
- El esquema canonico sigue siendo el mismo y coincide con las tablas documentadas arriba.

## Pruebas
- Unitarias de RBAC.
- Contract test de API.
- Unitarias de maquina de estados.
- Test de bloqueo de disponibilidad.
- E2E de consulta y asignacion de reservations.

## Reglas canonicas del dominio
- [Reglas de negocio, estados y criterios de aceptacion](reglas-negocio-estados-criterios.md)

## Delivery IA
- Las tareas deben ejecutarse desde `spec-tareas.md`.
- Cambios de comportamiento requieren TDD red-green-refactor.
- Cambios de contrato, seguridad o datos requieren review antes de QA.
