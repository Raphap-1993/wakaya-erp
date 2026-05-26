# Runbook de deploy

[README principal](../../README.md)

## Objetivo
Liberar Wakaya ERP de forma controlada.

## Pasos
1. Verificar build backend y frontend.
2. Publicar imagen ghcr.io/raphaelparedes/wakaya-erp.
3. Aplicar configuracion de ambiente.
4. Desplegar en staging.
5. Ejecutar smoke test.
6. Aprobar salida a produccion.
7. Monitorear metricas iniciales.
