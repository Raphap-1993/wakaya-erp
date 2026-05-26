# Mapeo selectivo a agent-skills

[README principal](../README.md) | [Indice docs](../docs/README.md) | [Volver a ai](README.md)

Este archivo no importa `agent-skills` como dependencia. Solo mapea patrones utiles al contexto de esta plantilla.

## Regla
- El repositorio conserva su propio estandar por fases.
- `agent-skills` se usa como referencia de enforcement, no como reemplazo del modelo documental.

## Mapeo por fase e intencion
| Fase o foco | Recomendacion externa | Equivalente local |
|---|---|---|
| Fase 0 | `idea-refine` | `ai/skills/idea-refine.skill.md` |
| Fase 1 | `spec-driven-development` | `ai/skills/requirements-quality.skill.md` |
| Fase 4 | `planning-and-task-breakdown` | `ai/skills/spec-writer.skill.md` |
| Fase 5 backend | `incremental-implementation`, `source-driven-development` | `ai/skills/backend.skill.md`, `ai/skills/source-driven-development.skill.md` |
| Frontend | `frontend-ui-engineering`, `browser-testing` | `ai/skills/frontend.skill.md`, `ai/skills/browser-testing.skill.md` |
| APIs | `api-and-interface-design` | `ai/prompts/generar-spec-tecnica.md`, `ai/skills/backend.skill.md` |
| QA | `debugging-and-error-recovery`, `code-review-and-quality` | `ai/skills/debugging-workflow.skill.md`, `ai/skills/qa.skill.md` |
| Deploy | `ci-cd-and-automation`, `shipping-and-launch` | `ai/skills/devops.skill.md`, `ai/skills/shipping-and-launch.skill.md` |
| Operacion | `performance-optimization`, `security-and-hardening` | `ai/skills/performance-optimization.skill.md`, `ai/skills/security-hardening.skill.md` |

## Cuando usar este mapeo
- cuando el equipo ya conoce `agent-skills`,
- cuando se quiere traducir una intencion externa al modelo del repo,
- cuando se adapta la capa `ai/` de un proyecto real.
