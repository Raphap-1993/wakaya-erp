# Plantillas Fase 4 - SDD

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a plantillas](../README.md)

Plantillas reutilizables para el flujo completo de una feature: Product Design → SPDD → SDD. Los artefactos se instancian en `specs/<nnn-feature>/` a partir de estas plantillas.

## Nota de ubicacion
La practica SPDD se define en [Fase 2 UX/UI](../../docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md), pero sus artefactos por feature viven dentro de `specs/<feature>/` y usan estas plantillas porque alimentan directamente SDD (Fase 4). La carpeta `plantillas/fase-4-sdd/` agrupa todo lo que necesita una feature antes de construir.

## Plantillas disponibles

### Product Design
- [product-design.md](product-design.md) — problema, objetivo, usuarios, journey, hipotesis y metricas.

### SPDD — Spec + Prototype Driven Development
- [spdd-frontend.md](spdd-frontend.md) — flujo UX, pantallas, estados UI, validaciones y permisos visibles.
- [prototype.md](prototype.md) — estructura del prototipo o wireframe validable.
- [prototype-validation.md](prototype-validation.md) — registro de validacion y observaciones resueltas.
- [ui-test-cases.md](ui-test-cases.md) — casos de prueba UI derivados del prototipo.
- Para prototipos HTML5, crear tambien `specs/<feature>/prototype-html5/` usando [../fase-2-ux-ui/prototype-html5.md](../fase-2-ux-ui/prototype-html5.md) como registro de referencia.

### SDD — Spec-Driven Development
- [spec-funcional.md](spec-funcional.md) — historia, criterios de aceptacion y reglas de negocio.
- [spec-tecnica.md](spec-tecnica.md) — arquitectura, contratos internos y decisiones tecnicas.
- [api-contract.md](api-contract.md) — contrato OpenAPI o AsyncAPI de la feature.
- [spec-tareas.md](spec-tareas.md) — tareas ejecutables por backend, frontend, QA y ops.

### Trazabilidad
- [traceability.md](traceability.md) — tabla RF/HU → pantalla → componente → endpoint → prueba.

## Regla de uso
- Copia las plantillas necesarias a `specs/<nnn-feature>/`.
- Para features visuales: inicia siempre por Product Design y SPDD antes de cerrar SDD.
- No construir frontend sin `gate-spdd-approved`.
- Usar `gate-prototype-ready` antes de pedir validacion SPDD.

## Ejemplo de referencia
- [../../ejemplos/fase-4-sdd/README.md](../../ejemplos/fase-4-sdd/README.md)
