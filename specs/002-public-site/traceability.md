# Traceability - Wakaya ERP Public Site

[README principal](../../README.md) | [Specs](../README.md)

## Proposito
Matriz viva que conecta requerimientos publicos, UX/SPDD, prototipo,
implementacion futura y evidencia de aprobacion.

## Matriz de trazabilidad

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-01 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-home | - | - | src/app/prototype/public-site/layout.tsx, src/app/prototype/public-site/page.tsx, src/components/public-site/play-header.tsx, src/components/public-site/play-footer.tsx, src/components/public-site/public-site-data.ts | src/app/prototype/public-site/page.test.tsx, src/app/prototype/public-site/internal-route-smoke.test.tsx, e2e/public-site-prototype.spec.ts | Implementado y validado | prototype-validation.md |
| RF-02 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-habitaciones | GET /prototype/public-site/bungalows | - | src/components/public-site/booking-band.tsx, src/app/prototype/public-site/bungalows/page.tsx, src/components/public-site/public-site-data.ts | src/components/public-site/booking-band.test.tsx, src/app/prototype/public-site/bungalows/page.test.tsx, e2e/public-site-prototype.spec.ts | Implementado y validado | prototype-validation.md |
| RF-03 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-habitacion-detalle | GET /prototype/public-site/bungalows/[slug] | - | src/app/prototype/public-site/bungalows/[slug]/page.tsx, src/components/public-site/page-hero.tsx, src/components/public-site/public-site-data.ts | src/app/prototype/public-site/bungalows/[slug]/page.test.tsx, src/app/prototype/public-site/internal-route-smoke.test.tsx, e2e/public-site-prototype.spec.ts | Implementado y validado | prototype-validation.md |
| RF-04 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html#view-home | GET /prototype/public-site/bungalows?checkIn=&checkOut=&guests=&category= | - | src/components/public-site/booking-band.tsx, src/app/prototype/public-site/bungalows/page.tsx | src/components/public-site/booking-band.test.tsx, src/app/prototype/public-site/bungalows/page.test.tsx, e2e/public-site-prototype.spec.ts | Implementado y validado | prototype-validation.md |
| RF-05 | HU-PS-03 | spdd-frontend.md | prototype-html5/index.html#view-eventos | - | - | src/app/prototype/public-site/events/page.tsx, src/components/public-site/page-hero.tsx | src/app/prototype/public-site/internal-pages.test.tsx, src/app/prototype/public-site/internal-route-smoke.test.tsx | Implementado y validado | prototype-validation.md |
| RF-06 | HU-PS-04 | spdd-frontend.md | prototype-html5/index.html#view-full-day | - | - | src/app/prototype/public-site/services/page.tsx, src/components/public-site/page-hero.tsx | src/app/prototype/public-site/internal-pages.test.tsx, src/app/prototype/public-site/internal-route-smoke.test.tsx | Implementado y validado | prototype-validation.md |
| RF-07 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html | GET results + detail continuity | - | src/app/prototype/public-site/bungalows/page.tsx, src/app/prototype/public-site/bungalows/[slug]/page.tsx, src/components/public-site/play-header.tsx | src/app/prototype/public-site/bungalows/page.test.tsx, src/app/prototype/public-site/bungalows/[slug]/page.test.tsx, src/components/public-site/play-header.test.tsx | Implementado y validado | prototype-validation.md |
| RF-08 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html#view-home | - | - | src/app/prototype/public-site/about/page.tsx, src/app/prototype/public-site/gallery/page.tsx, src/app/prototype/public-site/publications/page.tsx, src/app/prototype/public-site/contact/page.tsx | src/app/prototype/public-site/internal-pages.test.tsx, src/app/prototype/public-site/internal-route-smoke.test.tsx | Implementado y validado | prototype-validation.md |

## Gates
| Gate | Estado | Evidencia |
|---|---|---|
| gate-prototype-ready | Pendiente | prototype-validation.md |
| gate-spdd-approved | Pendiente | prototype-validation.md |

## Decisiones
- El feature publica no comparte slug con `001-reservations`.
- El entrypoint canonico del prototipo es `prototype-html5/index.html`.
- La ruta dominante es hospedaje y prereserva manual.
- Eventos y Full Day son lineas secundarias con flujo propio de solicitud.

## Preguntas abiertas
- nombre final del endpoint publico de prereservas
- fuente exacta de disponibilidad y tarifario en la version conectada al backend
