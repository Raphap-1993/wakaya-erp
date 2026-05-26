# ADR-007 - SLOs como codigo en formato OpenSLO

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-006 - GitOps con ArgoCD](ADR-006-gitops-argocd.md)
- Siguiente: [ADR-008 - Autenticacion JWT + OIDC](ADR-008-authn-jwt-oidc.md)
<!-- nav-guided:end -->

## Decision
Adoptar **OpenSLO v1** como formato canonico para declarar SLIs, SLOs y AlertPolicies. Los SLOs viven en `ops/observability/slos.yaml` y se generan reglas Prometheus mediante `ops/observability/generate-slo-rules.mjs` (Node, cross-platform). El baseline incluye dos SLOs obligatorios para cualquier servicio sincrono: disponibilidad 99.9 por ciento (28d rolling) y latencia p95 bajo 400ms (95 por ciento de requests).

## Contexto
Los SLOs deben vivir como artefactos versionados, revisados con la misma rigurosidad que el codigo, no en wikis o dashboards mutables. Se necesitan tres propiedades: (1) formato neutral al vendor para evitar lock-in; (2) generacion automatica de reglas Prometheus con multi-window multi-burn-rate (Google SRE Workbook capitulo 5); (3) compatibilidad con tooling productivo cuando el equipo crezca.

## Opciones consideradas
- **OpenSLO v1** (esta decision): spec abierta, soportada por Pyrra, Sloth, Grafana Labs y Nobl9; recursos `Service`, `SLI`, `SLO`, `AlertPolicy` separados; alertas por `burnrate`.
- **Sloth DSL**: practico pero acoplado a Sloth; inadecuado si manana se evalua Pyrra o Nobl9.
- **Pyrra CRDs**: requiere Kubernetes desde el dia uno; barrera de entrada para servicios que aun no estan en cluster.
- **Nobl9 propietario**: SaaS de pago, lock-in alto; descartado para una plantilla.
- **Reglas Prometheus escritas a mano**: error-prone, sin abstraccion sobre `ratio` vs `threshold`, dificiles de revisar en PR.

## Consecuencias
- El generador interno (`generate-slo-rules.mjs`) cubre el caso happy path con un parser YAML minimalista limitado a la forma OpenSLO; para flujos productivos robustos se recomienda Pyrra, Sloth o el OpenSLO CLI oficial.
- Cada PR que toca `slos.yaml` debe regenerar `prometheus-rules-slo.yaml` y commitear ambos.
- Las recording rules generadas tienen prefijo `slo:sli_ratio:<ventana>:<slo>` para integrarse con dashboards Grafana y alertas.
- El equipo aprende un formato declarativo (OpenSLO) que es portable a cualquier vendor compatible.
- Los targets default (99.9 por ciento disponibilidad) suelen ser excesivos para servicios internos: se ajustan con product owner antes de produccion.

## Implementacion
- `ops/observability/slos.yaml` con 4 recursos OpenSLO: 1 Service, 2 SLI (`availability-ratio`, `latency-ratio`), 2 SLO y 2 AlertPolicy (burn-rate-fast 14.4x con ventana 1h+5m, burn-rate-slow 6x con ventana 6h+30m).
- `ops/observability/generate-slo-rules.mjs` con CLI `--in <yaml> --out <prometheus-rules>`, Node 20+ sin dependencias.
- `docs/fase-3-arquitectura/03.07-slos-como-codigo.md` describe formato, baseline, alertas, generacion, ciclo de vida y como adoptarlo.
- En el dashboard `ops/observability/grafana-dashboard-api.json`, el panel de disponibilidad 30d consume la recording rule `slo:sli_ratio:30d:availability`.

## Referencias
- [SLOs como codigo](../03.07-slos-como-codigo.md)
- [OpenSLO spec](https://github.com/OpenSLO/OpenSLO)
- [Google SRE Workbook capitulo 5](https://sre.google/workbook/alerting-on-slos/)
- [ADR-004 Observabilidad con OpenTelemetry](ADR-004-observabilidad-opentelemetry.md)
