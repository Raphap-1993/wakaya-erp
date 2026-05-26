# Spec tecnica - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Backend
- Endpoint base: /api/reservations.
- Seguridad: permiso reservation:read.
- Paquete Java: com.wakaya.erp.

## Frontend
- Angular/Nx.
- Componente de reservations en frontend/apps/web.
- Servicios de datos en librerias data-access.

## Modelo de datos

> Regla (validador `check-bd-documented`): toda tabla declarada en la columna
> `BD` de `traceability.md` de esta feature debe aparecer aqui como
> `Tabla \`<nombre>\`` con sus columnas. Si esta tabla la genera otra
> feature, basta con que viva en *alguna* `spec-tecnica.md` del repo.

Tabla `reservation` (cuando se implemente la entity vivira en
`src/backend/infrastructure/reservations/` segun los Componentes
impactados):

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| numero | TEXT | unico, formato RESERVATION-YYYY-NNNN |
| estado | TEXT | catalogo de estados |
| prioridad | TEXT | enum (alta/media/baja) |
| responsable_id | UUID FK | apunta a `usuario.id` |
| fecha_actualizacion | TIMESTAMPTZ | indice descendente |

Indices: `(estado, prioridad)` para listados y `(responsable_id, fecha_actualizacion DESC)`
para "mis pendientes". Restricciones: `numero` UNIQUE.

## Pruebas
- Unitarias de RBAC.
- Contract test de API.
- E2E de consulta de reservations.

## Delivery IA
- Las tareas deben ejecutarse desde `spec-tareas.md`.
- Cambios de comportamiento requieren TDD red-green-refactor.
- Cambios de contrato, seguridad o datos requieren review antes de QA.
