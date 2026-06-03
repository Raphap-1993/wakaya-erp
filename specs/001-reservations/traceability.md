# Traceability - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Proposito
Matriz viva que conecta requerimiento, diseno, prototipo, API, datos, codigo,
prueba, estado y evidencia. `node scripts/ai-framework-agent.mjs sync-memory`
la parsea para poblar la memoria del agente IA.

## Matriz de trazabilidad

> Reglas de llenado (v12.22+):
> - Usa `-` (guion) en `Codigo` y `Test` mientras esos artefactos NO existan en el repo.
> - Llena el nombre real cuando el archivo/clase/test exista. `sync-memory` distingue
>   automaticamente `planned` vs `implemented` y `validated` por columna `link_status`.
> - Si pones un nombre que no existe, `check-trace-drift` lo reportara como drift.

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations | reservation | src/lib/reservations/store.ts, src/app/api/reservations/route.ts | src/app/api/reservations/route.test.ts, src/lib/reservations/persistence.test.ts | Implementado y validado | prototype-validation.md |
| RF-02 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations/{id} | reservation | src/lib/reservations/store.ts, src/app/api/reservations/[id]/route.ts | src/app/api/reservations/[id]/route.test.ts | Implementado y validado | prototype-validation.md |
| RF-03 | HU-02 | spdd-frontend.md | prototype-html5/index.html | POST /api/reservations/{id}/assign | reservation | src/lib/reservations/store.ts, src/app/api/reservations/[id]/assign/route.ts | src/app/api/reservations/[id]/assign/route.test.ts | Implementado y validado | reglas-negocio-estados-criterios.md |
| RF-04 | HU-02 | spdd-frontend.md | prototype-html5/index.html | POST /api/reservations/{id}/status | reservation_audit | src/lib/reservations/state-machine.ts, src/lib/reservations/store.ts, src/app/api/reservations/[id]/status/route.ts | src/app/api/reservations/[id]/status/route.test.ts, tests/unit/reservations/state-machine.test.ts | Implementado y validado | reglas-negocio-estados-criterios.md |
| RF-05 | HU-03 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations/{id}/audit | reservation_audit | src/lib/reservations/audit.ts, src/lib/reservations/store.ts, src/app/api/reservations/[id]/audit/route.ts | src/app/api/reservations/[id]/audit/route.test.ts | Implementado y validado | prototype-validation.md |
| RF-06 | HU-04 | spdd-frontend.md | prototype-html5/index.html | POST /api/public/reservations | reservation | src/components/public-site/booking-band.tsx, src/lib/reservations/store.ts, src/app/api/public/reservations/route.ts | src/app/api/public/reservations/route.test.ts, src/lib/reservations/persistence.test.ts | Implementado y validado | prototype-validation.md |
| RNF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | 401/403 | rbac | src/lib/rbac.ts, src/middleware/authn.ts | src/middleware/authn.test.ts | Implementado y validado | docs/fase-3-arquitectura/03.08-auth-authz.md |

## Gates
| Gate | Estado | Evidencia |
|---|---|---|
| gate-prototype-ready | Pendiente | prototype-validation.md |
| gate-spdd-approved | Pendiente | spdd-frontend.md |

## Decisiones
- El prototipo aprobado alimenta campos, filtros, permisos y estados de error del API contract.

## Preguntas abiertas
- Catalogo final de estados.
