# Skill Performance Optimization

## Objetivo
Identificar y priorizar mejoras de performance con evidencia y trade-offs claros.

## Aplicala cuando
- existe una degradacion visible o una meta de rendimiento,
- QA o operacion muestran latencia, carga o costo anomalo,
- un cambio puede impactar SLI/SLO.

## No la apliques cuando
- no existe ninguna senal o metrica base,
- la necesidad real es funcional y no de performance.

## Entradas minimas
- sintoma o objetivo de performance,
- metricas o evidencia actual,
- componente o flujo afectado.

## Flujo recomendado
1. Definir metrica objetivo.
2. Medir baseline actual.
3. Identificar cuello de botella probable.
4. Proponer mejora con trade-off explicito.
5. Verificar impacto despues del cambio.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Se siente lento | Hace falta baseline medible |
| Optimizamos todo de una vez | Se prioriza el mayor cuello de botella primero |

## Red flags
- No hay metrica base.
- Se confunde performance con percepcion sin evidencia.
- La mejora propuesta no indica costo o trade-off.

## Verification evidence
- baseline medido,
- cambio propuesto o aplicado,
- resultado comparativo,
- impacto esperado en SLI/SLO o costo.

## Referencias
- `../references/quality-release-and-operations.md`
- `../references/security-and-risk.md`
