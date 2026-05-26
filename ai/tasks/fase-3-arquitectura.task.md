# AI Task - Fase 3 - Arquitectura

## Rol
Actua como architecture-agent.

## Objetivo
Revisar y completar arquitectura, decisiones tecnologicas, ADR y despliegue de Wakaya ERP.

## Lee primero
- [Analisis y requerimientos](../../docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [UX/UI](../../docs/fase-2-ux-ui/02.00-ux-ui.md)
- [Product Design](../../docs/fase-2-ux-ui/02.09-spec-driven-product-design.md)
- [SPDD Frontend](../../docs/transversal/90.34-product-design-y-spdd-frontend.md)
- [Arquitectura](../../docs/fase-3-arquitectura/03.00-arquitectura.md)
- [ADR-001](../../docs/fase-3-arquitectura/adr/ADR-001-stack-quarkus-angular-keycloak.md)
- [Principios SOLID y diseno modular](../../docs/transversal/90.30-principios-solid-diseno-modular.md)

## Crea o actualiza
- docs/fase-3-arquitectura/03.00-arquitectura.md
- docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md
- docs/fase-3-arquitectura/03.03-plan-despliegue.md
- docs/fase-3-arquitectura/adr/

## Reglas
- No cambiar tecnologia sin ADR.
- Declara riesgos y tradeoffs.
- Manten seguridad, despliegue y observabilidad visibles.
- Documenta capas, boundaries y dependencias con criterio SOLID: SRP por modulo, DIP en puertos y adaptadores, ISP en contratos de API.
- Si una excepcion a SOLID simplifica el MVP, documenta la razon en ADR o nota tecnica.

## Gate
Aplica gate-2-3.

## Resultado esperado
Arquitectura lista para specs y construccion.
