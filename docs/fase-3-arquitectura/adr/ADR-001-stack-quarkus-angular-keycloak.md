# ADR-001 - Stack Quarkus Angular y Keycloak

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)


<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-001 - Monolito modular para el MVP](ADR-001-monolito-modular-mvp.md)
- Siguiente: [ADR-002 - Gestor de configuracion y secretos](ADR-002-configuracion-y-secretos.md)
<!-- nav-guided:end -->

## Decision
Usar node-next con backend Quarkus, frontend Angular en Nx y autenticacion OIDC integrada con Keycloak u otro IdP compatible.

## Contexto
Wakaya ERP requiere una API segura, frontend modular y operacion preparada para ambientes cloud. El dominio necesita auditoria de transiciones y control de permisos por rol.

## Opciones consideradas
- Quarkus + Angular.
- Spring Boot + React.
- Next.js full-stack.
- Java monolith sin frontend dedicado.

## Consecuencias
- Se obtiene separacion clara entre API y UI.
- Se aprovecha Quarkus para servicios ligeros y cloud-native.
- Angular/Nx facilita modularidad frontend.
- El equipo debe mantener dos pipelines de build.
- La seguridad OIDC/RBAC queda como requisito base.

## Trazabilidad
- Vision: ../../fase-0-iniciacion/00.01-vision-proyecto.md
- Requerimientos: ../../fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md
- Plan despliegue: ../03.03-plan-despliegue.md
