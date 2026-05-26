# Modulo compute

[README principal](../../../../../README.md) | [Indice docs](../../../../../docs/README.md) | [Volver a aws](../../README.md)

Cluster EKS minimo con node group gestionado y roles IAM estandar.

## Inputs principales
- `name_prefix`, `vpc_id`, `private_subnet_ids`.
- `cluster_version` (default `1.30`), `node_instance_type` (default `t3.medium`).
- `node_min_size`, `node_desired_size`, `node_max_size`.

## Outputs
- `cluster_name`, `cluster_endpoint`, `cluster_ca`.

## Notas
Agregar addons como EBS CSI, CoreDNS, VPC CNI y autoscaler fuera de este modulo segun el perfil del entorno.
