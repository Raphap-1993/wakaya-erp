# Skill Shipping And Launch

## Objetivo
Orquestar la salida de una release con disciplina de launch y seguimiento inmediato.

## Aplicala cuando
- una release ya tiene aprobacion tecnica y QA,
- se prepara una salida gradual o con feature flags,
- hace falta coordinar evidence, monitoreo y fallback.

## No la apliques cuando
- aun faltan pruebas o rollback,
- la solicitud sigue siendo implementacion o fix local.

## Entradas minimas
- release candidata,
- estrategia de despliegue,
- monitoreo y rollback,
- stakeholders o responsables.

## Flujo recomendado
1. Revisar readiness y gate de salida.
2. Elegir estrategia de launch.
3. Confirmar señales y abort conditions.
4. Ejecutar salida y monitoreo inicial.
5. Registrar hallazgos post-release.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Sale rapido y monitoreamos despues | Launch sin monitoreo no es aceptable |
| Si algo pasa, avisaran los usuarios | El sistema debe tener senales previas |

## Red flags
- No hay abort condition.
- No hay stakeholders o responsables claros.
- La salida no define verificacion post-release.

## Verification evidence
- estrategia de launch declarada,
- smoke checks y monitoreo listos,
- responsables visibles,
- seguimiento post-release registrado.

## Referencias
- `../references/quality-release-and-operations.md`
- `../references/security-and-risk.md`
