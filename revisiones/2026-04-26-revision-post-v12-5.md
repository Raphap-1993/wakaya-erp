# Revision profunda post-v12.5 - consistencia, contenido, navegabilidad y plan de adaptacion

[README principal](../README.md) | [Indice docs](../docs/README.md)

- Fecha: 2026-04-26
- Autor: revision incremental tras la generalizacion de "expediente" a `__API_RESOURCE_NAME__` y la incorporacion de los documentos `90.28`, `90.29`, `90.30`.
- Base revisada: 409 archivos markdown (versus 345 en v12.3.0), 4 stacks ejecutables, 9 ADRs, 31 transversales (`90.00` a `90.30`), `releases/v10.0.0` a `releases/v12.5.0`, catalogo Backstage completo, validadores y workflows actualizados.

## 1. Que se modifico desde v12.3.0
Entre v12.3.0 y v12.5.0 el repositorio recibio cambios estructurales relevantes:

1. **Generalizacion de dominio**: el caso canonico paso de "expedientes" a un placeholder `__API_RESOURCE_NAME__` + `__API_RESOURCE_PLURAL__` + `__API_RESOURCE_PATH__` que se sustituye en `init-project.mjs`. Constantes Java pasaron de `EXPEDIENTE_*` a `RESOURCE_*`. El schema y el ejemplo de config los exigen.
2. **Tres documentos transversales nuevos**: `90.28-anatomia-operativa-de-agents-prompts-skills.md`, `90.29-integracion-selectiva-agent-skills.md`, `90.30-principios-solid-diseno-modular.md`. La cadena nav-guided se extendio.
3. **Workflows endurecidos**: `rotate-secrets.yml` y `gameday-dr.yml` ahora reciben el kubeconfig via `env:` (en lugar de heredoc literal en `run:`), evitando logs de secret y problemas con caracteres especiales.
4. **ADR-008**: anade Keycloak como referencia canonica del IdP en ejemplos.
5. **Schema de config**: `support.url` paso a `required`; `runtime.previewBaseDomain` se removio del required; `secrets.provider` ya no acepta `azure` (solo `vault`/`aws`/`gcp`).

Validadores tras los cambios estan verdes:
- `node ci/scripts/check-docs.mjs` -> 409 archivos sin hallazgos.
- `node ci/scripts/check-template-instantiation.mjs --mode template --root .` -> sin hallazgos.
- `node scripts/validate-template-config.mjs --config template.config.example.json` -> OK.
- `node ci/scripts/check-rbac-consistency.mjs` -> matrices consistentes en los 4 stacks.

## 2. Hallazgos por dimension

### 2.1 Consistencia
ALTO. La generalizacion `expediente` -> `__API_RESOURCE_NAME__` quedo a medias:

- **Tests Java rotos**: `RbacTest.java` en los **3 stacks JVM** (`java-monolith`, `spring-react`, `quarkus-angular`) sigue invocando `Permission.EXPEDIENTE_READ`/`_WRITE`/`_APPROVE`. El enum ya no tiene esas constantes (paso a `RESOURCE_*`). El codigo Java **no compila**. El job `ci.yml` debe romperse cuando ejecute `mvn test` o `gradle test`.
- **Catalogo Backstage no tokenizado**: `catalog/all.yaml`, `catalog/apis/expedientes-rest.yaml`, `catalog/apis/expedientes-events.yaml`, `catalog/resources/expedientes-{db,cache,events-bus}.yaml`, `catalog/systems/expedientes.yaml`, `catalog/groups/team-expedientes.yaml` siguen con `expediente` literal. `init-project.mjs` solo sustituye contenido (no renombra archivos), por lo que tras instanciar quedan referencias visibles a otro dominio. Es el principal vector de inconsistencia post-bootstrap.
- **`docs/fase-3-arquitectura/03.08-auth-authz.md`**: la matriz de permisos sigue mostrando `expediente:read|write|approve` aunque el enum y el TS ya emiten `__API_RESOURCE_NAME__:read|write|approve`. La doctrina y el codigo divergen.
- **Comentarios obsoletos en codigo**: `RbacEvaluator.java` y `SecurityConfig.java` (3 stacks Spring/Quarkus), `authn.ts` y `logger.ts` (node-next) tienen ejemplos hardcoded con `'expediente:approve'` o `"expediente_creado"`. No fallan compilacion pero confunden al primer dev nuevo.
- **ADR-001 y ADR-008**: ambos siguen citando "expediente" en consecuencias y descripciones.

### 2.2 Contenido
MEDIO. Tres puntos:

- **`90.28`/`90.29`/`90.30`** introducen un eje nuevo (agents, skills, principios SOLID) que no esta enlazado desde fase 1 (analisis), fase 2 (UX) ni fase 4 (SDD). El lector que entra desde una fase no descubre estos transversales salvo navegando 90.xx en orden. Falta enlazado contextual.
- **`90.30` SOLID**: el contenido cubre principios sin ejemplos ligados a los stacks de la plantilla (los stacks JVM ya tienen `Permission`/`Role`/`Rbac`/`SecurityConfig` con SRP/OCP claros; ejemplificar SOLID con ese codigo cierra el loop teoria-practica).
- **`90.16-privacidad-compliance.md`** no menciona aun la integracion automatica del logger seguro (PII redactor wirado por defecto en v12.3). Quien lee el doc cree que la redaccion sigue siendo opcional.

### 2.3 Navegabilidad
BAJO-MEDIO. La cadena nav-guided cierra (`90.30` -> docs/README), pero:

- **Discoverability cruzada**: `03.08-auth-authz.md` no enlaza a `90.25-threat-modeling.md` aunque el threat model es parte del flujo natural de revision de auth. El `01.00-analisis-requerimientos.md` no enlaza a `90.26-contract-governance.md` pese a que el contrato vive en specs/contratos.
- **Catalog README**: tras la incorporacion de `catalog/apis/` y `catalog/resources/`, el README no se actualizo aun para mostrar la estructura real. Quien abre catalog/README.md lee solo lo de v12.1.

### 2.4 Workflows y CI
MEDIO. Dos puntos:

- **Job `ci.yml`** (build/test por stack) probablemente falla en main por los `RbacTest.java` rotos. **No verifique** la ultima corrida (no hay forma desde el sandbox), pero el codigo Java no compila localmente.
- **Job `contract-governance`** del workflow `template.yml` solo se ejecuta para `contracts/api/openapi.yaml`. No cubre `contracts/events/asyncapi.yaml` ni los JSON Schemas. Una breaking change en eventos podria mergearse sin gating.

### 2.5 Otros
BAJO.

- `releases/README.md` lista hasta `v12.5.0` correctamente; sin embargo no hay `v12.4.0.md` y `v12.5.0.md` con la rigurosidad de plantilla anterior (no auditados aqui en detalle).
- `revisiones/` tiene 7 informes; falta indice o tabla para que el lector ubique cual aplica.

## 3. Scorecard consolidado

| Severidad | Cantidad | Esfuerzo (d/p) |
| --- | --- | --- |
| ALTO | 3 (tests rotos, catalog drift, doctrina vs codigo en 03.08) | 2-3 |
| MEDIO | 4 (90.28-30 sin links cruzados, contract-governance solo REST, ci.yml verde sospechoso, 90.16 desactualizado) | 2-3 |
| BAJO | 3 (comentarios obsoletos, catalog README desactualizado, indice de revisiones) | 1 |
| **Total** | **10** | **5-7** |

## 4. Top 3 fixes para "v12.6 release-ready"

1. **Arreglar tests Java** (1 d/p): renombrar `Permission.EXPEDIENTE_*` a `Permission.RESOURCE_*` en los 3 `RbacTest.java`. Validacion: `mvn -q test` o equivalente local.
2. **Tokenizar catalog Backstage** (1 d/p): renombrar archivos a usar `__API_SYSTEM__` o el token equivalente en contenido; documentar que init-project.mjs sustituye solo contenido (los nombres de archivo se quedan estables, lo que es OK porque Backstage usa `metadata.name` no el filename).
3. **Sincronizar `03.08-auth-authz.md`** (0.5 d/p): cambiar la matriz a `__API_RESOURCE_NAME__:read|write|approve` y aclarar que tras `new-service.mjs` queda con el nombre real (`case:read`, etc.). Actualizar ADR-008 y ADR-001 con la misma terminologia.

## 5. Como adapto al proyecto real (playbook actualizado a v12.5/v12.6)

1. **Clonar y bootstrappear**:
   ```
   git clone <repo> mi-template
   cd mi-template
   node scripts/bootstrap.mjs
   ```
2. **Crear config de proyecto**: copiar `template.config.example.json` a `config/<empresa>.json` y completar los nuevos campos:
   - `project.apiResourceName` (singular: `case`, `customer`, `invoice`),
   - `project.apiResourcePlural` (`cases`, `customers`, `invoices`),
   - `project.apiResourcePath` (`/api/cases`),
   - `project.databaseName` (`case_management`),
   - `project.featureFlagPrefix` (`case-management`),
   - `auth.oidcIssuer` / `oidcJwksUrl` / `oidcAudience`,
   - `observability.*` (Prometheus, Grafana, Tempo, Loki, OTLP),
   - `dr.tier` / `rto` / `rpo` / `primaryRegion` / `secondaryRegion`,
   - `secrets.provider` (`vault`/`aws`/`gcp`).
3. **Validar config antes de instanciar**:
   ```
   node scripts/validate-template-config.mjs --config config/<empresa>.json
   ```
4. **Generar el servicio**:
   ```
   node scripts/new-service.mjs --stack <stack> --config config/<empresa>.json --dest ../<servicio>
   ```
   El comando ahora valida automaticamente con `check-docs.mjs` y `check-template-instantiation.mjs --mode instantiated` post-copia.
5. **Tras el bootstrap**:
   - Si la organizacion usa Backstage: cargar `catalog/all.yaml` y aceptar que los nombres de archivo siguen siendo "expedientes-*" salvo que renombres manualmente. Sugerencia: scriptear `git mv` post-bootstrap.
   - Adoptar el logger seguro (`@/lib/logger` en node-next, `MaskingPatternLayout` en Spring, `PiiLogFilter` en Quarkus).
   - Configurar IdP externo con `OIDC_ISSUER`/`OIDC_JWKS_URL`/`OIDC_AUDIENCE`.
   - Configurar `vars.SECRETS_PROVIDER`, `vars.AWS_ROTATE_ROLE_ARN` (o `GCP_WIF_PROVIDER` o `VAULT_URL`) y `secrets.SECRETS_KUBECONFIG` para que `rotate-secrets.yml` corra el ciclo completo.
   - Configurar `vars.DR_KUBECTL_CONTEXT`, `vars.DR_NAMESPACE`, `vars.DR_PROMETHEUS_URL` y `secrets.DR_KUBECONFIG` para que `gameday-dr.yml` ejecute la verificacion mensual.
6. **Primer GameDay**: ejecutar dentro de las 8 semanas siguientes al go-live (`gh workflow run gameday-dr.yml -f environment=dr-test -f tier=tier-1`).
7. **Threat model y contract governance**:
   - Crear `specs/<feature>/threat-model.md` para cada feature critica (ver `90.25`).
   - Para todo cambio en `contracts/api/openapi.yaml` revisar el output de `check-openapi-diff.mjs`. Si introduces breaking, etiquetar el PR con `contract-breaking-approved` y publicar deprecation.
8. **RBAC consistency**: si extiendes la matriz, modificar los 4 stacks en el mismo PR. El job `rbac-consistency` lo bloquea si hay drift.

## 6. Recomendacion final
La plantilla esta hoy en **v12.5.0** + 3 brechas ALTO ya identificadas. Los 3 fixes del top-3 (~2.5 d/p) la dejan sana para v12.6 release-ready. Las brechas MEDIO/BAJO suman ~3-4 d/p mas y se pueden distribuir en v12.6/v12.7 sin bloquear adopcion.

## 7. Enlaces relacionados
- [Revision previa post-v12.2](2026-04-25-revision-post-v12-2.md)
- [Revision post-v12.1](2026-04-24-revision-post-v12-1.md)
- `stacks/node-next/template/src/lib/pii-redact.ts`
- `stacks/node-next/template/src/lib/logger.ts`
- [Catalog Backstage](../catalog/README.md)
- [03.08 auth-authz](../docs/fase-3-arquitectura/03.08-auth-authz.md)
- [90.25 threat modeling](../docs/transversal/90.25-threat-modeling.md)
- [90.26 contract governance](../docs/transversal/90.26-contract-governance.md)
- [90.27 chaos engineering](../docs/transversal/90.27-chaos-engineering.md)
