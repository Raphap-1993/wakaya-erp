# Command `/spec`

## Objetivo
Convertir requerimientos priorizados y SPDD aprobado en `spec funcional`, `spec tecnica`, contratos y tareas ejecutables.

## Fases donde aplica mejor
- `4 - Spec-Driven Development (SDD)`

## Required inputs
- RF, HU o slice priorizado,
- reglas de negocio,
- arquitectura y ADR aplicables,
- `gate-spdd-approved` si la feature toca experiencia visual,
- UX/prototipo/mapping si la feature toca frontend.

## Process
1. Validar que el alcance ya esta priorizado.
2. Si la feature es visual, validar que SPDD esta aprobado o bloqueado con observaciones aceptadas.
3. Escribir o cerrar `spec funcional`.
4. Derivar `spec tecnica`.
5. Crear o actualizar `api-contract.md` cuando haya backend afectado por UX.
6. Crear `spec de tareas` con tareas pequenas, rutas permitidas, TDD, comandos y evidencia.
7. Si hay frontend, vincular cada tarea visible a SPDD/prototipo/mapping.
8. Verificar trazabilidad a RF/HU, riesgos y pruebas.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| La tecnica la resolvemos sobre la marcha | No se construye sin `spec tecnica` minima |
| La tarea es obvia | Debe quedar particionada y trazable |

## Red flags
- No hay HU o requerimiento origen.
- Faltan reglas de negocio o restricciones.
- La feature cambia arquitectura y no dispara ADR.
- La feature visual no tiene `gate-spdd-approved`.
- La feature frontend ignora prototipo o mapping existente.

## Verification evidence
- `spec funcional` creada o actualizada,
- `spec tecnica` creada o actualizada,
- `api-contract.md` creado o actualizado si aplica,
- `spec de tareas` creada o actualizada,
- trazabilidad explicita a origen y pruebas.

## Artefactos relacionados
- `../prompts/generar-spec-funcional.md`
- `../prompts/generar-spec-tecnica.md`
- `../skills/spec-writer.skill.md`
- `../skills/writing-plans.skill.md`
- `../quality-gates/gate-4-6.md`
