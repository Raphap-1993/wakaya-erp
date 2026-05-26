# Despliegue canary

[README principal](../../../README.md) | [Indice docs](../../../docs/README.md) | [Volver a k8s](../README.md)

Plantilla de [Argo Rollouts](https://argoproj.github.io/rollouts/) para desplegar el servicio `wakaya-erp-api` con canary progresivo gobernado por una `AnalysisTemplate` que mide success rate en Prometheus.

Secuencia:
- 10% -> pausa 5 minutos -> analisis de `success-rate`.
- 25% -> pausa 10 minutos.
- 50% -> pausa 10 minutos.
- 75% -> pausa 10 minutos.
- 100% stable.

Si el analisis falla 3 veces consecutivas, el rollout se aborta automaticamente y restaura la version estable.

Integracion con `docs/fase-7-deploy/07.01-estrategias-despliegue-seguro.md`.
