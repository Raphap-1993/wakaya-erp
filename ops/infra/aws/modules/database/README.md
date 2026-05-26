# Modulo database

[README principal](../../../../../README.md) | [Indice docs](../../../../../docs/README.md) | [Volver a aws](../../README.md)

RDS PostgreSQL en subnets privadas con security group, encryption, backup y performance insights.

## Inputs principales
- `name_prefix`, `vpc_id`, `private_subnet_ids`, `allowed_security_group_ids`.
- `instance_class`, `allocated_storage`, `engine_version`.
- `backup_retention_days`, `multi_az`.

## Outputs
- `db_endpoint`, `db_security_group`, `db_master_password` (sensitive).

## Notas
La contrasena maestra se entrega como output sensitive y debe inyectarse a External Secrets Operator o AWS Secrets Manager. Nunca commitear la salida plana.
