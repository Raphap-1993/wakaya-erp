# TRACEABILITY_MATRIX

> **Plantilla (no es el entregable).** Destino: `varios`. Consolida el entregable en la carpeta destino que indica el README de esta carpeta.

> Matriz global de trazabilidad: el rollup de todas las features del proyecto.
> Cada feature mantiene su propia `specs/<feature>/traceability.md` con el
> detalle; este archivo consolida la vista para responder rapido "que falta",
> "que esta en QA", "que requerimientos no tienen implementacion".
> `node scripts/ai-framework-agent.mjs sync-memory` parsea este archivo y las
> `traceability.md` por feature para poblar `ai_trace_links` y `ai_gate_runs`.

## Matriz global
| Feature | RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|---|
| <feature> | RF-NN | HU-NN | spdd-frontend.md | prototype-html5/index.html | METODO /ruta | tabla | ServicioOComponente | NombreTest | Estado actual | archivo de evidencia |

Reglas:
- Una fila por requerimiento (RF o RNF), agrupadas por feature.
- `Estado`: valores cortos y consistentes (`En diseno SDD`, `En desarrollo`, `Prototipo validado`, `Implementado`, `En QA`, `Cerrado`).
- Celdas sin dato: usa `-`.
- El detalle por feature vive en `specs/<feature>/traceability.md`; este archivo es el resumen.

## Estado de gates por feature
| Feature | Gate | Estado | Evidencia |
|---|---|---|---|
| <feature> | gate-prototype-ready | Pendiente | prototype-validation.md |

## Requerimientos sin implementacion
- Lista aqui los RF/RNF que aun no tienen codigo ni test, para que el agente sepa que falta.

## Decisiones transversales
- Decisiones de trazabilidad que afectan a varias features.

## Preguntas abiertas globales
- Dudas que bloquean o condicionan varias features.
