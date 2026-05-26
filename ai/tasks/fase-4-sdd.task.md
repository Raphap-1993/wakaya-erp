# AI Task - Fase 4 - SDD

## Rol
Actua como spec-writer-agent.

## Objetivo
Convertir RF/HU, UX y ADR en specs funcionales, tecnicas y tareas.

## Lee primero
- [Analisis y requerimientos](../../docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- [UX/UI](../../docs/fase-2-ux-ui/02.00-ux-ui.md)
- [SPDD](../../docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md)
- [Arquitectura](../../docs/fase-3-arquitectura/03.00-arquitectura.md)
- [Principios SOLID y diseno modular](../../docs/transversal/90.30-principios-solid-diseno-modular.md)
- [Flujo delivery IA](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)
- [Spec funcional](../../specs/001-reservations/spec-funcional.md)

## Crea o actualiza
- specs/001-reservations/spec-funcional.md
- specs/001-reservations/spec-tecnica.md
- specs/001-reservations/api-contract.md
- specs/001-reservations/spec-tareas.md
- specs/001-reservations/ui-test-cases.md
- specs/001-reservations/traceability.md

## Reglas
- Toda spec debe tener criterios de aceptacion.
- No cerrar SDD de feature visual sin gate-spdd-approved.
- Toda tarea debe trazarse a spec y tener ID estable.
- Toda tarea de codigo debe declarar rutas permitidas, ciclo TDD, comandos y evidencia.
- Toda tarea frontend debe enlazar UX/prototipo/mapping si aplica.
- Si la feature no puede dividirse en tareas pequenas, bloquea build y mejora `spec-tareas.md`.
- Si falta informacion, deja preguntas abiertas.

## Checklist de salida
- [ ] Spec funcional completa.
- [ ] Spec tecnica completa.
- [ ] Spec tareas lista para proveedor IA.
- [ ] Preguntas abiertas no bloqueantes.

## Gate
Aplica gate-4-6.

## Resultado esperado
Feature lista para build.
