# Spec técnica - Wakaya Bungalow Capacity

## Persistencia

### `bungalow_capacity`

`bungalow_id text PK/FK`, `total_units integer >= 0`, `version integer`,
`updated_by text`, `created_at`, `updated_at`.

### `bungalow_capacity_block` (legado de solo auditoría)

La tabla y sus registros se conservan para rollback/auditoría. No se leen para
calcular disponibilidad y no reciben nuevas mutaciones desde la aplicación.

## Disponibilidad

El servicio calcula todas las noches con semántica semiabierta. Para cada fecha
cuenta reservas con estado bloqueante. Devuelve el menor disponible y la primera
fecha que alcanza ese valor.

Estados bloqueantes: `ota_imported_confirmed`, `confirmed`, `assigned`,
`checked_in`, `checked_out` y `paid`.

## Concurrencia

Toda mutación que cambie compromisos ejecuta:

1. abrir transacción;
2. adquirir `pg_advisory_xact_lock(hashtext('bungalow-capacity:' || bungalow_id))`;
3. releer capacidad y reservas;
4. validar todas las noches;
5. escribir y auditar;
6. commit.

## Migración 012

- crea tablas agregadas;
- inserta los cinco totales aprobados;
- compara conteos activos legados y aborta si difieren;
- conserva la copia histórica de bloqueos legados creada por la migración ya
  ensayada, pero el runtime no la consume;
- conserva `bungalow_unit`, `bungalow_unit_block` y referencias existentes;
- no modifica `bungalow.capacity`.

## Fallback

Desarrollo puede usar snapshot local. Producción requiere PostgreSQL y devuelve
`503 availability_unavailable` si no puede decidir con seguridad.
