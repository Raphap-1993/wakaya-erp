# ci/scripts/ — Validadores del template AI-first

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de ci/](../README.md)
- Siguiente: [Volver a ci/](../README.md)
<!-- nav-guided:end -->

Cada `check-*.mjs` es un validador independiente que verifica un aspecto especifico del proyecto. Los validadores se invocan via `npm run check:<nombre-corto>` desde el proyecto destino.

## Inventario completo (v12.55)

### `check:template` (4 validadores — verifican el template canonico)

| Script | Que valida | Comportamiento si OK |
|---|---|---|
| `check-docs.mjs` | Links rotos, headings duplicados, secciones obligatorias en `docs/` | Reporta `OK. N archivos revisados sin hallazgos.` |
| `check-prototype-hub.mjs` | Las 10 secciones canonicas del `prototype/index.html` | `OK.` por cada seccion presente |
| `check-ai-artifacts.mjs` | Anatomia minima de skills + prompts + spec-tecnica + spec-funcional + spdd-frontend | `OK. artefactos IA cumplen anatomia minima.` |
| `check-markdown-paths.mjs` | Rutas en backticks (`` `path/al/file` ``) apuntan a archivos reales | `OK. rutas en backticks verificadas sin hallazgos.` |

### `check:project` (14 validadores — verifican el proyecto generado)

| Script | Que valida | Cuando puede ser "silencioso" |
|---|---|---|
| `check-trace-drift.mjs` | Links de la matriz que apuntan a artefactos inexistentes | siempre activo |
| `check-trace-coverage.mjs` | RFs en fase >=5 sin codigo + test reales | **silencioso** si no hay features en fase >=5 (reporta "No hay features...") |
| `check-bd-documented.mjs` | Cada BD declarada tiene doc canonica + FK + columnas + indices | siempre activo si hay BDs declaradas |
| `check-api-documented.mjs` | Cada endpoint declarado tiene doc canonica en `api-contract.md` | siempre activo si hay endpoints |
| `check-test-documented.mjs` | Cada test declarado tiene archivo real + `@trace` + cobertura lcov | **silencioso** si no hay features en fase >=6 (QA) |
| `check-runbook-documented.mjs` | Cada feature en fase 8 tiene runbook con 4 secciones + SLO numerico | **silencioso** si no hay features en fase >=8 (Operacion) |
| `check-evidence-exists.mjs` | Cada `evidence_ref` apunta a archivo real | siempre activo |
| `check-gates-mentioned.mjs` | Cada feature `NNN-*` menciona al menos 1 gate | siempre activo |
| `check-status-coherence.mjs` | `display_status` coincide con lo que `computeDisplayStatus` produciria | siempre activo |
| `check-orphan-evidence.mjs` | Archivos canonicos en `specs/` estan conectados a trazabilidad | siempre activo |
| `check-prototype-diversity.mjs` | Detecta clones de prototipos entre features (mismas lineas, mismo mock) | siempre activo si hay >=2 prototipos |
| `check-openapi-coverage.mjs` | Cada endpoint en `traceability.md` esta en `contracts/api/openapi.yaml` | **silencioso** si ninguna feature declara endpoints |
| `check-prototype-cross-links.mjs` | hrefs cross-spec apuntan a features existentes + no loops circulares | siempre activo si hay >=2 prototipos |
| `check-validation-coverage.mjs` (v12.55) | Meta-validador: `check:project` ejecuta TODOS los validadores fisicos en `ci/scripts/` | siempre activo |

### Validadores separados (no en `check:project` por default)

| Script | Por que separado | Cuando invocarlo |
|---|---|---|
| `check-template-instantiation.mjs` | Es strict checker post-instanciacion | `npm run check:instantiation` |
| `check-html5-prototype-quality.mjs` | Se corre per-spec, no en pipeline general | `node ci/scripts/check-html5-prototype-quality.mjs --spec specs/NNN-feature` |

### Validadores CI-only (no en `check:project`, requieren contexto adicional)

| Script | Por que CI-only | Como invocarlo |
|---|---|---|
| `check-github-actions.mjs` | Valida workflows `.github/`; CI-level | desde el workflow de GitHub Actions |
| `check-openapi-diff.mjs` | Requiere `--base`/`--head` git refs | `node ci/scripts/check-openapi-diff.mjs --base origin/main --head HEAD` |
| `check-rbac-consistency.mjs` | Stack-specific (solo si hay `stacks/<x>/template/`) | `node ci/scripts/check-rbac-consistency.mjs` |

## Sobre los validadores "silenciosos"

Algunos validadores son intencionalmente silenciosos en fases tempranas del proyecto:

- **`check-test-documented`** solo aplica cuando la feature pasa a fase 6 (QA). En fase 0-5, reporta `OK. No hay features en fase >= 6.` — no es un falso positivo, es comportamiento correcto.
- **`check-runbook-documented`** solo aplica cuando la feature pasa a fase 8 (Operacion). En fase 0-7, reporta `OK. No hay features en fase >= 8.`
- **`check-trace-coverage`** solo aplica cuando hay codigo real con `@trace`. En fase 0-4 (sin codigo), reporta `OK. No hay features en fase >= 5.`
- **`check-openapi-coverage`** silencioso si ninguna feature declara endpoints en su `traceability.md`.

Si quieres saber cuantos validadores aplican REALMENTE a tu proyecto (no solo cuantos pasan trivialmente), corre:

```bash
npm run roadmap:status
```

El roadmap muestra que fase esta cada feature y por ende que validadores realmente importan ahora.

## Como agregar un validador nuevo

1. Crear `ci/scripts/check-<nombre>.mjs` siguiendo el patron de los existentes (`parseArgs`, `--root`, `--strict`, exit codes 0/1).
2. Agregar al `package.json`:
   ```json
   "check:<nombre>": "node ci/scripts/check-<nombre>.mjs"
   ```
3. Decidir bucket:
   - Si valida el proyecto entero → agregar a `check:project` pipeline.
   - Si valida el template (estructura, docs) → agregar a `check:template`.
   - Si requiere contexto especial (CI, git, stack) → mantenerlo separado y agregarlo a la lista de excepciones de `check-validation-coverage.mjs > CI_ONLY_VALIDATORS`.
4. El meta-validador `check-validation-coverage` automaticamente detectara si lo dejaste fuera del pipeline.

## Convencion para invocar via npm

```bash
# CORRECTO (npm sin args):
npm run check:project

# CORRECTO (npm con args usando `--` separador):
npm run check:openapi-coverage -- --threshold 95
npm run memory:serve -- --port 4320

# INCORRECTO (npm parsea `--port 4320` como flag de npm, no lo pasa al script):
npm run memory:serve --port 4320     # ⚠ npm advierte y descarta --port
```

**Razon**: npm interpreta cualquier `--xxx` antes del `--` separador como flag propio de npm. Para pasar args al script, usa `--` entre el nombre del script y los args. Como fallback (v12.55), `memory-serve` tambien acepta puerto posicional: `npm run memory:serve --port 4320` se convierte en `node ... memory-serve 4320` y el script reconoce el `4320` como puerto.

## Referencias

- `docs/transversal/90.36-roadmap-metodologico.md` — roadmap de las 9 fases
- `scripts/roadmap-status.mjs` — CLI que reporta estado vs roadmap
- `scripts/template-upgrade.mjs` — sincronizar proyecto con template canonico
- `AGENTS.md > Pre-flight checklist` — orden de ejecucion canonico
