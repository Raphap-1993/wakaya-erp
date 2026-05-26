# Informe de revision v2 - consistencia, contenido y navegabilidad

[README principal](../README.md) | [Indice docs](../docs/README.md) | [Informe previo](2026-04-21-informe-revision.md)

## Contexto
Segunda auditoria sobre la plantilla, hecha despues de aplicar las correcciones de `v10.5.0` y con los documentos nuevos `docs/transversal/90.13-modos-de-trabajo.md` y `docs/transversal/90.14-instanciacion-fases-proyectos-reales.md` ya incorporados al recorrido guiado.

## Metodo
- Ejecucion del validador: `node ci/scripts/check-docs.mjs`.
- Recorrido programatico de `nav-guided` en ambos sentidos (`Siguiente` y `Anterior`) desde `README.md`.
- Inspeccion de `README.md`, `AGENTS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `docs/README.md`, `docs/transversal/README.md`, `specs/`, `src/`, `tests/`, `qa/`, `ops/`, `ai/`, `plantillas/`, `ejemplos/`, `escenarios/`, `stacks/`, `releases/` y `ci/`.
- Grep sobre nomenclatura de fases, features, ADR y formas acentuadas en titulos, breadcrumbs y `nav-guided`.

## Resumen ejecutivo
- El validador automatizado termina limpio: `OK. 259 archivos markdown revisados sin hallazgos.`
- El recorrido `nav-guided` hacia adelante recorre 48 nodos y cierra en `docs/README.md`. Dos nodos no quedan alcanzables hacia atras porque sus enlaces `Anterior` saltan al README de fase en lugar de al ultimo documento de la fase previa.
- Hay 82 READMEs en niveles profundos del repositorio que todavia no tienen la fila de breadcrumbs que si tienen los READMEs raiz. Navegar desde enlaces cruzados hacia adentro deja al lector sin vuelta visible.
- Hay drift de nomenclatura en tres puntos especificos (version del README, nombre de la fase 1 en `ejemplos/`, slug de la feature en `000-ejemplo-feature/`).
- `CONTRIBUTING.md` y `ci/scripts/check-docs.mjs` existen pero no estan enlazados desde `README.md`, `docs/README.md` ni `ci/README.md`; el lector no los descubre por recorrido.
- Se introdujo una dog-food menor en `releases/v10.5.0.md:32` (uso abreviado `specs/001, 002, 003`) despues de haber formalizado que no se abrevia fuera de tablas.

## Hallazgos

### Alta - navegabilidad
1. Cadena `nav-guided` asimetrica: en `docs/fase-7-deploy/README.md:7` el `Anterior` apunta al README de la fase 6, pero el enlace directo hacia adelante llega desde `06.00-plan-pruebas.md` dentro de la fase 6. Al presionar `Anterior`, el lector cae en el README de la fase 6 en lugar de en el ultimo documento que acababa de leer. Corregir el `Anterior` para que apunte a `06.00-plan-pruebas.md` con texto `Plan de pruebas`.
2. Mismo patron en `docs/transversal/README.md:7`. El `Siguiente` que apunta aqui viene de `08.00-operacion-continua.md` en la fase 8, pero el `Anterior` salta al README de la fase 8. Corregir el `Anterior` para que apunte a `08.00-operacion-continua.md` con texto `Operacion continua`.
3. 82 READMEs profundos sin breadcrumbs. En `v10.5.0` se agrego la fila `[README principal] | [Indice docs]` a los 15 READMEs raiz, pero no se extendio al resto. Afecta `ai/agents/`, `ai/prompts/`, `ai/skills/`, `ai/ejemplos/`, las subcarpetas de `src/` (`backend/`, `backend/domain/`, `backend/domain/expedientes/`, etc.), todas las subcarpetas de `tests/`, `qa/fase-6-qa/` y subcarpetas, `ops/fase-7-deploy/` y `fase-8-operacion/` con sus `features/`, todas las fases dentro de `plantillas/` y `ejemplos/`, las dimensiones dentro de `escenarios/` y los stacks dentro de `stacks/`. Un lector que aterriza en `src/backend/domain/expedientes/README.md` desde un enlace de spec-tecnica.md no tiene como volver. Agregar un breadcrumb relativo al nivel correspondiente para cerrar la orientacion.

### Alta - consistencia
4. `README.md:1` dice `# Project Template v10.5` pero `releases/`, `CHANGELOG.md` y `releases/v10.5.0.md` usan `v10.5.0` (tres digitos). Igualar a `v10.5.0` para no sembrar duda sobre si la version visible corresponde al release real.
5. `ejemplos/README.md:14` usa `Fase 1 - Analisis de requerimientos`. El resto del repositorio (`docs/README.md`, `plantillas/README.md`, H1 de `docs/fase-1-*`, `ejemplos/fase-1-*`) usa `Analisis y requerimientos`. Cambiar la linea 14 a `Analisis y requerimientos`.
6. `specs/000-ejemplo-feature/` contiene archivos cuyo H1 y campo `Feature` dicen `000-gestion-de-usuarios`, pero la carpeta y todas las referencias cruzadas (`specs/README.md`, `docs/fase-4-sdd/README.md`, `CHANGELOG.md`, `releases/v10.3.0.md`) lo llaman `000-ejemplo-feature`. La plantilla base `plantillas/fase-4-sdd/spec-funcional.md` indica explicitamente que el campo `Feature` debe ser el identificador y nombre corto de la feature â€” en este caso, el slug del folder. Opciones: renombrar la carpeta a `000-gestion-de-usuarios` (impacto: actualizar cinco referencias) o ajustar el contenido para que el `Feature` sea `000-ejemplo-feature` y el objetivo siga siendo gestion de usuarios.

### Media - consistencia
7. `plantillas/README.md:11` abrevia la fase 4 a `Fase 4 - SDD` mientras `docs/README.md:23` y `ejemplos/README.md:17` usan `Fase 4 - Spec-Driven Development`. El nombre corto en plantillas es defendible porque la carpeta se llama `fase-4-sdd/`, pero conviene que al menos la primera aparicion siga el estandar definido en `docs/transversal/90.07-convenciones-y-naming.md` (forma completa en primera aparicion, `SDD` despues).
8. `docs/fase-0-iniciacion/00.02-roadmap.md:70` extiende la fase 8 como `Fase 8 - Operacion y mejora continua` como encabezado de seccion. No es incorrecto en un roadmap descriptivo, pero rompe la simetria con el resto del repo que usa solo `Fase 8 - Operacion`. Aclarar en el mismo encabezado o alinear al nombre corto.
9. Convencion ADR sin decision explicita. `docs/fase-0-iniciacion/00.00-guia-de-uso.md:43` usa `ADR-XXX-nombre-corto.md`, `docs/fase-3-arquitectura/adr/README.md:15` usa `ADR-001-nombre-corto.md`, `docs/fase-3-arquitectura/03.04-checklist-arquitectura.md:29` usa `ADR-XXX-*.md`, y `plantillas/fase-3-arquitectura/adr.md:1` usa `ADR-000`. Cuatro patrones en paralelo. Ya estaba en el informe previo (hallazgo 22) y no se cerro en `v10.5.0`.
10. `releases/v10.5.0.md:32` escribe `specs/001`, `002` y `003` en lugar del slug completo. `releases/v10.1.0.md:23` hacia lo mismo y el informe previo lo habia marcado como hallazgo 23. La regla ahora esta escrita en `CONTRIBUTING.md` ("No abrevies a `001`, `002`, `003` fuera de tablas"), pero `releases/v10.5.0.md` la incumple.
11. `revisiones/2026-04-21-informe-revision.md:97` tiene un typo introducido al cerrar el informe: menciona `ci/scripts/close-docs.py` cuando el script se llama `check-docs.mjs`.

### Media - contenido
12. `CONTRIBUTING.md` existe pero no esta enlazado desde `README.md` ni desde `docs/README.md`. El propio `CHANGELOG.md:10` y `releases/v10.5.0.md:18` lo anuncian como publicado, pero en la ruta de navegacion del lector nuevo es invisible. Agregar un enlace en `README.md` (por ejemplo, dentro de "Ruta recomendada de adopcion" o en "Rutas complementarias" de `docs/README.md`) y en `AGENTS.md` (paso 1 o "Como debe trabajar un agente").
13. `ci/README.md` y `ci/pipeline-baseline.md` no mencionan `ci/scripts/check-docs.mjs`. El script funciona y esta documentado en `CONTRIBUTING.md`, pero desde la puerta de entrada de CI no se descubre. Agregar una entrada en "Artefactos disponibles" (`ci/README.md`) y referencia en "Flujo minimo esperado - Validar formato y checks basicos" (`ci/pipeline-baseline.md`).
14. `docs/fase-3-arquitectura/adr/` solo tiene `README.md`. No hay ningun ADR de ejemplo en la carpeta real (el ejemplo vive en `ejemplos/fase-3-arquitectura/adr-ejemplo.md`). Copiar o enlazar el `adr-ejemplo.md` desde `adr/README.md` para que el lector que entra ahi tenga un ancla visible.
15. `docs/README.md` tiene una seccion "Rutas complementarias" que no lista `CONTRIBUTING.md`, `docs/transversal/90.07-convenciones-y-naming.md` (convenciones) ni el validador. Son las tres puertas naturales del mantenedor.

### Media - navegabilidad
16. `docs/transversal/README.md:7` y `docs/fase-7-deploy/README.md:7` son los dos casos de `Anterior` asimetrico (ya listados arriba como hallazgos 1 y 2). Con el validador actual esto no se detecta; conviene ampliar `ci/scripts/check-docs.mjs` para verificar que para cada pareja `A -> B` del recorrido hacia adelante, el `Anterior` de `B` apunte a `A`.
17. Documentos transversales `90.13-modos-de-trabajo.md` y `90.14-instanciacion-fases-proyectos-reales.md` estan enlazados desde `docs/README.md:78`, desde los `Rutas relacionadas` de varias fases y desde `docs/fase-0-iniciacion/00.00-guia-de-uso.md:47-48`. Buena cobertura cruzada. No hay hallazgo en esos archivos.

### Baja - detalles
18. `docs/fase-6-qa/README.md:18-19` conserva la "Regla de extension" local pese a que la regla general ya esta formalizada en `docs/transversal/90.07-convenciones-y-naming.md` y enlazada desde ahi. Es util como recordatorio, pero es una unica fase con esta nota; revisar si conviene mantener solo el enlace a la regla canonica.
19. `docs/fase-4-sdd/README.md:16` sigue explicando por que la entrada viene desde `adr/README.md`. Mismo patron que 18: la "excepcion documentada" quedo despues de formalizar el recorrido. Evaluar si sigue siendo necesaria.

## QuÃ© esta bien (para no perderlo al corregir)
- `node ci/scripts/check-docs.mjs` pasa limpio sobre 259 archivos.
- El recorrido `nav-guided` forward cubre 48 nodos y cierra el ciclo en `docs/README.md`, incluyendo los dos documentos nuevos `90.13` y `90.14`.
- Toda forma acentuada quedo ausente de titulos, breadcrumbs y etiquetas `nav-guided` en los 259 archivos markdown; el validador lo impone activamente.
- 0 archivos con `UTF-8 BOM`.
- 0 enlaces markdown rotos y 0 anclas rotas.
- Nueva documentacion transversal bien integrada: `90.13` y `90.14` tienen breadcrumb, nav-guided y cross-links a guias de fase.
- `specs/` mantiene los tres artefactos obligatorios por cada feature canonica y por `000-ejemplo-feature`.
- Plantillas y ejemplos conservan simetria por fase (con las omisiones intencionales de fase 2 y 5 en `plantillas/`, ya documentadas).

## Recomendaciones priorizadas

### Acciones rapidas (menos de 1 hora, bajo riesgo)
1. Corregir `docs/fase-7-deploy/README.md:7` y `docs/transversal/README.md:7` para que `Anterior` apunte al ultimo documento de la fase previa, no al README de fase.
2. Igualar `README.md:1` a `v10.5.0`.
3. Cambiar `ejemplos/README.md:14` a `Analisis y requerimientos`.
4. Arreglar el typo en `revisiones/2026-04-21-informe-revision.md:97` (`close-docs.py` -> `check-docs.mjs`).
5. Reemplazar `specs/001, 002 y 003` por el slug completo en `releases/v10.5.0.md:32`.
6. Agregar enlace a `CONTRIBUTING.md` en `README.md` (Ruta recomendada de adopcion o Estructura principal) y en `docs/README.md` (Rutas complementarias).
7. Agregar `ci/scripts/check-docs.mjs` a "Artefactos disponibles" en `ci/README.md` y a "Flujo minimo esperado" en `ci/pipeline-baseline.md`.

### Acciones de consistencia (1-2 horas)
8. Decidir y aplicar una sola convencion para ADR (`ADR-XXX-nombre-corto.md` o `ADR-001-nombre-corto.md`) en `docs/fase-0-iniciacion/00.00-guia-de-uso.md`, `docs/fase-3-arquitectura/adr/README.md`, `docs/fase-3-arquitectura/03.04-checklist-arquitectura.md` y `plantillas/fase-3-arquitectura/adr.md`. Registrar la decision en `docs/transversal/90.07-convenciones-y-naming.md`.
9. Resolver el mismatch de slug en `specs/000-ejemplo-feature/` (renombrar folder a `000-gestion-de-usuarios/` o ajustar contenido).
10. Formalizar la forma larga vs corta de la fase 4 (`Spec-Driven Development` vs `SDD`) en `plantillas/README.md:11` y `ejemplos/README.md:17`.

### Acciones de contenido (1-2 dias)
11. Cerrar los 82 breadcrumbs pendientes en READMEs profundos. Puede hacerse con un script que inserte la fila correcta despues del H1 segun la profundidad relativa del archivo.
12. Agregar un ADR de ejemplo real en `docs/fase-3-arquitectura/adr/` (puede ser una copia o enlace del que ya vive en `ejemplos/fase-3-arquitectura/adr-ejemplo.md`).
13. Extender `ci/scripts/check-docs.mjs` con una verificacion de simetria `Anterior <-> Siguiente` del recorrido guiado, para detectar automaticamente los casos 1 y 2 cuando vuelvan a aparecer.

### Inversiones mayores (si el equipo lo valora)
14. Ampliar `ci/scripts/check-docs.mjs` para cubrir:
    - Sincronizacion `README.md:1` <-> `CHANGELOG.md` primera entrada <-> `releases/vX.Y.Z.md` existente.
    - Presencia de breadcrumb en todo `README.md` del repo (no solo los raiz).
    - Uso del slug completo `NNN-nombre-feature` en todas las apariciones excepto tablas.
15. Agregar `.github/workflows/docs.yml` o equivalente para correr `check-docs.mjs` en cada PR.

## Como verificar despues de aplicar cambios
- Reejecutar `node ci/scripts/check-docs.mjs`: debe seguir en `OK`.
- Recorrer forward y reverse la cadena `nav-guided`: el numero de nodos debe coincidir en ambos sentidos.
- Contar breadcrumbs: todo `README.md` del repo deberia tener `[README principal]` o equivalente en la segunda linea no vacia.
- Revisar con `grep` que `specs/001`, `specs/002`, `specs/003` no aparezcan fuera de tablas.
- Revisar con `grep` que la version visible del `README.md` coincida con la ultima entrada del `CHANGELOG.md`.

## Resultado de las correcciones (v10.6.0)
- Todos los hallazgos listados arriba quedaron atendidos en la release `v10.6.0`.
- Las dos asimetrias reales de la cadena `nav-guided` estan cerradas (`docs/fase-7-deploy/README.md` y `docs/transversal/README.md`).
- Los 82 READMEs profundos ya tienen breadcrumbs `[README principal] | [Indice docs] | [Volver a <parent>]`.
- La convencion ADR quedo formalizada en `docs/transversal/90.07-convenciones-y-naming.md`, y el primer ADR canonico vive en `docs/fase-3-arquitectura/adr/ADR-001-monolito-modular-mvp.md`.
- El script `ci/scripts/check-docs.mjs` ahora valida simetria `Anterior`/`Siguiente` de manera automatica.
- Detalle consolidado en [`releases/v10.6.0.md`](../releases/v10.6.0.md) y en la entrada `v10.6.0` del [`CHANGELOG.md`](../CHANGELOG.md).

