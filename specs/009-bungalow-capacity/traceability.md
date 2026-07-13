# Traceability - Wakaya Bungalow Capacity

| RF | UX | API/servicio | Prueba esperada | Estado |
|---|---|---|---|---|
| RF-009-01 | Tabla por rango | GET capacity | page + service tests | Validado local |
| RF-009-02 | Editar total | PUT capacity | version/update tests | Validado local |
| RF-009-05 | Resumen | availability service | status tests | Validado local |
| RF-009-06 | Error inline | PUT 409 | reduction tests | Validado local |
| RF-009-07 | Feedback carrera | transactional service | concurrency tests | Validado local |
| RF-009-08 | Acceso denegado | RBAC | auth tests | Validado local |
| RF-009-09 | Público agregado | public availability | response tests | Validado local |
| RF-009-10 | Legado auditado sin efecto | migration 012 + runtime | migration/availability tests | Reabierto 2026-07-13 |

RF-009-03 y RF-009-04 quedaron retirados por decisión del Product Owner el
2026-07-13. La evidencia anterior se conserva como historial, no como contrato.

Evidencia: [06.05 Bungalow Capacity](../../docs/fase-6-qa/06.05-bungalow-capacity-local-evidence.md).
