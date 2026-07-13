# Spec tareas - Wakaya Bungalow Capacity

## Regla de ejecución

No construir código productivo hasta aprobar `gate-spdd-approved`. Después,
cada tarea usa Red, Green, Refactor y evidencia.

## T-009-001 - Modelo y migración

Estado: `COMPLETADA LOCAL`.

Crear tablas agregadas, validación `5/4/5/2/1` y backfill de bloqueos legados.
Pruebas: migración idempotente, mismatch abortado y auditoría preservada.

## T-009-002 - Cálculo y concurrencia

Estado: `COMPLETADA LOCAL`.

Implementar disponibilidad nocturna, fecha crítica y lock por categoría.
Pruebas: checkout exclusivo, mínimo del rango, pendientes ignoradas, dos
confirmaciones concurrentes y rechazo de una tercera cuando se agota el cupo.

## T-009-003 - APIs y RBAC

Estado: `COMPLETADA LOCAL`.

Implementar consulta, edición y permiso `inventory:manage`. Pruebas: 401/403,
versión, 409, rutas de bloqueo inactivas y payload público.

## T-009-004 - UI administrativa

Estado: `COMPLETADA LOCAL`.

Construir `/admin/bungalow-capacity`, redirect legado y formularios aprobados.
Pruebas: cinco filas, noche crítica, acciones, feedback y ausencia de códigos.

## T-009-005 - Integraciones

Estado: `COMPLETADA LOCAL`.

Eliminar dependencias de unidades en reservas, booking requests y OTA.
Pruebas: confirmación, sold-out, idempotencia y cero exposición pública.

## T-009-006 - Rehearsal y entrega local

Estado: `VALIDADA LOCAL`; producción bloqueada. El lint focalizado de la
feature pasa, pero el lint global mantiene deuda preexistente fuera de esta
feature. Ver evidencia canónica.

Backup local, dry-run, apply, suite completa, typecheck, lint, build y
Playwright autenticado. Presentar demo y esperar aprobación de producción.

Evidencia: [06.06 Editor y cupos sin bloqueos](../../docs/fase-6-qa/06.06-content-workbench-capacity-simplification-local-evidence.md).

## T-009-007 - Retirada operativa de bloqueos

Estado: `COMPLETADA LOCAL` el 2026-07-13; producción bloqueada.

Red: probar que los bloqueos legados no descuentan disponibilidad y que UI/API
no exponen creación, cancelación, conteos ni registros activos.

Green: desconectar stores de cálculo, retirar route handlers y simplificar el
workbench a totales/reservas/disponibles.

Refactor: conservar tabla, tipos de migración y evidencia como legado de solo
auditoría; actualizar QA antes de cualquier deploy.

Evidencia: [06.06 Editor y cupos sin bloqueos](../../docs/fase-6-qa/06.06-content-workbench-capacity-simplification-local-evidence.md).
