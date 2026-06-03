# TRACEABILITY_MATRIX

> Matriz global de trazabilidad: rollup de todas las features del proyecto.
> Cada feature mantiene su propio `traceability.md` dentro de `specs/` con el detalle;
> este archivo consolida la vista. `node scripts/ai-framework-agent.mjs sync-memory`
> parsea este archivo y las `traceability.md` por feature para poblar la memoria.

## Matriz global
| Feature | RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|---|
| 001-reservations | RF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations | reservation | src/lib/reservations/store.ts, src/app/api/reservations/route.ts | src/app/api/reservations/route.test.ts, src/lib/reservations/persistence.test.ts | Implementado y validado | specs/001-reservations/prototype-validation.md |
| 001-reservations | RF-02 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations/{id} | reservation | src/lib/reservations/store.ts, src/app/api/reservations/[id]/route.ts | src/app/api/reservations/[id]/route.test.ts | Implementado y validado | specs/001-reservations/prototype-validation.md |
| 001-reservations | RF-03 | HU-02 | spdd-frontend.md | prototype-html5/index.html | POST /api/reservations/{id}/assign | reservation | src/lib/reservations/store.ts, src/app/api/reservations/[id]/assign/route.ts | src/app/api/reservations/[id]/assign/route.test.ts | Implementado y validado | specs/001-reservations/reglas-negocio-estados-criterios.md |
| 001-reservations | RF-04 | HU-02 | spdd-frontend.md | prototype-html5/index.html | POST /api/reservations/{id}/status | reservation_audit | src/lib/reservations/state-machine.ts, src/lib/reservations/store.ts, src/app/api/reservations/[id]/status/route.ts | src/app/api/reservations/[id]/status/route.test.ts, tests/unit/reservations/state-machine.test.ts | Implementado y validado | specs/001-reservations/reglas-negocio-estados-criterios.md |
| 001-reservations | RF-05 | HU-03 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations/{id}/audit | reservation_audit | src/lib/reservations/audit.ts, src/lib/reservations/store.ts, src/app/api/reservations/[id]/audit/route.ts | src/app/api/reservations/[id]/audit/route.test.ts | Implementado y validado | specs/001-reservations/prototype-validation.md |
| 001-reservations | RF-06 | HU-04 | spdd-frontend.md | prototype-html5/index.html | POST /api/public/reservations | reservation | src/components/public-site/booking-band.tsx, src/lib/reservations/store.ts, src/app/api/public/reservations/route.ts | src/app/api/public/reservations/route.test.ts, src/lib/reservations/persistence.test.ts | Implementado y validado | specs/001-reservations/prototype-validation.md |
| 001-reservations | RNF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | 401/403 | rbac | src/lib/rbac.ts, src/middleware/authn.ts | src/middleware/authn.test.ts | Implementado y validado | docs/fase-3-arquitectura/03.08-auth-authz.md |

## Estado de gates por feature
| Feature | Gate | Estado | Evidencia |
|---|---|---|---|
| 001-reservations | gate-0-1 | Pendiente | docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md |
| 001-reservations | gate-prototype-ready | Pendiente | specs/001-reservations/prototype-validation.md |
| 001-reservations | gate-spdd-approved | Pendiente | specs/001-reservations/spdd-frontend.md |
| 002-public-site | gate-prototype-ready | Pendiente | specs/002-public-site/prototype-validation.md |
| 002-public-site | gate-spdd-approved | Pendiente | specs/002-public-site/prototype-validation.md |

## Requerimientos sin implementacion
- `001-reservations` ya tiene codigo y test enlazados en su matriz viva.
- `002-public-site` sigue en diseno SPDD y no se incluye aqui como implementacion productiva.

## Decisiones transversales
- Markdown es la fuente de verdad; la BD es un indice reconstruible.

## Preguntas abiertas globales
- Confirmar cuando `002-public-site` deja de ser prototipo y pasa a cobertura productiva.
