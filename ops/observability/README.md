# Observabilidad

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ops](../README.md)

Configuracion como codigo para el pipeline de observabilidad de la plantilla. Todos los stacks emiten telemetria por OTLP al OpenTelemetry Collector, y desde alli se fanouts a Tempo (traces), Prometheus (metrics) y Loki (logs).

## Contenido

```
ops/observability/
├── otel-collector-config.yaml     # Pipeline OTLP -> Tempo/Prom/Loki
├── prometheus-rules.yaml          # Reglas de grabacion + alertas SLO
├── grafana-dashboard-api.json     # Dashboard base del API
├── slos.yaml                      # SLOs como codigo en formato OpenSLO v1
├── generate-slo-rules.mjs         # Generador cross-platform OpenSLO -> Prometheus rules
└── README.md
```

## Como se instancia en el proyecto
1. Desplegar el collector como Deployment/DaemonSet usando el ConfigMap derivado de `otel-collector-config.yaml`.
2. Cargar `prometheus-rules.yaml` en el Prometheus del cluster o en Thanos Ruler.
3. Importar `grafana-dashboard-api.json` en la instancia de Grafana.
4. Cada stack debe enviar metricas a `http://otel-collector:4318/v1/metrics` y trazas a `http://otel-collector:4318/v1/traces`.

## Variables esperadas en los stacks
- `OTEL_EXPORTER_OTLP_ENDPOINT`: URL del collector.
- `OTEL_SERVICE_NAME`: nombre logico del servicio (ej. `wakaya-erp-api`).
- `OTEL_RESOURCE_ATTRIBUTES`: `env=<dev|staging|prod>,team=<duefio>,version=<gitSha>`.

## Runbooks asociados
- `ops/fase-8-operacion/runbooks/api-error-rate.md` (pendiente de crear en el proyecto real).
- `ops/fase-8-operacion/runbooks/latency-high.md` (pendiente de crear en el proyecto real).

## ADR relacionado
- [ADR-004 Observabilidad con OpenTelemetry](../../docs/fase-3-arquitectura/adr/ADR-004-observabilidad-opentelemetry.md)

## Doc funcional
- [08.01 Observabilidad](../../docs/fase-8-operacion/08.01-observabilidad.md)
- [90.20 Metricas DORA](../../docs/transversal/90.20-metricas-dora