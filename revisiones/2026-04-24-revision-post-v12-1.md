# Revision profunda post-v12.1 (incremental) - adaptacion a proyecto real profesional

[README principal](../README.md) | [Indice docs](../docs/README.md)

- Fecha: 2026-04-24
- Autor: revision post-modificaciones v12.1 (incremental)
- Revision previa: [2026-04-24-revision-adaptacion-proyecto-real.md](2026-04-24-revision-adaptacion-proyecto-real.md)
- Base revisada: repositorio post v12.0.0 + entregables v12.1 parciales (Day-0, CMDB, SLOs OpenSLO, rotacion secretos, DR, AuthN/AuthZ node-next) y scripts cross-platform (`.mjs` + wrappers `.sh`/`.ps1`).

## 1. Contexto y alcance
La revision anterior (post-v12.0.0) identifico 18 brechas. En respuesta se incorporaron seis lineas de trabajo de la v12.1. Esta revision evalua que tan completas quedaron, que brechas nuevas aparecieron y que queda bloqueando adopcion seria por un equipo real.

El repositorio sigue marcado como `v12.0.0` en `README.md` y `.github/.release-please-manifest.json`; aun no hay release `v12.1.0` ni `CHANGELOG` bumped.

## 2. Lo que v12.1 resolvio bien
| Brecha previa | Entregable incorporado | Estado |
| --- | --- | --- |
| Day-0 runbook humano | `docs/fase-0-iniciacion/00.09-plan-arranque-15-dias.md` encadenado en `nav-guided` | Completo |
| CMDB raiz | `catalog/` con `all.yaml`, `domains/`, `systems/`, `groups/`, `users/`, `templates/new-service.yaml` | Completo |
| SLOs como codigo | `ops/observability/slos.yaml` (OpenSLO v1) + `generate-slo-rules.mjs` + `03.07-slos-como-codigo.md` | Completo |
| Rotacion de secretos operable | `ops/runbooks/rotacion-secretos.md` + `ops/runbooks/rotate-secrets.mjs` con providers vault/aws/gcp | Completo funcional |
| Plan DR y failover | `docs/fase-8-operacion/08.02-plan-dr.md` + `ops/runbooks/dr-failover-region.md` + `ops/runbooks/verify-dr.mjs` | Completo |
| AuthN/AuthZ canonico | `docs/fase-3-arquitectura/03.08-auth-authz.md` + `stacks/node-next/template/src/lib/rbac.ts` + `src/middleware/authn.ts` | **Parcial: solo node-next** |
| Scripts cross-platform | `new-service.mjs` + wrappers `.sh`/`.ps1`, `bootstrap.{mjs,sh,ps1}`, `check-docs.mjs`, `check-template-instantiation.mjs` | Completo |

## 3. Brechas remanentes y nuevas (clasificadas)

### 3.1 ALTO - bloquean adopcion real

#### 3.1.1 AuthN/AuthZ sin instanciacion JVM
- **Problema**: el doc `03.08-auth-authz.md` y el RBAC de node-next existen, pero los tres stacks JVM (`java-monolith`, `quarkus-angular`, `spring-react`) **no tienen `SecurityConfig`, filtros JWT, ni mapa de roles**. Un equipo que elige Spring Boot no puede instanciar el contrato definido en `03.08`.
- **Impacto**: backend-lead, SRE, auditoria.
- **Adaptacion**:
  1. Crear `stacks/java-monolith/template/src/main/java/com/example/expedientes/security/SecurityConfig.java` con `SecurityFilterChain` + `JwtAuthenticationConverter` + issuer/JWKS desde config.
  2. Crear `Permission.java` + `Role.java` + `@PreAuthorize("hasPermission(...)`) o `HasPermissionEvaluator` custom con la misma matriz que `rbac.ts`.
  3. Anadir `application.yml`: `spring.security.oauth2.resourceserver.jwt.issuer-uri` y `jwk-set-uri` parametrizados con tokens `__OIDC_ISSUER__` / `__OIDC_JWKS_URL__`.
  4. Replicar en `quarkus-angular` usando `quarkus-smallrye-jwt` y en `spring-react` reusando el `SecurityConfig`.
  5. Anadir test de integracion con token firmado por JWKS mock (Wiremock o `MockOAuth2Server`).
- **Esfuerzo**: 3 d/p (1 Spring base + 1 Quarkus + 1 tests/hardening).

#### 3.1.2 Falta `docs/transversal/90.24-gestion-incidentes.md`
- **Problema**: los runbooks de DR y rotacion referencian "gestion de incidentes" pero el documento canonico no existe. El enlace en `dr-failover-region.md` quedo como texto plano. Sin este documento no hay severidades (S1-S4), tiempos de respuesta comprometidos, canal de war-room, ni plantilla de postmortem.
- **Impacto**: SRE, oncall, comunicacion corporativa.
- **Adaptacion**:
  1. Crear `90.24-gestion-incidentes.md` con: niveles S1-S4 (ejemplo: S1=caida total, MTA 15min; S4=degradacion menor, MTA 8h), roles (IC, Comms, Scribe, SME), canal `#inc-<fecha>-<slug>`, status page externo, criterios de cierre.
  2. Embeber plantilla de postmortem blameless (timeline, impact, root cause, action items con duenos y fechas).
  3. Anadir cadena `nav-guided` entre `90.23-sostenibilidad.md` y el siguiente 90.xx (o cerrar con `docs/README`).
  4. Enlazar desde `dr-failover-region.md`, `rotacion-secretos.md`, `08.02-plan-dr.md` (actualmente texto plano) y desde `90.18-definiciones-operativas.md`.
- **Esfuerzo**: 1 d/p.

#### 3.1.3 Sin workflow CI que valide instanciacion end-to-end
- **Problema**: existe `ci/scripts/check-template-instantiation.mjs` pero **ningun workflow en `.github/workflows/` lo invoca**. Eso significa que un PR podria romper el contrato de tokens (`__API_SERVICE_NAME__`, `__OIDC_ISSUER__`, etc.) y pasar a `main` sin detectarlo.
- **Impacto**: mantenedores de la plantilla, consumidores aguas abajo.
- **Adaptacion**:
  1. Ampliar `.github/workflows/docs.yml` (o crear `template.yml`) con jobs: `check-tokens` (ejecuta `check-template-instantiation.mjs --mode tokens`), `dry-run-new-service` (ejecuta `scripts/new-service.mjs --stack node-next --config template.config.example.json --dest /tmp/dry-run --no-git`), y `typecheck-generated` (corre `tsc --noEmit` dentro del proyecto generado).
  2. Matrizar por los cuatro stacks.
  3. Exigir que el job pase como required check en `main`.
- **Esfuerzo**: 1-2 d/p.

#### 3.1.4 `template.config.example.json` no incluye nuevos campos v12.1
- **Problema**: con la entrada de OIDC (authn), observability (SLOs) y DR (region secundaria), el `template.config.example.json` sigue con los campos v12.0 (project, github, support, runtime, terraform, catalog). Faltan:
  - `auth.oidcIssuer`, `auth.oidcJwksUrl`, `auth.oidcAudience`
  - `observability.prometheusUrl`, `observability.grafanaUrl`, `observability.tempoUrl`, `observability.lokiUrl`
  - `dr.secondaryRegion`, `dr.rto`, `dr.rpo`, `dr.tier`
  - `secrets.provider` (`vault`|`aws`|`gcp`), `secrets.kvPath` o equivalente.
- **Impacto**: quien ejecute `new-service.mjs` con la config de ejemplo genera proyectos con placeholders huerfanos.
- **Adaptacion**:
  1. Extender `template.config.example.json` con los campos listados.
  2. Anadir validador JSON schema en `scripts/schema/template.config.schema.json` (nuevo) referenciando `required` minimos por feature.
  3. `new-service.mjs` debe fallar rapido si la config carece de campos requeridos para el stack elegido.
  4. Documentar los campos en `docs/transversal/90.14-instanciacion-fases-proyectos-reales.md`.
- **Esfuerzo**: 1 d/p.

#### 3.1.5 Version no bumpeada y sin release notes v12.1
- **Problema**: `README.md` sigue en `v12.0.0`, no hay `releases/v12.1.0.md`, el `CHANGELOG.md` no tiene entrada v12.1, y `release-please-manifest.json` no refleja el incremento. Un consumidor no puede `git tag v12.1.0` con confianza.
- **Impacto**: release manager, consumidores que pinnean por tag.
- **Adaptacion**:
  1. Crear `releases/v12.1.0.md` con la misma estructura que `v12.0.0.md` y lista de entregables v12.1.
  2. Agregar entrada `## v12.1.0` al inicio de `CHANGELOG.md` (antes de `## v12.0.0`).
  3. Actualizar `README.md` titulo y `.github/.release-please-manifest.json`.
  4. Actualizar `releases/README.md`.
- **Esfuerzo**: 0.5 d/p.

### 3.2 MEDIO - mejora madurez

#### 3.2.1 El generador SLO tiene parser YAML casero
- **Problema**: `ops/observability/generate-slo-rules.mjs` implementa un parser YAML minimalista limitado a la forma OpenSLO. Si alguien anade un SLO con `!include`, anchors (`&`, `*`), multi-line strings o un tipo no soportado, el generador falla silenciosamente o produce reglas incorrectas.
- **Impacto**: SRE, dueno de servicio.
- **Adaptacion**:
  1. Sustituir el parser por `yaml` (npm), con `package.json` local en `ops/observability/` o dependencia dev raiz.
  2. Anadir `ops/observability/tests/generate-slo-rules.test.mjs` con fixtures validas e invalidas.
  3. Documentar en `03.07-slos-como-codigo.md` que para produccion se recomienda Pyrra/Sloth (ya mencionado, reforzar).
- **Esfuerzo**: 1 d/p.

#### 3.2.2 Catalog no tiene `Resource` ni `API` kinds
- **Problema**: `catalog/` declara `Domain`, `System`, `Component`, `Group`, `User`, pero omite:
  - `API` kind que apunte a `contracts/api/openapi.yaml` y `contracts/events/asyncapi.yaml` (perdida de trazabilidad provider/consumer en Backstage).
  - `Resource` kinds para DB (`case-management-db`), queue, cache - referenciados en `03.06-modelo-datos.md` pero invisibles en el catalogo.
- **Impacto**: plataforma, visibilidad dependencias.
- **Adaptacion**:
  1. Crear `catalog/apis/expedientes-rest.yaml` y `catalog/apis/expedientes-events.yaml`.
  2. Crear `catalog/resources/expedientes-db.yaml`, `catalog/resources/redis-cache.yaml`.
  3. Enlazarlos en `catalog/all.yaml`.
  4. Anadir `providesApis`/`consumesApis` en los `catalog-info.yaml` por stack.
- **Esfuerzo**: 1 d/p.

#### 3.2.3 `rotate-secrets.mjs` no se integra con GitHub Actions reusable
- **Problema**: el script Node funciona en local y CI ad-hoc, pero no hay `.github/workflows/rotate-secrets.yml` que lo ejecute en schedule trimestral contra el cluster real (con credenciales OIDC de GitHub hacia AWS/Vault/GCP). La "rotacion obligatoria" queda en teoria.
- **Impacto**: security, compliance.
- **Adaptacion**:
  1. Crear `.github/workflows/rotate-secrets.yml` con `workflow_dispatch` + `schedule` (cron trimestral), matriz por entorno (dev/staging/prod), gates manuales en prod, OIDC-to-provider sin secretos de larga vida.
  2. Publicar el log de auditoria (output de `rotate-secrets.mjs --audit-log`) a un bucket S3 con Object Lock.
  3. Referenciarlo en `ops/runbooks/rotacion-secretos.md`.
- **Esfuerzo**: 1-2 d/p.

#### 3.2.4 `verify-dr.mjs` depende de `kubectl` y un Prometheus concreto
- **Problema**: el verificador DR usa `kubectl get nodes` (shell out) y fetch directo al Prometheus. Sin parametrizar URL ni contexto kubectl, no se puede reusar en mas de un ambiente.
- **Impacto**: SRE operando multi-region.
- **Adaptacion**:
  1. Anadir flags `--kubeconfig`, `--prometheus-url`, `--namespace`, `--threshold-error-rate`.
  2. Separar `providers/k8s.mjs` y `providers/prometheus.mjs` para testear sin cluster real.
  3. Anadir modo `--dry-run` que solo lista chequeos sin ejecutarlos.
- **Esfuerzo**: 0.5 d/p.

#### 3.2.5 No hay ADR nuevos para decisiones v12.1
- **Problema**: decisiones relevantes como "adoptar OpenSLO como formato canonico" y "JWT RS256 + JWKS como estandar de authN" no estan en `adr/`. La proxima vez que alguien revise "por que OpenSLO y no Sloth directo" no hay registro.
- **Impacto**: arquitectura, futuro mantenedor.
- **Adaptacion**:
  1. `ADR-007-slos-opneslo.md` con contexto (OpenSLO v1, vendor-neutral), decision, alternativas (Sloth DSL, Pyrra CRDs, Nobl9 propietario) y consecuencias.
  2. `ADR-008-authn-jwt-oidc.md` con decision (RS256 + JWKS + OIDC), alternativas (session cookies, mTLS, opaque tokens), consecuencias (requiere IdP externo).
  3. `ADR-009-dr-multi-region-activo-pasivo.md` para fijar Tier 0-3.
  4. Extender cadena `nav-guided` de `adr/`.
- **Esfuerzo**: 1 d/p.

### 3.3 BAJO - pulido

#### 3.3.1 Revision previa (`2026-04-24-revision-adaptacion-proyecto-real.md`) no marca resoluciones
- **Problema**: no hay columna "estado" ni tachadura de los items ya resueltos por v12.1. Quien abre ese archivo no sabe que estan cerrados Day-0, CMDB, SLOs, rotacion y DR.
- **Adaptacion**: anadir seccion final "Estado al 2026-04-24" con tabla `item -> cerrado-en -> commit-ref`.
- **Esfuerzo**: 0.25 d/p.

#### 3.3.2 CHANGELOG sin enlaces a PRs
- **Problema**: entradas narrativas sin `#PR` o `commit-sha`. Dificulta auditoria retroactiva.
- **Adaptacion**: convencion `- feat(scope): descripcion (#123)`; lint en `release-please` ya soporta Conventional Commits.
- **Esfuerzo**: 0.25 d/p.

#### 3.3.3 `ops/runbooks/README.md` lista los runbooks como bullets sueltos
- **Problema**: falta tabla con columnas "runbook | trigger | oncall | script asociado | frecuencia". Es el directorio de entrada para SRE y se siente tipo borrador.
- **Adaptacion**: rehacer como tabla, anadir columna "ultima prueba" (para DR: fecha del ultimo GameDay).
- **Esfuerzo**: 0.25 d/p.

---

## 4. Scorecard consolidado

| Severidad | Cantidad | Esfuerzo estimado (d/p) |
| --- | --- | --- |
| ALTO | 5 | 6.5 a 8.5 |
| MEDIO | 5 | 4.5 a 6.5 |
| BAJO | 3 | 0.75 |
| **Total** | **13** | **11.75 a 15.75** |

Comparado con la revision inicial post-v12.0.0 (18 brechas, ~20 d/p): v12.1 ha reducido la deuda en aproximadamente **30 por ciento en numero** y **40 por ciento en esfuerzo**. Las brechas abiertas son mayoritariamente de "terminar de instanciar" y "cerrar el loop CI".

## 5. Top 5 fixes para desbloquear adopcion seria (orden recomendado)

1. **Bumpear version a v12.1.0** (0.5 d/p) - hace visible el incremento y permite pinnear.
2. **Crear `90.24-gestion-incidentes.md`** (1 d/p) - cierra el ultimo enlace roto y completa la ficha de gobierno operativo.
3. **Instanciar `SecurityConfig` en los tres stacks JVM** (3 d/p) - sin esto, la mitad del target del template no puede usar authN.
4. **Workflow CI `template.yml` que valide instanciacion end-to-end** (1-2 d/p) - blinda el contrato de tokens y evita regresiones silenciosas.
5. **Extender `template.config.example.json` + JSON schema** (1 d/p) - una sola config arranca el proyecto con OIDC + observability + DR ya parametrizado.

Con estos cinco puntos (~6-7 d/p) la plantilla pasa de "v12.1 partial" a "v12.1 release-ready". Todo lo demas es iteracion.

## 6. Como adaptarlo a un proyecto real (playbook actualizado)

1. `git clone` + `pnpm install -g` + `npm install --global` en host.
2. Copiar `template.config.example.json` a `config/mi-proyecto.json` y completar los nuevos campos v12.1 (`auth.*`, `observability.*`, `dr.*`, `secrets.provider`).
3. Ejecutar `node scripts/new-service.mjs --stack <elegido> --config config/mi-proyecto.json --dest ../mi-proyecto`.
4. En `../mi-proyecto`, correr:
   - `node scripts/bootstrap.mjs` (local deps + hooks).
   - `node ci/scripts/check-docs.mjs` (symmetry nav-guided).
   - `node ops/observability/generate-slo-rules.mjs --in ops/observability/slos.yaml --out ops/observability/prometheus-rules-slo.yaml`.
5. Arrancar el catalogo Backstage apuntando a `catalog/all.yaml` del repo.
6. Configurar IdP externo (Auth0/Entra/Keycloak) con los claims documentados en `03.08-auth-authz.md`.
7. Ejecutar un primer `dr-failover-region` en GameDay dentro de las 8 semanas siguientes al go-live (`08.02-plan-dr.md` seccion GameDays).
8. Revisar mensualmente el SLO burn rate en Grafana (dashboard `grafana-dashboard-api.json`).

## 7. Recomendacion final
La plantilla esta **aproximadamente al 70 por ciento** de ser "enterprise-ready como producto para un equipo real". Los 6-7 dias-persona del top-5 la mueven al 90 por ciento. El 10 por ciento final (ADR nuevos, catalog APIs, rotacion workflow CI, integracion `yaml` lib) puede quedar para v12.2 sin bloquear adopcion.

## 8. Rutas relacionadas
- [Revision anterior post-v12.0.0](2026-04-24-revision-adaptacion-proyecto-real.md)
- [Plan de arranque 15 dias](../docs/fase-0-iniciacion/00.09-plan-arranque-15-dias.md)
- [Catalog Backstage](../catalog/README.md)
- [SLOs como codigo](../docs/fase-3-arquitectura/03.07-slos-como-codigo.md)
- [Plan DR](../docs/fase-8-operacion/08.02-plan-dr.md)
- [Auth y authz](../docs/fase-3-arquitectura/03.08-auth-authz.md)
