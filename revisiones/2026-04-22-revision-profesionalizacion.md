# Revision de profesionalizacion - huecos para proyecto real

[README principal](../README.md) | [Indice docs](../docs/README.md) | [Informe v2 de consistencia](2026-04-22-informe-revision-v2.md)

## Contexto
Esta revision cambia de enfoque respecto a las auditorias anteriores. Ya no buscamos errores de consistencia, contenido o navegabilidad (eso quedo cerrado en `v10.6.0`). Aqui preguntamos: **que le falta a esta plantilla para adaptarse a un proyecto real profesional**, entendido como un proyecto que:
- puede arrancar sin reingenieria inicial,
- construye, prueba y despliega de forma automatizada,
- opera con observabilidad y trazabilidad real,
- aguanta auditoria de seguridad, legal y compliance,
- escala con un equipo que entra y sale.

## Metodo
- Inspeccion de `src/`, `tests/`, `qa/`, `ops/`, `ci/` buscando artefactos ejecutables (no solo README).
- Busqueda de archivos de scaffolding por stack (`package.json`, `pyproject.toml`, `go.mod`, `Dockerfile`, `Makefile`, `.devcontainer/`).
- Busqueda de pipelines (`.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`).
- Busqueda de herramientas de calidad (`.pre-commit-config.yaml`, linters, `CODEOWNERS`, `SECURITY.md`, `dependabot.yml`).
- Revision de legales (`LICENSE`, `PRIVACY.md`, `CODE_OF_CONDUCT.md`).
- Verificacion de contratos de API, IaC, migraciones de BD, design system, observabilidad instrumentada.

## Resumen ejecutivo
La plantilla es excelente como **metodologia y navegacion documental** (fases, SDD, ADR, LikeC4, capa IA, nav-guided, breadcrumbs, validador). Su debilidad para un proyecto real es que **casi todo el contenido fuera de `docs/` es narrativo en markdown** y no incluye el scaffolding ejecutable ni las automatizaciones que un equipo profesional espera encontrar.

Se identificaron 16 huecos. Cinco son `ALTO` (bloquean arrancar un proyecto serio sin reingenieria previa). Seis son `MEDIO` (lo hacen viable pero con fricciones). Cinco son `BAJO` (valor acumulativo que se nota en escala).

## Fortalezas ya resueltas
- Metodologia por fases `0-8` con entregables minimos y trazabilidad.
- Spec-Driven Development con `spec-funcional`, `spec-tecnica` y `spec-tareas` por feature.
- ADR unificado con plantilla, ejemplo y primer ADR canonico en repo.
- LikeC4 como arquitectura-como-codigo.
- Capa de IA (agents, prompts, skills, ejemplos) integrada al flujo de cada fase.
- `nav-guided` simetrico, breadcrumbs en 110 READMEs, validador (`ci/scripts/check-docs.mjs`).
- Convenciones y naming formalizados (`docs/transversal/90.07-convenciones-y-naming.md`).
- Release discipline: `CHANGELOG.md`, `releases/`, snapshots versionados.
- Escenarios y stacks de referencia documentados.

## Huecos identificados

### Alto impacto

#### 1. Scaffolding ejecutable ausente
`src/` y `tests/` contienen solo READMEs estructurales. No hay `package.json`, `pyproject.toml`, `go.mod`, `Dockerfile`, `docker-compose.yml`, ni ejemplos de codigo real por stack. Los `stacks/*/README.md` describen estructura pero no entregan un esqueleto listo para `npm install` o `poetry install`. Un desarrollador que adopta la plantilla arranca con una hoja casi en blanco para la capa de codigo.
- **Por que importa**: un proyecto profesional espera arrancar con `make setup && make run`, no interpretando un arbol de READMEs.
- **Donde ubicarlo**: `stacks/<stack>/` debe incluir un `template/` real (o un submodulo referenciado), y `docs/fase-5-construccion/` debe documentar como instanciarlo.

#### 2. CI/CD real no existe
`ci/` solo tiene `pipeline-baseline.md` y el script de verificacion documental. No hay `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile` ni equivalente agnostico.
- **Por que importa**: sin pipeline, cada proyecto inventa su linea de ensamble; cambia entre equipos y degrada la promesa del template.
- **Donde ubicarlo**: `ci/workflows/` con templates YAML para GitHub Actions, GitLab CI y Jenkins; o directamente `.github/workflows/*.yml` si el template asume GitHub. Enlazado desde `docs/fase-7-deploy/` y `CONTRIBUTING.md`.

#### 3. Calidad y seguridad no automatizadas
No hay `.pre-commit-config.yaml`, `.editorconfig`, linters configurados (`ruff`, `eslint`, `prettier`, `golangci-lint`), `CODEOWNERS`, `SECURITY.md` ni `dependabot.yml` / `renovate.json`.
- **Por que importa**: la deuda de calidad se acumula desde el primer sprint si no hay hooks automaticos. La seguridad sin vulnerability scanning automatizado es reactiva.
- **Donde ubicarlo**: raiz del repo (`.pre-commit-config.yaml`, `.editorconfig`, `CODEOWNERS`, `SECURITY.md`), configs de lint por stack en `stacks/<stack>/`, `dependabot.yml` en `.github/`, y una regla transversal en `docs/transversal/90.15-seguridad-y-dependencias.md` (nuevo).

#### 4. Configuracion y secretos sin estructura
No hay `.env.example`, estrategia documentada de configuracion por ambiente, ni referencia a Vault, SOPS, Key Vaults o equivalentes. `03.03-plan-despliegue.md` menciona "secretos" como concepto, pero no entrega un procedimiento concreto.
- **Por que importa**: los secretos mal gestionados son la causa mas comun de incidentes de seguridad; y sin `.env.example` no hay onboarding reproducible.
- **Donde ubicarlo**: `.env.example` en raiz, `docs/fase-3-arquitectura/03.02-configuracion-secretos.md` (nuevo), y un ADR tipo `ADR-002 - Estrategia de manejo de secretos`.

#### 5. Base de datos sin artefactos reales
No existe `db/migrations/`, `sql/schema.sql`, seeds ni modelo ER. `src/backend/infrastructure/` describe la capa pero no entrega una migracion inicial que concrete el dominio canonico de expedientes.
- **Por que importa**: sin migraciones, los deployments son manuales y fragiles, y el caso canonico no es reproducible en una maquina limpia.
- **Donde ubicarlo**: `src/backend/infrastructure/database/migrations/`, documento `docs/fase-3-arquitectura/03.05-modelo-datos.md` (nuevo), y un ADR de estrategia de migraciones (Flyway vs. Liquibase vs. Alembic vs. Prisma segun stack).

### Medio impacto

#### 6. Dev environment no ejecutable
No hay `.devcontainer/devcontainer.json`, `docker-compose.yml`, `Makefile` ni scripts de bootstrap (`scripts/setup.sh`, `scripts/reset-db.sh`). El onboarding depende de seguir documentacion narrativa.
- **Donde ubicarlo**: raiz (`Makefile`, `.devcontainer/`, `docker-compose.yml`), `scripts/` con bootstrap por stack, y guia en `docs/fase-5-construccion/05.01-setup-local.md` (nuevo).

#### 7. Contratos de API no especificados
`src/shared/contracts/` describe el concepto pero no contiene `openapi.yaml`, `schema.graphql`, `*.proto` ni JSON Schemas. El caso canonico de expedientes no expone su contrato HTTP/gRPC de forma ejecutable.
- **Donde ubicarlo**: `src/shared/contracts/api/openapi.yaml`, `src/shared/contracts/events/` con schemas por evento; plantilla en `plantillas/fase-4-sdd/openapi-snippet.md`; referencia desde cada feature en `specs/`.

#### 8. Observabilidad solo conceptual
`ops/fase-8-operacion/metricas.md` es un esqueleto sin instrumentacion real. No hay ejemplo de logging estructurado, trace distribuido, dashboards, ni mencion a un stack (Prometheus + Grafana, DataDog, ELK, OpenTelemetry).
- **Donde ubicarlo**: `docs/fase-8-operacion/08.01-observabilidad.md` (nuevo), `ops/fase-8-operacion/dashboards/` con ejemplos, y un ADR de stack de observabilidad.

#### 9. Infraestructura como codigo ausente
No hay Terraform, Pulumi, Helm charts ni manifiestos K8s. El plan de despliegue es narrativo.
- **Donde ubicarlo**: `ops/infra/<cloud>/` con Terraform o equivalente, `ops/k8s/` con manifiestos base o Helm chart, y un ADR de plataforma objetivo.

#### 10. Licencia y compliance ausentes
No hay `LICENSE`, `PRIVACY.md`, `CODE_OF_CONDUCT.md` ni notas regulatorias. En un caso como gestion de expedientes (el dominio canonico) esto es especialmente notorio: datos personales requieren politica de privacidad y retencion.
- **Donde ubicarlo**: `LICENSE`, `PRIVACY.md` y `CODE_OF_CONDUCT.md` en raiz; `docs/transversal/90.16-privacidad-compliance.md` (nuevo) con GDPR, retencion, auditoria; referencia desde `CONTRIBUTING.md` y `README.md`.

#### 11. Definiciones operativas vagas
No hay Definition of Done / Definition of Ready formal, ni SLO/SLI, ni procedimiento de on-call o postmortem template. "Criterios de salida" aparecen en el plan de pruebas pero no estan cerrados como DoD.
- **Donde ubicarlo**: `docs/transversal/90.18-definiciones-operativas.md` (nuevo) con DoD/DoR/SLO/SLI, `ops/fase-8-operacion/08.02-on-call-procedures.md` (nuevo), y `ops/fase-8-operacion/postmortem-template.md`.

### Bajo impacto (valor acumulativo)

#### 12. Templates de contribucion incompletos
`CONTRIBUTING.md` existe y es solido, pero no hay `.github/ISSUE_TEMPLATE/` ni `PULL_REQUEST_TEMPLATE.md`. Critico solo si el repo es publico o multi-equipo.

#### 13. Product y discovery sin artefactos
No hay interview guides, personas, mapa de analytics, plan de feature flags. `00.02-roadmap.md` es un template estructural. En `v11` se podria sumar `docs/fase-0-iniciacion/00.07-user-research.md`, `00.08-product-analytics.md` y `docs/transversal/90.17-feature-flags.md`.

#### 14. Accesibilidad y design system no abordados
`docs/fase-2-ux-ui/02.00-ux-ui.md` no menciona WCAG, a11y checks ni design tokens. No hay Storybook ni component library documentada. Relevante cuando la UI crezca.

#### 15. Versionado y commits no formalizados
CHANGELOG es mantenido a mano. No hay Conventional Commits documentado, ni `commitlint`, ni release automation (`semantic-release`, `release-please`). Facil de adoptar retrospectivamente.

#### 16. Validacion documental limitada al estructural
`check-docs.mjs` verifica BOM, enlaces, anclas, `nav-guided` y ortografia reservada, pero no valida completitud semantica (ej: que una `spec-funcional.md` tenga todos sus campos no vacios, que una feature tenga sus tres specs, que un ADR tenga las cuatro secciones). Mejora incremental.

## Roadmap propuesto

### v11.0.0 (bloqueantes)
1. Scaffolding ejecutable por stack (template real bajo `stacks/<stack>/template/` o submodulo).
2. CI/CD reales (`.github/workflows/` o `ci/workflows/` agnosticos).
3. `.env.example` + `docs/fase-3-arquitectura/03.02-configuracion-secretos.md` + ADR de secretos.
4. Migraciones iniciales y modelo de datos del caso canonico (`src/backend/infrastructure/database/migrations/` + `03.05-modelo-datos.md`).
5. `.pre-commit-config.yaml`, `.editorconfig`, `CODEOWNERS`, `SECURITY.md`, `dependabot.yml`.

### v11.1.0 (habilitadores)
6. Dev environment (`Makefile`, `.devcontainer/`, `docker-compose.yml`, `scripts/`).
7. Contratos de API (`openapi.yaml` o `schema.graphql` para el caso canonico).
8. Observabilidad instrumentada (`docs/fase-8-operacion/08.01-observabilidad.md` + ejemplo de logging y metricas).
9. `LICENSE`, `PRIVACY.md`, `CODE_OF_CONDUCT.md` y `docs/transversal/90.16-privacidad-compliance.md`.

### v11.2.0 (profesionalizacion)
10. IaC (`ops/infra/<cloud>/` y `ops/k8s/`).
11. Definiciones operativas (`90.18-definiciones-operativas.md`, on-call, postmortem).
12. Accesibilidad y design system (`02.01-accesibilidad-wcag.md`, `02.02-design-system-tokens.md`).
13. Templates GitHub, product/discovery, Conventional Commits.

### v11.3.0 (mejoras continuas)
14. Extender `check-docs.mjs` a validacion semantica (specs completas, ADR con cuatro secciones, features con tres specs).
15. Release automation (`semantic-release` o `release-please`).
16. Ampliar ejemplos IA con prompts por stack real y prompts para generar scaffolding.

## Como verificar avance
- `v11.0` queda listo cuando `make setup && make test && make run` funciona en al menos un stack.
- La tuberia de CI debe producir un artefacto ejecutable a partir de un commit limpio.
- `ci/scripts/check-docs.mjs` debe seguir en `OK` tras cada incorporacion.
- Un desarrollador nuevo debe poder clonar, bootstrapear y ver el caso canonico corriendo en menos de 30 minutos sin pedir ayuda humana.

