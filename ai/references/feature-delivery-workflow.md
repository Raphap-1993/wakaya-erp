# Referencia: Feature Delivery Workflow para proveedores IA

## Usala cuando
- una feature pasa de idea o specs a implementacion,
- un proveedor IA necesita pasos operativos claros,
- quieres evitar que el agente salte directo a codigo,
- necesitas coordinar worktree, TDD, revision, QA y cierre de rama.

## Flujo canonico
```text
brainstorming
  -> Product Design y SPDD si hay feature visual
  -> prototipo HTML5/Penpot listo
  -> gate-spdd-approved si hay feature visual
  -> spec aprobada
  -> writing-plans
  -> git worktree
  -> executing-plans
  -> TDD red-green-refactor
  -> code review
  -> QA/evidencia
  -> finish branch / PR
```

## Reglas
- No construir sin `spec-funcional.md`, `spec-tecnica.md` y `spec-tareas.md`.
- No cerrar SDD de feature visual sin prototipo validado.
- No ejecutar tareas genericas; cada tarea debe tener objetivo, rutas permitidas, verificacion y evidencia.
- No cambiar arquitectura, datos, seguridad o contratos sin ADR o actualizacion de spec.
- No cerrar tarea sin prueba o razon explicita de evidencia manual.
- No cerrar rama sin QA, resumen de cambios y riesgos residuales.

## Evidencia minima por etapa
| Etapa | Evidencia |
|---|---|
| Brainstorming | dos alternativas, recomendacion y preguntas abiertas |
| Writing plans | tareas pequenas con comandos y evidencia |
| Worktree | rama, ruta y base declaradas |
| TDD | prueba red, green y refactor o justificacion |
| Review | hallazgos priorizados o aprobacion con riesgo residual |
| QA | pruebas ejecutadas, defectos y resultado |
| Finish branch | checks finales, resumen PR/merge y limpieza definida |

## Red flags
- El proveedor IA no sabe que archivo editar.
- La tarea no tiene comando de verificacion.
- Se agrupan muchos cambios en una sola entrega.
- Se aprueba el gate solo porque la respuesta parece completa.
- Se omite revision entre tareas criticas.

## Rutas relacionadas
- `../skills/brainstorming.skill.md`
- `../skills/writing-plans.skill.md`
- `../skills/using-git-worktrees.skill.md`
- `../skills/executing-plans.skill.md`
- `../skills/test-driven-development.skill.md`
- `../skills/requesting-code-review.skill.md`
- `../skills/finishing-development-branch.skill.md`
- `../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
