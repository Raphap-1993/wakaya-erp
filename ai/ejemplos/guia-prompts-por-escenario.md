# Guia de prompts por escenario

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ejemplos](README.md)

Prompts listos para usar segun el escenario de trabajo. Cada uno referencia los artefactos reales del framework.

---

## Escenario 0 - Arranque desde archivo bruto (escenario principal)

Tienes un archivo plano con toda la informacion en bruto. La IA lo lee, genera la config,
crea el proyecto, documenta fases 0-8 y prepara el pack de orientacion para proveedores IA.

```
Actua como Enterprise AI Framework Agent.

Lee primero en este orden:
- AGENTS.md
- ai/runbooks/crear-proyecto-real-con-agente.md
- ai/agents/enterprise-ai-framework-agent.md
- template.config.example.json

Fuente de negocio: {{RUTA_AL_ARCHIVO_BRUTO}}
Ruta destino:      {{RUTA_DESTINO}}
Stack:             {{quarkus-angular | node-next | java-monolith | spring-react | infiere}}
Config destino:    {{RUTA_CONFIG_JSON}}

Ejecuta en tres fases. Espera mi confirmacion entre cada una.

FASE A - Lee el archivo bruto. Extrae: nombre, problema, actores, RF, RNF, restricciones,
supuestos y preguntas abiertas. Genera el config.json. Muestra el plan de archivos
por fase. NO ejecutes nada hasta mi confirmacion.

FASE B - Con mi confirmacion: guarda el config, ejecuta create-project, completa
documentacion fases 0-8 fase por fase mostrando la salida antes de avanzar.
Usa prefijo real del proyecto en permisos (no RESOURCE_*). Marca supuestos y pendientes.

FASE C - Ejecuta check-docs. Declara estado de gates, incluyendo gate-prototype-ready
y gate-spdd-approved como pendientes si no hay prototipo validado. Genera el pack de orientacion
para proveedores IA: proyecto, ruta, fase actual, proximo task packet, supuestos criticos
y preguntas abiertas bloqueantes.
```

Prompt completo con todas las instrucciones: [ai/prompts/arranque-desde-fuente-bruta.md](../prompts/arranque-desde-fuente-bruta.md)

---

## Escenario 1 - Crear proyecto real desde template

El humano ejecuta el script y le pide a la IA que complete la documentacion inicial.

```
Actua como Enterprise AI Framework Agent.

Lee primero en este orden:
- AGENTS.md
- ai/runbooks/crear-proyecto-real-con-agente.md
- ai/agents/enterprise-ai-framework-agent.md
- ai/prompts/crear-proyecto-real-desde-template.md

Objetivo: crear un proyecto real en otra ruta usando esta plantilla como framework base.

Entradas:
- Ruta template: C:\template\project-template
- Ruta destino: {{RUTA_DESTINO}}
- Stack: {{quarkus-angular | node-next | java-monolith | spring-react}}
- Config: {{RUTA_CONFIG_JSON}}
- Fuente de negocio: {{RUTA_O_TEXTO_FUENTE}}
- Smoke checks: {{si | no}}
- Git inicial: {{si | no}}

Flujo esperado:
1. Lee la documentacion minima del runbook.
2. Valida la config.
3. Ejecuta: node scripts/ai-framework-agent.mjs create-project --stack {{stack}} --config {{config}} --dest {{destino}} --skip-smoke --no-git
4. Completa artefactos iniciales para fases 0-8 dentro de la ruta destino.
5. Ejecuta check-docs y check-markdown-paths sobre la ruta destino.
6. Declara gates gate-0-1, gate-ux-ready, gate-prototype-ready y gate-spdd-approved como pendientes documentados.

Devuelve: comandos ejecutados, archivos creados, gates revisados, red flags y siguiente paso.
```

---

## Escenario 2 - Idea a documentacion inicial (archivo fuente)

El proyecto ya existe. Se tiene un archivo con la idea, brief, acta o backlog inicial.

```
Actua como Enterprise AI Framework Agent.

Lee primero:
- AGENTS.md
- docs/README.md
- ai/prompts/orquestar-framework-enterprise-ai-first.md
- ai/prompts/transformar-idea-a-documentacion-inicial.md

Fuente de negocio: {{RUTA_AL_ARCHIVO_FUENTE}}

Objetivo: transformar esta fuente en documentacion inicial completa para fases 0 a 3.

Reglas:
- Declara fase, command y ruta destino antes de producir cada artefacto.
- Dime que vas a producir en cada fase antes de empezar.
- No avances a la siguiente fase sin mostrarme la salida y recibir confirmacion.
- Separa hechos, supuestos y preguntas abiertas.
- Toda salida debe quedar en ruta canonica del proyecto.

Formato de salida por fase:
1. Intencion interpretada
2. Fase y command seleccionado
3. Archivos destino
4. Contenido propuesto
5. Supuestos
6. Preguntas abiertas
7. Gate aplicado
8. Siguiente paso

Empieza por Fase 0.
```

---

## Escenario 2b - Idea a documentacion inicial (texto directo)

No hay archivo. El humano pega la idea como texto.

```
Actua como Enterprise AI Framework Agent.

Lee primero:
- AGENTS.md
- docs/README.md

Idea del proyecto:
---
{{PEGAR_AQUI_LA_IDEA_O_BRIEF}}
---

Objetivo: a partir de esta idea, genera documentacion inicial para fases 0 a 3.

Reglas:
- Declara fase, command y ruta destino antes de cada artefacto.
- Dime que vas a producir antes de empezar.
- No avances de fase sin mi confirmacion.
- Marca lo que es supuesto vs decision confirmada.
- No escribas codigo ni decisiones tecnologicas cerradas sin marcarlas como propuesta.

Empieza por Fase 0. Genera borradores para:
- docs/fase-0-iniciacion/00.01-vision-proyecto.md
- docs/fase-0-iniciacion/00.02-roadmap.md
- docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md
```

---

## Escenario 3 - Orientacion inicial del proveedor IA

Prompt de arranque para cualquier proveedor IA nuevo que va a trabajar en el proyecto.

```
Lee en este orden antes de hacer cualquier cosa:

1. AGENTS.md
2. ai/README.md
3. docs/transversal/90.33-flujo-delivery-ia-proveedores.md
4. docs/README.md

Una vez leido, confirma:
- que entendiste las reglas de trazabilidad,
- que entendiste el contrato de evidencia (que debes poder responder antes de ejecutar una feature),
- en que fase esta el proyecto actualmente,
- cual es el proximo task packet a ejecutar.

No avances ni generes nada hasta recibir confirmacion.
```

---

## Escenario 4 - Ejecutar fase especifica (task packet)

Para cada fase del proyecto. Sustituye X por la fase correspondiente.

```
Lee ai/tasks/fase-{{X}}-{{nombre}}.task.md y ejecuta las instrucciones.

Contexto adicional: {{lo que cambio o decidiste desde la ultima sesion}}.

Dime que vas a producir antes de empezar.
No generes archivos sin declarar ruta destino y gate aplicable.
```

Ejemplos concretos:

```
Lee ai/tasks/fase-1-requerimientos.task.md y ejecuta las instrucciones.
```

```
Lee ai/tasks/fase-2-ux.task.md y ejecuta las instrucciones.
La feature es visual. Empieza por Product Design antes de SPDD.
Dime que vas a producir antes de empezar.
```

```
Lee ai/tasks/fase-3-arquitectura.task.md y ejecuta las instrucciones.
Restriccion adicional: base de datos PostgreSQL con esquemas separados por tenant.
```

```
Lee ai/tasks/fase-4-sdd.task.md y ejecuta las instrucciones.
gate-prototype-ready esta listo y gate-spdd-approved esta aprobado con validacion humana registrada en prototype-validation.md.
```

```
Lee ai/tasks/fase-5-construccion.task.md y ejecuta las instrucciones.
Trabaja en una rama aislada. Ejecuta una tarea por vez desde spec-tareas.md.
```

---

## Escenario 5 - Feature completa (idea a codigo)

Cuando llega una nueva feature y hay que recorrer el ciclo completo.

```
Actua como Enterprise AI Framework Agent.

Lee primero:
- AGENTS.md
- docs/transversal/90.33-flujo-delivery-ia-proveedores.md
- docs/transversal/90.34-product-design-y-spdd-frontend.md

Nueva feature: {{DESCRIPCION_DE_LA_FEATURE}}

Aplica el flujo completo de delivery:
1. /ux -> Product Design -> specs/<feature>/product-design.md -> gate-ux-ready
2. /ux -> SPDD inicial si es feature visual -> specs/<feature>/spdd-frontend.md
3. /prototype -> prototipo HTML5/Penpot -> gate-prototype-ready -> validacion humana -> gate-spdd-approved
4. brainstorming -> dos alternativas si hay ambiguedad
5. /spec -> spec-funcional.md, spec-tecnica.md, api-contract.md, spec-tareas.md, traceability.md
6. writing-plans -> tareas pequenas con rutas, TDD, comandos y evidencia
7. worktree o rama aislada
8. executing-plans -> una tarea por vez
9. TDD -> red, green, refactor
10. /review antes de QA si cambia contrato, seguridad o UX critica
11. /test -> gate-4-6
12. /ship -> gate-7-8

Reglas:
- No iniciar /spec sin gate-spdd-approved si la feature es visual.
- No iniciar /build sin spec-funcional.md, spec-tecnica.md y spec-tareas.md.
- Declara archivos a modificar antes de cada tarea.
- Dime que vas a producir en cada etapa antes de empezar.

Empieza por el paso 1.
```

---

## Escenario 6 - Operacion especifica (commands)

Para trabajo puntual cuando la IA ya conoce el proyecto.

### /ux - Product Design

```
/ux - ejecuta Product Design para la feature {{NOMBRE_FEATURE}}.
Lee docs/fase-2-ux-ui/02.11-checklist-product-design.md como criterio de salida.
Fuente: {{RF_O_HU_O_DESCRIPCION}}
Salida esperada: specs/{{feature}}/product-design.md
Dime que vas a escribir antes de empezar.
```

### /ux - SPDD

```
/ux - ejecuta SPDD para la feature {{NOMBRE_FEATURE}}.
Product Design aprobado en specs/{{feature}}/product-design.md.
Lee docs/fase-2-ux-ui/02.12-checklist-spdd.md como criterio de salida.
Salidas esperadas: spdd-frontend.md, prototype.md, prototype-validation.md, ui-test-cases.md
Dime que vas a escribir antes de empezar.
```

### /prototype - Prototipo UX

```
/prototype - genera o actualiza el prototipo para la feature {{NOMBRE_FEATURE}}.
Modo recomendado: html5 para validacion rapida, penpot para formalizacion visual.
Lee specs/{{feature}}/spdd-frontend.md y ai/quality-gates/gate-prototype-ready.md.
Salidas esperadas: prototype.md, prototype-validation.md y prototype-html5/index.html o link/export Penpot.
No marques gate-spdd-approved sin validacion humana registrada.
```

### /spec - SDD

```
/spec - convierte la feature {{NOMBRE_FEATURE}} en specs tecnicas y tareas.
gate-prototype-ready listo y gate-spdd-approved aprobado con validacion humana. Lee specs/{{feature}}/prototype-validation.md.
Salidas: spec-funcional.md, spec-tecnica.md, api-contract.md, spec-tareas.md, traceability.md
No cierres /spec sin declarar gate-4-6 como pendiente o aprobado.
```

### /build - Construccion

```
/build - ejecuta la tarea {{T-XXX}} de specs/{{feature}}/spec-tareas.md.
Declara los archivos que vas a modificar antes de empezar.
Aplica TDD: escribe primero la prueba red, luego implementa green, luego refactoriza.
Ejecuta el comando de verificacion de la tarea y muestra la salida.
```

### /review - Revision de codigo

```
/review - revisa el codigo del {{componente o endpoint}} antes de pasar a QA.
Verifica gate-4-6 y principios SOLID (lee docs/transversal/90.30-principios-solid-diseno-modular.md).
Reporta: hallazgos priorizados, riesgos residuales o aprobacion con condiciones.
```

### /test - QA

```
/test - ejecuta el plan de QA para la feature {{NOMBRE_FEATURE}}.
Lee qa/fase-6-qa/plan-pruebas.md.
Produce: evidencia de pruebas ejecutadas, defectos encontrados y resultado de gate-4-6.
```

### /ship - Release

```
/ship - prepara el release de {{NOMBRE_FEATURE}} para produccion.
Lee ops/fase-7-deploy/runbook.md y ops/fase-7-deploy/rollback.md.
Verifica gate-7-8: evidencia QA enlazada, rollback definido, monitoreo activo.
Reporta bloqueantes antes de proponer merge.
```

---

## Regla general para todos los escenarios

Si la IA no declara **fase + command + ruta destino** antes de escribir, interrumpe con:

```
Para. Declara: fase, command, archivo destino y que vas a escribir. Luego continua.
```

Si la IA avanza sin mostrar plan:

```
Para. Muestra el plan completo de lo que vas a producir. Espera mi confirmacion.
```

Si la IA genera codigo sin spec:

```
Para. No hay spec aprobada para esto. Vuelve a /spec y genera spec-tareas.md primero.
```

---

## Referencias
- [AGENTS.md](../../AGENTS.md)
- [ai/README.md](../README.md)
- [90.33 Flujo delivery IA proveedores](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md)
- [90.34 Product Design y SPDD Frontend](../../docs/transversal/90.34-product-design-y-spdd-frontend.md)
- [enterprise-ai-framework-agent.md](../agents/enterprise-ai-framework-agent.md)
- [orquestar-framework-enterprise-ai-first.md](../prompts/orquestar-framework-enterprise-ai-first.md)
- [transformar-idea-a-documentacion-inicial.md](../prompts/transformar-idea-a-documentacion-inicial.md)
- [crear-proyecto-real-desde-template.md](../prompts/crear-proyecto-real-desde-template.md)
- [crear-proyecto-real-con-agente.md](../runbooks/crear-proyecto-real-con-agente.md)
