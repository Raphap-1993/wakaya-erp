# PROTOTYPE_HUB

> **Plantilla (no es el entregable).** Destino: `varios`. Consolida el entregable en la carpeta destino que indica el README de esta carpeta.

> Estandar de estructura para `prototype/index.html` — el hub navegable del
> producto que enlaza todos los prototipos HTML5 por feature.
>
> El hub se genera con el comando autogenerador:
> ```sh
> node scripts/ai-framework-agent.mjs generate-prototype-hub
> ```
> que lee `specs/`, los `decisiones-ux.md` y `traceability.md` de cada feature,
> mas la BD de memoria, y produce el HTML. La estructura es **fija**: 10
> secciones obligatorias u opcionales, con zonas auto-regeneradas marcadas
> con `<!-- @auto:start name=X -->` ... `<!-- @auto:end -->`.

## Por que estandarizar

Antes, cada agente IA escribia el hub diferente: distinta cantidad de
secciones, distinto orden, distinta densidad de informacion. Resultado: dos
proyectos comparables tenian hubs incomparables. La estandarizacion garantiza:

- Mismo orden de secciones en todos los proyectos.
- Misma densidad de informacion (no "casi vacio" en uno y "saturado" en otro).
- Zonas auto-generadas se sincronizan con specs/ y la BD de memoria.
- Validador automatico (`ci/scripts/check-prototype-hub.mjs`) bloquea hubs incompletos.

## Las 10 secciones

### 0. `<head>` y tokens de diseno (obligatorio)
- `<title>`: `<Producto> — Hub de Prototipos`.
- `:root` con tokens compartidos con los goldens nivel 3: `--brand`, `--neutral-50` a `--neutral-900`, `--font`, `--radius`, `--shadow-sm/md/lg`, `--transition`.
- Responsive: minimo 2 media queries (mobile + desktop).

### 1. Banner superior (obligatorio, sticky o destacado)
Cuatro tags inline-flex con info critica visible siempre:
- `◆ SPDD HUB` — clase `spdd` (acento).
- `<Producto> · N specs · N prototipos` — clase `info` (neutro).
- `⏳ PENDIENTE VALIDACION HUMANA` o `✓ VALIDADO` — clase `warn` o `ok`.
- `<YYYY-MM-DD>` — clase `date` (mono).

Regla v12.20: **este es el unico banner de "simulacion" permitido en el
ecosistema**. Los prototipos individuales NO llevan banner — solo un link
discreto `← Hub` en el topbar.

### 2. Hero (obligatorio)
- Eyebrow: `Spec-Prototype-Driven Development`.
- `<h1>`: nombre del producto.
- Subtitulo: `Hub de Prototipos — Navegacion End-to-End`.
- Descripcion: 1-2 lineas de que es el hub y para que sirve.
- **Grid de stats** con minimo 4 metricas:
  - Specs / features
  - Prototipos HTML5
  - Actores del sistema
  - Flujos cubiertos
  - Backend real (= `0` con disclaimer de mock)

### 3. Journey end-to-end por actor (obligatorio si hay >=2 actores)
Filas horizontales, una por actor:
```
[👨‍👩‍👧 PADRE]  →  [001 Registro]  →  [002 Catalogo]  →  [003 Control]  → ...
```
Cada nodo:
- Es un `<a target="_blank">` al prototipo correspondiente.
- Tiene el numero de spec + nombre corto.
- Color de fondo = color de la spec (consistente con la spec card).
- Si un actor no toca una spec, no aparece en su fila.

### 4. Prototipos por spec — Spec cards (obligatorio)
Grid de cards, una por spec. Estructura:

```
┌──────────────────────────────────┐
│ SPEC 003       ⏳ Pendiente       │ ← badge + status pill
│ Control Parental                 │ ← h3 titulo
│ Dashboard parental con 3 tabs…   │ ← p descripcion
│                                   │
│ Invariantes:                      │
│  🔒 PIN nunca client (RN-05)     │
│  🔴 Bloqueo 15min (SEC-05)       │
│  ⚡ Reporte sin nombres           │
│                                   │
│ [👨‍👩‍👧] [👧]          [Abrir →] │
└──────────────────────────────────┘
```
- `--card-clr`: variable CSS unica por spec, usada en journey + tabla.
- Status pill: `validado` (verde) · `pendiente` (ambar) · `bloqueado` (rojo) · `en-revision` (azul).
- Invariantes (max 4) con iconos: 🔒 seguridad · 🔴 regla critica · ⚡ comportamiento · 📊 dato. Cada una referencia (RN-XX, SEC-XX, RF-XX) — pero el simbolo `RF-` solo aparece como texto entre `(...)`, nunca como titulo visible.
- Actor chips: subconjunto que usa la spec.
- "Abrir": link al prototipo HTML5 de esa spec.

### 5. Actores del sistema (obligatorio)
Grid de cards, una por actor:
- Emoji o avatar redondo (40-80px).
- Nombre del rol en MAYUSCULAS.
- Subrol o code role (`CRISTIANO_CONTENT_PUBLISH`, `Perfil NINO 0-12`...).
- Descripcion: 2-3 lineas — que hace, que shell ve, permisos clave.
- Tags de specs que toca, cada una con su color.

### 6. Matriz de cobertura SPDD (obligatorio, **hibrido**)

Zona `<!-- @auto:start name=coverage -->` regenerada por el comando:

| Spec | Feature | prototype | ui-test-cases | api-contract | spec-funcional | spec-tecnica | spec-tareas | traceability | Estado SPDD |
|---|---|---|---|---|---|---|---|---|---|
| 001 | … | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Validado |
| 002 | … | ✓ | ✓ | ⏳ | ✓ | ✓ | ⏳ | ✓ | Pendiente |

- Cada celda: `✓` (existe y completo) · `⏳` (existe pero pendiente) · `✗` (falta) · `—` (no aplica).
- Numero de spec es link al directorio `../specs/NNN-feature/`.
- Estado SPDD viene de `ai_gate_runs` (gate `gate-spdd-approved` o equivalente).
- **Hibrido**: la tabla principal es regenerada por el comando. El agente puede agregar columnas adicionales (ADRs, threat-model, etc.) en una **segunda tabla** dentro de la misma seccion, fuera de las marcas `@auto:start/end`.

### 7. Decisiones transversales (opcional pero recomendado)
Bullets de decisiones cross-cutting que afectan a varias specs. Origen: ADRs y `decisiones-ux.md`. Ejemplos:
- Tokens de diseno compartidos en goldens nivel 3.
- Anti-shell-generica: cada spec usa el patron de su dominio.
- Idioma del producto y politica de fechas.
- Politica de simulacion: hub conserva banner, prototipos no (v12.20).

### 8. Documentacion por spec — Quick links (obligatorio)
Lista vertical de atajos al directorio raiz de cada feature:
```
📁 001 — Autenticacion y Perfiles
📁 002 — Catalogo y Reproduccion
…
```
Cada link a `../specs/NNN-feature/` para que el agente abra el directorio completo (no solo el prototipo).

### 9. Footer con stack (obligatorio)
- Linea de cierre: `<Producto> · SPDD Hub vX.Y · <fecha>`.
- Disclaimer: `Sin backend real · Sin credenciales reales · Datos mock representativos del dominio.`.
- **Stack tags**: chips con las tecnologias clave del proyecto. Origen: `template.config.json` `stack` + detecciones (`stacks/<stack>/`).

## Integracion con el resto del framework

| Insumo | Aporta al hub |
|---|---|
| `specs/<feature>/decisiones-ux.md` | dominio, actor principal, patron visual de la spec card |
| `specs/<feature>/traceability.md` | invariantes (RN/SEC), estado SPDD por spec |
| `specs/<feature>/prototype-validation.md` | status pill (validado/pendiente) |
| `ai_trace_links` (BD) | matriz de cobertura — columnas de artefactos |
| `ai_gate_runs` (BD) | estado SPDD — ultima columna de la matriz |
| `template.config.json` | producto, dominio, stack tags |
| `ai_decisions` (BD) | seccion 7 (Decisiones transversales) |

## Comandos

```sh
# Generar el hub desde cero (lee specs/ + BD + config)
node scripts/ai-framework-agent.mjs generate-prototype-hub

# Validar la estructura del hub
node ci/scripts/check-prototype-hub.mjs

# Regenerar solo las zonas @auto (preserva zonas no-auto)
node scripts/ai-framework-agent.mjs generate-prototype-hub --auto-only
```

## Antipatrones que el validador bloquea

- Hub sin banner SPDD o sin hero.
- Hub con menos spec cards que features en `specs/`.
- Hub con `RF-XX:` u otros terminos prohibidos como texto visible.
- Hub que muestra los estados (loading/empty/error) — el hub es estatico, no tiene estados de carga.
- Hub que duplica el banner amarillo de "simulacion" dentro de cada prototipo enlazado.
- Tabla de cobertura sin columna de Estado SPDD o sin enlace a la spec.
- Footer sin disclaimer de "sin backend real".

## Cross-spec navigation via URL params (v12.52)

A partir de v12.52, el hub pasa contexto a cada prototipo via URL params canonicos
y los prototipos entre si pueden enlazar manteniendo el contexto. Esto convierte
el portafolio en una simulacion navegable end-to-end del producto.

### Params canonicos

| Param | Tipo | Ejemplo | Significado |
|---|---|---|---|
| `from` | string | `hub`, `spec-001` | Origen de navegacion |
| `role` | string | `operador`, `apoderado`, `docente` | Rol activo simulado |
| `id` | string | `EXP-2026-001`, `EST-2026-0042` | Recurso especifico (highlightea fila) |
| `demo-mode` | bool | `true` | Vino del hub (muestra link "← Hub") |
| `spec` | string | `001` | Spec origen del cross-link (banner de retorno) |

### Como el hub pasa contexto (auto v12.52+)

`generatePrototypeHub` en `scripts/ai-framework-agent.mjs` ahora emite hrefs como:

```html
<a href="../specs/001-bandeja/prototype-html5/index.html?from=hub&demo-mode=true&role=operador" target="_blank">Abrir →</a>
```

El parametro `role` proviene del actor del journey al que pertenece el card.

### Como un prototipo abre otro con contexto

```javascript
openPrototypeBySpec('002', { id: 'EXP-2026-001', role: 'supervisor' });
// URL: ../../../specs/002-*/prototype-html5/index.html?from=spec-001&role=supervisor&id=EXP-2026-001
```

### Atributos HTML que el helper reconoce

| Atributo | Donde poner | Efecto |
|---|---|---|
| `data-hub-link` | en el `<a>` que vuelve al hub | Se muestra si `demoMode=true` |
| `data-role-switch data-role="X"` | en `<button>`/`<select>` | Se activa cuando `?role=X` coincide |
| `data-resource-id="X"` | en `<tr>`/`<div>` de una fila | Se highlightea + scroll si `?id=X` coincide |

### Validador

```bash
npm run check:prototype-cross-links
```

Valida que todos los hrefs cross-spec apunten a features existentes, que
`openPrototypeBySpec('NNN')` no referencie specs inexistentes, y detecta loops
circulares evidentes (a → b → a en 1 paso).

Detalle completo: `ejemplos/fase-2-ux-ui/prototype-html5-golden/README.md > Cross-spec navigation`.

## Infraestructura compartida `specs/_shared/` (opt-in, v12.61)

Para portafolios multi-spec donde las features comparten marca, sistema de
diseño y sesion, existe el modo **portfolio-spa**. Es **opt-in**: el default
sigue siendo `standalone` (prototipo autocontenido con tokens inline).

```bash
npm run scaffold:prototype -- --feature 002-mi-feature --domain operativo --mode portfolio-spa
```

Inyecta en el `<head>` del prototipo:

```html
<link rel="stylesheet" href="../../_shared/tokens.css">
<script src="../../_shared/mock-api.js"></script>
<script src="../../_shared/app-state.js"></script>
<script src="../../_shared/ui.js"></script>
```

| Modulo | Expone | Rol |
|---|---|---|
| `tokens.css` | — | Sistema de diseño comun (paleta, tipografia, espaciado, breakpoints, primitivas `.u-*`). |
| `mock-api.js` | `MockApi` | Latencia + error simulado + CRUD en memoria. Sin datos de dominio. |
| `app-state.js` | `AppState` | Sesion en **localStorage** (sobrevive `target=_blank`), pub/sub cross-tab. |
| `ui.js` | `UI` | Toast, modal, skeleton/empty/error, formateadores. Sin layout de dominio. |

**Regla anti-trampa**: `_shared/` solo admite helpers de bajo nivel. Prohibido un
renderer generico unico (`mini-app`/`app-renderer`/`ui-factory`/`render-all`/
`app-shell`) — lo bloquea `check-prototype-visible-product.mjs`. Cada spec
construye su propia UI de dominio.

Los validadores lo entienden: `check-prototype-diversity` excluye `_shared/` del
hash de estructura (compartir infra no es clonar) y `check-html5-prototype-quality`
resuelve `<link>`/`@import` a `_shared/*.css` y cuenta sus tokens (mover el
sistema de diseño a `_shared/` no baja el nivel). Detalle: `specs/_shared/README.md`.

## Referencias

- `docs/fase-2-ux-ui/02.14-html5-first-prototyping.md` — flujo HTML5-first.
- `docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md` — estandar de prototipos individuales.
- `docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md` — rubrica nivel 0-3.
- `ai/commands/prototype-command.md` — comando `/prototype`.
- `ai/prompts/generar-prototipo-html5-ejecutable.md` — prompt ejecutable.
- `ci/scripts/check-prototype-hub.mjs` — validador del hub.
- `ci/scripts/check-prototype-cross-links.mjs` — validador cross-spec (v12.52).
- `plantillas/transversal/shared-prototype-helpers.js` — helper canonico (v12.52).
- `specs/_shared/README.md` — infraestructura compartida portfolio-spa (v12.61).
- `ejemplos/fase-2-ux-ui/prototype-html5-golden/` — goldens nivel 3 enlazados desde el hub.
