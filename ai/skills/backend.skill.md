# Skill Backend

## Objetivo
Mantener una forma consistente de implementar backend a partir de una `spec tecnica`.

## Aplicala cuando
- una feature ya tiene contratos y reglas claras,
- hay que aterrizar dominio, aplicacion o infraestructura,
- se quiere revisar consistencia tecnica antes de codificar.

## No la apliques cuando
- aun no existe `spec funcional` o reglas claras,
- el cambio es principalmente de UX o discovery y no de backend.

## Entradas minimas
- `spec tecnica`,
- arquitectura aplicable,
- estrategia de pruebas.

## Criterios que debe reforzar
- respeto por contratos y errores,
- reglas de negocio explicitadas,
- SOLID aplicado sin sobrearquitectura,
- pruebas tecnicas alineadas al riesgo.

## Flujo recomendado
1. Lee la `spec funcional` y la `spec tecnica`.
2. Deriva contratos, datos, errores y seguridad.
3. Define componentes backend y pruebas relevantes.
4. Verifica impacto en integraciones, observabilidad y auditoria.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Agrego tests despues | No se acepta sin prueba minima |
| El contrato se entiende | Debe estar explicito en specs o contracts |
| El cambio es interno, no impacta afuera | Igual debe revisarse trazabilidad y riesgo |

## Red flags
- No hay `spec tecnica`.
- No hay criterio de aceptacion o prueba asociada.
- Se cambia contrato o error handling sin actualizar trazabilidad.
- Controladores, casos de uso, dominio e infraestructura quedan mezclados sin boundary claro.
- El cambio toca seguridad o auditoria y no se refleja en fase 3, QA u ops.

## Verification evidence
- comando de build o test ejecutado,
- resultado de build o test,
- archivos modificados,
- evidencia de responsabilidades y dependencias revisadas contra SOLID,
- trazabilidad feature -> codigo -> test.

## Salidas tipicas
- componentes backend,
- pruebas unitarias e integracion,
- actualizaciones menores en specs si cambia el detalle tecnico.

## Referencias
- `../references/documentation-and-traceability.md`
- `../references/security-and-risk.md`
- `../references/quality-release-and-operations.md`
- `../../docs/transversal/90.30-principios-solid-diseno-modular.md`
