# Traceability - Wakaya Bungalow Unit Inventory

[Specs](../README.md) | [Feature](README.md)

## Gates
- `gate-ux-ready`: aprobado por el Product Owner el 2026-07-09.
- `gate-prototype-ready`: **APROBADO** con prototipo HTML5 nivel 2 y capturas desktop/mobile.
- `gate-spdd-approved`: **APROBADO** por orden explícita de implementación del 2026-07-09; evidencia exacta en `prototype-validation.md`.
- `gate-4-6`: exige rehearsal, backfill sin conflictos, TDD y prueba de concurrencia.
- `gate-7-8`: exige backup, mantenimiento/roll-forward post-activación, e2e y monitoreo de `409/503` y conflictos OTA.

| Requisitos | Diseño/UI | Técnica/API | Tareas | Evidencia |
|---|---|---|---|---|
| RF-007-01/02/11 | tipos/unidades | migration/backfill | T-007-002/004/007 | UI-007-01/10 |
| RF-007-01/05/08 | cinco unidades y defensa concurrente | drop constraint + unit lock + unique unit/date | T-007-002/003/005 | 5 Dobles pasan, 6ta falla; block/OTA races |
| RF-007-03/04/12 | dialog/historial | blocks API/audit | T-007-003/004/007 | UI-007-03/04/11 |
| RF-007-05 | resumen noches | intervalos semiabiertos | T-007-001 | UI-007-02 |
| RF-007-06/07/08 | selector unidad | availability/assign API | T-007-003/005/007 | UI-007-05/06/07 |
| RF-007-09/10/13 | agotado, tipos y fechas | public availability | T-007-006/008 | UI-007-08/09 |
| RF-007-14 | import/sync OTA | OTA contract + unit transaction | T-007-006B/009 | UI-007-13/14 + repository tests |
