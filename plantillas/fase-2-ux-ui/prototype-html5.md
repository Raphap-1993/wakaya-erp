# Plantilla — Prototipo HTML5

> **Plantilla (no es el entregable).** Destino: `varios`. Consolida el entregable en la carpeta destino que indica el README de esta carpeta.

> Esta plantilla NO es un checklist documental. Es el **pre-flight de decisiones**
> que debe completarse ANTES de escribir HTML, y es la fuente que el validador
> `ci/scripts/check-html5-prototype-quality.mjs` revisa para evaluar B6/B7/B9.

## Ubicación canónica (no negociable)

- El prototipo de cada feature va **siempre** en `specs/<NNN-slug>/prototype-html5/index.html`.
- `prototype/index.html` (raíz) es el **ÚNICO hub** y se **autogenera** con `npm run prototype:hub` — **NUNCA** lleva subcarpetas por feature.
- **Prohibido** `prototype/<feature>/index.html`, `prototipo/` (singular), o prototipos en `frontend/`/`src/`.
- Forma soportada de crearlo: `npm run scaffold:prototype -- --feature <NNN-slug> --domain <dominio>` (copia el golden en la ruta correcta y adapta al dominio). El validador `check:prototype-location` bloquea (strict en `pre-flight-gate` de proyecto instanciado) si está fuera de lugar.

## Cómo usar esta plantilla

1. Copia esta plantilla a `specs/<feature>/prototype-html5/decisiones-ux.md`.
2. Rellena **todos** los campos antes de escribir una sola línea de HTML.
3. Lee el golden del dominio más cercano en `ejemplos/fase-2-ux-ui/prototype-html5-golden/`.
4. Sigue el prompt ejecutable `ai/prompts/generar-prototipo-html5-ejecutable.md` (6 pasos + auto-rating).
5. Antes de declarar "listo", ejecuta el validador en modo strict.

## Nivel mínimo exigido

| Nivel | Estado | Acción |
|---|---|---|
| 0 — Rechazado | Bloqueante visible o riqueza < nivel 2 | Rehacer |
| 1 — Insuficiente | Pasa básico pero shell genérica o datos pobres | Rehacer |
| **2 — Aceptable** | Mínimo para `gate-prototype-ready` | Avanzar con observaciones |
| **3 — Producto real** | Recomendado enterprise | Avanzar |

Rúbrica completa: `docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`.

## Pre-flight obligatorio (copiar a decisiones-ux.md)

```md
## Decisión de patrón de producto
- Dominio del spec:
- Actor principal:
- Tarea principal navegable de inicio a fin:
- Patrón visual elegido (streaming / operativo / ecommerce / educación / salud / dashboard / otro):
- Por qué NO se usa una shell genérica sidenav+tabla:
- Interacciones del prototipo (mínimo 3, expresadas como acciones reales del producto):
- Limitaciones conocidas:

## Golden de referencia
- Path: ejemplos/fase-2-ux-ui/prototype-html5-golden/<elegido>/index.html
- Por qué este golden:
- Patrones estructurales que voy a replicar:
  -
  -
  -
- Tokens base reutilizados de :root (≥ 8):

## Contrato del prototipo
- Estados: loading, empty, error, success
- Roles: <actores del spec-funcional.md>
- Entidades: <entidad principal del dominio>
- RF representados: <todos los RF/RNF/HU del spec-funcional.md>
```

El `## Contrato del prototipo` lo verifica `npm run check:prototype-contract`:
cada Estado/Rol/Entidad debe aparecer en `index.html` y los RF deben CUBRIR los
del `spec-funcional.md` (no puedes omitir un requisito de la feature). Consulta
qué debe contener con `npm run prototype:contract -- --feature <slug> --format text`.

El validador exige que los seis primeros campos estén presentes con su label exacto
("Dominio:", "Actor:", "Tarea:" / "Recorrido:", "Patrón:", "Por qué no" / "Justificación:",
"Interacciones:"). Sin esos campos, B9/B6/B7 no se pueden validar y el gate queda BLOQUEADO.

## Mínimos cuantitativos verificados por el validador

| Métrica | Nivel 2 | Nivel 3 |
|---|---|---|
| Líneas HTML | ≥ 250 | ≥ 500 |
| Custom properties en `:root` | ≥ 6 | ≥ 12 |
| Media queries | ≥ 1 | ≥ 2 |
| Vistas distintas (`data-view` o `<section id>`) | ≥ 4 | ≥ 6 |
| Registros mock | ≥ 6 | ≥ 12 |
| Botones | ≥ 5 | ≥ 10 |

Estos son **mínimos heurísticos** para detectar prototipos pobres. Cumplirlos no garantiza nivel 3 — un prototipo de 500 líneas con shell genérica sigue bloqueado por B9.

### Auto-auditoría visual antes de cerrar (v12.48)

> Verificado contra 3 instanciaciones reales (opencode, codex, gemini): 2/3 cerraron
> prototipos esqueléticos o con Tailwind CDN sin pasar este check. Es OBLIGATORIO.

```bash
# Reemplaza <slug> con el nombre de tu feature.
FILE="specs/<slug>/prototype-html5/index.html"

echo "Líneas: $(wc -l < $FILE)"
echo "Tokens CSS: $(grep -oE '^\s*--[a-z][a-z0-9-]*:' $FILE | sort -u | wc -l)"
echo "Media queries: $(grep -c '@media' $FILE)"
echo "Classes CSS únicas: $(grep -oE 'class="[^"]*"' $FILE | sort -u | wc -l)"
echo "Estados UI: $(grep -cE 'loading|empty|error|success|permission' $FILE)"
echo "Antipatrones (debe ser 0):"
echo "  - Tailwind CDN: $(grep -c 'cdn.tailwindcss.com' $FILE)"
echo "  - HTML minificado: $(awk 'NR==1{c=length($0)} END{if(c>500) print 1; else print 0}' $FILE)"
```

### Mapeo dominio -> golden obligatorio

Antes de escribir tu prototipo, COPIA como base el golden del dominio mas cercano
(de `ejemplos/fase-2-ux-ui/prototype-html5-golden/README.md`) y adapta contenido.
NO empieces desde cero — los 3 agentes que lo intentaron quedaron en nivel 1.

```bash
# Ej. para una feature de streaming:
cp ejemplos/fase-2-ux-ui/prototype-html5-golden/streaming-catalogo-player/index.html \
   specs/<slug>/prototype-html5/index.html
# Adapta: title, brand, mock data, roles. NO toques: estructura, estados, tokens, responsive.
```

### Antipatrones rechazados por el gate

- ❌ `<script src="https://cdn.tailwindcss.com">` (sin frameworks externos).
- ❌ HTML minificado en una linea sin formato.
- ❌ Todo CSS inline con `style="..."` sin classes nombradas.
- ❌ Solo 1 estado UI (ej. solo "success", sin loading/empty/error).
- ❌ Mismo prototipo copiado a varias features cambiando solo titulo.
- ❌ Tipografia default sin escala (h1 solo).
- ❌ Sin token `--brand` propio o paleta plana.
- ❌ Slugs distintos con misma estructura visual (`001-foo` y `001-bar`).

## Salidas esperadas

```
specs/<feature>/prototype-html5/
  index.html         ← autocontenido, HTML+CSS+JS vanilla en un solo archivo
  flujo.md           ← pantallas, transiciones, estados
  decisiones-ux.md   ← este pre-flight rellenado
specs/<feature>/prototype.md         ← actualizar con ruta y cobertura
specs/<feature>/prototype-validation.md ← crear como PENDIENTE
prototype/index.html                 ← hub (crear/actualizar con link a la spec)
```

## Reglas inviolables

- `index.html` autocontenido por defecto. Sin frameworks externos, sin build, sin backend real.
- Datos mock del dominio, nunca "Lorem ipsum" ni datos genéricos.
- Cero términos prohibidos como texto visible: `RF-`, `gate-`, `Contrato mock`, `Formulario-spec`, `Actividad de ejemplo`, `Recorrido simulado`, `Permiso activo`, `Ruta interna`, `Componente:`, `Spec técnica`, `Angular futuro:`.
- Estados (`loading`, `empty`, `error`, `success`, `permission denied`) como **comportamiento natural** de la pantalla, nunca como tabs de navegación principal.
- Patrón visual del dominio. Sidenav + tabla solo se acepta para SaaS operativo / backoffice. Para streaming/ecommerce/educación/kids es bloqueante B9.
- Link visible de vuelta al hub `prototype/index.html`.
- Link discreto de vuelta al hub (icono o texto sutil en el topbar; sin banner que rompa la sensacion de producto). El aviso de "simulacion / datos de demostracion" vive en el hub, no en cada prototipo.

## Referencias

- Estándar: `docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md`
- Rúbrica: `docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`
- Gate de calidad: `ai/quality-gates/gate-html5-product-quality.md`
- Gate de readiness: `ai/quality-gates/gate-prototype-ready.md`
- Prompt ejecutable: `ai/prompts/generar-prototipo-html5-ejecutable.md`
- Comando: `ai/commands/prototype-command.md`
- Goldens: `ejemplos/fase-2-ux-ui/prototype-html5-golden/`
- Anti-ejemplo: `ejemplos/fase-2-ux-ui/prototype-html5-anti-ejemplo/`
- Validador: `ci/scripts/check-html5-prototype-quality.mjs`
