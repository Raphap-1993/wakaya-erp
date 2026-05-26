# Skill Spec Writer

## Objetivo
Mantener una forma consistente de convertir requerimientos en `spec funcional`, `spec tecnica` y tareas.

## Aplicala cuando
- una HU o slice ya esta priorizado,
- hace falta bajar backlog a una feature construible,
- se quiere revisar completitud antes de desarrollo.

## No la apliques cuando
- el trabajo aun esta en discovery de alto nivel,
- la arquitectura base todavia no alcanza para decisiones tecnicas de la feature.

## Entradas minimas
- HU o requerimiento,
- reglas de negocio,
- arquitectura y restricciones relevantes.

## Criterios que debe reforzar
- separacion clara entre funcional y tecnico,
- trazabilidad con HU, RF, RNF y ADR,
- cierre de riesgos, dependencias y pruebas.

## Flujo recomendado
1. Revisa requerimiento, reglas y restricciones.
2. Escribe `spec funcional` enfocada en comportamiento.
3. Deriva `spec tecnica` con contratos, datos, errores y pruebas.
4. Convierte eso en tareas ejecutables y verificables.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| La tecnica la resolvemos al codificar | No se construye sin `spec tecnica` minima |
| Las tareas salen solas | Deben quedar trazables y revisables |
| El requerimiento ya dice todo | Requerimiento y spec responden preguntas distintas |

## Red flags
- No hay RF, HU o backlog item origen.
- `spec funcional` y `spec tecnica` se pisan entre si.
- Faltan riesgos, errores o pruebas.
- La feature cambia arquitectura y no dispara ADR.

## Verification evidence
- `spec funcional` creada o actualizada,
- `spec tecnica` creada o actualizada,
- `spec de tareas` creada o actualizada,
- trazabilidad origen -> specs -> tareas.

## Salidas tipicas
- `spec funcional`,
- `spec tecnica`,
- `spec de tareas`.

## Referencias
- `../references/documentation-and-traceability.md`
- `../references/security-and-risk.md`
