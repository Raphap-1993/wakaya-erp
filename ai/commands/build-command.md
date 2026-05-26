# Command `/build`

## Objetivo
Implementar el slice minimo trazable desde specs hasta codigo y pruebas.

Cuando el slice es frontend, aplicar Spec + Prototype Driven Development: la implementacion debe partir de spec aprobada, prototipo validado, criterios UI y trazabilidad SPDD.

En la metodologia actual, SPDD debe estar aprobado antes de `/build`; este comando consume `gate-spdd-approved`, no lo reemplaza.

## Fases donde aplica mejor
- `5 - Construccion`

## Required inputs
- `spec funcional`,
- `spec tecnica`,
- tareas de implementacion,
- `gate-spdd-approved` si la feature es visual,
- UX/prototipo y mapping cuando la feature toca frontend,
- stack o modulo afectado.

## Process
1. Validar specs y contratos.
2. Si es frontend, validar consistencia spec + prototipo + mapping.
3. Preparar worktree o rama dedicada cuando se modifique codigo.
4. Seleccionar una tarea pequena de `spec-tareas.md`.
5. Ejecutar ciclo TDD: red, green y refactor.
6. Ejecutar build/test minimo del stack.
7. Actualizar trazabilidad y estado de la tarea.
8. Pedir `/review` antes de seguir si cambia contrato, seguridad, datos, accesibilidad o UX critica.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Agrego tests despues | No se acepta sin prueba minima |
| El contrato se entiende | Debe quedar explicito en specs o contratos |

## Red flags
- No hay `spec tecnica`.
- Frontend sin prototipo, wireframe o mapping cuando aplica.
- No hay criterio de aceptacion.
- Se cambia contrato sin ADR o sin actualizar la spec.

## Verification evidence
- comando de build/test ejecutado,
- resultado de build/test,
- archivos modificados,
- trazabilidad feature -> codigo -> test.

## Artefactos relacionados
- `../skills/backend.skill.md`
- `../skills/frontend.skill.md`
- `../skills/spec-prototype-driven-frontend.skill.md`
- `../skills/source-driven-development.skill.md`
- `../skills/using-git-worktrees.skill.md`
- `../skills/executing-plans.skill.md`
- `../skills/test-driven-development.skill.md`
- `../skills/debugging-workflow.skill.md`
- `../quality-gates/gate-frontend-spdd-ready.md`
