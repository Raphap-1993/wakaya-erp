# Instanciacion en proyecto real (memoria viva + trazabilidad semantica)

[README principal](README.md) · [AI_CONTEXT](AI_CONTEXT.md) · [Glosario](GLOSSARY.md)
· [Trazabilidad](TRACEABILITY_MATRIX.md) · [SESSION_LOG](SESSION_LOG.md)

> Guia obligatoria para **cualquier agente IA** (Claude Code, Codex, Cursor,
> Copilot Workspace, Gemini Code, etc.) que abra este repo. Lee primero esta
> hoja, despues `AI_CONTEXT.md`.

## TL;DR (3 comandos)

```bash
# 1) Bootstrap: BD, indices, embeddings, contexto vivo
npm run memory:bootstrap

# 2) En cada sesion (o pre-commit): re-sincroniza la BD desde Markdown
npm run memory:sync

# 3) Preguntar a la memoria sin re-leer el repo entero
npm run memory:query -- --preset rf-implemented
npm run memory:query -- --preset rf-planned
npm run memory:query -- --preset rf-validated
npm run memory:query -- --preset links-drift
```

Requiere **Node 22.x** (`node:sqlite` es built-in).

## Que debe hacer el agente al abrir el repo

1. Leer estos 5 archivos en orden:
   1. `INSTANCIACION_PROYECTO_REAL.md` (este)
   2. `AI_CONTEXT.md` - estado actual, decisiones, tareas
   3. `PROJECT_MAP.md` - donde vive cada cosa
   4. `TRACEABILITY_MATRIX.md` - RF/HU consolidados
   5. `GLOSSARY.md` - terminos del dominio
2. Si no existe la BD: `npm run memory:bootstrap`.
3. Si la BD existe pero hubo cambios: `npm run memory:sync`.
4. Leer las ultimas 3 entradas de `SESSION_LOG.md`.
5. `npm run memory:next-task`.

## Que debe hacer al cerrar una sesion

1. Append a `SESSION_LOG.md` con el formato del archivo.
2. `npm run memory:sync` y `npm run memory:context`.

## Trazabilidad: `planned` vs `implemented` vs `validated`

| `link_status` | Significado                                                       |
|-----------------|-------------------------------------------------------------------|
| `planned`     | Declarado en la matriz, **target_ref NO existe** en el repo       |
| `implemented` | Declarado **Y** existe en el repo (archivo/clase/test detectado)  |
| `validated`   | `implemented` + el Estado de la fila marca aprobacion           |

**Regla**: si vas a llenar `Codigo` o `Test` en `traceability.md`,
verifica que el archivo realmente existe. Si no, deja `-`.

## Validacion continua (CI)

```bash
npm run check:docs               # links rotos, headings duplicados
npm run check:trace-drift        # links apuntan a artefactos que existen
npm run check:trace-coverage     # RFs en fase >=5 con codigo + test reales
npm run check:prototype-hub      # 10 secciones del hub
npm run check:all                # todos
```

> Esta guia viene del template canonico `project-template`. Para detalles
> avanzados (presets, errores comunes, diferencias por agente IA, comandos
> del dia a dia), consulta la version raiz del template:
> `INSTANCIACION_PROYECTO_REAL.md` ahi.
