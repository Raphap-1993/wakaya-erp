# Revision profunda post-v12.0.0 - adaptacion a proyecto real profesional

[README principal](../README.md) | [Indice docs](../docs/README.md)

- Fecha: 2026-04-24
- Autor: revision post-release v12.0.0
- Base revisada: 324 archivos markdown, 4 stacks ejecutables, 7 workflows, 6 ADR, 24 transversales, IaC multi-entorno, GitOps, supply chain firmada, audit trail, FinOps y sostenibilidad.

## 1. Estado actual
La plantilla ya es **"enterprise-ready" como marco**: tiene todos los artefactos esqueleto que una organizacion regulada espera (SemVer, SBOM + cosign + SLSA, IaC multi-env, GitOps, NetworkPolicy default deny, ExternalSecrets, ROPA/DPIA, audit schema, DORA, FinOps). Sin embargo, para ser **"enterprise-ready" como producto para un equipo real**, faltan piezas que conviertan los artefactos en **comportamientos repetibles**. Esta revision identifica esas brechas y entrega un plan de adaptacion.

## 2. Como usar este informe
Cada punto tiene:
- **Problema**: la brecha concreta detectada.
- **Impacto**: para que rol afecta (dev, SRE, DPO, CFO, gerencia).
- **Adaptacion**: como aterrizarlo en un proyecto real.
- **Esfuerzo**: dimensionado en dias-persona (d/p) aproximados.

Los puntos se agrupan por criticidad: **ALTO** (bloquea adopcion seria), **MEDIO** (mejora madurez), **BAJO** (pulido).

---

## 3. Brechas ALTO (bloquean adopcion por un equipo real)

### 3.1 Falta "Day-0" del equipo: runbook humano de arranque
- **Problema**: hay `scripts/bootstrap.sh` y `scripts/new-service.sh`, pero no un documento que describa **como un equipo de 5 a 15 personas arranca el primer proyecto en 1 a 2 semanas** (quien hace que, en que orden, con que aprobaciones).
- **Impacto**: PM, TL, CTO.
- **Adaptacion**:
  1. Crear `docs/fase-0-iniciacion/00.09-plan-arranque-15-dias.md` con cronograma dia por dia.
  2. Encadenarlo en `nav-guided` entre `00.08` y `fase-1/README.md`.
  3. Incluir cheklist de quien firma que (owner, PO, arquitecto, DPO).
- **Esfuerzo**: 1 d/p.

### 3.2 CMDB / inventario de servicios no esta centralizado
- **Problema**: `catalog-info.yaml` existe por stack pero no hay un `catalog/` raiz ni un `Location` de Backstage que los referencie. Sin esto, la vision global en un CMDB real queda rota.
- **Impacto**: SRE, plataforma.
- **Adaptacion**:
  1. Crear `catalog/all.yaml` con un `Location` que referencie todos los `catalog-info.yaml`.
  2. Definir `System`, `Domain`, `Group` y `User` como recursos Backstage (tambien en `catalog/`).
  3. Documentar en `docs/transversal/90.04-stacks-de-referencia.md`.
- **Esfuerzo**: 1 d/p.

### 3.3 SLOs como codigo (no como tabla markdown)
- **Problema**: los SLOs viven en `docs/fase-8-operacion/08.01-observabilidad.md` como tabla. Prometheus tiene `slo:availability:ratio_rate30d` pero falta la declaracion en un formato estandar (Sloth, OpenSLO, Pyrra) que genere alertas automaticas.
- **Impacto**: SRE, on-call.
- **Adaptacion**:
  1. Agregar `ops/observability/slos.yaml` en formato OpenSLO 1.0.
  2. Workflow que genere las alertas de burn rate desde ese archivo.
  3. Integrar con el dashboard Grafana actual.
- **Esfuerzo**: 2 d/p.

### 3.4 Runbook de rotacion de secretos real (no placeholder)
- **Problema**: `90.18-definiciones-operativas.md` menciona rotacion de secretos pero no hay un runbook ejecutable con comandos por tipo de secreto (DB, API externa, JWT signing key, cosign).
- **Impacto**: SRE, seguridad, auditoria.
- **Adaptacion**:
  1. Crear `ops/runbooks/rotacion-secretos.md` con receta por tipo.
  2. Scripts de apoyo en `scripts/rotate/*.sh` (ej. `rotate-db-password.sh` usando External Secrets).
  3. Cronograma obligatorio (DB cada 90 dias, API externas segun proveedor, claves firma anualmente).
- **Esfuerzo**: 2 d/p.

### 3.5 Plan de continuidad y recuperacion de desastres (DR)
- **Problema**: `ops/data/backup-restore.md` cubre BD pero no hay DR plan global (RTO/RPO por servicio, region de failover, orden de recuperacion).
- **Impacto**: CTO, CISO, regulatorio.
- **Adaptacion**:
  1. `docs/fase-8-operacion/08.02-plan-dr.md` con RTO/RPO, orden de restauracion, responsabilidades, frecuencia de drill.
  2. `ops/runbooks/dr-failover-region.md` con procedimiento AWS region switch.
  3. Encadenarlo en `nav-guided` entre `08.01` y `transversal/README.md`.
- **Esfuerzo**: 3 d/p.

### 3.6 Autenticacion y autorizacion no estan instanciadas
- **Problema**: `openapi.yaml` declara `bearerAuth` pero ningun stack tiene un middleware JWT real, un RBAC declarativo ni documentacion de claims. Un proyecto real lo necesita desde la linea 1.
- **Impacto**: toda feature.
- **Adaptacion**:
  1. `stacks/node-next/template/src/lib/auth.ts` con verificacion JWT via JWKS.
  2. `stacks/java-monolith/template/src/main/java/.../SecurityConfig.java` con Spring Security + RBAC por rol.
  3. `docs/fase-3-arquitectura/03.07-auth-authz.md` con claims estandar, RBAC matrix base y flujo OAuth/OIDC.
- **Esfuerzo**: 3 d/p.

### 3.7 Gestion de incidentes end-to-end
- **Problema**: hay referencias a postmortems pero no hay template completo, ni severidades precisas, ni conexion a un paging real.
- **Impacto**: SRE, on-call, soporte.
- **Adaptacion**:
  1. `plantillas/fase-8-operacion/postmortem.md` con las secciones blameless: timeline, impacto cuantificado, root cause, action items.
  2. `docs/transversal/90.24-gestion-incidentes.md` con severidades S1-S4, canal de comunicacion, status page, reintegro.
  3. Encadenar en `nav-guided` tras `90.23`.
- **Esfuerzo**: 2 d/p.

---

## 4. Brechas MEDIO (madurez y escalabilidad)

### 4.1 Threat model (STRIDE) no existe
- **Problema**: `SECURITY.md` es reactivo; falta el documento de analisis proactivo por feature.
- **Adaptacion**: `plantillas/fase-3-arquitectura/threat-model.md` (STRIDE table) + ADR que lo haga obligatorio para features Restringidas.
- **Esfuerzo**: 1 d/p.

### 4.2 Registro central de APIs y eventos
- **Problema**: `contracts/` tiene el contrato canonico, pero no hay un registry (como Confluent Schema Registry o Apicurio) ni instrucciones de como versionar contratos cuando hay varios servicios.
- **Adaptacion**: `docs/transversal/90.25-contract-governance.md` + pipeline que publique esquemas a un registry.
- **Esfuerzo**: 2 d/p.

### 4.3 Frontend no tiene la misma madurez operativa que el backend
- **Problema**: los stacks con UI no tienen Web Vitals, error tracking (Sentry) ni RUM en la guia.
- **Adaptacion**: `docs/fase-2-ux-ui/02.03-rum-web-vitals.md` y ejemplo en `stacks/node-next/template/src/lib/rum.ts` + configuracion de Sentry via env vars.
- **Esfuerzo**: 1 d/p.

### 4.4 Plan de pruebas no cubre chaos engineering
- **Problema**: testing incluye unit/integ/e2e/a11y/load/contract/mutation, pero falta resiliencia activa.
- **Adaptacion**: `ops/chaos/experiments.yaml` (LitmusChaos o Chaos Mesh) + runbook de game days.
- **Esfuerzo**: 2 d/p.

### 4.5 Politicas de branching y code review son implicitas
- **Problema**: `CODEOWNERS` existe, pero no hay documento que describa el flujo concreto: "2 aprobaciones, CODEOWNER obligatorio, linear history, require up-to-date".
- **Adaptacion**: `docs/transversal/90.26-politicas-repositorio.md` + script `scripts/apply-branch-protection.sh` que llame a la API GitHub.
- **Esfuerzo**: 1 d/p.

### 4.6 Onboarding de desarrolladores
- **Problema**: existen `CONTRIBUTING.md` y `bootstrap.sh` pero no una ruta de onboarding medida (checklist primer PR, primer deploy, primer oncall shadow).
- **Adaptacion**: `docs/transversal/90.27-onboarding-ingenieria.md` con checklist que el primer mes debe cumplir.
- **Esfuerzo**: 1 d/p.

### 4.7 Observabilidad multi-tenant / multi-region
- **Problema**: labels Prometheus actuales asumen `env`; un proyecto real suele tener `tenant`, `region` y `cellId`.
- **Adaptacion**: actualizar `90.18-definiciones-operativas.md` y las rules de Prometheus para incluir esos labels por convencion.
- **Esfuerzo**: 1 d/p.

### 4.8 Cost guardrails en PRs
- **Problema**: hay politica FinOps pero ningun PR muestra el delta de costo estimado.
- **Adaptacion**: workflow `pr-cost-estimate.yml` con Infracost; regla que bloquee cambios con delta > N USD sin aprobacion de plataforma.
- **Esfuerzo**: 1 d/p.

### 4.9 Datos sinteticos y masking para entornos no-prod
- **Problema**: `clasificacion-datos.md` prohibe copiar datos Restringidos a dev sin anonimizar, pero no hay script ni plantilla.
- **Adaptacion**: `ops/data/masking.sql` + script de dump anonimizado + doc en `ops/data/README.md`.
- **Esfuerzo**: 2 d/p.

### 4.10 Modelo de datos con diagramas ER
- **Problema**: `03.06-modelo-datos.md` es texto; falta `.likec4` o DBML con las entidades del caso canonico.
- **Adaptacion**: `docs/fase-3-arquitectura/diagramas/modelo-datos.dbml` + renderizado automatico a PNG/SVG en docs.
- **Esfuerzo**: 1 d/p.

### 4.11 Internacionalizacion del dominio completo
- **Problema**: solo el stack node-next tiene baseline i18n; los otros stacks no.
- **Adaptacion**: ejemplos `messages_{es,en,pt}.properties` en los stacks Java + contrato para claves compartidas.
- **Esfuerzo**: 1 d/p.

### 4.12 Hardening por imagen contenedor
- **Problema**: Dockerfiles existen, pero no hay distroless/minimal base, scanner configurado por stack, ni documentacion de CVE budget.
- **Adaptacion**: Dockerfile `FROM gcr.io/distroless/...` + ADR de hardening + referencia en `90.15-seguridad-dependencias.md`.
- **Esfuerzo**: 1 d/p.

---

## 5. Brechas BAJO (pulido)

### 5.1 Cobertura de tests mutacion por default
- **Problema**: mutation testing es "opcional". Conviene mostrar gate minimo por defecto.
- **Adaptacion**: agregar job `mutation.yml` con Stryker y threshold de supervivencia.

### 5.2 Docs rendering automatizado
- **Problema**: `techdocs-ref` esta declarado en catalog-info pero no hay pipeline para publicar.
- **Adaptacion**: `techdocs.yml` con mkdocs + deploy a S3 o Pages.

### 5.3 Glosario unico
- **Problema**: hay terminos ("expediente", "bandeja", "transicion") en varios docs; falta glosario unico.
- **Adaptacion**: `docs/transversal/90.28-glosario.md`.

### 5.4 Mapping de seguridad a ISO 27001 / SOC 2
- **Problema**: los artefactos cumplen en practica, pero ningun doc mapea explicitamente al control SOC 2 o ISO 27001.
- **Adaptacion**: `docs/transversal/90.29-mapeo-iso27001-soc2.md`.

### 5.5 Matriz de comunicaciones por incidente
- **Problema**: incidentes criticos necesitan plantilla de status page, comms internas y externas.
- **Adaptacion**: `plantillas/fase-8-operacion/comunicacion-incidente.md`.

---

## 6. Como adapto esto a mi proyecto real (playbook)

### Paso 1 - Fork y branding (dia 0)
1. Crear repo organizacional a partir de la plantilla.
2. Reemplazar `ejemplo.dev`, `team-expedientes`, `expedientes-*` con los nombres reales.
3. Cambiar owners en `.github/CODEOWNERS`, `PRIVACY.md`, `SECURITY.md`.
4. Archivar `docs/fase-0-iniciacion/00.06-ruta-guiada-caso-canonico.md` como referencia y crear el propio tras definir el dominio.

### Paso 2 - Gobierno (dias 1-3)
1. Instanciar `plantillas/transversal/ropa-registro-actividades.md` por cada actividad de tratamiento.
2. Firmar DPIA si aplica.
3. Crear ADR-001 real con contexto del negocio.
4. Completar matriz RACI para roles del proyecto.

### Paso 3 - Infraestructura base (dias 3-7)
1. Ejecutar `ops/infra/aws/bootstrap/` (o equivalente en tu cloud) para crear remote state.
2. Ajustar CIDR, regions, tamano de instancias por env.
3. Configurar cuentas AWS/GCP/Azure por env con OIDC para GitHub Actions.
4. Aplicar `ops/infra/aws/envs/dev/` y verificar.
5. Levantar cluster Kubernetes + ingress + ArgoCD.
6. Deploy root-app y aplicar overlays dev.

### Paso 4 - Observabilidad y seguridad (dias 5-10, en paralelo)
1. Desplegar OTEL collector, Prometheus, Grafana, Loki, Tempo.
2. Cargar `ops/observability/prometheus-rules.yaml` y `grafana-dashboard-api.json`.
3. Publicar politicas Kyverno y validar que bloquean imagenes no firmadas.
4. Configurar Dependabot, gitleaks, semgrep, trivy con rol OIDC.
5. Resolver brechas ALTO 3.3 (SLO como codigo), 3.4 (rotacion secretos), 3.6 (auth).

### Paso 5 - Golden path y primer servicio (dias 7-10)
1. `scripts/new-service.sh --stack <stack> --name <servicio> --team <owner>`.
2. Abrir primer PR, validar CI completo (build, test, security, preview).
3. Mergear y seguir el viaje: imagen firmada -> SLSA attestation -> canary -> promote.
4. Validar dashboard Grafana y audit log.

### Paso 6 - Arranque con datos reales (dias 10-14)
1. Crear ROPA por cada coleccion de datos reales.
2. Aplicar politica de retencion en jobs productivos.
3. Levantar pipeline de datos sinteticos para dev (brecha MEDIO 4.9).
4. Ejecutar primer drill de backup/restore.

### Paso 7 - Rituales operativos (continuo)
1. Semanal: dashboard DORA + cost report.
2. Mensual: revisar error budget y promover o congelar features.
3. Trimestral: drill DR, rotacion secretos, revisar ROPA y DPIA.
4. Anual: rotacion de claves, auditoria externa opcional.

---

## 7. Hoja de ruta propuesta (v12.1 a v13)

| Release | Objetivo                                                                 | Esfuerzo |
|---------|--------------------------------------------------------------------------|----------|
| v12.1   | Cerrar ALTO: 3.1 arranque, 3.2 CMDB, 3.3 SLOs, 3.4 secretos              | 6 d/p    |
| v12.2   | Cerrar ALTO: 3.5 DR, 3.6 auth, 3.7 incidentes                            | 8 d/p    |
| v12.3   | Cerrar MEDIO: 4.1 threat, 4.3 RUM, 4.8 cost PR, 4.12 hardening           | 4 d/p    |
| v12.4   | Cerrar MEDIO: 4.2 contract gov, 4.4 chaos, 4.9 masking, 4.10 ER          | 6 d/p    |
| v12.5   | Cerrar MEDIO: 4.5 branching, 4.6 onboarding, 4.7 multi-tenant, 4.11 i18n | 4 d/p    |
| v13.0   | Cerrar BAJO + normalizar toda la cadena; auditoria externa tecnica       | 6 d/p    |

Total estimado: ~34 d/p para llevarla a nivel "auditoria externa sin sustos".

---

## 8. Criterios de salida para "listo para proyecto real profesional"
- [ ] Un desarrollador nuevo hace su primer PR mergeable en el primer dia.
- [ ] Un servicio nuevo llega a produccion en menos de 5 dias calendario.
- [ ] Una auditoria externa solicita < 3 artefactos manuales para cerrar el capitulo de desarrollo seguro.
- [ ] DR drill ejecutado al menos una vez en el trimestre con RTO/RPO cumplidos.
- [ ] Dashboard DORA muestra datos reales con tendencia visible.
- [ ] Ningun secret en texto claro ni en logs.
- [ ] Todas las imagenes en produccion estan firmadas con cosign y pasan Kyverno.
- [ ] Cada feature sensible tiene ROPA y (si aplica) DPIA firmados por DPO.

## 9. Estado al cierre de v12.2.0 (2026-04-24)
Tras los releases v12.1.0 y v12.2.0 las brechas ALTO de este informe quedan cerradas; las MEDIO y BAJO se reorganizan en la revision incremental [`2026-04-24-revision-post-v12-1.md`](2026-04-24-revision-post-v12-1.md).

| Brecha | Cerrada en | Entregable concreto |
| --- | --- | --- |
| 3.1 Day-0 runbook | v12.1.0 | `docs/fase-0-iniciacion/00.09-plan-arranque-15-dias.md` |
| 3.2 CMDB centralizada | v12.1.0 + v12.2.0 | `catalog/all.yaml` + Domain/System/Group/User/Template (v12.1) y API/Resource (v12.2) |
| 3.3 SLOs como codigo | v12.1.0 | `ops/observability/slos.yaml` (OpenSLO v1) + `generate-slo-rules.mjs` + `03.07-slos-como-codigo.md` |
| 3.4 Rotacion de secretos operable | v12.1.0 + v12.2.0 | `ops/runbooks/rotacion-secretos.md` + `rotate-secrets.mjs` (v12.1) + workflow scheduled `.github/workflows/rotate-secrets.yml` (v12.2) |
| 3.5 Plan DR con tier y runbook | v12.1.0 + v12.2.0 | `08.02-plan-dr.md` + `dr-failover-region.md` + `verify-dr.mjs` (v12.1) parametrizado con flags --kubeconfig/--prometheus-url/--threshold/--dry-run/--json (v12.2) |
| 3.6 AuthN/AuthZ canonico | v12.1.0 | `03.08-auth-authz.md` + `rbac.ts`/`authn.ts` (node-next) + `Permission`/`Role`/`Rbac`/`SecurityConfig` en los 3 stacks JVM |
| 3.7 Gestion de incidentes | v12.1.0 | `docs/transversal/90.24-gestion-incidentes.md` con S1-S4, roles, postmortem blameless, metricas |
| Top-5 v12.1 (validador config, CI instanciacion, bump version) | v12.1.0 | `scripts/validate-template-config.mjs` + `scripts/schema/template.config.schema.json` + `.github/workflows/template.yml` + `releases/v12.1.0.md` |
| ADRs faltantes (OpenSLO, JWT+OIDC, DR multi-region) | v12.2.0 | `ADR-007`, `ADR-008`, `ADR-009` |
| ops/runbooks/README como tabla | v12.2.0 | tabla con trigger/oncall/script/frecuencia/RTO-RPO |

Las brechas MEDIO restantes (parser YAML lib en generador SLO, masking PII en logs, contract governance, chaos engineering, branching strategy) y todas las BAJO se mantienen como backlog para v12.3+.

## 10. Enlaces relacionados
- [releases/v12.0.0.md](../releases/v12.0.0.md)
- [releases/v12.1.0.md](../releases/v12.1.0.md)
- [releases/v12.2.0.md](../releases/v12.2.0.md)
- [docs/fase-0-iniciacion/00.06-ruta-guiada-caso-canonico.md](../docs/fase-0-iniciacion/00.06-ruta-guiada-caso-canonico.md)
- [docs/transversal/90.15-seguridad-dependencias.md](../docs/transversal/90.15-seguridad-dependencias.md)
- [docs/transversal/90.16-privacidad-compliance.md](../docs/transversal/90.16-privacidad-compliance.md)
- [ops/observability/README.md](../ops/observability/README.md)
- [ops/infra/aws/README.md](../ops/infra/aws/README.md)
- [ops/data/README.md](../ops/data/README.md)
