# Command `/review`

## Objetivo
Revisar consistencia, riesgo, calidad o salud de un artefacto, cambio o fase.

## Fases donde aplica mejor
- `1 - Analisis`
- `2 - UX/UI`
- `3 - Arquitectura`
- `5 - Construccion`
- `6 - QA`
- `8 - Operacion`

## Required inputs
- artefacto o cambio a revisar,
- contexto minimo del dominio,
- criterio de revision esperado.

## Process
1. Identificar la pregunta de revision.
2. Cargar referencias minimas necesarias.
3. Buscar inconsistencias, riesgos y huecos.
4. Si revisas Fase 2 o frontend, comparar RF/HU/spec -> UX -> prototipo -> codigo.
5. Emitir hallazgos y evidencia.
6. Proponer siguiente paso.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Se entiende por contexto | Si no queda visible, es un hueco real |
| No hace falta revisar porque nadie toco mucho | Poco cambio tambien puede romper contratos o gates |

## Red flags
- No hay criterio explicito de revision.
- Se opina sin evidencia.
- La revision mezcla hallazgos con cambios no pedidos.

## Verification evidence
- hallazgos priorizados,
- referencias o rutas concretas,
- riesgos residuales o supuestos.

## Artefactos relacionados
- `../skills/requirements-quality.skill.md`
- `../skills/requesting-code-review.skill.md`
- `../skills/spec-driven-product-design.skill.md`
- `../skills/spec-prototype-driven-frontend.skill.md`
- `../skills/operations-review.skill.md`
- `../skills/security-hardening.skill.md`
- `../skills/performance-optimization.skill.md`
