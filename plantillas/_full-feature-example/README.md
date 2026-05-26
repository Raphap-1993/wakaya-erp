# Full feature example (canonical reference)

Este directorio es una **referencia visual** del formato canonico esperado para una feature en `specs/NNN-slug/`. NO es una feature ejecutable; es para que un agente IA (o humano) lea y comprenda el shape exacto antes de generar una feature propia.

## Como usarlo

### Opcion 1 — Usar `scaffold-feature` (recomendado)

El comando `scaffold-feature` genera los 9 archivos canonicos pre-poblados con la estructura correcta. Es la forma mas rapida y libre de error:

```bash
node scripts/scaffold-feature.mjs \
  --slug 002-control-parental \
  --titulo "Control parental" \
  --rfs RF-02,RF-03 \
  --rnfs RNF-01 \
  --hus HU-02 \
  --entidad perfil_parental \
  --endpoint "GET /api/parental,POST /api/parental"
```

Resultado: 11 archivos en specs/002-control-parental/ (los 9 canonicos + README + placeholder de prototype-html5). Solo necesitas rellenar el contenido del dominio.

### Opcion 2 — Copiar archivos del ejemplo canonico

Si no quieres usar `scaffold-feature` y prefieres ver una feature real ya escrita y validada, abre:

```
specs/001-bandeja-trabajo-expedientes/
```

Esa es la **feature canonica de referencia** del template. Tiene los 9 archivos completos con contenido real, gates aprobados, matriz traceability con 10 columnas, prototipo HTML5 nivel 3 (1309 lineas), spec-tecnica con bloque `Tabla \`expediente\`` correcto, api-contract con OpenAPI.

Copia su estructura literal, **NO su dominio** (el dominio es ejemplo de "bandeja de expedientes" y debe reemplazarse — ver `AGENTS.md > Glosario de terminos`).

## Lista de los 9 archivos canonicos

| Archivo | Contenido minimo | Validador que lo verifica |
|---|---|---|
| `spec-funcional.md` | Origen, Objetivo, Requerimientos (RF/RNF), Reglas, Actores, Criterios de aceptacion | `check:docs` |
| `spec-tecnica.md` | Modelo de datos con bloque `Tabla \`<entidad>\`` + tabla cols + PK + Indices | `check:bd-documented` |
| `traceability.md` | Matriz 10 columnas + seccion `## Gates` + Decisiones + Preguntas abiertas | `check:trace-drift`, `check:gates-mentioned` |
| `prototype.md` | Patron visual elegido, anatomia, estados, mock, roles, tokens CSS esperados | `check:prototype-hub` |
| `prototype-validation.md` | Participantes humanos, Resultado, checklist 10 items, Gate | `check:evidence-exists` |
| `product-design.md` | Problema, Jobs-to-be-done, Hipotesis, Metricas, Flujos | `check:docs` |
| `spdd-frontend.md` | Componentes, Estados UI, Permisos, Feedback UX, Accesibilidad | `check:ai-artifacts` |
| `api-contract.md` | Endpoints `METHOD /path` + OpenAPI snippets con `requestBody`/`responses`/`schema` | `check:api-documented` |
| `ui-test-cases.md` | Casos por estado (loading/empty/error/success/permission), Casos por rol, e2e | `check:test-documented` (fase >=6) |

Mas el prototipo navegable:

| Archivo | Contenido minimo | Validador |
|---|---|---|
| `prototype-html5/index.html` | HTML5 autocontenido, >=250 lineas (nivel 2) o >=500 (nivel 3), tokens CSS, estados, responsive | `check:prototype-html5` |

## Header canonico de la matriz de traceability

Este es el unico header valido (10 columnas, sin variaciones):

```markdown
| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-01 | HU-01 | spdd-frontend.md | prototype-html5/index.html | GET /api/<recurso> | <entidad_bd> | - | - | Spec inicial | spec-funcional.md |
```

**Errores comunes de columnas** (vistos en opencode/codex/gemini):

| Error | Por que falla |
|---|---|
| 7 columnas: `RF | Pantalla | Prototipo | API | BD | Estado | Evidencia` | Falta HU, UX/SPDD, Codigo, Test → `check:trace-drift` falla al parsear |
| 7 columnas: `RF | Nombre | Componente Frontend | Endpoint API | Permiso | Tarea BE | Tarea FE` | Concepto distinto al canon → memoria del agente no puede relacionar |
| 10 columnas pero sin `## Gates` | `check:gates-mentioned` falla |

## Header canonico de la seccion Gates

```markdown
## Gates
| Gate | Estado | Evidencia |
|---|---|---|
| gate-prototype-ready | Pendiente | prototype-validation.md |
| gate-spdd-approved | Pendiente | spdd-frontend.md |
```

Toda feature visual debe declarar al menos estos 2 gates. Si la feature no es visual (ej. backend puro), declarar `gate-sdd-approved`.

## Bloque canonico de tabla BD

```markdown
Tabla `<nombre_entidad>`:

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| <campo_fk> | UUID | FK -> <tabla_relacionada>.id |
| estado | TEXT | enum: pendiente|activo|inactivo |
| created_at | TIMESTAMP | NOT NULL, default CURRENT_TIMESTAMP |

Indices: `(estado, created_at DESC)` para listados; `(<campo_fk>)` para joins.

Restricciones: PRIMARY KEY (id); UNIQUE (<campo_si_aplica>).
```

Si la FK referencia `usuario.id` (tabla builtin), el validador `check:bd-documented` la acepta. Si referencia otra tabla del proyecto, esa tabla debe estar declarada con el mismo bloque en su propio `spec-tecnica.md`.

## Verificacion final antes de cerrar la feature

```bash
# 1. Sincronizar memoria
npm run memory:sync

# 2. Verificar la feature individualmente
node ci/scripts/check-trace-drift.mjs --root . | grep "specs/<tu-slug>"
node ci/scripts/check-bd-documented.mjs --root .
node ci/scripts/check-api-documented.mjs --root .
node ci/scripts/check-gates-mentioned.mjs --root .

# 3. Verificar instanciacion strict (detecta strings residuales, $(date), etc.)
npm run check:instantiation

# 4. Si todo verde, correr el bundle completo
npm run check:all
```

Si pasaste los 4, la feature esta lista para que humanos validen los gates.

## Patrones contra los que se valida

- Errores reales vistos en 3 instanciaciones por agentes IA (opencode, codex, gemini): ver `AGENTS.md > Errores reales vistos en instanciaciones previas`.
- Reglas del template v12.45+: ver `INSTANCIACION_PROYECTO_REAL.md`.
- Rubrica de calidad de prototipos: `docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`.
