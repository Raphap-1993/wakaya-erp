# Skill Framework Governance

## Objetivo
Aplicar gobernanza al framework enterprise AI-first para que cada solicitud use la combinacion correcta de metodologia, commands, agents, prompts, skills, references, quality gates, memoria local, trazabilidad y evidencia.

## Aplicala cuando
- una solicitud cruza varias fases o dominios,
- necesitas decidir si corresponde `/plan`, `/spec`, `/build`, `/test`, `/review` o `/ship`,
- quieres validar que una salida respeta rutas canonicas,
- necesitas detectar red flags antes de aprobar un gate,
- quieres auditar trazabilidad entre fuente, entregable, spec, prueba, ADR, QA u operacion.
- necesitas crear un proyecto real en otra ruta sin saltarte config, stack, gates ni validaciones.

## No la apliques cuando
- la tarea es un cambio local muy acotado sin impacto de fase,
- ya existe una skill especifica suficiente y no hay riesgo de drift,
- el usuario pide solo una explicacion conceptual sin producir ni validar artefactos.

## Entradas minimas
- intencion del trabajo,
- rutas fuente o artefactos a revisar,
- fase o command esperado si se conoce,
- criterio de salida esperado,
- gate objetivo si se esta buscando aprobacion.

## Flujo recomendado
1. Clasifica la intencion: discovery, requerimientos, UX, arquitectura, SDD, construccion, QA, release u operacion.
2. Selecciona el command lifecycle.
3. Selecciona el agente, prompt y skill minimo.
4. Declara rutas fuente y rutas destino.
5. Verifica trazabilidad y separa hechos, supuestos y decisiones.
6. Revisa red flags.
7. Evalua el quality gate aplicable.
8. Cierra con evidencia, bloqueantes y siguiente paso.

## Flujo de creacion de proyecto real
1. Validar que la ruta destino es externa al template.
2. Verificar que el destino no existe o que hay confirmacion explicita.
3. Revisar `ai/runbooks/crear-proyecto-real-con-agente.md`.
4. Validar config con `scripts/validate-template-config.mjs`.
5. Crear el proyecto con `scripts/new-service.mjs`.
6. Ejecutar validaciones sobre la ruta destino.
7. Completar o revisar fase 0-3 en el proyecto generado.
8. Registrar gates, evidencia y red flags.

## Relacion con `/document`
Usa `documentation-orchestration.skill.md` cuando la prioridad sea formalizar informacion en artefactos canonicos. Usa esta skill cuando ademas debas coordinar proyecto real, memoria local, gates, commands y validaciones de framework.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El agente entiende todo el repo automaticamente | Debe declararse el contexto minimo usado |
| La documentacion se arregla luego | La salida debe terminar en ruta canonica o evidencia |
| El gate pasa porque el texto se ve completo | El gate exige evidencia, no sensacion de completitud |
| La memoria local encontro algo, entonces es verdad | La memoria es indice; la fuente oficial son los archivos del repo |
| Esta decision tecnica es obvia | Si cambia arquitectura, datos, seguridad o operacion, requiere ADR o justificacion |
| Crear el repo es solo copiar archivos | Un proyecto real requiere config, stack, validacion, fases iniciales y gates |

## Red flags
- No se declara command ni fase.
- No hay ruta destino.
- Hay RF, RNF, HU, spec, prueba o ADR sin relacion trazable.
- Se aprueba un gate sin evidencia minima.
- Se mezclan propuestas con decisiones aprobadas.
- Se usan ejemplos canonicos como artefactos reales.
- La memoria local contradice el archivo oficial.
- sqlite-vec se usa como dependencia critica sin reconocer que puede evolucionar por ser pre-v1.
- DuckDB aparece como obligatorio cuando solo se necesita memoria operacional simple.
- La ruta destino ya existe y no hay confirmacion de sobrescritura.
- Se ejecuta `new-service.mjs` sin validar config.
- El proyecto generado conserva valores de ejemplo.

## Verification evidence
- command elegido y razon,
- gate aplicado o descartado con razon,
- artefactos fuente leidos,
- rutas destino creadas o actualizadas,
- prompts, skills y references usados,
- trazabilidad resultante,
- red flags revisadas,
- bloqueantes o preguntas abiertas.
- comandos ejecutados sobre la ruta destino cuando aplica.

## Referencias
- `../agents/enterprise-ai-framework-agent.md`
- `documentation-orchestration.skill.md`
- `../commands/document-command.md`
- `../quality-gates/gate-documentation-ready.md`
- `../references/documentation-orchestration.md`
- `../references/framework-enterprise-ai-first.md`
- `../references/local-ai-memory.md`
- `../references/documentation-and-traceability.md`
- `../references/quality-release-and-operations.md`
- `../../docs/transversal/90.32-agente-interno-framework-ai-first.md`
- `../runbooks/crear-proyecto-real-con-agente.md`
- `../prompts/crear-proyecto-real-desde-template.md`
