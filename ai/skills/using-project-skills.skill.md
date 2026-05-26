# Skill Using Project Skills

## Objetivo
Elegir la combinacion minima de `agent`, `prompt`, `skill` y referencias segun la intencion real del trabajo, no solo segun el rol.

## Aplicala cuando
- no esta claro por donde empezar,
- la solicitud mezcla discovery, documentacion y ejecucion,
- hace falta decidir que artefactos de IA cargar antes de producir una salida.

## No la apliques cuando
- ya existe una skill especifica evidente y el trabajo esta bien acotado,
- solo necesitas actualizar un archivo puntual sin cambiar el flujo.

## Flujo recomendado
1. Identifica la intencion principal: idea, requerimientos, UX, arquitectura, SDD, construccion, QA, release u operacion.
2. Declara la ruta oficial de salida antes de producir contenido.
3. Carga un `agent` o `prompt` base y solo las referencias minimas necesarias.
4. Ejecuta la salida y verifica trazabilidad, supuestos y evidencia.

## Router rapido por intencion
- Idea o discovery inicial: `idea-refine.skill.md` + `transformar-idea-a-documentacion-inicial.md`
- Requerimientos: `requirements-quality.skill.md` + `refinar-requerimientos.md`
- UX a prototipo: `/ux` + `spec-driven-product-design.skill.md` + `ux-flow-to-mock.skill.md` + `product-design-workflow.md`
- Arquitectura o ADR: `architecture.skill.md`, `c4.skill.md`, `documentar-adr.md`
- Specs: `spec-writer.skill.md`, `generar-spec-funcional.md`, `generar-spec-tecnica.md`
- Plan ejecutable de feature: `writing-plans.skill.md` + `feature-delivery-workflow.md`
- Construccion por proveedor IA: `using-git-worktrees.skill.md`, `executing-plans.skill.md`, `test-driven-development.skill.md`
- Frontend desde spec + prototipo: `spec-prototype-driven-frontend.skill.md` + `frontend-spdd-workflow.md`
- Revision de codigo: `requesting-code-review.skill.md`
- Release: `release-readiness.skill.md` + `preparar-release.md`
- Operacion: `operations-review.skill.md` + `revisar-operacion.md`

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Cargo todo para no fallar | Solo se cargan artefactos minimos para la intencion |
| Da igual el orden | El command y gate correctos reducen drift entre fases |
| Lo dejo como respuesta suelta | La salida debe terminar en ruta canonica o evidencia |

## Red flags
- La intencion mezcla varias fases sin priorizar.
- Se usan ejemplos como entregables reales.
- No hay ruta destino.
- Se cargan referencias no relacionadas con el trabajo.

## Verificacion minima
- La salida termino en una ruta oficial.
- La intencion original quedo resuelta con el artefacto correcto.
- No se cargaron mas referencias o artefactos de IA de los necesarios.

## Verification evidence
- command o skill elegida,
- artefactos cargados,
- ruta destino declarada,
- razon breve de descarte de artefactos no usados.

## Referencias
- `README.md`
- `../references/documentation-and-traceability.md`
- `../references/product-design-workflow.md`
- `../references/frontend-spdd-workflow.md`
- `../references/quality-release-and-operations.md`
