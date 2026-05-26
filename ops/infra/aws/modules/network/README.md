# Modulo network

[README principal](../../../../../README.md) | [Indice docs](../../../../../docs/README.md) | [Volver a aws](../../README.md)

VPC con subnets publicas y privadas en `az_count` zonas, NAT gateways por AZ, Internet Gateway y tablas de ruteo.

## Inputs
- `name_prefix` (string, required): prefijo para todos los recursos.
- `cidr_block` (string, default `10.10.0.0/16`): rango de la VPC.
- `az_count` (number, default `3`): zonas de disponibilidad usadas.
- `tags` (map, default `{}`): tags adicionales.

## Outputs
- `vpc_id`, `public_subnet_ids`, `private_subnet_ids`.

## Uso
Se instancia desde `envs/<env>/main.tf`. Ver ejemplo ahi.
