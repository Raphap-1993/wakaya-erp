# Runbook de backup y restore

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ops/data](README.md)

Procedimiento operativo probado para respaldar y restaurar la base de datos primaria de la plantilla. Aplica a Postgres gestionado via RDS; adapta cuando el proyecto use otro motor.

## Principios
- Objetivo de punto de recuperacion (RPO): <= 15 minutos.
- Objetivo de tiempo de recuperacion (RTO): <= 60 minutos para ambiente critico.
- Los backups se cifran en reposo con la misma KMS key que la BD.
- El restore se ejecuta completo, al menos, una vez por trimestre en staging (drill).

## Backup continuo (automatico)
- RDS ejecuta snapshot automatico diario y mantiene PITR para la ventana configurada.
- Se agrega snapshot manual nominal antes de cada release con tag `pre-release-<version>`.
- La configuracion se gestiona en `ops/infra/aws/modules/database/main.tf` (`backup_retention_period`, `deletion_protection`).

## Backup logico (pg_dump)
- Ejecutado por CronJob Kubernetes a una ventana off-peak.
- Destino: bucket S3 con versioning y Object Lock (governance mode, 35 dias minimo).
- Formato: `pg_dump -Fc` (custom) para permitir restore parcial.

## Restore planificado (drill trimestral)
1. Crear instancia efimera en staging a partir del ultimo snapshot automatico.
2. Apuntar la aplicacion de staging a la instancia efimera via feature flag de config.
3. Ejecutar `make smoke-test-db` que valida:
   - Endpoint de salud 200.
   - Conteo de filas en tablas criticas (dentro de +/-5% del valor esperado).
   - Migraciones aplicadas (`SELECT version FROM schema_migrations`).
4. Documentar RTO y RPO reales en `ops/fase-8-operacion/drills/<YYYY-MM-DD>.md`.
5. Eliminar instancia efimera y registrar costo en `ops/data/costos.md` si aplica.

## Restore de emergencia en produccion
1. Declarar incidente (severidad segun `ops/fase-8-operacion/postmortems/`).
2. Cortar trafico: escalar deployment a 0 o poner el `Ingress` en mantenimiento.
3. Detener workers que puedan seguir aplicando escrituras (colas).
4. Identificar punto de recuperacion:
   - PITR: elegir timestamp previo al evento.
   - Snapshot manual: elegir el mas reciente previo al evento.
5. Restaurar en una instancia nueva con nombre `wakaya-erp-prod-restore-<timestamp>`.
6. Validar datos criticos antes de promover.
7. Repuntar DNS / connection string a la instancia restaurada.
8. Rehabilitar trafico gradualmente (10% - 50% - 100%) vigilando SLO.
9. Dejar la instancia original en cold hold durante 72 horas para analisis forense.
10. Registrar postmortem en `ops/fase-8-operacion/postmortems/YYYY-MM-DD-<nombre>.md`.

## Verificacion mensual (check automatizado)
- Pipeline `data-backup-audit` cada mes:
  - Lista snapshots de los ultimos 30 dias.
  - Verifica retencion.
  - Compara con politica declarada.
  - Falla y notifica al on-call si hay desviaciones.

## Matriz de responsables
| Actividad | Responsable | Backup |
|-----------|-------------|--------|
| Backups automaticos | Plataforma | Oncall BBDD |
| Drill trimestral | Oncall BBDD | Jefe de SRE |
| Restore emergencia | Oncall de incidente | Jefe de SRE |
| Revisar politica | DPO + SRE | Arquitectura |
