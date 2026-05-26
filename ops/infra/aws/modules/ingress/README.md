# Modulo ingress

[README principal](../../../../../README.md) | [Indice docs](../../../../../docs/README.md) | [Volver a aws](../../README.md)

ALB publico con redirect HTTP->HTTPS, certificado ACM validado por DNS, target group apuntando al cluster y record Route53.

## Inputs principales
- `name_prefix`, `vpc_id`, `public_subnet_ids`, `domain_name`, `hosted_zone_id`.
- `target_group_port` (default `8080`), `health_check_path` (default `/api/health`).

## Outputs
- `alb_dns_name`, `target_group_arn`, `alb_security_group`.
