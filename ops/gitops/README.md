# GitOps

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ops](../README.md)

Flujo GitOps con [Argo CD](https://argo-cd.readthedocs.io) sobre las overlays en `ops/k8s/overlays/`. Se implementa el patron app-of-apps:

- `argocd/root-app.yaml` declara la Application raiz que mira `argocd/apps/`.
- `argocd/apps/app-dev.yaml`, `app-staging.yaml`, `app-prod.yaml` apuntan cada una a su overlay.

Antes de aplicar GitOps en un proyecto derivado, instancia los tokens con `node scripts/init-project.mjs --config template.config.example.json`.

## Sync policy por entorno
- `dev` y `staging`: sync automatico con `prune` y `selfHeal`.
- `prod`: sync manual con aprobacion humana.

Ver [ADR-006 - GitOps con ArgoCD](../../docs/fase-3-arquitectura/adr/ADR-006-gitops-argocd.md).
