# Bootstrap de Terraform

[README principal](../../../../README.md) | [Indice docs](../../../../docs/README.md) | [Volver a aws](../README.md)

Crea el bucket S3 (versionado, cifrado, sin acceso publico) y la tabla DynamoDB usados por el resto de entornos para almacenar state y lock.

## Uso (una vez por cuenta)

```
cd ops/infra/aws/bootstrap
terraform init
terraform apply \
  -var="state_bucket_name=mi-org-tf-state" \
  -var="lock_table_name=mi-org-tf-lock"
```

El bucket y la tabla resultantes se referencian en `envs/<env>/backend.tf`.
