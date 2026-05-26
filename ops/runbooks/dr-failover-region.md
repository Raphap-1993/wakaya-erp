# Runbook: failover regional (DR)

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a runbooks](README.md)

## Alcance
Conmutar trafico productivo de la region primaria a la secundaria ante caida mayor sostenida (mas de 15 minutos) o indisponibilidad confirmada del proveedor cloud en la region primaria.

## RTO/RPO objetivo
- RTO: 2 horas desde la declaracion del incidente (Tier 1).
- RPO: 15 minutos (replicacion async cross-region).

## Precondiciones
- Cluster Kubernetes secundario provisionado y sincronizado via Argo CD.
- Replica Postgres cross-region en estado `streaming` con lag menor a 60 segundos.
- Secret manager con replicas cross-region habilitadas.
- DNS con health checks configurados sobre el endpoint primario.
- Oncall con acceso a cuenta cloud, kubectl de ambas regiones y privilegios para modificar DNS.
- Node.js 20+ instalado.

## Declaracion del incidente
1. Abrir canal dedicado `#incident-<ts>-dr-failover`.
2. Designar roles segun `docs/transversal/90.24-gestion-incidentes.md`: Incident Commander, Communications Lead, Technical Lead.
3. Registrar en el war-room decision de failover con hora UTC y responsable.
4. Emitir audit event `eventType=dr.failover.declared`.

## Pasos

### Paso 1. Verificar salud de region secundaria
```
node ops/runbooks/verify-dr.mjs --region secondary --env prod
```
El script comprueba:
- Nodes ready en cluster secundario.
- Pods core (API, base de datos replica) en estado Ready.
- Lag de replicacion Postgres menor a 60s.
- Cola Kafka consumida en mirror sin rezago.

Si algun check falla, detener el failover y pasar a Escenario C o D segun corresponda.

### Paso 2. Detener trafico entrante en primaria
Opciones:
- Maintenance mode via feature flag global (`system.maintenance.enabled=true`) si la region primaria aun acepta escrituras.
- Si la region esta caida, saltar este paso.

### Paso 3. Promover replica a primary
Postgres:
```
psql -h <secondary-db-host> -U <admin> -c "SELECT pg_promote();"
```
Aurora Global Database:
```
aws rds failover-global-cluster --global-cluster-identifier <name> --target-db-cluster-identifier <secondary-arn>
```
Cloud SQL:
```
gcloud sql instances promote-replica <replica-name>
```

### Paso 4. Reconfigurar aplicacion para escribir en la nueva primaria
- Actualizar el ExternalSecret que provee `DATABASE_URL` para apuntar al host secundario promovido.
- Argo CD sincronizara automaticamente si la referencia es un Helm value; si no, aplicar manualmente.
- Verificar con `kubectl logs` que los pods conectan al nuevo endpoint sin errores.

### Paso 5. Conmutar DNS
- Actualizar el registro `api.<dominio>` del balanceador primario al secundario (o bajar health del primario para que el registro secundario tome el trafico).
- TTL esperado: 60 segundos en el baseline. Esperar propagacion.

### Paso 6. Verificar trafico productivo
```
node ops/runbooks/verify-dr.mjs --region secondary --env prod --post-failover
```
Incluye:
- Error rate menor al 0.5 por ciento en ventana de 5 minutos.
- Latencia p95 dentro de SLO.
- Health checks de todos los endpoints publicos al 200.
- Backup cross-region activo desde la nueva primaria.

### Paso 7. Comunicacion
- Anuncio en canal oficial de status (statuspage.io, etc.).
- Notificar a stakeholders con el template de `docs/transversal/90.24-gestion-incidentes.md#comunicacion`.
- Actualizar ticket principal del incidente.

### Paso 8. Estabilizacion
- Dejar la region secundaria como primaria durante al menos 48 horas.
- Resincronizar la region original cuando este disponible y convertirla en replica.
- Planificar failback en ventana de mantenimiento programada, no bajo presion.

## Rollback
Si la region secundaria presenta problemas en los primeros 30 minutos:
1. Volver a apuntar DNS al endpoint primario (si sigue disponible).
2. Revocar la promocion de la replica si es posible (depende del proveedor; Postgres pg_promote es irreversible y requiere basebackup).
3. Si no hay forma de volver, continuar en la secundaria y levantar incidente de severidad maxima.

## Post-failover
- Postmortem dentro de 72 horas (template en `docs/transversal/90.24-gestion-incidentes.md#postmortem`).
- Revisar metricas reales de RTO/RPO y contrastar con objetivo.
- Abrir tickets de mejora con prioridad asignada.
- Programar el siguiente GameDay en 90 dias maximo.

## Evidencia
- Audit events `dr.failover.*` con actor, timestamp, paso ejecutado.
- Captura del dashboard Grafana al momento del failover.
- Log del script `verify-dr.mjs` con todos los checks.
- Timeline final del incidente.

## Referencias
- [Plan de DR](../../docs/fase-8-operacion/08.02-plan-dr.md)
- [Gestion de incidentes](../../docs/transversal/90.24-gestion-incidentes.md)
- [ADR-006 GitOps](../../docs/fase-3-arquitectura/adr/ADR-006-gitops-argocd.md)
