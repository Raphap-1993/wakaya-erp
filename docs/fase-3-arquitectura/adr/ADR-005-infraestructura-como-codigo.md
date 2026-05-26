# ADR-005 - Infraestructura como codigo con Terraform y Kubernetes

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-004 - Observabilidad con OpenTelemetry](ADR-004-observabilidad-opentelemetry.md)
- Siguiente: [ADR-006 - GitOps con ArgoCD](ADR-006-gitops-argocd.md)
<!-- nav-guided:end -->

## Decision
Gestionar la infraestructura base con Terraform (providers cloud) y la orquestacion de aplicaciones con Kubernetes manifests (Kustomize o Helm). Todo artefacto de infraestructura vive en `ops/infra/` y `ops/k8s/` y se despliega via pipelines desde ramas protegidas.

## Contexto
Los proyectos derivados necesitan repetibilidad, control de cambios y auditoria sobre la infraestructura. Terraform ofrece un lenguaje declarativo maduro, con providers para AWS, GCP, Azure y on-prem. Kubernetes da portabilidad entre entornos manteniendo politicas homogeneas de seguridad.

## Opciones consideradas
- Terraform + Kubernetes manifests (esta decision).
- CloudFormation o Pulumi exclusivamente.
- Scripts ad-hoc ejecutados por operadores.
- Servicios PaaS propietarios sin IaC (Heroku, Elastic Beanstalk).

## Consecuencias
- Se exige que todo cambio de infraestructura pase por PR con plan aprobado.
- El equipo necesita mantener skills en Terraform y Kubernetes.
- La plantilla queda portable entre nubes, con costo de configuracion inicial.
- Los despliegues son reproducibles y auditables.

## Trazabilidad
- Infra AWS: [ops/infra/aws/README.md](../../../ops/infra/aws/README.md).
- Manifests K8s: [ops/k8s/README.md](../../../ops/k8s/README.md).
- Plan de despliegue: [03.03-plan-despliegue.md](../03.03-plan-despliegue.md).
