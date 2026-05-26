# TRACEABILITY_MATRIX

> Matriz global de trazabilidad: rollup de todas las features del proyecto.
> Cada feature mantiene su propio `traceability.md` dentro de `specs/` con el detalle;
> este archivo consolida la vista. `node scripts/ai-framework-agent.mjs sync-memory`
> parsea este archivo y las `traceability.md` por feature para poblar la memoria.

## Matriz global
| Feature | RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|---|
| 001-reservations | RF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations | reservation | reservationQueryService | reservationQueryTest | Spec inicial | spec-funcional.md |

## Estado de gates por feature
| Feature | Gate | Estado | Evidencia |
|---|---|---|---|
| 001-reservations | gate-0-1 | Pendiente | docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md |
| 001-reservations | gate-prototype-ready | Pendiente | specs/001-reservations/prototype-validation.md |

## Requerimientos sin implementacion
- RF-01: definido en spec inicial, sin codigo ni test.

## Decisiones transversales
- Markdown es la fuente de verdad; la BD es un indice reconstruible.

## Preguntas abiertas globales
- Confirmar alcance del MVP con el negocio.
