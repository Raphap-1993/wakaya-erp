# Command `/ship`

## Objetivo
Liberar cambios con readiness real, gates, rollback y monitoreo.

## Fases donde aplica mejor
- `7 - Deploy`

## Required inputs
- resultados QA,
- componentes afectados,
- estrategia de despliegue,
- runbook y rollback.

## Process
1. Verificar gate de salida.
2. Confirmar que la branch o worktree de desarrollo esta cerrable.
3. Revisar pipeline, rollback y accesos.
4. Confirmar smoke checks y monitoreo.
5. Preparar PR/merge o release con resumen de cambios y riesgos.
6. Liberar con estrategia segura.
7. Registrar evidencia y seguimiento post-release.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Si falla, hacemos rollback manual luego | El rollback debe estar definido antes de liberar |
| El monitoreo ya lo vemos en produccion | No se libera sin senales objetivas preparadas |

## Red flags
- No existe rollback real.
- Falta monitoreo o smoke check.
- Hay bloqueantes QA sin resolver ni aceptar.

## Verification evidence
- gate de release cumplido,
- smoke checks pre y post deploy,
- rollback y responsables visibles,
- release trazada a artefactos oficiales.

## Artefactos relacionados
- `../prompts/preparar-release.md`
- `../skills/release-readiness.skill.md`
- `../skills/shipping-and-launch.skill.md`
- `../skills/finishing-development-branch.skill.md`
- `../quality-gates/gate-7-8.md`
