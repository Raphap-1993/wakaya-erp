# Skill Arquitectura

## Objetivo
Mantener una forma consistente de disenar arquitectura, justificar decisiones y reflejarlas en C4 y ADR.

## Aplicala cuando
- el proyecto entra en fase 3,
- cambia la estructura del sistema,
- aparecen integraciones o restricciones nuevas.

## No la apliques cuando
- solo falta documentar una tecnologia ya decidida sin trade-off real,
- el trabajo sigue siendo puramente funcional y aun no tiene impacto estructural.

## Entradas minimas
- vision y requerimientos,
- RNF e integraciones,
- escenario y stack objetivo.

## Criterios que debe reforzar
- alineacion con RNF,
- decisiones justificadas,
- trazabilidad hacia despliegue y operacion.

## Flujo recomendado
1. Identifica drivers de arquitectura, RNF y restricciones.
2. Compara opciones y trade-offs relevantes.
3. Actualiza arquitectura, decisiones y ADR cuando aplique.
4. Verifica impacto en despliegue, seguridad y operacion.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Esa tecnologia es estandar y no hace falta justificarla | Si impacta estructura o operacion, se justifica |
| Lo dejamos en un comentario y luego sale ADR | La decision estructural debe dejar rastro formal |

## Red flags
- No hay RNF ni restriccion que motive la decision.
- Faltan alternativas o trade-offs.
- Cambia arquitectura y no se refleja en ADR o despliegue.

## Verification evidence
- documento de arquitectura actualizado,
- ADR creada o descartada con motivo,
- trade-offs visibles,
- impacto en despliegue u operacion declarado.

## Salidas tipicas
- arquitectura base,
- ADR iniciales o actualizados,
- vistas C4 consistentes.

## Referencias
- `../references/documentation-and-traceability.md`
- `../references/security-and-risk.md`
