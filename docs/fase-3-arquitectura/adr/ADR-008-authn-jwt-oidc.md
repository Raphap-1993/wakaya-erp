# ADR-008 - Autenticacion JWT + OIDC y autorizacion RBAC

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-007 - SLOs como codigo en formato OpenSLO](ADR-007-slos-openslo.md)
- Siguiente: [ADR-009 - DR multi-region activo-pasivo](ADR-009-dr-multi-region-activo-pasivo.md)
<!-- nav-guided:end -->

## Decision
Adoptar **OAuth 2.1 + OpenID Connect** con JWT firmado RS256 o ES256 como mecanismo de autenticacion, y **RBAC** (con permisos como acciones sobre recursos) como modelo de autorizacion canonica. La validacion del JWT se hace contra el JWKS del IdP via `/.well-known/openid-configuration`. Los servicios resuelven permisos localmente desde una tabla de roles versionada en codigo, sin consultar al IdP en cada request.

## Contexto
La plantilla debe servir a equipos en cuatro stacks (node-next, java-monolith, quarkus-angular, spring-react) y a varios IdPs (Auth0, Microsoft Entra, Keycloak self-hosted). Un esquema propietario del IdP introduce lock-in; uno session-based no escala a APIs sin estado ni a service-to-service. El JWT firmado con OIDC es el menor comun multiplo del ecosistema y permite cachear el JWKS en el servicio.
Para fines de ejemplo y adopcion guiada, el repositorio toma `Keycloak` como referencia canonica de IAM cuando necesita valores concretos.

## Opciones consideradas
- **JWT RS256 + OIDC** (esta decision): estandar del ecosistema, soporte nativo en Spring Security, Quarkus SmallRye JWT y `jose` (Node); permite rotacion de claves sin invalidar sesiones existentes.
- **Cookies de sesion + servidor central**: viable para frontends pero anade dependencia para APIs; complica logout distribuido y autenticacion service-to-service.
- **mTLS**: excelente para malla de servicios internos pero costoso de operar a nivel de cliente final; descartado como baseline (puede convivir).
- **Tokens opacos + introspeccion**: anade hop al IdP por request; tradeoff de latencia y disponibilidad innecesario para la mayoria de servicios.
- **HS256 con secreto compartido**: rechazado en produccion por superficie de ataque ampliada al compartir secreto entre servicios.

## Consecuencias
- Cada servicio cachea el JWKS y revalida cuando rota la clave (rotacion mensual operada por `ops/runbooks/rotacion-secretos.md` para la JWT signing key).
- Los access tokens viven 10-15 minutos; refresh tokens rotan en cada uso.
- PKCE es obligatorio en flujos interactivos (web/mobile).
- La matriz de roles `viewer`/`editor`/`approver`/`admin` y la lista de permisos `reservation:*` + `admin:users` viven en codigo y se replican entre stacks. Cualquier cambio en la matriz implica PR coordinado en los 4 stacks (riesgo de drift) — el CI valida igualdad estructural via `ci/scripts/check-rbac-consistency.mjs` y tests unitarios de RBAC. Tras `new-service.mjs` el placeholder se sustituye por el recurso real (ej. `case:read`, `customer:read`).
- El frontend Angular en Nx y React usan flujo PKCE via `angular-auth-oidc-client`, `react-oidc-context` o equivalente.
- Logout global requiere endpoint dedicado y emite evento `auth.session.revoked` al audit trail.
- Los ABAC (atributos: region, tenant, ownership) se evaluan solo cuando RBAC no basta y se aislan en capa explicita.

## Implementacion
- `docs/fase-3-arquitectura/03.08-auth-authz.md` documenta baseline, claims, IdP recomendados, anti-patrones e instanciacion por stack.
- `stacks/node-next/template/src/middleware/authn.ts` valida JWT con `jose` y `createRemoteJWKSet`; `stacks/node-next/template/src/lib/rbac.ts` implementa la tabla canonica.
- `stacks/java-monolith` y `stacks/spring-react` exponen `SecurityConfig` con `oauth2ResourceServer().jwt()`, `JwtAuthenticationConverter` que extrae el claim `roles` y `RbacEvaluator` accesible desde `@PreAuthorize("@rbacEvaluator.can(authentication, 'reservation:approve')")`.
- `stacks/quarkus-angular` usa `quarkus-smallrye-jwt` + `quarkus-security`; los recursos REST usan `@RolesAllowed` y la logica ad-hoc inyecta `RbacEvaluator`.
- Audit trail emite `auth.denied`, `auth.privileged` y `auth.session.revoked` segun `contracts/events/audit-log.schema.json`.
- Variables de entorno canonicas: `OIDC_ISSUER`, `OIDC_JWKS_URL`, `OIDC_AUDIENCE`, `OIDC_ROLES_CLAIM` (default `roles`).

## Referencias
- [Auth y autorizacion (03.08)](../03.08-auth-authz.md)
- [OWASP ASVS v4](https://owasp.org/www-project-application-security-verification-standard/)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [ADR-002 Configuracion y secretos](ADR-002-configuracion-y-secretos.md)
