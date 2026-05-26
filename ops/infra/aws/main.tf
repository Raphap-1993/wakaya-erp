# Este archivo es intencionalmente minimo. Con la estructura multi-entorno
# introducida en v12.0, la raiz de `ops/infra/aws/` no contiene recursos.
# Cada entorno declara su backend y modulos en `envs/<dev|staging|prod>/`.
#
# Ver README.md en este directorio para el orden de despliegue.

terraform {
  required_version = ">= 1.7.0"
}
