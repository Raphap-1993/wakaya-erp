# Skill Operations Review

## Objetivo
Revisar si la operacion posterior al release esta siendo observable, medible y accionable.

## Aplicala cuando
- se quiere evaluar salud post-release,
- hace falta revisar metricas, alertas o backlog evolutivo,
- se prepara una revision operativa periodica.

## No la apliques cuando
- el cambio aun no fue desplegado,
- la necesidad real sigue siendo QA o release, no operacion.

## Entradas minimas
- metricas disponibles,
- alertas o dashboards,
- historial reciente de incidentes o cambios,
- backlog de mejoras.

## Flujo recomendado
1. Revisa objetivos operativos y metricas activas.
2. Contrasta alertas, dashboards y sintomas recientes.
3. Resume riesgos, deuda operativa y hallazgos.
4. Propone backlog evolutivo y siguiente revision.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| No hubo incidentes, entonces esta bien | La salud operativa se demuestra con metricas y alertas |
| El dashboard lo ve plataforma | El servicio debe declarar que senales usa y quien responde |
| La deuda operativa se revisa despues | Debe entrar al backlog evolutivo con dueno |

## Red flags
- No hay SLI o metricas visibles.
- No hay dueno de alertas.
- Incidentes recientes no tienen action items.
- El backlog evolutivo no refleja hallazgos operativos.

## Verificacion minima
- Hay metricas o SLI visibles.
- Los hallazgos terminan en backlog o action items.
- La salida apunta a `ops/` y no queda solo en resumen narrativo.

## Verification evidence
- dashboards o consultas revisadas,
- incidentes o cambios analizados,
- action items con dueno,
- backlog evolutivo actualizado.

## Referencias
- `../references/quality-release-and-operations.md`
- `../references/security-and-risk.md`
- `../prompts/revisar-operacion.md`
