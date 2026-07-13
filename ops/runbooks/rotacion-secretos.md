---
kind: transversal
---

# Runbook: rotacion de secretos

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a runbooks](README.md)

## Alcance
Procedimiento de rotacion para los secretos criticos del servicio:
- Credenciales de base de datos (usuario app).
- API keys salientes (integraciones de terceros).
- JWT signing key (rotacion con ventana de overlap).
- Tokens OIDC / service accounts de CI/CD (solo si el proveedor no soporta federacion keyless).

## Frecuencia objetivo
- DB app user: cada 90 dias o ante sospecha de fuga.
- API keys externas: segun politica del proveedor, nunca mas de 180 dias.
- JWT signing key: cada 180 dias con overlap de 24h.
- Tokens de CI/CD: preferir OIDC keyless (cosign, AWS, GCP); si no, rotar cada 30 dias.

## Precondiciones
- Secret manager operativo (External Secrets Operator + Vault / AWS SM / GCP SM).
- Acceso a kubectl al cluster del ambiente objetivo.
- Node.js 20+ en la maquina del oncall.
- Backup previo del secret actual en almacen seguro (por si hay que revertir).
- Canary/blue-green capability si la rotacion requiere restart de pods.

## Pasos

### 1. Preparacion (dry-run)
```
node ops/runbooks/rotate-secrets.mjs \
    --target db-credentials \
    --env staging \
    --dry-run
```
El dry-run imprime: nombre del secret, nueva longitud, ruta del ExternalSecret que lo referencia, pods que rotarian.

### 2. Generar el nuevo secret
```
node ops/runbooks/rotate-secrets.mjs \
    --target db-credentials \
    --env staging \
    --apply
```
El script:
- Genera un secret nuevo con `crypto.randomBytes(32).toString("base64url")`.
- Lo escribe en el backend (Vault/AWS SM/GCP SM) via CLI correspondiente del proveedor.
- Marca `secondary` al secret anterior (para overlap).
- Si `kubectl` y `kubeconfig` estan disponibles, espera a que el `ExternalSecret` y el `Secret` de Kubernetes converjan al hash nuevo antes de reiniciar workloads.
- Registra un evento en el audit log (`contracts/events/audit-log.schema.json`).

### 3. Propagacion
- External Secrets Operator detecta el cambio y refresca el Kubernetes Secret en menos de `refreshInterval` (defecto 1 minuto).
- Verificar con `kubectl get externalsecret -n <ns>` que el estado es `SecretSynced`.

### 4. Reload de aplicacion
Segun el stack:
- Node Next: rolling restart del Deployment (`kubectl rollout restart deployment/<nombre>`).
- Spring/Quarkus: si usa Spring Cloud Config refresh o Quarkus config-reload, no requiere restart; en otro caso rolling.
- Base de datos: ejecutar el ALTER USER o equivalente antes del rolling para que la nueva contrasena este activa.

### 5. Verificacion
```
node ops/runbooks/rotate-secrets.mjs --target db-credentials --env staging --verify
```
Verifica:
- Pods con el hash del secret nuevo.
- Conexiones activas a DB con el nuevo usuario (via metrica `pg_stat_activity` o equivalente).
- Alertas de error rate en `ops/observability/prometheus-rules.yaml` sin incremento.

### 6. Desactivar secret anterior
Tras 24 horas de overlap sin errores:
```
node ops/runbooks/rotate-secrets.mjs --target db-credentials --env staging --retire-previous
```

## Rollback
Si hay errores entre pasos 2 y 5:
1. Restaurar el secret anterior desde el backup manual: `node ops/runbooks/rotate-secrets.mjs --target db-credentials --env staging --restore <backup-id>`.
2. Forzar refresh de External Secrets: `kubectl annotate externalsecret <nombre> force-sync=$(date +%s) --overwrite`.
3. Rolling restart.
4. Abrir postmortem con template `docs/transversal/90.24-gestion-incidentes.md#postmortem`.

## Casos especificos

### JWT signing key
La rotacion debe mantener el anterior activo durante la ventana de overlap porque tokens emitidos antes de la rotacion seguiran siendo validos. El proceso:
1. Generar nueva key y anadir al conjunto activo (`current`).
2. Publicar JWKS con ambas keys (`kid` viejo y nuevo).
3. Marcar la nueva como firmante (`active_kid`).
4. Esperar el tiempo de vida maximo de un token (ej. 24h).
5. Retirar la key vieja del JWKS.

### Cosign signing (supply chain)
Preferir OIDC keyless (`cosign sign --identity-token`) con GitHub Actions OIDC provider. En ese caso no hay secret que rotar; el token es efimero por run.

### API keys de proveedores externos
Coordinar con el proveedor:
1. Generar la nueva key en el portal del proveedor.
2. Guardar en el secret manager.
3. Actualizar el consumer con la nueva key.
4. Revocar la anterior en el portal tras confirmar uso de la nueva.

## Ejecucion programada via CI
La rotacion baseline corre via `.github/workflows/rotate-secrets.yml`:

- **Cron**: 03:00 UTC del primer lunes de cada trimestre. Solo dev y staging automaticos; prod requiere `workflow_dispatch` manual.
- **Manual**: `gh workflow run rotate-secrets.yml -f environment=prod -f target=db-credentials -f mode=apply`.
- **Autenticacion al provider**: OIDC de GitHub Actions hacia AWS / GCP / Vault, sin secretos de larga vida en el repo. Ver variables de entorno requeridas (`AWS_ROTATE_ROLE_ARN`, `GCP_WIF_PROVIDER`, `VAULT_URL`) en la documentacion del workflow.
- **Convergencia y verify**: si `secrets.SECRETS_KUBECONFIG` esta configurado, el workflow prepara `kubectl`, espera convergencia del `Secret` y ejecuta `--mode verify` despues de cada `apply`.
- **Audit log**: el `--audit-log` se sube como artefacto del run (90 dias) y, si `vars.AUDIT_BUCKET` esta configurado, se replica a S3 con Object Lock para retencion legal.
- **Concurrency**: el grupo `rotate-secrets-<env>` evita que dos runs concurrentes en el mismo entorno corrompan el estado.

## Evidencia
Cada rotacion genera:
- Evento `audit-log` con `eventType=secret.rotated`, `actor=oncall`, `resource=<secret-id>`.
- Entrada en `ops/fase-8-operacion/operacion.md` con fecha y resultado.
- Registro en ADR-002 solo si cambia el proveedor o politica.
- Artefacto `rotation-audit-<env>` en el run de GitHub Actions cuando se ejecuta via workflow.

## Referencias
- [ADR-002 Configuracion y secretos](../../docs/fase-3-arquitectura/adr/ADR-002-configuracion-y-secretos.md)
- [Privacidad y compliance](../../docs/transversal/90.16-privacidad-compliance.md)
- [Auditoria aplicativa](../../contracts/events/audit-log.schema.json)
