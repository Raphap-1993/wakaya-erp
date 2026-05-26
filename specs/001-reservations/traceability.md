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
| RF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations | wakaya-erp | - | - | Prototipo en revision | prototype-validation.md |
| RF-02 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/reservations/{id} | wakaya-erp | - | - | Prototipo en revision | prototype-validation.md |
| RNF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | 401/403 | rbac | - | - | En diseno SDD | docs/fase-3-arquitectura/03.08-auth-authz.md |

## Gates
| Gate | Estado | Evidencia |
|---|---|---|
| gate-prototype-ready | Pendiente | prototype-validation.md |
| gate-spdd-approved | Pendiente | spdd-frontend.md |

## Decisiones
- El prototipo aprobado alimenta campos, filtros, permisos y estados de error del API contract.

## Preguntas abiertas
- Catalogo final de estados.
