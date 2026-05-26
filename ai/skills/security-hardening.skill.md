# Skill Security Hardening

## Objetivo
Endurecer cambios o artefactos con controles minimos de seguridad antes de liberar u operar.

## Aplicala cuando
- el cambio toca autenticacion, autorizacion, secretos, datos o despliegue,
- aparece una dependencia o integracion sensible,
- se prepara una revision previa a release.

## No la apliques cuando
- la solicitud no tiene superficie de riesgo relevante,
- aun faltan decisiones basicas de producto o arquitectura.

## Entradas minimas
- cambio o artefacto a revisar,
- riesgos visibles,
- contexto de datos, IAM o infraestructura.

## Flujo recomendado
1. Identifica superficie de riesgo.
2. Revisa controles minimos aplicables.
3. Senala gaps y mitigaciones.
4. Verifica trazabilidad a arquitectura, ADR o runbook.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Eso lo vemos en pentest | El baseline debe quedar antes de liberar |
| El proveedor ya lo resuelve | Igual hay que declarar la responsabilidad local |

## Red flags
- Secretos o IAM tratados como detalle menor.
- No hay auditoria o trazabilidad de seguridad.
- Cambio sensible sin owner ni mitigacion.

## Verification evidence
- controles revisados,
- riesgos y mitigaciones visibles,
- artefactos actualizados en fase 3, QA o ops si aplica.

## Referencias
- `../references/security-and-risk.md`
- `../references/quality-release-and-operations.md`
