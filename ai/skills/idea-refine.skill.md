# Skill Idea Refine

## Objetivo
Transformar una idea bruta en una base documental inicial util para fases `0-3`, con supuestos, huecos y siguiente paso visibles.

## Aplicala cuando
- el proyecto nace desde una idea vaga,
- negocio todavia no tiene requerimientos formales,
- hace falta estructurar discovery sin saltar directo a codigo.

## No la apliques cuando
- ya existe analisis de requerimientos aprobado,
- el trabajo real ya es refinement de una feature puntual en SDD.

## Entradas minimas
- idea o problema base,
- sponsor o area duena,
- restricciones conocidas.

## Flujo recomendado
1. Reescribe la idea separando problema, objetivo, actores y riesgos.
2. Marca explicitamente supuestos y preguntas abiertas.
3. Propone borradores iniciales para fases `0-3`.
4. Deja claro que requiere validacion humana antes de bajar a SDD.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| La idea ya se entiende | Debe quedar separada en problema, objetivo, actores y riesgos |
| Luego validamos supuestos | Los supuestos deben quedar visibles desde el primer borrador |
| Saltemos directo a solucion | No se baja a SDD sin validar fase 0 y fase 1 |

## Red flags
- No hay sponsor o area duena.
- No hay problema formulado.
- La salida propone tecnologia como decision cerrada sin ADR.
- No quedan preguntas abiertas ni huecos de informacion.

## Verificacion minima
- Existen salidas para fase `0`, `1`, `2` y `3`.
- Los huecos de informacion quedaron visibles.
- No se presentaron decisiones tecnicas como definitivas.

## Verification evidence
- archivos o secciones generadas por fase,
- supuestos y preguntas abiertas listadas,
- siguiente paso recomendado,
- trazabilidad idea -> fase 0-3.

## Referencias
- `../references/requirements-and-discovery.md`
- `../references/documentation-and-traceability.md`
- `../prompts/transformar-idea-a-documentacion-inicial.md`
