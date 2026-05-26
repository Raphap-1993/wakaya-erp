# Revision de profesionalizacion v2 - post v11.0.0

[README principal](../README.md) | [Indice docs](../docs/README.md) | [Revision v1](2026-04-22-revision-profesionalizacion.md) | [Release v11.0.0](../releases/v11.0.0.md)

## Contenido
- [Contexto](#contexto)
- [Metodo](#metodo)
- [Resumen ejecutivo](#resumen-ejecutivo)
- [Profundidad real de las piezas ejecutables](#profundidad-real-de-las-piezas-ejecutables)
- [Huecos identificados](#huecos-identificados)
- [Inconsistencias y fragilidades](#inconsistencias-y-fragilidades)
- [Ranking por impacto](#ranking-por-impacto)
- [Propuesta de hojas de ruta](#propuesta-de-hojas-de-ruta)
- [Checklist para adoptar en proyecto real hoy](#checklist-para-adoptar-en-proyecto-real-hoy)
- [Conclusion](#conclusion)

<a id="contexto"></a>
## Contexto
La [revision v1 de profesionalizacion](2026-04-22-revision-profesionalizacion.md) identifico 16 huecos que impedian adaptar la plantilla a un proyecto real. `v11.0.0` los cerro: cuatro stacks con scaffolding ejecutable, cinco workflows de GitHub Actions, automatizacion de calidad y seguridad local, configuracion y secretos documentados, migraciones de BD, dev environment, contratos OpenAPI y de eventos, observabilidad estandarizada, legales y compliance, IaC, definiciones operativas, accesibilidad, producto, plantillas GitHub, versionado y commits. Cadena `nav-guided` simetrica. `node ci/scripts/check-docs.mjs` limpio sobre 296 archivos.

Esta revision responde a la pregunta siguiente: **una vez cerrados esos 16 huecos, que le sigue faltando a la plantilla para pasar de referencia profesional a produccion empresarial o regulada**. La pregunta ya no es "puedo arrancar un proyecto" sino "puedo operar un producto con auditoria, escala y multiples equipos".

<a id="metodo"></a>
## Metodo
- Inspeccion de los scaffolds por stack: se revisaron los archivos concretos en `stacks/*/template/`, no solo los README.
- Inspeccion de los cinco workflows en `.github/workflows/` para medir cobertura real de SARIF, cache, scan de imagenes y firma de artefactos.
- Revision de `contracts/api/openapi.yaml` y del esquema de evento en `contracts/events/` para medir completitud.
- Revision de `ops/infra/aws/main.tf` y `ops/k8s/base/deployment.yaml` para medir si son produccion-ready o placeholders.
- Cruce contra practicas estandar de un proyecto empresarial regulado: auditoria de datos, multi-entorno, supply-chain security (SLSA), policy-as-code, DORA, FinOps, i18n, plataforma interna.

<a id="resumen-ejecutivo"></a>
## Resumen ejecutivo
`v11.0.0` convirtio la plantilla en **referencia profesional ejecutable**: cuatro stacks con Dockerfile multi-stage y usuario no-root, endpoints de salud reales, tests basicos, migracion Flyway inicial, pipelines que corren `lint/test/build` por stack y contratos que existen como archivo y no solo como concepto.

Pero sigue siendo **referencia, no plataforma productiva**. El Terraform en `ops/infra/aws/main.tf` es un placeholder de 59 lineas con un solo bucket S3 y comentarios "reemplazar por modulos reales"; no hay VPC, ni RDS, ni ALB, ni multi-entorno. `security.yml` genera SBOM y corre gitleaks/semgrep pero no sube SARIF a GitHub Security y no escanea imagenes de contenedor. El feature-flagging esta documentado pero no hay SDK ni runtime. La plantilla no cubre patrones de despliegue avanzado (canary, blue-green) ni firma de artefactos.

Se identifican **18 huecos nuevos**: 7 `ALTO`, 7 `MEDIO` y 4 `BAJO`. Ninguno bloquea adoptar la plantilla para un proyecto nuevo de tamano pequeno o mediano. Varios son criticos si el proyecto necesita pasar auditoria regulatoria (SOC2, ISO 27001, GDPR con ROPA real) o si debe operar varios entornos con disciplina.

<a id="profundidad-real-de-las-piezas-ejecutables"></a>
## Profundidad real de las piezas ejecutables

### Stacks ejecutables
Los cuatro stacks en `stacks/*/template/` son ejecutables minimos, no narrativos. `node-next` tiene `package.json` con Next 14, ESLint, Prettier, Vitest y Playwright; test de salud funcional; build multi-stage con HEALTHCHECK via wget. `java-monolith` y `spring-react` tienen `pom.xml`/`build.gradle.kts` reales con Spring Boot 3.3, Java 21, test unitario de controller, multi-stage Dockerfile y Flyway. `quarkus-angular` trae backend Quarkus 3.12 y frontend Angular 18 standalone.

Limitaciones encontradas:
- Los tests son "smoke" del endpoint `/api/health`. No hay pruebas de dominio ni ejemplos de test con base de datos via Testcontainers.
- La migracion Flyway es una unica `V1__baseline.sql`. No se muestra patron de migracion incremental ni expand/contract para zero-downtime.
- `spring-react` tiene `package.json` frontend sin scripts de lint; la asimetria con `node-next` confunde.
- `quarkus-angular/frontend` no expone linting ni e2e en scripts.
- Ninguno expone dominio real mas alla del health; el caso canonico de expedientes no tiene un endpoint real codificado.

### Workflows de GitHub Actions
Los cinco workflows existen y son coherentes:
- `ci.yml` usa `dorny/paths-filter` y corre lint+test+build por stack.
- `security.yml` corre gitleaks, semgrep, dependency-review y genera SBOM con syft.
- `release.yml` escucha tags `v*` y publica imagenes a GHCR.
- `pr.yml` valida commitlint, PR titles semanticos y etiquetas de tamano.
- `docs.yml` ejecuta `check-docs.mjs` cuando cambian `.md`.

Limitaciones encontradas:
- **No hay SARIF upload**: semgrep se corre pero no se sube a GitHub Security, perdiendo el panel nativo de alertas.
- **No hay container scanning**: no corre Trivy ni Grype contra las imagenes que publica `release.yml`.
- **No hay firma de artefactos**: ni `cosign sign` ni atestaciones SLSA mas alla de la provenance basica de `docker buildx`.
- **Sin cache de Docker multi-layer**: cada push reconstruye capas que podrian cachearse via `--cache-from` / `--cache-to`.
- **Sin coverage**: ningun workflow publica cobertura ni impone un gate minimo.
- **Sin preview environments**: las PRs no despliegan un entorno efimero.

### Contratos
`contracts/api/openapi.yaml` (OpenAPI 3.1) cubre `/api/health`, listado, detalle y transiciones; usa RFC 7807 para errores. `contracts/events/expediente-estado-cambiado.schema.json` es un JSON Schema 2020-12 bien formado.

Limitaciones:
- El OpenAPI no declara `securitySchemes` (no hay authn/authz). Para un servicio profesional debe existir al menos OAuth2/OIDC o mTLS declarado.
- No hay ejemplos (`examples`) en request/response, lo que dificulta generar clientes y mocks.
- No hay AsyncAPI para los eventos; solo existe un JSON Schema suelto.
- No hay politica de versionado de API publicada ni deprecation policy formal.

### IaC
- `ops/infra/aws/main.tf` declara backend S3 con placeholders (`CAMBIAR-bucket`, `dynamodb_table` comentado) y un unico bucket de artefactos. Todo lo demas (VPC, RDS, ECS/EKS, ALB, CloudFront) esta como comentario "reemplazar por modulos reales". No hay outputs utiles ni workspaces por entorno.
- `ops/k8s/base/deployment.yaml` si es solido: `runAsNonRoot`, `readOnlyRootFilesystem`, drop `ALL`, probes HTTP, resource requests/limits, `envFrom` combinando ConfigMap y Secret. Dos replicas estaticas.
- **Faltan**: HPA, PDB, NetworkPolicy, `overlays/` por entorno (kustomize), PodSecurityStandards, politicas de admision (OPA Gatekeeper / Kyverno).

<a id="huecos-identificados"></a>
## Huecos identificados

### Alto impacto

#### 1. Supply-chain security incompleta
Faltan: Trivy/Grype para escanear imagenes antes del push a GHCR; `cosign sign` + attestation SLSA provenance; `sigstore/cosign-installer` en `release.yml`; verificacion de firmas en despliegue; una politica documentada en `SECURITY.md` sobre como se firma y verifica cada artefacto. Para un proyecto profesional, esto es tabla de apuestas: sin firma verificable y sin scan de imagen, la cadena de suministro no es auditable.

#### 2. SARIF y panel de seguridad de GitHub ausente
`security.yml` corre semgrep pero no usa `semgrep ci --sarif-output` y `github/codeql-action/upload-sarif`. El resultado: las alertas se pierden en logs en lugar de aparecer como issues en "Security" del repo. Mismo problema para gitleaks (existe `--sarif-report`) y trivy cuando se agregue.

#### 3. Terraform solo como ejemplo placeholder
`ops/infra/aws/main.tf` no es adoptable: faltan VPC, RDS, ECS/EKS, ALB, CloudFront, DynamoDB state lock activo, tags comunes, modulos reutilizables en `ops/infra/modules/`, estructura multi-entorno (`ops/infra/envs/{dev,staging,prod}/`), y outputs reales. Tampoco hay `tfsec` ni `checkov` en el pipeline, asi que un Terraform mal escrito pasa.

#### 4. Gestion operativa de secretos sin patron concreto
`docs/fase-3-arquitectura/03.05-configuracion-secretos.md` describe principios, y `.env.example` lista variables. Falta el runtime: un ejemplo de integracion con AWS Secrets Manager / HashiCorp Vault / External Secrets Operator en Kubernetes, y un flujo documentado de rotacion automatica conectado al workflow de CI. `docs/transversal/90.18-definiciones-operativas.md` menciona rotacion pero no provee la automatizacion.

#### 5. Audit trail regulatorio ausente
Para SOC2 / ISO 27001 / GDPR se necesita un patron estandarizado de registro auditable: eventos de acceso, cambios de datos y acciones privilegiadas con campos minimos (`actor`, `subject`, `action`, `ts`, `ip`, `trace_id`, `outcome`). `contracts/events/` tiene un evento de dominio pero no un esquema canonico de auditoria. No hay runbook para respuesta a requerimientos legales, retencion de logs ni legal hold.

#### 6. Estrategia de despliegue seguro no implementada
La plantilla no incluye canary, blue-green, ni progressive delivery (Argo Rollouts, Flagger). Tampoco hay patrones de feature flag runtime (SDK integrado con un servicio), aunque `docs/transversal/90.17-feature-flags.md` los describe. Un proyecto profesional con trafico real necesita bajar el riesgo de cada deploy, no solo poder deployar.

#### 7. Gestion de datos en produccion incompleta
No hay: runbook de backup/restore, patron de migracion zero-downtime (expand/contract, dos fases), politica de retencion automatizada por clase de dato, matriz de clasificacion (publico / interno / confidencial / PII / PII-sensible), ni catalogo de datos. `docs/transversal/90.16-privacidad-compliance.md` menciona GDPR pero no hay template de ROPA (Record of Processing Activities) ni DPA.

### Medio impacto

#### 8. Release engineering basico
Faltan: changelog automatizado (release-please o semantic-release), preview environments por PR (Vercel-like en self-hosted), bump automatico de version por Conventional Commits, release notes desde tags.

#### 9. Metricas DORA y SPACE ausentes
Ningun workflow expone `deployment_frequency`, `lead_time_for_changes`, `change_failure_rate`, `mean_time_to_recovery`. No hay dashboard de flow metrics. Para equipos que aspiran a alto rendimiento (Accelerate), estas metricas son guia.

#### 10. Contract testing y testing avanzado sin scaffolding
No hay Pact / Spring Cloud Contract, k6 / Gatling para carga, Stryker / PIT para mutation, ni axe-core / Lighthouse CI para accesibilidad automatizada. `docs/fase-6-qa/` describe estrategia de pruebas pero no entrega plantillas ejecutables.

#### 11. i18n y l10n sin baseline
Los stacks frontend no tienen `i18n/` con archivos de locale ni proceso de traducciones. Sin convencion inicial (ICU message format, locale fallback, pluralizacion), cada proyecto derivado lo resuelve solo.

#### 12. Plataforma interna y service catalog
No hay `catalog-info.yaml` de Backstage ni equivalente. Un proyecto a escala necesita descubrir ownership, SLOs, runbooks por servicio en un catalogo unico. Tambien faltan golden paths ejecutables (templater de nuevos servicios) y scorecards.

#### 13. API publicada como documentacion navegable
El OpenAPI existe como archivo YAML pero no se publica automaticamente en Redocly, Stoplight o Swagger UI, ni como artefacto de cada release. Tampoco hay AsyncAPI para eventos.

#### 14. Observabilidad sin ejemplos concretos
`docs/fase-8-operacion/08.01-observabilidad.md` describe los tres pilares y SLI/SLO genericos. Falta ejemplo real de `otel-collector-config.yaml`, dashboards exportados (`.json` para Grafana), reglas de alerta (`prometheus-rules.yaml`) y runbooks mapeados a cada alerta.

### Bajo impacto

#### 15. FinOps sin baseline
No hay: tags de costo obligatorios en Terraform (`cost-center`, `owner`, `environment`), presupuestos por entorno, alertas de anomalia, ni patron de showback/chargeback.

#### 16. Mobile ausente
No hay stack mobile (React Native, Flutter, nativo iOS/Android). Proyectos B2C lo piden.

#### 17. Policy-as-code
No hay OPA/Rego, Kyverno, o Conftest para validar IaC, manifiestos Kubernetes o politicas de cluster en CI.

#### 18. Sostenibilidad y eficiencia energetica
Sin seccion de green software, principios de Carbon Aware Computing, ni metrica de `gCO2 / request`. Todavia minoritario, pero relevante para empresas con compromisos ambientales.

<a id="inconsistencias-y-fragilidades"></a>
## Inconsistencias y fragilidades

- **Puerto inconsistente**: `stacks/node-next/template/.env.example` declara `PORT=3000`, los stacks Java usan `8080`. Un runbook unificado debe adoptar una convencion (proponer `8080` para servicios HTTP, `3000` solo para Next dev).
- **Lint asimetrico**: `spring-react/template/frontend/package.json` no incluye `lint`/`typecheck`; `node-next` si. Alinear para no degradar calidad segun el stack elegido.
- **Flyway con una sola migracion**: dificulta ensenar versionado incremental, rollback y expand/contract. Agregar al menos `V2__add_column.sql` + `V3__backfill.sql` + `V4__drop_old.sql` como patron.
- **Healthcheck duplicado**: Dockerfile y Kubernetes manifiest exponen ambos healthcheck. En Kubernetes conviene que `HEALTHCHECK` del Dockerfile sea menos estricto o ausente para evitar double-signal.
- **Terraform placeholder**: archivo marcado como "reemplazar por modulos reales" deberia estar en `ops/infra/aws/example/` o `ops/infra/aws/skeleton/` y no en `main.tf`, para no inducir a adoptarlo tal cual.
- **Seguridad.yml sin SARIF**: el trabajo corre pero sus hallazgos se pierden. Es fragil porque da la sensacion de seguridad automatica sin panel visible.
- **`release.yml` publica 4 imagenes backend pero ninguna frontend**: inconsistente para los stacks full-stack.
- **Sin gate de cobertura**: el CI no falla por cobertura minima; la frase "cobertura objetivo" queda opcional.

<a id="ranking-por-impacto"></a>
## Ranking por impacto

| Prioridad | Gap                                                                              | Impacto              |
|-----------|----------------------------------------------------------------------------------|----------------------|
| ALTO      | Supply-chain security (Trivy, cosign, SLSA)                                      | Seguridad / auditoria |
| ALTO      | SARIF upload al panel de GitHub Security                                         | Seguridad            |
| ALTO      | Terraform real multi-entorno con modulos, state lock y tags                      | Plataforma           |
| ALTO      | Secret management operativo (External Secrets / Vault) y rotacion                | Seguridad            |
| ALTO      | Audit trail regulatorio estandarizado                                            | Compliance           |
| ALTO      | Canary / blue-green + feature flag runtime                                       | Release engineering  |
| ALTO      | Backup/restore + retencion automatizada + clasificacion de datos                 | Compliance / datos   |
| MEDIO     | Changelog automatico y preview environments                                      | DX / release         |
| MEDIO     | DORA metrics expuestas en dashboard                                              | Engineering health   |
| MEDIO     | Contract testing, load, a11y y mutation como plantillas                          | QA avanzado          |
| MEDIO     | i18n/l10n baseline en stacks frontend                                            | UX / producto        |
| MEDIO     | Service catalog (Backstage) + golden paths                                       | Plataforma interna   |
| MEDIO     | Publicacion navegable de OpenAPI y AsyncAPI                                      | DX / contratos       |
| MEDIO     | Observabilidad con ejemplos concretos de collector, dashboard y alertas          | Operacion            |
| BAJO      | FinOps (tags obligatorios, presupuestos, showback)                               | Coste                |
| BAJO      | Stack mobile                                                                     | Alcance              |
| BAJO      | Policy-as-code (OPA/Kyverno)                                                     | Plataforma           |
| BAJO      | Sostenibilidad y carbon-aware computing                                          | ESG                  |

<a id="propuesta-de-hojas-de-ruta"></a>
## Propuesta de hojas de ruta

### v11.1.0 - Supply chain y seguridad profunda
Alcance sugerido: Trivy + cosign + SLSA provenance en `release.yml`, SARIF uploads desde semgrep/gitleaks, `tfsec` y `checkov` en `security.yml`, `pre-commit` hook para firmar commits, `SECURITY.md` extendido con proceso de firma y verificacion, documentacion en `docs/transversal/90.15-seguridad-dependencias.md` (nuevo).

### v11.2.0 - Plataforma productiva
Terraform real en `ops/infra/aws/modules/{network,compute,database,ingress}/` con `ops/infra/aws/envs/{dev,staging,prod}/`, `DynamoDB` para state lock, tags comunes obligatorios; manifests Kubernetes con HPA, PDB, NetworkPolicy, `overlays/` por entorno via kustomize; External Secrets Operator o SOPS como patron de secretos; GitOps con ArgoCD documentado en ADR-006.

### v11.3.0 - Release engineering y observabilidad operativa
release-please para changelog automatico, preview environments por PR, Argo Rollouts o Flagger para canary, SDK de feature flags integrado con OpenFeature (provider LaunchDarkly/Unleash/ConfigCat como opciones), dashboard DORA automatico. Ejemplos concretos de `otel-collector-config.yaml`, dashboards Grafana en `.json` y reglas de alerta Prometheus.

### v12.0.0 - Compliance y escala
Audit trail estandar en `contracts/events/audit-*.schema.json` con implementacion de referencia; ROPA template en `docs/transversal/90.16-privacidad-compliance.md`; DPIA template; backup/restore runbook completo con prueba trimestral documentada; matriz de clasificacion de datos; service catalog (Backstage) con `catalog-info.yaml` en cada stack; golden paths ejecutables para crear nuevos servicios; i18n baseline en los stacks frontend; AsyncAPI para todos los eventos.

### v12.1.0 - Testing avanzado y producto
Contract testing con Pact entre `java-monolith` y `node-next`; k6 de carga con umbrales por endpoint; axe-core y Lighthouse CI como gate; mutation testing en al menos un stack; DORA y SPACE metrics expuestas; feature flag experimentation framework.

### Opcional - Mobile, FinOps, policy, sostenibilidad
Solo si el proyecto lo requiere. Stacks mobile (RN/Flutter), `docs/transversal/90.20-finops.md`, OPA/Kyverno en `ops/k8s/policies/`, `docs/transversal/90.21-sostenibilidad.md` con principios Green Software.

<a id="checklist-para-adoptar-en-proyecto-real-hoy"></a>
## Checklist para adoptar en proyecto real hoy
Si un equipo adopta la plantilla en su estado actual, este es el orden minimo de trabajo antes de ir a produccion:

- [ ] Reemplazar `ops/infra/aws/main.tf` con Terraform real con VPC + RDS + ALB + ECS/EKS; habilitar state lock.
- [ ] Crear carpetas `ops/infra/aws/envs/{dev,staging,prod}/` y escoger kustomize o helm para manifestos.
- [ ] Integrar un gestor de secretos operativo (AWS Secrets Manager + External Secrets, o SOPS).
- [ ] Agregar Trivy al workflow `release.yml` y bloquear push si hay vulnerabilidades criticas.
- [ ] Agregar `cosign sign` y verificar firma en el deploy.
- [ ] Subir SARIF de semgrep y gitleaks a GitHub Security.
- [ ] Definir `securitySchemes` en `contracts/api/openapi.yaml` y cablear autenticacion real (OAuth2/OIDC).
- [ ] Implementar al menos un feature flag real con OpenFeature + proveedor elegido.
- [ ] Anadir patron canary o blue-green en el deploy de produccion.
- [ ] Definir y automatizar retencion de logs y backups; correr drill de restore.
- [ ] Escribir ROPA y clasificacion de datos reales para el dominio del proyecto.
- [ ] Anadir HPA, PDB, NetworkPolicy en `ops/k8s/base/`.
- [ ] Agregar lint y typecheck al stack frontend elegido si el template no los trae.
- [ ] Agregar al menos dos migraciones incrementales en `src/main/resources/db/migration/` para ensenar el patron.
- [ ] Anadir tests de dominio mas alla del health check.

<a id="conclusion"></a>
## Conclusion
`v11.0.0` lleva la plantilla de referencia documental a referencia ejecutable. Un equipo puede clonar el repo, correr `make up`, levantar Postgres + Redis + Jaeger, construir una imagen Docker, correr el CI y obtener sena real de que el proceso funciona. Eso ya es mucho mas que la mayoria de templates existentes.

Para pasar de referencia a plataforma productiva para un proyecto regulado, faltan las capas que se activan cuando hay datos reales, usuarios reales, auditoria real y multiples entornos. Las siete prioridades altas (supply chain, SARIF, Terraform productivo, secret management operativo, audit trail, canary+flags, datos en produccion) cubren el 80% del trabajo pendiente y son candidatas naturales para los hitos `v11.1`, `v11.2`, `v11.3` y `v12.0` descritos en la hoja de ruta.

La plantilla esta lista para proyectos pequenos y medianos ya. Para empresariales regulados, todavia hay un sprint fuerte por delante.

