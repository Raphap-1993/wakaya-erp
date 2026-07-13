# 007 - Bungalow Unit Inventory

[Specs](../README.md) | [ADR-012](../../docs/fase-3-arquitectura/adr/ADR-012-centro-contenido-media-inventario-unidades.md)

## Objetivo
Separar los cinco tipos comerciales de las 17 unidades físicas, operar bloqueos manuales y garantizar disponibilidad/asignación con noches `[check-in, checkout)`.

## Estado de gates
- `gate-ux-ready`: aprobado por el Product Owner en el diseño del 2026-07-09.
- `gate-prototype-ready`: **APROBADO**; prototipo HTML5 nivel 2 y evidencia en `prototype-validation.md`.
- `gate-spdd-approved`: **APROBADO** por orden explícita de implementación del usuario del 2026-07-09; no implica revisión de capturas posteriores.
- `gate-4-6`: requiere rehearsal de migración y evidencia de no solape.

## Inventario inicial
- Familiar: 5 unidades.
- Matrimonial: 4 unidades.
- Individual: 5 unidades.
- Doble: 2 unidades.
- Triple: 1 unidad.

## Documentos
[Funcional](spec-funcional.md) · [Técnica](spec-tecnica.md) · [API](api-contract.md) · [Product Design](product-design.md) · [SPDD](spdd-frontend.md) · [Tareas](spec-tareas.md) · [UI tests](ui-test-cases.md) · [Trazabilidad](traceability.md)

## Artefactos de prototipo esperados
- `prototype.md` - rutas y escenarios navegables.
- `prototype-validation.md` - evidencia automática y validación humana trazable.
- `prototype-html5/` - prototipo autocontenido, decisiones UX y flujo.
