# Specs

[README principal](../README.md)

## Features iniciales
- [001-reservations](001-reservations/spec-funcional.md)
- [002-public-site](002-public-site/spec-funcional.md)
- [003-guest-trust-layer](003-guest-trust-layer/spec-funcional.md)
- [004-bungalow-backoffice-media](004-bungalow-backoffice-media/spec-funcional.md)
- [005-home-content-management](005-home-content-management/spec-funcional.md)
- [006-public-content-hub](006-public-content-hub/README.md) - centro único de Home, Experiencias, Galería, Bungalows y media
- [007-bungalow-unit-inventory](007-bungalow-unit-inventory/README.md) - tipos, nueve unidades físicas, bloqueos y disponibilidad
- [008-corporate-content](008-corporate-content/README.md) - contenido corporativo administrable y versionado
- [009-bungalow-capacity](009-bungalow-capacity/README.md) - cupos físicos por categoría y disponibilidad por reservas confirmadas
- [010-content-editor-workbench](010-content-editor-workbench/README.md) - edición diaria estructurada de contenido público
- [011-public-visual-identity](011-public-visual-identity/README.md) - identidad pública Lora/Montserrat y paleta ecolodge

## Secuencia vigente del incremento de contenido e inventario
1. `006-public-content-hub`: diseño/prototipo, contenido, media y publicación.
2. `007-bungalow-unit-inventory`: migración tipo/unidad, bloqueos y asignación.
3. Integración pública y corte conjunto por `gate-7-8`.

`009-bungalow-capacity` reemplaza operativamente a `007-bungalow-unit-inventory`.
Los códigos y unidades individuales de `007` quedan como legado de migración y no
como modelo activo del producto.

`004-bungalow-backoffice-media` y `005-home-content-management` se conservan como antecedentes. La implementación nueva debe converger en `006`, no crear editores o pipelines paralelos.

`010-content-editor-workbench` refina la experiencia de `005`, `006` y `008`
sin duplicar stores, APIs ni documentos de contenido.

## Estructura esperada por feature visual
- product-design.md
- spdd-frontend.md
- prototype.md
- prototype-validation.md
- spec-funcional.md
- spec-tecnica.md
- api-contract.md
- spec-tareas.md
- ui-test-cases.md
- traceability.md
- prototype-html5/ si se requiere validacion navegable rapida
