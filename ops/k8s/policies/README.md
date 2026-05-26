# Policy as code

[README principal](../../../README.md) | [Indice docs](../../../docs/README.md) | [Volver a k8s](../README.md)

Politicas declarativas aplicadas por [Kyverno](https://kyverno.io) en el cluster. Alternativa equivalente: Open Policy Agent Gatekeeper.

## Politicas incluidas
- `require-signed-images`: rechaza imagenes que no tienen firma `cosign` keyless desde un workflow de GitHub Actions valido.
- `disallow-privileged`: bloquea pods privilegiados.
- `require-non-root`: exige `runAsNonRoot: true` en todos los pods.
- `require-resource-limits`: exige `requests` y `limits` de CPU y memoria en cada contenedor.

## Instalacion
```
kubectl apply -f https://github.com/kyverno/kyverno/releases/download/v1.11.4/install.yaml
kubectl apply -f ops/k8s/policies/kyverno-baseline.yaml
```

Se recomienda dejar `validationFailureAction: Audit` en `dev` y `Enforce` solo en `staging` y `prod`.

## Relacion con otras capas
- `SECURITY.md` y `docs/transversal/90.15-seguridad-dependencias.md` describen el resto de controles de supply chain.
- `ADR-005` y `ADR-006` documentan el modelo IaC y GitOps donde estas politicas viven.
