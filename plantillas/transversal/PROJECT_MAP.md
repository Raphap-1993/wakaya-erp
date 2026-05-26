# PROJECT_MAP

> **Plantilla (no es el entregable).** Destino: `varios`. Consolida el entregable en la carpeta destino que indica el README de esta carpeta.

> Mapa de navegacion del repositorio. Responde "donde vive cada cosa" para que
> un agente IA no tenga que explorar a ciegas. Actualizalo cuando cambie la
> estructura de carpetas o se agregue un tipo de artefacto nuevo.

## Arbol de carpetas
| Ruta | Proposito |
|---|---|
| `docs/` | Documentacion oficial por fase 0-8 y transversal. Fuente de verdad metodologica. |
| `specs/` | Specs por feature: spec-funcional, spec-tecnica, spec-tareas, traceability, prototipo. |
| `ai/` | Capa IA: agents, commands, skills, prompts, quality-gates, references, memory. |
| `ai/memory/` | Schema SQLite + BD local reconstruible del agente. |
| `src/` | Codigo fuente del proyecto. |
| `tests/` | Pruebas automatizadas. |
| `qa/` | Casos de prueba y evidencia de QA por fase. |
| `ops/` | Operacion: infra, despliegue, runbooks, observabilidad. |
| `contracts/` | Contratos API (OpenAPI) y eventos (AsyncAPI / JSON Schema). |
| `ci/` | Scripts y baseline de integracion continua. |
| `scripts/` | Automatizacion: generador, agente interno, validadores. |
| `plantillas/` | Plantillas reutilizables por fase. |
| `ejemplos/` | Ejemplos canonicos por fase. |
| `releases/` | Notas de version. |

## Rutas canonicas por tipo de artefacto
| Necesito... | Esta en... |
|---|---|
| Vision y requerimientos | `docs/fase-0-iniciacion/`, `docs/fase-1-analisis-requerimientos/` |
| Diseno de producto / UX / SPDD | `docs/fase-2-ux-ui/`, `specs/<feature>/product-design.md`, `specs/<feature>/spdd-frontend.md` |
| Prototipo navegable | `specs/<feature>/prototype-html5/index.html`, hub en `prototype/index.html` |
| Arquitectura y decisiones | `docs/fase-3-arquitectura/`, ADRs en `docs/fase-3-arquitectura/adr/` |
| Spec funcional/tecnica/tareas | `specs/<feature>/spec-funcional.md`, `spec-tecnica.md`, `spec-tareas.md` |
| Trazabilidad de una feature | `specs/<feature>/traceability.md` |
| Trazabilidad global | `TRACEABILITY_MATRIX.md` |
| Contratos API | `contracts/api/`, `specs/<feature>/api-contract.md` |
| Casos de prueba | `qa/`, `specs/<feature>/ui-test-cases.md` |
| Quality gates | `ai/quality-gates/` |
| Comandos del agente IA | `ai/commands/` |
| Memoria consultable | `ai/memory/framework-agent.db` (via `scripts/ai-framework-agent.mjs`) |

## Punto de entrada para un agente IA
1. `AI_CONTEXT.md` — estado actual del proyecto.
2. `AGENTS.md` — contrato de trabajo.
3. Este `PROJECT_MAP.md` — donde buscar.
4. `node scripts/ai-framework-agent.mjs search --query "<tema>"` — ubicar contexto.
5. Abrir solo los Markdown relevantes que devuelve la busqueda.
