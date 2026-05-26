# Referencia: Documentation Orchestration

## Usala cuando
- el usuario trae una idea, intake, conversacion o requerimiento informal,
- necesitas decidir que documento, spec, ADR, C4 o evidencia crear,
- quieres evitar documentacion suelta sin fase ni ruta,
- quieres operar `/document` como puerta de entrada del framework.

## Contrato de salida
Toda salida de `/document` debe declarar:
- fase detectada,
- modo de trabajo recomendado,
- command sugerido,
- artefactos a crear o actualizar,
- preguntas necesarias,
- contenido propuesto o plan de contenido,
- gate aplicable,
- evidencia o trazabilidad esperada,
- siguiente paso.

## Mapeo rapido
| Entrada | Fase probable | Command | Artefacto |
|---|---|---|---|
| idea inicial | 0-1 | `/document` + `/plan` | vision, roadmap, requerimientos iniciales |
| requerimiento claro | 4 | `/document` + `/spec` | specs de feature |
| decision tecnica | 3 | `/document` + `/review` | decisiones tecnologia y ADR |
| flujo UX | 2 | `/document` + `/plan` | UX, journeys y pantallas |
| incidente o mejora operativa | 8 | `/document` + `/review` | operacion, metricas y backlog evolutivo |
| release | 7 | `/document` + `/ship` | runbook, rollback y checklist |

## Preguntas minimas por tipo
- Idea inicial: problema, usuarios, resultado esperado, restricciones, no alcance.
- Requerimiento claro: campos, reglas, permisos, estados, criterios de aceptacion.
- Decision tecnica: alternativas, trade-offs, restricciones, experiencia del equipo, operacion.
- UX: usuarios, tareas principales, estados, validaciones, accesibilidad.
- Operacion: impacto, evidencia, metricas, responsable, recurrencia.

## Red flags
- La salida propone contenido pero no archivo destino.
- La fase no queda declarada.
- Se salta de idea a codigo.
- Se crea ADR sin alternativas.
- Se crea spec sin criterios de aceptacion.
- Se trata el intake como documento final.

## Evidencia minima
- entrada usada,
- archivos destino,
- gate aplicado,
- preguntas abiertas,
- trazabilidad entrada -> artefacto.

## Rutas relacionadas
- `../commands/document-command.md`
- `../skills/documentation-orchestration.skill.md`
- `../quality-gates/gate-documentation-ready.md`
- `documentation-and-traceability.md`
- `requirements-and-discovery.md`
