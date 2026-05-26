# Plantillas

[README principal](../README.md) | [Indice docs](../docs/README.md)

Plantillas reutilizables organizadas por fase para facilitar su uso dentro del flujo del proyecto.

## Fases
- [Fase 0 - Iniciacion](fase-0-iniciacion/README.md)
- [Fase 1 - Analisis y requerimientos](fase-1-analisis-requerimientos/README.md)
- [Fase 3 - Arquitectura](fase-3-arquitectura/README.md)
- [Fase 4 - SDD](fase-4-sdd/README.md)
- [Fase 6 - QA](fase-6-qa/README.md)
- [Fase 7 - Deploy](fase-7-deploy/README.md)
- [Fase 8 - Operacion](fase-8-operacion/README.md)
- [Transversal](transversal/README.md)

## Nota de inclusion
Las fases 2 y 5 no tienen carpeta propia en `plantillas/` por diseno.
- Fase 2 (UX/UI) se apoya en los documentos de `docs/fase-2-ux-ui/` y en artefactos visuales o prototipos del proyecto.
- Fase 5 (Construccion) se materializa principalmente en codigo, pruebas y estructura viva de `src/`, `tests/`, `qa/` y `ops/`.
- Esta carpeta solo agrupa artefactos reutilizables por fase cuando tiene sentido mantener una base comun.

## Nota de consistencia
- Cuando un concepto sea obligatorio en la documentacion canonica, intenta que tambien tenga visibilidad equivalente en `plantillas/` y `ejemplos/`.
- En fase 1, `RF`, `RNF` y riesgos no deben quedar implicitos solo por contexto; deben poder localizarse facilmente.
