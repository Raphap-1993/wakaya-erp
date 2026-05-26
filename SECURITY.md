# Politica de seguridad

[README principal](README.md) | [Indice docs](docs/README.md)

## Contenido
- [Versiones soportadas](#versiones-soportadas)
- [Como reportar una vulnerabilidad](#como-reportar-una-vulnerabilidad)
- [Canales seguros](#canales-seguros)
- [Ambito](#ambito)
- [Reconocimiento](#reconocimiento)
- [Controles automaticos](#controles-automaticos)
- [Cadena de suministro](#cadena-de-suministro)
- [Verificacion de artefactos](#verificacion-de-artefactos)

## Versiones soportadas

Solo la rama `main` y la ultima release publicada reciben parches de seguridad. Versiones anteriores se consideran fuera de soporte salvo acuerdo explicito.

## Como reportar una vulnerabilidad

Si descubres una vulnerabilidad en este proyecto o en productos derivados:

- No abras un issue publico.
- Envia el detalle a `security@ejemplo.dev` (adaptar al correo real del equipo).
- Incluye: descripcion, impacto esperado, pasos de reproduccion minimos, version afectada y cualquier prueba de concepto.

Nos comprometemos a:

- Confirmar recepcion en un plazo de 48 horas habiles.
- Informar una evaluacion inicial en un plazo de 5 dias habiles.
- Coordinar la divulgacion responsable (coordinated disclosure) antes de publicar detalles.

## Canales seguros

Para material sensible se recomienda cifrar el correo con la clave PGP publicada en el sitio corporativo (adaptar al canal real).

## Ambito

Esta politica aplica al codigo fuente de este repositorio, a los artefactos generados en releases oficiales y a la documentacion asociada. Las dependencias se tratan via el canal del proveedor correspondiente.

## Reconocimiento

Agradecemos a quienes reporten en buena fe. Si te autorizan a nombrarlos, se incluiran en los CHANGELOG de la release que contiene el parche.

## Controles automaticos

Cada PR y cada push a `main` ejecuta `.github/workflows/security.yml`, que cubre:

- `gitleaks` para detectar secretos en el repositorio.
- `semgrep` (SAST) con subida de resultados SARIF al panel de GitHub Security.
- `tfsec` y `checkov` para escaneo de IaC (Terraform y manifestos Kubernetes).
- `trivy` para escaneo de imagenes Docker construidas localmente.
- `syft` (SBOM SPDX) + `grype` para vulnerabilidades sobre el SBOM.
- `dependency-review` bloquea PRs que introducen dependencias con vulnerabilidades `high` o mayores.

## Cadena de suministro

Para cada release, `.github/workflows/release.yml`:

- Construye y publica imagenes en `ghcr.io` con `docker/build-push-action` (provenance y sbom activados).
- Escanea la imagen publicada con `trivy`; el job falla si encuentra vulnerabilidades `CRITICAL` o `HIGH` con fix disponible.
- Firma la imagen con `cosign` en modo keyless (OIDC contra Sigstore/Fulcio).
- Emite atestaciones SLSA build provenance via `actions/attest-build-provenance` y las sube al registry.

## Verificacion de artefactos

Antes de desplegar, todo entorno que consume una imagen firmada debe verificarla:

```
cosign verify \
  --certificate-identity-regexp='^https://github.com/<org>/<repo>/' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com' \
  ghcr.io/<org>/<repo>/<image>@<digest>
```

y revisar su atestacion SLSA:

```
gh attestation verify oci://ghcr.io/<org>/<repo>/<image>@<digest> \
  --repo <org>/<repo>
```

Se recomienda que los pipelines de despliegue rechacen imagenes sin firma valida y sin atestacion de provenance.

Para la politica operativa detallada ver `docs/transversal/90.15-seguridad-dependencias.md`.
