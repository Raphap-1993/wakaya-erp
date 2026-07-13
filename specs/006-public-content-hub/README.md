# 006 - Public Content Hub

[Specs](../README.md) | [ADR-012](../../docs/fase-3-arquitectura/adr/ADR-012-centro-contenido-media-inventario-unidades.md)

## Objetivo
Concentrar Home, Experiencias, Galería y contenido público de Bungalows en `/admin/content`, con publicación bilingüe y media WebP recortada y trazable.

## Estado de gates
- `gate-ux-ready`: aprobado por el Product Owner en el diseño del 2026-07-09.
- `gate-prototype-ready`: **APROBADO**; prototipo HTML5 nivel 3 y evidencia en `prototype-validation.md`.
- `gate-spdd-approved`: **APROBADO** por orden explícita de implementación del usuario del 2026-07-09; no implica revisión de capturas posteriores.
- `gate-4-6`: no habilitado para construcción visual.

## Documentos
- [Spec funcional](spec-funcional.md)
- [Spec técnica](spec-tecnica.md)
- [API contract](api-contract.md)
- [Product Design](product-design.md)
- [SPDD frontend](spdd-frontend.md)
- [Tareas](spec-tareas.md)
- [UI test cases](ui-test-cases.md)
- [Trazabilidad](traceability.md)

## Artefactos de prototipo esperados
- `prototype.md` - ruta y alcance del prototipo navegable.
- `prototype-validation.md` - evidencia automática y validación humana trazable.
- `prototype-html5/` - prototipo autocontenido, decisiones UX y flujo.

## Dependencias
- `005-home-content-management` aporta publicación/revisiones del Home.
- `004-bungalow-backoffice-media` queda absorbida por el pipeline común de media.
- `007-bungalow-unit-inventory` mantiene unidades físicas separadas del contenido del tipo.
