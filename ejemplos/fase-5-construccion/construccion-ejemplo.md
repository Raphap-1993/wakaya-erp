# Ejemplo de construccion del caso canonico

## Objetivo
Mostrar como las features canonicas se materializan en codigo y pruebas durante la fase 5.

## Trazabilidad principal
| Feature | Entrada SDD | Aterrizaje en codigo | Aterrizaje en pruebas |
|---|---|---|---|
| `001-bandeja-trabajo-expedientes` | `specs/001-bandeja-trabajo-expedientes/` | `src/frontend/modules/bandeja-expedientes/`, `src/backend/` y `src/shared/contracts/expedientes/` | `tests/unit/frontend/bandeja-expedientes/`, `tests/integration/api/expedientes/`, `tests/e2e/journeys/bandeja-expedientes/` |
| `002-cambio-estado-expediente` | `specs/002-cambio-estado-expediente/` | `src/frontend/modules/cambio-estado-expediente/`, `src/backend/` y `src/shared/contracts/expedientes/` | `tests/unit/frontend/cambio-estado-expediente/`, `tests/integration/api/expedientes/`, `tests/e2e/journeys/cambio-estado-expediente/` |
| `003-historial-auditoria-expediente` | `specs/003-historial-auditoria-expediente/` | `src/frontend/modules/historial-auditoria-expediente/`, `src/backend/` y `src/shared/contracts/expedientes/` | `tests/unit/frontend/historial-auditoria-expediente/`, `tests/integration/api/expedientes/`, `tests/e2e/journeys/historial-auditoria-expediente/` |

## Regla practica
- `specs/` define que se construye.
- `src/` muestra donde se implementa.
- `tests/` demuestra como se valida antes de pasar a QA formal.

## Rutas relacionadas
- `../../specs/README.md`
- `../../src/README.md`
- `../../tests/README.md`
