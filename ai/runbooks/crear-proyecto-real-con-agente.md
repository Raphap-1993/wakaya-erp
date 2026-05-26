# Crear proyecto real con el agente interno

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a runbooks IA](README.md)

> **Este runbook cubre solo el momento de CREACION** (de template a un repo
> nuevo). Para la operacion diaria del repo ya generado (que cualquier agente
> IA debe seguir en cada sesion: bootstrap de memoria viva, semantica
> `planned`/`implemented`/`validated`, presets, ciclo de cierre), ver
> [`INSTANCIACION_PROYECTO_REAL.md`](../../INSTANCIACION_PROYECTO_REAL.md) en
> la raiz. Despues de generar el proyecto, **copia ese archivo al repo destino**
> (la Fase 3 de este runbook ya lo incluye en su lista de entregables).

## Objetivo
Usar el `Enterprise AI Framework Agent` para leer la documentacion del framework, preparar la instanciacion y crear un proyecto real en otra ruta.

Este runbook es el modo orquestado end-to-end. Debe decidir si primero conviene hacer intake desde fuente bruta o si ya se puede hacer bootstrap desde template.

## Cuando usarlo
- quieres crear un nuevo proyecto desde esta plantilla,
- tienes una idea cruda, brief, acta o backlog inicial,
- necesitas que el agente guie fases, stack, config, artefactos y validaciones,
- el destino sera una ruta distinta al template, por ejemplo `C:\template\caso-real\mi-proyecto`.

## Diferencia con prompts relacionados
| Situacion | Usar |
|---|---|
| Hay notas, entrevistas, correos o texto libre sin estructura | `ai/prompts/arranque-desde-fuente-bruta.md` |
| Ya existen nombre, dominio, stack, ruta destino y config/datos minimos | `ai/prompts/crear-proyecto-real-desde-template.md` |
| El usuario quiere guia IA paso a paso, preguntas, gates y validaciones | este runbook |

Regla: este runbook puede llamar conceptualmente a los otros dos, pero no debe duplicar su responsabilidad. Primero decide el modo y luego ejecuta el flujo correspondiente.

## Entradas minimas
- ruta del template, por defecto `C:\template\project-template`,
- ruta destino del proyecto real,
- stack objetivo: `node-next`, `java-monolith`, `quarkus-angular` o `spring-react`,
- archivo de configuracion basado en `template.config.example.json`,
- fuente de negocio: idea, notas, acta, backlog o documento inicial.

## Documentacion que debe leer el agente (en orden)
Antes de crear el proyecto, el agente debe leer desde el template (NO del proyecto destino):

1. `AGENTS.md`
2. `ai/runbooks/crear-proyecto-real-con-agente.md` (este archivo)
3. `ai/agents/enterprise-ai-framework-agent.md`
4. `template.config.example.json`
5. `docs/fase-0-iniciacion/00.00-guia-de-uso.md`
6. `docs/fase-0-iniciacion/00.05-checklist-adopcion.md`
7. `docs/fase-0-iniciacion/00.10-idea-a-documentacion-inicial-con-ia.md`
8. `docs/transversal/90.10-entregables-minimos-por-fase.md`
9. `docs/transversal/90.11-checklist-entregables.md`
10. `docs/transversal/90.12-mapa-ia-por-fase.md`
11. `docs/transversal/90.14-instanciacion-fases-proyectos-reales.md`
12. `docs/transversal/90.29-integracion-selectiva-agent-skills.md`
13. `docs/transversal/90.32-agente-interno-framework-ai-first.md`
14. `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
15. `docs/transversal/90.34-product-design-y-spdd-frontend.md`
16. `docs/fase-2-ux-ui/02.11-checklist-product-design.md`
17. `docs/fase-2-ux-ui/02.12-checklist-spdd.md`
18. `docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md`
19. `docs/fase-2-ux-ui/02.14-html5-first-prototyping.md`
20. `ai/quality-gates/gate-prototype-ready.md`
21. `ai/prompts/crear-proyecto-real-desde-template.md`
22. `ai/skills/framework-governance.skill.md`
23. `ai/references/framework-enterprise-ai-first.md`
24. `stacks/README.md`

Para proyectos con autenticacion, menores o compliance critico, leer ademas:
- `docs/transversal/90.25-threat-modeling.md`
- `docs/transversal/90.26-contract-governance.md`

## Flujo

### Fase 0 - Decision de modo
1. Determinar estado de entrada:
   - Fuente bruta sin estructura: aplicar intake con `ai/prompts/arranque-desde-fuente-bruta.md`.
   - Datos minimos claros: aplicar bootstrap con `ai/prompts/crear-proyecto-real-desde-template.md`.
   - Usuario pide acompanamiento completo: continuar con este runbook como orquestador.
2. Si faltan datos minimos para instanciar, no ejecutar scripts todavia; producir preguntas abiertas y supuestos.
3. Si hay ruta destino, stack y config suficientes, pasar a bootstrap tecnico.

### Fase 1 - Bootstrap tecnico
1. Leer la documentacion minima indicada arriba.
2. Interpretar insumos ya estructurados. Si aun son fuente bruta, volver a Fase 0 y aplicar intake antes de crear el proyecto.
3. Elegir escenario, stack y ruta destino. Justificar con restricciones del proyecto.
4. Preparar o validar el archivo de config real.
5. Inicializar e indexar memoria local con `scripts/ai-framework-agent.mjs`.
6. Ejecutar validacion de config.
7. Crear el proyecto real con `scripts/ai-framework-agent.mjs create-project`, usando `--db <destino>/.agent/ai-framework.db`.

### Fase 2 - Documentacion inicial completa (fases 0-8)
8. Entrar a la ruta destino y completar artefactos iniciales para fases 0-8:
   - `docs/fase-0-iniciacion/` vision, roadmap, estimacion, roles.
   - `docs/fase-1-analisis-requerimientos/` RF, RNF, actores, modulos. Proteccion de datos de menores como RNF critico si aplica.
   - `docs/fase-2-ux-ui/` metodologia Product Design + SPDD + checklists 02.11, 02.12, 02.13 y 02.14.
   - `docs/fase-3-arquitectura/` arquitectura, ADR, despliegue.
   - `specs/<feature-real>/` product-design.md, spdd-frontend.md, prototype.md, prototype-validation.md, ui-test-cases.md, spec-funcional.md, spec-tecnica.md, api-contract.md, spec-tareas.md, traceability.md.
   - `specs/<feature-real>/prototype-html5/index.html`, `flujo.md` y `decisiones-ux.md` cuando la feature visual necesita validacion navegable rapida antes de Penpot o SDD.
   - El prototipo HTML5 debe ser autocontenido por defecto y cubrir el criterio minimo UX: flujo extremo a extremo, estados, validaciones, roles/permisos, datos mock, navegacion y feedback.
   - `qa/`, `ops/`, `contracts/api/openapi.yaml`, `ai/README.md`.
   - Permisos de dominio con prefijo del proyecto real, no genericos RESOURCE_*.
   - `traceability.md` debe cubrir al menos: RF -> pantalla -> componente -> endpoint -> prueba.
   - `prototype-validation.md` sin observaciones sin resolver.

### Fase 3 - Capa IA completa (OBLIGATORIA, no omitir)

La capa IA del proyecto real debe incluir los archivos operativos, no solo README:

**Commands - copiar TODOS los archivos individuales:**
```
ai/commands/build-command.md
ai/commands/document-command.md
ai/commands/plan-command.md
ai/commands/review-command.md
ai/commands/ship-command.md
ai/commands/spec-command.md
ai/commands/test-command.md
ai/commands/ux-command.md
ai/commands/prototype-command.md
ai/commands/README.md
```

**Skills - copiar segun tipo de proyecto (ver enterprise-ai-framework-agent.md para lista completa):**

Minimo para cualquier proyecto:
```
ai/skills/documentation-orchestration.skill.md
ai/skills/framework-governance.skill.md
ai/skills/requirements-quality.skill.md
ai/skills/debugging-workflow.skill.md
ai/skills/spec-driven-product-design.skill.md
ai/skills/spec-prototype-driven-frontend.skill.md
ai/skills/html5-prototyping.skill.md
ai/skills/penpot-ai-prototyping.skill.md
ai/skills/test-driven-development.skill.md
```

Para proyectos con auth, frontend critico, APIs:
```
ai/skills/frontend.skill.md
ai/skills/backend.skill.md
ai/skills/security-hardening.skill.md
ai/skills/browser-testing.skill.md
ai/skills/source-driven-development.skill.md
ai/skills/api-interface-design.skill.md (si existe)
```

Para proyectos con performance, streaming, CDN:
```
ai/skills/performance-optimization.skill.md
ai/skills/architecture.skill.md
```

**Docs transversal - copiar minimos:**
```
docs/transversal/90.10-entregables-minimos-por-fase.md
docs/transversal/90.11-checklist-entregables.md
docs/transversal/90.12-mapa-ia-por-fase.md
docs/transversal/90.30-principios-solid-diseno-modular.md
docs/transversal/90.33-flujo-delivery-ia-proveedores.md
docs/transversal/90.34-product-design-y-spdd-frontend.md
```

Para proyectos con autenticacion, menores o compliance:
```
docs/transversal/90.25-threat-modeling.md
docs/transversal/90.26-contract-governance.md
docs/transversal/90.29-integracion-selectiva-agent-skills.md
```

**Tests - estructura raiz:**
```
tests/unit/README.md
tests/integration/README.md
tests/e2e/README.md
tests/README.md
```

### Fase 4 - Limpieza de dominio (OBLIGATORIA)

Verificar y limpiar residuos del caso canonico del template:

```
CHECKLIST DE LIMPIEZA DE DOMINIO
[ ] specs/ no contiene carpetas de dominios anteriores (*expediente*, *bandeja*, *cambio-estado*)
[ ] README.md del proyecto habla del dominio real
[ ] specs/README.md no tiene ejemplos del template como features reales
[ ] frontend/libs/ no tiene modulos de dominio anterior
[ ] src/ (backend/frontend) no tiene carpetas de dominio anterior
[ ] catalog/ no tiene APIs de dominio anterior sin adaptar
[ ] docs/ no hace referencia a "expedientes" como dominio del proyecto real
[ ] ai/commands/ contiene archivos operativos individuales (no solo README)
[ ] ai/skills/ contiene skills tecnicas requeridas
[ ] docs/transversal/ contiene documentos requeridos
[ ] tests/ tiene estructura raiz: unit/, integration/, e2e/
[ ] .agent/ esta en .gitignore del proyecto real
[ ] DB del agente esta en .agent/ai-framework.db (no en la raiz)
```

### Capa de memoria viva (OBLIGATORIA, v12.22+)

El proyecto generado debe traer la **memoria viva del agente** lista para usarse sin
configuracion adicional. El generador ya los emite; este checklist solo verifica:

```
CHECKLIST DE MEMORIA VIVA EN EL PROYECTO REAL
[ ] AI_CONTEXT.md (contexto vivo regenerable)
[ ] PROJECT_MAP.md (mapa de carpetas por fase)
[ ] TRACEABILITY_MATRIX.md (matriz global)
[ ] GLOSSARY.md (terminos del dominio)
[ ] SESSION_LOG.md (bitacora append-only, primera entrada del generator)
[ ] INSTANCIACION_PROYECTO_REAL.md (guia para los agentes IA del repo)
[ ] package.json raiz con scripts npm: memory:bootstrap, memory:sync, memory:query,
    check:trace-drift, check:trace-coverage, check:prototype-hub, check:all
[ ] ai/memory/schema-sqlite.sql copiado
[ ] scripts/ai-framework-agent.mjs copiado
[ ] El primer `npm run memory:bootstrap` corre y crea ai/memory/framework-agent.db
[ ] `npm run check:trace-drift` reporta los links planificados como `planned`
    (no como falsos positivos `implemented`)
```

### Fase 5 - Declaracion de gates (OBLIGATORIA)

Declarar el estado real de cada gate. No asumir aprobacion sin validacion humana:

```markdown
## Estado de gates - <nombre-proyecto> - <fecha>
| Gate | Estado | Razon / Bloqueante |
|---|---|---|
| gate-0-1 | PENDIENTE | vision generada, requiere validacion humana |
| gate-ux-ready | PENDIENTE | product-design borrador, falta prototipo |
| gate-prototype-ready | PENDIENTE | falta prototipo HTML5/Penpot revisable con criterio minimo UX |
| gate-spdd-approved | PENDIENTE | no existe prototipo validado |
| gate-2-3 | PENDIENTE | arquitectura como propuesta, ADR sin aprobar |
| gate-4-6 | NO APLICA | construccion no iniciada |
| gate-7-8 | NO APLICA | deploy no iniciado |
```

### Fase 6 - Provider orientation pack

Generar el archivo ai/provider-orientation-pack.md en el proyecto real con:
- identidad del proyecto (nombre, dominio, stack, fase, fecha),
- estado de gates con razon y proximo paso,
- lista de lo que NO debe hacerse (especialmente: no construir sin gate-spdd-approved),
- commands disponibles y sus archivos,
- modo de prototipo recomendado por feature visual: HTML5 rapido, Penpot formal o ambos,
- artefactos clave (vision, requerimientos, product-design, openapi),
- features reales del specs/ (no del template).

### Fase 7 - Validacion y cierre
1. Ejecutar `node ci/scripts/check-docs.mjs <ruta-destino>`.
2. Ejecutar `node ci/scripts/check-markdown-paths.mjs <ruta-destino>`.
3. Ejecutar `node ci/scripts/check-template-instantiation.mjs --mode instantiated --root <ruta-destino>`.
4. Reportar archivos creados, comandos ejecutados, gates revisados, red flags y siguiente paso.

## Comandos base

Inicializar memoria portable (DB en .agent/ del destino):
```powershell
node scripts/ai-framework-agent.mjs init-memory --db C:\template\caso-real\mi-proyecto\.agent\ai-framework.db
node scripts/ai-framework-agent.mjs index-docs
```

Buscar contexto en la memoria:
```powershell
node scripts/ai-framework-agent.mjs search --query "crear proyecto real"
```

Planificar creacion:
```powershell
node scripts/ai-framework-agent.mjs plan-create --stack quarkus-angular --config .\mi-proyecto.config.json --dest C:\template\caso-real\mi-proyecto
```

Validar config:
```powershell
node scripts/validate-template-config.mjs --config .\mi-proyecto.config.json
```

Crear proyecto real (DB en .agent/ del destino):
```powershell
node scripts/ai-framework-agent.mjs create-project \
  --stack quarkus-angular \
  --config .\mi-proyecto.config.json \
  --dest C:\template\caso-real\mi-proyecto \
  --db C:\template\caso-real\mi-proyecto\.agent\ai-framework.db
```

Crear sin smoke checks ni git inicial, util durante discovery:
```powershell
node scripts/ai-framework-agent.mjs create-project \
  --stack quarkus-angular \
  --config .\mi-proyecto.config.json \
  --dest C:\template\caso-real\mi-proyecto \
  --skip-smoke --no-git \
  --db C:\template\caso-real\mi-proyecto\.agent\ai-framework.db
```

`scripts/new-service.mjs` sigue siendo el generador tecnico. `scripts/ai-framework-agent.mjs` es el punto de entrada del agente interno: lee/indexa documentacion, enruta, valida y llama al generador.

Validar el proyecto generado:
```powershell
node ci/scripts/check-docs.mjs C:\template\caso-real\mi-proyecto
node ci/scripts/check-template-instantiation.mjs --mode instantiated --root C:\template\caso-real\mi-proyecto
node ci/scripts/check-markdown-paths.mjs C:\template\caso-real\mi-proyecto
```

## Pedido sugerido al agente

```md
Actua como Enterprise AI Framework Agent.

Lee primero en este orden (del template, no del proyecto destino):
- C:\template\project-template\AGENTS.md
- C:\template\project-template\ai\runbooks\crear-proyecto-real-con-agente.md
- C:\template\project-template\ai\agents\enterprise-ai-framework-agent.md
- C:\template\project-template\template.config.example.json

Fuente de negocio (archivo bruto): {{RUTA_FUENTE_BRUTA}}
Ruta destino del proyecto real: {{RUTA_DESTINO}}
Stack objetivo: {{STACK}}
Ruta donde guardar el config generado: {{RUTA_CONFIG}}

--- FASE A - Extraccion y plan (NO ejecutes nada todavia)
Lee el archivo bruto y extrae:
1. Nombre del proyecto y dominio de negocio.
2. Problema a resolver y objetivo principal.
3. Actores y usuarios del sistema.
4. Requerimientos funcionales visibles (RF-01, RF-02...).
5. Requerimientos no funcionales (seguridad, performance, compliance, disponibilidad).
6. Restricciones tecnicas conocidas.
7. Restricciones de negocio.
8. Supuestos donde la fuente es ambigua.
9. Preguntas abiertas criticas.

Con esa informacion:
- Genera el config.json basado en template.config.example.json.
- Declara el stack elegido y justifica por que.
- Muestra el plan de archivos que vas a generar en fases 0-8.

Devuelve todo esto y ESPERA confirmacion antes de continuar.

--- FASE B - Creacion y documentacion (solo despues de confirmacion)
1. Guarda el config.json en: {{RUTA_CONFIG}}
2. Ejecuta create-project con --db {{RUTA_DESTINO}}/.agent/ai-framework.db
3. Completa los artefactos por fase (una fase por vez, mostrar salida antes de avanzar).
4. Copia todos los archivos operativos de ai/commands/ (no solo README).
5. Copia las skills relevantes al tipo de proyecto.
6. Copia los docs transversales requeridos.
7. Para features visuales, prepara `prototype.md`, `prototype-validation.md` y, si se necesita velocidad, `prototype-html5/` como PENDIENTE de validacion. El prototipo debe cubrir flujo extremo a extremo, estados, validaciones, roles/permisos, datos mock, navegacion y feedback UX.
8. Crea estructura raiz tests/ (unit/, integration/, e2e/).
9. Declara el estado de gates en tabla explicita, incluyendo `gate-prototype-ready`.
10. Genera ai/provider-orientation-pack.md.
11. Ejecuta checklist de limpieza de dominio.
12. Marca como SUPUESTO todo lo no confirmado en la fuente bruta.
13. Marca como PENDIENTE todo lo que requiere validacion humana.

--- FASE C - Validacion y entrega
1. Ejecuta check-docs.mjs y check-template-instantiation.mjs.
2. Declara estado de gates.
3. Reporta: comandos ejecutados, archivos creados, gates revisados, red flags, siguiente paso.
```

## Red flags
- Se usa `arranque-desde-fuente-bruta.md` para crear repo completo sin datos minimos.
- Se usa `crear-proyecto-real-desde-template.md` para hacer discovery profundo de negocio.
- Se usa este runbook sin decidir primero modo de trabajo.
- La ruta destino ya existe y podria sobrescribirse.
- La config conserva valores de ejemplo.
- El stack se elige sin justificar escenario ni restricciones.
- Se crea el proyecto sin completar fase 0 y fase 1.
- El proyecto generado conserva referencias canonicas que no aplican al dominio real.
- Se omiten validaciones por falta de herramientas sin dejar evidencia.
- Los permisos de dominio usan nombres genericos RESOURCE_* en vez del prefijo real.
- Feature visual sin `gate-spdd-approved` declarado o aplicado.
- Feature visual sin `gate-prototype-ready` declarado antes de pedir validacion SPDD.
- Prototipo sin flujo extremo a extremo, estados, validaciones, roles/permisos, datos mock, navegacion o feedback UX.
- Prototipo HTML5 tratado como frontend productivo.
- Prompt Penpot tratado como prototipo aprobado.
- `prototype-validation.md` tiene observaciones sin resolver y sin decision trazable (DEC-*).
- `traceability.md` no cubre RF -> pantalla -> componente -> endpoint -> prueba.
- `ai/commands/` del proyecto real tiene solo README, sin archivos operativos individuales.
- `ai/skills/` no tiene skills tecnicas (backend, security, frontend) para el tipo de proyecto.
- La DB del agente esta en la raiz o en el template, no en `.agent/` del proyecto real.
- No existe el archivo ai/provider-orientation-pack.md en el proyecto real.
- Specs contienen carpetas de dominio anterior (expedientes, bandeja, etc.).
- Gate-spdd-approved aparece como aprobado sin prototipo HTML5/Penpot validado.

## Evidencia minima
- config validada,
- memoria local inicializada e indexada (DB en .agent/),
- comando de creacion ejecutado,
- ruta destino creada,
- `check-docs.mjs` ejecutado sin hallazgos,
- `check-template-instantiation.mjs` ejecutado,
- artefactos fases 0-8 creados o bloqueantes declarados con razon,
- `gate-0-1` revisado,
- `gate-ux-ready`, `gate-prototype-ready` y `gate-spdd-approved` declarados como pendientes documentados,
- prototipo visual, si existe, evaluado contra criterio minimo UX,
- permisos de dominio con prefijo del proyecto real,
- `traceability.md` cubre RF -> pantalla -> componente -> endpoint -> prueba,
- `ai/commands/` contiene archivos operativos individuales,
- `ai/skills/` contiene skills tecnicas requeridas,
- checklist de limpieza de dominio completado,
- archivo ai/provider-orientation-pack.md generado con gates declarados.
