# Traceability - Wakaya ERP Public Site

[README principal](../../README.md) | [Specs](../README.md)

## Proposito
Matriz viva que conecta requerimientos publicos, UX/SPDD, prototipo,
implementacion futura y evidencia de aprobacion.

## Matriz de trazabilidad

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-01 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-home | - | - | - | - | En diseno SPDD | product-design.md |
| RF-02 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-habitaciones | - | - | - | - | En diseno SPDD | product-design.md |
| RF-03 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-habitacion-detalle | - | - | - | - | En diseno SPDD | product-design.md |
| RF-04 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html#view-home | POST /public/pre-reservations | leads | - | - | En diseno SPDD | prototype.md |
| RF-05 | HU-PS-03 | spdd-frontend.md | prototype-html5/index.html#view-eventos | POST /public/event-requests | leads | - | - | En diseno SPDD | prototype.md |
| RF-06 | HU-PS-04 | spdd-frontend.md | prototype-html5/index.html#view-full-day | POST /public/full-day-requests | leads | - | - | En diseno SPDD | prototype.md |
| RF-07 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html | 202 accepted | requests | - | - | En diseno SPDD | prototype-validation.md |
| RF-08 | HU-PS-02 | spdd-frontend.md | prototype-html5/index.html#view-home | - | - | - | - | En diseno SPDD | spec-funcional.md |

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
