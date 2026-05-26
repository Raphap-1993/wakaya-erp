# ADR-009 - DR multi-region activo-pasivo

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-008 - Autenticacion JWT + OIDC](ADR-008-authn-jwt-oidc.md)
- Siguiente: [ADR-010 - Memoria local AI-first con SQLite, sqlite-vec y DuckDB](ADR-010-memoria-local-ai-first-sqlite-sqlite-vec-duckdb.md)
<!-- nav-guided:end -->

## Decision
Adoptar un modelo de **disaster recovery activo-pasivo multi-region** con clasificacion en cuatro tiers (Tier 0-3) y objetivos RTO/RPO declarados por servicio. La region primaria atiende todo el trafico; la secundaria mantiene replica caliente de datos (WAL shipping continuo) y se promueve via runbook automatizado en escenarios A-E definidos en `docs/fase-8-operacion/08.02-plan-dr.md`. GameDays trimestrales validan el RTO real.

## Contexto
La plantilla debe servir desde MVPs internos hasta sistemas regulados con requisitos de continuidad. Sin un modelo declarado, cada servicio reinventa su DR (o lo aplaza), y se descubre la deuda durante el primer incidente. Los reguladores (financieros, salud, sector publico) exigen un plan documentado, ensayado y con objetivos cuantificables.

## Opciones consideradas
- **Activo-pasivo multi-region** (esta decision): un solo cluster atiende; la region secundaria tiene replicas en hot standby. Failover bajo el runbook `dr-failover-region.md`. Costo moderado, complejidad operativa media.
- **Activo-activo multi-region con read-write split**: latencia mas baja en steady state pero requiere resolver conflictos de escritura, replicacion bidireccional y conflict resolution. Complejidad alta, recomendable solo cuando la latencia geografica lo justifica.
- **Backup/restore desde region remota**: RPO alto (horas), RTO de horas a un dia. Suficiente para Tier 3 pero inadecuado para Tier 0-2.
- **Replicacion sincrona cross-region**: latencia de escritura penalizada por la velocidad de la luz; descartado como default.
- **Sin DR formal, solo backups locales**: aceptable solo para entornos efimeros (preview) o servicios Tier 3.

## Consecuencias
- Cada servicio declara su tier en `template.config.json` (`dr.tier`, `dr.rto`, `dr.rpo`, `dr.primaryRegion`, `dr.secondaryRegion`). El schema valida los valores.
- Los servicios Tier 0 y Tier 1 deben ejecutar GameDay trimestral; Tier 2 semestral; Tier 3 anual.
- La region secundaria usa la misma stack de IaC con backend Terraform separado por region (`ops/infra/aws/envs/prod-dr/`).
- Los datos sensibles cumplen residencia regional declarada en `90.16-privacidad-compliance.md`; el plan DR respeta region-fencing cuando aplica.
- El runbook de failover toma 8 pasos verificables y emite eventos `dr.failover.*` al audit trail.
- El verificador `verify-dr.mjs` (Node, cross-platform) revisa nodos kubectl, pods criticos y error rate Prometheus tras el failover.
- En escenario E (caida total del proveedor), el plan se degrada a "modo lectura desde backup en otra cloud" mientras se evalua re-platforming. No se promete RTO bajo ese escenario.

## Implementacion
- `docs/fase-8-operacion/08.02-plan-dr.md` clasifica tiers, objetivos, escenarios A-E (AZ / region / corruption / ransomware / provider), arquitectura multi-region y backups (WAL shipping + Object Lock).
- `ops/runbooks/dr-failover-region.md` con los 8 pasos: verificar secundaria, detener trafico primario, promover replica, reconfigurar app, switch DNS, verificar, comunicar, estabilizar.
- `ops/runbooks/verify-dr.mjs` parametrizable por kubeconfig, namespace, prometheus URL y umbrales.
- `template.config.example.json` declara la seccion `dr.*`; el schema obliga a definir tier ∈ {tier-0..tier-3}, rto y rpo con formato duracion (`1h`, `15m`).
- ADR explicito de tier por servicio cuando el equipo decide quedarse en Tier 2 o 3 a sabiendas del riesgo.

## Referencias
- [Plan de DR](../../fase-8-operacion/08.02-plan-dr.md)
- [Runbook de failover](../../../ops/runbooks/dr-failover-region.md)
- [Gestion de incidentes](../../transversal/90.24-gestion-incidentes.md)
- [Privacidad y residencia](../../transversal/90.16-privacidad-compliance.md)
- [ADR-005 IaC con Terraform y Kubernetes](ADR-005-infraestructura-como-codigo.md)
