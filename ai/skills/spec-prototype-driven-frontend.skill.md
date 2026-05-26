# Skill: Spec + Prototype Driven Frontend

## Objetivo
Guiar SPDD antes de SDD final: convertir Product Design y spec funcional inicial en prototipo validado, criterios UI y entradas claras para specs front/back.

## Aplicala cuando
- la feature tiene experiencia visual,
- existe Product Design o RF/HU suficientes,
- hay prototipo validado o evidencia SPDD revisable,
- se necesita tener algo mostrable antes de construir.
- se debe decidir entre HTML5 rapido, Penpot formal o ambos.

## No la apliques cuando
- no existe UX validado o pregunta abierta critica,
- el prototipo contradice la spec,
- el cambio no toca interfaz ni experiencia.

## Entradas minimas
- `product-design.md`,
- spec funcional inicial,
- prototipo validado o excepcion documentada,
- ruta/link del prototipo HTML5 o Penpot cuando exista,
- sistema de componentes UX o criterios UI,
- criterios UI y observaciones de validacion.

## Flujo recomendado
1. Verifica consistencia entre Product Design y spec funcional inicial.
2. Define pantallas, estados, componentes, validaciones y restricciones por rol/perfil. En el prototipo visible se expresan como comportamiento de producto, no como permisos tecnicos.
3. Prepara prototipo validable o excepcion documentada.
4. Si se requiere velocidad, deriva a `html5-prototyping.skill.md`.
5. Si se requiere formalizacion visual, deriva a `penpot-ai-prototyping.skill.md`.
6. Aplica `gate-prototype-ready`.
7. Registra validacion del prototipo.
8. Actualiza criterios UI, sistema de componentes o nombres de componentes cuando aplique.
9. Deriva impactos para frontend y backend.
10. Produce entradas para SDD: api-contract, criterios UI, ui-test-cases y traceability.
11. Aplica `gate-spdd-approved`.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El prototipo ya muestra todo | Debe quedar validado y trazado antes de SDD |
| Es solo pantalla | Cada pantalla expresa reglas, permisos o datos |
| Lo ajusto despues en CSS | Consistencia y accesibilidad se definen antes de construir |
| No hace falta validar prototipo | Sin aprobacion no pasa a SDD final |
| HTML5 ya es suficiente para construir | HTML5 puede validar SPDD, pero no reemplaza Angular productivo |
| Prompt Penpot equivale a prototipo | El prompt es insumo, no evidencia aprobada |

## Red flags
- componente nuevo sin origen en prototipo, spec o sistema de componentes,
- estado del prototipo ausente en codigo,
- prototipo no validado,
- `gate-prototype-ready` ausente,
- restricciones por rol/perfil no definidas,
- estilos divergentes del sistema de componentes,
- divergencia entre spec y prototipo.

## Verification evidence
- prototipo validado,
- ruta/link/export del prototipo,
- validacion del prototipo,
- criterios UI o sistema de componentes actualizados,
- desviaciones del prototipo registradas,
- criterios UI,
- impactos front/back para SDD.

## Referencias
- `../references/frontend-spdd-workflow.md`
- `../references/feature-delivery-workflow.md`
- `../references/ux-accessibility-and-mocks.md`
- `../quality-gates/gate-spdd-approved.md`
- `../quality-gates/gate-prototype-ready.md`
- `html5-prototyping.skill.md`
- `penpot-ai-prototyping.skill.md`
