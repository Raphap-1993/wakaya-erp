# Ejemplo: routing por intencion

## Caso 1 - idea vaga de negocio
Entrada:
> "Necesitamos dejar de trabajar con correo y Excel para registrar casos internos y controlar permisos."

Ruta recomendada:
- `ai/skills/using-project-skills.skill.md`
- `ai/skills/idea-refine.skill.md`
- `ai/prompts/transformar-idea-a-documentacion-inicial.md`
- `ai/references/requirements-and-discovery.md`

Salida esperada:
- borradores iniciales en fases `0-3`,
- supuestos y preguntas abiertas,
- siguiente paso hacia requerimientos.

## Caso 2 - requerimientos ambiguos
Entrada:
> "El analisis ya existe, pero mezcla reglas, RF y backlog."

Ruta recomendada:
- `ai/skills/using-project-skills.skill.md`
- `ai/skills/requirements-quality.skill.md`
- `ai/prompts/refinar-requerimientos.md`
- `ai/references/documentation-and-traceability.md`

Salida esperada:
- `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md` mas claro,
- RF y RNF verificables,
- backlog trazable.

## Caso 3 - release readiness
Entrada:
> "La feature ya paso QA y necesitamos preparar la salida a produccion."

Ruta recomendada:
- `ai/skills/using-project-skills.skill.md`
- `ai/skills/release-readiness.skill.md`
- `ai/prompts/preparar-release.md`
- `ai/references/quality-release-and-operations.md`

Salida esperada:
- checklist de salida refinada,
- evidencias faltantes,
- runbook y rollback mas claros,
- bloqueantes visibles antes del deploy.
