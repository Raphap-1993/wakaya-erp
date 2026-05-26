# Kubernetes manifests

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ops](../README.md)

Manifiestos base y overlays por entorno para los stacks de la plantilla. Se gestiona con Kustomize; el despliegue a clusters se hace via GitOps (ArgoCD).

## Estructura

```
ops/k8s/
├── base/                   # Deployment, Service, HPA, PDB, NetworkPolicy + Kustomization
├── overlays/
│   ├── dev/                # 1 replica, imagen :dev
│   ├── staging/            # 2 replicas, imagen :staging
│   └── prod/               # HPA 3-20, Argo Rollouts canary
├── external-secrets/       # SecretStore + ExternalSecret (AWS Secrets Manager)
├── rollouts/               # Argo Rollouts canary + AnalysisTemplate
└── policies/               # Kyverno: firma de imagenes, non-root, resource limits
```

## Principios aplicados
- `runAsNonRoot`, `readOnlyRootFilesystem`, drop CAP_ALL, seccomp `RuntimeDefault`.
- Probes de readiness y liveness sobre `/api/health`.
- `requests` y `limits` obligatorios. HPA sobre CPU y memoria.
- `PodDisruptionBudget` garantiza al menos una replica durante drenajes.
- `NetworkPolicy` con default deny + reglas explicitas a DNS, ingreso y observabilidad.
- Secretos via External Secrets Operator, nunca en manifests commiteados.
- Policy-as-code en Kyverno (firma cosign, pod security baseline).

## Despliegue por entorno (Kustomize directo)
```
kubectl apply -k ops/k8s/overlays/dev
kubectl apply -k ops/k8s/overlays/staging
kubectl apply -k ops/k8s/overlays/prod
```

## Despliegue GitOps recomendado
```
kubectl apply -f ops/gitops/argocd/root-app.yaml
```
Ver [ops/gitops/](../gitops/README.md).

## ADR asociados
- [ADR-005 - Infraestructura como codigo](../../docs/fase-3-arquitectura/adr/ADR-005-infraestructura-como-codigo.md)
- [ADR-006 - GitOps con ArgoCD](../../docs/fase-3-arquitectura/adr/ADR-006-gitops-argocd.md)
