# PROJECT_MAP

> Mapa de navegacion del repositorio. Responde "donde vive cada cosa" para que
> un agente IA no tenga que explorar a ciegas.

## Arbol de carpetas
| Ruta | Proposito |
|---|---|
| `docs/` | Documentacion oficial por fase 0-8 y transversal. Fuente de verdad metodologica. |
| `specs/` | Specs por feature: spec-funcional, spec-tecnica, spec-tareas, traceability, api-contract. |
| `ai/` | Capa IA: agents, commands, skills, prompts, quality-gates, references, memory. |
| `ai/memory/` | Schema SQLite + BD local reconstruible del agente. |
| `backend/` | Codigo backend del proyecto (wakaya-erp-api). |
| `frontend/` | Codigo frontend del proyecto (wakaya-erp-web). |
| `qa/` | Casos de prueba y evidencia de QA por fase. |
| `ops/` | Operacion: infra, despliegue, runbooks, observabilidad. |
| `contracts/` | Contratos API (OpenAPI) y eventos. |
| `ci/` | Scripts y baseline de integracion continua. |
| `scripts/` | Automatizacion: agente interno, validadores. |

## Rutas canonicas por tipo de artefacto
| Necesito... | Esta en... |
|---|---|
| Vision y requerimientos | `docs/fase-0-iniciacion/`, `docs/fase-1-analisis-requerimientos/` |
| Diseno de producto / UX / SPDD | `docs/fase-2-ux-ui/`, `specs/001-reservations/product-design.md`, `spdd-frontend.md` |
| Prototipo navegable | `specs/001-reservations/prototype-html5/index.html` |
| Arquitectura y decisiones | `docs/fase-3-arquitectura/`, ADRs en `docs/fase-3-arquitectura/adr/` |
| Spec funcional/tecnica/tareas | `specs/001-reservations/spec-funcional.md`, `spec-tecnica.md`, `spec-tareas.md` |
| Trazabilidad de una feature | `specs/001-reservations/traceability.md` |
| Trazabilidad global | `TRACEABILITY_MATRIX.md` |
| Contratos API | `contracts/api/`, `specs/001-reservations/api-contract.md` |
| Quality gates | `ai/quality-gates/` |
| Memoria consultable | `ai/memory/framework-agent.db` (via `scripts/ai-framework-agent.mjs`) |

## Punto de entrada para un agente IA
1. `AI_CONTEXT.md` - estado actual del proyecto.
2. `AGENTS.md` - contrato de trabajo.
3. Este `PROJECT_MAP.md` - donde buscar.
4. `node scripts/ai-framework-agent.mjs search --query "<tema>"` - ubicar contexto.
5. Abrir solo los Markdown relevantes que devuelve la busqueda.
