# ADR-006 - GitOps con ArgoCD

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-005 - Infraestructura como codigo](ADR-005-infraestructura-como-codigo.md)
- Siguiente: [ADR-007 - SLOs como codigo en formato OpenSLO](ADR-007-slos-openslo.md)
<!-- nav-guided:end -->

## Decision
Adoptar ArgoCD como motor GitOps para desplegar las overlays de `ops/k8s/overlays/<env>/` en los clusters objetivo. El repositorio es la unica fuente de verdad del estado deseado. Los jobs de CI publican imagenes firmadas; ArgoCD reconcilia el estado del cluster a lo declarado en la rama `main`.

## Contexto
La plantilla necesita un mecanismo repetible para llevar cambios de IaC y manifests al cluster sin depender de accesos `kubectl` manuales. El patron GitOps (pull-based desde un agente en el cluster) se alinea con los principios de supply chain ya adoptados (firma + atestacion) y facilita auditoria.

## Opciones consideradas
- ArgoCD (esta decision).
- Flux CD.
- Jobs de CI que corren `kubectl apply` (push-based).
- Scripts imperativos gestionados por operadores.

## Consecuencias
- El flujo estandar de despliegue es: commit -> CI build + firma -> merge a `main` -> ArgoCD sync.
- `dev` y `staging` tienen sync automatico con `selfHeal`. `prod` requiere aprobacion manual.
- Los secretos no viven en los manifests: se materializan via External Secrets Operator desde un gestor externo (AWS Secrets Manager, Vault, SOPS).
- Se necesita operar ArgoCD: upgrades, RBAC, configuracion de repos, notificaciones.

## Implementacion
- `ops/gitops/argocd/root-app.yaml` declara la Application raiz (app-of-apps).
- `ops/gitops/argocd/apps/app-<env>.yaml` declaran una Application por entorno.
- Los admission controllers (Kyverno) en cada cluster bloquean cargas no firmadas.
- `ADR-005` cubre la base IaC; este ADR solo cubre como se aplica el estado sobre los clusters.

## Referencias
- [ops/gitops/README.md](../../../ops/gitops/README.md)
- [ops/k8s/overlays/](../../../ops/k8s/overlays/)
- [docs/transversal/90.15-seguridad-dependencias.md](../../transversal/90.15-seguridad-dependencias.md)
