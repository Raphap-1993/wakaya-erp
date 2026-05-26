# Skill DevOps

## Objetivo
Mantener una forma consistente de definir deploy, rollback, operacion y monitoreo.

## Aplicala cuando
- una feature o release va a salir,
- se necesita preparar runbook o rollback,
- se quiere convertir QA y arquitectura en operacion observable.

## No la apliques cuando
- el trabajo aun no paso por QA minimo,
- la necesidad real sigue siendo diseno de arquitectura o implementacion funcional.

## Entradas minimas
- plan de despliegue,
- resultados de QA,
- componentes afectados,
- riesgos operativos.

## Criterios que debe reforzar
- precondiciones claras,
- verificaciones antes y despues del deploy,
- metricas y responsables visibles.

## Flujo recomendado
1. Revisa precondiciones tecnicas y evidencia QA.
2. Define pipeline, runbook y rollback.
3. Asegura smoke checks y monitoreo post-deploy.
4. Deja responsables y criterios de abortar claros.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Si falla, hacemos rollback luego | El rollback debe estar definido antes |
| El monitoreo ya lo armamos despues | No se libera sin senales objetivas |
| El pipeline existe pero no esta documentado | La evidencia debe quedar visible |

## Red flags
- No hay rollback o abort condition.
- Faltan smoke checks.
- No existe monitoreo activo del cambio.
- La salida no aterriza en `ci/` u `ops/`.

## Verification evidence
- pipeline o workflow revisado,
- smoke checks definidos o ejecutados,
- rollback visible,
- responsables y riesgos operativos declarados.

## Salidas tipicas
- runbook,
- rollback,
- checks por feature,
- metricas operativas.

## Referencias
- `../references/quality-release-and-operations.md`
- `../references/security-and-risk.md`
