# Referencia: Framework Enterprise AI-First

## Usala cuando
- necesitas operar el framework completo y no solo un entregable aislado,
- una solicitud cruza metodologia, IA operacional, gates, trazabilidad o memoria,
- quieres verificar si el trabajo debe ir a `docs/`, `specs/`, `tests/`, `qa/`, `ops/`, `ai/`, `likec4/` o `contracts/`.

## Modelo operativo
| Capa | Responsabilidad | Artefactos |
|---|---|---|
| Metodologia | fases `0-8`, roles, entregables minimos y SDD | `docs/`, `specs/` |
| IA operacional | agents, prompts, skills, commands, gates y references | `ai/` |
| Gobierno | red flags, evidencia, trazabilidad y decisiones | `docs/transversal/`, `docs/fase-3-arquitectura/adr/` |
| Ejecucion | codigo, pruebas, QA, deploy y operacion | `src/`, `tests/`, `qa/`, `ops/`, `ci/` |
| Memoria local | indice, busqueda semantica y analitica opcional | `ai/memory/` |
| Instanciacion | creacion de proyecto real desde la plantilla | `scripts/new-service.mjs`, `template.config.example.json`, `stacks/` |

## Reglas de decision
- Si la entrada es idea, intake, conversacion o requerimiento informal, empieza con `/document`.
- Si la entrada es idea bruta, usa `/document` + `/plan`.
- Si la entrada ya es backlog priorizado, pasa a `/spec`.
- Si existe spec aprobada y alcance claro, pasa a `/build`.
- Si se requiere evidencia de calidad, usa `/test`.
- Si la pregunta es riesgo, consistencia o salud, usa `/review`.
- Si el foco es liberacion, rollback o produccion, usa `/ship`.
- Si el objetivo es crear un proyecto real, usa `ai/runbooks/crear-proyecto-real-con-agente.md` y `ai/prompts/crear-proyecto-real-desde-template.md`.

## Red flags enterprise
- El trabajo no declara fase ni command.
- El output no tiene ruta canonica.
- La salida mezcla discovery, arquitectura y construccion sin gate intermedio.
- Hay tecnologia elegida sin ADR o justificacion.
- Hay requerimientos sin RNF, reglas o backlog.
- Hay specs sin trazabilidad a RF/HU.
- Hay codigo sin prueba o evidencia.
- Hay release sin rollback, runbook o monitoreo.
- Hay memoria local sin reindexacion despues de cambios.
- Se crea un proyecto en otra ruta sin validar config, stack y destino.

## Evidencia minima
- fuente leida,
- ruta destino,
- command aplicado,
- gate revisado,
- artefactos IA usados,
- supuestos y preguntas abiertas,
- trazabilidad a requerimientos, specs, ADR, pruebas o evidencias.
- para creacion de proyecto real: ruta destino, config validada y validaciones post-creacion.

## Rutas relacionadas
- `../agents/enterprise-ai-framework-agent.md`
- `../prompts/orquestar-framework-enterprise-ai-first.md`
- `../prompts/crear-proyecto-real-desde-template.md`
- `../skills/framework-governance.skill.md`
- `../skills/documentation-orchestration.skill.md`
- `../commands/document-command.md`
- `../quality-gates/gate-documentation-ready.md`
- `../runbooks/crear-proyecto-real-con-agente.md`
- `local-ai-memory.md`
- `../../docs/transversal/90.32-agente-interno-framework-ai-first.md`
