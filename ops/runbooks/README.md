# Runbooks operativos transversales

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ops](../README.md)

Directorio para runbooks ejecutables que no son especificos de una fase. Son procedimientos paso a paso que deben poder ejecutar cualquier oncall con privilegios, con comandos cross-platform (Node + git) y verificaciones automatizadas.

## Indice de runbooks

| Runbook | Trigger | Oncall responsable | Script asociado | Frecuencia / ensayo | RTO / RPO objetivo |
| --- | --- | --- | --- | --- | --- |
| [rotacion-secretos.md](rotacion-secretos.md) | Sospecha de fuga, fin de ventana de validez, cron trimestral, rotacion programada | SRE + Security | [`rotate-secrets.mjs`](rotate-secrets.mjs) y workflow [`.github/workflows/rotate-secrets.yml`](../../.github/workflows/rotate-secrets.yml) | DB user 90d / API keys segun proveedor (max 180d) / JWT signing 180d con 24h overlap / cosign keyless permanente | RTO 30 min / RPO 0 (rotacion no debe perder datos) |
| [dr-failover-region.md](dr-failover-region.md) | Region primaria caida, escenarios A-E del plan DR | SRE + IC | [`verify-dr.mjs`](verify-dr.mjs) (post-failover) | Ensayo trimestral (Tier 0/1) / semestral (Tier 2) / anual (Tier 3) | Segun tier en `template.config.json` (Tier 0: RTO 15 min / RPO 5 min; Tier 1: RTO 1h / RPO 15 min) |

## Principios
- Cada runbook debe incluir: precondiciones, pasos, verificacion, rollback, y RTO/RPO objetivo.
- Los comandos deben poder ejecutarse desde Windows PowerShell, Linux y macOS (Node.js como comun denominador).
- Evitar asumir herramientas especificas del SO (awk, sed, jq). Usar scripts `.mjs` incluidos en la plantilla.
- Todo runbook debe haberse ensayado al menos una vez en ambiente no productivo antes de considerarse valido.

## Scripts auxiliares
- [`rotate-secrets.mjs`](rotate-secrets.mjs): plantilla de rotacion con `--mode dry-run|apply|verify|retire-previous|restore`. Soporta providers `vault`, `aws`, `gcp`, espera convergencia del `Secret` cuando hay acceso a Kubernetes y genera `--audit-log` conforme a `contracts/events/audit-log.schema.json`.
- [`verify-dr.mjs`](verify-dr.mjs): verificaciones post-failover (kubectl + Prometheus). Acepta `--kubectl-context`, `--kubeconfig`, `--namespace`, `--core-selector`, `--prometheus-url`, `--prometheus-token`, `--threshold-error-rate`, `--query`, `--dry-run`, `--json` para uso parametrizado en cualquier ambiente.

## Workflows asociados
- [`.github/workflows/rotate-secrets.yml`](../../.github/workflows/rotate-secrets.yml): cron trimestral (primer lunes 03:00 UTC) en dev/staging; manual con `workflow_dispatch` en prod. OIDC hacia AWS/GCP/Vault, `verify` post-`apply`, soporte opcional de `kubectl` via `secrets.SECRETS_KUBECONFIG` y audit log archivado a bucket Object Lock.
- [`.github/workflows/template.yml`](../../.github/workflows/template.yml): valida que el codigo de los runbooks no se rompa con cambios en la plantilla (matriz Linux/macOS/Windows).

## Plantilla para nuevos runbooks
1. Crear `ops/runbooks/<nombre>.md` con secciones: Alcance, Frecuencia, Precondiciones, Pasos, Rollback, Casos especificos, Evidencia, Referencias.
2. Crear (si aplica) `ops/runbooks/<nombre>.mjs` con flags compatibles con cross-platform (sin `bash`, sin `sed`, sin `jq`).
3. Anadir fila a la tabla de arriba con trigger, oncall, script, frecuencia y RTO/RPO.
4. Enlazar desde [`docs/transversal/90.24-gestion-incidentes.md`](../../docs/transversal/90.24-gestion-incidentes.md) si el runbook resuelve un escenario de incidente concreto.
5. Ensayar en dev/staging antes de declarar valido.
