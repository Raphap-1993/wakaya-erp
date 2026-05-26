# ADR-004 - Observabilidad basada en OpenTelemetry

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-003 - Migraciones de base de datos](ADR-003-migraciones-base-datos.md)
- Siguiente: [ADR-005 - Infraestructura como codigo](ADR-005-infraestructura-como-codigo.md)
<!-- nav-guided:end -->

## Decision
Instrumentar todos los servicios con OpenTelemetry (OTel) usando el exporter OTLP. Logs estructurados en JSON, metricas en formato Prometheus expuestas en `/metrics` y trazas propagadas via encabezados `traceparent` (W3C Trace Context).

## Contexto
La plantilla debe producir senales comparables entre stacks y entornos. Elegir una libreria propietaria por stack fragmentaria la correlacion. OpenTelemetry cubre los tres pilares (logs, metricas, trazas) con SDKs oficiales para Node, Java y JVM, y es agnostica al backend (Jaeger, Tempo, Datadog, New Relic).

## Opciones consideradas
- OpenTelemetry con exporter OTLP (esta decision).
- Agentes propietarios (Datadog, New Relic) sin OTel.
- Mezcla: logs propia, metricas Micrometer, trazas sin propagar.
- Sin instrumentacion hasta despues del MVP.

## Consecuencias
- Hay una dependencia explicita en los SDK de OTel y en un collector desplegado.
- Las firmas de logs, metricas y trazas son uniformes entre stacks.
- Facilita la rotacion del backend de observabilidad sin reescribir aplicaciones.
- Requiere disciplina para no loguear datos sensibles.

## Trazabilidad
- Documento de observabilidad: [08.01-observabilidad.md](../../fase-8-operacion/08.01-observabilidad.md).
- Operacion continua: [08.00-operacion-continua.md](../../fase-8-operacion/08.00-operacion-continua.md).
- Definiciones operativas: [90.18-definiciones-operativas.md](../../transversal/90.18-definiciones-operativas.md).
