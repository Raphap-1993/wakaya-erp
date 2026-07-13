# Spec técnica - Wakaya Bungalow Unit Inventory

[Specs](../README.md) | [Feature](README.md) | [ADR-012](../../docs/fase-3-arquitectura/adr/ADR-012-centro-contenido-media-inventario-unidades.md)

## Límites
Crear `src/lib/inventory/**` como autoridad de intervalos, disponibilidad, ranking y bloqueos. `reservations` orquesta pero no duplica esas reglas. La tabla `bungalow` continúa como tipo.

## Persistencia

### `bungalow_unit`
`id text PK`, `bungalow_id text FK`, `code text unique`, `name`, `active`, `sort_order`, `notes`, `version integer not null default 1`, `created_at`, `updated_at`.

### `bungalow_unit_block`
`id uuid PK`, `unit_id FK`, `start_date`, `end_date`, `reason_code`, `notes`, `status active|cancelled`, `created_by`, `created_at`, `cancelled_by`, `cancelled_at`; check `start_date < end_date`.

### Cambios aditivos
- `reservation.bungalow_unit_id` FK nullable durante migración;
- `reservation_occupancy.bungalow_unit_id` FK nullable solo durante backfill y `NOT NULL` al terminar;
- `alter table reservation_occupancy drop constraint if exists reservation_occupancy_bungalow_id_date_key` elimina la unicidad histórica por tipo/fecha;
- índice único `(bungalow_unit_id, date)` para ocupaciones bloqueantes; `bungalow_id` permanece como tipo sin unicidad temporal;
- auditoría incluye type/unit y causa.

## Seed
IDs estables y códigos `FAM-01..05`, `MAT-01..04`, `IND-01..05`, `DOB-01..02`, `TRI-01`. La resolución de tipo usa los IDs actuales y valida que existan exactamente los cinco tipos antes de insertar.

## Intervalos
`nightsForStay(checkIn, checkOut)` itera desde check-in hasta antes de checkout. Corregir la semántica inclusiva actual en `availability.ts` y `public-availability.ts`. Todas las comparaciones usan:
```text
overlap = startA < endB AND startB < endA
```

## Disponibilidad
Una unidad está disponible cuando:
- está activa;
- no tiene `reservation_occupancy` bloqueante en ninguna noche;
- no tiene `bungalow_unit_block active` que solape;
- no está retenida por una transacción concurrente.

Para confirmar: transacción, lock de filas de unidad/ocupación, segunda consulta de disponibilidad, inserción de noches, update de reserva y auditoría. Conflicto devuelve `unit_unavailable`.

## Protocolo común de locks
Asignación, bloqueo manual y OTA deben llamar `withUnitLock(client, unitIds, operation)` antes de revalidar o insertar. El helper ejecuta `select pg_advisory_xact_lock(hashtext($1))` para cada `unit_id` único ordenado ascendentemente.

Orden obligatorio:
1. abrir transacción;
2. bloquear `reservation`/`ota_reservation_link` por ID cuando aplique, en orden ascendente;
3. adquirir advisory locks de unidades por `unit_id` ascendente;
4. consultar ocupaciones y bloqueos del rango;
5. validar e insertar/actualizar;
6. commit libera los advisory locks automáticamente.

Nunca se adquiere una fila de reserva después del lock de unidad. El índice único unidad/fecha es la defensa final si un caller elude el helper.

## Backfill
`scripts/backfill-bungalow-units.mjs` opera en dry-run por defecto:
1. carga reservas/ocupaciones activas por tipo;
2. normaliza a `[check-in, checkout)`;
3. ordena por check-in, checkout, número;
4. asigna el código disponible más bajo;
5. reporta reserva sin unidad si la capacidad histórica se excede;
6. solo con `--apply` escribe en una transacción;
7. elimina explícitamente `reservation_occupancy_bungalow_id_date_key` antes de crear la unicidad nueva;
8. valida cero reservas futuras bloqueantes sin unidad y marca `reservation_occupancy.bungalow_unit_id NOT NULL`.

No se elimina `bungalow_id` ni la columna de ocupación legada en la primera release.

## Disponibilidad pública
Endpoint agregado recibe tipo, fechas y huéspedes. Si queda al menos una unidad, devuelve `available=true` y `suggestedUnitId` solo para consumidores internos; la respuesta pública expone cantidad, no código. Si no queda, calcula hasta tres tipos alternativos y hasta tres fechas alternativas del mismo tipo/duración, buscando check-ins posteriores hasta `checkIn + 60 días`. `POST booking-requests` repite la consulta dentro de la operación y no persiste al recibir agotado.

## Integración OTA
`ota_room_mapping.external_room_type_code -> bungalow_id` continúa resolviendo el tipo. `importOtaReservation` y `syncOtaReservations` delegan al servicio de inventario para estados bloqueantes:
1. localizar por `(provider_key, external_reservation_id)` y verificar `provider_event_version`/checksum;
2. si el evento ya fue aplicado, devolver el vínculo actual sin nuevas noches, auditorías o conflictos;
3. sugerir una unidad activa/libre y asignarla en la misma transacción del import/update;
4. ante sold-out, persistir/actualizar reserva y vínculo con `bungalow_unit_id = null`, no insertar ocupación y upsert de un `availability_conflict` abierto;
5. en reintento con disponibilidad, insertar noches, asignar unidad y resolver el conflicto;
6. en cambio de fechas/tipo, asegurar primero la nueva asignación; solo después liberar la anterior. Si falla, rollback de ocupación y conflicto con el payload deseado;
7. en cancelación, liberar noches y resolver conflictos idempotentemente.

Agregar un índice/constraint que impida más de un conflicto abierto `assignment_overlap` por reserva. OTA usa `withUnitLock` antes de revalidar/inserir. Los tests deben cubrir primer import, mismo evento, reintento, sold-out, concurrencia con asignación directa/bloqueo, cambio de fechas y cancelación.

## Fallback
El fallback local puede soportar tests/dev, pero producción con inventario por unidades requiere PostgreSQL. Si el store no está listo, disponibilidad pública responde `503 availability_unavailable`; nunca asume disponible.

## Seguridad
- lectura admin: `reservation:read`;
- CRUD/bloqueo: `reservation:write`;
- confirmación/cambio de unidad: `reservation:assign`;
- cada mutación genera auditoría.

## Errores
`invalid_stay_range`, `unit_not_found`, `unit_inactive`, `unit_unavailable`, `unit_block_conflict`, `bungalow_type_unavailable`, `migration_conflicts_detected`, `availability_unavailable`, `forbidden`.

## Pruebas
Unitarias de intervalos/ranking; repository con concurrencia; dos Dobles simultáneas exitosas y tercera rechazada; bloqueo vs asignación; OTA vs asignación; API 409/503; OTA import/sync/reintento/idempotencia/conflicto/cancelación; UI; Playwright; rehearsal up/down/backfill; build y healthcheck.

## Recuperación post-activación
Después de aceptar reservas o eventos OTA con unidades, no se restaura ciegamente una base anterior. Ante fallo se bloquean las mutaciones afectadas, se conserva lectura segura y se aplica roll-forward. Un backup se restaura aparte para reconciliación selectiva o desastre bajo RPO/RTO explícitos.
