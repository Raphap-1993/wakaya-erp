# AGENTS.md

## Proposito
Este repositorio contiene el proyecto real Wakaya ERP. Los agentes deben trabajar con metodologia AI-first, fases 0-8, Spec-Driven Development (SDD), trazabilidad y quality gates.

## Lectura inicial obligatoria
- docs/README.md
- docs/fase-0-iniciacion/00.01-vision-proyecto.md
- docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md
- docs/fase-2-ux-ui/02.09-spec-driven-product-design.md
- docs/fase-3-arquitectura/03.00-arquitectura.md
- specs/001-reservations/spec-funcional.md
- docs/transversal/90.33-flujo-delivery-ia-proveedores.md
- docs/transversal/90.34-product-design-y-spdd-frontend.md

## Reglas
- No avanzar a construccion sin spec funcional y tecnica.
- No construir frontend sin revisar `/ux`, prototipo, sistema de componentes y mapping cuando aplica.
- No ejecutar codigo por proveedor IA sin tareas pequenas, rutas permitidas, TDD y evidencia.
- No cambiar arquitectura sin ADR.
- No cerrar QA sin evidencia.
- No cerrar deploy sin rollback y monitoreo.
- Toda salida debe terminar en ruta canonica del proyecto.

## Dominio del proyecto
- El dominio es Wakaya ERP (recurso: reservations).
- NO usar como base el caso de ejemplo del template (expedientes, bandeja, gestion documental).
- Toda referencia en specs/, docs/ y ai/ debe hablar del dominio real: reservations.
- Si detectas texto de expedientes/bandeja que no fue reemplazado, corrigelo antes de avanzar.

## Anti-patrones criticos
- Copiar specs de ejemplo (001-bandeja-trabajo-expedientes) como si fueran del proyecto real.
- Generar archivos fuera de las rutas canonicas del proyecto.
- Declarar gates como aprobados sin evidencia real.
- Construir frontend o backend sin gate-spdd-approved cuando la feature es visual.
- Mezclar tareas de incrementos futuros en el MVP actual.

## Gates al inicio del proyecto
- gate-0-1: PENDIENTE - validar vision y requerimientos con el negocio.
- gate-ux-ready: PENDIENTE - product-design.md requiere validacion humana.
- gate-spdd-approved: PENDIENTE - prototipo requiere validacion antes de SDD.
- gate-4-6: NO APLICA todavia - esperar a que SPDD este aprobado.
