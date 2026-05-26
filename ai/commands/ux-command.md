# Command `/ux`

## Objetivo
Generar o actualizar Fase 2 desde RF, HU, specs o documentacion inicial, aplicando Product Design y SPDD para tener algo validable y mostrable antes de construir.

## Fases donde aplica mejor
- `2 - UX/UI`
- transversalmente cuando cambian RF/HU/specs que impactan pantallas o prototipo.

## Required inputs
- RF, HU o specs existentes,
- contexto de actores,
- criterios UX/UI,
- feature objetivo.

## Process
1. Leer requerimientos, specs y arquitectura disponible.
2. Generar o actualizar Product Design: problema, objetivo, usuarios, journey, alcance, hipotesis y metricas.
3. Proponer dos alternativas si hay ambiguedad relevante.
4. Generar SPDD: flujo UX, pantallas, estados UI, validaciones visibles, permisos y criterios UI.
5. Preparar insumos para `/prototype`: pantallas, estados, permisos, mocks y criterios.
6. Recomendar modo de prototipo: HTML5 para validacion rapida, Penpot para diseno formal.
7. Registrar validacion del prototipo cuando exista evidencia.
8. Actualizar sistema de componentes y nombres de pantalla/componentes cuando aplique.
9. Actualizar traceability por feature.
10. Validar `gate-ux-ready`, `gate-prototype-ready` y `gate-spdd-approved` cuando la feature sea visual.

## Diferencia critica con `/document`
`/ux` produce Product Design y SPDD: decide que experiencia necesita el usuario y la valida con spec inicial y prototipo. Su salida es algo validable y mostrable antes de construir front/back.

`/document` formaliza informacion existente en artefactos canonicos. No produce prototipo, no valida experiencia y no reemplaza este comando.

Para features visuales, `/ux` siempre precede a `/spec`. Sin `gate-spdd-approved`, `/spec` no puede cerrar SDD ni iniciar construccion frontend.

Cuando se necesita algo navegable, `/ux` debe derivar a `/prototype --mode html5` para velocidad o `/prototype --mode penpot` para formalizacion visual.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El prototipo puede ser pantallas sueltas | Debe cubrir flujo, estados, roles, validaciones, navegacion y feedback |
| Angular luego se alinea | La consistencia se valida desde Fase 2 con HTML5/Penpot |
| Penpot es solo visual | Debe dejar trazabilidad con RF/HU/spec |
| El prototipo HTML5 ya es construccion | HTML5 valida flujo; Angular implementa producto real |
| Un prompt Penpot aprueba SPDD | El prompt no aprueba; se requiere prototipo y validacion |

## Red flags
- Pantallas sin actor u objetivo.
- Componentes o pantallas sin nombres consistentes para el frontend posterior.
- Estados loading, empty, error o unauthorized ausentes.
- Cambios UX sin actualizar specs o preguntas abiertas.

## Verification evidence
- flujos actualizados,
- prototipo HTML5 o Penpot preparado por `/prototype`,
- sistema de componentes o criterios de componentes,
- prototipo HTML5 o Penpot,
- gate UX Ready aplicado,
- gate Prototype Ready aplicado cuando existe prototipo,
- gate SPDD Approved aplicado cuando corresponde.

## Artefactos relacionados
- `../skills/ux-flow-to-mock.skill.md`
- `../skills/spec-driven-product-design.skill.md`
- `../skills/design-system-mapping.skill.md`
- `../quality-gates/gate-ux-ready.md`
- `../quality-gates/gate-prototype-ready.md`
- `../quality-gates/gate-spdd-approved.md`
