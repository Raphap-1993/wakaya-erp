# Migraciones sin downtime

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ops/data](README.md)

Patron expansion/contraction para cambiar el esquema de datos sin detener el servicio. Toda migracion destructiva (drop, rename, change type) se parte en dos releases.

## Ciclo en dos fases

### Fase 1 - Expansion (release N)
- Agrega nuevas estructuras sin romper las antiguas.
- El codigo escribe en ambas (dual-write) y lee de la antigua (source of truth).
- Se activa feature flag para habilitar la ruta nueva en lectura cuando lo indique la metrica.

Ejemplo, renombrar `cliente_nombre` a `customer_name`:
```sql
-- V3__add_customer_name.sql
ALTER TABLE clientes ADD COLUMN customer_name VARCHAR(200);
-- Backfill progresivo fuera de hora pico:
UPDATE clientes SET customer_name = cliente_nombre WHERE customer_name IS NULL LIMIT 10000;
```
La aplicacion escribe en ambas columnas y lee `cliente_nombre` hasta que el flag `cliente.read_customer_name.enabled` alcance 100%.

### Fase 2 - Contraction (release N+M)
- Cuando el 100% de las lecturas usa la nueva estructura y la retencion de lectores antiguos se respeta, se elimina la estructura antigua.
```sql
-- V4__drop_cliente_nombre.sql
ALTER TABLE clientes DROP COLUMN cliente_nombre;
```
Antes de merge:
- El codigo ya no referencia la columna antigua.
- El flag esta al 100% por al menos 7 dias.
- Se valida en staging con data production-like.

## Casos comunes

| Cambio | Expansion | Contraction |
|--------|-----------|-------------|
| Renombrar columna | Anadir nueva + backfill + dual-write | Drop vieja |
| Cambiar tipo | Anadir columna con nuevo tipo + backfill + dual-write | Drop vieja, rename nueva |
| Mover foreign key | Anadir nueva FK nullable + rellenar | Enforce NOT NULL + drop vieja |
| Particionar tabla | Crear nueva particionada + copia incremental | Swap + drop |
| Split de tabla | Crear tablas derivadas + dual-write | Drop origen |

## Reglas de oro
- Ninguna migracion bloquea lecturas ni escrituras mas de 5 segundos.
- `CREATE INDEX CONCURRENTLY` (Postgres) para indices grandes.
- Evitar `ALTER TABLE ... DEFAULT` sobre tablas grandes: usar columna nullable + backfill.
- Una transaccion por migracion; migraciones largas se parten en scripts pequenos.
- Toda migracion tiene rollback documentado o se declara irreversible en el PR.
- El pipeline corre `migrate-dry-run` contra un snapshot de staging antes de promover.

## Herramientas por stack
- node-next: `prisma migrate deploy`
- java-monolith: Flyway
- quarkus-angular: Flyway + Quarkus CLI
- spring-react: Flyway

## Observabilidad de la migracion
- Emite evento `audit.migracion.aplicada.v1` con `schemaVersion`, actor, duracion.
- Dashboard dedicado con tiempo por migracion historico.
- Alerta si una migracion dura mas de 60 segundos en produccion.

## Ejemplo de rollback
```sql
-- Rollback de V3 (solo si la expansion no ha llegado a 100%).
UPDATE clientes SET cliente_nombre = customer_name WHERE cliente_nombre IS NULL;
ALTER TABLE clientes DROP COLUMN customer_name;
```
Rollback despues de contraction requiere restore desde snapshot (ver `backup-restore.md`).
