# Infraestructura como codigo - AWS

[README principal](../../../README.md) | [Indice docs](../../../docs/README.md) | [Volver a ops](../../README.md)

Terraform multi-entorno para los stacks de la plantilla. Estructura:

```
aws/
  bootstrap/      # Bucket de state y tabla de lock. Se corre una sola vez.
  modules/
    network/      # VPC, subnets, NAT, IGW.
    compute/      # EKS + node group.
    database/     # RDS Postgres.
    ingress/      # ALB + ACM + Route53.
  envs/
    dev/          # Entorno de desarrollo.
    staging/      # Entorno de staging.
    prod/         # Entorno productivo (multi-AZ, HA).
```

## Orden de despliegue

```bash
# 1. Bootstrap una sola vez por cuenta AWS
cd ops/infra/aws/bootstrap
terraform init
terraform apply -var="state_bucket_name=mi-org-tf-state"

# 2. Instanciar el template con template.config.example.json
#    node scripts/init-project.mjs --config template.config.example.json
# 3. Desplegar por entorno (dev -> staging -> prod)
cd ops/infra/aws/envs/dev
terraform init
terraform plan
terraform apply
```

## Convenciones

- Todos los recursos propagan `default_tags` con `Project`, `Environment`, `Owner`, `CostCenter`, `ManagedBy`.
- Cambios destructivos requieren plan aprobado en PR y etiqueta `infra-change`.
- Los outputs sensibles (como passwords) solo se usan como input a External Secrets / AWS Secrets Manager.
- Cada entorno tiene su propio state en un prefijo independiente del bucket: `wakaya-erp/<env>/terraform.tfstate`.

## Integracion con CI

- `security.yml` corre `tfsec` y `checkov` sobre esta carpeta para detectar misconfiguraciones de IaC.
- Workflow recomendado: `terraform plan` en PR, `terraform apply` en merge a `main` con aprobacion manual para `prod`.

## ADR asociado
- [ADR-005 - Infraestructura como codigo](../../../docs/fase-3-arquitectura/adr/ADR-005-infraestructura-como-codigo.md)
- [ADR-006 - GitOps con ArgoCD](../../../docs/fase-3-arquitectura/adr/ADR-006-gitops-argocd.md)
