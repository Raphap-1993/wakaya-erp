# Changelog

Todos los cambios relevantes de esta plantilla se documentan aqui.

## v12.104.0
Corrige un mensaje **ambiguo** en `roadmap:status` (reportado): decía "✓ Avance fase 2 → 3 habilitado: todos los prototipos estan human-approved" aunque hubiera features visuales SIN prototipo (002/003) bloqueadas. La regla `phase2to3Ready` solo mira prototipos EXISTENTES aprobados, así que el texto sugería que TODO el proyecto avanzaba.

- **Mensaje preciso**: "✓ Avance fase 2 → 3 habilitado SOLO para N feature(s) con prototipo human-approved." + cuando hay features sin prototipo, lista los slugs: "⚠ M feature(s) SIN prototipo: ...  Si son visuales, NO avanzan a fase 3. Verifica: npm run check:prototype-coverage (o marca 'prototype: not-required' si no son visuales)."
- **Detalle de fase 2**: la nota pasa de "; avance 2→3 habilitado" a "; avance 2→3 habilitado solo para N con prototipo (M sin prototipo aun)".
- No cambia la lógica del gate (pre-flight instanciado sigue fallando con prototipos faltantes); solo el texto deja de ser engañoso.

### Verificacion empirica

- Caso real (001 con prototipo human-approved, 002/003 sin prototipo): `roadmap:status` ahora dice "habilitado SOLO para 1 feature" + lista 002/003 como SIN prototipo. `check:all` EXIT 0.

## v12.103.0
**Fix de regresión (bug real):** `scaffold-prototype.mjs` invocaba `countSiblingsSameOrigin` (aviso de diversidad estructural, v12.91) pero la función **ya no estaba definida** — el splice de `buildFreeformStarter` en v12.99/v12.101 la borró por error (vivía entre `buildFreeformStarter` y `deriveHueFromSlug`, dentro del rango reemplazado). Efecto: `scaffold-prototype` escribía el prototipo y **luego crasheaba con `ReferenceError` (EXIT 1)**, sin imprimir los "Próximos pasos OBLIGATORIOS" y haciendo que callers como `scaffold:feature --domain` reportaran fallo del sub-comando.

- **Re-agregada `countSiblingsSameOrigin`** (idéntica a v12.91): cuenta features hermanas con el mismo origen (golden o freeform) leyendo el marker `scaffold-prototype` y emite el aviso de diversidad estructural.
- Verificado el nombre de sección citado en el aviso (`prototype.md > ## Sistema visual e identidad`) — coincide con el builder.

### Verificacion empirica

- `scaffold-prototype --freeform` → EXIT **0** (antes 1) e imprime los próximos pasos.
- 2 features del mismo golden → emite "⚠ DIVERSIDAD ESTRUCTURAL: ya hay 1 feature con el mismo origen" + EXIT 0.
- `check:all` EXIT 0.

## v12.102.0
Revisión profunda de TODAS las fuentes que generan HTML de prototipo, para que ninguna produzca "UI metodológica" (texto técnico/scaffold visible). Resultado del barrido (texto entre tags, excluyendo comentarios/script/style/atributos):

- **Goldens (16)**: limpios — los "hits" iniciales eran atributos `placeholder="..."` de inputs y clases/ids (`spdd-nav`), no texto visible.
- **Specs del template**: limpios.
- **Starter `--freeform`**: ya limpio (v12.101).
- **`placeholderProtoHtml`** (scaffold-feature sin `--domain`): **era el último ofensor** — mostraba "Prototipo placeholder", "scaffold mínimo", "Siguiente paso obligatorio", "Copia el golden… NO dejes el placeholder en produccion". **Limpiado**: visible solo título de la feature + estado "Sin datos para mostrar"; toda la guía (cómo regenerar con `--domain`/`--freeform`, consumir FEATURE_DATA, borrar el centinela) pasa a un **comentario HTML**. Ahora lleva el centinela `spdd:freeform-starter` → `check:prototype-diversity` lo **BLOQUEA** como andamiaje sin rediseñar.
- `check-prototype-diversity`: mensaje `freeform-skeleton` generalizado (cubre starter freeform **y** placeholder de scaffold-feature).

### Verificacion empirica

- `scaffold-feature` sin `--domain` → visible solo "<Titulo> · Sin datos para mostrar" (sin texto metodológico); diversity bloquea por centinela.
- Barrido de goldens + specs + generadores: sin texto metodológico en nodos de texto visibles. `check:all` EXIT 0.

## v12.101.0
Limpia el starter `--freeform`: ya no renderiza **texto metodologico como UI visible**. En v12.99 el andamiaje mostraba en pantalla "Andamiaje neutro", "Estados UI reutilizables", "Ejemplo de lista (reemplazar...)" — "UI metodologica" que ensucia el producto. Ahora **toda la guia vive en COMENTARIOS HTML** (invisible) y lo visible es UI neutra minima (un listado que consume `FEATURE_DATA`).

- `buildFreeformStarter`: las instrucciones para el agente (diseña la UI real, implementa estados, borra el centinela) pasan a un comentario `<!-- ... -->` al inicio del body. Visible solo: topbar (marca+titulo+hub) + una `<section>` con el titulo de la feature + lista. ~121 lineas.
- El centinela `spdd:freeform-starter` sigue en un comentario → `check:prototype-diversity` sigue bloqueando el andamiaje sin rediseñar.

### Verificacion empirica

- `scaffold:prototype --freeform` → HTML sin texto metodologico visible (verificado quitando comentarios); centinela presente en comentario; `freeform-skeleton` sigue bloqueando. `check:all` EXIT 0.

> Nota: `scaffold-feature` sin `--domain` aun genera un `placeholderProtoHtml` con texto "placeholder, reemplazame" visible — es un marcador TODO deliberado (no pretende ser producto), distinto del starter freeform. Se puede limpiar igual si se desea.

## v12.100.0
Doble-check del camino **golden (--domain)**: `golden-skeleton` ahora compara cada prototipo contra **TODOS los goldens** (mejor coincidencia), no solo el del marker. Cierra 2 huecos reales encontrados al revisar:

- **Copia verbatim SIN marker** (un agente copia el archivo del golden a mano): antes `golden-skeleton` la saltaba (requeria marker) y, si era unica, `clone-structure` tampoco la atrapaba → pasaba en verde. Ahora **bloquea** (≈100% vs el golden real).
- **Marker con golden INEXISTENTE** (caso real cristiano 006: `golden=saas-operativo-cola`): antes se saltaba (no encontraba el golden) → la feature unica pasaba. Ahora **bloquea** y el mensaje delata el mislabel ("el marker dice golden=X, pero coincide con Y").

El marker pasa a ser informativo (no requerido). Margen verificado: el `001` del template (redisenado) queda en **68%** y sigue verde; una copia verbatim ~100%. Umbral configurable (`prototype.golden_sim_threshold`, default 0.75) sin cambios.

### Verificacion empirica

- Copia sin marker (sola) → BLOQUEA `golden-skeleton` (100% vs saas-operativo-bandeja).
- Marker `golden=saas-operativo-cola` sobre copia de streaming → BLOQUEA e indica el mislabel.
- Template (001 a 68%) → verde. `check:all` EXIT 0.

## v12.99.0
Cierra el último camino por el que un prototipo **genérico/pobre** podía pasar en verde: el **starter `--freeform`**. En v12.90 lo hice "completo para pasar nivel 2", lo que volvió un **shell CRUD genérico** (Listado/Detalle/Nuevo) que, si el agente lo dejaba tal cual, era un prototipo pobre que aprobaba (y `golden-skeleton` no aplica a freeform; `clone-structure` solo atrapa 2+ idénticos).

- **Starter simplificado** (`buildFreeformStarter`): de ~253 líneas (CRUD genérico) a ~130 — solo **tokens de marca compartida + 5 estados reutilizables + una vista de ejemplo que consume `FEATURE_DATA` + link al hub + guía**. Sin layout de dominio dictado. A propósito **no alcanza nivel 2**: el agente DEBE diseñar la UI real.
- **Centinela + bloqueo**: el starter trae el comentario `<!-- spdd:freeform-starter ... -->`. **`check-prototype-diversity` BLOQUEA** (`freeform-skeleton`) mientras el centinela siga presente → entregar el andamiaje sin rediseñar es imposible (mismo espíritu que `golden-skeleton`, ahora para freeform). El agente lo borra al construir la UI real.
- `scaffold-prototype` (output) y `AGENTS.md` lo explican: freeform = punto de partida, NO el producto; rediseña y borra el centinela.

### Verificacion empirica

- `scaffold:prototype --freeform` → 131 líneas, centinela presente; `check:prototype-diversity` BLOQUEA con `freeform-skeleton`. Template (sin freeform) → verde. `check:all` EXIT 0.

## v12.98.0
Restaura la **coherencia de marca** entre prototipos. Tras hacer la diversidad ESTRUCTURAL (v12.92), el color por-feature (`deriveHueFromSlug`, v12.50) ya no hacia falta y rompia el look&feel de producto: cada feature salia de un color distinto.

- **Marca COMPARTIDA por proyecto** en `scaffold-prototype`: `resolveBrand()` resuelve hue+saturacion con precedencia `--brand-hue <n|auto>` > `template.config.json` (`prototype.brand_hue` / `brand_saturation`) > default compartido (hue 222, sat 55). Todas las features usan la MISMA marca → se ven como un producto.
- **`--brand-hue auto`** restaura el hue por slug (variedad) como opt-in.
- Aplica en golden (override `--brand`) y en `--freeform`. La **diversidad sigue intacta**: `check:prototype-diversity` es ciego al color (mide estructura), asi que compartir paleta NO reabre el patron de clones.
- `template.config.example.json` documenta `prototype.brand_hue` / `brand_saturation`; `AGENTS.md` aclara marca-compartida vs layout-diverso.

### Verificacion empirica

- 2 features de dominios distintos (operativo/streaming) → ambas `hsl(222 55%)` (marca coherente) con layouts distintos. `--brand-hue auto` → hues distintos. `check:all` EXIT 0.

## v12.97.0
Cierra un **fallo de propagación** detectado en un proyecto real (`cristiano.cloudev1`, generado por un agente): 7 prototipos eran **copia verbatim del golden (similitud 100%)** y aun así `check:all` pasó en verde.

### Diagnostico

El proyecto SÍ tenia el validador `check-prototype-diversity` con la logica `golden-skeleton` (v12.92), pero su `package.json > check:project` corria `check:prototype-diversity` **sin `--strict`** → modo warn → no bloqueaba. El `--strict` que v12.92 agrego al pipeline **NO se propaga** a proyectos ya instanciados: `template:upgrade --force-framework` refresca los **archivos** `ci/scripts/` pero no reescribe el `package.json` (project-owned). Resultado: el codigo del bloqueo estaba, pero el pipeline no lo invocaba en strict.

### Fix (propagation-robust)

- **`check-prototype-diversity` es STRICT por DEFAULT** (`resolveStrict(args, true)`). Ya no depende de que el pipeline lleve `--strict`. Basta refrescar el ARCHIVO del validador (que SÍ propaga via `--force-framework`) para que el bloqueo se active en proyectos existentes. `--warn` sigue como opt-out explicito (CI de aprendizaje). El template (1 prototipo de ejemplo) → "no aplica" → sin impacto.

### Verificacion empirica

- Template sin `--strict` → "1 prototipo, diversidad correcta" (exit 0).
- Validador nuevo vs `cristiano.cloudev1` SIN `--strict` → **9 bloqueantes, exit 1** (7 golden-skeleton 100% + 2 clone-structure). Con `--warn` → exit 0.
- `check:all` EXIT 0.

> Para arreglar un proyecto ya afectado: `npm run template:upgrade -- --apply --force-framework` (trae el validador default-strict) y luego rediseña los prototipos clonados o usa `scaffold:prototype --freeform`.

## v12.96.0
Cierra una grieta real en los términos residuales: **nada cazaba placeholders `${ctx.x}` sin expandir**. Se creía cubierto por `findStructuredTokens`, pero ese helper solo matchea tokens de doble subrayado, no `${ctx...}`.

- **`FORBIDDEN_RESIDUAL_TERMS`** amplía el patrón de placeholders a `<feature>|<slug>|<org>|\$\{ctx\.[\w.]+\}` — ahora detecta `${ctx.projectName}` **y** paths anidados `${ctx.project.name}` en los artefactos generados (specs/, AI_CONTEXT.md, etc.).
- Sigue **pasando el meta-check** de v12.95 (no toca vocabulario protegido: `feature`, `slug`, `spec`…). El placeholder real lleva sintaxis explícita (`${ctx.` / `<...>`), nunca palabras comunes.
- Corregido un comentario inexacto de v12.95 (decía que `${ctx...}` se cazaba vía `findStructuredTokens`; en realidad ese helper cubre tokens de doble subrayado).

### Verificacion empirica

- `${ctx.projectName}` y `${ctx.project.name}` → detectados; `<feature>` sigue detectado; vocabulario protegido (`feature`/`slug`/…) → NO matchea (meta-check OK).
- Template (`--mode template`) sin hallazgos. `check:all` EXIT 0.

## v12.95.0
Endurece `check-template-instantiation` contra el **drift** que sufrió un proyecto real: alguien amplió el patrón de "términos residuales" a la palabra común `feature`, que además choca con la auto-zona **requerida** `features` de AI_CONTEXT — el validador se contradecía consigo mismo. El template canónico nunca tuvo ese bug (usa `<feature>` con angle-brackets), pero ahora se **auto-protege** para que no se re-introduzca.

- **Meta-check de auto-consistencia (`checkResidualPatternSafety`)**: corre en ambos modos. Si algún `FORBIDDEN_RESIDUAL_TERMS` matchea una palabra de `PROTECTED_VOCAB` (vocabulario genérico de metodología: `feature(s)`, `slug`, `spec(s)`, `module`, `gate(s)`, `prototype`, `roadmap`, `project`…), el validador **falla** con mensaje claro — porque el patrón quedó demasiado amplio (residuo real vs palabra común).
- **REGLA DE ORO documentada** sobre `FORBIDDEN_RESIDUAL_TERMS`: solo términos del dominio-ejemplo (bandeja/expediente/slug del ejemplo) y placeholders con sintaxis explícita (`<feature>`, `$(date)`, `${ctx...}` vía findStructuredTokens). NUNCA palabras comunes sueltas.

### Diagnostico

El `placeholder` real es `<feature>` (angle-brackets); la palabra `feature` es vocabulario legítimo y el nombre de una auto-zona obligatoria. Ampliar el patrón a `\bfeature\b` bloqueaba contenido legítimo y la propia auto-zona `features`. El meta-check convierte esa contradicción en un fallo inmediato y auto-explicado.

### Verificacion empirica

- Template (`--mode template`/`instantiated`): patrones canónicos NO tocan vocabulario protegido → sin hallazgos.
- Simulación: ampliar a `\bfeature\b` → el meta-check detecta el match con "feature" y FALLA. `check:all` EXIT 0.

## v12.94.0
Quita la rigidez de `check-ai-artifacts` que exigia **titulos de seccion LITERALES** en los artefactos por feature (`spdd-frontend.md`, `spec-funcional.md`, `spec-tecnica.md`). Antes `text.includes("## Componentes principales")` premiaba conformidad de wording sobre sustancia y forzaba alinear archivos a un titulo fijo (busywork que empuja al "rellena la plantilla" → artefactos cookie-cutter).

- **Matching por CONCEPTO (sinonimos), no por titulo exacto.** Cada concepto acepta variantes via regex sobre el texto del heading:
  - Componentes: `componentes|components`
  - Estados UI: `estados|states`
  - Permisos/roles: `permisos|roles|autorizaci|permissions`
  - (spec-funcional) Requerimientos / Criterios de aceptacion / Reglas de negocio; (spec-tecnica) Modelo de datos — todos con sinonimos.
  El agente cubre el concepto con el wording que prefiera; los titulos canonicos del scaffold siguen pasando.
- **Sustancia real (anti cookie-cutter).** Ahora la seccion ademas debe tener CONTENIDO (≥1 linea no vacia que no sea subheading/comentario). Una seccion con solo el titulo (placeholder) **falla** — antes pasaba con el heading vacio.
- Skills/prompts (`ai/skills`, `ai/prompts`) siguen con titulos exactos (convencion estable del template, no autorada por agente).

### Verificacion empirica

- spdd-frontend con `## Components` / `## Estados de la interfaz` / `## Roles y permisos` + contenido → PASA (antes fallaba por wording).
- `## Estados UI` vacio → FALLA: "la seccion ... esta vacia — agrega contenido real".
- Template (001) y scaffold canonico → PASAN. `check:all` EXIT 0.

## v12.93.0
Hace **configurable** el umbral de similitud vs golden (`golden-skeleton` de v12.92) y baja el default a **0.75** (de 0.82) para cazar clones con retoques menores, no solo copias casi idénticas.

- **Umbral configurable** en `check-prototype-diversity`. Precedencia: `--golden-sim-threshold` > env `SPDD_GOLDEN_SIM_THRESHOLD` > `template.config.json` (`prototype.golden_sim_threshold`) > default **0.75**. Así un proyecto lo ajusta **sin editar el framework** (sobrevive `template:upgrade --force-framework`, que reescribiría el validador).
- El reporte imprime el umbral usado + cómo ajustarlo. `template.config.example.json` documenta `prototype.golden_sim_threshold`.
- `AGENTS.md`: la regla de identidad visual ahora indica que el bloqueo es ≥75% del esqueleto del golden y que el umbral es ajustable si el sistema de diseño comparte mucho vocabulario de clases.

### Verificacion empirica

- Clon del golden (similitud 100%) → bloquea con default 0.75 y reporta "Umbral: 75%".
- `--golden-sim-threshold 0.99` → el reporte muestra "Umbral: 99%" (resolución por flag OK).
- Template (001 sin marker golden) → no aplica. `check:all` EXIT 0.

## v12.92.0
Convierte la identidad visual de prototipos en **barrera dura**: el agente reportó que seguía clonando el esqueleto del golden para cada spec. Causa real (de enforcement, no de guía): `check:prototype-diversity` corría como **warning** en `check:project`, **no estaba en `pre-flight`**, y **no comparaba contra el golden** — así nada frenaba el clon en el loop normal.

- **F1 — diversity STRICT.** `check:prototype-diversity` ahora corre con `--strict` en `check:project` (package.json + generator) y se agregó a `pre-flight-gate` (instanciado, strict). Clonar el esqueleto **rompe `npm run check:all`** en el loop del agente (antes solo avisaba). El template tiene 1 prototipo de ejemplo → "no aplica" → no se rompe.
- **F2 — comparación contra el GOLDEN.** El validador ahora mide **similitud difusa** (Jaccard sobre firmas estructurales `tag.clase`) entre cada prototipo y su golden de origen (marker `golden=X`). Si ≥82% idéntico → **bloquea** `golden-skeleton`: "el prototipo sigue siendo el esqueleto del golden, no lo rediseñaste". Caza el caso exacto **incluso con una sola feature** (antes solo comparaba entre features, con igualdad exacta de hash, frágil).
- Refactor: `normalizeStructure()` (compartida por hash y firmas), `structureSignatures()`, `jaccardSim()`.

### Verificacion empirica

- Feature scaffoldeada de `--domain operativo` sin rediseñar → `check:prototype-diversity --strict` BLOQUEA con `golden-skeleton` (similitud 100%).
- Template (001, sin marker golden) → "no aplica" / "diversidad correcta". `check:all` EXIT 0.

## v12.91.0
Hace VISIBLE para el agente que la diversidad de prototipos no es solo de contenido sino **visual**: cada feature debe verse como un producto distinto orientado a su dominio, no el mismo golden recoloreado. Causa raíz (codex/opencode): N features scaffoldeadas del mismo golden, variando solo el hue → se ven iguales. `check:prototype-diversity` ya lo bloqueaba (es **ciego al color**), pero la exigencia no era visible al agente hasta el fallo.

- **V1 — Regla explícita (visibilidad).** `AGENTS.md` (REGLA DE PROTOTIPOS) + `phase-contracts.mjs` fase 2 (`noPuede`) ahora dicen: "identidad visual por feature, recolorear NO pasa diversity (es ciego al color: normaliza hex/hsl/rgb); da a cada feature su propio layout/componentes/jerarquía; si repites dominio, varía el layout o usa `--freeform`".
- **V2 — Aviso en el scaffold.** `scaffold-prototype` detecta (leyendo el marker de cada prototipo) si ya hay features con el mismo origen (golden o freeform) y advierte: recolorear no basta, dale identidad visual propia. Helper `countSiblingsSameOrigin`.
- **V3 — `prototype.md` gana sección "## Identidad visual".** El builder de la fuente única (`scripts/_lib/feature-templates.mjs`) declara: layout/shell propio, paleta, componentes característicos y **en qué se diferencia visualmente de las otras features**. Sincronizado a `plantillas/fase-4-sdd` (`plantillas:sync`).

### Verificacion empirica

- 2 features `--domain operativo` → el scaffold de la 2da emite el aviso "⚠ IDENTIDAD VISUAL: ya hay 1 feature con el mismo origen (golden saas-operativo-bandeja)".
- `prototype.md` (plantilla y generado) incluye "## Identidad visual"; `check:plantillas` OK (fase-4 sincronizada). `check:all` EXIT 0.

## v12.90.0
Da LIBERTAD al agente para proponer el mejor prototipo del dominio real: el golden pasa de "plantilla obligatoria" a **referencia de nivel**. Los guardarrailes (rubric, contrato, diversity, visible-product, no-CDN, no-placeholder) ya eran por-resultado, asi que la libertad es segura: lo que importa es pasar el rubric por riqueza real, no copiar.

### P1 — `scaffold:prototype --freeform` (starter neutro)

- Nuevo modo `--freeform` (alternativa a `--domain`): genera un **starter neutro** sin layout de dominio dictado — tokens de diseño (20+), 2 media queries, las 4-5 vistas (lista/detalle/crear/estados), los 5 estados UI, una tabla con datos de `window.FEATURE_DATA`, toast, y link al hub. Cumple **nivel 2** del rubric de salida (253 lineas / 24 tokens / 4 vistas / 20 mocks / 45 botones); el agente lo eleva a nivel 3 con el dominio real. NO emite marker `golden=` (asi `check:prototype-domain-mismatch` no aplica).

### P3 — mock-data inferido del spec

- `seedMockDataFromSpec`: al scaffoldar (cualquier modo), si falta `mock-data.json`, se **siembra desde el spec** — entidad y campos de `spec-tecnica.md` (Tabla + columnas) + RFs de `spec-funcional.md`, con 6 filas de valores genericos (sin `<<placeholder>>`, renderiza de una) que el agente refina. Ademas ahora se **inyecta en la misma corrida** (antes requeria una 2da).

### P2 — golden = referencia (no plantilla obligatoria)

- `AGENTS.md` (REGLA DE PROTOTIPOS) y `phase-contracts.mjs` fase 2 (`puede`) reencuadrados: dos caminos validos (golden de partida **o** `--freeform`); "lo que cuenta es pasar el rubric + contrato por riqueza real, no copiar el golden".

### P4 — umbral de calidad consciente de complejidad

- `check-html5-prototype-quality` lee `complexity: simple|standard|rich` del frontmatter de `spec-funcional.md` y ajusta el umbral de RIQUEZA (lineas/vistas/mocks/botones) — para no forzar a inflar features simples. **No relaja** tokens de diseño, responsive ni "sin CDN" (piso de calidad). Default: `standard` (sin cambios para specs existentes).

### Verificacion empirica

- `scaffold:prototype --freeform` sobre feature con `Tabla \`miembro\``: siembra mock-data.json (entidad miembro + campos nombre/rol/estado, RF-01), cablea FEATURE_DATA, y `check:prototype-html5` → **nivel 2** (queda `[O4] decisiones-ux.md` como en el golden, lo escribe el agente).
- `check:all` EXIT 0 (sin regresion en specs existentes; complexity default standard).

## v12.89.0
Aclara y hace honesto el semaforo "Debe validar" del panel embebido. Hallazgo del usuario: el badge decia "✗ nunca" para validadores que SI se habian ejecutado — porque el estado solo cruza con `ai_action_runs`, que antes solo registraba corridas hechas desde el panel/agente; una corrida de terminal (`npm run check:all`) no quedaba trazada y aparecia como "nunca".

### A — wording honesto (no engaña)

- En el panel (MEMORY_CLIENT), la leyenda pasa de `(✓ ejecutado · ✗ nunca · ⚠ fallo)` a **`(✓ registrado · ◦ sin registro · ⚠ fallo)`** con tooltip explicando que el registro viene del panel/agente/`npm run validate`/git hook y que las corridas sueltas en terminal NO se registran. El summary cambia de "X nunca ejecutadas" a "X sin registro".

### B — registrar corridas de terminal

- **`recordActionRun()`** + subcomando **`record-run`** (`--action/--exit/--ms/--origin` o `--batch <json>`) en `ai-framework-agent.mjs`: inserta corridas YA terminadas en `ai_action_runs` de un solo golpe.
- **`scripts/validate.mjs`** + script **`npm run validate`**: equivalente TRAZADO de `check:all`. Corre cada validador HOJA alcanzable desde `check:template`+`check:project` (expande composites), mide exit+duracion, no corta al primer fallo, y registra cada corrida (`origin cli`). Asi el semaforo del panel refleja las validaciones de terminal. `check:all` se mantiene como el comando puro para CI (sin tocar la BD).
- **`AGENTS.md`**: recomienda `npm run validate` para que el panel cuente las validaciones; aclara que `◦ sin registro` no significa fallo.

### Verificacion empirica

- `npm run validate` → corre 36 validadores hoja, todos OK, registra 36 corridas (origin cli). Query a la BD confirma filas para `check-trace-drift`, `check-status-coherence` (exit 0) → el panel ahora las muestra `✓ registrado`.
- `check:all` EXIT 0.

## v12.88.0
Sincroniza `plantillas/` con sus DESTINOS reales y elimina la doble fuente de los artefactos por feature. Diagnostico (con el usuario): `plantillas/` (blanco) alimenta muchos destinos distintos — `docs/`, `specs/`, `qa/`, `ops/`, `estimacion/`, ... — pero el señalamiento era debil (1 de 48 se autoidentificaba) y `plantillas/fase-4-sdd/` era una COPIA paralela de los artefactos que `scaffold:feature` genera, **ya driftada** (secciones distintas en `spec-funcional.md`).

### R1 (estricta) — fuente unica para los artefactos por feature

- **`scripts/_lib/feature-templates.mjs`** (nuevo): los builders de los 9 archivos canonicos (antes inline en `scaffold-feature.mjs`) ahora viven aqui. Una sola fuente.
- **`scaffold-feature.mjs`** importa los builders (sin cambio de comportamiento; 9/9 verificado). Se corrigio un **bug latente**: `apiContract` referenciaba `contracts/openapi.yaml` (inexistente) → ahora `contracts/api/openapi.yaml`.
- **`scripts/sync-plantillas.mjs`** (nuevo) + script `plantillas:sync`: regenera `plantillas/fase-4-sdd/*.md` desde la fuente unica (con banner). Imposible que diverjan de lo que produce `scaffold:feature`.

### R2 — banner de destino en cada plantilla

- Las 38 plantillas (no-README) llevan un banner `> **Plantilla (no es el entregable).** Destino: \`...\`` con su destino real (`docs/fase-N/` | `specs/<feature>/` | `qa/` | `ops/` | `src/` | ...). Los README de carpeta quedan sin banner (son doc de carpeta).

### R3 — validador `check:plantillas`

- **`ci/scripts/check-plantillas.mjs`** (nuevo): (1) cada plantilla declara un destino que **existe**; (2) `plantillas/fase-4-sdd` no drifto del generador (re-emite y compara). En `check:project` (warn) + `pre-flight-gate` instanciado (strict) + generator.

### R4 — regla unica en AGENTS.md

- Nueva seccion "REGLA DE PLANTILLAS Y DESTINOS": buckets `docs/` (metodo+entregable vivo) vs `plantillas/` (blanco) vs `ejemplos/` (referencia) + mapa de destinos + "artefactos por feature SIEMPRE con `scaffold:feature`, nunca copiar `plantillas/fase-4-sdd` a mano".

### Verificacion empirica

- `scaffold:feature` tras el refactor: 9/9 archivos, `contracts/api/openapi.yaml` correcto.
- `plantillas:sync` regenero 9 archivos; `check:plantillas` OK (38 plantillas con destino valido, fase-4 sincronizada); `check:markdown-paths` OK.
- `check:all` EXIT 0 (40 validadores fisicos, 33 en check:project).

## v12.87.0
Sincroniza los **checklists/gates** con el **contrato ejecutable de fases** (`_lib/phase-contracts.mjs`), que es la fuente unica del metodo. Antes habia 4 superficies paralelas mantenidas a mano (contrato ejecutable, 9 checklists markdown, 11 gates, roadmap 90.36) que driftaban: al agregar un validador habia que tocar 5 sitios y los docs se olvidaban.

### A — fix de drift + meta-validador

- **Drift corregido en `phase-contracts.mjs` fase 2 `debeValidar`**: faltaban `check:prototype-spa-coherence` (v12.84), `check:prototype-mock-data` (v12.86) y `check:prototype-cross-links`. Tambien se agrego `check:instantiation` al `package.json` del template (existia solo en el generado).
- **`ci/scripts/check-phase-validator-sync.mjs`** (nuevo): meta-validador contrato↔pipeline. FORWARD: cada `check:*` referenciado en algun `debeValidar` existe como script (sin refs rotas). REVERSE: cada validador hoja `check:prototype-*` que corre en `check:project` esta en el contrato de fase 2 (excluye composites). Es la contraparte de `check:validation-coverage` (que valida pipeline↔fs). En `check:project` + generator. **Cazo 2 drifts reales** en su primera corrida.

### B — auto-zone "contrato de la fase" en los checklists

- **`buildPhaseContrato(phaseId)`** en `_lib/doc-autozones.mjs`: renderiza, desde `phase-contracts.mjs`, los validadores + gates de la fase como checklist.
- Zona `<!-- auto:start name=fase-N-contrato -->` insertada en los 9 docs de fase (checklists/deliverables). La refresca `npm run roadmap:sync` (mecanismo existente). Las partes de **juicio humano** del checklist siguen manuales; solo la lista de validadores/gate se auto-genera. Asi los checklists dejan de copiar a mano la lista de `check:*`.

### C — las gates nombran su validador (sin duplicar)

- `ai/quality-gates/README.md` ahora apunta a la fuente unica: los `check:*` por gate viven en el contrato de fase y se publican en la zona `fase-N-contrato` del checklist + `npm run roadmap:next`. Sin listas duplicadas que driften.

### Verificacion empirica

- `check:phase-validator-sync` detecto y luego confirmo sincronizado: 9 contratos, 9 validadores de prototipo en check:project, EXIT 0.
- `roadmap:sync` poblo las 9 zonas; fase 2 lista los 12 validadores (incluidos los 3 que faltaban) + 5 gates.
- `check:all` EXIT 0 (39 validadores fisicos, 32 en check:project).

## v12.86.0
Convierte en automaticas las dos mejoras anotadas como "futuras" en v12.85: el **auto-strip del sidebar del golden** y la **siembra declarativa de datos** del prototipo. Menos trabajo manual del agente, mas garantizado por validacion.

### Mejora 1 — auto-strip del `<aside>` (SPA)

- **Goldens marcados**: los 12 goldens con sidebar primario llevan ahora `<aside data-spdd-sidebar class="sidebar">` (marcador canonico; los `detail-panel`/`cart`/`drill-panel` NO se tocan).
- **`scaffold-prototype.mjs`**: en `--mode portfolio-spa` reemplaza **in-place** el `<aside>` marcado (o `class="sidebar"`) por `<div id="spdd-nav"></div>`, conservando el slot del shell flex; neutraliza el shim `margin-left: var(--sidebar-w)` (golden con sidebar `position:fixed`, p. ej. saas). Resultado: el sidebar compartido queda montado **sin paso manual**. Goldens sin sidebar (mobile/streaming/kpi/pos) → fallback: monta el nav como barra + aviso.
- **Bug fix `upsertNavItem`**: el regex no-greedy paraba en el primer `]` (el del comentario de ejemplo `["admin"]`) y corrompia `nav-items.js`; ahora hace match greedy hasta el `];` final e ignora slugs en comentarios.

### Mejora 2 — datos declarativos `mock-data.json`

- **Convencion** `specs/<slug>/prototype-html5/mock-data.json`: `{ "entities": { "<e>": { "shared": bool, "rows": [...] } } }`.
- **`scaffold-prototype.mjs`**: si existe, genera `window.FEATURE_DATA = {...}` y (en SPA) `SharedSeed.register(...)` para las entidades `"shared": true`; si no existe, escribe un **esqueleto** para que el agente lo complete. El agente consume: `MockApi.resource(FEATURE_DATA.<e>)` / `SharedSeed.resource("<e>")`.
- **`ci/scripts/check-prototype-mock-data.mjs`** (nuevo): BLOQUEA placeholders `<<...>>` residuales en el HTML y el `mock-data.json` con el esqueleto sin completar; WARNING si los datos declarados no se consumen. Opt-in por feature (solo actua si hay `mock-data.json` o placeholders). En `check:project` (warn) + `pre-flight-gate` instanciado (strict).

### Verificacion empirica

- Mejora 1: `scaffold:prototype --mode portfolio-spa` sobre golden `operativo` → 0 `<aside class="sidebar">`, `#spdd-nav` activo (sin `hidden`), sin shim `margin-left`, feature registrada en `nav-items.js` (manifiesto valido, `node --check` OK).
- Mejora 2 (fixture): `placeholder-residual` + `mock-data-esqueleto` (blockers), `datos-no-consumidos` (warn), caso limpio OK, caso sin datos skip → EXIT 1 en strict.
- `check:all` EXIT 0 (38 validadores fisicos, 31 en check:project).

## v12.85.0
Profundiza el modo `portfolio-spa` cubriendo las casuisticas reales que v12.84 dejo abiertas: **navegacion cross-spec con contexto**, gobernanza de sesion/rol, datos comunes y un validador que ahora bloquea los modos de fallo concretos (mount inerte, sidebar duplicado, drift manifiesto↔filesystem).

- **`specs/_shared/nav.js`**: `SharedNav.go('<slug>', { focus, entity, label })` (origen) + `SharedNav.context()` (destino) para abrir otra feature con una **entidad seleccionada**; el contexto se persiste en `AppState` (sobrevive `target=_blank`) y se refleja en la URL (`?focus=&entity=&from=`). Breadcrumb **"← Volver a `<feature>`"** automatico desde `?from=`. **Guards por rol** (`roles:[...]` oculta items segun `AppState.session.role()`), **badges** cross-spec (`badge:{state:'clave'}` lee `AppState`), `role`/`demo-mode` con **fuente unica** en `AppState` (no el hack `from=hub`), y **sidebar responsive** (colapso movil con toggle).
- **`specs/_shared/seed.js`** (nuevo): `SharedSeed.register/get/resource` — entidades COMUNES cross-spec (ej. "miembro" usado por 3 features) definidas una sola vez para que se vean consistentes en vez de duplicar mocks. Vacio por defecto (el template no trae datos de dominio).
- **`check-prototype-spa-coherence.mjs` (v12.85)** ahora ademas BLOQUEA: `mount-inerte` (`#spdd-nav` con `hidden`), `sidebar-duplicado` (`<aside class="sidebar">` coexistiendo con `nav.js`), y **drift bidireccional** (`no-registrado-en-manifiesto`: prototipo SPA ausente de `nav-items.js` → inalcanzable; `manifiesto-sin-prototipo`: entrada sin prototipo → link roto).
- **`scaffold-prototype.mjs`**: inyecta `seed.js`, el mount `#spdd-nav` queda **activo** (sin `hidden`) y con `hub:<bool>` segun exista el hub (evita el `← Hub` roto); guia explicita de eliminar el `<aside>` inline.
- **`nav-items.js` / `AGENTS.md` / `specs/_shared/README.md` / `template-upgrade.mjs`**: documentan `roles`/`badge`, navegacion con contexto, `seed.js` y las reglas que bloquea el validador.

### Diagnostico (causa raiz)

v12.84 dejo la SPA ensamblada pero `contextQuery` solo propagaba `role`/`demo-mode`, el `?from=` no se usaba para volver, el menu ignoraba el rol, no habia datos comunes, y el validador no detectaba el duplicado real (aside del golden + mount inerte) ni el drift del manifiesto. Esta version cierra cada caso con contrato + validacion.

### Verificacion empirica

- Fixture SPA: dispara los 4 bloqueantes (mount-inerte, sidebar-duplicado, no-registrado, manifiesto-sin-prototipo) en strict (EXIT 1); SPA correcta → EXIT 0.
- Smoke funcional: `go()` propaga `from/focus/entity/role`; `context()` en destino recupera `{focus, entity, label, from, fromLabel}` (label rico desde AppState, fromLabel desde el manifiesto).
- Carga de los 6 helpers `_shared/*.js` sin error de sintaxis. Template (no-SPA): "no aplica, OK". `check:all` EXIT 0.

## v12.84.0
Hace **real** el modo `portfolio-spa`: tras detectar (en un 3er proyecto real con v12.83) que el agente creó `specs/_shared/` pero los prototipos **no lo enlazaban** (MockApi/AppState/UI sin uso, sidebar duplicado 6× por feature, sin cross-link), ahora la SPA se ensambla extremo-a-extremo y un validador bloquea la incoherencia.

- **`specs/_shared/nav.js`** (nuevo): `window.SharedNav.mount('#spdd-nav', { active, brand, items, hub })`. Renderiza **un único** sidebar desde `window.SPDD_NAV_ITEMS`, genera el cross-link entre prototipos (`../../<slug>/prototype-html5/index.html?from=...`), inyecta su CSS `.snav` una sola vez y enlaza al hub. Es un helper de navegación (permitido por la regla anti-trampa), no un renderer genérico de dominio.
- **`specs/_shared/nav-items.js`** (nuevo): manifiesto ÚNICO de la lista de features del sidebar (`window.SPDD_NAV_ITEMS`). `scaffold:prototype --mode portfolio-spa` lo actualiza solo.
- **`ci/scripts/check-prototype-spa-coherence.mjs`** (nuevo): si la SPA está activa (hay entradas reales en `nav-items.js` o algún prototipo enlaza `../../_shared/`), exige que **todos** los prototipos enlacen `_shared/` (blocker) y usen `_shared/nav.js` en vez de duplicar el sidebar (warning). `stripComments()` evita el falso positivo del ejemplo comentado del manifiesto. En `check:project` (warn) y `pre-flight-gate` instanciado (strict).
- **`scaffold-prototype.mjs`**: `injectSharedInfra` ahora inyecta `nav-items.js` + `nav.js` + `<div id="spdd-nav">` + `SharedNav.mount(...)` (reemplaza el sidebar del golden); nuevo `upsertNavItem(root, slug, label)` registra la feature en el manifiesto.
- **`AGENTS.md`** + **`specs/_shared/README.md`**: documentan el sidebar compartido (una sola fuente) y el flujo `--mode portfolio-spa`.

### Diagnostico (causa raiz)

`_shared/` traía tokens/mock-api/app-state/ui pero **no** un componente de navegación compartido, `portfolio-spa` no se aplicaba de punta a punta y no había validador de coherencia. Triple fix: componente nav compartido + scaffold que lo cablea + validador que bloquea la duplicación.

### Verificacion empirica

- `scaffold:feature --slug 997-spa-test --domain operativo --mode portfolio-spa` → cablea `nav.js`/`nav-items.js`/tokens, registra en el manifiesto y `check:prototype-spa-coherence` pasa.
- Template (no-SPA): `check:prototype-spa-coherence` → "no aplica, OK". `check:all` EXIT 0.

## v12.83.0
Hace **a prueba de fallos** la creacion de prototipos: `scaffold:feature --domain <d>` genera, en UN solo comando, los 9 archivos canonicos **y** el prototipo real (desde el golden) en la ubicacion canonica `specs/<slug>/prototype-html5/index.html`.

- **`scaffold-feature.mjs` + `--domain`** (opcional, recomendado): tras crear los archivos, delega en `scaffold-prototype` para copiar el golden del dominio en `specs/<slug>/prototype-html5/index.html` (sobrescribe el placeholder). Acepta `--marca` y `--mode` (standalone | portfolio-spa). Sin `--domain`: comportamiento previo (placeholder) + recordatorio explicito de usar `scaffold:prototype` y de NO crear `prototype/<feature>/`.
- **`AGENTS.md`**: la REGLA DE PROTOTIPOS ahora documenta el atajo de un comando (`scaffold:feature --domain`).
- Cierra el ciclo de v12.81/v12.82: la ubicacion y la cobertura ya se validaban/bloqueaban; ahora el camino canonico produce el prototipo correcto sin que el agente improvise.

### Verificacion empirica

- `scaffold:feature --slug 998-... --domain operativo` → crea el prototipo real (64 KB del golden) en `specs/998-.../prototype-html5/index.html`; `check:prototype-coverage` y `check:prototype-location` → OK.
- `check:all` EXIT 0.

## v12.82.0
Cierra la grieta detectada en un 2do proyecto real (creado desde cero con v12.81): el agente generó solo el hub `prototype/index.html` y **ningún prototipo por feature**, y `check:project` pasaba VERDE igual — porque todos los validadores de prototipo SE SALTAN las features sin prototipo. Ahora la ausencia se detecta y la regla vive donde el agente la lee.

- **`ci/scripts/check-prototype-coverage.mjs`** (nuevo): exige que cada feature visual incluida tenga `specs/<slug>/prototype-html5/index.html`. Opt-out para features no-visuales con frontmatter `prototype: not-required` (en spec-funcional.md o traceability.md). En `check:project`. **Warn** por defecto (template verde con sus 002/003 de ejemplo) / **strict** en `pre-flight-gate` instanciado (bloquea declarar fase 2 con prototipos faltantes) + en `phase-contracts` fase 2 `debeValidar`.
- **`AGENTS.md`** (lo que el agente lee primero) ahora tiene la **REGLA DE PROTOTIPOS** (ubicación + cobertura): cada feature visual va en `specs/<slug>/prototype-html5/`; `prototype/` es solo el hub; crear SIEMPRE con `scaffold:prototype`; opt-out para no-visuales. Y dos "Errores reales" nuevos (#13 prototipos en `prototype/<feature>/`, #14 solo el hub sin prototipos por feature).
- `pre-flight-gate` instanciado ahora corre `check:prototype-location` **y** `check:prototype-coverage` en strict.

### Diagnostico (causa raiz)

La metodologia permitia "specs sin prototipos" en verde (validadores per-feature con skip-si-no-hay-prototipo) y la regla del prototipo no estaba en `AGENTS.md`. Doble fix: validador de existencia + regla en el contrato que el agente consulta.

### Verificacion empirica

- Template (warn): 001 cubierto, 002/003 faltan → exit 0; strict → exit 1. Proyecto afectado: 32 features, 0 prototipos → 32 hallazgos.
- `check:project` 36 validadores, meta-coverage OK; `check:all` EXIT 0.

## v12.81.0
Endurece la **ubicacion de prototipos** tras detectar (en un proyecto real) que un agente generó las features en `prototype/<feature>/index.html` en vez del canonico `specs/<slug>/prototype-html5/index.html`, y la metodologia no lo frenó (el validador corría solo como warning).

- **`check-prototype-location.mjs` mejorado**:
  - Detecta el antipatron especifico `prototype/<feature>/index.html` (subcarpetas del hub) con mensaje dedicado: el hub `prototype/` es unico y NO lleva subcarpetas.
  - Por cada prototipo mal ubicado **sugiere la ruta canonica mapeada al spec real** (ej. `prototype/004-casa-oracion` → `specs/004-gestion-casas-oracion/prototype-html5/index.html`, matcheando por prefijo NNN).
  - Fix sugerido apunta al camino soportado: `scaffold:prototype` + `prototype:hub`.
- **`pre-flight-gate` (modo instanciado)**: corre `check:prototype-location --strict` → **BLOQUEA** el release de un proyecto con prototipos fuera de lugar. En el template sigue como warning dentro de `check:project` (no rompe dev).
- **Guia reforzada**: `plantillas/fase-2-ux-ui/prototype-html5.md` (seccion "Ubicacion canonica") y `ai/commands/prototype-command.md` (regla de ubicacion) dejan explicito que cada feature va en `specs/<slug>/prototype-html5/` y que `prototype/` es solo el hub autogenerado.

### Diagnostico (causa raiz)

La regla y el validador ya existian, pero `check-prototype-location` es *warn* en `check:project` → la desviacion pasaba silenciosa y los validadores per-feature (calidad/visible-product/contrato/estado) miran `specs/<feature>/prototype-html5/` → no encontraban nada → pasaban en blanco. Ahora la ubicacion bloquea en el gate de release y la guia + sugerencias dirigen al lugar correcto.

### Verificacion empirica

- Validador sobre el proyecto afectado (read-only): mapea los 7 ofensores a su spec real.
- Template: `check-prototype-location --strict` exit 0; `pre-flight-gate` template 6/6 PASS; `check:all` EXIT 0.

## v12.80.0
**Panel de multiagente** en el front embebido (`memory:serve`): gobernar locks/board desde el navegador, no solo por CLI.

- **Nueva pestaña "Multiagente"**: tablero por feature (estado de prototipo + lock activo + expiracion) con botones **Reclamar** / **Liberar** por fila, campo "Agente" (persistido en localStorage) y **Purgar expirados**.
- **Endpoints nuevos**:
  - `GET /api/locks` → tablero (features + prototype_state + lock) reusando `_lib/agent-locks` + `_lib/prototype-state` (dynamic import con guarda; si falta el lib, 404 con sugerencia de `template:upgrade --force-framework`).
  - `POST /api/locks/claim` y `POST /api/locks/release` (con Origin-guard local + body JSON; `claim` con feature/agent/task/ttl/force; `release` con feature/agent/force o `prune`).
- `roadmap:claim` / `roadmap:release` siguen disponibles por CLI; ahora **tambien** desde el panel.
- Verificacion E2E: `/api/locks` lista 3 features; claim → board refleja el lock; release lo libera; client JS del panel (~86 KB) pasa `node --check`; `check:all` EXIT 0.

## v12.79.0
Sincroniza el **front embebido** (`memory:serve`) con los comandos recientes del roadmap/release. Estaban como npm scripts/CLIs pero faltaban en el catalogo de Acciones del panel.

- **Categoria "Comandos universales" ampliada** (Acciones › Ejecutar) — se agregan, runnable y registrados en Historial:
  - `roadmap:prompt` (prompt de la siguiente tarea para un agente),
  - `roadmap:audit` (auditoria del contrato vs git diff),
  - `check:roadmap-state` (frescura de ROADMAP_STATE; warn, bloquea con CHECK_STRICT=1),
  - `release:prep` (flujo de release completo; marcado danger por ser pesado).
- Ahora el panel expone 10 comandos universales (antes 6).

### Nota sobre multiagente

`roadmap:claim` / `roadmap:release` siguen siendo **solo CLI** (requieren `--feature` + `--agent`, que el botón de una sola acción del panel no cubre). El tablero `AGENT_BOARD.md` se consulta desde la pestaña **Proyecto** (visor de archivos). Surface dedicado de locks en el panel queda como mejora futura opcional.

### Verificacion empirica

- `/api/actions` expone los 10 universales; `check-roadmap-state` ejecuta desde el panel y reporta stale/al-dia. `check:all` EXIT 0.

## v12.78.0
Cierra el tema de **release readiness / `ROADMAP_STATE.json`**: ya no viaja desactualizado en el ZIP y su frescura se valida donde corresponde.

- **`.zipignore`**: excluye `ROADMAP_STATE.json`, `AGENT_BOARD.md` y `ai/locks/`. Son regenerables (gitignored) — antes se empaquetaban stale. Ahora nunca viajan; se generan con `roadmap:sync` tras instanciar. **Esta es la corrección de raíz.**
- **`check:roadmap-state` (= `roadmap-sync --check`) strict-aware**: por defecto → *warning* (exit 0) si falta/stale (seguro en cualquier pipeline y en clones frescos); con `--strict` / `CHECK_STRICT=1` → **bloquea** (exit 2). Evita la trampa de meterlo crudo en `check:template` (rompería fresh).
- **`release:prep`** (nuevo script): encadena el flujo correcto en un comando — `roadmap:sync && memory:sync && check:all && roadmap-sync --check --strict`. Resuelve el orden (la memoria queda stale tras `roadmap:sync`).
- **`roadmap:sync`** ahora avisa: "Los docs de fase se actualizaron. Corre `npm run memory:sync` para reindexar la memoria."
- **`pre-flight-gate`** (gate de release): añade frescura de `ROADMAP_STATE` (en **instanciado** = strict bloquea; en **template** = warn) y, **solo en modo instanciado**, corre `check:release-binding` + `check:runbook-binding` en **strict** (bloquean). En el template esos dos siguen como warning dentro de `check:project`. Resuelve "para proyecto real sí debería bloquear" sin romper el template.

### Verificacion empirica

- `npm run check:roadmap-state` (stale) → exit 0 (warn); `--strict` (stale) → exit 2; tras `roadmap:sync` → exit 0.
- `pre-flight-gate` modo template → 6/6 PASS (roadmap-state warn, sin binding strict).
- `check:all` EXIT 0.

## v12.77.0
Fix de `template:upgrade`: `--force-framework` ahora **tambien refresca `scripts/ai-framework-agent.mjs`** (el motor + el FRONT EMBEBIDO de `memory:serve`).

- **El problema**: el matcher de archivos de framework (`isFrameworkScript`) solo cubria `roadmap-*`/`scaffold-*`/`generate-*`/`template-upgrade`/`pre-flight-gate`, dejando fuera `ai-framework-agent.mjs`. Resultado: un proyecto que corria `template:upgrade --force-framework` recibia validadores y scripts nuevos, pero **conservaba el panel viejo** (sin visor de Proyecto, semaforo de prototipos, comandos universales en Acciones, pantalla completa, etc.).
- **El fix**: el matcher incluye `ai-framework-agent`. Ahora `--force-framework` sincroniza el panel embebido completo.
- Verificado contra un proyecto real instanciado (v12.58): tras el fix, su `ai-framework-agent.mjs` queda byte-identico al canonico (visor `api/files/tree`, `category:"universal"`, `prototypeStates`, `fs-mode` presentes).

## v12.76.0
Capa de **orquestacion multiagente**: locks cooperativos para correr varios agentes IA en paralelo sin que dos tomen la misma tarea (la P3 que estaba diferida).

- **`ci/scripts/_lib/agent-locks.mjs`** (nuevo): locks por feature en `ai/locks/<feature>.lock.json` (gitignored) con **TTL** (default 4 h, auto-libera si el agente muere). API: claim/release/listLocks/activeLockOwner/pruneExpired.
- **`roadmap:claim`** / **`roadmap:release`** (nuevos): un agente reclama una feature antes de trabajarla y la libera al terminar. `--force` roba/libera un lock ajeno; `--prune` borra expirados; `--ttl` ajusta el tiempo.
- **`roadmap:next --agent <X>`** ahora es consciente de locks: **salta** las features tomadas por OTRO agente (devuelve la siguiente libre); si todas estan tomadas, devuelve `needs_human_input`. Cada feature lleva `locked_by`.
- **`roadmap:audit`**: reporta locks expirados/huerfanos como warning (`orphan-lock`).
- **`roadmap:sync`** genera **`AGENT_BOARD.md`** (gitignored, regenerable): tablero por feature con fase, estado de prototipo y lock activo (agente + expiracion).
- `.gitignore`: `ai/locks/` + `AGENT_BOARD.md`. npm scripts en template + generador; `template:upgrade` los distribuye.

### Verificacion empirica

- claim 002 (codex) → `roadmap:next --agent claude` elige **003** (salta 002); `--agent codex` toma 002 (es suyo); release libera. AGENT_BOARD.md refleja el lock; ambos artefactos gitignored.
- `check:all` EXIT 0.

### Modelo

Es coordinacion **cooperativa** (no exclusion fuerte): los agentes respetan claim → trabajar → release; el TTL cubre caidas. `touch_policy` + `roadmap:audit` siguen siendo la red de seguridad post-hoc.

## v12.75.0
Repone los **comandos universales en la pestaña Acciones**. En v12.70 se quitaron del Roadmap indicando que vivian en Acciones, pero el catalogo de Acciones solo tenia validadores granulares + comandos de memoria; los compuestos (`check:project`, `roadmap:status`, `template:upgrade`) no estaban.

- **Nueva categoria "Comandos universales"** en Acciones > Ejecutar (se muestra primera), con: `check:project`, `check:all`, `roadmap:status`, `roadmap:next`, `roadmap:sync`, `template:upgrade` (dry-run).
- **`buildExecPlan` extendido**: ademas de `argv` (agente) y `ciScript` (ci/scripts/*.mjs), ahora soporta:
  - `scriptPath` → ejecuta un `scripts/*.mjs` con node (roadmap-status/next/sync, template-upgrade).
  - `npmScript` → ejecuta un compuesto npm (`npm run check:project`) con `npm.cmd` + shell en Windows.
- Los dos puntos de spawn (sync y streaming) usan `plan.cmd`/`plan.shell`. Estas ejecuciones se registran en `ai_action_runs` (aparecen en **Historial**) y, como sus action_id coinciden con `npmCommandToActionId` (p.ej. `check-project`), tambien alimentan los badges del contrato por fase.
- Verificacion: catalogo expone los 6 universales; `roadmap-status` (scriptPath) y `check-project` (npm composite) ejecutan OK via panel; client/server `node --check` OK; `check:all` EXIT 0.

## v12.74.0
Dos correcciones al visor de proyecto.

- **Visor a ancho completo al ocultar el arbol en pantalla completa**: la regla `#pane-files.fs-mode .files-layout` (mayor especificidad) mantenia la columna del arbol aunque estuviera oculto. Se agrega `#pane-files.fs-mode .files-layout.tree-collapsed { grid-template-columns:1fr; }` para que el contenido ocupe todo el ancho tambien en fullscreen.
- **Links del Markdown ahora funcionan**: los enlaces relativos dentro de un `.md` (p.ej. `docs/README.md`, `../fase-2-ux-ui/README.md`) ya no apuntaban a URLs muertas del server. Ahora un listener delegado en `#files-viewer` intercepta los clicks en `.md-body a`, resuelve la ruta relativa contra el archivo actual (`resolveRel` + `CURRENT_FILE`) y **abre el archivo destino en el propio visor**. Los enlaces externos (http/https/mailto/tel) y anclas (`#`) se respetan.
- Verificacion: `resolveRel` resuelve relativos / `..` / hermanos correctamente; client JS del panel (~82 KB) pasa `node --check`; `check:all` EXIT 0.

## v12.73.0
El visor de proyecto permite **contraer el arbol** (barra lateral) para que el contenido use todo el ancho.

- Boton **⮜ Ocultar arbol** / **⮞ Mostrar arbol** en la barra de la pestaña Proyecto: alterna la clase `tree-collapsed` en `.files-layout` (oculta `#files-tree` y el grid pasa a una sola columna `1fr`).
- Funciona tambien en modo pantalla completa (v12.72) — util para leer un archivo a ancho completo.
- Recordatorio: cada carpeta del arbol ya era colapsable individualmente (via `<details>`); esto colapsa el panel entero.
- Verificacion: boton + CSS presentes; client JS del panel (~81 KB) pasa `node --check`; `check:all` EXIT 0.

## v12.72.0
Modo **pantalla completa** para el visor de proyecto (pestaña "Proyecto" del panel `memory:serve`).

- Boton **⛶ Pantalla completa** en la barra de la pestaña Proyecto: expande el visor (arbol + contenido) a toda la ventana (`position:fixed; inset:0`), con el arbol y el contenido usando `calc(100vh - …)` para aprovechar todo el alto; el iframe de vista previa de HTML tambien crece.
- Sale con el mismo boton (texto cambia a "Salir de pantalla completa") o con **Esc**.
- `body.fs-lock` bloquea el scroll de fondo mientras esta activo.
- Verificacion: boton + CSS presentes; client JS del panel (~81 KB) pasa `node --check`; `check:all` EXIT 0.

## v12.71.0
Mejora el render del visor de proyecto (pestaña "Proyecto" del panel `memory:serve`). El render se hace en el servidor (vanilla, sin CDNs) y el cliente solo inyecta.

- **Markdown renderizado**: los `.md` se muestran como HTML real (headings, listas, tablas, code fences, inline code, bold/italic, links, blockquotes, hr) en vez de texto plano. Toggle **Fuente** para ver el crudo.
- **Resaltado de sintaxis**: código (.js/.ts/.json/.css/.go/.py/.java/.kt/...) con tokens coloreados (strings, comentarios, números, keywords) en una sola pasada line-local + números de línea. Keyword set generico multi-lenguaje.
- **Vista previa de HTML**: los `.html` (p.ej. prototipos) tienen toggle **Vista** que renderiza el archivo en un `<iframe sandbox="allow-scripts allow-same-origin">` (srcdoc), además de la fuente resaltada.
- **Botón Copiar** en todos los archivos de texto.
- Servidor: `mdToHtml()`, `hlLine()` (escapado seguro, tokens en spans `.hl-*`), `readFileForViewer` devuelve `kind: markdown|text|html` con `html`/`lines` pre-renderizados.

### Verificacion empirica

- README.md → `kind: markdown`, `<h1>...`; package.json → `kind: text` con spans `hl-str`; prototipo 001 → `kind: html`, 1491 lineas + content para preview.
- Client JS del panel (80 KB) pasa `node --check`. `check:all` EXIT 0.

## v12.70.0
Ajustes al front embebido (`memory:serve`).

### 1. Comandos consolidados en la pestaña Acciones

- La pestaña **Roadmap** ya no duplica "Comandos universales" ni "Comandos recientes ejecutados": esos viven en **Acciones** (subpestañas **Ejecutar** e **Historial**, que ya existian). El Roadmap ahora deja solo un acceso directo a Acciones.
- `loadRoadmap` deja de pedir `/api/roadmap/commands` (menos trabajo en cada carga).

### 2. Visor de proyecto (nueva pestaña "Proyecto")

- **Endpoints nuevos**: `GET /api/files/tree` (arbol del proyecto podado: ignora node_modules/.git/dist/build/coverage/target/*.db/etc., cap 6000 entradas, profundidad 12) y `GET /api/files/read?path=` (contenido de un archivo).
- **Guard de seguridad**: `read` resuelve la ruta bajo el cwd y rechaza cualquier path traversal (`../`) fuera del proyecto. Cap de 512 KB para texto, 2 MB para imagenes; sniff de binario (NUL en primeros 8 KB).
- **UI**: arbol colapsable (carpetas/archivos, con filtro por nombre) + visor a la derecha que muestra:
  - **texto** (.md, .js, .mjs, .ts, .json, .html, .css, .yaml, ...) con numeros de linea,
  - **imagenes** (.png/.jpg/.svg/.gif/.webp/.ico) renderizadas,
  - binario / demasiado grande → mensaje.
- Solo en modo live (`npm run memory:serve`).

### Verificacion empirica

- `/api/files/tree`: 48 entradas top-level, no truncado. `/api/files/read?path=README.md`: texto OK. Path traversal `../../../etc/passwd` → bloqueado.
- Client JS del panel (78 KB) pasa `node --check`. `check:all` EXIT 0.

## v12.69.0
Bloque C (cierre de la secuencia A→B→C): **estado vivo en los docs de fases 4-8** via auto-zones, reusando el mecanismo del Bloque A. Ahora las 9 fases tienen docs que dicen DONDE ESTAS.

- **`doc-autozones.mjs`**: nuevos builders + registro de 5 docs:
  - **04.00 → `sdd-trazabilidad`**: por feature, RF/HU → modelo BD → API contract → estado SDD (completo/parcial/pendiente).
  - **05.00 → `trace-coverage`**: estado de construccion (archivos de codigo + @trace).
  - **06.00 → `qa-estado`**: archivos de test + cobertura.
  - **07.00 → `release-readiness`**: release notes vinculadas + gate-deploy-ready.
  - **08.00 → `ops-readiness`**: runbooks vinculados + SLO + gate-operations-ready.
- **`roadmap:sync`** rellena las 9 zonas (fases 0,1,3,4,5,6,7,8). **`check-auto-zones`** escanea los 5 docs nuevos.
- Verificado: `roadmap:sync` actualiza 9 docs con estado real (fase 4 muestra 001/002 SDD completo, 003 parcial); `check:all` EXIT 0.

### Cierre de la serie "contrato de ejecucion en todas las fases"

| Fase | Estado vivo (auto-zone) | Contrato/gate |
|---|---|---|
| 0 | phase-progress, avance-real | — |
| 1 | cobertura-rf | — |
| 2 | semaforo prototipos (v12.62) | check:prototype-contract (v12.65) |
| 3 | baseline-estado | check:architecture-baseline (v12.68) |
| 4 | sdd-trazabilidad | check:bd/api-documented + openapi-coverage |
| 5 | trace-coverage | check:trace-coverage |
| 6 | qa-estado | check:test-documented |
| 7 | release-readiness | check:release-binding |
| 8 | ops-readiness | check:runbook-binding |

## v12.68.0
Bloque B: **baseline minimo de arquitectura (fase 3)** — el "minimo que todo proyecto debe tener" a nivel seguridad/calidad/SOLID/DDD/observabilidad/SLO/datos, como contrato verificable.

- **`ci/scripts/_lib/architecture-baseline.mjs`** (nuevo): 9 concerns NO negociables con deteccion evidence-based en `docs/fase-3-arquitectura/` (incl. adr/): seguridad (RBAC/authn/authz), gestion de secretos, modelo de amenazas/OWASP, calidad (testing+cobertura+lint), SOLID, DDD/capas/bounded contexts, observabilidad (logging/metricas/tracing), performance/SLO-SLI, datos/PII/retencion.
- **`ci/scripts/check-architecture-baseline.mjs`** (nuevo, bloqueante, en `check:project`): BLOQUEA si un concern esta completamente ausente. Si fase 3 no inicio (sin docs/fase-3), no aplica (OK).
- **`03.04-checklist-arquitectura.md` → auto-zone `baseline-estado`**: semaforo ✓/✗ por concern, autogenerado por `roadmap:sync`.
- **`phase-contracts.mjs` fase 3**: `debeValidar` += `check:architecture-baseline --strict`; `debeEntregar` += baseline cubierto.
- Verificado: template 9/9 concerns cubiertos; `check:all` EXIT 0.

## v12.67.0
Bloque A de "contrato de ejecucion en todas las fases": **estado vivo en los docs de fase 0 y 1** via auto-zones, para que cada doc diga DONDE ESTAS en vez de quedar estatico.

- **`ci/scripts/_lib/doc-autozones.mjs`** (nuevo): generaliza el relleno de zonas `<!-- auto:start name=X -->` a multi-archivo (antes solo AI_CONTEXT.md). Builders: `phase-progress`, `avance-real`, `cobertura-rf`. Reutilizable por el Bloque C (fases 4-8).
- **`00.02-roadmap.md` → zona `phase-progress`**: snapshot de las 9 fases (estado + detalle). *Saber en que parte estamos.*
- **`00.03-estimacion-tiempo-costo.md` → zona `avance-real`**: plan vs real (features, sin-faltantes, gates approved, fases completas, prototipos human-approved). *Mejor estimacion.*
- **`01.01-matriz-huecos-fase-1.md` → zona `cobertura-rf`**: cada RF/RNF/HU del TRACEABILITY_MATRIX cruzado con specs/ → cubierto / en progreso / hueco. *Saber que ya se cumplio.*
- **`roadmap:sync`** rellena las zonas (reusa el `status` que ya calcula; cero spawn extra). **`check-auto-zones`** ahora escanea los 3 docs (balance-only).
- Verificado: `roadmap:sync` actualiza los 3 docs con estado real; `check:all` EXIT 0.

## v12.66.0
Sincroniza el contrato de prototipo (v12.65) con el **front embebido** y la **BD inteligente**, sin tocar el panel: el contrato pasa a ser parte del estado visual del prototipo (fuente unica `prototype-state.mjs`).

### El cierre

- **`contractCompliance()`** (nuevo en `_lib/prototype-contract.mjs`): cumplimiento bloqueante reutilizable (sin seccion de contrato / RF del spec sin cubrir / estado declarado no implementado / estados sin interaccion).
- **`prototype-state.mjs`**: el peldaño `visible-product` ahora exige cumplir el contrato. Un prototipo rico y honesto pero que incumple su contrato se queda en `auto-quality` (🔴) con `blockedBy: "contrato: ..."`. Como `prototype-state` ya alimenta el semaforo CLI, el **panel embebido** (pestaña Roadmap) y `ROADMAP_STATE.json`, el contrato se refleja en los tres automaticamente.
- **Panel — comandos sugeridos fase 2**: se anaden `prototype:contract` y `check:prototype-contract` a las acciones clickeables.

### Lo que ya estaba sincronizado (v12.65, via mecanismos existentes)

- **Contrato por fase en el panel**: `check:prototype-contract` esta en `debeValidar` de fase 2, y `/api/roadmap/contract-status/2` lo cruza con `ai_action_runs` → aparece con badge ✓/⚠/✗ (que hacer vs que se ejecuto).
- **BD inteligente**: ejecutar el validador desde el panel se registra en `ai_action_runs`; el `## Contrato del prototipo` de `decisiones-ux.md` se indexa/embebe (buscable en Documentos/Busqueda).

### Verificacion empirica

- 001 sigue `human-approved` (🟢) — su contrato se cumple; el gate de contrato no lo degrada.
- Con contrato incompleto, `prototype-state` devuelve `auto-quality` (🔴) con la razon del gap → visible en semaforo CLI + panel.
- `npm run check:all` → EXIT 0.

## v12.65.0
Baja el "contrato de ejecucion" al nivel del **prototipo HTML5**. Hasta ahora los validadores comprobaban riqueza generica (conteos) + anti-trampa + clones, pero NINGUNO verificaba que el prototipo representara los requisitos especificos de SU feature. Un agente podia entregar un prototipo rico, limpio y human-approved que **omitia un RF** o **no mostraba un actor del spec**. v12.65 cierra esa grieta con un contrato por feature, declarativo y verificable.

### Contrato de prototipo por feature

- **`ci/scripts/_lib/prototype-contract.mjs`** (nuevo): fuente del contrato. Combina lo DERIVADO del `spec-funcional.md` (RFs/HUs + actores, no omitibles) con lo DECLARADO en `decisiones-ux.md > ## Contrato del prototipo` (Estados, Roles, Entidades, RF representados). Sinonimos de estados canonicos (loading/empty/error/success/unauthorized).
- **`ci/scripts/check-prototype-contract.mjs`** (nuevo, en `check:project`): valida por feature con prototipo:
  - **Bloquea**: sin seccion de contrato; un RF/RNF/HU del spec no declarado (`rf-not-in-contract`); un Estado declarado ausente en `index.html` (`state-not-implemented`); estados declarados sin interaccion (`non-interactive`).
  - **Warning**: actor del spec no declarado; rol/entidad declarado ausente en el HTML.
  - Salta features sin prototipo (coherente con los demas validadores).

### Comandos nuevos (analogos del roadmap, a nivel prototipo)

- **`npm run prototype:contract -- --feature <slug>`** — imprime que DEBE contener el prototipo (RF/actores del spec + contrato declarado + gaps de cobertura). Analogo de `roadmap:next`.
- **`npm run prototype:prompt -- --feature <slug> --agent <x>`** — renderiza un prompt "construye este prototipo a spec" (dominio + golden + contrato + touch_policy fase 2 + Definition of Done). Analogo de `roadmap:prompt`.

### Integracion

- `phase-contracts.mjs` fase 2: `debeValidar` incluye `check:prototype-contract --strict`; `debeEntregar` exige la seccion `## Contrato del prototipo`.
- `plantillas/fase-2-ux-ui/prototype-html5.md`: el pre-flight a copiar incluye el bloque `## Contrato del prototipo`.
- `001-bandeja-trabajo-expedientes`: declara su contrato (Estados loading/empty/error/success/unauthorized; Roles operador/supervisor/auditor; Entidad expediente; RF HU-02/RF-02/RNF-01/RNF-03) → template verde.
- Generador (`ai-framework-agent.mjs`) y `check:project` actualizados; `template:upgrade` lo distribuye via los globs existentes (ci/scripts, _lib, scripts/).

### Verificacion empirica

- `check:prototype-contract --strict` sobre 001: OK (cobertura completa + estados implementados via sinonimos).
- Prueba: declarar solo RF-02 (omitiendo HU-02) → bloquea `rf-not-in-contract`.
- `prototype:contract --feature 001 --format text`: muestra derivado + declarado + "cobertura completa".
- `npm run check:project`: 34 validadores fisicos, todos invocados; EXIT 0.
- `npm run check:all` → EXIT 0.

## v12.64.0
Cierra la brecha que impedia que las mejoras a archivos EXISTENTES llegaran a proyectos instanciados: `template:upgrade` solo AGREGABA lo faltante, nunca refrescaba lo que ya existia. Un proyecto creado en v12.60 que corria el upgrade recibia los scripts nuevos pero conservaba su `roadmap-next.mjs` / `phase-contracts.mjs` viejos — y por tanto no obtenia el contrato de ejecucion v12.63.

### `template-upgrade --force-framework` (opt-in)

- Detecta archivos **template-owned regenerables** que EXISTEN en el destino pero DIFIEREN del canonico: validadores `ci/scripts/*.mjs`, modulos `ci/scripts/_lib/*.mjs` y scripts de framework (`roadmap-*`, `scaffold-*`, `generate-*`, `template-upgrade`, `pre-flight-gate`).
- En dry-run los **reporta** (`framework outdated`); con `--force-framework` los **refresca** a la version canonica.
- Es **opt-in** (no pisa nada por sorpresa) y preserva customizaciones del usuario (package.json, specs/, docs propios). Comparacion por contenido normalizando EOL (CRLF/LF).
- Espeja el patron ya existente de `--force-scripts` (que solo cubria scripts npm pipeline).

### Verificacion empirica

- Dry-run contra un directorio temporal "instanciado": detecta solo el archivo outdated (`scripts/roadmap-next.mjs`), ignora el identico (`glob-match.mjs`), y solo refresca con `--force-framework`. (Validado en temp desechable; ningun proyecto real tocado.)
- `template-upgrade` sigue rechazando ejecutarse dentro del template canonico.
- `npm run check:all` → EXIT 0.

### Flujo recomendado para actualizar un proyecto instanciado

```bash
npm run template:upgrade -- --apply --force-scripts --force-framework
npm run memory:sync
npm run check:project
```

## v12.63.0
Convierte el roadmap operativo en un **contrato de ejecucion** auditable para agentes IA. El roadmap deja de "sugerir tareas" y pasa a **gobernar la ejecucion**: dice quien puede hacer la tarea, que rutas puede/no puede tocar, que debe entregar, que gate puede solicitar (no aprobar), y al final **audita** que el agente respeto el contrato. Todo derivado de una sola fuente (`phase-contracts.mjs`).

### Observaciones menores

- **`data-hub-link` en 001**: el `<a class="hub-link">` ahora lleva `data-hub-link` (el helper `shared-prototype-helpers.js` lo requiere). Cierra el warning de `check:prototype-bidirectional-links`.
- **release/runbook binding a ⚠ en modo normal**: `check-release-binding` y `check-runbook-binding` imprimen `⚠` (warning, no bloquea) cuando no hay `--strict`/`CHECK_STRICT=1`, reservando `✗` para modo estricto. Menos ruido visual en `check:project`.

### Fuente unica: `phase-contracts.mjs` extendido

Cada fase declara ahora campos **enforzables por maquina** (ademas de las 6 dimensiones en prosa):

- `role` / `allowedAgents` — perfil de agente recomendado/permitido (derivado, NO una taxonomia paralela).
- `touchAllow` / `touchForbid` — globs de rutas permitidas/prohibidas, con `<feature>` interpolado al slug real.
- `transition` — gate que el agente puede **solicitar** (`canApprove: false` — lo firma un humano).
- Helpers nuevos: `getTouchPolicy()`, `getAgentProfile()`, `getDefinitionOfDone()`, `getTransitionRequest()`.

### `roadmap:next` = contrato de ejecucion

El output ahora incluye (todo derivado del contrato de fase, sin duplicar):

- `touch_policy` (allowed_paths / forbidden_paths), `recommended_agent` / `allowed_agents`.
- `definition_of_done` (deliverables + checks), `transition_request`.
- `agent_readiness` ampliado: `ready_for_ai_with_constraints`, `needs_human_approval`, `blocked_by_dependency`, `blocked_by_missing_context`, … con `reason`.
- **Dependency-blocking**: parsea `## Dependencias` y marca `blocked_by_dependency` si una feature requerida no alcanzo su gate (default `gate-sdd-approved`).

### Comandos nuevos

- **`npm run roadmap:prompt`** (`scripts/roadmap-prompt.mjs`) — renderiza el contrato como prompt copy-paste para Codex/OpenCode/Claude/Gemini (`--agent`, `--out`). Solo formatea: la decision la toma `roadmap:next` (fuente unica).
- **`npm run roadmap:audit`** (`scripts/roadmap-audit.mjs`) — DESPUES de trabajar, verifica `git diff` vs el contrato de la fase. **Falla (exit 1)** si se toco un `forbidden_path` o si un gate quedo `approved` firmado por un revisor no-humano (cierra el lazo del anti-self-approval). Ediciones fuera de `allowed_paths` salen como warning. `touch_policy` sin audit es teatro — se entregan juntas.
- **`npm run check:roadmap-state`** — alias de `roadmap:sync --check` (verifica que `ROADMAP_STATE.json` no este stale).
- **`ci/scripts/_lib/glob-match.mjs`** (nuevo) — matcher de globs sin dependencias (`*`, `**`) para el audit.

### Verificacion empirica

- `roadmap:next` emite touch_policy interpolada + recommended_agent + DoD + transition_request.
- `roadmap:prompt --agent codex` renderiza el prompt completo con rutas permitidas/prohibidas.
- `roadmap:audit`: PASSED en working tree de fase 2; prueba negativa (auditar 001 como fase 5) → FAILED con `forbidden_path_modified` (exit 1).
- `release/runbook binding`: ⚠ + exit 0 en normal; ✗ + exit 1 con `--strict`.
- `npm run check:all` → EXIT 0.

### Diferido (no incluido — requiere multiagente concurrente real)

- locks `claim`/`release`, `AGENT_BOARD.md`, risk score, `roadmap:feature`, `context_pack` estructurado. Son P2/P3: utiles solo si se corren agentes en paralelo; quedan como evolucion futura opt-in.

## v12.62.0
Bloque 4 del plan de prototipado: el roadmap reporta el **estado visual de cada prototipo** como un semaforo de 5 peldaños y hace explicita la regla de avance **fase 2 → 3** (requiere revision visual humana aprobada). Cierra el ciclo iniciado en v12.60 (anti-trampa) y v12.61 (`_shared/` opt-in).

### Fuente unica: `_lib/prototype-state.mjs` (nuevo)

Calcula, por feature, el peldaño de una escalera donde cada nivel exige el anterior:

| Peldaño | Semaforo | Significado |
|---|---|---|
| `exists` | 🔴 | Existe el `index.html` pero no alcanza calidad automatica nivel 2. |
| `auto-quality` | 🔴 | Pasa nivel 2, pero falla anti-trampa (fixtures, sin golden, estados solo-texto). |
| `visible-product` | 🟡 | Pasa anti-trampa, pero aun sin seccion `## Revision visual humana`. |
| `human-review-pending` | 🟡 | Tiene la seccion, sin aprobar (pending/blocked). |
| `human-approved` | 🟢 | Aprobado por un humano real + Fecha + Evidencia revisada. |

- Replica de forma ligera las heuristicas de `check-html5-prototype-quality` y `check-prototype-visible-product` (es un INDICADOR; el gate autoritativo sigue siendo `check:project`). El peldaño `human-approved` SI es autoritativo: lee la misma evidencia que el validador anti-trampa.
- Coherente con v12.61: resuelve `<link>`/`@import` a CSS local (incl. `_shared/tokens.css`) para contar tokens — un prototipo portfolio-spa no aparece de baja calidad por mover el sistema de diseño a `_shared/`.

### Integracion en el roadmap

- **`roadmap-status.mjs`**: nueva seccion "Estado visual de prototipos (semaforo)" en la salida legible + `prototypeStates` en `--json`. `analyzePhase2` ahora marca la fase 2 como `complete` solo si todos los prototipos estan `human-approved` (regla 2→3). El detalle muestra `avance 2→3 habilitado/BLOQUEADO`.
- **`roadmap-next.mjs`**: en fase 2, decide segun el peldaño — si el prototipo es `exists`/`auto-quality`, recomienda MEJORARLO (ready_for_ai); si es `visible-product`/`human-review-pending`, pide REVISION VISUAL HUMANA (needs_human) y prohibe avanzar a fase 3. Cada feature lleva `prototype_state`.
- **`roadmap-sync.mjs`**: `ROADMAP_STATE.json` incluye `prototype_states` (schema bump a 12.62).
- **Front embebido (`memory-serve`)**: nueva tarjeta "🚦 Estado visual de prototipos" en la pestaña Roadmap — ladder con conteos por peldaño, lista por feature con su semaforo, y badge `avance 2→3 OK` / `2→3 bloqueado`. Se alimenta de `/api/roadmap/status` (sin endpoint nuevo).

### Documentacion

- **`docs/transversal/90.36-roadmap-metodologico.md`**: tabla del semaforo de 5 peldaños + regla de avance 2→3 + `gate-prototype-human-visual-review` y `check:prototype-visible-product` en la lista de gates/validadores de fase 2.

### Verificacion empirica

- Template: 001 = `human-approved` (🟢, revisor "Ana Torres"), 002/003 = `none` (sin prototipo). `phase2to3Ready: true`.
- Front embebido: client JS concatenado (76 KB) pasa `node --check`; `/api/roadmap/status` sirve `prototypeStates`.
- `npm run check:all` → EXIT 0.

## v12.61.0
Bloque 3 del plan de prototipado: arquitectura **`specs/_shared/` opt-in** (`--mode portfolio-spa`). Permite construir un portafolio multi-spec con sistema de diseño comun y sesion compartida, **sin** que compartir infraestructura dispare falsos clones ni falso nivel 0 en los validadores. El default sigue siendo `standalone` (prototipo autocontenido).

### Infraestructura compartida (nueva, opt-in)

- **`specs/_shared/tokens.css`**: sistema de diseño de bajo nivel — paleta neutra + semantica, tipografia, espaciado (escala 4px), radios, sombras, breakpoints, soporte dark-scheme, y primitivas utilitarias (`.u-btn`, `.u-card`, `.u-badge`, `.u-toast`, `.u-modal`, skeleton/empty/error). 70 tokens + 3 media queries. Cada spec sobrescribe `--brand-h` en su `<style>`.
- **`specs/_shared/mock-api.js`** (`window.MockApi`): API simulada de bajo nivel — latencia (PRNG determinista), inyeccion de error para demo de estados, CRUD en memoria (`resource(records)`). **No** trae datos de dominio.
- **`specs/_shared/app-state.js`** (`window.AppState`): estado/sesion respaldado en **localStorage** (sobrevive navegacion cross-spec con `target=_blank` — sessionStorage no se comparte entre ventanas nuevas), pub/sub cross-tab via evento `storage`, helpers de sesion (login/role/demo-mode).
- **`specs/_shared/ui.js`** (`window.UI`): primitivas transversales — toast, modal, skeleton/empty/error, formateadores (currency/number/date/relativeDate), azucar de DOM. **No** define layout de dominio.
- **`specs/_shared/README.md`**: guia de cuando usar `_shared/`, regla anti-trampa, y como lo ven los validadores.
- Todos son **classic scripts** (sin import/export, `window` globals) compatibles con `file://`.

### Regla anti-trampa reforzada

`_shared/` solo admite **helpers de bajo nivel**. Sigue prohibido un *renderer generico unico* que defina todo el dominio (`mini-app`/`app-renderer`/`ui-factory`/`render-all`/`app-shell`) — ya bloqueado por `check-prototype-visible-product.mjs`. Cada spec construye su propia UI de dominio.

### Ajustes obligatorios en validadores (tensiones A y B)

- **Tension A — `check-prototype-diversity.mjs`**: `hashStructure()` ahora **excluye** las lineas `<link>`/`<script>`/`@import` que apuntan a `_shared/`. Compartir infraestructura ya no cuenta como clonar el dominio (evita falsos `clone-structure`).
- **Tension B — `check-html5-prototype-quality.mjs`**: `resolveLinkedCss()` resuelve `<link rel=stylesheet>` y `@import` a CSS **local** (incluido `_shared/tokens.css`) y **suma sus tokens + media queries** al grading. Mover el sistema de diseño a `_shared/` **no baja** el nivel (evita falso nivel 0).

### Scaffold y sincronizacion

- **`scaffold-prototype.mjs --mode portfolio-spa`**: inyecta los `<link>`/`<script src>` a `_shared/` en el `<head>` (idempotente). Default `standalone`. Valida que `specs/_shared/` exista (si no, sugiere `template:upgrade:apply`).
- **`template-upgrade.mjs`**: ahora sincroniza `specs/_shared/` (safe-to-copy si falta) — sin esto, los proyectos instanciados no podrian usar `portfolio-spa`.

### Verificacion empirica

- `check-html5-prototype-quality` sobre prototipo portfolio-spa de prueba: resuelve `../../_shared/tokens.css`, cuenta **99 tokens + 4 media queries** (26 inline golden + 70 shared + override) -> **nivel 3**. El `<script src>` local NO dispara B-CDN.
- `check-prototype-diversity`: las referencias a `_shared/` se excluyen del hash de estructura.
- Template canonico sigue verde (001 usa tokens inline, sin `_shared/` -> comportamiento sin cambios).

### Pendiente

- **v12.62 — Bloque 4**: roadmap reporta estado visual de 5 fases (exists -> auto-quality -> visible-product -> human-review-pending -> human-approved) + semaforo en front embebido. Avance fase 2->3 requiere `gate-prototype-human-visual-review: approved`.

## v12.60.0
Convierte el prototipado HTML5 de "gate de archivos" a **gate de producto visible**. Cierra la grieta donde un agente podia "declarar nivel 3" pasando conteos estaticos (inflables con fixtures ocultos) sin que el prototipo fuera producto real. Bloque 1+2 del plan de mejora de prototipado.

### El problema cerrado

El quality-checker mide lineas/tokens/vistas — un agente puede inflar esas metricas con `<template hidden>`, `.validation-only`, `display:none` con records. Y `check-html5-prototype-quality` estaba **excluido de check:project** (per-spec), asi que check:project pasaba aunque el prototipo fuera pobre. Habia contradiccion: traceability.md decia "nivel 3" pero el humano veia algo que no parece producto.

### Bloque 1 — Cerrar la grieta de validacion

- **`ci/scripts/check-prototype-visible-product.mjs`** (nuevo, ANTI-TRAMPA). Bloquea:
  - `<template hidden>` con señales de fixture/validacion.
  - Clases `.validation-only` / `.test-fixture` / `.metrics-filler` / `.validation-fixture`.
  - Bloques `display:none`/`visibility:hidden`/`opacity:0` con >=3 records (inflado de mockRecords).
  - `decisiones-ux.md` SIN "Golden de referencia".
  - Estados UI solo-texto (loading/empty/error mencionados pero SIN interaccion real: addEventListener/onclick/data-view).
  - Renderer generico unico (mini-app/app-renderer/ui-factory/app-shell) — anti shell-clon.
  - **Anti self-approval**: `prototype-validation.md` con `Resultado: approved` requiere Revisor que NO sea agente/IA/claude/gpt/codex/etc., Fecha real, y Evidencia revisada con path.
- **`check:prototype-portfolio`** (nuevo composite): `check:prototype-html5 --strict` + `check:prototype-visible-product --strict`. **Metido en `check:project`** (ahora 24 validadores). Como el quality-checker SALTA specs sin prototipo, no rompe features tempranas.
- **`check-validation-coverage` mejorado**: `expandComposite()` resuelve scripts compuestos (check:prototype-portfolio -> sus constituyentes) para que el meta-validador vea los validadores reales.

### Bloque 2 — Gate visual humano real

- **Gate nuevo `gate-prototype-human-visual-review`** en `phase-contracts.mjs` (fase 2). Separado del `gate-html5-product-quality` automatico. El validador automatico NO aprueba UX por si solo.
- **`prototype-validation.md`** (plantilla + scaffold-feature + ejemplo 001) con seccion obligatoria `## Revision visual humana` (Revisor / Fecha / Resultado / Comentarios / Evidencia revisada).
- **`phase-contracts.mjs` fase 2 actualizado**:
  - `debeValidar` incluye `check:prototype-html5 --strict`, `check:prototype-visible-product --strict`, domain-mismatch, bidirectional-links, diversity, gates-mentioned.
  - `noPuede` agrega: no usar fixtures ocultos, no declarar nivel 3 sin revision humana, no usar renderer generico unico.
  - `gates` agrega `gate-prototype-human-visual-review`.
- **`ai/commands/prototype-command.md`**: regla nueva — "si el humano dice que se ve pobre/generico/no-producto, es BLOQUEO de gate, no preferencia estetica". + 3 anti-rationalizations nuevas (validador no aprueba UX, no fixtures, no self-approval).

### Verificacion empirica

- `check-prototype-visible-product` sobre template: OK (001 tiene revision humana + golden).
- `check-html5-prototype-quality --strict` sobre 001: nivel 3 APROBADO.
- Prueba negativa: prototipo con `.validation-only` + `display:none` con 4 records -> validador detecta `forbidden-class` + `hidden-mock-records` (bloquea).
- `check:project` completo: exit 0, 21 OK lines, con el nuevo gate portfolio integrado.

### Comparativa v12.59 -> v12.60

| Metrica | v12.59 | v12.60 |
|---|---:|---:|
| Validadores en `check:project` | 23 | **24** (+prototype-portfolio composite) |
| Validador anti-trampa de prototipos | ⊘ | ✅ check-prototype-visible-product |
| `check-html5-prototype-quality` en check:project | ⊘ (per-spec aislado) | ✅ via check:prototype-portfolio --strict |
| Gate visual humano | ⊘ | ✅ gate-prototype-human-visual-review |
| Anti self-approval (revisor IA bloqueado) | ⊘ | ✅ |
| Seccion '## Revision visual humana' obligatoria | ⊘ | ✅ plantilla + scaffold + 001 |

### Pendiente (Bloques 3 y 4, segun confirmacion del usuario)

- **v12.61 — Bloque 3**: arquitectura `specs/_shared/` opt-in (`--mode portfolio-spa`): tokens.css + mock-api.js + app-state.js + ui.js. Requiere primero: (a) ajustar `check-prototype-diversity` para excluir `_shared/` del hash, (b) ajustar `check-html5-prototype-quality` para contar tokens de `_shared/*.css` via `<link>`/`@import`. Sin esos 2 ajustes, mover a `_shared/` daria falsos clones + falso nivel 0.
- **v12.62 — Bloque 4**: roadmap reporta estado visual de 5 fases (exists -> auto-quality -> visible-product -> human-review-pending -> human-approved) + semaforo en front embebido. Avance fase 2->3 requiere `gate-prototype-human-visual-review: approved`.

## v12.59.0
Cierra los 4 ajustes del feedback de revision + alinea el roadmap con la BD inteligente (cruce "que hacer" vs "que se ejecuto").

### Los 4 ajustes del feedback

1. **`CHECK_STRICT=1` ahora funciona en TODOS los validadores** (antes solo `--strict`):
   - Nuevo modulo `ci/scripts/_lib/strict-mode.mjs` con `resolveStrict(args, default)`.
   - Resuelve strict desde: `--warn` (override a false) > `--strict` > `CHECK_STRICT=1|true|yes` (env) > default.
   - Aplicado a los 13 validadores con patron strict. Verificado: `CHECK_STRICT=1 npm run check:release-binding` ahora devuelve `exit 1` (antes 0).

2. **`pre-flight-gate --mode template|instantiated`** con auto-deteccion:
   - Detecta template canonico si `package.json.name` contiene "project-template" o existe `stacks/<x>/template/`.
   - En modo template: tolera tokens scaffolding (`Wakaya ERP`) en `stacks/` y blockers de specs ejemplo.
   - Verificado: pre-flight pasa **5/5** sobre el template (antes fallaba 2/5 con falsos positivos).

3. **Gates legacy migrados a formato canonico v12.56**:
   - `specs/001-bandeja-trabajo-expedientes/traceability.md` migrado de 3 cols a 5 cols (`Gate | Estado | Aprobador | Fecha | Evidencia`).
   - `check:gate-status-format` ahora pasa OK en el template.

4. **Limpieza de artefactos de compilacion del ZIP**:
   - `.gitignore` +6 patrones: `bin/main/`, `bin/test/`, `*.class`, `out/`, `.classpath`, `.project`, `.settings/`.
   - Eliminados artefactos reales: `stacks/{java-monolith,quarkus-angular}/template/.../target/`, `stacks/spring-react/template/backend/bin/`.

### Roadmap alineado con BD inteligente (la pregunta clave)

**Nuevo endpoint `/api/roadmap/contract-status/<phase>`**: cruza el `debeValidar` del contrato de cada fase con `ai_action_runs` (la BD inteligente). Muestra **que hacer** (comandos del contrato) + **un check de que se ejecuto** (desde la BD):
- `npmCommandToActionId()` mapea `npm run check:X` -> action_id `check-X`, `npm run memory:sync` -> `sync-memory`, etc.
- Por cada comando: `passed` (ejecutado OK), `failed` (ejecutado pero exit != 0), `never` (sin registro en BD).

**UI en panel embebido**: la seccion "Debe validar" del contract-panel (pestaña Roadmap > click phase-card) ahora muestra por comando:
- ✓ **ejecutado** (verde) con tooltip del timestamp
- ⚠ **fallo** (ambar) con exit code
- ✗ **nunca** (gris)
- Resumen: "Validaciones ejecutadas: N/M pasaron (segun BD ai_action_runs)".

**Verificado E2E**: `check-gates-mentioned` paso de ✗ never -> ✓ passed tras ejecutarse via panel; summary actualizado 1/5.

### Pendientes cerrados (de listas v12.57/v12.58)

| Item | Estado |
|---|:-:|
| `scaffold-prototype --replace-mock` (placeholders) | ✅ implementado (10 placeholders verificados) |
| Dependencias entre features | ✅ ya estaba (check-feature-dependencies v12.57) |
| `ROADMAP_STATE.json` en raiz | ✅ `npm run roadmap:sync` genera 6.5KB; gitignored |
| `check-phase-contract.mjs` | ✅ ya estaba (v12.58) |
| `roadmap:next --auto-fix` | ✅ implementado (sugiere fixes seguros sin auto-ejecutar) |
| AGENTS.md canoniza contrato por fase | ✅ seccion "Contrato de ejecucion por fase" con 6 dimensiones + referencias a 90.37 |

### Fix critico: `template-upgrade` sincroniza `ci/scripts/_lib/`

Bug encontrado al aplicar a casos reales: `template-upgrade` NO copiaba el subdirectorio `ci/scripts/_lib/` (modulos compartidos: strict-mode, ignore-paths, feature-filter, project-config, phase-contracts). Sin estos, los validadores nuevos crasheaban en proyectos viejos. **Resuelto**: nueva deteccion + copia de `_lib/*.mjs`.

### Medicion cuantitativa de mejora (casos reales)

| Caso | Validadores OK antes | Despues del upgrade completo |
|---|:-:|:-:|
| gemini | 14 | **22** ✓ (+8) |
| opencode | 0 | upgradeado (corta en 1 validador especifico de su contenido) |
| codex | — | perdio package.json entre sesiones (reset externo); no aplicable |

Upgrade aplicado con: `template:upgrade --apply --force-scripts --migrate-gates --fix-bidirectional`. En gemini: 12 prototipos con link bidireccional corregido, _lib sincronizado.

### Comparativa v12.58 -> v12.59

| Metrica | v12.58 | v12.59 |
|---|---:|---:|
| Modulos `_lib/` compartidos | 4 | **5** (+strict-mode) |
| Endpoints `/api/roadmap/` | 6 | **7** (+contract-status) |
| `CHECK_STRICT=1` env respetado | ⊘ | ✅ 13 validadores |
| `pre-flight-gate` modo template | ⊘ falso positivo | ✅ auto-detect, 5/5 |
| Roadmap cruzado con BD ai_action_runs | ⊘ | ✅ contract-status |
| `template-upgrade` sincroniza `_lib/` | ⊘ (bug) | ✅ |

## v12.58.0
Cierra el ultimo gap del plan "Roadmap operativo para agentes IA": el **contrato de ejecucion por fase** con las 6 dimensiones (puede / no puede / debe leer / debe actualizar / debe validar / debe entregar). El roadmap ya no solo dice "donde estamos" — ahora dice "que puede hacer el agente AQUI sin romper el metodo".

### TL;DR

- **`ci/scripts/_lib/phase-contracts.mjs`** (nuevo): fuente UNICA DE VERDAD con las 9 fases × 6 dimensiones. Exporta `getPhaseContract(id)`, `getAllPhaseContracts()`, `renderContractMarkdown(id)`.
- **`docs/transversal/90.37-contrato-por-fase.md`** (nuevo): doc canonica generada desde la fuente con indice rapido + ejemplos completos de fase 0 y 2.
- **`roadmap:next`** ahora incluye `phase_contract` en su JSON output (las 6 dimensiones de la fase actual).
- **2 endpoints API nuevos**: `/api/roadmap/contract` (todas las fases) y `/api/roadmap/contract/<id>` (una fase).
- **UI front embebido**: click en cualquier phase-card del pane Roadmap abre panel con las 6 dimensiones en grid color-coded.
- **`check-phase-contract.mjs`** (nuevo validador): verifica que una feature en fase N tenga los artefactos del `debeActualizar` del contrato.

### Cambios

#### Phase A — Fuente unica de verdad

`ci/scripts/_lib/phase-contracts.mjs` define las 9 fases (0 a 8) con esta estructura por fase:

```javascript
{
  id: 2,
  name: "UX/UI (HTML5-first + SPDD)",
  objective: "Validar experiencia con prototipos navegables antes de construir.",
  puede: [...],         // acciones permitidas
  noPuede: [...],       // acciones prohibidas
  debeLeer: [...],      // archivos a leer ANTES
  debeActualizar: [...], // archivos a producir/modificar
  debeValidar: [...],   // comandos npm a ejecutar
  debeEntregar: [...],  // evidencia para avanzar
  gates: [...]          // gates de la fase
}
```

3 helpers: `getPhaseContract(id)`, `getAllPhaseContracts()`, `renderContractMarkdown(id)`.

#### Phase B — Doc canonica

`docs/transversal/90.37-contrato-por-fase.md` con:
- Indice rapido (9 fases × objetivo × gates)
- Como leer cada contrato (6 dimensiones explicadas)
- Ejemplos completos de Fase 0 y Fase 2
- Como un agente debe usar el contrato (flujo paso a paso)

#### Phase C — `roadmap:next` con phase_contract

```bash
$ npm run roadmap:next
{
  "next_action": "Generar prototipo HTML5 para specs/002-...",
  "feature": "002-cambio-estado-expediente",
  "phase": 2,
  "agent_readiness": "ready_for_ai",
  "allowed_actions": [...],
  ...,
  "phase_contract": {        ← NUEVO en v12.58
    "id": 2,
    "name": "UX/UI (HTML5-first + SPDD)",
    "puede": [...],
    "noPuede": [...],
    "debeLeer": [...],
    ...
  }
}
```

El agente ahora recibe el contrato completo en cada llamada — sin tener que consultar doc por separado.

#### Phase D — API endpoints

- `GET /api/roadmap/contract` → array con los 9 contratos.
- `GET /api/roadmap/contract/<id>` → contrato de la fase especifica (404 si fase no existe).

Implementacion con `import()` dinamico (no-bloqueante en handler no-async).

#### Phase E — UI front embebido

Click en cualquier `phase-card` del pane Roadmap → carga `/api/roadmap/contract/<id>` → renderiza panel con:

```
┌──────────────────────────────────────────────────────────┐
│ Contrato de ejecucion — Fase 2  UX/UI (HTML5-first + SPDD)│
│ Objetivo: Validar experiencia con prototipos navegables...│
│                                                            │
│ ✓ Puede hacer (verde)    │ ✗ NO puede hacer (rojo)        │
│ 📖 Debe leer (azul)      │ ✏ Debe actualizar (naranja)    │
│ 🔍 Debe validar (morado) │ 📤 Debe entregar (cyan)        │
│                                                            │
│ Gates: gate-prototype-ready, gate-spdd-approved...        │
└──────────────────────────────────────────────────────────┘
```

CSS dedicado (~25 lineas): `.contract-card`, `.contract-grid`, `.contract-section.{allowed,forbidden,read,update,validate,deliver}` con borde lateral color-coded.

#### Phase F — Validador `check-phase-contract.mjs`

- Infiere la fase actual de cada feature desde gates approved en `traceability.md`.
- Verifica que existan los archivos referenciados en `debeActualizar` del contrato (heuristica: paths con `<feature>` placeholder).
- Reporta warning (no bloqueante por default — el contrato es guia, no mandato rigido).
- Modo `--strict` para CI estricto.
- Soporta `--feature X` para validar una sola feature.

#### Phase G — Wire

- `check:project` ahora ejecuta **24 validadores** (vs 23 en v12.57, +1 phase-contract).
- 1 npm script nuevo: `check:phase-contract`.
- Generador propaga al package.json de proyectos generados.

### Comparativa v12.57 → v12.58

| Metrica | v12.57 | v12.58 |
|---|---:|---:|
| Validadores en `check:project` | 23 | **24** (+phase-contract) |
| Modulos `_lib/` compartidos | 3 | **4** (+phase-contracts) |
| Scripts npm | ~67 | **~68** (+check:phase-contract) |
| Endpoints `/api/roadmap/` | 4 | **6** (+contract, +contract/<id>) |
| Contrato canonico por fase | ⊘ | ✅ 9 fases × 6 dimensiones |
| Doc del contrato | ⊘ | ✅ `90.37-contrato-por-fase.md` |
| Visualizacion en panel | ⊘ | ✅ click phase-card abre contrato |
| `roadmap:next` incluye contract | ⊘ | ✅ campo `phase_contract` en JSON |
| Validador `check:phase-contract` | ⊘ | ✅ verifica `debeActualizar` |

### Estado del plan original "Roadmap operativo para agentes IA"

| # | Entrega | Estado |
|:-:|---|:-:|
| 1 | `roadmap:next` | ✅ v12.56 |
| 2 | `gate_status` enum | ✅ v12.56 |
| 3 | `agent_readiness` | ✅ v12.56 |
| 4 | Excluir 000-ejemplo-feature | ✅ v12.56 |
| 5 | Config `source_dirs/test_dirs/ignore_dirs` | ✅ v12.56/v12.57 |
| 6 | `ROADMAP_STATE.json` (`roadmap:sync`) | ✅ v12.57 |
| 7 | Fase 7/8 vinculacion estricta | ✅ v12.57 |
| 8 | Dependencias entre features | ✅ v12.57 |
| 9 | Pre-flight gate obligatorio | ✅ v12.57 |
| 10 | **Contrato por fase (puede/no puede/debe leer/actualizar/validar/entregar)** | ✅ **v12.58** |
| + | Contrato visible en front embebido | ✅ **v12.58** |

**Plan original 100% completo**. El roadmap dice "donde estoy" Y "que puedo hacer aqui sin romper el metodo".

### Validacion empirica

```bash
$ curl /api/roadmap/contract/2
{ "id": 2, "name": "UX/UI...", "puede": [...], "noPuede": [...], ... }

$ npm run roadmap:next | grep phase_contract
"phase_contract": { "id": 2, "name": "UX/UI...", ... }

$ npm run check:project
# 24 validadores ejecutados (incluyendo check:phase-contract).

# UI panel embebido:
$ npm run memory:serve --auto-port
# click pestaña Roadmap → click cualquier phase-card → panel con 6 secciones aparece.
```

## v12.57.0
Cierre operativo del roadmap. Pasa de "validadores existen" a **"agente está obligado a ejecutarlos antes de cerrar"**. Resuelve el problema raíz de codex/opencode/gemini donde los validadores estaban pero los agentes los saltaban.

### TL;DR

- **`pre-flight-gate.mjs` (nuevo)**: comando único `npm run pre-flight-gate` que ejecuta los 5 checks críticos antes de declarar la sesión completa. Strict por default (exit 1 si cualquier check falla).
- **`roadmap:sync` (nuevo)**: genera `ROADMAP_STATE.json` en raíz del proyecto. JSON versionado consumible por CI / dashboards / Backstage.
- **3 validadores nuevos** en `check:project`:
  - `check-release-binding` — releases sin vinculación a RF/HU/feature.
  - `check-runbook-binding` — runbooks sin SLO numérico o sin matchear feature slug.
  - `check-feature-dependencies` — ciclos y dependencias rotas entre features.
- **Fase 7/8 estrictas en `roadmap-status`**: solo "complete" si hay release notes vinculadas + `gate-deploy-ready: approved`; runbooks vinculados + SLO + `gate-operations-ready: approved`.
- **`template-upgrade --fix-bidirectional`**: autocorrige hrefs hub↔spec con depth incorrecta + agrega `data-hub-link` si falta.
- **`_lib/project-config.mjs` (nuevo)**: lee `template.config.json > roadmap` con defaults. Centraliza `source_dirs`/`test_dirs`/`ignore_dirs`/`exclude_feature_globs`.

### Bloques de la release

#### Bloque 1 — Enforcement

- **`scripts/pre-flight-gate.mjs`** (~200 líneas): 5 checks sequenciales:
  1. `npm run check:project` (los 22 validadores).
  2. `check-template-instantiation --mode instantiated`.
  3. `roadmap-status` (debe NO tener blockers).
  4. `SESSION_LOG.md` con entrada en últimos 7 días.
  5. `check-auto-zones` (zonas AI_CONTEXT íntegras).
  
  Output tabular con `✓ PASS / ✗ FAIL` por check + tail del error + fix sugerido. Modos `--strict` (default), `--warn`, `--json`, `--skip-memory`.

- **Bug fix Windows**: `shell:true` corrompe paths con espacios en `process.execPath`. Ahora `shell:true` SOLO se usa con `npm`/`npm.cmd`.

#### Bloque 2 — Fase 7/8 con vinculación estricta

- **`ci/scripts/check-release-binding.mjs`** (nuevo): cada `.md` en `releases/` o `ops/release-notes/` debe mencionar al menos un `RF-NN`/`HU-NN` o un slug de feature real. Opt-out con frontmatter `kind: bootstrap`.

- **`ci/scripts/check-runbook-binding.mjs`** (nuevo): cada runbook debe cumplir 3 criterios:
  1. Nombre del archivo matchea un slug de feature real (`<NNN-slug>-runbook.md` o `<NNN-slug>.md`).
  2. Menciona RF/HU/RNF.
  3. Contiene SLO numérico (regex: `(p9[59]|latenc|disponib|uptime|throughput)\s*(<=?|>=?|=)\s*\d+`).
  
  Opt-out con frontmatter `kind: transversal` para runbooks cross-cutting (auth, observability, infra).

- **`scripts/roadmap-status.mjs` Fase 7 enhanced**: solo "complete" si `releaseNotesValid > 0 && gate-deploy-ready approved > 0`. Antes bastaba con `releases/` existir.

- **`scripts/roadmap-status.mjs` Fase 8 enhanced**: solo "complete" si TODOS los runbooks están vinculados + tienen RF + tienen SLO + `gate-operations-ready approved > 0`. Función helper `countApprovedGates()` soporta formato canónico v12.56 y legacy.

#### Bloque 3 — Configuración completa

- **`ci/scripts/_lib/project-config.mjs`** (nuevo): helper `loadProjectConfig(rootDir)` con `DEFAULT_PROJECT_CONFIG`. Merge con `template.config.json > roadmap` user-defined. Schema versionado.

- **Schema canónico `template.config.json`**:
  ```json
  {
    "roadmap": {
      "source_dirs": ["src", "backend", "frontend", "apps", "libs", "services"],
      "test_dirs": ["tests", "qa/automated", "backend/src/test", "frontend/src"],
      "ignore_dirs": ["stacks/**/template"],
      "exclude_feature_globs": ["000-*"]
    }
  }
  ```

#### Bloque 4 — Dependencias entre features

- **Nueva sección canónica `## Dependencias`** en `specs/<feature>/traceability.md`:
  ```markdown
  | De → A | Tipo | Motivo |
  |---|---|---|
  | 004-control-parental → 003-perfiles | requires | Necesita perfil familiar activo |
  | 004-control-parental → 001-catalogo | uses-api | Consume GET /api/catalogo |
  ```

- **`ci/scripts/check-feature-dependencies.mjs`** (nuevo): valida:
  1. Tipos válidos: `requires`, `uses-api`, `shares-bd`, `extends`.
  2. Feature destino existe en `specs/`.
  3. No hay self-loops (A → A).
  4. No hay ciclos (A → B → A en N pasos) — DFS con detección de ciclos.

#### Bloque 5 — ROADMAP_STATE.json + JSON estable

- **`scripts/roadmap-sync.mjs`** (nuevo): combina `roadmap-status --json` + `roadmap-next` + dependencias parseadas en un solo `ROADMAP_STATE.json` en raíz. Modos: default (escribe), `--dry-run` (imprime), `--check` (exit 2 si desactualizado).

- **Schema versionado del JSON**: `{ version: "12.57", generated_at, project, template_version, phases[], features[], dependencies[], blockers[], next_action }`. Cambios futuros bumpean version.

#### Bloque 6 — Autocorrección

- **`template-upgrade --fix-bidirectional`** (nuevo flag): reescribe automáticamente:
  - `href="../../../../prototype/index.html"` (4+ niveles) → `../../../prototype/index.html`
  - `href="../../prototype/index.html"` (2 niveles) → `../../../prototype/index.html`
  - `href="/prototype/index.html"` (absoluto) → `../../../prototype/index.html`
  - Agrega `data-hub-link` si el `<a>` no lo tiene.
  
  Idempotente. Reporta cantidad de archivos modificados.

### Comparativa v12.56 → v12.57

| Métrica | v12.56 | v12.57 |
|---|---:|---:|
| Validadores en `check:project` | 20 | **23** (+3: release-binding, runbook-binding, feature-dependencies) |
| Módulos `_lib/` compartidos | 2 | **3** (+project-config) |
| Scripts npm | ~58 | **~67** (+9: pre-flight-gate, roadmap:sync, 3 check:*, 2 generadores) |
| Comando `pre-flight-gate` | ⊘ | ✅ strict por default |
| `ROADMAP_STATE.json` regenerado | ⊘ | ✅ `npm run roadmap:sync` |
| Autocorrección de bidirectional links | ⊘ | ✅ `--fix-bidirectional` |
| Fase 7 con vinculación a RF | ⊘ (falso positivo) | ✅ requiere `gate-deploy-ready: approved` |
| Fase 8 con SLO real | ⊘ (falso positivo) | ✅ requiere SLO numérico + binding |
| Schema `feature_dependencies` | ⊘ | ✅ `## Dependencias` en traceability |

### Validación empírica v12.57

- **`pre-flight-gate --warn` contra template canónico**: 3/5 PASS (esperado: template canónico tiene tokens scaffolding intencionales en `stacks/`).
- **`roadmap-status` Fase 7/8**: ahora reporta `PARCIAL` con detalle "0 gates approved" en vez de `COMPLETA` falso positivo.
- **`roadmap:sync --dry-run`**: genera JSON con shape v12.57 + dependencies array.
- **`check:project`**: 23 validadores ejecutados.

### Lo que NO entró en v12.57 (postpuesto a v12.58)

- **`scaffold-prototype --replace-mock`**: requiere lógica adicional para extraer textos visibles de cada golden y mapearlos a placeholders. Flag se acepta pero NO aplica reemplazo aún.
- **`check-phase-contract.mjs`** (validador opt-in que verifica una feature cumple su contrato de fase). El contrato existe en `90.36-roadmap-metodologico.md` pero su enforcement automatizado se posterga.
- **`roadmap:next --auto-fix`**: requiere análisis case-by-case para distinguir "fixes seguros" de "fixes que requieren decisión humana". Postpuesto.
- **AGENTS.md canonizar contrato por fase**: el contrato vive hoy en `90.36`. Mover a AGENTS.md requiere reorganización mayor del archivo (180 líneas).

## v12.56.0
Release que cierra los **5 problemas estructurales** vistos en codex/opencode/gemini + entrega el **roadmap operativo para agentes IA**. Una sola entrega consolidada (P1 del plan acordado).

### TL;DR

- **5 validadores nuevos** en `check:project` (ahora 20 validadores) cierran los 5 problemas reales: mock data del golden no adaptado, links bidireccionales rotos, prototipos fuera de `specs/`, zonas auto corrompidas, gates con formato ambiguo.
- **`roadmap:next` (nuevo)** — comando que devuelve la siguiente accion segura para el agente en JSON estructurado con `agent_readiness`, `allowed_actions`, `forbidden_actions`, `must_read`, `commands_to_run`, `exit_criteria`.
- **2 modulos `_lib`** compartidos eliminan inconsistencias entre validadores (ignore-paths + feature-filter).
- **`template-upgrade --migrate-gates`** automatiza migracion del formato Gates v12.20 (3 cols) a v12.56 (5 cols con enum estricto).
- **Panel embebido** ahora muestra la "Siguiente accion segura" prominente con readiness color-coded.
- **Excluye `000-*-feature`** del calculo del roadmap por convencion (frontmatter `roadmap: ignore` o glob).

### Cambios

#### Phase A — Modulos compartidos

- **`ci/scripts/_lib/ignore-paths.mjs`** (nuevo): lista canonica `DEFAULT_IGNORE_DIRS` (target/, bin/, build/, dist/, coverage/, node_modules/, etc.) + `DEFAULT_IGNORE_EXTENSIONS` (.class, .pyc, .jar, .map) + `DEFAULT_IGNORE_ROOT_NOEXT` (node, npm, yarn vacios en raiz) + `DEFAULT_IGNORE_PATH_PATTERNS` (regex). Lee override desde `template.config.json > roadmap.ignore_dirs`. Helper `shouldIgnorePath()` + `collectFilesFiltered()`.
- **`ci/scripts/_lib/feature-filter.mjs`** (nuevo): excluye `000-*` por default + features con frontmatter `roadmap: ignore` o `example: true`. Lee override desde `template.config.json > roadmap.exclude_feature_globs`. Helpers `listIncludedFeatures()`, `listAllFeatures()`, `isFeatureExcluded()`.

#### Phase B — 5 validadores nuevos

1. **`check-prototype-domain-mismatch.mjs`**: detecta strings caracteristicos del golden origen (extraidos del marker `<!-- scaffold-prototype: golden=X -->`) que sobrevivieron en otro spec. Catalogo de fingerprints por golden (10 dominios). Threshold configurable (default 3 matches).

2. **`check-prototype-bidirectional-links.mjs`**: verifica que TODO prototipo de feature linkee al hub con depth correcta (`../../../prototype/index.html`) Y que el hub linkee de vuelta a cada feature. Detecta hrefs con 4+ niveles `../`, absolutos `/`, o ausentes. Verifica atributo `data-hub-link` para el helper auto-show.

3. **`check-prototype-location.mjs`**: rechaza prototipos HTML5 fuera de su ubicacion canonica. Aceptados: `specs/NNN-slug/prototype-html5/index.html`, `prototype/index.html`, `ejemplos/fase-2-ux-ui/prototype-html5-{golden,anti-ejemplo}/`. Cierra el patron real: algunos agentes creaban `frontend/prototype/index.html` o `prototipo/` (singular).

4. **`check-auto-zones.mjs`** (BLOQUEANTE): verifica integridad de zonas `<!-- auto:start name=X -->...<!-- auto:end -->` (acepta variante `@auto:start`). Detecta unbalanced, orphan-end, nested, duplicate, missing-required-zone. AI_CONTEXT.md DEBE tener las 7 zonas requeridas: stack, version, features, gates-pendientes, sesiones-recientes, decisiones-recientes, ultima-actualizacion.

5. **`check-gate-status-format.mjs`**: verifica formato canonico v12.56 de tabla `## Gates` (5 cols: Gate | Estado | Aprobador | Fecha | Evidencia). Estados canonicos: approved | pending | rejected | blocked. Formato legacy v12.20 (3 cols) aceptado con warning + sugerencia de migrar.

#### Phase C — Roadmap operativo para agentes

- **`scripts/roadmap-next.mjs`** (nuevo, ~280 lineas): devuelve la siguiente accion segura. 6 niveles de prioridad (blockers package.json, features incompletas, prototipos faltantes, gates pendientes, fase 5 sin @trace, default check:all). Output JSON estructurado con `next_action`, `feature`, `phase`, `agent_readiness`, `allowed_actions`, `forbidden_actions`, `must_read`, `commands_to_run`, `exit_criteria`, `blockers`. `--format text` para humanos.

- **`agent_readiness` enum** computado per feature: `ready_for_ai` (puede tomar tarea sin riesgo), `needs_human` (requiere validacion humana antes), `blocked` (faltan archivos canonicos o gate rechazado).

- **`scripts/roadmap-status.mjs` enhanced**: ahora importa `_lib/feature-filter.mjs` (excluye 000-* automaticamente) y `_lib/ignore-paths.mjs` (no cuenta target/, bin/, dist/, *.class).

#### Phase D — `template-upgrade --migrate-gates`

Nueva flag que reescribe la tabla `## Gates` de cada `specs/<feature>/traceability.md` del formato legacy (3 cols) al canonico v12.56 (5 cols). Mapeo de estados:
- "Aprobado" / "Validado" / "Completo" / "Listo" -> `approved`
- "Pendiente" / "En diseno" / vacio -> `pending`
- "Rechazado" -> `rejected`
- "Bloqueado" -> `blocked`

Idempotente (no toca si ya es canonico). Aprobador y Fecha quedan como `—` para que humano complete.

#### Phase E — Panel embebido `/api/roadmap/next` + UI

- Nuevo endpoint `/api/roadmap/next` que wrappea `roadmap-next.mjs --json`.
- Pestaña Roadmap del panel embebido ahora consume 3 endpoints en paralelo (status + commands + next).
- Tarjeta prominente "Siguiente accion segura para el agente" con:
  - Badge color-coded de `agent_readiness` (verde / naranja / rojo).
  - Lista compacta de allowed_actions (✓ verde), forbidden_actions (✗ rojo), must_read (📖), commands_to_run (formato terminal con `$`).

#### Phase F — Wire validators + package.json

- `check:project` ahora ejecuta **20 validadores** (vs 14 en v12.55): los 14 anteriores + 6 nuevos (prototype-bidirectional-links, prototype-location, prototype-domain-mismatch, auto-zones, gate-status-format, validation-coverage ya existia).
- 2 npm scripts nuevos para roadmap: `roadmap:next` (JSON) y `roadmap:next:text` (texto humano).
- Generador del template (`scripts/ai-framework-agent.mjs`) emite los nuevos scripts para todo proyecto generado.

### Comparativa v12.55 → v12.56

| Metrica | v12.55 | v12.56 |
|---|---:|---:|
| Validadores en `check:project` | 14 | **20** (+6) |
| Modulos compartidos `_lib/` | 0 | **2** (ignore-paths + feature-filter) |
| Scripts npm | ~50 | **~58** (+roadmap:next + 5 check:*) |
| Endpoints `/api/roadmap/` | 2 (status, commands) | **3** (+next) |
| Migracion automatica de Gates | ⊘ | ✅ `--migrate-gates` |
| Exclusion 000-* del roadmap | ⊘ | ✅ auto (frontmatter + glob) |
| Output JSON estructurado para agentes | parcial | **completo** (`roadmap:next`) |

### Validacion empirica v12.56

- **`check:project`**: 20 validadores ejecutados; exit 0 con 3 warnings esperados (data-hub-link en canonico 001, anti-ejemplo en ignore, legacy gate format).
- **`template-upgrade --migrate-gates`**: verificado en /tmp/migrate-test, transforma 3 cols a 5 cols con status `approved` correctamente.
- **`roadmap:next --format text`**: devuelve recomendacion legible con allowed/forbidden/must-read/commands.
- **Panel `/api/roadmap/next`**: endpoint responde JSON correcto consumido por la pestaña Roadmap.

### Lo que NO entro en v12.56 (postpuesto a v12.57)

- `scaffold-prototype --replace-mock`: flag opcional que reemplaza textos del golden por `<<PLACEHOLDER>>`. La marca `--replace-mock` se acepta en la firma pero no aplica reemplazo aun.
- **Dependencias entre features** (`feature_dependencies` table + UI). Roadmap actual asume features independientes.
- **`ROADMAP_STATE.json`** generado en raiz del proyecto. Por ahora solo en memoria via `/api/roadmap/next`.
- **Contrato completo por fase** en AGENTS.md (allowed/forbidden por las 9 fases). Tabla parcial ya existe en `90.36-roadmap-metodologico.md`.

## v12.55.0
Re-auditoria rigorosa del codex case post-v12.53 revelo 5 hallazgos nuevos no cubiertos en v12.46-v12.54: (1) `template-upgrade` solo agregaba scripts FALTANTES sin sobrescribir scripts OUTDATED del pipeline (codex tenia `check:project` viejo sin `check:prototype-cross-links`), (2) no copiaba `docs/transversal/90.35` ni `90.36`, (3) no existia meta-validador que detectara cuando un nuevo validador en `ci/scripts/` no se invocaba en `check:project`, (4) opencode y gemini nunca habian sido upgradeados, (5) **bug del usuario**: `npm run memory:serve --port 4320` fallaba con EADDRINUSE silencioso porque npm descartaba `--port` y el script no leia positional. v12.55 cierra los 5.

### A — `template-upgrade --force-scripts` (sobreescribe pipeline outdated)

`template-upgrade.mjs` v12.55 distingue 2 tipos de scripts npm outdated:
- **safe-overwrite** (whitelist `SAFE_OVERWRITE_SCRIPTS`): `check:project`, `check:all`, `check:template`, `memory:bootstrap*`, `memory:sync*`. Son scripts pipeline regenerables sin customizacion semantica.
- **custom** (resto): NO se tocan automaticamente; el usuario los modifico.

Con `--apply --force-scripts` sobreescribe los safe-overwrite con el canonico. Sin el flag, solo warn.

Verificado contra codex: detecto `check:project` outdated (le faltaba `check:prototype-cross-links` en el pipeline), aplicado correctamente.

### B — `template-upgrade` copia docs transversales nuevas

Lista `TRANSVERSAL_DOCS_TO_SYNC`: `docs/transversal/90.35-trace-annotations-por-stack.md` + `docs/transversal/90.36-roadmap-metodologico.md`. Estos son docs de referencia copy-paste seguros (el agente los consulta pero no los customiza).

Verificado: codex no tenia 90.36 (lo que rompia `roadmap-status` sin err visible). Aplicado.

### C — `check-validation-coverage` (meta-validador nuevo)

Verifica que `check:project` y `check:template` invoquen TODOS los validadores fisicos en `ci/scripts/check-*.mjs`, excepto excepciones explicitamente categorizadas:

- `TEMPLATE_LEVEL_VALIDATORS`: `check-docs`, `check-prototype-hub`, `check-ai-artifacts`, `check-markdown-paths` (van en `check:template`).
- `PER_SPEC_VALIDATORS`: `check-html5-prototype-quality` (corre per-spec, no en pipeline general).
- `SEPARATE_PIPELINE_VALIDATORS`: `check-template-instantiation` (esta como `check:instantiation`).
- `META_VALIDATORS`: el propio `check-validation-coverage` (no se autoinvoca).
- `CI_ONLY_VALIDATORS`: `check-github-actions`, `check-openapi-diff`, `check-rbac-consistency` (requieren contexto CI/git/stack).

Cualquier nuevo validador que NO encaje en estas categorias DEBE estar en `check:project`. Si lo dejas fuera, `check-validation-coverage` falla y dice exactamente que script falta.

Wire en `check:project` (ahora **14 validadores en pipeline + 1 meta-validador**).

**Verificacion E2E**: contra template detecto inicialmente 3 huerfanos (`check-github-actions`, `check-openapi-diff`, `check-rbac-consistency`) — agregue a `CI_ONLY_VALIDATORS` excepciones. Re-test: OK 14/14.

### D — Upgrade aplicado a los 3 casos reales

```
codex:     0 scripts faltantes, 0 outdated, 0 docs nuevos    (al dia)
opencode:  0 scripts faltantes, 0 outdated, 0 docs nuevos    (al dia)
gemini:    0 scripts faltantes, 0 outdated, 0 docs nuevos    (al dia)
```

`roadmap-status` ahora funciona en los 3 con feedback util:
- **codex**: Fases 0-4 ✓, Fase 5 ⚠ (18 archivos sin @trace), accion: `harvest-trace`.
- **opencode**: Fases 0-3 ✓, Fase 4 ⊘ (9 features sin spec-tecnica con BD), Fase 7-8 parcial. Mas avanzado en docs.
- **gemini**: Fase 3 ⚠ parcial (3/4 entregables), Fase 5 ⚠ (18 archivos sin @trace).

Cada uno con bloqueadores y siguiente accion concretos.

### E — Doc `ci/scripts/README.md` (nuevo)

Inventario completo de los 23 validadores fisicos clasificados por bucket (template/project/separate/per-spec/CI-only/meta) + tabla "cuando es silencioso" + convencion `npm run X -- --arg` con explicacion de por que npm exige `--`.

### F — Fix critico: `memory-serve` port handling (bug reportado por usuario)

**Problema reportado**: `npm run memory:serve --port 4320` daba EADDRINUSE en 4319 y crasheaba con stack trace cripto.

**3 fixes**:

1. **Aceptar puerto posicional**: si npm convierte `--port 4320` en positional `4320` (porque npm exige `--` separator), el script ahora lo detecta. Tambien acepta `MEMORY_SERVE_PORT` env var.

2. **`--auto-port`**: nueva flag que busca el siguiente puerto libre si el preferido esta ocupado (hasta 20 intentos).

3. **Mensaje util en EADDRINUSE** (en lugar de crash): captura el `error` event del server y muestra:
   ```
   ✗ Puerto 4319 ya esta en uso.
   Soluciones:
     1. Usar otro puerto:   node scripts/ai-framework-agent.mjs memory-serve --port 4320
        o via npm:          npm run memory:serve -- --port 4320
        (nota: npm exige '--' para pasar args al script)
     2. Auto-buscar libre:  node scripts/ai-framework-agent.mjs memory-serve --auto-port
     3. Matar el proceso que tiene el puerto:
        Windows: netstat -ano | findstr :4319 && taskkill /PID <pid> /F
        Linux:   lsof -ti:4319 | xargs kill -9
   ```

### Comparativa v12.54 → v12.55

| Metrica | v12.54 | v12.55 |
|---|---:|---:|
| Validadores fisicos `ci/scripts/` | 22 | **23** (+check-validation-coverage) |
| Validadores en `check:project` | 14 | **14** (sin cambio; meta agrega 15to call) |
| `template-upgrade --force-scripts` | ⊘ | ✅ sobreescribe pipeline outdated |
| `template-upgrade` copia docs/transversal | ⊘ | ✅ 90.35 + 90.36 |
| Casos reales sincronizados | 1/3 (codex) | **3/3** (codex + opencode + gemini) |
| `memory-serve` con port ocupado | ❌ crash | ✅ mensaje util + `--auto-port` |
| Doc validadores silenciosos | dispersa | ✅ `ci/scripts/README.md` |
| Meta-validador de cobertura del pipeline | ⊘ | ✅ `check-validation-coverage` |

### Validacion final v12.55

```
$ npm run check:all
~16 OK lines, 0 hallazgos, exit 0

$ node ci/scripts/check-validation-coverage.mjs
OK. Todos los validadores fisicos estan invocados en su pipeline correspondiente.

$ node scripts/roadmap-status.mjs --root /path/codex
Fase 5: PARCIAL (18 archivos sin @trace). Accion: harvest-trace.

$ node scripts/template-upgrade.mjs --root /path/codex
0 cambios pendientes.
```

## v12.54.0
Expone el roadmap de v12.53 (que era CLI) en el **panel embebido `memory-serve`** como una nueva pestaña interactiva. El usuario observo que el roadmap es para CUALQUIER agente, no solo codex, y queria verlo visualmente + ver historico de comandos ejecutados + comandos sugeridos clickeables.

### TL;DR

- **Nueva pestaña "Roadmap"** en `memory-serve` con grid visual de las 9 fases (✓/⚠/⊘) + bloqueadores + siguiente accion + comandos universales + timeline de comandos ejecutados.
- **2 endpoints nuevos**: `/api/roadmap/status` (shell-exec del script roadmap-status.mjs con --json) y `/api/roadmap/commands` (recent runs de la BD + sugeridos por fase + universales).
- **Click-through**: cada comando sugerido tiene boton "▶ Ejecutar"; cada run reciente tiene "↻ Re-ejecutar". Cambian automaticamente a pestaña Acciones y disparan el comando.
- **Todo en vivo**: el roadmap se recalcula cada vez que entras a la pestaña; usa la misma logica que el CLI `npm run roadmap:status`.

### Cambios

#### A — Endpoint `/api/roadmap/status`

Wrap el script `scripts/roadmap-status.mjs --json` y devuelve el JSON estructurado de las 9 fases con su estado actual. Una sola fuente de verdad entre CLI y panel. Manejo de error: si `roadmap-status.mjs` no existe en el proyecto (proyecto viejo), devuelve mensaje claro: "Corre: npm run template:upgrade -- --apply".

```bash
$ curl /api/roadmap/status
{
  "project": "@ndavilal/project-template-ai-first",
  "templateVersion": "v12.53.0",
  "phases": [
    { "id": 0, "name": "Iniciacion", "status": "complete", "detail": "4/4 docs canonicos" },
    { "id": 2, "name": "UX/UI", "status": "partial", "detail": "1/4 features con prototipo, 1/4 con SPDD aprobado" },
    ...
  ],
  "blockers": [...],
  "nextAction": ["1. Resolver features..."]
}
```

#### B — Endpoint `/api/roadmap/commands`

Devuelve 3 colecciones:
- `recent`: ultimas 30 `ai_action_runs` (action_id, arg, mode, started_at, finished_at, exit_code, duration_ms, cancelled, timed_out).
- `phaseCommands`: mapeo fase 0-8 → comandos recomendados por fase con razon.
- `universalCommands`: 4 comandos siempre disponibles (memory:sync, check:project, roadmap:status, template:upgrade).

#### C — Nueva pestaña "Roadmap" en panel embebido

`<button class="tab" data-tab="roadmap">Roadmap</button>` + `<div class="pane" id="pane-roadmap">`.

Estructura visual (rendered cuando hacer click en la pestaña):

1. **Cabecera**: proyecto + templateVersion + count de features.

2. **Grid de 9 fases** (`grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`):
   - Cada `phase-card` con borde lateral verde/naranja/gris segun status.
   - Etiqueta: Fase N · Nombre · ✓ COMPLETA / ⚠ PARCIAL / ⊘ NO INICIADA · detalle cuantitativo.
   - Hover: shadow + selected outline.

3. **Bloqueadores activos** (si los hay): cards rojas con ✗.

4. **Siguiente accion recomendada**: cards azules con →.

5. **Comandos universales** (siempre disponibles): grid con 4 cards por comando + boton "▶ Ejecutar" que dispara el comando real en la pestaña Acciones.

6. **Comandos recientes ejecutados** (timeline): hasta 30 runs con:
   - Icono ✓ (exit 0) / ✗ (exit !=0) / ⏸ (cancelado)
   - Accion + arg (font-mono)
   - Modo + duracion + exit code
   - Tiempo relativo (hace 5min)
   - Boton "↻ Re-ejecutar" que repite el comando.

#### D — CSS dedicado (~40 lineas)

Nuevas clases: `.roadmap-toolbar`, `.roadmap-grid`, `.phase-card` (con `complete`/`partial`/`not-started`), `.phase-num`, `.phase-name`, `.phase-status`, `.phase-detail`, `.roadmap-section`, `.blocker-item`, `.next-action`, `.timeline-list`, `.timeline-row`, `.timeline-icon`, `.timeline-action`, `.timeline-meta`, `.timeline-time`, `.timeline-replay`, `.cmd-suggestions`, `.cmd-card`, `.cmd-card-id`, `.cmd-card-reason`, `.cmd-card-run`.

#### E — Bug fix: path resolution

`/api/roadmap/status` inicialmente derivaba `rootDir` de `path.dirname(path.dirname(dbPath))` que daba 2 niveles arriba en vez de 3. Fix: usar `process.cwd()` (donde se invoco `memory-serve`).

### Validacion empirica

```bash
$ node scripts/ai-framework-agent.mjs memory-serve --port 4395 &
$ curl /api/roadmap/status   # devuelve JSON con 9 fases
$ curl /api/roadmap/commands # devuelve 12 recent + 4 universales + 9 phase keys
$ curl /                     # HTML contiene 22 matches de elementos roadmap (pane, tab, JS, CSS)
```

### Beneficio practico

El usuario ahora abre `npm run memory:serve`, click en la pestaña **Roadmap**, y ve:

```
┌─────────────────────────────────────────────────────────────────┐
│ Proyecto: mi-proyecto · template v12.54.0 · 8 features          │
├──────────────────┬──────────────────┬──────────────────┬────────┤
│ Fase 0           │ Fase 1           │ Fase 2           │ Fase 3 │
│ Iniciacion       │ Requerimientos   │ UX/UI            │ Arq.   │
│ ✓ COMPLETA       │ ✓ COMPLETA       │ ⚠ PARCIAL        │ ✓ ...  │
│ 4/4 docs         │ analisis + matriz│ 5/8 con SPDD     │ ...    │
└──────────────────┴──────────────────┴──────────────────┴────────┘

⚠ Bloqueadores activos (3):
  ✗ 003-feature: faltan 6 archivo(s) canonico(s)
  ✗ 007-feature: faltan 4 archivo(s) canonico(s)

→ Siguiente accion recomendada:
  1. Resolver features con archivos canonicos faltantes...
  2. Completar fase 2 (UX/UI)...

🛠 Comandos universales (siempre disponibles):
  [npm run memory:sync       ▶ Ejecutar]
  [npm run check:project     ▶ Ejecutar]
  [npm run roadmap:status    ▶ Ejecutar]
  [npm run template:upgrade  ▶ Ejecutar]

📜 Comandos recientes ejecutados (12):
  ✓ sync-memory       sync · 2.3s · exit 0          hace 2min   [↻ Re-ejecutar]
  ✓ status            stream · 0.3s · exit 0        hace 3min   [↻ Re-ejecutar]
  ✗ check-instantiation sync · 1.1s · exit 1       hace 5min   [↻ Re-ejecutar]
  ...
```

Cualquier comando es clickeable → cambia a pestaña Acciones → ejecuta. Ya no hay necesidad de saberse los comandos de memoria.

### Comparativa v12.53 → v12.54

| Metrica | v12.53 | v12.54 |
|---|---:|---:|
| Pestañas del panel embebido | 8 | **9** (+Roadmap) |
| Endpoints `/api/` | ~20 | **+2** (/api/roadmap/status, /api/roadmap/commands) |
| Visualizacion del roadmap | solo CLI | CLI + panel embebido visual |
| Comandos clickeables sin recordar nombre | 0 | 4+ (universales) + N (recientes) |
| Historico de comandos ejecutados | tabla en pestaña Acciones | tambien en Roadmap como timeline |

### Validacion final v12.54

```bash
$ npm run check:all
14/14 OK, 0 hallazgos, exit 0

$ curl /api/roadmap/status      # JSON con 9 fases
$ curl /api/roadmap/commands    # recent + sugeridos
$ open http://localhost:4395    # pestaña Roadmap visible y funcional
```

## v12.53.0
Cierra el patron real detectado en re-audit del case codex: **el package.json del proyecto generado quedo desincronizado con el template canonico** (faltaban 11 scripts npm + 4 scripts/ + 1 helper). No habia mecanismo de "pull updates from template", confundia a los agentes que ejecutaban `memory:serve` o `scaffold:feature` que no existian en su proyecto. Adicionalmente: **roadmap navegable** que muestra al agente donde esta en la metodologia + clarificacion del directorio donde corren los comandos.

### Causa raiz cerrada (codex case)

> "codex package.json: 34 scripts npm. template canonico v12.52: 48 scripts npm. Diff: 14 scripts faltantes en codex incluyendo memory:bootstrap:quick, scaffold:feature, scaffold:prototype, check:prototype-cross-links, template:upgrade, roadmap:status... Codex fue instanciado en v12.40-v12.43, pero el template evoluciono a v12.52 sin que el codex pudiera adoptar las mejoras."

### Cambios v12.53

#### A — `scripts/template-upgrade.mjs` (nuevo, ~260 lineas)

Sincroniza un proyecto instanciado con el template canonico actual. Idempotente, NO destructivo, NUNCA borra customizaciones.

```bash
# Dry-run: reporta diff
node scripts/template-upgrade.mjs --root /path/al/proyecto

# Apply: agrega scripts npm + copia ci/scripts/ nuevos + scripts/ scaffold-*
node scripts/template-upgrade.mjs --root /path/al/proyecto --apply
```

Detecta:
- Scripts npm en template pero ausentes en proyecto destino.
- Scripts npm con comando outdated (reporta pero NO sobrescribe sin --force).
- `ci/scripts/check-*.mjs` faltantes (validadores nuevos).
- `scripts/scaffold-*.mjs`, `generate-*.mjs`, `roadmap-status.mjs`, `template-upgrade.mjs` faltantes.
- `plantillas/transversal/shared-prototype-helpers.js` faltante.
- Heuristica: infiere version aproximada del template usada para generar el proyecto.

**Verificacion E2E contra codex case**: detecto 11 scripts npm + 4 scripts/ + 1 helper faltantes. Tras `--apply`: 0 diff.

#### B — `docs/transversal/90.36-roadmap-metodologico.md` (nuevo, ~280 lineas)

Grafo navegable end-to-end de las 9 fases (Iniciacion → Operacion) con:
- Mapa ASCII de fases + gates intermedios.
- Para cada fase: entradas requeridas, deliverables canonicos con rutas exactas, comandos disponibles, gate de salida, validadores criticos.
- Como saber si la fase esta completa (heuristicas verificables).
- Reglas no negociables (no avanzar sin gate, validacion humana explicita, etc.).
- Integrado en nav-guided de docs/transversal.

#### B' — `scripts/roadmap-status.mjs` (nuevo, ~200 lineas)

Comando `npm run roadmap:status` que evalua el estado del proyecto contra las 9 fases del roadmap. Output legible o `--json` para integraciones.

Para cada fase: completa/parcial/no-iniciada + detalle cuantitativo + bloqueadores activos + siguiente accion recomendada.

**Verificacion E2E contra codex case**:
```
Fase 0 (Iniciacion)        ✓ COMPLETA       (4/4 docs canonicos)
Fase 1 (Requerimientos)    ✓ COMPLETA       (analisis + matriz: 2/2)
Fase 2 (UX/UI)             ✓ COMPLETA       (4/4 features con prototipo, 4/4 con SPDD)
Fase 3 (Arquitectura)      ✓ COMPLETA       (4/4 entregables + 1 ADRs)
Fase 4 (SDD)               ✓ COMPLETA       (4/4 features con spec-tecnica + modelo BD)
Fase 5 (Construccion)      ⚠ PARCIAL        (18 archivos codigo, 0 con @trace)
Fase 6 (QA)                ⊘ NO INICIADA
Fase 7 (Despliegue)        ⊘ NO INICIADA
Fase 8 (Operacion)         ⊘ NO INICIADA

Siguiente accion recomendada:
  1. Anotar @trace RF-XX en codigo faltante + 'npm run memory:harvest-trace'.
```

Esto da al agente claridad absoluta de **donde esta y que sigue**.

#### C — `AGENTS.md` con 3 secciones criticas nuevas

1. **"IMPORTANTE — Directorio donde se ejecutan los comandos (v12.53)"**: aclara que todos los `npm run` corren en la RAIZ del proyecto destino, NO en template canonico. Ejemplos correctos/incorrectos.
2. **"Como actualizar un proyecto cuando el template canonico evoluciona (v12.53)"**: documenta `template:upgrade` con ejemplo de invocacion + ejemplo de salida.
3. **"Como saber donde estoy en la metodologia (v12.53)"**: documenta `roadmap:status` con ejemplo de output + referencia al roadmap canonico.

#### D — Wire en package.json + generador

4 npm scripts nuevos:
- `template:upgrade` (dry-run)
- `template:upgrade:apply`
- `roadmap:status` (tabla legible)
- `roadmap:status:json` (para integraciones)

### Validacion empirica contra codex case

Antes de v12.53 (codex original):
- 34 scripts npm (de 48 canonicos): faltaban 14.
- No habia manera de saber en que fase del roadmap estaba.
- `npm run scaffold:feature` => "command not found".
- `npm run check:prototype-cross-links` => "command not found".

Despues de v12.53 (`npm run template:upgrade:apply`):
- 48 scripts npm: 0 diff.
- `npm run roadmap:status` muestra Fases 0-4 COMPLETAS, Fase 5 PARCIAL (18 archivos sin @trace), siguiente accion clara.
- Todos los scripts canonicos disponibles.

Tiempo total de upgrade: ~2 segundos. Sin perdida de customizaciones.

### Comparativa v12.52 → v12.53

| Metrica | v12.52 | v12.53 |
|---|---:|---:|
| Scripts npm en template | 48 | **52** (+4: template:upgrade x2, roadmap:status x2) |
| Mecanismo de pull-updates | ❌ no existe | ✅ `template:upgrade` idempotente |
| Roadmap navegable | ❌ disperso en docs | ✅ unico documento 90.36 + CLI `roadmap:status` |
| Claridad de directorio commands | ⚠ ambiguo | ✅ documentado en AGENTS.md |
| Codex case scripts faltantes | 14 | 0 (tras `template:upgrade:apply`) |
| Tiempo de upgrade desde version vieja | manual (horas) | 2s automatico |

### Que NO cambia

- `check:project` sigue 14 validadores.
- `check:template` sigue 4 validadores.
- 16 goldens HTML5 nivel 3.
- Schema BD.
- Comportamiento del panel embebido (29 acciones).

### Validacion final v12.53

```bash
$ npm run check:all
14 OK lines, 0 hallazgos, exit 0

$ npm run template:upgrade -- --root /path/codex-case
0 cambios pendientes (tras upgrade previo)

$ npm run roadmap:status -- --root /path/codex-case
Fases 0-4 COMPLETAS, Fase 5 PARCIAL, accion recomendada clara
```

## v12.52.0
Cierra los 4 dominios verticales candidatos (educacion, retail POS, IoT industrial, insurtech) + dominio adicional **Educacion colegio SIS** (admision/matricula/notas/apoderados/planilla), mas auditoria del hub y nueva **convencion cross-spec navigation via URL params canonicos** que convierte el portafolio de prototipos en una simulacion navegable end-to-end del producto.

### TL;DR

- **5 goldens HTML5 nuevos** (+3618 lineas combined, todos nivel 3): educacion-colegio-sis, educacion-superior-lms, retail-pos-terminal, iot-industrial-sensores, insurtech-polizas-claims.
- **GOLDEN_MAP ampliado a 56 entradas** (vs 27 en v12.51) — +29 alias nuevos para los 5 dominios.
- **Cross-spec navigation** documentada y operativa: 5 params canonicos (`from`, `role`, `id`, `demo-mode`, `spec`), helper inline auto-inyectado, hub pasa contexto automaticamente, validador `check-prototype-cross-links` que rechaza hrefs rotos.
- **Hub generator actualizado**: cada link a un prototipo ahora incluye `?from=hub&demo-mode=true&role=<actor>`.
- **`scaffold:prototype` mejorado**: cada prototipo generado lleva el helper inline + atributos canonicos para roles/recursos.

### N1 — Auditoria + cross-spec navigation infrastructure

Auditoria detecto que el hub no pasaba contexto a los prototipos y que no existia convencion para cross-spec navigation. **3 piezas nuevas**:

1. **`plantillas/transversal/shared-prototype-helpers.js`** (~80 lineas) — helper canonico con `getPrototypeContext()`, `applyContextualUI(ctx)`, `openPrototypeBySpec(specNum, params)`. Idempotente, expone `window.__protoHelpers` para evitar doble carga.

2. **Hub generator actualizado** (`scripts/ai-framework-agent.mjs > generatePrototypeHub`): los hrefs ahora son `?from=hub&demo-mode=true&role=<actor>`. El parametro `role` proviene del actor del journey al que pertenece el card. Esto sincroniza switches de rol al abrir el prototipo.

3. **`ci/scripts/check-prototype-cross-links.mjs`** (~170 lineas) — validador con 4 reglas:
   - hrefs a `specs/NNN-slug/prototype-html5/` apuntan a features existentes.
   - `openPrototypeBySpec('NNN')` referencia specs reales.
   - URL params `?spec=NNN` y `?from=spec-NNN` apuntan a specs validas.
   - Loops circulares (a → b → a en 1 paso) reportados como warning.

### N2 — 5 goldens HTML5 nuevos (todos nivel 3)

| Golden | Lineas | Tokens CSS | Media queries | Patron distintivo |
|---|---:|---:|---:|---|
| **educacion-colegio-sis** | 781 | 34 | 3 | Banner periodo academico + role switch (Admin/Docente/Apoderado) + tabs modulos (Admision/Matricula/Notas/Curriculo/Docentes/Familias/Planilla) + sidebar por nivel+grado + tabla con apoderado titular + pension + nota + detail con gradebook por bimestre + apoderados cards |
| **educacion-superior-lms** | 568 | 31 | 3 | Topbar academico + term pill (semestre N de M) + sidebar cards de cursos + course-hero con stats (avance silabo/promedio/aprobacion) + tabs (Gradebook/Modulos/Evaluaciones/Asistencia/Recursos/Foro) + gradebook con pesos por evaluacion + riesgo de dropout |
| **retail-pos-terminal** | 441 | 30 | 3 | Topbar negro tienda+caja+turno+cajero + split-view (catalogo izq | cart oscuro derecha) + barcode input grande + payment options grid + boton COBRAR + modal ticket con receipt preview |
| **iot-industrial-sensores** | 622 | 35 | 3 | Tema oscuro empresarial + LIVE pill + plant selector + KPIs OEE con sparklines + alarmas criticas pulse + split (assets criticos | alarmas+chart SVG con threshold line) + modal ACK + crear OT |
| **insurtech-polizas-claims** | 606 | 31 | 3 | Topbar suscriptor + sidebar productos (Auto/Hogar/Salud/Vida) + KPIs negocio (vigentes/renovaciones/claims/loss ratio) + tabla polizas con product pill diferenciado + detail con coberturas grid + claim timeline + wizard suscripcion 4 pasos |

**Total: 3018 lineas, 161 tokens CSS, 15 media queries** en los 5 goldens nuevos.

### N3 — Multi-role support con CSS hooks

Los goldens v12.52 demuestran multi-role UI con CSS condicional via `body[data-active-role="X"]`:

```css
body[data-active-role="apoderado"] .btn-primary[data-admin-only],
body[data-active-role="apoderado"] .row-action[data-admin-only]{ display:none }
body[data-active-role="docente"] .btn[data-admin-only]{ opacity:.4; pointer-events:none }
```

El helper inyectado lee `?role=<X>` de la URL y setea el data-attribute automaticamente.

### N4 — GOLDEN_MAP ampliado (27 → 56 entradas)

```
colegio, escuela, sis, matricula, notas, apoderados, primaria, secundaria  -> educacion-colegio-sis
universidad, lms, gradebook, evaluaciones, cursos                          -> educacion-superior-lms
pos, retail, caja, punto_venta, tienda                                     -> retail-pos-terminal
iot, industrial, sensores, alarmas, scada                                  -> iot-industrial-sensores
insurtech, seguros, polizas, claims, suscripcion                           -> insurtech-polizas-claims
```

29 alias nuevos. Total: 56 entradas para 11 goldens canonicos.

### N5 — `scaffold-prototype` inyecta helpers automaticamente

`scripts/scaffold-prototype.mjs` v12.52: si el golden copiado NO incluye `__protoHelpers`, inyecta el bloque inline antes de `</body>`. Asi cada prototipo generado tiene cross-spec navigation desde el dia 1, sin que el agente deba recordar agregarla.

### N6 — Documentacion

- `ejemplos/fase-2-ux-ui/prototype-html5-golden/README.md`: 5 entradas detalladas nuevas + 5 filas en tabla de dominios + seccion completa "Cross-spec navigation via URL params" con 4 tablas (params canonicos, atributos HTML, validador, ejemplo).
- `plantillas/transversal/PROTOTYPE_HUB.md`: nueva seccion "Cross-spec navigation via URL params (v12.52)" con helper inline copy-paste + atributos reconocidos + ejemplo de hub + validador.

### N7 — Wire en validators

- `check:project` ahora ejecuta **14 validadores** (vs 13 en v12.51) — agregado `check:prototype-cross-links`.
- `check:prototype-cross-links` corre estricto por default en el template canonico (sin links rotos).

### Comparativa v12.51 → v12.52

| Metrica | v12.51 | v12.52 |
|---|---:|---:|
| Goldens HTML5 nivel 3 | 11 | **16** (+5) |
| Dominios soportados `scaffold:prototype` | 27 | **56** (+29 alias) |
| Validadores `check:project` | 13 | **14** (+check:prototype-cross-links) |
| Scripts npm | 33 | **35** (+check:prototype-cross-links, +shared-helpers consumido) |
| Cross-spec navigation | no soportado | 5 params canonicos + helper + validador |
| Hub pasa contexto a prototipos | no | si (auto via `?from=hub&role=<actor>`) |
| Multi-role UI con CSS hooks | no documentado | `body[data-active-role="X"]` + helper inline |
| Total lineas goldens | 10423 | **13441** (+3018 en 5 nuevos) |

### Validacion final v12.52

```
$ npm run check:all
14/14 OK, 0 hallazgos, exit 0

$ node scripts/scaffold-prototype.mjs --list-domains | wc -l
56

$ wc -l ejemplos/.../{educacion-colegio-sis,educacion-superior-lms,retail-pos-terminal,iot-industrial-sensores,insurtech-polizas-claims}/index.html
   781 .../educacion-colegio-sis/index.html
   568 .../educacion-superior-lms/index.html
   441 .../retail-pos-terminal/index.html
   622 .../iot-industrial-sensores/index.html
   606 .../insurtech-polizas-claims/index.html
  3018 total
```

### Cobertura de dominios verticales alcanzada (16/16)

| Categoria | Dominios cubiertos |
|---|---|
| **Genericos transversales** | SaaS operativo, Streaming, Ecommerce, Dashboard KPI, Dashboard funnel, Mobile-first, Wizard, Educacion-leccion |
| **Verticales v12.51** | Salud HIPAA, ERP multi-modulo, Logistica con flota |
| **Verticales v12.52** (este release) | Educacion colegio SIS, LMS universitario, Retail POS, IoT industrial, Insurtech |

Cobertura completa de los **10 dominios mas comunes en proyectos enterprise** + verticales especializadas. Si tu dominio no esta listado, elige el mas cercano semánticamente y adapta.

## v12.51.0
Cierra las 2 pendientes opcionales de v12.50: validador `check:openapi-coverage` que cruza endpoints declarados en traceability vs presentes en `contracts/api/openapi.yaml`, y 3 goldens HTML5 nuevos para dominios verticales (salud-HIPAA, ERP multi-modulo, logistica con tracking de flota).

### N1 — `ci/scripts/check-openapi-coverage.mjs` (validador nuevo)

Cruza endpoints declarados en la columna `API` de `traceability.md` (per-feature + raiz) con los presentes en `contracts/api/openapi.yaml` generado. Cierra el patron real: opencode declaro 51 endpoints en api-contract.md pero solo 17 quedaron en openapi.yaml.

```bash
$ npm run check:openapi-coverage
check-openapi-coverage (v12.51)
Endpoints declarados en traceability: 3
Endpoints en openapi.yaml:            6
Cubiertos (traceability ∩ openapi):  3
Coverage:                             100% (threshold: 90%)
OK. Coverage 100% >= 90%.
```

- Default: `--threshold 90` (warn si <90%, blocker en strict).
- Modo `--strict` exit 1 si coverage < threshold.
- Wire en `check:project` (ahora **13 validadores**).
- Verificado E2E: contra opencode case detecta 86 declarados vs 6 en openapi (coverage 0% — exactamente el gap real).

### N2-N4 — 3 nuevos goldens HTML5 nivel 3

Tres prototipos canonicos para dominios verticales que faltaban en el mapeo:

| Golden | Lineas | Tokens CSS | Media queries | Patron distintivo |
|---|---:|---:|---:|---|
| **salud-hipaa-clinico** (N2) | 672 | 26 | 2 | Banner PHI fijo + audit trail visible + badges criticos pulse + vitals grid color-coded |
| **erp-multimodulo-financiero** (N3) | 718 | 34 | 3 | Modulebar 8 modulos + selector org/periodo + partida doble + libro diario con CC + KPIs con sparklines |
| **logistica-tracking-flota** (N4) | 674 | 34 | 3 | Mapa SVG mock con pines GPS + split-view + timeline de eventos + progress bars color-coded + LIVE pill |

Cada uno cubre los 5 estados UI (loading/empty/error/success/permission), responsive 2-3 breakpoints, detail panel slide-in, toast, modal, hub link. Auto-contenidos sin CDN.

### N5 — `scaffold-prototype` mapping ampliado (14 -> 27 dominios)

Mapeo dominio → golden ampliado con **13 nuevos alias** que cubren los nuevos dominios + sinonimos comunes:

```
salud, hipaa, clinico, ehr        -> salud-hipaa-clinico
erp, financiero, contable, multimodulo -> erp-multimodulo-financiero
logistica, flota, tracking, envios, fleet -> logistica-tracking-flota
```

Total: 27 entradas (14 v12.50 + 13 nuevas).

### N6 — `ejemplos/.../README.md` goldens actualizado

3 entradas detalladas nuevas en el indice de goldens (con dominio, patron visual, nivel, actores, tarea principal, lo que demuestra) + 3 filas nuevas en la tabla "Patron visual por dominio" con red flag asociado por dominio.

### N7 — Wire en `package.json` + generador

```json
"check:openapi-coverage": "node ci/scripts/check-openapi-coverage.mjs",
"check:project": "... && npm run check:openapi-coverage"
```

`check:project` ahora ejecuta 13 validadores (vs 12 en v12.50).

### Comparativa v12.50 -> v12.51

| Metrica | v12.50 | v12.51 |
|---|---:|---:|
| Validadores `check:project` | 12 | 13 (+check:openapi-coverage) |
| Goldens HTML5 nivel 3 disponibles | 8 | 11 (+salud, ERP, logistica) |
| Dominios soportados por `scaffold:prototype` | 14 | 27 (+13 alias) |
| Coverage automatico de OpenAPI | manual | validador estricto |
| Total lineas en goldens canonicos | 8359 | **10423** (+2064 lineas en 3 goldens nuevos) |

### Validacion final v12.51

```bash
$ npm run check:all
14/14 OK, 0 hallazgos, exit 0

$ npm run check:openapi-coverage
Coverage 100% — OK

$ node scripts/scaffold-prototype.mjs --list-domains | wc -l
27

$ wc -l ejemplos/fase-2-ux-ui/prototype-html5-golden/{salud-hipaa-clinico,erp-multimodulo-financiero,logistica-tracking-flota}/index.html
   672 .../salud-hipaa-clinico/index.html
   718 .../erp-multimodulo-financiero/index.html
   674 .../logistica-tracking-flota/index.html
  2064 total
```

### Que NO cambia

- `check:template` sigue 4 validadores.
- AGENTS.md orden de lectura.
- Schema BD.
- Comportamiento del panel embebido.

## v12.50.0
Cierra las **3 consideraciones pendientes** de v12.49 + el **patron especifico de codex** (clonacion de prototipos entre features). Auditoria profunda comparando los 3 casos reales revelo que codex genero las 8 features con prototipos de **exactamente 392 lineas** y mismo mock data, solo variando color HSL en +19° entre features — clonacion mecanica de un solo template sin adaptar al dominio de cada feature.

### Hallazgo central del segundo audit profundo

> "Codex evidencia un patron de clonacion sistematica: mismo numero de lineas, mismo mock data (16 contenidos cristianos reutilizados), misma estructura JavaScript con 28 funciones identicas, y misma logica de navegacion. Mientras OpenCode produce prototipos distintos con 27% mas contenido promedio (644 vs 392 lineas), Codex usó un loop programatico que clono el primer prototipo a las otras 7 features sin contextualizar el contenido por dominio."

**Hipotesis validada (C1)**: el codex case actual pasa **10 de 11 validadores** de v12.50 (vs 1-4 de v12.45). El unico que falla es el nuevo `check:prototype-diversity` — diseñado especificamente para catch este patron. La mejora cuantitativa de v12.46-v12.50 esta validada.

### Cambios v12.50

- **C4 — `ci/scripts/check-prototype-diversity.mjs`** (nuevo, ~150 lineas). Detecta clones de prototipos entre features con 3 heuristicas:
  - **Clone-lines**: si N features tienen prototipos del mismo bucket de lineas (±5), se reporta. N>=5 = bloqueante, N>=3 = warning.
  - **Clone-structure** (bloqueante): hash de estructura HTML/CSS/JS limpiando colores/IDs/textos largos. Si dos hashes coinciden, son clones estructurales.
  - **Clone-mock** (bloqueante): hash de textos visibles dedupeados y ordenados. Si dos features tienen los mismos mock textos, no adaptaron.
  - Wire en `check:project`. Verificado E2E: contra codex (8 prototipos ~395 lineas) detecta 1 bloqueante. Contra opencode (9 prototipos diversos) pasa OK.
- **`scripts/scaffold-prototype.mjs` enhanced (v12.50)**:
  - `deriveHueFromSlug(slug)` — calcula hue HSL 0-360 reproducible del slug. Garantiza paletas distintas por feature automaticamente (cierra el patron +19° de codex con variabilidad organica).
  - `readFeatureContext(featureDir)` — lee `spec-funcional.md` de la feature, extrae RFs/HUs/RNFs declarados y actores, y los inyecta como comentario HTML visible en el prototipo generado. Asi el agente recibe explicito QUE mock data debe adaptar.
  - Override `:root` con `--brand`, `--brand-light`, `--brand-dark` en hue calculado.
  - Marca del scaffold incluye `brandHue=NNN` para auditoria.
- **C2 — `scripts/scaffold-project.mjs`** (nuevo, ~120 lineas). Orquesta el bootstrap completo en 6 pasos: init-project (opcional con --skip-init), memory:bootstrap, check:template, check:project, check:instantiation strict, check:prototype-diversity. Soporta `--dry-run`. Expuesto via `npm run scaffold:project`. Cierra el patron real visto: agentes corren pasos sueltos en orden incorrecto o saltan validadores.
- **C3 — `scripts/generate-openapi.mjs`** (nuevo, ~200 lineas). Ensambla `contracts/api/openapi.yaml` consolidado a partir de todos los `specs/<feature>/api-contract.md`. Extrae bloques YAML embebidos, mergea paths/components.schemas, warningea conflictos de path entre features. Modos: default (escribe), `--dry-run`, `--check` (exit 2 si drift). Expuesto via `npm run generate:openapi` y `npm run generate:openapi:check`.
- **`check:project` ampliado a 11 validadores** (antes 10) — agregado `check:prototype-diversity`.
- **package.json + generador**: 5 npm scripts nuevos (`check:prototype-diversity`, `scaffold:project`, `generate:openapi`, `generate:openapi:check`, mas wire de `scaffold:prototype` ya v12.49).

### Validacion C1 (hipotesis de mejora cuantitativa)

Re-corri todos los validadores v12.50 contra `plataforma-app-cristiano.codex` (instancia generada por agente codex). Resultado:

| Validador | Resultado vs codex |
|---|---|
| check:trace-drift | ✅ OK (148 trace links validados, cero drift) |
| check:trace-coverage | ✅ OK |
| check:bd-documented | ✅ OK (37 tablas, 8 documentadas) |
| check:api-documented | ✅ OK (37 endpoints, 48 en api-contract.md, 3 en openapi.yaml) |
| check:test-documented | ✅ OK (no aplica fase 0-1) |
| check:runbook-documented | ✅ OK (no aplica fase 0-1) |
| check:evidence-exists | ✅ OK (336 evidence_ref) |
| check:gates-mentioned | ✅ OK (8 features con gates) |
| check:status-coherence | ✅ OK (336 trace links coherentes) |
| check:orphan-evidence | ✅ OK (64 archivos conectados) |
| **check:prototype-diversity (nuevo)** | **❌ BLOCKER (8 features con prototipos ~395 lineas — clonacion sistematica)** |
| check:instantiation strict | ✅ OK |

**10/11 verde + 1 nuevo blocker que cata exactamente la patologia codex**. La mejora es 10x respecto al primer audit (1-4/10 pasaban).

### Metricas comparativas v12.49 -> v12.50

| Metrica | v12.49 | v12.50 |
|---|---:|---:|
| Validadores `check:all` verdes | 13/13 | 14/14 |
| Validadores en `check:project` | 11 | 12 (+check:prototype-diversity) |
| Scripts npm totales | 28 | 33 (+5: diversity, scaffold:project, generate:openapi x2) |
| Scripts nuevos | 0 | 3 (`scaffold-project.mjs`, `generate-openapi.mjs`, `check-prototype-diversity.mjs`) |
| Causa raiz codex (clonacion) | no detectada | bloqueante automatico |
| Patrones de antipatron rechazados | 2 (B-CDN, B-MINIFIED) | 5 (+clone-lines, clone-structure, clone-mock) |
| Tiempo bootstrap proyecto nuevo | manual (5+ comandos) | 1 comando (`npm run scaffold:project`) |
| OpenAPI yaml sincronizado con api-contract.md | manual | auto-generado |

### Que NO cambia

- `check:template` sigue 4 validadores.
- AGENTS.md orden de lectura (19 items).
- Schema BD.
- Comportamiento del panel embebido.

## v12.49.0
Cierra **7 gaps detectados al re-revisar v12.48** despues de descubrir que opencode, codex y gemini terminaron con BDs en distintas rutas (`.agent/` vs `ai/memory/`). El gap real era una contradiccion entre AGENTS.md (que decia `.agent/`) y el codigo (que usa `ai/memory/`). Adicionalmente, segundo audit profundo de prototipos identifico que la causa raiz no era documentacion sino falta de **scaffolding mecanizado** que fuerce el copy del golden.

### Hallazgos cerrados

- **F1 — Contradiccion grave: ruta BD del agente**. `AGENTS.md:24` decia "siempre en `.agent/`"; el codigo `scripts/ai-framework-agent.mjs:357` usa `ai/memory/framework-agent.db` como default. Los 3 agentes reales fueron inconsistentes: opencode creo BDs en LAS DOS rutas, codex en `.agent/`, gemini en `ai/memory/`. Fix: AGENTS.md ahora dice explicitamente que **la ubicacion canonica es `ai/memory/framework-agent.db`** y que `.agent/` es opcional con `--db` explicito. `ai/memory/README.md` tambien actualizado con la misma claridad.
- **F2 — `scripts/scaffold-prototype.mjs`** (nuevo, v12.49). Cierra la causa raiz real de prototipos pobres descubierta en el segundo audit profundo: los agentes "leen el golden" pero generan desde cero con Tailwind CDN porque el comando `prototype-command.md > 4.1` dice "COPIA el golden" pero no automatiza el copy. Este script lo hace mecanicamente: copia el golden del dominio mas cercano (mapeo de 8 dominios + 6 sinonimos) y reemplaza placeholders canonicos (title, brand, link al hub). Resultado: prototipo 640-1309 lineas, nivel 2-3 garantizado de entrada. Uso: `npm run scaffold:prototype -- --feature 002-mi --domain streaming --titulo "X" --marca "Y"`. Soporta `--list-domains` para discoverability.
- **F3 — Validador `check-html5-prototype-quality` con 4 reglas nuevas**:
  - **`[B-CDN]` bloqueante** — detecta CDN externos prohibidos (Tailwind CDN, Bootstrap CDN, Bulma CDN, unpkg con framework, jsdelivr con framework, cualquier `<script src=https://*.js>`). Cierra el antipatron real visto en gemini (002-catalogo con `cdn.tailwindcss.com`).
  - **`[B-MINIFIED]` bloqueante** — detecta HTML minificado (linea > 1000 chars con > 20 tags). Cierra el antipatron real visto en gemini (002-catalogo de 43 lineas con HTML inline minificado).
  - **`[O-INLINE]` observacion** — alerta cuando hay > 20 `style="..."` inline pero < 30 declaraciones en `<style>` (indica copy-paste sin sistema visual).
  - **`[O-NAV]` observacion** — alerta cuando navegacion usa `alert()/console.log` sin handlers reales.
  - **Verificacion E2E**: contra el prototipo canonico (1491 lineas, 30 tokens CSS) → nivel 3 OK. Contra gemini 002-catalogo (44 lineas, Tailwind CDN) → `[B-CDN]` bloqueante, nivel 0.
- **F4 — Pre-flight checklist simplificado**. Se descubrio que items 4, 6 y 7 del checklist v12.46 eran redundantes: `check-template-instantiation` strict (item 4) ya cubre la verificacion de los 9 archivos canonicos (item 6) y slugs unicos (item 7). El checklist baja de 7 a 5 items netos sin perder cobertura. Mas claro y rapido.
- **F5 — `scaffold-feature` + `scaffold-prototype` documentados en AGENTS.md**. Nueva seccion "Comandos canonicos para generar artefactos (v12.49+)" con tabla comparativa de 6 comandos + flujo canonico completo de 5 pasos para crear una feature nueva. Los 3 agentes reales nunca descubrieron `scaffold-feature` porque no estaba referenciado en AGENTS.md; ahora es lo primero que ven al buscar "como genero una feature".
- **F6 — `@trace` en componentes React/Vue/Angular/Svelte**. Nueva subseccion en `docs/transversal/90.35-trace-annotations-por-stack.md` con regla explicita: anotar en el `default export`/componente principal (no en hooks/handlers internos); cada archivo separado lleva su propio `@trace`; tests del componente llevan su propio `@covers` en el top. Ejemplos para React, Vue 3, Angular, Svelte + regla para test files.
- **F7 — `scaffold:prototype` agregado a `package.json`** (template + generador) y a `INSTANCIACION_PROYECTO_REAL.md`. El npm script esta disponible desde el dia 1 del proyecto.

### Mejoras del validador (re-investigacion profunda)

El segundo audit detecto que **el validador era estructuralmente incompleto**: validaba metricas cuantitativas (lineas, tokens, media queries) pero **no rechazaba CDN externos ni HTML minificado**. Esto permitia que prototipos generados con Tailwind CDN (43 lineas, 0 tokens CSS) "fallaran" solo en metricas, no en antipatrones explicitos. v12.49 cierra el gap: ahora un agente que use Tailwind CDN recibe inmediatamente `[B-CDN] No se permiten CDN externos en prototipos autocontenidos. Detectado: Tailwind CDN.` con la accion concreta de fix.

### Cambios estructurales

- 1 script nuevo: `scripts/scaffold-prototype.mjs` (160 lineas).
- 1 npm script nuevo: `scaffold:prototype` (tanto en template como en proyectos generados).
- 4 reglas nuevas en `check-html5-prototype-quality.mjs` (B-CDN, B-MINIFIED, O-INLINE, O-NAV).
- 2 docs actualizados: `AGENTS.md` (BD path canonica + comandos scaffold + reading order limpio), `docs/transversal/90.35-trace-annotations-por-stack.md` (regla componentes visuales).
- 1 doc actualizado: `INSTANCIACION_PROYECTO_REAL.md` (`scaffold:prototype` en comandos del dia a dia).
- 1 doc actualizado: `ai/memory/README.md` (clarificacion BD path canonica vs opcional).

### Validacion final

- `npm run check:all`: **13/13 validadores verdes, 0 hallazgos**, exit 0.
- `scaffold-feature` + `scaffold-prototype` E2E: feature canonica + prototipo de 640 lineas con marca/titulo reemplazados.
- `check-html5-prototype-quality` contra canonico: nivel 3 OK.
- `check-html5-prototype-quality` contra gemini-002 (Tailwind CDN): `[B-CDN]` bloqueante, nivel 0.

### Impacto esperado v12.49 vs v12.48

Si los 3 agentes re-instancian ahora con el flujo nuevo (`scaffold:feature` -> `scaffold:prototype` -> adaptar -> validar):

| Validador | v12.48 prediccion | v12.49 prediccion |
|---|---:|---:|
| `check:project` (10 validadores) | 9-10 verdes | 10 verdes |
| `check-html5-prototype-quality` por feature | nivel 0-1 (Tailwind CDN no rechazado) | nivel 2-3 (golden copiado) |
| Tiempo de generacion por feature | manual, ~30 min | scaffold + adaptacion, ~10 min |
| Probabilidad de generar prototipo pobre | alta (sin automatizacion) | baja (golden copiado de entrada) |

## v12.48.0
Release agregado que cierra **11 propuestas de mejora documental** derivadas de auditar 3 casos reales (opencode, codex, gemini) donde agentes IA fallaron sistematicamente en aplicar el framework. Cubre los 3 bumps v12.46 (bloqueantes), v12.47 (scaffold + ejemplos), v12.48 (calidad).

### v12.46 — bloqueantes (4 items)

- **P1.1 — AGENTS.md con pre-flight checklist obligatorio**: lista de 7 comandos que el agente DEBE correr antes de cerrar (`memory:sync`, `check:template`, `check:project`, `check-template-instantiation`, `status --fail-on-drift`, verificacion de 9 archivos canonicos por feature, slugs unicos). Si alguno falla, no se cierra el proyecto.
- **P1.3 — `check-template-instantiation` strict mode (v12.46)**: nuevas reglas de validacion en `--mode instantiated`:
  - `checkRequiredScriptsInPackageJson` — verifica los 4 scripts v12.45 (`check:evidence-exists`, `check:gates-mentioned`, `check:status-coherence`, `check:orphan-evidence`).
  - `checkAiContextAutoZones` — verifica las 7 zonas auto-regenerables (`stack`, `version`, `features`, `gates-pendientes`, `sesiones-recientes`, `decisiones-recientes`, `ultima-actualizacion`).
  - `checkFeatureCompleteness` — verifica los 9 archivos canonicos por feature + header 10 cols + seccion `## Gates` + slugs unicos.
  - `checkResidualTerms` — detecta strings residuales del template ejemplo (`bandeja`, `expediente`, `$(date)`, `<feature>`, `<slug>`) en archivos generados.
  - Verificado contra los 3 casos reales: detecta 174 hallazgos (opencode), 21 (codex), 70 (gemini).
- **P2.1 — fix generador `init-project`** (3 bugs reales del template):
  - `SESSION_LOG.md` template: reemplazado `$(date)` literal por `new Date().toISOString().slice(0,16).replace("T"," ")` evaluado en JS.
  - `package.json` generado: incluye los 4 scripts v12.45 + `scaffold:feature` + `check:instantiation` + el nuevo `memory:bootstrap:quick`.
  - `check:project` generado: ejecuta los 11 validadores (los 7 originales + 3 v12.45 + `check:instantiation`).
- **P2.3 — AGENTS.md glosario de terminos del template ejemplo a reemplazar**: tabla con 7 regex de busqueda + comando grep listo para ejecutar.
- **P3.2 — AGENTS.md catalogo de "Errores reales vistos en instanciaciones previas"**: tabla con 12 patrones de error reales (matriz 7 cols, falta `## Gates`, `AI_CONTEXT` sin auto-zones, `package.json` sin v12.45, `api-contract` sin schemas, `$(date)` no expandido, terminos residuales, sin `@trace`, slugs duplicados, prototipos esqueleticos, inconsistencia inter-feature, scripts ad-hoc) cada uno con "como evitarlo".

### v12.47 — scaffold + ejemplos (3 items)

- **P1.2 — `scripts/scaffold-feature.mjs`** (v12.47, nuevo): genera los 9 archivos canonicos pre-poblados con estructura ya alineada al canon v12.45+. Cierra los 9 patrones de error reales: matriz 10 cols + Gates + tabla BD con PK/indices + api-contract con OpenAPI snippet + ui-test-cases + prototype.md con anatomia + spdd-frontend con permisos. Soporta `--slug`, `--titulo`, `--rfs`, `--rnfs`, `--hus`, `--entidad`, `--endpoint`, `--force`. Tambien crea `prototype-html5/index.html` placeholder que enlaza al hub. Comando expuesto via `npm run scaffold:feature`.
- **P2.2 — `plantillas/_full-feature-example/README.md`** (v12.47, nuevo): referencia visual del formato canonico esperado para una feature. Documenta los 9 archivos canonicos con validador asociado, el header canonico de la matriz (10 cols), variantes erroneas vistas en casos reales, header canonico de `## Gates`, bloque canonico de tabla BD, y el flujo de verificacion final (4 comandos).
- **P2.4 — `INSTANCIACION_PROYECTO_REAL.md` con "Loop iterativo de features"**: documenta el patron correcto (UNA feature completa, validada, luego siguiente) vs antipatrones reales vistos (bulk generation, copy-paste de traceability, salto de check:project, prototipos minificados, slugs duplicados, sin reemplazar terminos del template).

### v12.48 — calidad (4 items + prototype quality)

- **P3.1 — `plantillas/fase-4-sdd/api-contract.md`** ampliada con OpenAPI snippets embebidos: cada endpoint (`GET /api/expedientes`, `POST /api/expedientes`) lleva su bloque YAML completo con `requestBody`, `responses`, `schema`, `components/schemas`. Tambien documenta la regla v12.45 A2 (JSON Schema strict: `type:` obligatorio, `properties:` si object, `items:` si array). Bloque de validador inline.
- **P3.3 — `docs/transversal/90.35-trace-annotations-por-stack.md`** (v12.48, nuevo): convencion de `@trace` para 7 stacks (TypeScript/JS, Java/Kotlin, Python, Go, Rust, C#/.NET, SQL, YAML) con ejemplos copy-paste. Tabla "donde poner @trace" por capa (controller/service/repository/test/component/migration/openapi). Lista de errores comunes (formato `RF-2` vs `RF-02`, falta de arroba, etc.). Integrado al nav-guided de transversal.
- **P3.4 — `sync-memory` detecta inconsistencia inter-feature**: nueva funcion `detectFeatureMatrixInconsistencies` se corre al final de `sync-memory`. Si hay MEZCLA (algunas features con header canonico 10 cols + otras sin), emite warning con lista de archivos problematicos. Captura el patron real de opencode (5/11 canonicas + 6/11 no). No falla la sync (es warning), pero deja la huella visible.
- **Prototype quality (analizado y propuesto)**: la rubrica + plantilla + command estaban bien definidos cuantitativamente pero no enforced. v12.48 cierra el gap:
  - `plantillas/fase-2-ux-ui/prototype-html5.md` con nueva subseccion "Auto-auditoria visual antes de cerrar" (cuenta tokens CSS, media queries, classes, estados, antipatrones) + "Mapeo dominio -> golden obligatorio" (comando `cp golden -> spec` listo para ejecutar) + "Antipatrones rechazados por el gate" (8 patrones reales).
  - `ai/commands/prototype-command.md` con nuevo paso `4.1` (copia golden como base, no escribas desde cero) y `4.2` (tabla visual de decisiones nivel 2 vs nivel 3 a completar en `decisiones-ux.md`).
  - `ejemplos/fase-2-ux-ui/prototype-html5-golden/README.md` con nueva seccion "Flujo OBLIGATORIO al generar un prototipo HTML5" (4 pasos: elegir golden, copiar como base, adaptar contenido NO estructura, auto-auditoria con comandos) + metricas esperadas por nivel + antipatrones rechazados.

### Cambios estructurales

- 1 script nuevo: `scripts/scaffold-feature.mjs` (genera 11 archivos canonicos por feature).
- 1 doc transversal nuevo: `docs/transversal/90.35-trace-annotations-por-stack.md`.
- 1 carpeta nueva: `plantillas/_full-feature-example/` con README de referencia copiable.
- 1 script de npm nuevo: `scaffold:feature`.
- 1 funcion en `sync-memory`: `detectFeatureMatrixInconsistencies` (warning, no falla).
- 4 nuevas reglas en `check-template-instantiation` strict.

### Validacion final

- `check:all`: **13/13 validadores verdes, 0 hallazgos**, exit 0.
- `check-template-instantiation` strict contra los 3 casos auditados: detecta 174 hallazgos (opencode), 21 (codex), 70 (gemini) — funciona como debe.
- `scaffold-feature` end-to-end: genera 11 archivos correctamente (9 canonicos + README + placeholder prototype).
- `sync-memory` con warning de inconsistencia: dispara solo si hay mezcla; no rompe sync.

### Impacto esperado

Si los 3 agentes (opencode, codex, gemini) re-instanciaran ahora siguiendo:
1. Pre-flight checklist de AGENTS.md.
2. `scaffold-feature` por cada feature.
3. Copia de golden como base de prototipo.
4. `check:instantiation` antes de cerrar.

Prediccion: **9-10 de 13 validadores pasarian** vs los 1-4 que pasan hoy (mejora 3-9x). Las unicas excepciones serian `check-test-documented` y `check-runbook-documented` que aplican solo en fases QA (6) y Operacion (8) — features generadas estan en fase 0-1.

## v12.45.0
Release cohesivo que cierra **26 observaciones** acumuladas, agrupadas en 6 ejes.

### v12.45.1 — refinamiento de `check-orphan-evidence` (post-release)
- **F4 refinado**: el validador ahora acepta DOS formas de "no-huerfano": (1) el archivo aparece como `evidence_ref` en algun trace link, O (2) el archivo aparece como `source_file` (genero al menos un link durante `sync-memory`). Antes solo aceptaba (1), lo que clasificaba erroneamente archivos canonicos como `spec-tecnica.md` / `prototype.md` / `product-design.md` / `spdd-frontend.md` que son la FUENTE de la documentacion, no evidencia de otro RF.
- **Auto-registro de artefactos canonicos**: nueva funcion `syncCanonicalArtifacts(db, root)` se corre dentro de `sync-memory` despues de `syncTraceLinks`. Recorre cada `specs/<slug>/` y emite un trace link `target_type='doc'` por cada archivo canonico presente (`spec-funcional.md`, `spec-tecnica.md`, `spec-tareas.md`, `api-contract.md`, `traceability.md`, `prototype.md`, `prototype-validation.md`, `product-design.md`, `spdd-frontend.md`, `spdd-backend.md`, `ui-test-cases.md`). Origin = `auto-canonical-artifact`. Asi cada artefacto queda como `source_file` de al menos un link y `check-orphan-evidence` no lo reporta huerfano.
- **`check:orphan-evidence` ahora strict por default** en `package.json` (sin `--warn-only`). Los 10 validadores de `check:project` pasan verdes end-to-end.
- **Metricas post-fix**: 54 trace links (antes 33; +21 por auto-canonical), 16 archivos canonicos detectados y 16/16 conectados, evidence_ref verificadas verdes.



### Grupo A — validadores estrictos
- **A1 — `check-bd-documented` valida columna referenciada (no solo tabla)**: `extractFkTarget` ahora devuelve `{table, column}` y nuevo helper `extractColumnsOf` extrae las columnas declaradas de cada bloque `Tabla \`<name>\``. Resultado: si una FK declara `responsable_id -> usuario.id` pero el `spec-tecnica.md` de `usuario` no lista la columna `id`, la falla se reporta como `FK responsable_id -> usuario.id (tabla OK pero columna 'id' no esta declarada en usuario.md)`.
- **A2 — `check-api-documented` parsea JSON Schema basico**: nuevo helper `extractInlineSchemas` recoge cada bloque `schema:` (no `$ref`) bajo `responses:` / `requestBody:`, y `validateJsonSchemaBlock` exige `type:` con un valor JSON Schema valido (`object/array/string/number/integer/boolean`). Si `type=object` exige `properties:` con al menos un campo; si `type=array` exige `items:` con `type:` o `$ref:`.
- **A3 — `check-test-documented` con coverage POR RF granular**: nuevo `buildProdTraceIndex` recorre `src/`, `backend/`, `frontend/`, `stacks/` y construye un mapa `RF-X -> Set<file>` desde los `@trace`/`@covers`/`@implements` que esten en codigo de produccion. La cobertura por RF se calcula agregando lcov SOLO de esos archivos. Si no hay archivos marcados, cae al modo v12.37 (agregacion por slug). La razon de la agregacion (`rf-granular` vs `feature-slug-fallback`) aparece en el reporte.
- **A4 — `check-runbook-documented` exige SLO numerico verificable**: ya no basta con que exista `## SLO / SLI`; el body debe declarar al menos uno entre: `latencia p95 <= Xms`, `error rate < X%`, `disponibilidad >= X%`, `throughput >= X rps`. Patrones case-insensitive con `<= < >= > =` y decimales.
- **A5 — `plantilla prototype-validation.md` con regla canonica**: nueva seccion documenta que una validacion solo cuenta como aprobada cuando (1) `## Resultado` declara `Aprobado:` con participante humano, (2) al menos 4 filas obligatorias estan marcadas `[x]`, (3) los items pendientes estan en `## Observaciones aceptadas` con justificacion, (4) `## Gate` registra `gate-prototype-ready=passed`. Si no se cumple, el `display_status` del prototipo queda como `pending`/`documented` y `check:project` lo reporta como huerfano.

### Grupo B — memoria y meta
- **B1 — `syncGateRuns` con columna `origin`**: nueva columna nullable `origin` en `ai_gate_runs` con valores `global` (matriz raiz como `TRACEABILITY_MATRIX.md`), `feature` (per-feature bajo `specs/`) o `doc` (otros). Si una tabla de gates tiene columna `feature` poblada, la fila adquiere `origin='feature'` aunque viva en la matriz global. Esto permite distinguir cuando un gate fue declarado per-feature de cuando solo aparece en la vista consolidada.
- **B2 — validador nuevo `check-gates-mentioned`**: garantiza que cada feature real bajo `specs/` (slugs `NNN-...`, excluyendo `000-ejemplo-feature` y `README.md`) registre al menos un gate en `ai_gate_runs`. Acepta `--require-origin feature` para exigir gate per-feature (no contar la matriz global). Integrado en `check:project`.
- **B3 — `AI_CONTEXT.md` con `## Decisiones recientes` auto-regenerable**: nuevo bloque `<!-- auto:start name=decisiones-recientes -->` poblado por `buildRecentDecisionsBlock(db)` con las ultimas 5 decisiones de `ai_decisions` por `decided_at`. Cierra el gap entre ADRs/decisiones-ux y el contexto vivo del agente: ya no hay que abrir manualmente `adr/` para saber que se decidio recientemente.
- **B4 — `memory:bootstrap:quick`**: alias del bootstrap que omite el `embed-docs` final (analogo a `memory:sync:quick`). Util en iteraciones de desarrollo donde no necesitas embeddings actualizados y quieres ahorrar 20-30s.

### Grupo C — panel de acciones avanzado
- **C1 — alertas combinadas**: `/api/action-runs/alerts` ahora agrupa `failure-streak` + `duration-threshold` del mismo `action_id` en una sola alerta `kind='combined'` con `kinds[]` y `parts[]` originales. Pasa `?combine=0` para volver al formato plano. Reduce ruido visual cuando una accion tiene ambos problemas a la vez.
- **C2 — snooze por kind**: `ai_action_snoozes` ahora tiene columna `kind` (nullable). `POST /api/action-runs/snoozes` acepta `kind: 'failure-streak'` o `kind: 'duration-threshold'` para silenciar solo ese tipo. Si `kind` es `null` (default, compat) silencia todos. La filtracion en `/api/action-runs/alerts` honra el kind especifico.
- **C3 — webhook con retry/backoff exponencial**: `maybeNotifyAlerts` ahora reintenta hasta `MEMORY_ALERTS_WEBHOOK_RETRIES` veces (default 3) con backoff `MEMORY_ALERTS_WEBHOOK_BACKOFF_MS * 2^attempt` + jitter [+0..+25%]. 5xx y errores de red disparan retry; 4xx no (request mal formada). El audit log incluye `attempts` y el ultimo error si todos fallaron.
- **C4 — dashboard exportable como Markdown**: `/api/action-runs/dashboard?format=md` devuelve un Markdown listo para pegar en un canal/issue/reporte: tabla de comparacion actual-vs-anterior, top acciones por volumen, serie diaria de 14 dias. El front embebido tiene un link `⬇ Markdown` en la barra de Tendencias.
- **C5 — comparacion lado a lado de 2 acciones en Tendencias**: nuevo selector `Comparar con:` en el sub-tab Tendencias. Cuando hay una segunda accion seleccionada, se renderiza un segundo dashboard completo (success rate diario + volumen stacked + top + comparison banner) abajo del principal en `trends-host-b`. `renderTrendsDashboard` ahora acepta `hostId` parametro para multiplexar.

### Grupo D — status enhancements
- **D1 — `status --fail-on-drift`**: si `stale=true` o `embeddings_drift > 0`, exit code 1 (default 0). Util para CI/cron que quiere detectar memoria desincronizada como senal accionable.
- **D2 — `status --watch [seg]`**: refresca el reporte cada N segundos (default 5, min 2) limpiando pantalla con `\x1b[2J\x1b[H`. Util para vigilar la memoria mientras se editan markdowns. Ctrl+C sale.
- **D3 — `status --fix`**: si hay drift de embeddings, corre `embedDocuments(db)` automaticamente y re-reporta. El JSON incluye `embeddings.fixedDrift` con los nuevos creados. Solo aplica al drift de embeddings; staleness sigue siendo manual (re-sync).

### Grupo E — trace y query
- **E1 — `check-status-coherence`**: validador nuevo que verifica que `display_status` siempre coincida con lo que `computeDisplayStatus(link_status, target_type)` produciria. Detecta filas que quedaron con `display_status` heredado (ej. `planned` literal en una BD donde semanticamente deberia ser `pending`). Integrado en `check:project`.
- **E2 — vocabulario configurable via `MEMORY_DISPLAY_VOCAB`**: env var con formato `non-code:term1/term2/term3,documental:term1`. Proyectos en industrias con vocabulario propio (`draft/final/signed-off` en lugar de `pending/documented/approved`) pueden cambiarlo sin modificar codigo. `check-status-coherence` honra el mismo env var para no contradecirse.
- **E3 — filtro `display_status` en pane Trazabilidad**: nuevo selector `Filtrar por display_status` en el sub-tab "Por feature" del panel. Filtra los links visibles sin re-fetch del endpoint (cache local `COVERAGE_CACHE`). Cada grupo muestra `N visibles / total` cuando hay filtro activo. Util para "muestrame solo lo pending" o "solo lo validated".
- **E4 — `memory-query` con filtros combinados**: si se invoca `memory-query` SIN `--preset` pero con `--target-type` / `--display-status` / `--feature` / `--source-type` / `--link-status`, ejecuta un query libre con AND de todos los filtros sobre `ai_trace_links`. Ejemplo: `memory-query --target-type prototipo --display-status approved` devuelve solo prototipos aprobados. Soporta `--limit` (default 200, max 2000).

### Grupo F — evidence enhancements
- **F1 — `check-evidence-exists` con `did-you-mean`**: para cada evidencia inexistente, recorre `specs/`, `plantillas/`, `docs/`, `ai/`, `ops/`, `qa/`, `ci/`, `contracts/` y sugiere archivos cuyo basename sea identico o de Levenshtein <= 2. Cierra el bucle: en vez de "el archivo no existe", dice "el archivo no existe; quizas quisiste decir X o Y". Reduce drasticamente el tiempo de diagnosis cuando hay un typo en la matriz.
- **F2 — drill-down + git history en pane "Por feature"**: cada link con `evidence_ref` ahora muestra un `[git]` clickeable. Al hacer click, fetch a `/api/file-git-history?path=...&limit=10` que ejecuta `git log` (via `spawnSync` con separadores controlados, sin shell quoting). El historial se muestra en un `alert()` minimal con `sha date author subject`. Cierre del loop docs->git.
- **F3 — `by-evidence` con feature opcional**: el preset acepta sintaxis `<evidence>|<feature>` para acotar resultados a un slug especifico. Ejemplo: `memory-query --preset by-evidence --arg "spec-funcional.md|002-cambio-estado-expediente"` devuelve solo los RF de la feature 002 que comparten ese archivo. Evita ruido cuando hay varias features con el mismo nombre canonico de archivo.
- **F4 — validador nuevo `check-orphan-evidence`**: inverso de `check-evidence-exists`. Recorre `specs/` y reporta archivos canonicos (`spec-funcional.md`, `spec-tecnica.md`, `api-contract.md`, `traceability.md`, `prototype.md`, `prototype-validation.md`, `product-design.md`, `spdd-frontend.md`, etc.) que NO son referenciados como `evidence_ref` en `ai_trace_links`. Soporta `--include <regex>` para tipos custom y `--warn-only` para no romper CI. Integrado en `check:project`.

### Compatibilidad e integracion
- Schema: 1 columna nueva en `ai_gate_runs` (`origin`), 1 columna nueva en `ai_action_snoozes` (`kind`). Ambas via `ensureColumn`, sin migracion destructiva.
- Endpoints nuevos: `/api/action-runs/dashboard?format=md`, `/api/file-git-history`.
- Endpoints modificados: `/api/action-runs/alerts` agrupa por default (compat con `?combine=0`). `/api/action-runs/snoozes` (GET, POST) incluye `kind`.
- Scripts npm nuevos: `memory:bootstrap:quick`, `check:gates-mentioned`, `check:status-coherence`, `check:orphan-evidence`.
- `check:project` ahora corre 10 validadores (antes 7): los 7 originales + `check:gates-mentioned` + `check:status-coherence` + `check:orphan-evidence`.
- `check:template` sigue verde end-to-end (4 validadores, ningun cambio).

### Validacion final
- `npm run check:template` verde.
- `npm run check:bd-documented` verde (6 tablas, 5 documentadas).
- `npm run check:api-documented` verde (6 endpoints, 6 en openapi.yaml).
- `npm run check:gates-mentioned` verde (3 features reales con gates).
- `npm run check:status-coherence` verde (33 trace links coherentes).
- `npm run check:evidence-exists` verde (33 evidencias verificadas).
- Memoria con 33 trace links, 5 gate runs, 18 decisiones; `decisiones-recientes` poblado en `AI_CONTEXT.md` desde la primera sync.

## v12.44.0
- **Rebranding del nombre del paquete** (cierre de la observacion menor de la revision externa de v12.43): `package.json` raiz cambia de `"name": "@anthropic/project-template"` a `"name": "@ndavilal/project-template-ai-first"`. El nombre anterior podia confundir cuando se usaba como template propio o se publicaba en un registry; el nuevo deja claro que es el framework AI-first del owner del repo.
- **Auditoria de consistencia**: grep del repo completo confirma que `@anthropic/project-template` solo aparecia en `package.json` (la unica fuente de la verdad). Sin referencias huerfanas en docs, scripts, workflows o changelogs historicos.
- **Documentacion de la convencion** en `INSTANCIACION_PROYECTO_REAL.md`: nueva seccion "Convencion de nombre del paquete (v12.44+)" que explica que (1) el template canonico usa `@ndavilal/project-template-ai-first`, (2) los proyectos generados por `create-project` emiten `@org/<feature-slug>` que debe reemplazarse por el scope npm real (`@empresa/<servicio>`) antes del primer push, y (3) el scope debe coincidir con el namespace si se publica en registry privado (Verdaccio/GitHub Packages/Nexus).
- **Sin impacto funcional**: solo cambia el `name` declarativo. No afecta ningun script npm, validador, endpoint o comportamiento del agente. La memoria viva, los 7 validadores de `check:project`, los 4 de `check:template`, el panel UI con 25 acciones y los 17 presets siguen funcionando exactamente igual.
- **Validacion**: `npm run memory:sync` y `npm run check:all` verdes end-to-end con el nuevo nombre. Memoria con 267 docs, 2565 chunks/embeddings, 33 trace links 100% qualificados, freshness `fresca`.
- Version visible alineada a `v12.44.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.43.0
- **Cierre de los 4 pendientes futuros declarados en v12.42**. Cada uno cierra un hueco distinto: validacion activa de evidencias, query inversa por evidencia compartida, vista de coverage por feature en el panel, y auto-deteccion de columnas-path nuevas en la matriz.
- **Validador nuevo `check-evidence-exists.mjs`**: paralelo a `check-trace-drift` pero enfocado en `evidence_ref`. Para cada evidencia distinta en `ai_trace_links`, verifica que el archivo exista en disco. Reporta hallazgos activos (no solo silenciosa fallback como hacia v12.42). Ignora URLs (`http://...`), anchors (`#section`), paths absolutos Windows/Unix y placeholders. Soporta `--strict` (o `CHECK_STRICT=1`) para tambien marcar rutas cortas sin slash que no se pudieron qualificar. Integrado en `check:project` y `EXEC_ACTIONS` + copiado a proyectos generados.
- **Preset nuevo `by-evidence`**: encuentra todos los RF/RNF/HU que comparten una evidencia (path exacto o sub-string via LIKE). Acepta arg requerido. Util para responder "que requerimientos cubre `spec-funcional.md`?" o "que toca este archivo?". Excerpt incluye `display_status` para que la respuesta del agente sea inmediatamente accionable.
- **Endpoint nuevo `/api/coverage-by-feature`**: agrega los trace links por feature (extraida de `source_file` o `evidence_ref` con regex `^specs/([^/]+)/`). Devuelve por feature: links totales, sources distintas (RF/RNF), targets agrupados por tipo (hu/spdd/api/bd/codigo/test/...), breakdown de `display_status`. Util para dashboards externos y para el panel UI.
- **Sub-tab "Por feature" en pane Trazabilidad** del front embebido: render del endpoint `/api/coverage-by-feature` como cards (una por feature) con:
  - Header con nombre + counts (`N RF/RNF · M trace links · sources`).
  - Pills de `display_status` agregadas.
  - Grupos por tipo de target con orden `hu/spdd/prototipo/api/bd/codigo/test/estado` + cualquier tipo nuevo auto-detectado al final.
  - Cada link muestra `source_ref → target_ref` con su `display_status` pill + `evidence_ref` qualificado (gracias a v12.42).
- **Auto-deteccion de columnas-path nuevas en la matriz**: si una tabla en `traceability.md` tiene una columna cuyo header NO esta en `TRACE_COLUMN_MAP` (ej. `Runbook`, `Threat model`, `Diagrama c4`) y los valores parecen paths (`*.md`, `*.html`, `*.yaml`, `*.ts`, etc. o contienen `/`), se registra como `target_type='doc'` con `relation` derivada del header normalizado. Asi un equipo puede agregar columnas nuevas sin tocar el codigo del agente. El nuevo tipo `doc` esta incluido en `NON_CODE_TARGETS` (display_status: pending/documented/approved) y en `targetRefExists` (busca por path exacto o por mencion en `specs/`/`docs/`/`ops/`/`qa/`).
- **Pipeline `check:project` ampliado**: 7 validadores ahora (drift + coverage + bd + api + test + runbook + **evidence-exists**).
- **Validacion final**:
  - `check:evidence-exists`: 33 evidence_ref verificadas, cero hallazgos en el template canonico.
  - `by-evidence "spec-funcional.md"`: devuelve correctamente los RF de 002 y 003 que comparten ese archivo (cualificado por feature).
  - `/api/coverage-by-feature`: estructura JSON valida con 3 features (001/002/003) + breakdown completo.
  - HTML del panel UI contiene 30 marcadores nuevos v12.43.
  - `check:all`: verde end-to-end.
- Version visible alineada a `v12.43.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.42.0
- **Cierre de la observacion menor de la revision externa de v12.41**: normalizar `evidence_ref` para que TODOS los links tengan ruta completa (`specs/<feature>/<doc>.md`) cuando sea posible, no solo los que vienen de specs per-feature.
- **Helper nuevo `qualifyEvidenceRef(evidence, scopeFromFile, featureFromColumn, root)`**: funcion pura que normaliza paths con esta logica:
  1. Si `evidence` ya tiene `/` -> ya esta qualificado (`docs/...`, `specs/...`), devolver tal cual.
  2. Si el archivo fuente vive en `specs/<feature>/`, qualificar con ese scope.
  3. Si la fila viene de `TRACEABILITY_MATRIX.md` global y tiene columna `feature`, qualificar con `specs/<feature>/`.
  4. **Validacion best-effort**: si el path qualificado NO existe en disco, devolver el original (no inventar paths que el agente intentaria abrir y fallaria). Asi un `evidence_ref` como `internal-only.md` que no es archivo real queda inalterado en vez de generar `specs/X/internal-only.md` fantasma.
- **`syncTraceLinks` aprovecha la columna `Feature`**: misma idea que v12.38 hizo para gates, ahora aplicada a evidencias. Cuando la matriz global tiene `| Feature | RF | ... | Evidencia |`, cada fila usa su feature para qualificar la evidencia. Esto elimina el ultimo caso donde `spec-funcional.md` y `api-contract.md` quedaban como rutas cortas ambiguas.
- **Resultado validado sobre el template canonico**:
  ```
  Antes (v12.41):
    spec-funcional.md                                       (suelto, ambiguo)
    api-contract.md                                         (suelto, ambiguo)
    specs/001-bandeja-trabajo-expedientes/prototype-validation.md (ya qualificado)
    docs/fase-3-arquitectura/03.08-auth-authz.md            (ya absoluto)

  Ahora (v12.42):
    specs/001-bandeja-trabajo-expedientes/api-contract.md
    specs/001-bandeja-trabajo-expedientes/prototype-validation.md
    specs/002-cambio-estado-expediente/spec-funcional.md
    specs/003-historial-auditoria-expediente/spec-funcional.md
    docs/fase-3-arquitectura/03.08-auth-authz.md
  ```
  33 trace links distintos, TODOS con path completo y verificable. Cero referencias sueltas.
- **Impacto en agentes IA**: cualquier comando que devuelva `evidence_ref` (`next-task`, `memory-query`, panel UI de Historial/Trazabilidad) ahora muestra rutas que el agente puede abrir directamente sin "adivinar en que feature vive el documento". El reviewer puntualizo exactamente este caso:
  > "Para agentes IA seria mas robusto que todos los evidence_ref salgan normalizados con ruta completa cuando sea posible."
- **Validacion best-effort previene paths inventados**: si la matriz declara `evidencia: foo.md` y no existe `specs/<feature>/foo.md` en disco, el helper deja el path original (`foo.md`). Esto evita que el agente IA reciba un path "qualificado" que en realidad no apunta a ningun archivo real, lo que serial peor que el path corto original.
- **Backwards compat**: `link_status`, `display_status`, `source_file`, `validated_at` siguen funcionando exactamente igual. Solo cambia el contenido de `evidence_ref` cuando se puede mejorar. Los presets/queries que filtran por `source_file LIKE specs/<feature>/%` siguen igual.
- **Migracion**: sin pasos manuales. La proxima `npm run memory:sync` re-pobla `evidence_ref` con paths qualificados. Sin breaking change.
- **Validacion final**: `check:all` verde end-to-end. 33 evidence_ref distintos, 100% con ruta verificable.
- Version visible alineada a `v12.42.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.41.0
- **Distincion semantica `link_status` vs `display_status` por `target_type`** (cierre de observacion menor de la revision externa de v12.40). Antes, un link a un `prototipo.html` o un `endpoint API` se reportaba como `link_status='implemented'` — mismo vocabulario que un archivo de codigo real. El reviewer marco esto como ambiguo: "implementado" tiene sentido para `codigo`/`test` pero no para artefactos documentales como `spdd`/`api`/`bd`/`prototipo`. v12.41 cierra la observacion sin romper compat.
- **Nueva columna `ai_trace_links.display_status`** con vocabulario apropiado:
  - `target_type='codigo'` o `'test'`: `planned` / `implemented` / `validated` (igual a `link_status`).
  - `target_type='spdd'` / `'api'` / `'bd'` / `'prototipo'` / `'sdd'` / `'pantalla'` / `'componente'`: `pending` / `documented` / `approved`.
  - `target_type='hu'` / `'rf'` / `'rnf'` / `'estado'` (cross-references documentales): siempre `documented` cuando el link existe.
  - `inferred` y `drift` se preservan tal cual (estados raros).
- **Mapping en `syncTraceLinks`**: nuevo helper `computeDisplayStatus(linkStatus, targetType)` mapea segun el target. `link_status` se preserva 100% intacto para compatibilidad hacia atras — los presets viejos (`rf-implemented`, `rf-without-code`, `links-drift`) siguen funcionando exactamente igual. La distincion semantica es **aditiva**.
- **`harvestTraceFromSource` con `display_status='documented'`** por default (todos sus targets son HU/RF/RNF/ADR — cross-refs documentales).
- **3 presets nuevos** en `MEMORY_QUERY_PRESETS` enfocados en artefactos no-code:
  - `artifacts-pending`: target_type no-code con `display_status='pending'` (declarado pero sin doc real).
  - `artifacts-documented`: target_type no-code con `display_status='documented'` (existe en repo).
  - `artifacts-approved`: target_type no-code con `display_status='approved'` (Estado de fila marca aprobacion).
  Excluyen `codigo`/`test`/`estado` para evitar duplicado con `rf-implemented`/`rf-validated`/etc.
- **`status --json` enriquecido con `traceLinks.byDisplayStatus`**: breakdown por estado semantico para que dashboards y agentes vean de un vistazo "cuantos pending vs documented vs approved" sin tener que cruzar con target_type. Ejemplo en el template canonico: `{ "documented": 33 }` (todos los links del template estan documentados, ninguno pending/approved porque no hay codigo real).
- **Distribucion validada** en el template canonico:
  ```
  target_type   link_status   display_status   count
  -----------   -----------   --------------   -----
  HU            implemented   documented       6
  api           implemented   documented       6
  bd            implemented   documented       6
  estado        implemented   documented       5
  prototipo     implemented   documented       5
  spdd          implemented   documented       5
  ```
  Ningun target no-code dice `implemented` (que era ambiguo). Todos dicen `documented`.
- **Migracion idempotente**: `ensureColumn("ai_trace_links", "display_status", "TEXT")` agrega la columna a DBs existentes. La proxima `npm run memory:sync` la rellena automaticamente. Sin breaking change.
- **Validacion**:
  - `npm run memory:bootstrap`: OK (267 docs, 2562 chunks/embeddings, 33 trace links).
  - `npm run memory:query -- --preset artifacts-pending`: 0 resultados (correcto, template limpio).
  - `npm run memory:query -- --preset artifacts-documented`: 28 resultados (filtra correctamente excluyendo codigo/test/estado).
  - `npm run memory:query -- --preset artifacts-approved`: 0 resultados (correcto, no hay estados "Aprobado" formal en el template).
  - `npm run check:all`: verde end-to-end.
- Version visible alineada a `v12.41.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.40.0
- **Cierre de las 4 optimizaciones de UX/operacion** que dejaron pendientes v12.39: tolerancia configurable, `status --json`, `memory:sync:quick`, warning de drift de embeddings. Plus 1 fix de UX descubierto al testear (delta confuso en negativo).
- **`MEMORY_FRESHNESS_TOLERANCE_MS` env var** para override de la tolerancia de freshness (default 2000ms). Util para CI con clock skew entre runners (`MEMORY_FRESHNESS_TOLERANCE_MS=60000`) o modo estricto para debugging (`MEMORY_FRESHNESS_TOLERANCE_MS=0`). El valor se evalua una vez al cargar el modulo. `memoryFreshness` devuelve siempre `toleranceMs` en su resultado.
- **`status --json` mode**: el comando `status` ahora acepta `--json` y devuelve estructura parseable para integraciones (CI dashboards, pipelines, otros agentes):
  ```json
  {
    "dbPath": "...",
    "fts5": true,
    "counts": { "documents": 267, "chunks": 2561, "traceLinks": 33, ... },
    "freshness": { "stale": false, "lastIndexed": "...", "newestSource": "...", "deltaMs": 94, "toleranceMs": 2000 },
    "embeddings": { "total": 2561, "chunks": 2561, "drift": 0 }
  }
  ```
- **Script `memory:sync:quick`** en `package.json` (root + emitido por generador). Cadena: `sync-memory && regenerate-context && index-docs` — salta el `embed-docs` final. Util cuando solo cambia metadata (gates, decisiones, sesiones) y no contenido que requiera nueva vectorizacion. Ahorra 2-10s en sync rapido. El `embed-docs` se puede correr aparte despues con `npm run memory:embed` cuando convenga.
- **Warning de drift de embeddings**: si `chunks > embeddings`, `status` reporta:
  ```
  Embeddings: 2551 (DRIFT: 10 chunks sin embedding)
  Embeddings drift: 10 chunks sin embedding.
    Ejecuta: npm run memory:embed   (o corre 'memory:sync' que ya lo hace al final)
  ```
  Aparece tanto en modo texto como en `--json` (`embeddings.drift > 0`). El comando no rompe; es una sugerencia accionable. Captura el escenario donde un agente IA corre `memory:sync:quick` repetidamente sin `embed-docs` y los chunks nuevos quedan sin vectorizar.
- **Fix de UX descubierto al testear: delta confuso negativo**. En Windows con timezone local distinto a UTC, `fs.statSync().mtimeMs` y SQLite `CURRENT_TIMESTAMP` pueden diferir en horas (interpretacion local vs UTC). El delta antes mostraba `delta -17999924ms`. Ahora solo se muestra cuando es `> 1000ms` (markdown realmente mas nuevo que index) y se formatea en segundos: `delta +5s (tolerancia 2s)`. Si el delta es negativo (BD adelantada por timezone o re-index posterior), no se muestra — no aporta informacion al usuario.
- **Validacion final** (5 tests):
  - `status` texto sin delta confuso: `Freshness: fresca` clean.
  - DRIFT auto-detectado tras borrar 3 embeddings: `Embeddings: 2551 (DRIFT: 10 chunks sin embedding)` + sugerencia.
  - `status --json` valido: JSON parseable con `freshness.toleranceMs`, `embeddings.drift`.
  - `MEMORY_FRESHNESS_TOLERANCE_MS=0` override aplicado: `toleranceMs: 0` en json.
  - `memory:sync:quick` salta `embed-docs` correctamente (sin linea "Embeddings locales generados").
- Version visible alineada a `v12.40.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.39.0
- **Cierre de los 2 hallazgos finales de la revision externa de v12.38**: falsos `STALE` por precision de timestamp y embeddings incompletos por orden incorrecto del bootstrap. Ambos eran sutiles y solo se manifestaban en logs/status, pero erosionaban la confianza en la memoria viva.
- **Fix 1 — falsos `STALE` por precision de timestamp**: SQLite guarda `updated_at` con `CURRENT_TIMESTAMP` en precision de segundos (`xx:xx:34`), mientras que el filesystem reporta `mtimeMs` en milisegundos (`xx:xx:34.524`). Cuando `regenerate-context` modifica `AI_CONTEXT.md` justo antes de `index-docs`, los ~500ms de diferencia generaban `STALE` perpetuo aunque la BD si tenia los datos. Fix: `memoryFreshness` ahora aplica tolerancia explicita de **2000ms** (`FRESHNESS_TOLERANCE_MS`). Si `newestSource - lastIndexed <= 2000`, no se marca como stale. La funcion ahora tambien expone `deltaMs` y `toleranceMs` en el resultado para diagnostico. Resultado: `status` reporta `fresca` consistentemente tras `npm run memory:bootstrap` o `memory:sync`.
- **Fix 2 — embeddings incompletos por orden incorrecto**: la cadena anterior era `init-memory && index-docs && sync-memory && embed-docs && regenerate-context && index-docs`. El problema: `regenerate-context` modifica `AI_CONTEXT.md` y `SESSION_LOG.md`, lo que crea chunks nuevos cuando `index-docs` re-indexa. Pero `embed-docs` ya habia corrido ANTES, asi que los chunks nuevos quedaban sin embedding. Resultado tipico: `Chunks: 2560 / Embeddings: 2550` con 10 chunks huerfanos. Fix: reordenar a `init-memory && index-docs && sync-memory && regenerate-context && index-docs && embed-docs` — `embed-docs` ahora es el ULTIMO paso, cubre todos los chunks generados por la cadena completa. `memory:sync` recibe el mismo reorden: `sync-memory && regenerate-context && index-docs && embed-docs`. Resultado: `Chunks: 2560 / Embeddings: 2560` consistente.
- **Aplicado tambien en el generador**: el `package.json` que emite `create-project` para proyectos reales tiene los mismos scripts corregidos. Los proyectos generados desde v12.39 nacen sin estos 2 bugs.
- **Validacion final**: tras `rm ai/memory/framework-agent.db && npm run memory:bootstrap`:
  - `Chunks: 2560` y `Embeddings: 2560` (eran 2560 y 2550 antes).
  - `Freshness: fresca (ultimo indexado ... markdown mas reciente ...)` (era `STALE` por <1s).
  - `check:all`: verde end-to-end.
- Version visible alineada a `v12.39.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.38.0
- **Cierre de los 3 hallazgos de la revision externa de v12.36** (el reviewer no habia visto v12.37 todavia; las 3 correcciones siguen aplicando porque ninguna se habia abordado).
- **PRIORIDAD 3 (critico) — `syncGateRuns` usa columna `Feature` del scope correcto**: antes, cuando `TRACEABILITY_MATRIX.md` tenia 3 filas con `gate-prototype-ready` para 001, 002 y 003, el parser usaba el scope del archivo (vacio para root) y la clave `gate::scope` deduplicaba las 3 a una sola fila. Resultado: AI_CONTEXT.md decia "no hay gates pendientes" cuando la matriz si tenia 2 pendientes reales (002 y 003). Fix: si la tabla tiene columna `feature` o `spec`, cada fila usa `specs/<feature>` como su propio scope. Antes 1 gate-prototype-ready unico en BD; ahora 3 gates separados (001 con estado "Listo para validacion" y 002+003 con "Pendiente"). AI_CONTEXT.md regenerado ahora muestra `gate-prototype-ready en specs/002-cambio-estado-expediente - Pendiente` y `gate-prototype-ready en specs/003-historial-auditoria-expediente - Pendiente` con autor + fecha desde git.
- **PRIORIDAD 1 — path Windows en `docs/transversal/90.31-adopcion-caso-real-expediente.md`**: el texto tenia `` `C:\template\project-template\catalog\all.yaml` `` entre backticks, lo que `check-markdown-paths` interpretaba como ruta verificable del repo (y fallaba porque ese path Windows absoluto no existe como ruta relativa). Fix: cambiar a `` `catalog/all.yaml` `` (ruta relativa que SI existe) + mencion de la ruta absoluta Windows como texto plano sin backticks. `check:template` ahora pasa verde.
- **PRIORIDAD 2 — `memory:bootstrap` y `memory:sync` no dejan STALE**: la causa era que `regenerate-context` modifica `AI_CONTEXT.md` al final, lo que dejaba el "markdown mas reciente" mas nuevo que el "ultimo indexado" y `status` reportaba `STALE`. Fix: agregar un `index-docs` final despues de `regenerate-context` en ambos scripts (root + emitidos). Resultado: `Freshness: fresca` consistente.
- **`memory:bootstrap` ahora**: `init-memory && index-docs && sync-memory && embed-docs && regenerate-context && index-docs`. El segundo `index-docs` es barato (solo re-indexa los archivos modificados, en este caso solo AI_CONTEXT.md y SESSION_LOG.md). Agrega ~50-200ms al bootstrap pero garantiza freshness final.
- **`memory:sync` ahora**: `sync-memory && regenerate-context && index-docs`. Mismo patron.
- **Mismos fixes en el generador**: `package.json` que emite `create-project` para proyectos reales tambien tiene los scripts corregidos. Los proyectos generados desde v12.38 nacen sin el bug STALE.
- **Validacion final**:
  - `status` reporta `Freshness: fresca (ultimo indexado >= markdown mas reciente)`.
  - `ai_gate_runs` tiene 5 filas con scope correcto: 3 para 001, 1 para 002, 1 para 003 (antes solo 3 globales sin distincion).
  - `AI_CONTEXT.md` zona `gates-pendientes` muestra los 2 gates reales pendientes con autor/fecha.
  - `check:template`, `check:project`, `check:all`: verdes end-to-end.
  - `check-markdown-paths`: OK (0 hallazgos).
- Version visible alineada a `v12.38.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.37.0
- **Cierre de 5 pendientes del backlog**: 4 validadores con verificaciones semanticas profundas (FK targets, shape OpenAPI, coverage lcov, spdd-frontend obligatorio) + 1 validador nuevo (`check-runbook-documented` para fase 8).
- **`check-bd-documented` con verificacion de FK targets reales**: ademas de validar tipos SQL, ahora detecta columnas FK (patrones `apunta a \`<tabla>.<col>\``, `FK -> <tabla>.<col>`, `REFERENCES <tabla>(<col>)`) y exige que la tabla referenciada este documentada con marca canonica `Tabla \`<nombre>\`` en algun spec-tecnica.md. Tablas builtin/cross-cutting (`usuario`, `user`, `auth`, `role`, `permission`) se excluyen del check (suelen vivir en infra compartida fuera de specs). Mensaje accionable identifica columna + tabla huerfana.
- **`check-api-documented` con shape de request/response**: parser ligero YAML extendido para capturar el bloque completo de cada `method:` (request body, parameters, responses) y validar que:
  - tiene `responses:` con al menos un status code (200/201/204/4xx/etc.).
  - para POST/PUT/PATCH (write methods), tiene `requestBody:` con schema o $ref.
  El check da exit 1 con `API SIN SHAPE` listando los huecos por endpoint. Antes solo verificaba que el path estuviera; ahora exige que ademas tenga contenido minimo de contrato.
- **`check-test-documented` con coverage real lcov**: si existe `coverage/lcov.info` (o variantes), parser SF/LH/LF/BRH/BRF que recolecta cobertura por archivo. Para cada feature en fase >=6, agrega lineas hit/total de archivos bajo `src/<slug>/` (o `backend/<slug>/`, `frontend/<slug>/`) y valida que el porcentaje supere `--min-coverage` (default 70%). Si no hay lcov, el check no rompe (compat). Mensaje accionable indica feature + RF + porcentaje + minimo exigido.
- **Plantilla `plantillas/fase-4-sdd/spdd-frontend.md` reescrita con regla v12.37+**: secciones `## Componentes principales`, `## Estados UI` y `## Permisos visibles` son obligatorias. Cada estado UI debe tener trigger + feedback visual; cada permiso debe mapear a rol/permiso de la matriz RBAC. Patron paralelo a spec-tecnica.md (v12.34), api-contract.md (v12.35) y spec-funcional.md (v12.36).
- **`check-ai-artifacts` extendido con `spdd-frontend.md`**: agregado `SPDD_FRONTEND_SECTIONS` con los 3 headers obligatorios. Si un spdd-frontend.md existe (no todas las features lo tienen) y le falta alguna seccion, reporta y rompe CI.
- **`check-runbook-documented` nuevo validador**: para features en fase >=8 (Operacion), exige que exista `ops/fase-8-operacion/features/<slug>/runbook.md` (o variantes `ops/features/<slug>/`, `ops/<slug>/`) con las 4 secciones que un operador necesita en una madrugada:
  - `## Procedimiento normal`
  - `## Procedimiento de fallo`
  - `## SLO / SLI`
  - `## Contactos`
  Si phase <8, el check no aplica (runbook aspiracional es normal antes de produccion). Detecta features fase 8 por (a) `phase` explicita en ai_documents o (b) existencia de runbook.md en alguna ubicacion ops/.
- **Integracion en el pipeline**:
  - `EXEC_ACTIONS`: nueva entrada `check-runbook-documented` con `acceptsDb: true`. Labels de `check-test-documented` y otros actualizados con el alcance v12.37.
  - `package.json` (root + emitido): nuevo script `check:runbook-documented` standalone + agregado a `check:project`.
  - `LIVE_FRAMEWORK_FILES_TO_COPY`: `ci/scripts/check-runbook-documented.mjs` se copia a proyectos generados.
  - Total validadores en `check:project`: **6** (drift + coverage + bd + api + test + runbook). Total scripts npm `check:*`: **12**.
- **Aplicado al template canonico**: agregada seccion `## Permisos visibles` en `specs/001-bandeja-trabajo-expedientes/spdd-frontend.md` con 5 permisos mapeados a la matriz RBAC. Sin esto, `check-ai-artifacts` ahora habria reportado fail.
- **Validacion final**:
  - `check:bd-documented`: OK (FK validation activa pero builtin set acepta `usuario`).
  - `check:api-documented`: OK con shape validation (6 endpoints en openapi.yaml con responses + requestBody donde aplica).
  - `check:test-documented`: OK (no fase >=6).
  - `check:ai-artifacts`: OK con spdd-frontend obligatorio activo.
  - `check:runbook-documented`: OK (no fase >=8).
  - `check:all`: verde end-to-end con TODAS las verificaciones extra activas.
- Version visible alineada a `v12.37.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.36.0
- **5 validadores endurecidos + 1 plantilla nueva + concurrency mas estricto**: cierra el ultimo lote de pendientes del backlog acumulado. Cada validador ahora chequea propiedades semanticas, no solo presencia.
- **`check-bd-documented` con tipos SQL conocidos**: ademas de exigir tabla markdown + PK + indices, valida que cada columna use un tipo SQL reconocido (TEXT, UUID, INT, INTEGER, BIGINT, SMALLINT, SERIAL, DECIMAL, NUMERIC, REAL, FLOAT, DOUBLE, BOOLEAN, DATE, TIME, TIMESTAMP, TIMESTAMPTZ, JSON, JSONB, BYTEA, BLOB, etc.). Si un agente IA inventa un tipo (ej. `STR` o `TIMESTAMP_NEW`), el validador lo reporta con el nombre exacto de la columna. Acepta tipos con tamaño (`VARCHAR(255)`, `DECIMAL(10,2)`) y modifiers (`NULL`, `NOT NULL`, `FK`, `UNIQUE`, `REFERENCES`).
- **`check-api-documented` con validacion OpenAPI**: si existe `contracts/api/openapi.yaml` o `specs/<feature>/openapi.yaml`, el validador exige que CADA endpoint declarado en la matriz aparezca tambien ahi (no solo en `api-contract.md`). Parser ligero del YAML sin dependencias externas (busca `  /path:` seguido de `    method:` con indentacion). Si NO existe ningun openapi.yaml, la verificacion adicional se salta (compat hacia atras con v12.35).
- **`check-test-documented` con verificacion de `@trace RF-XX`**: ademas de exigir que exista archivo real de test, ahora exige que el archivo contenga un comentario `@trace RF-XX`, `@covers RF-XX` o `@implements RF-XX` que matchee el RF asociado en la matriz. Cierra el ciclo: el codigo de test debe referenciar explicitamente el RF que cubre. Sin esto, "tener un archivo con nombre similar al test" no garantiza que ese test efectivamente cubra el RF.
- **`check-ai-artifacts` con secciones obligatorias en `spec-funcional.md`**: cada `specs/<feature>/spec-funcional.md` debe tener `## Requerimientos`, `## Criterios de aceptacion` y `## Reglas de negocio`. Sin estas, el agente IA no puede responder "que RF cubre esta feature" sin alucinar y la matriz queda huerfana de definicion funcional. Mensaje accionable con la ruta del archivo y la seccion faltante.
- **Plantilla `plantillas/fase-4-sdd/spec-funcional.md` con regla v12.36+**: nueva seccion `## Requerimientos` con ejemplo `RF-01` / `RNF-01`. Tabla `## Criterios de aceptacion` con columna "Estado". `## Reglas de negocio` con guia de redaccion declarativa. Patron paralelo al spec-tecnica.md de v12.34 y api-contract.md de v12.35.
- **Workflows con concurrency mas agresivo**: `concurrency.group` ahora usa `${{ github.event.pull_request.number || github.ref }}`. Cada push nuevo a un PR cancela el run anterior del mismo PR, ahorra minutos de CI y feedback mas rapido. Aplicado a `template-checks.yml` y `project-checks.yml`.
- **4 spec-funcional.md canonicos actualizados** con las nuevas secciones para que `check:all` pase verde:
  - `specs/000-ejemplo-feature/spec-funcional.md`: agregada `## Requerimientos` (RF-01 + RNF-01).
  - `specs/001-bandeja-trabajo-expedientes/spec-funcional.md`: agregadas `## Requerimientos` (RF-02 + RNF-01 + RNF-03) y `## Reglas de negocio` (ambito, orden, paginacion, correlationId).
  - `specs/002-cambio-estado-expediente/spec-funcional.md`: agregadas `## Requerimientos` (RF-03 + RF-04 + RNF-03) y `## Reglas de negocio` (RN-02, RN-03, validacion backend).
  - `specs/003-historial-auditoria-expediente/spec-funcional.md`: agregadas `## Requerimientos` (RF-04 + RNF-03) y `## Reglas de negocio` (solo lectura, orden, paginacion, fechas).
- **`contracts/api/openapi.yaml` extendido**: agregados `PUT /api/expedientes/{id}/estado` (alias semantico de POST transiciones) y `GET /api/expedientes/{id}/historial`. Resuelve los 3 huerfanos que reportaba check-api-documented al activar la validacion OpenAPI.
- **Validacion final**: `check:all` verde end-to-end con todas las verificaciones extra activas. 6 endpoints en matriz, 7 entradas en api-contract.md, 6 en openapi.yaml. 5 tablas con columnas + tipos SQL validados. Spec-funcional + spec-tecnica obligatorias cumplidas en las 4 features canonicas.
- Version visible alineada a `v12.36.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.35.0
- **Cierre de 7 pendientes en 1 release cohesivo**: 3 de coherencia/cobertura (phases granulares + secciones obligatorias + GH Actions) + 4 de validadores extendidos (check-bd-documented con columnas minimas + check-api-documented + check-test-documented + plantilla api-contract con regla).
- **`check-trace-coverage` con phases granulares (4 vs 5 vs 6)**: antes era binario "fase >=5 exige codigo + test" o nada. Ahora aplica reglas por fase:
  - Fase 4 (SDD): no exige codigo ni test (planificacion).
  - Fase 5 (Construccion): codigo obligatorio (error si falta); test recomendado (warning si falta, no rompe build).
  - Fase 6+ (QA): codigo + test ambos obligatorios.
  - El validador distingue `error` vs `warning` y exit-codes acorde. Permite enmendar el reporte por fase real, no solo "esta o no esta en fase 5+".
- **`check-bd-documented` con verificacion de columnas minimas**: ademas de exigir `Tabla \`<nombre>\``, ahora valida que el bloque tenga (a) tabla markdown `| Columna | Tipo | Notas |`, (b) declaracion de PK (palabra `PK` o `PRIMARY KEY`), y (c) seccion `Indices: ...` con al menos un indice. Mensaje accionable por cada hueco. Antes una tabla podia tener solo el header `Tabla \`x\`` y pasaba; ahora se exige el detalle.
- **`check-api-documented` nuevo validador** (paridad con bd-documented): para cada `target_type='api'` en `ai_trace_links`, verifica que exista una marca `METHOD /path` en algun `api-contract.md` del repo (de la feature o global). Filtra valores que no son endpoints reales (ej. `401/403` que es descripcion de respuestas). Mismo patron que bd: estricto, sin falsos positivos.
- **`check-test-documented` nuevo validador**: para cada `target_type='test'` en features con `phase >= 6`, verifica que exista archivo real en `tests/`, `qa/`, `src/<feature>/`, etc. cuyo nombre contenga el needle. En features con phase < 6 no se aplica (nombres aspiracionales son normales). Filtra placeholders y descripciones (ej. `e2e seguridad`, `performance/smoke`).
- **`check-ai-artifacts` extendido con `## Modelo de datos` obligatoria** en cada `specs/<feature>/spec-tecnica.md`. Antes solo validaba skills + prompts; ahora tambien spec-tecnica.md de cada feature. Si falta la seccion, falla CI con mensaje accionable.
- **Plantilla `plantillas/fase-4-sdd/api-contract.md` reescrita** con regla v12.35+, ejemplo canonico de endpoint (`METHOD /api/<resource>`), tabla de errores estandarizada, caso "no expone API propia" (consume de otra feature). Mismo patron que `spec-tecnica.md` de v12.34.
- **GitHub Actions workflows preconfigurados**:
  - `.github/workflows/template-checks.yml` corre `npm run check:template` en PR que toca `ai/`, `ci/`, `docs/`, `plantillas/`, `specs/`, `scripts/`, etc. Cubre coherencia del template (links, hub, ai-artifacts, markdown-paths).
  - `.github/workflows/project-checks.yml` corre `npm run check:project` en PR que toca `src/`, `backend/`, `frontend/`, `tests/`, `qa/`, traceability.md, spec-tecnica.md, api-contract.md. Cubre trazabilidad (drift, coverage, bd/api/test-documented).
  - Ambos hacen bootstrap de memoria + paths-filter para no correr cuando no aplica.
- **3 validadores nuevos integrados en pipeline**:
  - `EXEC_ACTIONS`: 3 entradas nuevas en categoria validador (`check-bd-documented` ampliado + `check-api-documented` + `check-test-documented`, todos con `acceptsDb: true`).
  - `package.json` root + emitido: scripts standalone `check:bd-documented`, `check:api-documented`, `check:test-documented` + agregados a `check:project`.
  - `LIVE_FRAMEWORK_FILES_TO_COPY`: los 3 .mjs se copian a proyectos generados.
  - Total validadores en `check:project`: 5 (drift + coverage + bd + api + test). Total scripts npm `check:*`: 11.
- **Aplicado al template canonico** para que la regla pase verde:
  - `specs/001/spec-tecnica.md`: tabla `rbac` ampliada con `id PK` y `Indices: (rol, permiso) UNIQUE`.
  - `specs/003/spec-tecnica.md`: agregada seccion `## Modelo de datos` que declara que esta feature no introduce tablas y referencia las existentes (`transicion_estado`, `expediente`).
  - `specs/002/api-contract.md`: creado con `PUT /api/expedientes/{id}/estado` y `PATCH` documentados.
  - `specs/003/api-contract.md`: creado con `GET /api/expedientes/{id}/historial`.
- **Bug fix descubierto durante testing**: el block comment de `check-test-documented.mjs` contenia `src/**/__tests__/` y el `*/` cerraba el comentario prematuramente, causando SyntaxError "Unexpected identifier 'No'" en la primera linea de codigo despues. Corregido a `src/<feature>/__tests__/`. Lección: nunca usar `*/` dentro de un block comment, ni siquiera escapado.
- **Validacion final**:
  - `check:bd-documented`: 6 tablas declaradas, 5 documentadas con columnas minimas, 0 huerfanos.
  - `check:api-documented`: 6 endpoints declarados, 7 entradas documentadas, 0 huerfanos.
  - `check:test-documented`: OK (no hay features fase >=6).
  - `check:ai-artifacts`: OK (skills + prompts + spec-tecnica).
  - `check:all`: verde end-to-end.
- Version visible alineada a `v12.35.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.34.0
- **El patron "tabla BD documentada en spec-tecnica.md" ya no vive solo en el ejemplo canonico**: con v12.33 documentamos `transicion_estado` en `specs/002/spec-tecnica.md` para resolver un drift puntual, pero los demas agentes (Claude, Codex, Cursor, Gemini, Copilot) no tenian forma de saber que debian replicar el patron en proyectos reales. v12.34 lo formaliza en 4 puntos:
  - **Plantilla `plantillas/fase-4-sdd/spec-tecnica.md`** con seccion `## Modelo de datos` declarativa: incluye regla v12.34+, plantilla copy-paste de tabla canonica (`Tabla \`<nombre>\``, columnas, indices, restricciones) y caso de tabla compartida ("Esta feature no introduce tablas. Consume `X` documentada en specs/<otra>/spec-tecnica.md").
  - **Generator emission de `spec-tecnica.md`** en `create-project`: ahora emite la seccion completa con tabla de ejemplo basada en `ctx.apiResourceName` + indices realistas + restricciones. Cualquier feature nueva nace con la doc canonica.
  - **Validador nuevo `ci/scripts/check-bd-documented.mjs`**: para cada `target_ref` en `target_type='bd'` de `ai_trace_links`, verifica que exista `` Tabla `<nombre>` `` (o `Tabla **<nombre>**`) en algun `specs/**/spec-tecnica.md` del repo. Filtra placeholders (`-`, `tbd`, `n/a`). Si la tabla esta declarada en la matriz pero no aparece con marca canonica en ningun spec-tecnica.md, falla CI con un mensaje accionable que apunta a la plantilla.
  - **Documentacion explicita en `INSTANCIACION_PROYECTO_REAL.md`**: nueva seccion "Convencion BD" con el ejemplo de `transicion_estado` + las 3 opciones (documentar / referenciar / usar `-`) + comandos de verificacion. Cualquier agente IA que abra el repo encuentra el patron en la guia obligatoria.
- **Doc canonica de `expediente` y `rbac` agregada a `specs/001-bandeja-trabajo-expedientes/spec-tecnica.md`**: el template predica la regla y la cumple. `expediente` (tabla principal con 8 columnas + 3 indices) y `rbac` (matriz rol-permiso con scope opcional) quedan documentadas formalmente.
- **`check:bd-documented` se integra en el pipeline**:
  - En el panel UI: nueva accion en `EXEC_ACTIONS` (categoria validador, `acceptsDb: true`).
  - En `package.json` root y emitido: `check:bd-documented` standalone + agregado a `check:project = trace-drift + trace-coverage + bd-documented`.
  - En `LIVE_FRAMEWORK_FILES_TO_COPY`: el `.mjs` se copia a proyectos generados desde el dia 1.
- **Por que es mas estricto que `check-trace-drift`**: `check-trace-drift` usa `targetRefExists('bd', ...)` que busca cualquier mencion del nombre en specs/. Eso permite que un parrafo casual con la palabra `transicion_estado` la marque como implementada sin que haya entity formal. `check-bd-documented` exige la marca canonica `` Tabla `<nombre>` `` para evitar ese falso positivo.
- **Validacion sobre el template canonico**:
  - 6 BD declaradas en la matriz (con duplicados): `expediente` (3x), `transicion_estado` (2x), `rbac` (1x).
  - 5 tablas unicas documentadas con marca canonica: `expediente`, `rbac`, `transicion_estado` (mas las 2 nuevas de v12.33).
  - `check:bd-documented`: 0 huerfanos.
  - `check:all`: verde end-to-end con el nuevo validador activo.
- Version visible alineada a `v12.34.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.33.0
- **Template CI-green**: cierra los 4 puntos que dejaba la revision externa antes de poder confiar el template a agentes IA sin supervision. `npm run check:template` y `npm run check:project` ahora pasan en verde, y `npm run check:all` tambien.
- **Drift legitimo de `RF-04 → bd:transicion_estado` resuelto**: la tabla estaba declarada en la matriz pero no documentada en ninguna spec. Ahora `specs/002-cambio-estado-expediente/spec-tecnica.md` tiene una seccion "Modelo de datos" con la tabla `transicion_estado` (columnas, indices, restriccion append-only). `targetRefExists('bd', ...)` la encuentra en `specs/`, el link pasa a `link_status='implemented'` y `check-trace-drift` reporta 0 drifts.
- **`check-trace-coverage`: ELIMINADO el fallback heuristico**: la version v12.32 todavia decia "si existe `spec-tareas.md`, asumir fase >=5". Eso era incorrecto: `spec-tareas.md` es de **fase 4** (SDD planning), no de fase 5 (construccion). El fallback marcaba como construccion features que aun estaban en SDD y exigia cobertura cuando no correspondia. Ahora el validador solo confia en (1) `phase` explicita de `ai_documents` o (2) existencia de `src/<feature>/`, `backend/<feature>/`, `frontend/<feature>/` (codigo real, no plan).
- **Separacion de checks `check:template` vs `check:project`**: pipelines diferentes para casos de uso diferentes.
  - `check:template` = `check:docs + check:prototype-hub + check:ai-artifacts + check:markdown-paths`. Cubre el template canonico que SI debe estar en verde porque no tiene codigo real.
  - `check:project` = `check:trace-drift + check:trace-coverage`. Tiene sentido en proyectos reales con codigo en construccion. En el template canonico (sin codigo) es informativo y tambien queda en verde porque RF-04 ya no driftea y ninguna feature esta en fase >=5.
  - `check:all` = `check:template && check:project` (verde end-to-end).
- **Mismos scripts emitidos a proyectos generados**: el `package.json` del template y el emitido a proyectos reales por `create-project` ahora tienen ambos splits + los 2 validadores faltantes en `LIVE_FRAMEWORK_FILES_TO_COPY` (`check-ai-artifacts.mjs` + `check-markdown-paths.mjs`). Los proyectos generados pueden hacer `npm run check:template` desde el dia 1.
- **Nuevo preset `rf-not-implemented`**: union de `rf-without-code` y `rf-without-test` con SQL claro. Responde sin ambiguedad la pregunta "¿que RFs me faltan implementar (codigo OR test)?". Antes habia que correr 2 presets y unir mentalmente; ademas `rf-planned` era confuso porque solo devolvia los que tenian un nombre fantasma en la matriz, no todos los huecos. La label del nuevo preset es "Requerimientos sin codigo O sin test reales (cualquier hueco)" y la label de `rf-planned` se aclaro a "Requerimientos con artefacto declarado pero inexistente (drift)".
- **Validacion sobre el corpus del template (CI-green)**:
  - `check-trace-drift`: 22 trace links validados, cero drift (antes 1).
  - `check-trace-coverage`: OK, no hay features en fase >=5 (correcto: el template no tiene `src/<feature>/`).
  - `check-template`: OK end-to-end.
  - `rf-implemented`: 0 (correcto).
  - `rf-not-implemented`: 5 (RF-02, RF-03, RF-04, RNF-01, RNF-03 — los huecos reales).
  - `rf-planned`: 0 (antes 1 por `transicion_estado`; ahora resuelto via documentacion).
- Version visible alineada a `v12.33.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.32.0
- **Cierre de 8 pendientes** (3 de v12.31 + 5 de v12.30) en una version cohesiva.
- **`harvestTraceFromSource` separa `source_file` de `evidence_ref`**: antes ambos eran `rel` (la ruta del archivo). Ahora `source_file` queda como path puro (`src/foo.ts`) y `evidence_ref` carga la cita semantica con linea: `src/foo.ts:42 @trace RF-02`. Mas util para drill-down a la linea exacta.
- **`check-trace-coverage` con phase explicita**: antes solo infería fase 5+ por existencia de `spec-tareas.md`. Ahora consulta `ai_documents.phase` (poblada por `index-docs` desde el path/heading) y considera la feature activa si CUALQUIER `.md` de su scope tiene `phase >= minPhase`. Mapeo numerico flexible: `fase-5`, `5`, `construccion` -> 5. Fallback a la heuristica para BDs antiguas.
- **Zona `auto:start name=stack` en `AI_CONTEXT.md`**: nueva zona regenerable que lee del repo en este orden: (1) `template.config.json` -> `project.stack`; (2) `package.json` -> `engines.node`; (3) `stacks/` -> lista de directorios. Antes la linea `Stack: Node 20+` estaba hardcodeada y se quedaba congelada cuando el template pedia Node 22+. Aplica a la raiz Y a la plantilla emitida en proyectos generados.
- **Filtros multi-select en Historial (CSV)**: `action_id`, `status` y `mode` ahora aceptan CSV (`?action_id=status,sync-memory&status=ok,fail&mode=stream`). UI con `<select multiple size="N">`. URL persistente: `act_action=a,b,c`. Helper `multiCsv(id)` compartido entre `loadHistory`, `writeFiltersToUrl` y `populateActionFilter`.
- **Webhook con plantilla custom**: env nuevas `MEMORY_ALERTS_WEBHOOK_TEMPLATE` (inline JSON con placeholders) y `MEMORY_ALERTS_WEBHOOK_TEMPLATE_FILE` (path a archivo). Interpolacion soportada: `{action_id}`, `{consecutive_failures}`, `{window}`, `{last_success}`, `{latest_started_at}`, `{kind}`, `{detail}`, `{timestamp}`. Si no se define plantilla, sigue el formato Slack/JSON anterior. Util para integrar con Discord, Teams, Mattermost, PagerDuty.
- **Alertas por umbral de duracion (`kind: 'duration-threshold'`)**: nuevo tipo de alerta. Si el ultimo run OK de una accion supera `p95_historico * (1 + slow_pct/100)`, se emite alerta `slow`. Parametros: `slow_pct` (default 50%), `slow_min_samples` (default 5 runs historicos minimos). Env equivalente `MEMORY_ALERTS_SLOW_PCT` para el ticker periodico. Calculo del p95 EXCLUYE el run actual (sino seria comparacion circular).
- **URL persistente para sub-tab activo dentro de Acciones**: `?act_subtab=run|history|stats|trends` se actualiza al cambiar de sub-tab via `replaceState`. `run` es default y no se escribe. Al cargar la pagina con `act_subtab=stats`, se abre directamente Acciones > Stats (y respeta tambien filtros `act_*`/`trend_*`).
- **Housekeeping purga snoozes expirados**: la pasada de housekeeping (al boot + cada hora) ahora tambien hace `DELETE FROM ai_action_snoozes WHERE expires_at IS NOT NULL AND expires_at < now`. Los snoozes `forever` (expires_at NULL) se preservan. Boot log reporta `N snoozes expirados`.
- **UI banner de alertas distingue tipos**: header dinamico `⚠ 2 con fallos consecutivos · 1 lentas (p95+%)`. Cada alerta `duration-threshold` se renderiza con prefijo `🐢` y el detalle (`ultimo run XXms supera umbral YYms`).
- **Bug fix de duration-threshold**: la version inicial incluia el run actual en el sample del p95 -> nunca podia superarse a si mismo. Corregido: la query filtra por `started_at < last.started_at`.
- **Validacion E2E (8 features + 1 fix)**: multi-select 2-valor en HTTP, slow alert disparada con run inyectado de 10s vs p95 270ms, snooze purgado al boot (count 2 -> 1 con boot log), stack auto-regen reporta `Node >=22.0.0` real, check-trace-coverage reporta 3 RFs sin codigo correctamente, sub-tab activo persistido en URL, 22 markers HTML nuevos, webhook plantilla validada por contrato (sin endpoint real).
- Version visible alineada a `v12.32.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.31.0
- **Cierre de inconsistencias entre matriz → memoria → validadores** detectadas en revision externa. La arquitectura conceptual planned/implemented/validated de v12.22 era correcta pero la implementacion aun tenia 3 falsos positivos: (1) la matriz canonica del template predicaba la regla `-` pero la incumplia ella misma, (2) `evidence_ref` no se qualificaba con scope y `check-trace-coverage` siempre decia "OK" enganoso, (3) `ai_trace_links` duplicaba cada link declarado en `TRACEABILITY_MATRIX.md` raiz Y en `specs/<feature>/traceability.md`. Esta version resuelve los tres.
- **Matrices canonicas alineadas con la propia regla `-`**: `TRACEABILITY_MATRIX.md` y `specs/001-bandeja-trabajo-expedientes/traceability.md` ahora usan `-` en las columnas `Codigo` y `Test`. Antes tenian nombres aspiracionales (`ExpedienteQueryService`, `ExpedienteQueryTest`, `RbacEvaluator`, `HistorialAuditoriaService`, etc.) que no existian en `src/` y generaban 17 falsos drifts. Esos nombres futuros viven ahora donde corresponde: en `spec-tareas.md` de cada feature.
- **`syncTraceLinks` qualifica `evidence_ref` con scope**: cuando el archivo fuente es `specs/<feature>/traceability.md`, la evidencia (que llega como `prototype-validation.md` suelta) se prefija con `specs/<feature>/prototype-validation.md`. Asi `check-trace-coverage` puede correlacionar RF -> feature por path completo.
- **Tabla `ai_trace_links` gana columna `source_file` + dedup logico**: nueva columna que registra de que Markdown salio cada link (`TRACEABILITY_MATRIX.md` vs `specs/<feature>/traceability.md`). `syncTraceLinks` procesa primero las matrices per-feature y dedupica por `(source_ref, target_type, target_ref)` para que el global no duplique. Migracion idempotente via `ensureColumn`. Resultado en el template: **trace links bajan de 64 a 33** (-48%) sin perder informacion real.
- **`check-trace-coverage` corregido**: antes hacia `WHERE evidence_ref LIKE %<scope>%` pero el `evidence_ref` ya no contenia el scope -> nunca encontraba RFs -> siempre decia "OK. Todas las features tienen cobertura completa" aunque ninguna lo tuviera. Ahora hace `WHERE source_file LIKE <scope>/% OR evidence_ref LIKE %<scope>%` (mantiene compat). Verificado: ahora reporta correctamente "specs/001-bandeja-trabajo-expedientes :: RF-02 faltan: codigo, test" en lugar del falso OK.
- **`AI_CONTEXT.md` con `Version actual` auto-regenerable**: nueva zona `<!-- auto:start name=version -->` que `regenerate-context` rellena leyendo `package.json`. Antes la version se quedaba congelada en v12.20 mientras el resto del template avanzaba. Aplicable tanto a la instancia raiz como a los AI_CONTEXT.md que emite el generador a proyectos reales.
- **`check-ai-artifacts` ahora pasa OK**: agregadas las secciones obligatorias `## No lo uses cuando` y `## Verificacion minima` a `ai/prompts/generar-prototipo-html5-desde-spdd.md` y `ai/prompts/generar-prototipo-html5-ejecutable.md`. 4 hallazgos -> 0.
- **Distribucion del audit trail mejorada**: antes 64 links totales con duplicados; ahora 33 distintos (15 vienen de la matriz global, 18 de la per-feature). `link_status: implemented=32, planned=1` — el unico planned restante (`RF-04 → bd:transicion_estado`) es real: declara una tabla BD que no existe como artefacto detectable.
- **`harvestTraceFromSource` tambien escribe `source_file`** para consistencia entre origin='markdown-matrix' y origin='source-harvest'.
- Version visible alineada a `v12.31.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.30.0
- **Cierre de 8 pendientes del panel de Acciones** en una sola version. Cubre todo lo solicitado en el backlog acumulado de v12.27/v12.28/v12.29.
- **Filtros adicionales en Historial (`mode` + `slow`)**: 2 selects nuevos en la barra de filtros. `mode`: `solo sync` / `solo stream`. `slow (>=)`: `1s` / `3s` / `5s` / `10s` / `30s` — filtra runs cuyo `duration_ms >= N`. Server-side: WHERE con bind. Persisten en URL como `act_mode=` / `act_slow=`.
- **URL persistente para Dashboard de Tendencias**: nuevos params `trend_action=X` y `trend_days=N`. Se actualizan via `window.history.replaceState` al cambiar cualquier filtro de Tendencias. Al cargar la pagina con esos params, se abre directamente Acciones > Tendencias con los filtros aplicados (prioridad sobre los `act_*` que abren Historial).
- **Drill-down al click en barra del stacked chart**: cada barra del chart de volumen es un `<g class="bar-group" data-day="YYYY-MM-DD">` clickeable. Al hacer click cambia al sub-tab Historial y pre-llena los filtros con `since=YYYY-MM-DD` y el `action_id` que estaba en el filtro de Tendencias. Click en el "top acciones por volumen" cambia el filtro de Tendencias a esa accion individual.
- **Comparacion por accion individual en el banner**: cabecera del compare-banner ahora dice explicitamente "comparando <action_id>" o "todas las acciones (agregado)" + las ventanas (ej. `actual: 7d · previa: 7d`). El backend ya filtraba por `action_id`; ahora la UI lo deja claro.
- **Export PNG del dashboard**: boton `⬇ PNG` por chart (line + stacked bars). Implementacion: serializa el SVG con `XMLSerializer`, lo carga en un `<img>` via Blob URL, lo dibuja en un canvas 2x (fondo blanco), exporta a PNG via `canvas.toBlob` y dispara descarga con `<a download="dashboard-<aid>-<chart>-<timestamp>.png">`. Sin librerias externas.
- **Webhook externo Slack/email para alertas**: configurable via env `MEMORY_ALERTS_WEBHOOK_URL` (default Slack format, override con `MEMORY_ALERTS_WEBHOOK_FORMAT=json`). Al boot + cada 5min, el server computa alertas activas y POSTea cada una NUEVA al webhook. Tabla `ai_alert_notifications` registra `action_id + fingerprint` (`consecutive_failures::day`) para no re-notificar la misma alerta. Body Slack-compatible con `text` + `blocks: [{type:"section", text:{type:"mrkdwn", text:"⚠ *<action_id>*: N fallos consecutivos..."}}]`.
- **Snooze de alertas (UI + persistencia)**: nueva tabla `ai_action_snoozes (action_id PK, reason, snoozed_at, expires_at)`. 3 endpoints: `GET /api/action-runs/snoozes` (listar), `POST` con `{action_id, duration: "24h"|"7d"|"30d"|"forever", reason?}` (silenciar), `DELETE ?action_id=X` (despertar). El endpoint `/api/action-runs/alerts` filtra acciones con snooze activo a menos que `?include_snoozed=1`. UI: cada alerta del banner trae 3 botones `🔕 silenciar 24h / 7d / forever`. El `forever` pide razon via `prompt()`.
- **Progreso estructurado en mas comandos**:
  - **`sync-memory`** emite 7 lineas (`0/6` al iniciar + una por cada fase completada: traceLinks → gateRuns → evidence → decisions → openQuestions → sessionEvents). La UI renderiza una barra unica que avanza por fase.
  - **`check-docs`** emite `[progress] N/total archivos` cada 25-50 archivos (cada 5% o lo que llegue primero). En el template son ~530 archivos.
- **Bug fix descubierto durante el testing: `acceptsDb` flag**: `buildExecPlan` antes siempre añadía `--db <path>` a todos los argv. `check-trace-drift.mjs` y `check-trace-coverage.mjs` lo entendian, pero `check-docs.mjs`, `check-prototype-hub.mjs` y `check-html5-prototype-quality.mjs` lo interpretaban como un argumento posicional (cwd raiz), lo que hacia que `readdirSync` fallara en un archivo. Esos validadores nunca habrian podido correr correctamente desde el panel. Ahora cada accion del whitelist declara `acceptsDb: true|false` y `buildExecPlan` solo agrega el flag cuando corresponde. La accion `check-docs` ahora termina exitosamente y emite los 21 progress events esperados.
- **Banner de comparacion mejorado**: encabezado contextual (`comparando <action> · actual: 7d · previa: 7d`) para que el usuario sepa el scope sin tener que mirar los selects.
- **Validacion completa**: 10 tests E2E pasaron (filtros mode/slow, snoozes POST/GET/DELETE, alerts con y sin include_snoozed, progress sync-memory 6 fases, progress check-docs 21 lineas, HTML con 41 markers nuevos).
- Version visible alineada a `v12.30.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.29.0
- **Dashboard de tendencias (sub-tab "Tendencias")**: cuarto sub-tab del pane Acciones (Ejecutar · Historial · Stats · **Tendencias**). Por fin se cierra el pendiente arrastrado desde v12.26 de tener un dashboard real, no solo sparklines de 14d. Tres componentes:
  - **Banner de comparacion periodo actual vs anterior** (mitad reciente vs mitad anterior del rango elegido): 3 tarjetas con Success rate, Volumen, Fallos. Cada una muestra el valor actual + delta vs anterior (pp para success rate, % para volumen y fallos) coloreado verde/rojo/gris segun direccion (delta positivo en success_rate = up = verde; delta positivo en fallos = down = rojo, inversion semantica intencional).
  - **Line chart de success_rate diario** (SVG inline puro, 720x200): eje Y 0-100% con gridlines en 0/25/50/75/100, eje X con etiquetas MM-DD cada ~6 ticks, linea cyan continua con circulos en cada dia con datos (los `null` rompen la linea), tooltip nativo con detalle del dia. Sin librerias externas.
  - **Stacked bars de volumen diario** (SVG, 720x180): barras apiladas verde (ok) + rojo (fail) + amarillo (cancel) por dia. Eje Y de 0 al max del periodo. Tooltip con totales.
  - **Tabla "Top 8 acciones por volumen"** del periodo, con success_rate coloreado.
- **Endpoint nuevo `GET /api/action-runs/dashboard?days=N&action_id=X`**: agregado global por dia. Default `days=30`, max 180, min 7. Acepta filtro opcional por `action_id`. Devuelve `{days_window, action_id, days:[ISO,...], series:[{day, total, ok, fail, cancelled, avg_ms, success_rate}], compare:{current, previous, delta_volume_pct, delta_success_pp}, top_actions:[...]}`. Rellena dias vacios con ceros y `success_rate=null`. Sin window functions SQLite (`GROUP BY substr(started_at,1,10)`).
- **Controles del sub-tab**: select de Accion (autopopulado con ids del catalogo + "— todas (agregado) —") + select de Periodo (7/14/30/60/90/180 dias) + boton `↻ Refrescar`. Cambiar cualquiera dispara `loadTrends` en vivo.
- **Atajo de teclado nuevo `Ctrl+Shift+D`**: abre directamente el sub-tab Tendencias. Total atajos: 8 (S/R/E/C/H/T/D + Esc). Banner de ayuda actualizado.
- **Validacion sobre datos reales del template**: el primer arranque del dashboard sobre el historial existente reporto success_rate global 63% en los ultimos 7d, con `check-docs` (10 runs, 0% success) y `check-prototype-html5` (8 runs, 12.5%) como las dos acciones con peor performance — coherente con el banner de alertas de v12.28. La comparacion 7d vs 7d anteriores devolvio `null` porque no habia datos en la primera mitad (solo runs del dia actual).
- Version visible alineada a `v12.29.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.28.0
- **Tendencia 14d (sparklines) en sub-tab Stats**: cada fila de la tabla de stats ahora tiene una columna `14d` con un sparkline SVG inline de los ultimos 14 dias. Cada barra es 1 dia, altura proporcional al volumen de runs, color por estado dominante: **verde** todos OK, **rojo** algun fail, **amarillo** solo cancelled, **gris** sin runs. Tooltip nativo (`<title>`) con el detalle del dia: `2026-05-16: 10 runs (5 ok / 5 fail / 0 cancel)`.
- **Endpoint nuevo `GET /api/action-runs/trend?days=N&action_id=X`**: serie diaria por accion. Default 14 dias, max 60. Rellena dias sin runs con ceros para que el sparkline tenga longitud consistente entre acciones. Sin window functions SQLite — agrupa por `substr(started_at,1,10)`.
- **Endpoint nuevo `GET /api/action-runs/alerts?last=N&min=K`**: detecta acciones con K+ fallos consecutivos al final de los ultimos N runs. Defaults `N=5, min=3`. Devuelve `{action_id, consecutive_failures, window, last_success, latest_started_at}` por accion afectada.
- **Banner de alertas en el pane Acciones**: si `/api/action-runs/alerts` devuelve resultados, aparece un banner rojo (left-border #B91C1C) arriba del sub-tab Run con la lista de acciones afectadas. Cada item incluye `↻ re-ejecutar` (vuelve al sub-tab Run y dispara la accion) y `ver historial` (abre el sub-tab Historial con el filtro `action_id=` preseteado). Se refresca al cargar el catalogo de acciones.
- **Auto-discovery efectivo**: el primer arranque del endpoint `/api/action-runs/alerts` sobre el historial real detecto 4 acciones con fallos consecutivos. Tres son validadores que **legitimamente** fallan (el template tiene drift conocido y un proto de prueba que no pasa la rubrica): `check-trace-drift`, `check-prototype-html5`, `check-docs`. El cuarto (`context-pack`) era un fallo real silencioso pre-existente. La alerta justifica el endpoint.
- **Persistencia de filtros del Historial en URL**: al cambiar cualquier filtro (`action_id`/`status`/`since`), la URL se actualiza con `?act_action=X&act_status=fail&act_since=24h` via `window.history.replaceState`. Al cargar la pagina con esos parametros, se aplican los filtros y se abre directamente el tab Acciones > Historial. Util para compartir un link a "todos los fallos de `embed-docs` del ultimo dia" o marcar la pestaña.
- **Compatible con todo lo anterior**: trend + alerts se hidratan en background al primer click en Acciones; los sparklines en background al click en Stats. URL filters solo aplican si la URL los trae.
- Version visible alineada a `v12.28.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.27.0
- **Filtros en el sub-tab Historial**: barra de controles con 3 selects (Accion, Estado, Periodo) que filtran la lista en vivo via parametros de query al `/api/action-runs`. La opcion **Accion** se autopopula con los `action_id` reales del historial (mas los del catalogo de acciones), no hay que escribirlos a mano. **Estado**: `solo OK` / `solo fail` / `solo cancelled` / `solo corriendo`. **Periodo**: `ultima hora` / `ultimas 24h` / `ultimos 7d` / `ultimos 30d`. Contador de runs filtrados en la esquina (`N runs` o `100+ runs` si llega al limite).
- **Endpoint `/api/action-runs` filtrable**: nuevos parametros `action_id=<id>`, `status=ok|fail|cancelled|running`, `since=<1h|24h|7d|30d|2026-05-01>`. El parser de `since` acepta tanto la forma corta (`Nd`/`Nh`/`Nw`/`Nm`) como una fecha ISO. Las clausulas WHERE se construyen seguras con parametros (no string interpolation).
- **Barra de progreso en la consola live**: el cliente detecta lineas con el patron `[progress] X/Y label` y las renderiza como una **barra de progreso unificada** (no como N lineas de texto) con porcentaje + ancho animado (transition .25s) + gradient cyan->green. Cuando llega al 100%, la barra se "cierra" y el siguiente print empieza una nueva. Cualquier linea normal cierra la barra activa.
- **`index-docs` ahora emite progreso**: imprime `[progress] X/Y archivos` cada 25 archivos (o cada 5%, lo que llegue primero). Inicia con `0/265` y termina con `265/265`. La logica se refactorizo para procesar TODOS los archivos (antes hacia `continue` en los skipped, lo que rompia el contador de progreso).
- **`embed-docs` ahora emite progreso**: imprime `[progress] X/N chunks` cada 50 chunks (o cada 5%). Util cuando hay miles de chunks (en el template son ~2500, antes parecia colgado por varios segundos sin output).
- **Bug fix v12.23**: la accion `check-prototype-html5` apuntaba a `ci/scripts/check-prototype-html5.mjs` que no existe. El archivo real es `check-html5-prototype-quality.mjs`. Se corrigio en 3 lugares: `EXEC_ACTIONS`, `LIVE_FRAMEWORK_FILES_TO_COPY` (lo que copia el generador a proyectos reales) y `package.json scripts`. Esto se descubrio al filtrar por `status=fail` en el Historial.
- **Self-discovery**: el primer filtro `status=fail` aplicado al historial real del template descubrio inmediatamente el bug del path roto. La capa de audit trail + filtros se justifica sola.
- Version visible alineada a `v12.27.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.26.0
- **Housekeeping automatico del audit trail**: `memory-serve` ahora corre `housekeepActionRuns(db)` al boot y cada hora (via `setInterval().unref()` para no bloquear el shutdown). Dos efectos:
  - **Orphan cleanup**: filas con `finished_at = NULL` cuyo `started_at` sea anterior a 1h se marcan `cancelled = 1`, `finished_at = now()` y se les concatena `[orphan: marcado al boot, server murio mid-flight]` al `stderr_tail`. Resuelve el caso "el server se cayo mid-flight y la fila quedo en 'corriendo…' para siempre".
  - **Retencion**: filas con `started_at < now - RETAIN_DAYS` se borran. Configurable via env `MEMORY_ACTIONS_RETAIN_DAYS` (default 30). Si se setea a 0, se desactiva. El boot imprime una linea `Housekeeping audit trail: N huerfanos marcados, M viejos purgados.` solo si hubo cambios.
- **Endpoint nuevo `GET /api/action-runs/export?format=csv|json`**: descarga el historial completo (no solo los 50 ultimos). El header `Content-Disposition: attachment; filename="action-runs-<timestamp>.csv|json"` hace que el navegador descargue directamente. CSV con quoting RFC4180 (escapa comillas, comas y saltos de linea). JSON con `null` en los campos vacios y pretty-print de 2 espacios.
- **Endpoint nuevo `GET /api/action-runs/stats`**: estadisticas agregadas por `action_id`. Por cada accion devuelve: `total`, `ok` (`exit_code=0 AND cancelled=0`), `fail` (`exit_code!=0 AND cancelled=0`), `cancelled`, `avg_ms`, `min_ms`, `max_ms`, `p50_ms`, `p95_ms` (calculados en JS para no requerir window functions SQLite >=3.25), `success_rate` (porcentaje 0-100), `last_run` (ISO timestamp). Ordenado por `total DESC, action_id ASC`.
- **Sub-tab "Stats" en el pane Acciones**: tercer sub-tab (junto a "Ejecutar" y "Historial"). Render:
  - **Banner agregado**: 4 stats grandes — Total runs, Exitos (verde), Fallos (rojo), Success rate global.
  - **Tabla por accion** con 12 columnas: Accion · Total · OK · Fail · Cancel · Avg · p50 · p95 · Min · Max · Success% (verde >=95%, neutral 70-94%, rojo <70%) · Ultima (timestamp relativo).
  - Boton `↻ Refrescar` y auto-refresh al terminar cualquier run nuevo si el sub-tab esta visible.
- **Botones de Export en el sub-tab Historial**: `⬇ Export CSV` y `⬇ Export JSON` junto al `↻ Refrescar`. Implementados como `<a href download>` directos al endpoint.
- **Atajo de teclado nuevo `Ctrl+Shift+T`**: abre el sub-tab Stats. El banner de ayuda en "Ejecutar" se actualizo con esta nueva tecla. Total de atajos: 7 (S/R/E/C/H/T + Esc).
- **Tests E2E (4 features verificadas)**:
  - Stats: 5 acciones agregadas con totales, success_rate, percentiles y last_run.
  - Export CSV: header `Content-Disposition: attachment` + filename con timestamp, body con quoting RFC4180.
  - Export JSON: igual + body pretty-printed con `null` literal en huecos.
  - Orphan cleanup: insertar fila con `started_at` 3h atras y `finished_at=NULL`, restartear server -> se marca `cancelled=1` + `stderr_tail` con marker.
  - Retencion: insertar fila de 10 dias atras, restartear con `MEMORY_ACTIONS_RETAIN_DAYS=7` -> fila purgada (count 12 -> 11).
- Version visible alineada a `v12.26.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.25.0
- **Audit trail persistente de acciones**: nueva tabla `ai_action_runs` en `schema-sqlite.sql` que guarda una fila por cada `POST /api/exec` (sync o streaming). Campos: `action_id`, `arg`, `argv` saneado, `mode` (`sync`/`stream`), `origin` (`ui`), `started_at`/`finished_at`, `exit_code`, `signal`, `duration_ms`, `timed_out`, `cancelled` (1 si SIGTERM/SIGKILL via DELETE o socket close), `stdout_tail` / `stderr_tail` (ultimos 4KB cada uno para no inflar la BD). Indices por `started_at DESC` y `action_id`. La tabla se crea automaticamente en cualquier DB existente al primer arranque (`CREATE TABLE IF NOT EXISTS`).
- **Sub-tab "Historial" dentro del pane Acciones**: dos sub-tabs ("Ejecutar" y "Historial"). El Historial muestra los ultimos 50 runs en una grilla densa con columnas: Cuando (timestamp relativo: `5s` / `2min` / `3h` / `2d`), Accion + arg (si tuvo), Duracion (`337ms`/`3.5s`), Modo (`sync`/`stream`), Estado (badge `exit 0` verde / `exit N` rojo / `SIGTERM` rojo / `cancelled` amarillo / `corriendo…` gris), boton `↻ Re-ejecutar`. Cada fila incluye un `<details>` plegable con el `tail` de stdout/stderr.
- **Re-ejecutar con un click**: el boton `↻ Re-ejecutar` del historial cambia al sub-tab "Ejecutar" y dispara la misma accion con el mismo arg que el run original. Util para repetir un `diff-since --since 7d` o un `harvest-trace` sin tener que volver al panel de botones.
- **Endpoint nuevo**: `GET /api/action-runs?limit=N` (1 <= N <= 200, default 50) devuelve los runs en orden `started_at DESC`. Incluye stdout/stderr tail.
- **Atajos de teclado** activos en cualquier tab:
  - `Ctrl+Shift+S` -> `sync-memory`
  - `Ctrl+Shift+R` -> `memory-report`
  - `Ctrl+Shift+E` -> `regenerate-context`
  - `Ctrl+Shift+C` -> `check-trace-drift`
  - `Ctrl+Shift+H` -> abre el sub-tab Historial
  - `Esc` -> detiene el job en curso (equivalente al boton Detener)
- **Auto-refresh de UX**: al terminar una accion, si el sub-tab Historial esta activo, se refresca silenciosamente. La snapshot de la BD se sigue refrescando para las acciones que la modifican (`sync-memory`, `index-docs`, etc.) como en v12.24.
- **Persistencia que aguanta crashes**: el `INSERT` se hace al inicio (con `started_at` ya poblado) y el `UPDATE` al final. Si el server muere mid-flight, el run queda en la BD con `finished_at = NULL` y aparece como "corriendo…" hasta que un humano lo limpie (futura mejora: limpieza al boot).
- **Banner de atajos en la UI**: la sub-pane "Ejecutar" muestra una linea de ayuda con los atajos disponibles, usando `<kbd>` styled como tecla.
- Version visible alineada a `v12.25.0` en `README.md`, `package.json` y `.github/.release-please-manifest.json`.

## v12.24.0
- **Streaming SSE en el panel de Acciones**: `POST /api/exec` ahora soporta streaming via Server-Sent Events cuando el cliente envia `Accept: text/event-stream`. El stdout/stderr del comando se envia linea por linea al navegador y aparece en la consola de la UI a medida que el child process escribe, sin esperar a que termine. Compatible con el modo sync anterior (sin header `Accept` se sigue obteniendo el JSON con stdout/stderr completos al final, igual que en v12.23).
- **Boton "Detener" en la UI**: aparece mientras hay un job corriendo y permite cancelar el comando enviando SIGTERM (3s despues SIGKILL si sigue vivo). Implementado con dos mecanismos complementarios: (1) el cliente llama `DELETE /api/exec` que dispara `__execJob.child.kill('SIGTERM')` directamente, y (2) el cliente aborta el fetch via `AbortController`, lo que cierra el socket y el server detecta `socket.on('close')` para matar al child diferido por `setImmediate` (asi no se mata al child cuando Node cierra el lado de lectura del request normalmente).
- **Eventos SSE emitidos**: `meta` (al spawnear, con argv saneado, pid y startedAt), `stdout` (cada chunk de stdout), `stderr` (cada chunk de stderr), `exit` (exitCode, signal, durationMs, timedOut) y `error` (mensajes del propio runtime de streamExecAction). Cada evento es JSON serializado en el campo `data:` del frame SSE.
- **Endpoint nuevo**: `DELETE /api/exec` exige cabecera `Origin` valida (igual que POST), retorna `202 {cancelling, pid}` si habia job o `404 {error: "No hay job en curso"}`. Despues de SIGTERM, espera 3s y escala a SIGKILL via setTimeout.
- **Keep-alive SSE**: cada 15s el server envia un comentario SSE (`: keepalive\n\n`) para evitar que proxies/navegadores cierren la conexion en jobs largos (`embed-docs` sobre repos >10k archivos puede tardar minutos).
- **Helpers refactorizados**: nueva funcion `buildExecPlan(root, dbPath, id, arg)` valida el id y el arg y compone el argv. Es compartida entre `runExecAction` (sync) y `streamExecAction` (SSE). El lock `__execJob` ahora guarda `{actionId, pid, child, mode, startedAt}` para soportar cancelacion.
- **Cliente UI**: nuevo handler `execAction` que usa `fetch` con `signal: AbortController.signal` + `r.body.getReader()` para parsear el stream SSE manualmente (no se usa `EventSource` porque ese no soporta POST). Parser robusto: buffer por chunks, split por `\n\n`, parsea `event:` y `data:`, agrega chunks a un buffer linea-por-linea para no romper output multi-chunk. Render incremental en la consola dark con colores semanticos.
- **Tests pasados**: SSE streaming con `status` (12 lineas de stdout), legacy sync sin Accept (200 + JSON), cancelacion via `AbortController` (server detecta socket close y mata al child), cancelacion via `DELETE /api/exec` (server responde 202 + SIGTERM, SSE termina con exit signal SIGTERM), concurrencia (segundo POST recibe 200 + `error 409` via SSE manteniendo el primer job corriendo).
- Version visible alineada a `v12.24.0` en `README.md` y `.github/.release-please-manifest.json`.

## v12.23.0
- **Tab "Acciones" en el front embebido (`memory-serve`)**: ahora se pueden ejecutar manualmente desde la UI los comandos del agente — validadores, sync de memoria, reportes y generadores — sin tener que abrir terminal. La UI muestra una consola estilo terminal con stdout/stderr coloreado, exit code y duracion. Se refresca automaticamente el snapshot de la memoria cuando la accion modifica la BD (`sync-memory`, `index-docs`, `embed-docs`, `regenerate-context`, `harvest-trace`).
- **17 acciones whitelisted en 4 categorias**:
  - **Memoria** (5): `sync-memory`, `index-docs`, `embed-docs`, `regenerate-context`, `harvest-trace`.
  - **Validadores** (5): `check-docs`, `check-trace-drift`, `check-trace-coverage`, `check-prototype-hub`, `check-prototype-html5`.
  - **Reportes** (6): `memory-report`, `context-pack`, `next-task`, `diff-since` (con arg `--since`, regex `^(\d+[dhwm]|\d{4}-\d{2}-\d{2})$`), `template-drift`, `status`.
  - **Generadores** (2): `generate-prototype-hub` (marcado `danger:true`, exige confirm modal), `generate-prototype-hub --auto-only`.
- **Endpoints nuevos**:
  - `GET /api/actions` — devuelve el catalogo seguro (sin paths internos, sin shell strings).
  - `POST /api/exec` — ejecuta una accion del whitelist. Body: `{ id, arg? }`. Respuesta sincrona: `{ actionId, argv, exitCode, signal, durationMs, stdout, stderr, timedOut }`. El timeout default es 5 minutos.
- **Seguridad endurecida**: `memory-serve` ahora bindea explicitamente a `127.0.0.1` (antes escuchaba en todas las interfaces). `/api/exec` exige tres condiciones: (1) `POST` con `Content-Type: application/json`, (2) cabecera `Origin: http://localhost:<port>` o `http://127.0.0.1:<port>`, (3) `id` presente en `EXEC_ACTIONS`. Falla con 403/415/404 segun el caso. Body limitado a 4KB para prevenir DoS. **No se acepta `command`, `argv` ni shell strings del cliente**; el unico parametro libre es el `arg` de algunas acciones, validado por regex declarado en el whitelist (`diff-since` es el unico actualmente con arg).
- **One-job lock**: solo una accion ejecutandose a la vez. Llamadas concurrentes reciben `409 Busy` con el id del job en curso. Evita race conditions sobre la BD.
- **Confirm modal para acciones `danger:true`**: `generate-prototype-hub` (variante full) muestra un modal explicito antes de sobrescribir `prototype/index.html`. La variante `--auto-only` no es danger porque preserva las zonas no-auto.
- **Console UX**: tema oscuro con colores semanticos (azul = comando, verde = exit 0, rojo = stderr / exit !=0, amarillo = info), botones Limpiar/Copiar, scroll automatico, max-height 520px. Mensaje "modo live requerido" cuando se abre el reporte estatico (`memory-report.html`).
- **Banner de arranque actualizado**: `memory-serve` ahora imprime los endpoints de lectura y de accion separados y menciona el tab "Acciones".
- Version visible alineada a `v12.23.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.23.0.md` y se agrego la entrada en `releases/README.md`.

## v12.22.0
- **Trazabilidad semantica `planned` vs `implemented` vs `validated`**: corrige el problema critico donde la matriz reportaba RFs como "implementados" simplemente porque su columna `Codigo` tenia un valor, sin importar que el archivo no existiera en el repo. Ahora `ai_trace_links` tiene tres columnas nuevas — `link_status` (`planned`/`implemented`/`validated`/`inferred`/`drift`), `origin` (`markdown-matrix`/`source-harvest`/`tool`/`human`) y `validated_at` — y el preset `rf-implemented` filtra por `link_status IN ('implemented','validated')`. Validado sobre el corpus del template: antes reportaba 5 RFs implementados (falsos); ahora reporta 0 implementados, 4 planned y 17 drift-links correctamente.
- **Helper `targetRefExists(root, type, ref)`**: verifica si un `target_ref` declarado en la matriz realmente existe en el repo. Para `codigo`/`test` busca en `src/`, `backend/`, `frontend/`, `tests/`, `stacks/` por nombre de archivo o declaracion de clase/funcion (Java, TS, Python, Go, Rust, C#); para `api` busca la ruta en specs y `contracts/*.yaml`; para `bd` busca el nombre de tabla; para `prototipo`/`spdd`/`pantalla` resuelve el path o lo busca en `specs/docs/`. Usa el mismo criterio que `check-trace-drift.mjs` para coherencia.
- **`syncTraceLinks` enriquecido**: ahora recibe `root`, llama a `targetRefExists` por cada celda llenada y marca `link_status='planned'` cuando el target no existe, `link_status='implemented'` cuando si, y `link_status='validated'` (+ `validated_at`) cuando ademas el `Estado` de la fila contiene `valid|aprob|complet` y el tipo es `codigo`/`test`. Todos los links de la matriz quedan con `origin='markdown-matrix'`.
- **`harvestTraceFromSource` enriquecido**: los `@trace`/`@implements`/`@covers`/`@fixes` cosechados del source code se marcan con `origin='source-harvest'` y `link_status='implemented'` (confidence 0.8). La limpieza previa al re-poblar ahora borra tanto `source_type='source'` como `origin='source-harvest'`.
- **Presets nuevos y endurecidos**: `rf-implemented` requiere codigo Y test con `link_status IN ('implemented','validated')`; `rf-without-code` y `rf-without-test` filtran igual (un link planificado NO satisface). Se agregaron tres presets: `rf-validated` (gate de QA aprobado: codigo y test con `link_status='validated'`), `rf-planned` (declarado pero sin artefactos reales) y `links-drift` (links a artefactos inexistentes — apoyo visual para `check-trace-drift`).
- **`check-trace-coverage.mjs` endurecido**: solo cuenta artefactos con `link_status IN ('implemented','validated')`. Era la fuente del falso positivo: un RF con `Codigo: ExpedienteService` (clase que no existe) pasaba la cobertura como si estuviera implementado. Ahora falla correctamente y empuja al equipo a llenar columnas con valores reales.
- **Plantilla y emisores de `traceability.md` actualizados**: las columnas `Codigo` y `Test` se generan con `-` por defecto en specs nuevas (fase 2/3). La plantilla en `plantillas/fase-4-sdd/traceability.md` documenta explicitamente la semantica `planned/implemented/validated` y la convencion de usar `-` mientras el archivo no exista. Las dos emisiones de `traceability.md` del generador (lineas 7398 y 8602 de `ai-framework-agent.mjs`) llevan ahora ese mismo header de reglas.
- **`package.json` raiz con scripts npm canonicos**: nuevo `package.json` en la raiz del template con scripts `memory:bootstrap`, `memory:sync`, `memory:index`, `memory:embed`, `memory:context`, `memory:report`, `memory:serve`, `memory:watch`, `memory:query`, `memory:context-pack`, `memory:next-task`, `memory:harvest-trace`, `memory:install-hooks`, `check:docs`, `check:trace-drift`, `check:trace-coverage`, `check:prototype-hub`, `check:prototype-html5`, `check:all`, `prototype:hub` y `prototype:hub:auto`. Permite a cualquier agente IA (Claude Code, Codex, Cursor, Gemini Code, Copilot) usar el mismo flujo via `npm run memory:bootstrap` sin tener que conocer la ruta exacta del script. Requiere Node 22.x (`engines.node: >=22.0.0`).
- **`INSTANCIACION_PROYECTO_REAL.md`**: nueva guia raiz que cualquier agente IA debe leer primero al abrir un repo generado del template. Documenta el flujo TL;DR de 3 comandos, los 5 archivos de contexto vivo a leer en orden, la semantica `planned`/`implemented`/`validated` con ejemplos, las diferencias por agente IA (Claude/Codex/Cursor/Gemini), el ciclo de cierre de sesion (`SESSION_LOG` + `memory:sync` + `memory:context`), los 4 validadores de CI y los errores comunes con su diagnostico.
- **Migracion idempotente**: `migrateSchema` agrega las 3 columnas nuevas a `ai_trace_links` (`link_status`, `origin`, `validated_at`) sobre DBs existentes sin perder datos. Indices `idx_ai_trace_links_status` e `idx_ai_trace_links_origin` para queries por columna nueva.
- **Generador emite memoria viva completa en proyectos reales**: `create-project` ahora copia al destino (1) los 5 archivos de contexto vivo (ya existia), (2) `INSTANCIACION_PROYECTO_REAL.md` (nuevo), (3) `package.json` raiz con scripts `memory:*` y `check:*` (nuevo, con merge inteligente para no pisar `package.json` de stacks como `node-next` que lo usan en la raiz para Next.js — preserva `dependencies`, `name`, `version` y scripts existentes), y (4) la infraestructura ejecutable necesaria: `scripts/ai-framework-agent.mjs`, `ai/memory/schema-sqlite*.sql`, `ai/memory/README.md` y los 5 validadores `ci/scripts/check-*.mjs`. Sin esto, los scripts npm que se agregaban al `package.json` fallaban con `MODULE_NOT_FOUND` en el proyecto destino.
- **AI_CONTEXT.md emitido con marcadores `auto:start`/`auto:end`**: la plantilla de `AI_CONTEXT.md` que el generador escribe ahora trae las 4 zonas auto-regenerables (`features`, `gates-pendientes`, `sesiones-recientes`, `ultima-actualizacion`). Antes, `regenerate-context` se saltaba el archivo con el mensaje "no contiene zonas auto:start". Ahora `npm run memory:context` actualiza el archivo desde el primer dia.
- **Cross-link bidireccional `INSTANCIACION_PROYECTO_REAL.md` <-> `ai/runbooks/crear-proyecto-real-con-agente.md`**: cada uno apunta al otro y aclara su momento del ciclo. El primero es para la OPERACION DIARIA (cualquier agente IA que abre un repo ya generado, en cada sesion). El segundo es para la CREACION (una sola vez, agente generador del framework). El runbook ademas tiene un nuevo "CHECKLIST DE MEMORIA VIVA EN EL PROYECTO REAL" en la fase 4 de limpieza.
- Validado end-to-end: `node scripts/ai-framework-agent.mjs create-project --stack quarkus-angular --config template.config.example.json --dest .tmp/test --skip-smoke --no-git` produce un repo donde `npm run memory:bootstrap` corre limpio, `npm run memory:query -- --preset rf-implemented` devuelve 0 (correcto: no hay codigo aun), `rf-planned` devuelve 1, `links-drift` devuelve 2 (el RF-01 ejemplo apunta a `caseQueryService`/`caseQueryTest` que no existen en `src/`).
- Validado tambien con stack `node-next`: el merge preserva `next`, `react`, scripts `dev`/`build`/`start`/`lint`/`test*`/`migrate`/`seed` y `dependencies`, agregando `memory:*` y `check:*` sin colision.
- Version visible alineada a `v12.22.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.22.0.md` y se agrego la entrada en `releases/README.md`.

## v12.21.0
- **`prototype/index.html` estandarizado a 10 secciones fijas**: el hub del producto deja de ser arbitrario y se autogenera. La estructura (banner SPDD, hero con stats, journey por actor, spec cards con invariantes + status pill, actores, matriz SPDD, decisiones transversales, quick links, footer) esta definida en `plantillas/transversal/PROTOTYPE_HUB.md` y materializada en `plantillas/fase-2-ux-ui/prototype-hub.html.tmpl`.
- **Comando `generate-prototype-hub`**: nuevo CLI que lee `specs/`, `decisiones-ux.md`, `traceability.md`, `template.config` y la BD de memoria, y rellena las zonas `<!-- @auto:start name=X -->` de la plantilla. Soporta `--auto-only` para preservar zonas no-auto.
- **Modelo hibrido para la matriz de cobertura**: la tabla principal con artefactos SPDD (prototype, ui-test-cases, api-contract, spec-funcional, spec-tecnica, spec-tareas, traceability, Estado SPDD) se regenera automaticamente. El agente puede agregar tablas adicionales (ADRs, threat-model, etc.) fuera de las marcas auto, sin riesgo de sobreescritura.
- **Validador `ci/scripts/check-prototype-hub.mjs`**: verifica las 10 secciones del hub, compara `spec-cards` contra `specs/` reales, detecta marcadores `@auto:start` faltantes, prohíbe `RF-NN:` o `gate-xxx:` como heading principal (pero los permite como referencia técnica dentro de tablas/invariantes — el hub ES un meta-documento).
- **Spec cards con invariantes derivadas de trazabilidad**: cada spec card lista hasta 4 invariantes desde la matriz de `traceability.md` (RF/RNF + target del codigo o API), con iconos por tipo (🔒 seguridad · 🔴 regla critica · ⚡ comportamiento), y status pill derivado del estado declarado.
- **Journey end-to-end clickeable**: una fila horizontal por actor detectado en `decisiones-ux.md` de las specs, cada nodo es link `target="_blank"` al prototipo de su feature con el color de marca de la spec.
- **Stack tags en footer**: se derivan del stack declarado en `template.config.example.json` (`quarkus-angular`, `spring-react`, `java-monolith`, `node-next`) mas tecnologias transversales (OpenTelemetry, Prometheus + Grafana, Vault).
- **Banner SPDD del hub explicitamente diferenciado**: continua siendo el unico banner de "simulacion" permitido en el ecosistema (regla v12.20). Los prototipos individuales NO lo llevan.
- **Documentacion**: `02.15` ahora referencia las 10 secciones estandarizadas; `prototype-command.md` documenta el uso del autogenerador.
- Version visible alineada a `v12.21.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.21.0.md` y se agrego la entrada en `releases/README.md`.

## v12.20.0
- **Cinco goldens nuevos por dominio**: el catalogo de referencias de calidad nivel 3 pasa de 3 a 8. Se agregan `ecommerce-checkout`, `educacion-leccion`, `dashboard-analytics` (funnel/marketing, distinto del KPI-focused), `mobile-first-app` (phone-frame con bottom nav + FAB + bottom sheet), y `formulario-complejo` (wizard multi-step con conditional fields + cotizacion viva + uploads). Todos validados nivel 3 con metricas entre 802-1310 lineas, 14-32 tokens CSS, 1-4 media queries, 5-21 vistas, 11-43 mocks, 16-30 botones.
- **Quitar la regla de simulacion**: los prototipos HTML5 ya no muestran el banner amarillo/oscuro "Prototipo de validacion UX — datos de demostracion" en cada pantalla. Cada golden y el seed del generador reemplazaron el banner por un link discreto `← Hub` en el topbar. El aviso de "simulacion / sin backend real" vive ahora solo en `prototype/index.html` (hub). Razon: cuando un stakeholder ve un prototipo, debe sentirlo como producto real; el contexto de "simulacion" vive en la sesion de validacion, no en cada pantalla.
- **Validador alineado**: `FORBIDDEN_VISIBLE` ya no incluye palabras de simulacion (`Contrato mock`, `Recorrido simulado`, `Proceso asincrono mock`, `Login OIDC simulado`). La senal `aviso de datos mock` se elimina como requerida. La rubrica 02.16 y el estandar 02.15 quedan alineados.
- **Detector de vistas y mocks ampliado**: `countDistinctViews` ahora reconoce `data-pane`, `data-step`, `data-panel`, `data-card`, `data-use`, `data-plan`, `data-q` ademas de los previos; funciones de navegacion `goPage`, `goStep`, `selectLesson`, `nextStep`, `prevStep`, `setRange`, `setMode`, `filterMoves` con argumentos string y numericos (`selectLesson(this, 1)`); y `<div|aside|main|nav id="page-X">`, `pane-X`, `step-X`, etc. `countMockRecords` ahora detecta objetos JS literales cuando la clave de dominio no es la primera (`sku`, `email`, `phone`, `precio`, `qty`, `sessions`, `revenue`, ...) y clases repetidas `cart-item`, `tx-row`, `coverage-card`, `funnel-step`, `step-pill`, etc.
- **README de goldens actualizado**: tabla "Patron visual por dominio" ahora incluye los 8 dominios con link directo al golden de referencia. Cada golden tiene su seccion describiendo dominio, patron, actores, tarea principal y lo que demuestra.
- **Spec canonica 001 y seed del generador sin banner**: `specs/001-bandeja-trabajo-expedientes/prototype-html5/index.html` y `html5SeedIndex(ctx)` reemplazaron `.mock-banner` por `.hub-link`. Validados nivel 3 y nivel 2 respectivamente.
- Version visible alineada a `v12.20.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.20.0.md` y se agrego la entrada en `releases/README.md`.

## v12.19.0
- **Memoria viva resistente al rot**: cierre de la propuesta de 5 sprints para que un agente IA no pierda contexto al retomar un proyecto. La memoria de v12.16-v12.18 ahora se auto-mantiene, se auto-diagnostica y responde preguntas concretas en una sola llamada.
- **Fix: busqueda estatica vs live ahora devuelven el mismo dominio**: `buildFtsQuery` usa prefix matching (`exp*` en vez de `"exp"`) para que terminos parciales encuentren palabras completas; el endpoint `/api/search` de `memory-serve` ahora usa `searchAll` que combina chunks (FTS5) + documentos + trace_links + decisiones + gates + preguntas — el mismo dominio que el modo estatico.
- **Fix: paridad exacta de metadata entre estatico y live**: la metadata se devuelve completa sin cap (igual numero de docs/trace/decision/gate/pregunta que el estatico) y los chunks se suman aparte con su propio `chunkLimit` (default 30). Sin dedup entre matriz global y matrices por feature: una misma relacion declarada en dos archivos es informacion legitima y se preserva. Resultado validado para `q=exp`: estatico 56 metadata; live 56 metadata + 30 chunks = 86 total con desglose identico (`doc:26 · trace:23 · decision:2 · gate:3 · pregunta:2 · chunk:30`).
- **Indicador de modo en la UI**: `renderSearch` muestra ahora `[modo: estatico (solo metadata; sin chunks)]` o `[modo: live (metadata + chunks)]` para que el usuario entienda la diferencia esperada. Los chips de tipo se ordenan: `chunk, doc, trace, decision, gate, pregunta, api, rf, prototipo`.
- **Salida de busqueda con conteo y chips por tipo**: `renderSearch` muestra ahora `N resultados` mas chips agrupados por tipo (`chunk: 30 · doc: 26 · trace: 4`), excerpt uniforme y shape consistente `{t, ref, path, excerpt}` entre estatico y live.
- **Consultas predefinidas (memory-query / /api/query)**: nuevo catalogo `MEMORY_QUERY_PRESETS` con 10 preguntas frecuentes deterministas: `docs-for`, `apis-for`, `features-pending-qa`, `validated-prototypes`, `decisions-pending`, `failed-gates`, `rf-without-code`, `rf-without-test`, `rf-implemented`, `decisions-about`. Disponibles via: comando CLI `memory-query --preset <key> [--arg <v>]`, endpoint live `/api/query?preset=<k>&arg=<v>`, y panel "Consultas rapidas" en la UI estatica/live con botones por preset y un input para el argumento. El catalogo se sirve via `/api/presets` y se embebe en el snapshot estatico.
- **Fix `extractAdrStatus`**: regex mas estricta exige `## Estado`/`## Status` como heading propio o `Estado:` al inicio de linea; evita capturar "estado" dentro de prosa (ADR-001 ahora reporta `propuesta` limpio).
- **`watch` con modos `--once` y `--interval`**: `watch --once` ejecuta `index-docs + sync-memory + embed-docs` una sola vez y sale (para CI y git hooks); `watch --interval 30s|5m|1h` hace polling en lugar de `fs.watch` (util en Docker o editores remotos). El modo default mantiene `fs.watch` con debounce 1.5s e imprime un banner de keep-alive si pasan 5+ min sin cambios.
- **`install-hooks`**: nuevo comando que instala `.git/hooks/pre-commit` invocando `watch --once`. La BD se mantiene fresca al hacer commit sin requerir un proceso `watch` corriendo. El hook no bloquea el commit si falla (la BD es reconstruible y `.gitignored`). Con `--uninstall` remueve el hook (solo si fue instalado por este comando — preserva hooks manuales). Detecta correctamente cuando no hay repo git inicializado.
- **Schema enriquecido**: `ai_gate_runs` agrega `actor`, `decided_at` y `evidence_paths`; `ai_decisions` agrega `tags`, `affects`, `deciders` y `decided_at`; nueva tabla `ai_session_events`. `ensureDatabase` aplica una migracion ligera idempotente que agrega columnas a DBs existentes sin perder datos.
- **`SESSION_LOG.md`**: bitacora append-only de sesiones del agente IA y del equipo. Formato estructurado parseado por `sync-memory` y poblado en `ai_session_events`. Plantilla en `plantillas/transversal/SESSION_LOG.md`, instancia raiz en `SESSION_LOG.md` y emision desde el generador.
- **Parsers ricos**: `syncGateRuns` enriquece cada fila con `actor` y `decided_at` desde `git log` del archivo fuente (sin git deja NULL); `syncDecisions` parsea frontmatter YAML de ADRs (`tags`, `affects`, `deciders`, `decided_at`, `status`); `syncSessionEvents` parsea SESSION_LOG con formato regex tolerante.
- **`regenerate-context`**: comando que reescribe las zonas `<!-- auto:start name=X --> ... <!-- auto:end -->` de `AI_CONTEXT.md` desde la BD. Zonas auto: `features` (consolidado por gates), `gates-pendientes`, `sesiones-recientes`, `ultima-actualizacion`. Las secciones humanas (Identidad, Proximos pasos) se preservan.
- **Freshness indicator**: `status` ahora compara `mtime` de Markdown vs `updated_at` de la BD y reporta `STALE` cuando la BD esta atrasada, con la instruccion exacta para actualizarla.
- **`context-pack --topic <t>`**: bundle JSON con chunks top-K (FTS5/semantico) + trace_links + gate_runs + decisiones + evidencia + preguntas abiertas relacionadas al topic. Drop-in para el system prompt del agente.
- **`next-task`**: reglas declarativas que sugieren la siguiente tarea desbloqueada: 1) RF con prototipo pero sin codigo+test, 2) gates pendientes con evidencia, 3) preguntas abiertas.
- **`diff-since --ref <commit|fecha>`**: reporta cambios en `ai_session_events`, `ai_gate_runs` y `ai_decisions` desde un commit (resuelto a fecha por `git log`) o fecha ISO.
- **`harvest-trace`**: escanea source code (`src/`, `backend/`, `frontend/`, `tests/`) por tags `@trace`, `@implements`, `@covers`, `@fixes` seguidos de `RF-NN`/`RNF-NN`/`HU-NN`/`ADR-NN` y emite trace_links de tipo `source` con confianza 0.8 (inferido vs declarado=1.0).
- **`check-spec-dedup`**: compara embeddings de spec-funcional entre features y reporta pares con cosine >= threshold (default 0.85). Anti-duplicacion semantica.
- **`watch`**: re-ejecuta `index-docs + sync-memory + embed-docs` con debounce al editar Markdown bajo `docs/`, `specs/`, `ai/`, `qa/`.
- **`template-drift --project <path> --config <json> --stack <s>`**: diff entre un proyecto generado y lo que el template emitiria hoy con su config; reporta `match`, `drift` y `missing` por archivo.
- **Validadores CI nuevos**: `ci/scripts/check-trace-drift.mjs` valida que cada `target_ref` de tipo `codigo`/`test`/`api`/`bd`/`prototipo`/`spdd`/`sdd`/`pantalla`/`componente` resuelve a un artefacto real del repo. `ci/scripts/check-trace-coverage.mjs` falla cuando un RF/RNF en fase >= 5 (heuristica: existe `spec-tareas.md`) no tiene trace link de `codigo` y `test`.
- **AI_CONTEXT con marcadores auto**: la instancia raiz `AI_CONTEXT.md` ahora tiene zonas `<!-- auto:start name=X -->` que `regenerate-context` mantiene actualizadas; las secciones humanas no se tocan.
- **`usage()` actualizado**: lista los nuevos comandos y sus banderas; `status` muestra ahora 8 metricas mas freshness; `sync-memory` reporta tambien session events.
- Version visible alineada a `v12.19.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.19.0.md` y se agrego la entrada en `releases/README.md`.

## v12.18.0
- **Busqueda semantica sin dependencias**: la memoria del agente IA gana busqueda semantica que funciona con cero dependencias externas, cero extensiones nativas y zero proveedores de embeddings. Se mantiene `sqlite-vec` como acelerador opcional para corpus grandes.
- **Tabla `ai_chunk_embeddings`**: nueva tabla regular en `ai/memory/schema-sqlite.sql` que guarda el vector como JSON, con `model` y `dim`. Funciona para cualquier dimension y cualquier proveedor; no requiere extensiones.
- **Embedder local determinista**: nuevo `localEmbedding()` en `scripts/ai-framework-agent.mjs` (modelo `local-hash-v1`, dim 256). Combina hashing de tokens y trigramas de caracter en un vector L2-normalizado. Reproducible, sin dependencias.
- **Comando `embed-docs`**: genera embeddings locales para todos los chunks indexados. Incremental por defecto (omite los que ya tienen embedding); `--force` regenera todo. En este template: 2499 chunks embebidos en menos de un segundo.
- **`search --semantic` reconfigurado**: por defecto usa el embedder local sobre `--query` y compara con cosine en JavaScript sobre `ai_chunk_embeddings`. Con `--embedding` acepta un vector de proveedor externo. Con `--sqlite-vec-extension` mantiene la ruta vec0 para acelerar corpus grandes.
- **`import-embeddings` documentado**: sigue siendo la ruta para cargar embeddings de proveedores externos (OpenAI, Cohere, etc.) cuando se quiere busqueda semantica con modelos reales. Formato JSONL por linea: `{"chunkId":1, "embedding":[...], "model":"..."}`.
- **`status` extendido**: reporta el contador de embeddings ademas de las siete tablas existentes (8 metricas totales).
- **`schema-sqlite-vec.sql` aclarado**: deja explicito que es un acelerador opcional; la busqueda semantica por defecto vive en la tabla regular sin la extension.
- **`memory-report` y `memory-serve`**: sin cambios funcionales; siguen reflejando el estado completo de la memoria incluyendo los embeddings.
- **Resumen para agentes IA**: el flujo recomendado pasa de `index-docs -> sync-memory` a `index-docs -> sync-memory -> embed-docs`. Despues, `search --query "..." --semantic` responde con cosine local.
- Version visible alineada a `v12.18.0` en `README.md`, `AI_CONTEXT.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.18.0.md` y se agrego la entrada en `releases/README.md`.

## v12.17.0
- **Archivos de contexto vivo**: se incorporan cuatro Markdown que un agente IA lee primero para retomar un proyecto sin perder contexto: `AI_CONTEXT.md` (en que estado esta el proyecto ahora), `PROJECT_MAP.md` (donde vive cada cosa), `TRACEABILITY_MATRIX.md` (matriz global de trazabilidad) y `GLOSSARY.md` (terminos del framework y del dominio). `AGENTS.md` explica COMO trabaja el agente; `AI_CONTEXT.md` explica EN QUE ESTADO esta el proyecto.
- **Plantilla + instancia canonica + generador**: los cuatro archivos existen como plantilla en `plantillas/transversal/`, como instancia canonica en la raiz del template y como emision del generador (`scripts/ai-framework-agent.mjs create-project` los crea en cada proyecto real con el dominio interpolado).
- **`index-docs` los cubre**: `DEFAULT_DOC_PATHS` ya incluia los cuatro archivos; ahora existen y entran en la memoria. `sync-memory` parsea `TRACEABILITY_MATRIX.md` ademas de las `traceability.md` por feature.
- **Front embebido de consulta — comando `memory-report`**: genera `ai/memory/memory-report.html`, un HTML autocontenido con un snapshot embebido de la memoria (trazabilidad, gates, decisiones, evidencia, preguntas abiertas, documentos y busqueda client-side). Portable, sin servidor, reconstruible; se ignora en Git.
- **Front embebido de consulta — comando `memory-serve`**: levanta un servidor Node local que consulta la BD en vivo. Endpoints `/` (UI por pestañas), `/api/snapshot` (JSON estructurado) y `/api/search?q=` (busqueda FTS5). Comparte la misma UI que `memory-report`.
- **README y descubribilidad**: el `README.md` agrega una seccion "Si eres un agente IA retomando el proyecto" con el orden de lectura de los archivos de contexto vivo; `ai/memory/README.md` documenta el front embebido y los archivos de contexto; `plantillas/transversal/README.md` los indexa.
- **`.gitignore`**: `ai/memory/memory-report.html` se ignora por ser reconstruible con `memory-report`.
- Version visible alineada a `v12.17.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.17.0.md` y se agrego la entrada en `releases/README.md`.

## v12.16.0
- **Memoria viva operacional para agentes IA**: la BD SQLite pasa de ser solo un indice de texto a ser una memoria estructurada consultable. Markdown sigue siendo la fuente de verdad; la BD es el indice reconstruible que acelera al agente para continuar proyectos sin releer n archivos.
- **Busqueda FTS5**: `ai/memory/schema-sqlite.sql` agrega la tabla virtual `ai_chunks_fts` (FTS5, unicode61 sin diacriticos). `index-docs` la mantiene sincronizada con `ai_document_chunks` y `search` usa ranking `bm25`; si FTS5 no esta disponible cae a un scan textual de respaldo.
- **Comando `sync-memory`**: nuevo comando en `scripts/ai-framework-agent.mjs` que parsea los Markdown oficiales y reconstruye por completo las cinco tablas estructuradas que estaban vacias: `ai_trace_links`, `ai_gate_runs`, `ai_evidence_items`, `ai_decisions` y `ai_open_questions`. Son tablas derivadas: se vacian y repueblan en cada corrida.
- **Matriz de trazabilidad ampliada**: `traceability.md` pasa del formato debil `Origen | Product Design | SPDD | SDD | Construccion | Prueba` al formato vivo `RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia` mas una seccion `## Gates`. Cada celda con dato genera una relacion consultable en la memoria. Actualizado en la plantilla `plantillas/fase-4-sdd/traceability.md`, en la instancia canonica `specs/001-bandeja-trabajo-expedientes/traceability.md` y en los dos sitios de emision del generador.
- **Indexado ampliado**: `DEFAULT_DOC_PATHS` incorpora `specs/`, `qa/` y los cuatro archivos de contexto vivo (`AI_CONTEXT.md`, `PROJECT_MAP.md`, `GLOSSARY.md`, `TRACEABILITY_MATRIX.md`) para que la memoria cubra requerimientos, specs y pruebas, no solo `docs/` y `ai/`.
- **Comando `status` extendido**: ahora reporta el estado de FTS5 y las siete tablas (documentos, chunks, trace links, gate runs, evidence items, decisions, open questions), no solo cuatro.
- **CLI importable**: el modulo `ai-framework-agent.mjs` solo ejecuta `main()` cuando se invoca directamente, lo que permite reutilizar sus helpers desde scripts y tests.
- **Consultas de continuidad**: la memoria responde rapido preguntas como "que implementa / falta de RF-02", "estado de gates por feature", "decisiones pendientes" y "preguntas abiertas por fase" sin que el agente abra los Markdown.
- **Documentacion**: `ai/memory/README.md` documenta el flujo de memoria viva (index-docs + sync-memory), las tablas derivadas y las consultas tipicas; `ai/references/documentation-and-traceability.md` formaliza la matriz viva.
- Version visible alineada a `v12.16.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.16.0.md` y se agrego la entrada en `releases/README.md`.

## v12.15.0
- **Calidad de prototipos HTML5 endurecida end-to-end**: se cierra la brecha por la que el agente de IA generaba prototipos pobres mientras los ejemplos golden si alcanzaban nivel producto-real. El sistema ahora describe Y mide nivel 3.
- **Anti-ejemplo aislado**: `ejemplos/fase-2-ux-ui/prototype-html5/` se renombra a `prototype-html5-anti-ejemplo/` con README que documenta cada bloqueo que acumula; deja de competir con los goldens como referencia "neutra" que el agente copiaba.
- **Validador con grading nivel 0-3**: `ci/scripts/check-html5-prototype-quality.mjs` se reescribe para reportar nivel rubrica 0-3, automatizar los bloqueos B1, B2, B3, B4, B5, B6, B7 y B9, validar los seis campos del pre-flight en `decisiones-ux.md` y exigir minimos cuantitativos (lineas, tokens CSS, media queries, vistas, mock records, botones) calibrados contra los goldens reales.
- **Auto-rating obligatorio**: `ai/prompts/generar-prototipo-html5-ejecutable.md` exige leer integro el golden del dominio, citarlo en `decisiones-ux.md` y cerrar con un bloque de auto-rating verificable (metricas + nivel + exit code del validador) antes de declarar "listo".
- **Plantilla como pre-flight**: `plantillas/fase-2-ux-ui/prototype-html5.md` deja de ser un checklist booleano y pasa a ser el pre-flight de decisiones (dominio, actor, patron, golden de referencia, justificacion) con tabla de minimos por nivel.
- **Prompts consolidados**: `ai/prompts/generar-prototipo-html5-desde-spdd.md` queda como redireccion al prompt ejecutable canonico para eliminar la competencia de instrucciones.
- **Comando `/prototype` reforzado**: `ai/commands/prototype-command.md` agrega el paso obligatorio de correr el validador en modo `--strict` y reportar el bloque de auto-rating antes de cerrar; `gate-html5-product-quality.md` documenta que B1-B7 y B9 son verificacion automatica.
- **Generador del template corregido en la raiz**: `scripts/ai-framework-agent.mjs` deja de inyectar el patron pobre. `html5PrototypeFiles(ctx)` emite ahora un seed nivel 2 (saas-operativo autocontenido con topbar, sidebar, KPIs, filtros, tabla, estados loading/empty/error y toast) y un `decisiones-ux.md` con el pre-flight en blanco que fuerza al agente a declarar el dominio antes de regenerar. Se eliminan las dos emisiones duplicadas del patron pobre (`styles.css`/`app.js`/`mock-data.js` sueltos) y se agrega guarda CLI para que el modulo sea importable sin disparar `main()`.
- **Tercer golden por dominio**: se agrega `ejemplos/fase-2-ux-ui/prototype-html5-golden/dashboard-analytics-kpi/` (KPI cards con sparklines, grafico de lineas comparativo, donut, tabla drill-down, panel lateral, diferencias por rol) como referencia nivel 3 para dominios de analitica.
- **Showcase end-to-end**: la spec canonica `specs/001-bandeja-trabajo-expedientes/prototype-html5/` se regenera a nivel 3 (1498 lineas, 30 tokens, 7 vistas, 21 mocks) y se crea el hub `prototype/index.html` con journeys por actor, actores del sistema, prototipos por vertical, matriz de cobertura y estado de gates.
- **Validacion**: los tres goldens (saas-operativo, streaming, dashboard) pasan nivel 3, el anti-ejemplo queda en nivel 0, el seed del generador queda en nivel 2 y la spec canonica queda en nivel 3.
- Version visible alineada a `v12.15.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.15.0.md` y se agrego la entrada en `releases/README.md`.

## v12.14.0
- **HTML5-first Prototyping**: se incorpora prototipado HTML5 autocontenido como estrategia rapida para validar UX desde SPDD antes de SDD y construccion.
- **Command `/prototype`**: se agrega flujo operativo para generar prototipos HTML5 o Penpot desde Product Design/SPDD.
- **Skills y gates de prototipo**: se agregan `html5-prototyping.skill.md`, `penpot-ai-prototyping.skill.md` y `gate-prototype-ready.md`.
- **Criterio minimo UX**: los prototipos visuales deben cubrir flujo extremo a extremo, estados, validaciones, roles/permisos, datos mock, navegacion y feedback UX.
- **Ejemplo canonico HTML5**: se agrega prototipo navegable en `specs/001-bandeja-trabajo-expedientes/prototype-html5/` y ejemplo reusable en `ejemplos/fase-2-ux-ui/prototype-html5/`.
- **Empaquetado limpio**: `.tmp/` y bases locales `.db/.sqlite` quedan excluidas de entregables y no son fuente oficial.
- **Contrato AGENTS endurecido**: `AGENTS.md` queda alineado con runbook, agente enterprise, gates de prototipo, prompts, skills, references y criterio minimo UX.
- **Agente interno alineado**: `90.32-agente-interno-framework-ai-first.md` queda sincronizado con modos de trabajo, `/prototype`, `gate-prototype-ready`, `gate-spdd-approved` y la separacion intake/bootstrap/orquestacion.
- **Transversales IA alineados**: `90.00`, `90.01`, `90.14`, `90.28` y `90.33` quedan sincronizados con `/prototype`, gates de prototipo, modos de trabajo e instanciacion IA.
- **Revision end-to-end IA/UX**: se limpian referencias operativas residuales a Angular Mock, se actualiza `provider-orientation-pack.template.md` y se normaliza el flujo corto como Product Design -> SPDD inicial -> `/prototype`.
- **README principal alineado**: el arranque rapido y el resumen hacen visible Product Design -> SPDD -> `/prototype` -> SDD -> construccion.
- **Modos de trabajo separados**: `arranque-desde-fuente-bruta.md` queda como intake, `crear-proyecto-real-desde-template.md` como bootstrap y `crear-proyecto-real-con-agente.md` como orquestador IA end-to-end; `90.13` actua como mapa de decision.
- Version visible alineada a `v12.14.0` en `README.md` y `.github/.release-please-manifest.json`.

## v12.13.0
- **Orden metodologico corregido**: Product Design -> SPDD -> SDD -> Construccion Front + Back.
- **Gate SPDD Approved**: se agrega `ai/quality-gates/gate-spdd-approved.md` para bloquear SDD final y construccion de features visuales sin prototipo validado.
- **Salidas por feature ampliadas**: `specs/<feature>/` ahora contempla `product-design.md`, `spdd-frontend.md`, `prototype.md`, `prototype-validation.md`, `api-contract.md`, `ui-test-cases.md` y `traceability.md`.
- **SDD consume SPDD**: `/spec`, checklist SDD, gates y task packets ahora tratan SPDD aprobado como entrada para specs tecnicas front/back.
- **Agente interno actualizado**: `scripts/ai-framework-agent.mjs` genera y enruta Product Design, SPDD Approved, SDD y construccion en el orden correcto.
- Version visible alineada a `v12.13.0` en `README.md` y `.github/.release-please-manifest.json`.

## v12.12.0
- **Spec-Driven Product Design**: Fase 2 agrega `02.09-spec-driven-product-design.md`, `product-design-agent`, `spec-driven-product-design.skill.md`, `product-design-workflow.md` y `gate-ux-ready` como entrada formal de producto antes de construir.
- **SPDD Frontend**: Fase 5 agrega `05.01-spec-prototype-driven-development-frontend.md`, `frontend-spdd-agent`, `spec-prototype-driven-frontend.skill.md`, `frontend-spdd-workflow.md` y `gate-frontend-spdd-ready`.
- **/ux restaurado como first-class**: mapas, agente interno, commands, task packets y reglas de proveedores IA ahora tratan `/ux` como command propio para UX, Penpot, componentes, mapping y Angular Mock.
- **Construccion frontend mas gobernada**: `/build`, `/test`, `/review`, `spec-tareas.md` y prompts frontend ahora exigen spec + prototipo + mapping cuando la feature toca UI.
- **Agente interno actualizado**: `scripts/ai-framework-agent.mjs` enruta intenciones UX/SPDD y genera Product Design, SPDD Frontend, gates, skills, references y task packets en proyectos reales.
- Version visible alineada a `v12.12.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.12.0.md` y se agrego la entrada en `releases/README.md`.

## v12.11.0
- **Feature Delivery Workflow para proveedores IA**: se agrega `docs/transversal/90.33-flujo-delivery-ia-proveedores.md` para guiar brainstorming, specs, planes, worktrees, TDD, review, QA y cierre de branch.
- **Skills operativas nuevas**: `brainstorming`, `using-git-worktrees`, `writing-plans`, `executing-plans`, `test-driven-development`, `requesting-code-review` y `finishing-development-branch`.
- **Commands y gates reforzados**: `/spec`, `/build`, `/test`, `/review` y `/ship` ahora exigen tareas pequenas, rutas permitidas, evidencia TDD, code review y cierre de rama cuando aplica.
- **Spec de tareas ejecutable**: `plantillas/fase-4-sdd/spec-tareas.md` ahora define formato con objetivo, entradas, archivos permitidos, ciclo red-green-refactor, comandos y evidencia.
- **Agente interno actualizado**: `scripts/ai-framework-agent.mjs` enruta intenciones de worktree/TDD/review y genera task packets mas claros para proveedores IA.
- **Caso real listo para proveedor IA**: `C:\template\caso-real1\expediente` debe recibir task packets y specs con tareas verificables por fase 4-7 al rehidratar.
- Version visible alineada a `v12.11.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.11.0.md` y se agrego la entrada en `releases/README.md`.

## v12.10.0
- **Fase 2 desde la generacion inicial**: `create-project` ahora hidrata UX, Penpot, sistema de componentes, mapping Penpot -> Angular y Angular mock desde la primera documentacion base de fases 0-8.
- **Actualizacion no destructiva del expediente**: `create-project --refresh-existing` rehidrata documentacion y UX sobre un proyecto real existente sin recrear scaffolding ni borrar codigo.
- **Design system obligatorio en Fase 2**: `/ux` genera `02.07-sistema-componentes-ux.md` con grid, tokens, componentes reutilizables, variantes, estados y red flags.
- **Mapping Penpot -> Angular**: `/ux` genera `02.08-mapping-penpot-angular.md` para alinear libreria Penpot, Angular/Nx y decisiones de UI sin imponer Angular Material salvo ADR.
- **Penpot ejecutable por proveedor IA**: se agrega `ops/prototyping/penpot/create-prototype-file.ps1` para crear usuario demo opcional, proyecto Penpot, archivo de prototipo y evidencia fechada por RPC local.
- **UX actualizable a demanda**: `/ux` queda como comando idempotente para regenerar o actualizar Fase 2 cuando cambien RF, HU, specs o decisiones visuales.
- **Gate UX Ready reforzado**: el prototipo Penpot ahora requiere libreria de componentes reutilizables, mapping Penpot -> Angular y consistencia con Angular mock.
- **Prompts y skills actualizados**: se agrega `design-system-mapping.skill.md` y `componentes-penpot-angular.md` para que un proveedor IA revise consistencia visual y tecnica.
- **Caso real actualizado**: `C:\template\caso-real1\expediente` queda regenerado con 30 artefactos UX/Angular/Penpot/componentes/mapping, 92 Markdown sin hallazgos, checklist Penpot ampliado, Penpot local HTTP 200 y archivo Penpot creado por RPC.
- Version visible alineada a `v12.10.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.10.0.md` y se agrego la entrada en `releases/README.md`.

## v12.9.0
- **Penpot local para Fase 2**: el comando `ux` genera ahora un paquete operacional en `ops/prototyping/penpot/` con runbook, `.env.example`, scripts `start/status/stop` y checklist de validacion.
- **Docker Compose oficial de Penpot**: el script `start-penpot.ps1` descarga el `docker-compose.yaml` oficial de Penpot y levanta la instancia local en `http://localhost:9001`.
- **Documentacion UX ampliada**: Fase 2 agrega `02.06-operacion-penpot-local.md` y `prototipo-penpot.md`, conectando Markdown, brief Penpot, prototipo clickable, Angular mock y evidencia para `Gate UX Ready`.
- **Caso real ejecutado**: `C:\template\caso-real1\expediente` fue regenerado con 26 artefactos UX/Angular/Penpot, 88 Markdown sin hallazgos incluyendo evidencia operativa, instanciacion valida y Penpot Docker corriendo con HTTP 200.
- Version visible alineada a `v12.9.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.9.0.md` y se agrego la entrada en `releases/README.md`.

## v12.8.0
- **Fase 2 UX ejecutable**: `scripts/ai-framework-agent.mjs ux --project <ruta>` materializa el task packet de UX en un proyecto generado, creando flujos, wireframes Markdown, criterios UX, briefs Penpot/Angular y prompts generados.
- **Angular mock listo para proveedor IA**: el agente genera `frontend/libs/feature-expedientes/` y conecta `frontend/apps/web/src/main.ts` con un mock navegable de bandeja de expedientes, montado correctamente sobre `app-root`.
- **Stack Quarkus/Angular corregido para ejecucion real**: se alinean dependencias Angular 21/TypeScript 5.9, pruebas Karma headless, Quarkus REST/JUnit, AssertJ, Java 21, JWT defaults y datasource H2 dev/test.
- **Caso real re-ejecutado**: `C:\template\caso-real1\expediente` fue actualizado con Fase 2 UX, validado con 82 Markdown sin hallazgos, frontend `typecheck/build/test`, backend `mvn test`, backend dev `/api/health` y frontend dev `http://127.0.0.1:4200`.
- **Correccion de render UX**: se detecto en navegador interno un blanco por `NG05104` y se corrigio el selector raiz del mock generado para que el prototipo Angular renderice contenido visible.
- Version visible alineada a `v12.8.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.8.0.md` y se agrego la entrada en `releases/README.md`.

## v12.7.0
- **Agente interno ejecutable**: `scripts/ai-framework-agent.mjs` opera como puerta de entrada del framework AI-first con memoria SQLite portable, indexacion documental, busqueda, routing, `/document`, `plan-create` y `create-project`.
- **Orquestacion documental first-class**: se agrega `/document`, `documentation-orchestration.skill.md`, `gate-documentation-ready.md` y referencias asociadas para convertir ideas, requerimientos y decisiones en artefactos canonicos trazables.
- **Routing corregido para requerimientos claros**: entradas como "El operador debe registrar reclamos con adjuntos" ahora se enrutan a Fase 4 SDD con `/document + /spec` y no a planificacion inicial.
- **Creacion de proyecto real AI-provider-ready**: `create-project` ya no deja solo README de scaffolding; genera vision, roadmap, roles, requerimientos, UX, arquitectura, ADR, indices visibles de fases 0-8, transversales, specs, QA, operacion y un paquete IA ejecutable con manifest, agents, commands, skills, gates, prompts y task packets.
- **Operacion IA por fase**: cada README de fase incluye entrada, command IA, agente, skills, artefactos, gate, evidencia, red flags y task packet asociado para que un proveedor IA pueda ejecutar la fase con contrato claro.
- **Gates integrados al ejecutable**: despues de generar el proyecto, el agente ejecuta `check-docs`, `check-template-instantiation` y un escaneo propio contra texto residual de plantilla.
- **Prueba real validada**: `node scripts/ai-framework-agent.mjs create-project --stack quarkus-angular --config config/expediente.config.json --dest C:\template\caso-real1\expediente --skip-smoke --no-git --force` genero 78 artefactos operativos para Gestion de Expedientes, 77 Markdown y `ai/provider-manifest.json`, y paso validaciones sin hallazgos.
- Version visible alineada a `v12.7.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.7.0.md` y se agrego la entrada en `releases/README.md`.

## v12.6.0
- **Bug critico de instanciacion**: `scripts/init-project.mjs` extiende `TEXT_EXTENSIONS` con `.java`, `.jsx`, `.html`, `.css`, `.scss`, `.dockerfile`, `.env`. Antes los archivos Java post-instanciacion conservaban tokens literales como `reservation:read`, generando drift cross-stack invisible al `check-rbac-consistency.mjs`. `ci/scripts/check-template-instantiation.mjs` extiende su misma lista para detectar el problema desde el job `dry-run-new-service`.
- **Tests Java reparados** en los 3 stacks JVM (`stacks/java-monolith`, `stacks/spring-react`, `stacks/quarkus-angular`): `RbacTest.java` invocaba `Permission.EXPEDIENTE_READ`/`_WRITE`/`_APPROVE`, constantes obsoletas (el enum es ahora `RESOURCE_*`). El codigo Java no compilaba; ahora si.
- **Catalog Backstage tokenizado**: contenido de `catalog/users/ejemplo.yaml`, `catalog/groups/team-expedientes.yaml`, `catalog/systems/expedientes.yaml`, `catalog/apis/expedientes-{rest,events}.yaml`, `catalog/resources/expedientes-{db,cache,events-bus}.yaml` migrado a `team-wakaya`, `wakaya-erp`, `Wakaya ERP` y `wakaya-erp-db`. `catalog/all.yaml` mantiene los filenames originales (init-project.mjs no renombra archivos; Backstage usa `metadata.name`).
- **Doctrina vs codigo sincronizada**: `docs/fase-3-arquitectura/03.08-auth-authz.md` muestra ahora la matriz `reservation:read|write|approve` y agrega ejemplos de instancias reales (`case:read`, `customer:read`).
- **ADR-008** corrige el ejemplo `@PreAuthorize("@rbacEvaluator.can(authentication, 'reservation:approve')")` y enlaza explicitamente a `check-rbac-consistency.mjs`.
- **Comentarios obsoletos**: `RbacEvaluator.java` (3 stacks), `SecurityConfig.java` (2 Spring), `authn.ts` y `logger.ts` (node-next) usan ahora `reservation` en sus ejemplos en bloque.
- Revision incremental: `revisiones/2026-04-26-revision-post-v12-5.md` documenta las 10 brechas detectadas (3 ALTO, 4 MEDIO, 3 BAJO) y el playbook de adopcion actualizado.
- Version visible alineada a `v12.6.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.6.0.md` y se agrego la entrada en `releases/README.md`.

## v12.5.0
- Cierre de adopcion profesional sobre v12.4: se unificaron hallazgos de instanciacion, navegabilidad, IA operativa, golden path y validaciones CI.
- `init-project.mjs` ahora soporta tokens semanticos de dominio/API (`apiResourceName`, `apiResourcePlural`, `apiResourcePath`) y el dry-run con `--validate` valida el contenido virtual reemplazado sin tocar archivos.
- `new-service.mjs` mantiene el golden path con validacion antes del commit inicial y copia limpia de artefactos generados; se verifico con servicios temporales `node-next` y `quarkus-angular`.
- Nuevos validadores: `check-markdown-paths.mjs` para rutas en backticks, `check-ai-artifacts.mjs` para anatomia minima de skills/prompts y `check-github-actions.mjs` para bloquear `secrets.*` directos en condiciones `if`.
- CI y Makefile integran los nuevos checks junto a docs, instanciacion, RBAC y workflows.
- Workflows `gameday-dr` y `rotate-secrets` dejan de usar `secrets.*` directamente en `if` y usan variables de entorno intermedias.
- Se elimino el contrato temporal versionado `contracts/api/openapi.yaml.tmp` y se agrego `.gitignore` para temporales, dependencias y artefactos generados.
- La capa IA queda uniformada: skills base con `Anti-rationalizations`, `Red flags` y `Verification evidence`; prompts con `No lo uses cuando` y `Verificacion minima`.
- Documentacion de adopcion real actualizada: guia inicial, checklist de adopcion, gates transversales, mapa IA, estandar IA, plan Day-0 y rutas operativas faltantes.
- Nuevo estandar transversal `90.30` para SOLID y diseno modular, enlazado desde arquitectura, SDD, construccion y skills backend/frontend.
- Seguridad/AuthZ aterrizada: permisos RBAC tokenizados por recurso y ejemplos IAM/AuthN/AuthZ orientados a Keycloak/OIDC sin dejar el dominio canonico en superficies ejecutables.
- Angular queda validado como workspace Nx en el stack `quarkus-angular`, con estructura `apps/`, `libs/`, `nx.json` y `apps/web/project.json`.
- Version visible alineada a `v12.5.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.5.0.md` y se agrego la entrada en `releases/README.md`.
- Validador `check-docs.mjs` confirma 409 archivos markdown sin hallazgos.

## v12.4.0
- Capa IA elevada de mapa documental a motor operativo: nuevos comandos lifecycle en `ai/commands/` para `/plan`, `/spec`, `/build`, `/test`, `/review` y `/ship`.
- Nuevos quality gates AI-first en `ai/quality-gates/`: `gate-0-1`, `gate-2-3`, `gate-4-6` y `gate-7-8`, alineados con las fases de discovery, UX/arquitectura, SDD/construccion/QA y deploy/operacion.
- Skills endurecidas con estructura uniforme tipo agent-skills: `when to use`, `required inputs`, `process`, `anti-rationalizations`, `red flags` y `verification evidence`.
- Nuevas skills operativas de primer nivel: `source-driven-development`, `context-engineering`, `browser-testing`, `debugging-workflow`, `security-hardening`, `performance-optimization` y `shipping-and-launch`.
- Integracion selectiva con agent-skills sin dependencia pesada: nuevo `ai/external-agent-skills.md` y documento transversal `docs/transversal/90.29-integracion-selectiva-agent-skills.md`.
- `docs/transversal/90.28-anatomia-operativa-de-agents-prompts-skills.md` ampliado para cubrir commands, gates, anti-rationalizations, red flags y evidencia verificable.
- `docs/transversal/90.12-mapa-ia-por-fase.md` actualizado para mapear cada fase 0-8 contra comandos, agents, prompts, skills y gates.
- README de fases 0 a 8 actualizados con la IA recomendada por fase, incluyendo comandos lifecycle y gates aplicables.
- Indices `ai/README.md`, `ai/prompts/README.md`, `ai/skills/README.md` y `docs/transversal/README.md` actualizados para exponer la nueva arquitectura IA.
- Version visible alineada a `v12.4.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.4.0.md` y se agrego la entrada en `releases/README.md`.
- Validador `check-docs.mjs` confirma 391 archivos markdown sin hallazgos.

## v12.3.0
- PII redactor wirado al logger por defecto en los 4 stacks: `stacks/node-next/template/src/lib/logger.ts` (envuelve stdout, aplica `redact()` a cada payload, opt-out via `logger.unsafe`); Spring stacks anaden `PiiMaskingConverter` + `logback-spring.xml` con regla `safeMsg`; Quarkus anade `PiiLogFilter` (`@LoggingFilter("PII")`) activado en `application.properties`.
- Nuevo `docs/transversal/90.25-threat-modeling.md` con metodologia STRIDE, plantilla por feature en `specs/<feature>/threat-model.md`, crosswalk con DPIA y backlog de mitigaciones.
- Nuevo `docs/transversal/90.26-contract-governance.md` con politica SemVer del contrato, listas explicitas de cambios breaking vs non-breaking, deprecation 90 dias y patron expand-contract. Acompanado por `ci/scripts/check-openapi-diff.mjs` (Node, sin libs externas) que detecta paths/operations eliminados, response codes removidos, required nuevo y security schemes removidos. Job `contract-governance` en `.github/workflows/template.yml` que falla en PRs sin label `contract-breaking-approved`.
- Nuevo `docs/transversal/90.27-chaos-engineering.md` con principios, catalogo CE-1 a CE-10, plantilla de GameDay y cadencia/gating por entorno.
- Nuevo `ci/scripts/check-rbac-consistency.mjs` que parsea las 4 implementaciones RBAC (`rbac.ts` + 3x `Role.java`), normaliza a `{ role -> Set<permission> }` y reporta drift. Job `rbac-consistency` en `template.yml`.
- Nuevo `.github/workflows/gameday-dr.yml` con `schedule` mensual contra region pasiva, `workflow_dispatch` con inputs `environment`, `tier`, `post_failover`, soporte de kubeconfig por secret y abertura automatica de issue con label `gameday-dr` cuando el verify falla.
- `template.yml` incluye ademas el job `rbac-consistency` (siempre) y `contract-governance` (PRs sin label `contract-breaking-approved`).
- Cadena `nav-guided` extendida a `90.24 -> 90.25 -> 90.26 -> 90.27 -> docs/README`. Validador `check-docs.mjs` confirma 344 archivos sin hallazgos.
- Revision incremental: `revisiones/2026-04-25-revision-post-v12-2.md` documenta hallazgos post-v12.2 (incluyendo regresion accidental restaurada desde HEAD) y plan de cierre v12.3.
- Version visible alineada a `v12.3.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.3.0.md` y se agrego la entrada en `releases/README.md`.

## v12.2.0
- ADRs v12.1: nuevos `docs/fase-3-arquitectura/adr/ADR-007-slos-openslo.md`, `ADR-008-authn-jwt-oidc.md` y `ADR-009-dr-multi-region-activo-pasivo.md` documentando las decisiones que entraron en v12.1 con contexto, alternativas, consecuencias y trazabilidad.
- Cadena `nav-guided` extendida: `ADR-006` -> `ADR-007` -> `ADR-008` -> `ADR-009` -> `fase-4-sdd/README`. README de `adr/` y de fase 4 actualizados.
- Catalog Backstage enriquecido: nuevos `catalog/apis/expedientes-rest.yaml` (OpenAPI 3.1) y `catalog/apis/expedientes-events.yaml` (AsyncAPI 3.0); recursos `catalog/resources/expedientes-db.yaml`, `expedientes-cache.yaml` y `expedientes-events-bus.yaml`. La `Location` raiz `catalog/all.yaml` referencia los 5 archivos nuevos. `catalog/README.md` documenta la estructura ampliada y exige `allow: [..., API, Resource, Component]` en `app-config.yaml`.
- Rotacion de secretos automatizada: nuevo `.github/workflows/rotate-secrets.yml` con cron trimestral (primer lunes 03:00 UTC) en dev/staging y `workflow_dispatch` para prod. OIDC hacia AWS/GCP/Vault sin secretos de larga vida. Audit log archivado como artefacto y, si `vars.AUDIT_BUCKET` esta configurado, replicado a S3 con Object Lock. `ops/runbooks/rotacion-secretos.md` documenta la integracion.
- `verify-dr.mjs` parametrizado: flags nuevos `--kubeconfig`, `--namespace`, `--core-selector`, `--prometheus-url`, `--prometheus-token`, `--threshold-error-rate`, `--query`, `--dry-run`, `--json`. Separacion interna en providers `k8s` y `prometheus`. Apto para usar desde CI cross-cluster sin editar codigo.
- `ops/runbooks/README.md` rehecho como tabla canonica con columnas `runbook | trigger | oncall | script | frecuencia | RTO/RPO`. Anade plantilla para nuevos runbooks y referencias a workflows asociados (`template.yml`, `rotate-secrets.yml`).
- Revision previa marcada con resoluciones: `revisiones/2026-04-24-revision-adaptacion-proyecto-real.md` ahora incluye seccion 9 con tabla `brecha -> release que la cierra -> entregable concreto` cubriendo v12.1 y v12.2.
- Version visible alineada a `v12.2.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.2.0.md` y se agrego la entrada en `releases/README.md`.

## v12.1.0
- Day-0 runbook humano: nuevo `docs/fase-0-iniciacion/00.09-plan-arranque-15-dias.md` con cronograma dia por dia, aprobaciones y riesgos; encadenado en `nav-guided` entre `00.08` y la fase 1.
- CMDB raiz Backstage: nuevo `catalog/` con `all.yaml` (Location), `domains/`, `systems/`, `groups/`, `users/` y `templates/new-service.yaml` (Template scaffolder).
- SLOs como codigo: `ops/observability/slos.yaml` en OpenSLO v1, generador Node `ops/observability/generate-slo-rules.mjs` con multi-window multi-burn-rate (14.4x fast, 6x slow) y doc canonico `docs/fase-3-arquitectura/03.07-slos-como-codigo.md`.
- Rotacion de secretos operable: `ops/runbooks/rotacion-secretos.md` + `ops/runbooks/rotate-secrets.mjs` con providers `vault`/`aws`/`gcp` y modos dry-run/apply/verify/retire-previous/restore; audit log conforme a `contracts/events/audit-log.schema.json`.
- Plan y runbook de DR: `docs/fase-8-operacion/08.02-plan-dr.md` (Tier 0-3, RTO/RPO, 5 escenarios, GameDays) + `ops/runbooks/dr-failover-region.md` (8 pasos) + `ops/runbooks/verify-dr.mjs` (kubectl + Prometheus).
- AuthN/AuthZ canonico y aterrizado en los 4 stacks:
  - Documento transversal `docs/fase-3-arquitectura/03.08-auth-authz.md` con baseline JWT+OIDC, RBAC, IdP recomendados y matriz de permisos.
  - `stacks/node-next/template/src/lib/rbac.ts` + `src/middleware/authn.ts` (jose + JWKS).
  - `stacks/java-monolith` y `stacks/spring-react`: `Permission`, `Role`, `Rbac`, `RbacEvaluator`, `SecurityConfig` con `spring-boot-starter-oauth2-resource-server`, method security y mapping de claim `roles`. Tests unitarios `RbacTest`.
  - `stacks/quarkus-angular`: `quarkus-smallrye-jwt` + `quarkus-security`, clases equivalentes y `SecurityInfo` con guia para `@RolesAllowed`. `HealthResource` marcado `@PermitAll`.
- Gestion de incidentes end-to-end: `docs/transversal/90.24-gestion-incidentes.md` con severidades S1-S4, roles (IC, Comms, Ops, Scribe), flujo de vida, canales, status page, plantilla blameless de postmortem e integracion con SLOs, DR, rotacion y audit trail.
- Scripts cross-platform: trio `.mjs` + `.sh` + `.ps1` para `bootstrap`, `init-project` y `new-service`. Todos los scripts operativos se ejecutan con Node 20+ en Windows, Linux y macOS sin Bash ni Python.
- Validacion de config por schema: `scripts/schema/template.config.schema.json` (JSON Schema 2020-12, subset pragmatico) + `scripts/validate-template-config.mjs` sin dependencias. `new-service.mjs` la invoca antes de copiar; fallas tempranas con ruta del campo invalido.
- `template.config.example.json` extendido con `auth.*` (oidcIssuer, oidcJwksUrl, oidcAudience, oidcRolesClaim), `observability.*` (prometheusUrl, grafanaUrl, tempoUrl, lokiUrl, otelCollectorEndpoint), `dr.*` (tier, rto, rpo, primaryRegion, secondaryRegion) y `secrets.*` (provider, kvPath, externalSecretsRefreshInterval).
- CI de instanciacion: `.github/workflows/template.yml` con jobs `validate-config`, `check-template-tokens` y `dry-run-new-service` matrizado por los 4 stacks y por `ubuntu-latest`/`macos-latest`/`windows-latest`.
- `application.yml` / `application.properties` de los stacks JVM anaden claves `spring.security.oauth2.resourceserver.jwt.*` o `mp.jwt.verify.*` con placeholders `${OIDC_ISSUER}`, `${OIDC_JWKS_URL}`, `${OIDC_AUDIENCE}` y `${OIDC_ROLES_CLAIM}`.
- Revisiones: nueva `revisiones/2026-04-24-revision-post-v12-1.md` con scorecard incremental (13 brechas, ~12-16 d/p) y top-5 fixes para adopcion real.
- Cadena `nav-guided` extendida simetricamente a los documentos nuevos (`00.09`, `03.07`, `03.08`, `08.02`, `90.24`). Validador `check-docs.mjs` confirma 335 archivos sin hallazgos.
- Version visible alineada a `v12.1.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.1.0.md` y se agrego la entrada en `releases/README.md`.

## v12.0.0
- Cadena de suministro endurecida: `.github/workflows/security.yml` ahora incluye escaneo IaC (tfsec, checkov), escaneo de imagenes (trivy), analisis de SBOM con grype y sube resultados SARIF al GitHub Security tab; `.github/workflows/release.yml` firma imagenes con cosign keyless, genera attestaciones SLSA y bloquea por vulnerabilidades CRITICAL/HIGH antes de publicar. `SECURITY.md` incorpora las secciones "Controles automaticos", "Cadena de suministro" y "Verificacion de artefactos". Nuevo `docs/transversal/90.15-seguridad-dependencias.md`.
- Terraform multi-entorno: `ops/infra/aws/` se reorganiza en `bootstrap/` (S3 + DynamoDB para state lock), `modules/` (`network`, `compute`, `database`, `ingress`) y `envs/` (`dev`, `staging`, `prod`) con backends remotos, CIDR y dimensionamiento por ambiente y `ops/infra/aws/main.tf` reducido a stub.
- Kubernetes avanzado: `ops/k8s/base/` agrega `hpa.yaml`, `pdb.yaml` y `networkpolicy.yaml`; se introducen `overlays/{dev,staging,prod}/`, `external-secrets/` (AWS Secrets Manager via ESO), `rollouts/canary.yaml` con `AnalysisTemplate` Prometheus y politicas Kyverno (`require-signed-images`, `disallow-privileged`, `require-non-root`, `require-resource-limits`).
- GitOps con ArgoCD: `ops/gitops/argocd/root-app.yaml` (app-of-apps) + `ops/gitops/argocd/apps/expedientes-{dev,staging,prod}.yaml` (auto-sync en dev/staging, manual en prod). Nuevo `ADR-006-gitops-argocd.md`.
- Release engineering: `.github/release-please-config.json` + `.github/.release-please-manifest.json` + `.github/workflows/release-please.yml` para changelog automatico; `.github/workflows/preview.yml` crea entornos efimeros por PR con namespace `expedientes-pr-{n}`.
- Nueva `docs/fase-7-deploy/07.01-estrategias-despliegue-seguro.md` (canary, blue/green y feature-flag-gated rollout) y ampliacion de `docs/transversal/90.17-feature-flags.md` con integracion OpenFeature. SDKs OpenFeature instanciados en `stacks/node-next/template/src/lib/feature-flags.ts` y `stacks/java-monolith/template/src/main/java/com/example/expedientes/featureflags/FeatureFlagsConfig.java`.
- Observabilidad con artefactos concretos: `ops/observability/otel-collector-config.yaml` (pipeline OTLP a Tempo/Prometheus/Loki), `ops/observability/prometheus-rules.yaml` (SLI/SLO + burn rate) y `ops/observability/grafana-dashboard-api.json` (overview de API). Nuevo `docs/transversal/90.20-metricas-dora.md`.
- Audit trail y compliance: `contracts/events/audit-log.schema.json` (entrada inmutable, retencion y legal basis), plantillas `plantillas/transversal/ropa-registro-actividades.md` (GDPR art. 30) y `plantillas/transversal/dpia-evaluacion-impacto.md` (GDPR art. 35). `90.16-privacidad-compliance.md` incorpora seccion "Audit trail aplicativo".
- Datos operativos: `ops/data/` con `backup-restore.md`, `clasificacion-datos.md`, `retencion.md` y `migraciones-zero-downtime.md` (patron expansion/contraction). Migraciones incrementales de ejemplo `V2__audit_columns.sql` y `V3__transicion_history.sql` para el stack java-monolith.
- Service catalog y golden paths: `catalog-info.yaml` (Backstage) en los cuatro stacks, `scripts/new-service.sh` como golden path con reemplazo de tokens y bootstrap git. Nuevo `contracts/events/asyncapi.yaml` (AsyncAPI 3.0) y baseline i18n (`stacks/node-next/template/src/lib/i18n.ts` + `src/locales/{es,en}.json`).
- Testing avanzado: `stacks/node-next/template/tests/` con `a11y/axe.spec.ts` (axe + Playwright WCAG AA), `contract/expedientes.pact.test.ts` (Pact consumer-driven) y `load/health-load.js` (k6 con thresholds SLO). `docs/fase-6-qa/06.00-plan-pruebas.md` agrega la tabla de tipos de prueba recomendados.
- FinOps, policy y sostenibilidad: nuevos `docs/transversal/90.21-experimentacion-release-datos.md`, `90.22-finops.md` y `90.23-sostenibilidad.md`.
- Contrato API reforzado: `contracts/api/openapi.yaml` incorpora `securitySchemes.bearerAuth` (JWT), `security` global, ejemplos de payload y servers de produccion/dev para stacks JVM y node-next.
- Version visible alineada a `v12.0.0` en `README.md` y `.github/.release-please-manifest.json`.
- Se publico `releases/v12.0.0.md` y se agrego la entrada en `releases/README.md`.

## v11.0.0
- Scaffolding ejecutable para cuatro stacks de referencia: `stacks/node-next/template/`, `stacks/java-monolith/template/`, `stacks/quarkus-angular/template/` y `stacks/spring-react/template/`, con endpoint de salud, pruebas, Dockerfile y README por stack.
- Cinco workflows de GitHub Actions: `.github/workflows/docs.yml` (valida documentacion), `ci.yml` (build/test por stack con filtros de paths), `security.yml` (gitleaks, semgrep, SBOM, dependency-review), `release.yml` (lee `releases/vX.Y.Z.md` y publica imagenes) y `pr.yml` (commitlint, semantic PR, size labels).
- Automatizacion de calidad y seguridad local: `.editorconfig`, `.gitattributes`, `.pre-commit-config.yaml` (hooks base + gitleaks + `check-docs` local), `.github/CODEOWNERS`, `SECURITY.md` y `.github/dependabot.yml` (npm, maven, gradle, docker, github-actions).
- Estandar de configuracion y secretos en `docs/fase-3-arquitectura/03.05-configuracion-secretos.md` y `ADR-002-configuracion-y-secretos.md`.
- Estandar de migraciones de base de datos en `docs/fase-3-arquitectura/03.06-modelo-datos.md` y `ADR-003-migraciones-base-datos.md` (Flyway, `V{timestamp}__desc.sql`, rollback).
- Entorno de desarrollo local: `Makefile` con targets canonicos (`help`, `check-docs`, `up`, `down`, `test-*`, `lint`, `clean`), `ops/docker/docker-compose.yml` (postgres:16, redis:7, jaeger), `.devcontainer/devcontainer.json` y `scripts/bootstrap.sh` idempotente.
- Contratos canonicos: `contracts/api/openapi.yaml` (OpenAPI 3.1 para expedientes con RFC 7807 Problem) y `contracts/events/expediente-estado-cambiado.schema.json` (JSON Schema 2020-12).
- Observabilidad estandarizada en `docs/fase-8-operacion/08.01-observabilidad.md` y `ADR-004-observabilidad-opentelemetry.md` (tres pilares, SLI/SLO, alertas, dashboards).
- Legales y compliance: `LICENSE` (Apache 2.0), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `PRIVACY.md` (derechos ARCO) y `docs/transversal/90.16-privacidad-compliance.md` (GDPR, ciclo de vida, DPIA).
- Infraestructura como codigo con ejemplos reales: `ops/infra/aws/main.tf` (Terraform, backend S3, AWS ~> 5.50, default tags), `ops/k8s/base/deployment.yaml` (Deployment+Service con `runAsNonRoot`, `readOnlyRootFilesystem`, probes) y `ADR-005-infraestructura-como-codigo.md`.
- Definiciones operativas consolidadas en `docs/transversal/90.18-definiciones-operativas.md` (rotaciones on-call, formato de postmortem, ventanas de cambio, SLO y error budget, rotacion de secretos).
- Accesibilidad y design system: `docs/fase-2-ux-ui/02.01-accesibilidad-wcag.md` (WCAG 2.2 AA, cuatro principios, checklist por pantalla, axe/lighthouse) y `docs/fase-2-ux-ui/02.02-design-system-tokens.md` (taxonomia de tokens, componentes base, distribucion).
- Producto: `docs/fase-0-iniciacion/00.07-user-research.md` (metodos, plantilla de hallazgo, etica), `docs/fase-0-iniciacion/00.08-product-analytics.md` (metricas base, eventos canonicos, tracking plan) y `docs/transversal/90.17-feature-flags.md` (tipos, convenciones, ciclo de vida).
- Plantillas de GitHub: `.github/ISSUE_TEMPLATE/bug_report.md` (severidad S1-S4), `feature_request.md`, `config.yml` (desactiva blank issues) y `.github/pull_request_template.md`.
- Versionado y commits: `docs/transversal/90.19-versionado-commits.md` (SemVer, Conventional Commits, ramas, CHANGELOG, tagging) y `.commitlintrc.json` basado en `@commitlint/config-conventional`.
- Cadena `nav-guided` extendida a los 12 nuevos documentos bajo `docs/` preservando simetria: `00.06 -> 00.07 -> 00.08 -> fase-1`, `02.00 -> 02.01 -> 02.02 -> fase-3`, `03.03 -> 03.05 -> 03.06 -> 03.04`, `ADR-001 -> ADR-002 -> ADR-003 -> ADR-004 -> ADR-005 -> fase-4`, `08.00 -> 08.01 -> transversal`, `90.14 -> 90.16 -> 90.17 -> 90.18 -> 90.19 -> docs/README`.
- La carpeta `docs/fase-3-arquitectura/adr/` pasa de un ADR a cinco (`ADR-001` a `ADR-005`).
- Version visible alineada a `v11.0.0` en `README.md`.
- `node ci/scripts/check-docs.mjs` termina con salida limpia sobre `296` archivos markdown.
- Se publico `releases/v11.0.0.md` y se agrego la entrada en `releases/README.md`.

## v10.6.0
- Segunda auditoria registrada en `revisiones/2026-04-22-informe-revision-v2.md` y resultados aplicados.
- Se cerraron dos asimetrias reales de la cadena `nav-guided`: `docs/fase-7-deploy/README.md` y `docs/transversal/README.md` ahora apuntan a su nodo previo correcto.
- Se extendieron los breadcrumbs `[README principal] | [Indice docs] | [Volver a <parent>]` a los 82 READMEs profundos bajo `ai/`, `src/`, `tests/`, `qa/`, `ops/`, `plantillas/`, `ejemplos/`, `escenarios/` y `stacks/`.
- Se alineo la version visible del `README.md` con el release vigente (`v10.6.0`).
- Se unifico el nombre de fase a `Analisis y requerimientos` en `ejemplos/README.md`.
- Se alineo el slug de `specs/000-ejemplo-feature` con el folder, manteniendo gestion de usuarios como dominio ilustrativo.
- Se unifico la convencion ADR (`ADR-NNN-nombre-corto-kebab.md` y H1 `ADR-NNN - Nombre corto`) en `docs/transversal/90.07-convenciones-y-naming.md`, `plantillas/fase-3-arquitectura/adr.md`, `ejemplos/fase-3-arquitectura/adr-ejemplo.md` y `docs/fase-3-arquitectura/adr/README.md`.
- Se creo el primer ADR canonico `docs/fase-3-arquitectura/adr/ADR-001-monolito-modular-mvp.md` y se incorporo al recorrido `nav-guided`.
- Se arreglo la abreviacion `specs/001, 002, 003` en `releases/v10.5.0.md` a los slugs completos.
- Se corrigio la typo `close-docs.py` en `revisiones/2026-04-21-informe-revision.md`.
- Se hizo descubrible `CONTRIBUTING.md` desde `README.md` y `docs/README.md`, y se menciono `ci/scripts/check-docs.mjs` desde `ci/README.md`.
- Se extendio `ci/scripts/check-docs.mjs` con verificacion de simetria `Anterior`/`Siguiente` en la cadena `nav-guided`.
- Se publico `releases/v10.6.0.md` y se agrego la entrada en `releases/README.md`.

## v10.5.0
- Auditoria completa de consistencia, contenido y navegabilidad documentada en `revisiones/2026-04-21-informe-revision.md`.
- Se normalizo la codificacion: removido `UTF-8 BOM` de 67 archivos markdown.
- Se unifico la forma ASCII en titulos, breadcrumbs y etiquetas `nav-guided` (`Indice docs`, `Analisis`, `Operacion`, `Construccion`, `Adopcion`, `Produccion`, `Estimacion`, `Decisiones tecnologicas`, `Vision`).
- Se formalizaron las reglas de acentuacion, codificacion, estructura minima por documento y recorrido `nav-guided` en `docs/transversal/90.07-convenciones-y-naming.md`.
- Se agrego `CONTRIBUTING.md` con las convenciones de edicion y verificacion.
- Se agrego `ci/scripts/check-docs.mjs` para validar BOM, enlaces rotos, anclas, bloque `nav-guided` y formas ASCII reservadas.
- Se agrego el bloque `Primera lectura en 10 minutos` al `README.md` y se alineo la version visible con el release.
- Se cerro el recorrido guiado en `docs/transversal/90.12-mapa-ia-por-fase.md` con enlaces markdown navegables.
- Se agregaron breadcrumbs hacia `README principal` e `Indice docs` en los README raiz fuera de `docs/` (`ai/`, `specs/`, `src/`, `tests/`, `qa/`, `ops/`, `plantillas/`, `ejemplos/`, `escenarios/`, `stacks/`, `estimacion/`, `likec4/`, `diagramas/`, `ci/`, `releases/`).
- Se precisaron rutas por rol en `docs/README.md` (PO, Arquitecto, Tech Lead, QA, DevOps).
- Se completo `specs/README.md` para exponer los tres artefactos (`spec-funcional`, `spec-tecnica`, `spec-tareas`) por feature canonica y por `000-ejemplo-feature`.
- Se clarifico en `src/backend/{application,domain,infrastructure,interfaces}/expedientes/README.md` que `001-bandeja-trabajo-expedientes` es una lectura que no requiere archivo por capa.
- Se completo el enlace a `spec-tareas.md` en `docs/fase-4-sdd/README.md`.
- Se corrigio la ruta canonica de Construccion en `docs/fase-0-iniciacion/00.06-ruta-guiada-caso-canonico.md`.
- Se ajusto `ops/fase-7-deploy/runbook.md` para usar `Precondiciones` en lugar de `Preconditions`.
- Se publico `releases/v10.5.0.md` y se agrego la entrada en `releases/README.md`.

## v10.4.0
- Se completaron las plantillas operativas que todavia tenian secciones vacias o poco guiadas, incluyendo `runbook.md`.
- Se extendio el patron de enlaces bidireccionales entre `ejemplos/` y `plantillas/` a las fases 0, 1 y 8.
- Se reestructuro `ejemplos/fase-0-iniciacion/README.md` para alinearlo con el formato del resto de README de ejemplos.
- Se ajusto la nota de cierre en `docs/transversal/90.12-mapa-ia-por-fase.md` para volver al inicio real del recorrido guiado.
- Se agrego la nota formal de release `releases/v10.4.0.md` para mantener sincronizados `CHANGELOG` y `releases/`.

## v10.3.0
- Se reforzo la navegacion guiada en `docs/` para cerrar mejor el flujo entre fases y documentos de soporte.
- Se agregaron los documentos guia `docs/fase-6-qa/06.00-plan-pruebas.md` y `docs/fase-8-operacion/08.00-operacion-continua.md`.
- Se agrego `likec4/README.md` con instrucciones de instalacion, uso y referencia visual hacia `diagramas/`.
- Se reestructuro `plantillas/fase-4-sdd/spec-tareas.md` y se completo el ejemplo `specs/000-ejemplo-feature/` para reflejar mejor el estandar SDD.
- Se mejoraron rutas relacionadas, breadcrumbs y consistencia transversal en varios `README.md` de fase.
- Se poblo `plantillas/fase-7-deploy/pipeline-baseline.md` y se reforzo `docs/fase-3-arquitectura/03.04-checklist-arquitectura.md` como checklist operativo.

## v10.2.0
- Se alineo el versionado visible del template con el estado real del repositorio.
- Se agrego un baseline explicito para pipeline y release en `ci/README.md` y `ci/pipeline-baseline.md`.
- Se reforzo la trazabilidad de fase 7 en `docs/fase-7-deploy/07.00-checklist-salida-produccion.md`, `docs/transversal/90.10-entregables-minimos-por-fase.md` y `docs/transversal/90.11-checklist-entregables.md`.
- Se agrego una entrada explicita de ejemplos para fase 5 en `ejemplos/fase-5-construccion/`.
- Se preparo la release formal `releases/v10.2.0.md` como snapshot de cierre de esta etapa de madurez.

## v10.1.0
- Se agrego `docs/fase-0-iniciacion/00.06-ruta-guiada-caso-canonico.md` para entender el template en una sola lectura.
- Se agrego `003-historial-auditoria-expediente` y se completo el trio canonico `HU-02`, `HU-03`, `HU-04`.
- Se alinearon los ejemplos por fase para contar una sola historia consistente del MVP canonico.
- Se prepararon notas de release formales en `releases/v10.1.0.md`.

## v10.0.0
- Navegacion documental reforzada con indice general, enlaces entre documentos y rutas por rol.
- README mejor posicionado para presentar la plantilla como producto reutilizable.
- Ejemplos convertidos a artefactos mas completos y alineados al estandar.
- Estructura base de proyecto real agregada con `src/`, `tests/`, `qa/`, `ops/` y `releases/`.
- Release notes agregadas en `releases/v10.0.0.md`.
- Plantillas, ejemplos, QA y operaciones reorganizados con criterio por fase.
- Se incorporo una base ejecutable neutral para proyectos nuevos en `src/`, `tests/`, `specs/`, `qa/` y `ops/`.
- Se agregaron los ejemplos `001-bandeja-trabajo-expedientes` y `002-cambio-estado-expediente` conectados de punta a punta con `src/`, `tests/`, `qa/` y `ops/`.

## 2026-04-18

### Normalize project template standard
- Se unifico la nomenclatura del repositorio alrededor de fases `0-8`, `Spec-Driven Development (SDD)` y rutas canonicas.
- Se alinearon `AGENTS.md`, `README.md`, la guia de uso, los roles, los entregables por fase y el checklist global.
- Se elimino la duplicidad del checklist SDD y se reforzo `plantillas/fase-4-sdd/spec-tecnica.md` con riesgos, dependencias y estrategia de pruebas.
- Se agregaron plantillas operativas para roadmap, estimacion, despliegue, plan de pruebas, runbook y operacion.
- Se formalizo la convencion para ADR en `docs/fase-3-arquitectura/adr/`.

### Improve positioning and adoption guidance
- Se actualizo `README.md` con un posicionamiento mas claro del template, su propuesta de valor y una ruta de adopcion rapida.
- Se agrego `docs/fase-0-iniciacion/00.05-checklist-adopcion.md` para onboardear proyectos nuevos sobre la plantilla.
- Se conecto la guia de uso con la nueva checklist de adopcion.

### Improve committee and execution views
- Se agrego una vista ejecutiva en `docs/transversal/90.10-entregables-minimos-por-fase.md` para lectura rapida por fase.
- Se transformo `docs/transversal/90.11-checklist-entregables.md` en formato de gate por fase, manteniendo utilidad para comite y ejecucion.

### Improve documentation navigation
- Se agrego `docs/README.md` como indice general de la documentacion.
- Se mejoro la navegacion del `README.md` para apuntar al indice documental con enlaces relativos y portables.
