> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.

# Traceability - <Titulo de la feature>

[README principal](../../README.md) | [Specs](../README.md)

## Proposito
Matriz viva que conecta cada requerimiento con su diseno, prototipo, API, datos,
codigo, prueba, estado y evidencia. Es la fuente que `node scripts/ai-framework-agent.mjs
sync-memory` parsea para poblar `ai_trace_links`, `ai_gate_runs` y
`ai_evidence_items` en la memoria del agente IA.

## Flujo
```text
Product Design -> SPDD -> Prototipo HTML5 -> SDD -> Construccion -> QA
```

## Matriz de trazabilidad

> Regla v12.22+: usar `-` en `Codigo` y `Test` mientras el archivo/clase/test
> NO exista en el repo. Llenar el nombre real solo cuando exista; antes vive
> en `spec-tareas.md` como nombre futuro. Asi `sync-memory` lo marca
> automaticamente `planned` vs `implemented` y `check-trace-drift` no reporta
> falsos positivos.

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-NN | HU-NN | spdd-frontend.md | prototype-html5/index.html | GET /api/<entidad> | <entidad> | - | - | Spec inicial generada | spec-funcional.md |
| RNF-NN | HU-NN | spdd-frontend.md | prototype-html5/index.html | GET /api/<entidad> | - | - | - | Pendiente prototipo | prototype.md |

## Gates
| Gate | Estado | Evidencia |
|---|---|---|
| gate-prototype-ready | Pendiente | prototype-validation.md |
| gate-spdd-approved | Pendiente | spdd-frontend.md |

## Decisiones
- <Decision 1 — link a ADR si aplica>
- <Decision 2>

## Preguntas abiertas
- <Pregunta sobre regla de negocio>
- <Pregunta sobre alcance>
