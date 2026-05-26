# Skill QA

## Objetivo
Mantener una forma consistente de convertir specs y riesgos en casos QA, evidencias y gates de salida.

## Aplicala cuando
- una feature necesita validacion formal,
- se prepara una release,
- se quiere revisar cobertura de pruebas.

## No la apliques cuando
- aun no existen criterios de aceptacion o specs suficientes,
- el trabajo real sigue siendo construir y no validar.

## Entradas minimas
- specs,
- criterios de aceptacion,
- riesgos y defectos conocidos.

## Criterios que debe reforzar
- prioridad basada en riesgo,
- evidencia verificable,
- relacion directa con HU, RF o RNF.

## Flujo recomendado
1. Revisa specs, criterios y riesgos.
2. Define tipos de prueba y escenarios criticos.
3. Declara evidencia esperada y criterio de salida.
4. Marca defectos o bloqueantes antes del gate.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Funciona en mi entorno | Hace falta evidencia verificable |
| No hace falta tanta prueba para este cambio | El riesgo define la cobertura minima |
| QA ya vera en release | El gate no se pasa sin evidencia |

## Red flags
- No existe criterio de salida.
- Riesgos visibles sin prueba asociada.
- Defectos criticos sin decision explicita.
- No hay evidencia enlazada a la feature o release.

## Verification evidence
- pruebas ejecutadas,
- evidencias registradas,
- defectos abiertos o aceptados,
- gate QA cumplido o bloqueado con motivo.

## Salidas tipicas
- casos QA por feature,
- evidencias esperadas,
- criterios de salida.

## Referencias
- `../references/quality-release-and-operations.md`
- `../references/documentation-and-traceability.md`
