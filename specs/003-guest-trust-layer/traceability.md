# Traceability - Wakaya Guest Trust Layer

[README principal](../../README.md) | [Specs](../README.md)

## Proposito
Conectar la capa de confianza pública y el flujo de reclamos con diseño, API,
persistencia, código y pruebas.

## Matriz de trazabilidad

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-01 | HU-GT-01 | spdd-frontend.md | prototype.md | - | - | src/components/public-site/play-footer.tsx | src/components/public-site/play-footer.test.tsx | En implementación | product-design.md |
| RF-02 | HU-GT-01 | spdd-frontend.md | prototype.md | - | - | src/app/[locale]/policies/page.tsx | - | En spec | spec-funcional.md |
| RF-03 | HU-GT-02 | spdd-frontend.md | prototype.md | - | - | src/app/[locale]/pet-friendly/page.tsx | - | En spec | spec-funcional.md |
| RF-04 | HU-GT-03 | spdd-frontend.md | prototype.md | POST /api/public/complaints | complaint_entry | src/app/api/public/complaints/route.ts, src/components/public-site/public-complaint-form.tsx | src/app/api/public/complaints/route.test.ts, src/components/public-site/public-complaint-form.test.tsx | En spec | api-contract.md |
| RF-05 | HU-GT-03 | spdd-frontend.md | prototype.md | POST /api/public/complaints | complaint_entry | src/lib/reservations/store.ts | src/app/api/public/complaints/route.test.ts | En spec | spec-tecnica.md |
| RF-06 | HU-GT-04 | spdd-frontend.md | prototype.md | GET /api/admin/complaints | complaint_entry | src/app/admin/complaints/page.tsx, src/app/admin/complaints/[id]/page.tsx | src/app/admin/complaints/page.test.tsx, src/app/admin/complaints/[id]/page.test.tsx | En spec | spec-funcional.md |

## Gates
| Gate | Estado | Evidencia |
|---|---|---|
| gate-prototype-ready | Pendiente | prototype-validation.md |
| gate-spdd-approved | Pendiente | prototype-validation.md |

## Decisiones
- El Libro de Reclamaciones vive como flujo propio, no dentro de reservas.
- La señal pet friendly se comunica como confianza pública y coordinación previa.
- La capa pública reescribe copy para huésped final y SEO local.
