# Traceability - Wakaya Public Content Hub

[Specs](../README.md) | [Feature](README.md)

## Gates
- Product Design: `gate-ux-ready` aprobado por el Product Owner el 2026-07-09.
- Prototipo: `gate-prototype-ready` **APROBADO** con prototipo HTML5 nivel 3 y capturas desktop/mobile.
- SPDD: `gate-spdd-approved` **APROBADO** por orden explícita de implementación del 2026-07-09; evidencia exacta en `prototype-validation.md`.
- Construcción/QA: `gate-4-6` exige TDD, contratos y evidencia.

| Requisitos | Diseño/UI | Técnica/API | Tareas | Evidencia |
|---|---|---|---|---|
| RF-006-01/02/12 | `product-design.md`, `spdd-frontend.md` | adapter Home/redirects | T-006-004 | UI-006-01 |
| RF-006-02/05/06/12 | Home v2 y rutas legadas | servicio media único, URL write off | T-006-002B | tests de delegación/arquitectura |
| RF-006-03/11 | editor Experiencias ES/EN | `content_experience`, CRUD | T-006-001/003/005 | UI-006-02/03 |
| RF-006-04 | grid Galería | singleton gallery APIs | T-006-001/003/005 | UI-006-06 |
| RF-006-05 | tab Bungalows | tipo + asset IDs | T-006-001/004/005 | tests admin |
| RF-006-06/07 | crop dialog | optimizer/media API | T-006-002/003/005 | UI-006-04/05 |
| RF-006-08 | estados publish/conflict | expectedVersion/409 | T-006-001/003 | UI-006-10 |
| RF-006-09/10 | popup y CTA | public view/query contract | T-006-006 | UI-006-07/08/09 |
| RF-006-13 | formulario y detalle | `requested_experience_id`/booking API | T-006-001/003/006 | UI booking request detail |
| RF-006-18 | layout público localizado | contacto corporativo publicado | T-006-009 | UI-006-14 + tests de layout/componente |
| RF-006-19 | Home, catálogo y tab Bungalows | `sort_order`, desempate estable | T-006-009 | UI-006-15 + tests de orden |
| RF-006-20 | carrusel público del Home | colección completa y scroll-snap responsive | T-006-009 | UI-006-16 + test de carrusel |
