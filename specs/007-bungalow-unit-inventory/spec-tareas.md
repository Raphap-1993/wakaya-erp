# Spec tareas - Wakaya Bungalow Unit Inventory

[Specs](../README.md) | [Feature](README.md)

## Regla de ejecución
No construir UI sin `gate-spdd-approved`. La migración se ensaya en copia antes de `--apply`; todo slice conserva Red, Green, Refactor y evidencia.

## T-007-001 - Semántica temporal
Objetivo: corregir noches a `[check-in, checkout)`.

Archivos permitidos:
- `src/lib/reservations/availability.ts`
- `src/lib/reservations/public-availability.ts`
- `src/lib/inventory/intervals.ts`
- tests vecinos

Ciclo TDD:
1. Red: `10..12` devuelve noches 10/11 y `12..13` no solapa.
2. Green: helper único y comparación semiabierta.
3. Refactor: eliminar implementación inclusiva duplicada.

Comando: `npm test -- src/lib/reservations/availability.test.ts src/lib/reservations/public-availability.test.ts src/lib/inventory/intervals.test.ts`

Trazabilidad: RF-007-05.

## T-007-002 - Modelo, seed y backfill dry-run
Objetivo: crear unidades, bloqueos y columnas aditivas.

Archivos permitidos:
- `db/migrations/010_bungalow_unit_inventory.sql`
- `scripts/backfill-bungalow-units.mjs`
- `src/lib/inventory/**`

Ciclo TDD:
1. Red: repositorio espera 17 unidades canónicas y dry-run reporta sobreventa o unidades históricas incompatibles.
2. Green: migración, seed y asignador determinista.
3. Refactor: reporte JSON y transacción `--apply`.

Comando: `npm test -- src/lib/inventory/backfill.test.ts src/lib/inventory/postgres-repository.test.ts && node scripts/backfill-bungalow-units.mjs --dry-run`

Trazabilidad: RF-007-01, RF-007-02, RF-007-11.

## T-007-003 - Disponibilidad y ranking
Objetivo: combinar ocupaciones y bloqueos, y sugerir unidad/alternativas.

Archivos permitidos:
- `src/lib/inventory/unit-lock.ts`
- `src/lib/inventory/unit-lock.test.ts`
- `src/lib/inventory/**`
- `src/lib/reservations/repository.ts`
- `src/lib/reservations/postgres-repository.ts`

Ciclo TDD:
1. Red: fixtures cubren inactiva, ranking y alternativas; unit-lock prueba fila owner primero y unit IDs deduplicados/ordenados.
2. Green: `withUnitLock`, servicio y queries PostgreSQL.
3. Refactor: separar policy de ranking del repositorio.

Comando: `npm test -- src/lib/inventory/availability.test.ts src/lib/inventory/postgres-repository.test.ts src/lib/reservations/postgres-repository.test.ts`

Trazabilidad: RF-007-03 a RF-007-06, RF-007-10.

## T-007-004 - APIs de inventario
Objetivo: CRUD de unidades, bloqueos y consulta admin.

Archivos permitidos:
- `src/app/api/admin/inventory/**`
- `src/lib/inventory/unit-lock.ts`
- `src/lib/inventory/postgres-repository.ts`
- `src/lib/rbac.ts`

Ciclo TDD:
1. Red: 401/403, rango inválido, overlap, cancel/version conflict y carrera block-vs-assignment.
2. Green: crear/cancelar bloqueos importa `withUnitLock`; cancel toma fila block primero y luego unit lock.
3. Refactor: respuestas y auditoría comunes.

Comando: `npm test -- src/app/api/admin/inventory/units/route.test.ts 'src/app/api/admin/inventory/units/[unitId]/route.test.ts' src/app/api/admin/inventory/blocks/route.test.ts 'src/app/api/admin/inventory/blocks/[blockId]/cancel/route.test.ts' src/middleware/authn.test.ts`

Trazabilidad: RF-007-01 a RF-007-04, RF-007-12.

## T-007-005 - Asignación transaccional
Objetivo: sugerir, cambiar y confirmar sin carrera.

Archivos permitidos:
- `src/app/api/reservations/[id]/assign/**`
- `src/lib/inventory/unit-lock.ts`
- `src/lib/inventory/**`
- `src/lib/reservations/**`

Ciclo TDD:
1. Red: dos Dobles simultáneas pasan, tercera falla; bloqueo manual y OTA compiten con asignación por la misma unidad.
2. Green: asignación importa `withUnitLock`, bloquea reservation row primero y luego units antes de revalidar/escribir.
3. Refactor: normalizar `unit_unavailable` y nueva sugerencia.

Comando: `npm test -- 'src/app/api/reservations/[id]/assign/route.test.ts' src/lib/reservations/postgres-temporal.test.ts src/lib/inventory/unit-lock.test.ts`

Trazabilidad: RF-007-06 a RF-007-08, RF-007-12.

## T-007-006 - Disponibilidad pública
Objetivo: bloquear tipo agotado y devolver hasta tres tipos y tres fechas alternativas dentro de 60 días.

Archivos permitidos:
- `src/app/api/public/availability/**`
- `src/app/api/public/booking-requests/**`
- `src/lib/inventory/**`

Ciclo TDD:
1. Red: tipo agotado persiste cero requests y retorna tipos/fechas con límites 3/60 días.
2. Green: preflight y revalidación en POST.
3. Refactor: no exponer IDs de unidad.

Comando: `npm test -- src/app/api/public/availability/route.test.ts src/app/api/public/booking-requests/route.test.ts src/lib/inventory/availability.test.ts`

Trazabilidad: RF-007-09, RF-007-10.

## T-007-006B - Integrar OTA con unidades físicas
Objetivo: asignar una unidad al import/sync OTA o registrar conflicto idempotente sin pisar noches.

Archivos permitidos:
- `src/lib/reservations/postgres-repository.ts`
- `src/lib/reservations/postgres-repository.test.ts`
- `src/lib/inventory/unit-lock.ts`
- `src/lib/inventory/**`
- `src/app/api/integrations/otas/**`
- `src/app/api/reservations/[id]/ota/**`

Ciclo TDD:
1. Red: tests de import asignado, sold-out, mismo evento, reintento resuelto, cambio de fechas y cancelación.
2. Green: OTA importa `withUnitLock`, bloquea identidad OTA/reserva primero, luego units, y ejecuta asignación/upsert idempotente.
3. Refactor: compartir el servicio de disponibilidad con reservas directas.

Comando: `npm test -- src/lib/reservations/postgres-repository.test.ts src/app/api/integrations/otas/booking/sync/route.test.ts src/app/api/integrations/otas/booking/recover/route.test.ts 'src/app/api/reservations/[id]/ota/resync/route.test.ts' 'src/app/api/reservations/[id]/ota/resolve-conflict/route.test.ts' src/lib/inventory/unit-lock.test.ts`

Trazabilidad: RF-007-08, RF-007-12, RF-007-14.

## T-007-007 - UI administrativa
Objetivo: construir resumen, unidades, bloqueos y selección editable.

Archivos permitidos:
- `src/app/admin/inventory/**`
- `src/app/admin/reservations/**`
- `src/app/admin/admin-navigation.ts`

Ciclo TDD:
1. Red: tests de conteos, resumen de noches y cambio de sugerencia.
2. Green: superficies definidas en SPDD.
3. Refactor: componentes de rango/estado compartidos.

Comando: `npm test -- src/app/admin/inventory/page.test.tsx src/app/admin/inventory/inventory-workbench.test.tsx src/app/admin/reservations/reservation-editor-form.test.tsx`

Trazabilidad: RF-007-01 a RF-007-08.

## T-007-008 - UI pública y alternativas
Objetivo: integrar preflight, bloqueo y cards alternativas.

Archivos permitidos:
- `src/app/[locale]/**`
- `src/components/public-site/**`

Ciclo TDD:
1. Red: submit agotado no llama create y muestra alternativas.
2. Green: preflight y selección de alternativa.
3. Refactor: copy localizado y estados accesibles.

Comando: `npm test -- 'src/app/[locale]/localized-public-site.test.tsx' src/components/public-site/public-booking-request-form.test.tsx`

Trazabilidad: RF-007-09, RF-007-10, RF-007-13.

## T-007-009 - Rehearsal, e2e y corte
Objetivo: probar migración, concurrencia, OTA, mantenimiento, roll-forward y monitoreo.

Archivos permitidos:
- `e2e/bungalow-unit-inventory.spec.ts`
- `docs/fase-7-deploy/**`
- `docs/fase-8-operacion/**`
- `specs/007-bungalow-unit-inventory/**`

Ciclo TDD:
1. Red: e2e y rehearsal detectan modelo legado.
2. Green: completar corte y smoke checks.
3. Refactor: registrar evidencia y criterio go/no-go.

Comandos:
```bash
node scripts/backfill-bungalow-units.mjs --dry-run
npm test
npm run typecheck
npm run build
npm run test:e2e -- e2e/bungalow-unit-inventory.spec.ts
npm run check:docs
```

Trazabilidad: RF-007-01 a RF-007-14.
