# Revision profunda post-v12.2 - hallazgos, regresiones y plan v12.3

[README principal](../README.md) | [Indice docs](../docs/README.md)

- Fecha: 2026-04-25
- Autor: revision incremental tras edicion humana entre v12.2.0 y v12.3 en progreso.
- Base revisada: 341 archivos markdown, 4 stacks ejecutables, 9 ADRs, 25 transversales, catalogo Backstage con APIs y Resources, 2 runbooks operables con scripts cross-platform y workflow scheduled de rotacion.

## 1. Por que esta revision
La revision anterior (`2026-04-24-revision-post-v12-1.md`) cerro con 13 brechas remanentes. Despues de v12.2.0 los items ALTO quedaron resueltos. Entre la salida de v12.2.0 y este informe el repositorio recibio dos clases de cambios:

1. **Mejoras humanas no triviales** ya commiteadas en `HEAD` (commit `5f3805b`): `Permission.java` se generaliza a "dominio de referencia"; `template.config.example.json` y su schema agregan `databaseName` + `featureFlagPrefix`; `new-service.mjs` incorpora `runGeneratedValidations()` que ejecuta `check-docs.mjs` y `check-template-instantiation.mjs` automaticamente sobre el repo generado; `rotate-secrets.yml` anade preparacion de `kubectl`/`kubeconfig` y un step `verify` post-`apply`; el runbook documenta convergencia con External Secrets Operator.
2. **Regresion accidental** en working tree (33 archivos modificados, **938 lineas borradas vs 20 anadidas**). Los validadores fallaban: `ci/scripts/check-template-instantiation.mjs` truncado en linea 184, `template.config.schema.json` con string sin cerrar, `rotate-secrets.mjs` reducido casi a vacio, `new-service.mjs` cortado a la mitad. Restaurado desde `HEAD` archivo por archivo via `git show HEAD:<path> > <path>` porque el git index estaba bloqueado y `git checkout` no respondia.

Tras la restauracion los tres validadores pasan limpios:

- `node ci/scripts/check-docs.mjs` -> 341 archivos sin hallazgos.
- `node ci/scripts/check-template-instantiation.mjs --mode template --root .` -> sin hallazgos.
- `node scripts/validate-template-config.mjs --config template.config.example.json` -> OK.

## 2. Como usar este informe
Cada item documenta:
- **Problema** o mejora detectada en el estado actual post-restauracion.
- **Impacto** sobre adopcion real (rol afectado).
- **Adaptacion** concreta para v12.3 (pasos accionables).
- **Esfuerzo** dimensionado en dias-persona (d/p) aproximados.

Severidad: **ALTO** bloquea adopcion seria; **MEDIO** mejora madurez; **BAJO** pulido.

---

## 3. Brechas ALTO

### 3.1 Workflow scheduled rotate-secrets sin invocar verify-dr.mjs en GameDays
- **Problema**: `rotate-secrets.yml` ahora incluye `--mode verify` post-`apply`, pero no existe un workflow analogo `gameday-dr.yml` que ejecute `verify-dr.mjs` programado contra la region secundaria. Sin schedule el RTO/RPO declarado en `dr.tier` queda como teoria.
- **Impacto**: SRE, compliance regulada (BCRA, FFIEC, EBA piden ensayo periodico).
- **Adaptacion**:
  1. Crear `.github/workflows/gameday-dr.yml` con `workflow_dispatch` + `schedule` por tier (mensual Tier 0/1, trimestral Tier 2, anual Tier 3).
  2. Job que ejecuta `node ops/runbooks/verify-dr.mjs --region secondary --env <env> --json --post-failover` y publica el JSON resultante como artefacto + comentario en el issue de tracking.
  3. Etiqueta los issues con `gameday-dr` y exige cierre en menos de 5 dias habiles.
  4. Incluir en el playbook de `90.24-gestion-incidentes.md`.
- **Esfuerzo**: 1 d/p.

### 3.2 PII redactor existe pero no esta integrado al pipeline de logs por defecto
- **Problema**: `pii-redact.ts` y `PiiRedactor.java` (los 3 stacks JVM) ya existen tras v12.3 partial, pero ningun handler default los invoca. Un `console.error(payload)` o `log.error("payload={}", body)` sigue emitiendo PII en bruto.
- **Impacto**: privacy, DPO, compliance.
- **Adaptacion**:
  1. Node-next: anadir wrapper `src/lib/logger.ts` que envuelva `pino` o `console`, aplique `redact()` a `info`/`warn`/`error` y exporte como singleton.
  2. Spring/Quarkus: anadir `LogbackConfig` con `Conversion rule` o `MaskingPatternLayout` que invoque `PiiRedactor.apply()` sobre cada mensaje antes de escribirlo. Ejemplo: anotar campos sensibles con `Marker` y filtrar.
  3. `route.ts` y handlers de excepciones default usan el logger seguro.
  4. Documentar en `90.16-privacidad-compliance.md` la garantia de redaccion default y los casos donde el dev tiene que opt-out explicito.
- **Esfuerzo**: 2 d/p.

### 3.3 Contract governance no existe como documento ni como check
- **Problema**: la plantilla declara OpenAPI 3.1 + AsyncAPI 3.0 + Pact, pero no hay reglas escritas sobre breaking changes, deprecation policy ni un script que diffee `contracts/api/openapi.yaml` contra la version base de la rama. Un PR puede introducir un cambio incompatible sin que CI lo note.
- **Impacto**: backend lead, integradores externos.
- **Adaptacion**:
  1. Crear `docs/transversal/90.26-contract-governance.md` con reglas (semver del contrato, deprecation 90 dias, listas de cambios breaking/non-breaking, expand-contract, casos de excepcion).
  2. Crear `ci/scripts/check-openapi-diff.mjs` que parsea YAML del HEAD vs PR y reporta breakings (campos eliminados, tipos cambiados, required nuevo, codes 4xx/5xx removidos). Sin libs externas, parser pragmatico de OpenAPI.
  3. Anadir job `contract-governance` al workflow `template.yml` que falla si hay breakings sin label `contract-breaking-approved`.
  4. Encadenar en nav-guided.
- **Esfuerzo**: 2-3 d/p.

### 3.4 Chaos engineering ausente
- **Problema**: el plan DR formaliza GameDays pero no hay catalogo de experimentos chaos (network latency, pod kill, region drain) ni scripts. La organizacion ensaya unicamente el escenario de failover regional.
- **Impacto**: SRE.
- **Adaptacion**:
  1. Crear `docs/transversal/90.27-chaos-engineering.md` con principios (hipotesis, blast radius, abort condition, observabilidad), catalogo de 8-10 experimentos baseline, plantilla de GameDay y reglas de gating (no chaos en prod sin aprobacion DPO + SRE lead).
  2. Crear `ops/runbooks/chaos/` con scripts `pod-kill.mjs`, `network-latency.mjs` (cross-platform, kubectl + tc/Chaos Mesh).
  3. Encadenar nav-guided.
- **Esfuerzo**: 2 d/p.

### 3.5 RBAC no tiene check cross-stack que asegure paridad de matriz
- **Problema**: hay 4 implementaciones del mapa rol -> permisos (node-next `rbac.ts`, java-monolith `Role.java`, spring-react `Role.java`, quarkus `Role.java`). Cualquier PR que cambie uno sin propagar a los otros causa drift silencioso.
- **Impacto**: backend leads, security.
- **Adaptacion**:
  1. Crear `ci/scripts/check-rbac-consistency.mjs` que parsea cada archivo (regex tolerante), construye el mapa por stack y exige igualdad estructural; falla con diff explicito.
  2. Anadir job `rbac-consistency` al workflow `template.yml`.
  3. Documentar el contrato en `03.08-auth-authz.md` (seccion "Consistencia entre stacks").
- **Esfuerzo**: 1 d/p.

## 4. Brechas MEDIO

### 4.1 Generador SLO sigue con parser YAML casero
- **Problema**: `ops/observability/generate-slo-rules.mjs` parsea YAML sin libreria. Cualquier feature YAML no soportada falla silenciosa.
- **Adaptacion**: reemplazar por lib `yaml` (npm) en un `package.json` local de `ops/observability/`. Anadir tests con fixtures invalidas.
- **Esfuerzo**: 1 d/p.

### 4.2 verify-dr.mjs no expone metricas a Prometheus
- **Problema**: el script imprime resultados pero no emite serie temporal `dr_verify_passed{env,region}=0|1`. SRE no puede graficar tendencia.
- **Adaptacion**: opcion `--push-gateway <url>` que empuja metricas al Pushgateway de Prometheus tras cada ejecucion.
- **Esfuerzo**: 0.5 d/p.

### 4.3 Catalog Backstage sin owner para APIs y Resources del nivel raiz
- **Problema**: `catalog/apis/*.yaml` y `catalog/resources/*.yaml` apuntan al group `team-expedientes`, pero la plantilla puede usarse fuera del caso "expedientes". Hay que documentar como rebrandear el catalogo via tokens.
- **Adaptacion**: introducir tokens `__BACKSTAGE_OWNER__` / `__BACKSTAGE_SYSTEM__` en `catalog/apis/` y `catalog/resources/`; el `init-project.mjs` ya los reemplaza globalmente.
- **Esfuerzo**: 0.5 d/p.

### 4.4 Sin script de diff de schema BD entre migraciones
- **Problema**: las migraciones Flyway viven en `db/migration/V*.sql` pero no hay validacion de que respeten la convencion `expand-contract` documentada en `90.24` y `08.02`.
- **Adaptacion**: `ci/scripts/check-migrations-shape.mjs` que verifica nomenclatura `V<timestamp>__<descripcion>.sql`, no usa `DROP COLUMN` sin marker comentado, y exige rollback companion.
- **Esfuerzo**: 1 d/p.

### 4.5 Sin smoke test post-deploy automatizado
- **Problema**: tras un `argocd sync` no hay step que ejecute un smoke test (HTTP 200 a 3 endpoints criticos + verify-dr --dry-run). Si el deploy mete bug, se detecta solo cuando burn rate dispara la alerta.
- **Adaptacion**: anadir `ops/runbooks/smoke-test.mjs` parametrizable (`--targets <urls>` + `--auth-token`) y wirear en el workflow `release.yml` post-deploy.
- **Esfuerzo**: 1 d/p.

## 5. Brechas BAJO

### 5.1 Documentos largos sin TOC en revisions/
- Las revisiones acumulan info y son largas; anadir TOC al inicio de cada `revisiones/*.md`.
- Esfuerzo: 0.25 d/p.

### 5.2 README raiz no menciona `revisiones/` ni `catalog/apis|resources`
- Anadir en la seccion "Estructura principal".
- Esfuerzo: 0.25 d/p.

### 5.3 CHANGELOG sin enlaces a PRs ni commits
- Convertir cada bullet a `feat|fix(scope): mensaje (#PR)`. release-please ya lo soporta; falta cumplirlo en las entradas escritas a mano.
- Esfuerzo: 0.5 d/p (siguiente release).

---

## 6. Scorecard consolidado

| Severidad | Cantidad | Esfuerzo (d/p) |
| --- | --- | --- |
| ALTO | 5 | 8-9 |
| MEDIO | 5 | 4 |
| BAJO | 3 | 1 |
| **Total** | **13** | **13-14** |

Comparado con la revision post-v12.1 (13 brechas, ~12-16 d/p): el numero queda igual pero el contenido se desplaza desde "completar entregables" hacia "wirear todo lo entregado al pipeline". Esto es esperado: v12.1 trajo artefactos, v12.2 los enlazo al CI y v12.3 los hace operables por defecto.

## 7. Top 5 fixes para "v12.3 release-ready"

1. **PII redactor wirado al logger por defecto** (2 d/p) - hace que la redaccion no dependa de la disciplina del dev.
2. **Contract governance 90.26 + check-openapi-diff** (2-3 d/p) - bloquea breakings silenciosos de contratos publicos.
3. **Chaos engineering 90.27 + catalogo de experimentos** (2 d/p) - convierte GameDay en habito sistemico.
4. **check-rbac-consistency.mjs en CI** (1 d/p) - elimina drift entre los 4 stacks.
5. **gameday-dr.yml workflow** (1 d/p) - hace ejecutables los SLOs de DR.

Suma ~9 d/p para llegar a v12.3 release-ready. El resto de MEDIO y BAJO queda como backlog v12.4.

## 8. Como adapto esto a un proyecto real
Playbook actualizado para 2026-04-25:

1. `git clone` + `node scripts/bootstrap.mjs` (instala hooks + deps + valida entorno).
2. Copiar `template.config.example.json` a `config/<empresa>.json` y completar las 10 secciones; ahora incluye `project.databaseName` y `project.featureFlagPrefix`.
3. `node scripts/validate-template-config.mjs --config config/<empresa>.json` antes de cualquier instanciacion.
4. `node scripts/new-service.mjs --stack <stack> --config config/<empresa>.json --dest ../<servicio>`. La salida valida automaticamente el repo generado con `check-docs` + `check-template-instantiation`.
5. En `../<servicio>` adoptar el logger seguro (`pii-redact`/`PiiRedactor`) en todo handler de error.
6. Configurar IdP externo (Auth0/Entra/Keycloak) con los claims documentados en `03.08-auth-authz.md` y registrar issuer/JWKS en `OIDC_ISSUER` + `OIDC_JWKS_URL`.
7. Configurar `vars.SECRETS_PROVIDER`, `vars.AWS_ROTATE_ROLE_ARN` (o GCP/Vault) y `secrets.SECRETS_KUBECONFIG` para que `rotate-secrets.yml` corra el ciclo completo de rotacion + verify.
8. Ejecutar primer GameDay DR (cuando `gameday-dr.yml` exista) dentro de las 8 semanas siguientes al go-live.
9. Configurar dashboard Grafana apuntando a las recording rules `slo:sli_ratio:*` generadas con `generate-slo-rules.mjs`.
10. Cargar el catalogo Backstage con `catalog/all.yaml` extendido con `allow: [Location, Domain, System, Group, User, Template, API, Resource, Component]`.

## 9. Veredicto
La plantilla esta hoy en **v12.2.0 release** + 9 archivos nuevos de v12.3 ya escritos (`pii-redact.ts`, `pii-redact.test.ts`, 3x `PiiRedactor.java`, 3x `PiiRedactorTest.java`, `90.25-threat-modeling.md`). Los validadores estan verdes. Falta el cierre operativo de v12.3 segun seccion 7.

Estimacion total para "auditoria externa sin sustos": ~9 d/p adicionales para v12.3 release.

## 10. Enlaces relacionados
- [Revision previa post-v12.1](2026-04-24-revision-post-v12-1.md)
- [Revision original post-v12.0](2026-04-24-revision-adaptacion-proyecto-real.md)
- `stacks/node-next/template/src/lib/pii-redact.ts`
- [Threat modeling 90.25](../docs/transversal/90.25-threat-modeling.md)
- [ADRs 007-009](../docs/fase-3-arquitectura/adr/)
