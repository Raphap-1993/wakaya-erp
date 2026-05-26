# AI Task - Fase 5 - Construccion

## Rol
Actua como build-agent.

## Objetivo
Implementar specs aprobadas de Wakaya ERP en backend, frontend y pruebas unitarias.

## Lee primero
- [Spec funcional](../../specs/001-reservations/spec-funcional.md)
- [Spec tecnica](../../specs/001-reservations/spec-tecnica.md)
- [Spec tareas](../../specs/001-reservations/spec-tareas.md)
- [Product Design](../../docs/fase-2-ux-ui/02.09-spec-driven-product-design.md)
- [SPDD Frontend](../../docs/transversal/90.34-product-design-y-spdd-frontend.md)
- [SPDD Frontend](../../docs/fase-5-construccion/05.01-spec-prototype-driven-development-frontend.md)
- [Arquitectura](../../docs/fase-3-arquitectura/03.00-arquitectura.md)
- [Principios SOLID y diseno modular](../../docs/transversal/90.30-principios-solid-diseno-modular.md)
- [Flujo delivery IA](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)

## Crea o actualiza
- backend/
- frontend/
- specs/001-reservations/spec-tareas.md

## Reglas
- No implementar features sin spec.
- No cambiar arquitectura sin ADR.
- Trabaja en rama o worktree aislado si hay cambios de codigo.
- Ejecuta una tarea por vez desde `spec-tareas.md`.
- Aplica TDD red-green-refactor en cambios de comportamiento.
- Si la tarea es frontend, valida spec + prototipo + mapping antes de codigo.
- Pide review antes de QA si cambia contrato, seguridad, datos o UX critica.
- En review: verifica SRP (cada clase/componente tiene una razon de cambio), DIP (dominio no depende de infraestructura), ISP (contratos no obligan a metodos no usados). Si hay violacion relevante, abre nota tecnica o ADR antes de cerrar la tarea.

## Ejecucion esperada
1. Selecciona tarea pendiente.
2. Declara archivos a modificar.
3. Si es frontend, declara prototipo/mapping origen.
4. Escribe prueba red.
5. Implementa green.
6. Refactoriza.
7. Ejecuta comandos de verificacion.
8. Actualiza estado/evidencia de tarea.

## Gate
Aplica gate-4-6.

## Resultado esperado
Codigo trazado a specs y listo para QA.
