# AI Task - Fase 2 UX - Wakaya ERP

## Rol
Actua como product-design-agent, ux-orchestrator-agent y prototype-agent.

## Objetivo
Transformar RF, HU y specs iniciales en Product Design, SPDD inicial y prototipo UX navegable HTML5 o Penpot.

## Lee primero
- [AGENTS.md](../../AGENTS.md)
- [Analisis y requerimientos](../../docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [HTML5-first Prototyping](../../docs/fase-2-ux-ui/02.14-html5-first-prototyping.md)
- [Penpot AI Prototyping](../../docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md)
- [Spec funcional](../../specs/001-reservations/spec-funcional.md)

## Crea o actualiza
- specs/001-reservations/product-design.md
- specs/001-reservations/spdd-frontend.md
- specs/001-reservations/prototype.md
- specs/001-reservations/prototype-validation.md
- specs/001-reservations/ui-test-cases.md
- specs/001-reservations/traceability.md
- specs/001-reservations/prototype-html5/index.html si se requiere validacion rapida
- ai/prompts/generated/ux-001-reservations.md
- ai/prompts/generated/prototype-html5-001-reservations.md
- ai/prompts/generated/penpot-001-reservations.md si se requiere formalizacion visual

## Reglas
- No inventes reglas funcionales.
- Cada pantalla debe indicar actor y objetivo.
- Incluye estados loading, empty, error, success y permission denied.
- Simula roles, permisos, validaciones, datos mock y feedback UX.
- Manten trazabilidad RF/HU/spec -> Product Design -> SPDD -> prototipo.

## Gate
- gate-ux-ready: Product Design y SPDD inicial.
- gate-prototype-ready: prototipo revisable.
- gate-spdd-approved: solo con validacion humana del prototipo.

## Resultado esperado
UX listo para validacion humana, prototipo HTML5/Penpot revisable y gates declarados.
