# External Secrets

[README principal](../../../README.md) | [Indice docs](../../../docs/README.md) | [Volver a k8s](../README.md)

Integracion con AWS Secrets Manager usando [External Secrets Operator](https://external-secrets.io).

## Flujo
1. El operador se instala via Helm en el cluster.
2. El secreto real vive en AWS Secrets Manager bajo claves como `wakaya-erp/prod/database`.
3. `ExternalSecret` materializa un `Secret` nativo en Kubernetes que luego se monta via `envFrom: secretRef` en el Deployment.
4. `refreshInterval: 1h` sincroniza los cambios sin reinicio del pod.

## IAM
El `ServiceAccount` `wakaya-erp-api` debe tener una role anotada (IRSA en EKS) con permiso `secretsmanager:GetSecretValue` solo para las claves que necesita.

## Alternativas
- [SOPS](https://github.com/getsops/sops) si se prefiere commitear secretos cifrados en el repo.
- [Sealed Secrets](https://sealed-secrets.netlify.app/).
- HashiCorp Vault con `vault-k8s` injector.

La decision se documenta en `docs/fase-3-arquitectura/03.05-configuracion-secretos.md`.
