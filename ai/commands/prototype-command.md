# Command `/prototype`

## Objetivo
Crear o actualizar el prototipo de una feature visual desde Product Design y SPDD, usando HTML5 para velocidad o Penpot para formalizacion visual.

## Modos
```text
/prototype --mode html5
/prototype --mode penpot
```

## Fases donde aplica
- Fase 2 - UX/UI.
- SPDD.
- Antes de `/spec` para features visuales.

## Required inputs
- `specs/<feature>/product-design.md`
- `specs/<feature>/spdd-frontend.md`
- `specs/<feature>/ui-test-cases.md` si existe
- reglas de negocio visibles
- roles: admin, operador, auditor u otros del dominio si aplican
- permisos y estados UI esperados
- modo: `html5` o `penpot`

## CRITICO — Lectura obligatoria ANTES de escribir HTML

Para modo `html5`, leer en este orden antes de escribir una sola linea de HTML o CSS:

1. `docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md` — niveles 0 a 3, tabla de decision rapida y terminos prohibidos
2. `ai/quality-gates/gate-html5-product-quality.md` — criterios de bloqueo B1-B10
3. `ai/prompts/generar-prototipo-html5-ejecutable.md` — prompt de 6 pasos con checklist de salida y auto-rating obligatorio
4. `ejemplos/fase-2-ux-ui/prototype-html5-golden/README.md` — indice de goldens por dominio
5. `ejemplos/fase-2-ux-ui/prototype-html5-golden/<dominio-mas-cercano>/index.html` — leer integro como piso visual
6. `ejemplos/fase-2-ux-ui/prototype-html5-anti-ejemplo/README.md` — que NO entregar
7. `ci/scripts/check-html5-prototype-quality.mjs` — validador con grading nivel 0-3

**El prototipo HTML5 debe parecer un producto real navegable, no una maqueta documental.**
"No iniciar construccion productiva" NO significa "hacer algo pobre". El minimo exigido es nivel 2 de la rubrica.

## Hub del producto (`prototype/index.html`)
El hub del producto sigue una estructura estandarizada de 10 secciones definida
en `plantillas/transversal/PROTOTYPE_HUB.md`. Se regenera automaticamente:

```sh
node scripts/ai-framework-agent.mjs generate-prototype-hub
node ci/scripts/check-prototype-hub.mjs  # valida la estructura
```

> REGLA DE UBICACION (no negociable): `prototype/` es el **ÚNICO hub**
> (`prototype/index.html`) y **NO lleva subcarpetas por feature**. Cada prototipo
> de feature vive en `specs/<NNN-slug>/prototype-html5/index.html`. **Prohibido**
> `prototype/<feature>/index.html`. Crea cada prototipo SIEMPRE con
> `npm run scaffold:prototype -- --feature <NNN-slug> --domain <dominio>`.
> `check:prototype-location` lo verifica (bloquea en `pre-flight-gate` de proyecto real).

El comando lee:
- `specs/<feature>/` (todas las features con `decisiones-ux.md`).
- `specs/<feature>/traceability.md` (invariantes, estado SPDD).
- `template.config.example.json` (producto, stack).
- `ai_decisions` / `ai_gate_runs` de la BD de memoria.

NO escribas el hub a mano. Si necesitas agregar columnas adicionales a la tabla
de cobertura (ADRs, threat-model, etc.), pon esa tabla fuera de las marcas
`<!-- @auto:start name=coverage -->` para que el regenerador no la sobreescriba.

## Process
1. Validar que existen Product Design y SPDD.
2. Determinar alcance: una feature, un flujo transversal o producto completo.
3. Si el alcance es producto completo, proponer verticales funcionales y portafolio de prototipos antes de escribir HTML.
4. **Antes de escribir HTML — declarar el plan visual** en `specs/<feature>/prototype-html5/decisiones-ux.md`:
   - Dominio del spec
   - Actor principal
   - Tarea principal navegable de inicio a fin
   - Patron visual elegido (streaming / operativo / ecommerce / educacion / otro)
   - Por que NO se usa una shell generica sidenav+tabla
   - Interacciones del prototipo (minimo 3, expresadas como acciones reales del producto)
4.1. **v12.48 — COPIA el golden del dominio mas cercano como base** (no escribas desde cero):
   ```bash
   # Mapeo dominio -> golden (de ejemplos/fase-2-ux-ui/prototype-html5-golden/README.md):
   # Streaming / contenido / catalogo  -> streaming-catalogo-player
   # SaaS operativo / backoffice       -> saas-operativo-bandeja
   # Dashboard KPI / analytics         -> dashboard-analytics-kpi
   # E-commerce / checkout             -> ecommerce-checkout
   # Educacion / leccion + quiz        -> educacion-leccion
   # Mobile-first / banca movil        -> mobile-first-app
   # Wizard multi-step / cotizacion    -> formulario-complejo
   # Dashboard funnel / marketing      -> dashboard-analytics
   cp ejemplos/fase-2-ux-ui/prototype-html5-golden/<patron>/index.html \
      specs/<feature>/prototype-html5/index.html
   ```
   Adapta SOLO: `<title>`, `.brand`, mock data, roles. NUNCA toques: estructura, estados,
   tokens CSS, responsive, microinteracciones. Si las adaptaciones no caben en este
   patron, justifica en `decisiones-ux.md > Justificacion`.
4.2. **Tabla visual decisiones (v12.48)** — completar en `decisiones-ux.md`:

   | Campo | Nivel 2 (minimo) | Nivel 3 (recomendado) | Tu spec |
   |---|---|---|---|
   | Tokens CSS (`--xxx:`) | >=6 | >=12 | _ |
   | Media queries | >=1 | >=2 | _ |
   | Classes CSS unicas | >=20 | >=40 | _ |
   | Estados UI cubiertos | 3 (loading/empty/error) | 5 (+success+permission-denied) | _ |
   | Microinteracciones | 1 (hover) | 4+ (hover+focus+reveal+scale) | _ |
   | Lineas totales | >=250 | >=500 | _ |

5. Elegir modo:
   - `html5`: generar prototipo navegable con HTML5, CSS y JavaScript vanilla.
   - `penpot`: generar prompt Penpot o actualizar Penpot via MCP si existe conexion.
6. Crear o actualizar evidencia de prototipo.
7. Verificar criterio minimo UX: flujo extremo a extremo, estados, validaciones, roles, datos mock, navegacion y feedback.
8. **Autoevaluar con gate-html5-product-quality** — aplicar checklist B1-B10 antes de declarar "listo":
   - Si cualquier criterio B aplica → reportar bloqueante, NO declarar listo, regenerar.
   - Si pasa todos los B → continuar.
9. **Ejecutar el validador automatico (OBLIGATORIO)**:
   ```sh
   node ci/scripts/check-html5-prototype-quality.mjs --spec specs/<feature> --strict
   ```
   - Exit 1 → bloqueado. NO declarar listo. Regenerar atendiendo cada bloqueante reportado.
   - Exit 2 → aprobado con observaciones. Anotar en `prototype-validation.md`.
   - Exit 0 → aprobado.
10. **Reportar el bloque de auto-rating** definido en el Paso 5.1 del prompt ejecutable, con metricas reales medidas por el validador y nivel rubrica autoevaluado (0-3). Sin este bloque, el comando no se considera cerrado.
11. Actualizar `prototype.md` con herramienta, ruta/link, pantallas cubiertas, estados, roles y limitaciones.
12. Preparar `prototype-validation.md` para revision humana.
13. Aplicar `gate-prototype-ready` (solo si pasaron los pasos 8 y 9).
14. Solo despues de validacion humana, aplicar `gate-spdd-approved`.

## Estandar producto-real HTML5

Para modo `html5`, aplicar `docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md`.

Si el alcance es producto completo, el resultado esperado es un portafolio:
- hub rico en `prototype/index.html`,
- prototipos por vertical en `specs/<feature>/prototype-html5/index.html`,
- journeys por actor,
- matriz de cobertura,
- estado de gates,
- navegacion bidireccional.

Un prototipo debe rehacerse si:
- solo demuestra RF en tarjetas,
- parece dashboard generico para un dominio que exige otro patron,
- no tiene flujo extremo a extremo,
- no muestra estados/errores/permisos,
- usa cualquier termino prohibido como texto visible (RF-, gate-, "Contrato mock", "Actividad de ejemplo", "Recorrido simulado", "Permiso activo", "Angular futuro:").

## Checklist de autoevaluacion HTML5 (completar antes de reportar "listo")

```
[ ] El primer viewport comunica que producto es y cual es la accion principal
[ ] Hay una tarea principal navegable de inicio a fin
[ ] El patron visual corresponde al dominio (no es sidenav+tabla para dominio de consumo)
[ ] No aparece ningun termino prohibido como texto visible
[ ] Hay link discreto de vuelta al hub (icono o texto suave en el topbar, no banner)
[ ] Hay estado loading
[ ] Hay estado empty con recuperacion
[ ] Hay estado error con recuperacion
[ ] Hay estado success o confirmacion
[ ] Hay feedback UX (toast o modal)
[ ] Los datos mock son del dominio real
[ ] flujo.md y decisiones-ux.md existen
[ ] prototype.md registra ruta y cobertura
[ ] prototype-validation.md existe como PENDIENTE
[ ] prototype/index.html enlaza a esta spec
[ ] Esta spec enlaza de vuelta a prototype/index.html
[ ] El prototipo abre sin build ni backend
[ ] gate-html5-product-quality evaluado sin bloqueantes B1-B10
```

Si algun punto es NO: no reportar como completado. Corregir y reevaluar.

## Salidas modo HTML5
```text
specs/<feature>/prototype-html5/
  index.html
  flujo.md
  decisiones-ux.md
```

`index.html` debe ser autocontenido por defecto: HTML, CSS y JavaScript vanilla en un solo archivo. Archivos separados solo se permiten para flujos grandes y deben justificarse en `decisiones-ux.md`.

## Salidas modo Penpot
```text
ai/prompts/generated/crear-prototipo-penpot-<feature>.md
specs/<feature>/prototype.md
specs/<feature>/prototype-validation.md
```

## Regla del gate visual humano (v12.60) — OBLIGATORIA

> Si el usuario (humano) dice que el prototipo se ve **pobre, generico o que no parece
> producto real**, el agente DEBE tratarlo como **bloqueo de `gate-prototype-human-visual-review`**,
> NO como una preferencia estetica negociable.

- El validador automatico (`check-html5-prototype-quality`) mide conteos estaticos (lineas,
  tokens, vistas). **NO aprueba la UX visual por si solo.** Un agente puede pasar esos conteos
  con fixtures ocultos sin que el prototipo sea producto real.
- `check-prototype-visible-product` (v12.60) detecta esas trampas: `<template hidden>` con
  fixtures, `.validation-only`, `display:none` con records, estados solo-texto, renderer generico,
  y auto-aprobacion por IA.
- **Nunca** marques `gate-prototype-human-visual-review: approved`. Solo un humano real (no
  agente/IA) puede aprobarlo en `prototype-validation.md > ## Revision visual humana`, con
  Fecha y Evidencia revisada.
- Si declaraste "nivel 3" y el humano lo ve pobre: el humano gana. El gate queda `blocked`,
  y debes regenerar el prototipo copiando el Golden del dominio y adaptando el contenido real.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El validador dice nivel 3, ya esta aprobado | No. El validador mide conteos; la UX visual la aprueba un humano (gate-prototype-human-visual-review) |
| Puedo poner un fixture oculto para pasar metricas | No. check-prototype-visible-product lo bloquea. Es trampa contra el metodo |
| Yo (agente) puedo firmar la revision visual | No. Revisor debe ser humano real. Anti self-approval bloquea agente/IA/claude/etc. |
| El prompt ya es el prototipo | No. El prompt es insumo; el prototipo debe existir como ruta, link o export |
| HTML5 ya sirve como frontend | No. HTML5 valida flujo; Angular implementa producto real |
| No iniciar construccion productiva significa hacer algo minimo | No. Significa no implementar Angular/backend real. El prototipo HTML5 debe parecer producto real |
| El prototipo no necesita estados | Los estados son parte del comportamiento visible y bloquean el gate |
| Los roles son detalle tecnico | Los roles cambian acciones, mensajes y acceso; deben verse en UX |
| El progreso se implementa despues | En procesos asincronos, el progreso es parte central del flujo |
| Mejor hacerlo directo en Angular | Antes de UX validado, HTML5 gana por velocidad y evita sobreconstruccion |
| Cubri todos los RF con tabs/checklist | Cobertura en tabs es nivel 0. Debe haber flujo navegable de producto |
| Sidenav + tabla es lo mas rapido | Si el dominio es streaming/consumo, es bloqueante B9 |

## Red flags (cualquiera = rehacerlo)
- SPDD sin pantallas.
- Producto completo comprimido en un unico HTML monolitico.
- Hub que es solo lista de enlaces sin journey ni cobertura.
- Prototipo sin navegacion.
- Estados como tabs del sidebar en vez de comportamiento natural.
- Estados `empty`, `error` o `permission denied` ausentes.
- Terminos prohibidos visibles en pantalla.
- Sidenav + tabla para dominio de consumo/streaming/educacion.
- Validaciones, roles o feedback UX ausentes cuando aplican.
- `prototype.md` no registra ruta o link.
- `gate-spdd-approved` marcado sin validacion humana.
- `gate-html5-product-quality` no evaluado antes de declarar listo.

## Verification evidence
- `gate-html5-product-quality` evaluado sin bloqueantes,
- prototipo creado o actualizado,
- ruta/link registrada,
- estados UI visibles como comportamiento natural,
- formularios, tablas, modal, toast o historial visibles cuando aplican,
- roles, permisos, validaciones, progreso y navegacion estructural visibles cuando aplican,
- datos mock declarados y del dominio real,
- terminos prohibidos ausentes en HTML visible,
- `prototype-validation.md` listo para revision,
- resultado de `gate-prototype-ready`.

## Artefactos relacionados
- `../skills/html5-prototyping.skill.md`
- `../skills/penpot-ai-prototyping.skill.md`
- `../skills/spec-prototype-driven-frontend.skill.md`
- `../quality-gates/gate-html5-product-quality.md`
- `../quality-gates/gate-prototype-ready.md`
- `../quality-gates/gate-spdd-approved.md`
- `../prompts/generar-prototipo-html5-ejecutable.md`
- `../../docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`
- `../../ejemplos/fase-2-ux-ui/prototype-html5-golden/`
