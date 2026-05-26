# Prompt Crear Proyecto Real Desde Template

## Objetivo
Instanciar tecnicamente esta plantilla como un proyecto real en una ruta externa, usando datos minimos ya definidos y manteniendo limpia la documentacion, la capa IA y la trazabilidad inicial.

Este prompt es de **bootstrap desde template**. No es el flujo principal para discovery profundo desde fuente bruta; si la informacion todavia esta desordenada, usa primero [arranque-desde-fuente-bruta.md](arranque-desde-fuente-bruta.md).

## Usalo cuando
- ya existe nombre del proyecto, dominio, stack objetivo y ruta destino,
- hay config o datos suficientes para generar `template.config.json`,
- se quiere crear/adaptar estructura real desde `C:\template\project-template`,
- se necesita limpiar residuos del caso canonico y copiar la capa IA operativa.

## No lo uses cuando
- solo tienes notas crudas sin dominio claro,
- quieres que la IA haga entrevista o discovery antes de decidir el proyecto,
- el destino sera el mismo repositorio del template,
- no hay autorizacion para crear archivos en la ruta destino,
- la solicitud es construir codigo de negocio.

## Relacion con otros flujos
```text
Datos minimos claros
  -> crear-proyecto-real-desde-template.md
  -> proyecto real instanciado + docs iniciales + capa IA + gates pendientes
```

Si hay fuente bruta, usar primero [arranque-desde-fuente-bruta.md](arranque-desde-fuente-bruta.md).

Si el usuario quiere guia paso a paso, usar [ai/runbooks/crear-proyecto-real-con-agente.md](../runbooks/crear-proyecto-real-con-agente.md).

## Entradas minimas
- ruta del template,
- ruta destino,
- nombre y dominio del proyecto,
- stack elegido o criterios para elegirlo,
- archivo de configuracion o datos para generarlo,
- modo de ejecucion: con smoke checks, sin smoke checks, con git o sin git,
- fuente de negocio ya resumida o documentos iniciales.

## Salida esperada
- plan de instanciacion,
- config validada o bloqueantes,
- comando de creacion del proyecto,
- proyecto real creado en ruta externa,
- README.md y AGENTS.md adaptados al dominio real,
- docs iniciales fases 0-8,
- `specs/` con features reales, no ejemplos canonicos copiados,
- contratos iniciales si aplican,
- capa IA completa,
- checklist de limpieza de dominio completado,
- gates declarados con estado real,
- provider orientation pack en la ruta del proyecto real,
- validaciones ejecutadas.

## Rutas destino esperadas
- `docs/`
- `specs/`
- `contracts/`
- `ai/`
- `qa/`
- `ops/`
- `ci/`
- `src/`
- `tests/`
- `.agent/`

## Verificacion minima
- No crear en una ruta destino existente sin confirmacion.
- Validar config antes de crear el proyecto.
- La DB del agente debe estar en `<ruta-destino>/.agent/ai-framework.db`, nunca en la raiz.
- Ejecutar `check-docs` y `check-template-instantiation` sobre la ruta destino.
- Si se omiten smoke checks, declarar la razon.
- Completar checklist de limpieza de dominio antes de declarar instanciacion lista.
- Gate 0-1, gate-ux-ready, gate-prototype-ready y gate-spdd-approved deben declararse explicitamente como PENDIENTE, salvo validacion humana trazable.
- Generar provider orientation pack con estado real de gates en la ruta del proyecto real.

## Reglas criticas de instanciacion

### Dominio
- Las features en `specs/` deben corresponder exclusivamente al dominio del proyecto real.
- No copiar carpetas del caso canonico del template a proyectos reales.
- Permisos con prefijo del proyecto real, no genericos `RESOURCE_*`.
- Marcar con `SUPUESTO:` todo lo no confirmado.
- Marcar con `PENDIENTE:` todo lo que requiere validacion humana.

### UX, SPDD y prototipos
- Para features visuales, crear `product-design.md`, `spdd-frontend.md`, `prototype.md`, `prototype-validation.md` y `ui-test-cases.md`.
- Si se necesita validacion rapida, crear `prototype-html5/index.html`, `flujo.md` y `decisiones-ux.md`.
- El prototipo HTML5 debe cubrir criterio minimo UX: flujo extremo a extremo, estados, validaciones, roles/permisos, datos mock, navegacion y feedback.
- `prototype.md` no equivale a prototipo aprobado.
- Prompt Penpot no equivale a prototipo aprobado.
- `gate-spdd-approved` solo puede aprobarse con validacion humana trazable.

### Capa IA - commands
Copiar todos los archivos operativos, no solo README:
```text
ai/commands/build-command.md
ai/commands/document-command.md
ai/commands/plan-command.md
ai/commands/prototype-command.md
ai/commands/review-command.md
ai/commands/ship-command.md
ai/commands/spec-command.md
ai/commands/test-command.md
ai/commands/ux-command.md
ai/commands/README.md
```

### Capa IA - skills minimas
```text
documentation-orchestration.skill.md
framework-governance.skill.md
requirements-quality.skill.md
debugging-workflow.skill.md
spec-driven-product-design.skill.md
spec-prototype-driven-frontend.skill.md
html5-prototyping.skill.md
penpot-ai-prototyping.skill.md
test-driven-development.skill.md
```

Para proyectos con auth, frontend critico o APIs:
```text
frontend.skill.md
backend.skill.md
security-hardening.skill.md
browser-testing.skill.md
source-driven-development.skill.md
api-interface-design.skill.md si existe
```

Para proyectos con streaming, performance o CDN:
```text
performance-optimization.skill.md
architecture.skill.md
```

### Capa IA - agents, gates, prompts y references
- `ai/agents/` debe incluir los agentes relevantes al stack y dominio.
- `ai/quality-gates/` debe incluir gates de fases, UX/SPDD, prototipo, SDD, QA y release.
- `ai/prompts/` debe incluir prompts relevantes, especialmente HTML5/Penpot si hay UI.
- `ai/references/` debe incluir references de delivery, Product Design, SPDD, trazabilidad, memoria local, seguridad y QA.

### Docs transversal minimos
```text
90.10-entregables-minimos-por-fase.md
90.11-checklist-entregables.md
90.12-mapa-ia-por-fase.md
90.13-modos-de-trabajo.md
90.30-principios-solid-diseno-modular.md
90.33-flujo-delivery-ia-proveedores.md
90.34-product-design-y-spdd-frontend.md
```

Para proyectos con menores, auth o compliance:
```text
90.25-threat-modeling.md
90.26-contract-governance.md
90.29-integracion-selectiva-agent-skills.md
```

### DB del agente
- Siempre en `<ruta-destino>/.agent/ai-framework.db`.
- Agregar `.agent/` al `.gitignore` del proyecto real.
- Nunca dejar la DB en la raiz del template ni del proyecto.
- No incluir DB local en entregables ZIP.

## Pedido base
```md
Actua como Enterprise AI Framework Agent en modo bootstrap desde template.

LECTURA OBLIGATORIA (en orden, del template NO del destino):
1. C:\template\project-template\AGENTS.md
2. C:\template\project-template\ai\runbooks\crear-proyecto-real-con-agente.md
3. C:\template\project-template\ai\agents\enterprise-ai-framework-agent.md
4. C:\template\project-template\template.config.example.json
5. C:\template\project-template\docs\transversal\90.13-modos-de-trabajo.md

Reglas:
- La ruta destino debe ser distinta a la ruta del template.
- No sobrescribas una ruta destino existente sin confirmacion explicita.
- Usa scripts/ai-framework-agent.mjs con --db {{RUTA_DESTINO}}/.agent/ai-framework.db
- Copia todos los command files operativos.
- Copia skills, agents, quality-gates, prompts y references relevantes.
- Declara gates en tabla explicita: PENDIENTE / APROBADO / NO APLICA.
- Genera ai/provider-orientation-pack.md antes de cerrar.
- Completa checklist de limpieza de dominio.
- No iniciar construccion productiva hasta gate-spdd-approved aprobado.

Entradas:
- Ruta template: {{RUTA_TEMPLATE}}
- Ruta destino: {{RUTA_DESTINO}}
- Nombre proyecto: {{NOMBRE_PROYECTO}}
- Dominio: {{DOMINIO}}
- Stack: {{STACK}}
- Config: {{RUTA_CONFIG}}
- Fuente de negocio resumida o docs iniciales: {{FUENTE_NEGOCIO_RESUMIDA}}
- Smoke checks: {{SI_NO}}
- Git inicial: {{SI_NO}}

Formato de salida:
1. Documentacion leida.
2. Datos del proyecto real.
3. Supuestos y bloqueantes.
4. Stack y justificacion.
5. Config requerida.
6. Comandos a ejecutar.
7. Plan de archivos por fase.
8. Capa IA a copiar.
9. Gates declarados.
10. Checklist de limpieza de dominio.
11. Siguiente paso recomendado.
```

## Red flags especificos de instanciacion
- `ai/commands/` del proyecto real tiene solo README.
- `ai/skills/` no incluye skills tecnicas para el dominio.
- `ai/quality-gates/` no incluye `gate-prototype-ready` o `gate-spdd-approved`.
- `docs/transversal/` no incluye 90.25 o 90.26 para proyectos con menores o compliance.
- Specs del proyecto real contienen carpetas de dominio anterior.
- La DB del agente esta en la raiz, no en `.agent/`.
- Gates aparecen aprobados sin validacion humana.
- No se genero provider orientation pack en la ruta del proyecto real.
- `traceability.md` no cubre RF a pantalla a componente a endpoint a prueba.
- `prototype-validation.md` tiene observaciones sin resolver.
- Construccion iniciada sin gate-spdd-approved aprobado.

## Referencias
- [ai/runbooks/crear-proyecto-real-con-agente.md](../runbooks/crear-proyecto-real-con-agente.md)
- [arranque-desde-fuente-bruta.md](arranque-desde-fuente-bruta.md)
- [docs/transversal/90.13-modos-de-trabajo.md](../../docs/transversal/90.13-modos-de-trabajo.md)
- [docs/transversal/90.33-flujo-delivery-ia-proveedores.md](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)
- [template.config.example.json](../../template.config.example.json)
