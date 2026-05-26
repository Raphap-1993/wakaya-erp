# Informe de revisiÃ³n â€” consistencia, contenido, navegabilidad y mejoras

- Fecha: 2026-04-21
- Alcance: todo el repositorio `project-template` (README, AGENTS, CHANGELOG, releases y carpetas `docs/`, `ai/`, `specs/`, `src/`, `tests/`, `qa/`, `ops/`, `plantillas/`, `ejemplos/`, `escenarios/`, `stacks/`, `estimacion/`, `likec4/`, `diagramas/`, `ci/`).
- MÃ©todo: inventario de archivos, lectura de documentos raÃ­z e Ã­ndice, verificaciÃ³n automÃ¡tica de enlaces markdown y anclas, trazado de la cadena `nav-guided`, conteo de variantes ortogrÃ¡ficas y detecciÃ³n de BOM.
- Estado del Ã¡rbol: 256 archivos markdown, 0 enlaces markdown rotos, 0 anclas internas rotas.

## Resumen ejecutivo
El repositorio estÃ¡ en muy buen estado estructural: la navegaciÃ³n guiada entre fases funciona, los enlaces relativos resuelven y la separaciÃ³n `docs/` â†” `plantillas/` â†” `ejemplos/` â†” artefactos aplicados (`specs/`, `src/`, `tests/`, `qa/`, `ops/`) se mantiene coherente. Los problemas pendientes son de acabado: versionado desalineado, mezcla de ortografÃ­a con/sin acentos, 67 archivos con BOM UTF-8, un par de rutas de referencia abreviadas o desfasadas, y algunas asimetrÃ­as menores entre READMEs de soporte. Ninguno bloquea la adopciÃ³n del template.

## Hallazgos por prioridad

### Alta â€” consistencia
1. VersiÃ³n visible del template desalineada. `README.md:1` dice `# Project Template v10.2`, pero `CHANGELOG.md` y `releases/` ya incluyen `v10.3.0` y `v10.4.0`. La misma entrada de `CHANGELOG.md` de `v10.2.0` se compromete a "alinear el versionado visible del template con el estado real", asÃ­ que el estado actual contradice ese criterio.
2. `releases/README.md` estÃ¡ incompleto. Lista solo `v10.0.0`, `v10.1.0` y `v10.2.0`, pero en disco existen ademÃ¡s `v10.3.0.md` y `v10.4.0.md`, que `CHANGELOG.md` sÃ­ cita. Resultado: el Ã­ndice de releases miente sobre el contenido real de la carpeta.
3. OrtografÃ­a mezclada a lo largo de `docs/`. Conteos (ocurrencias totales, sin contexto estricto, pero directas):
   - `Indice` 32 vs `Ãndice` 15
   - `Operacion` 27 vs `OperaciÃ³n` 7
   - `Analisis` 14 vs `AnÃ¡lisis` 6
   - `Construccion` 18 vs `ConstrucciÃ³n` 4
   - `Estimacion` 4 vs `EstimaciÃ³n` 3
   Los H1 de las fases son un reflejo directo: "Fase 0 - Iniciacion" y "Fase 5 - Construccion" sin acento, pero "Fase 1 - Analisis y requerimientos" y "Fase 8 - Operacion" con acento. `docs/README.md` lista las nueve fases sin acentos en ningÃºn caso, por lo que cada visita a una fase choca con lo que se anunciÃ³ en el Ã­ndice.
4. Breadcrumb "Indice docs" vs "Indice docs". 15 archivos en `docs/` usan la versiÃ³n con acento y 30 la versiÃ³n sin acento. No se detecta un criterio (ni por fase, ni por tipo de documento), lo que sugiere que se editÃ³ manualmente.
5. 67 archivos markdown guardan UTF-8 BOM al inicio. Visibles como glifo ï»¿ en algunos visores y shells, y causan falsos positivos en regex sobre el primer carÃ¡cter (lo observamos al extraer H1 de los README de fase). Ejemplos: `AGENTS.md`, casi todos los archivos en `docs/fase-*` y `docs/transversal/`, `releases/v10.0.0.md`â€“`v10.2.0.md` (pero no `v10.3.0.md` ni `v10.4.0.md`), `specs/001-bandeja-trabajo-expedientes/spec-funcional.md`.
6. Mezcla espaÃ±ol/inglÃ©s en un runbook operativo. `ops/fase-7-deploy/runbook.md` usa un encabezado "Preconditions" en medio de un documento en espaÃ±ol. DeberÃ­a ser "Precondiciones" para alinearse con el resto del runbook y con `plantillas/fase-7-deploy/runbook.md`.

### Alta â€” contenido
7. `releases/v10.2.0.md:19` afirma "cierre de la auditoria final de trazabilidad sin hallazgos altos", pero el release posterior `v10.3.0.md` introduce cambios y correcciones de navegabilidad y consistencia significativos (nav-guided, READMEs, `likec4/README.md` nuevo, plantillas completadas). Se recomienda matizar la frase de `v10.2.0` o reubicar el cierre como "cierre por iteraciÃ³n" para que no suene contradictorio con lo que viene despuÃ©s.
8. `AGENTS.md` no obliga a leer `docs/transversal/90.12-mapa-ia-por-fase.md`. SÃ­ lo hace `docs/transversal/90.00-estandar-ia.md` y el resto del ecosistema IA. PequeÃ±o desajuste en la "lectura obligatoria" para un agente que aterriza por primera vez.
9. Ejemplo SDD incompleto en `docs/fase-4-sdd/README.md`. La secciÃ³n "Rutas relacionadas" enlaza `specs/000-ejemplo-feature/spec-funcional.md` y `specs/000-ejemplo-feature/spec-tecnica.md`, pero omite `specs/000-ejemplo-feature/spec-tareas.md`. El archivo existe y forma parte del trÃ­o canÃ³nico de SDD definido en `docs/fase-4-sdd/04.00-spec-driven-development.md:66-68` ("artefactos obligatorios"). Incoherencia entre lo que el estÃ¡ndar declara obligatorio y lo que la fase anuncia como referencia.
10. `specs/README.md:25-27` solo enlaza `spec-funcional.md` por feature canÃ³nica. Para mantener la autoconsistencia con "contenido mÃ­nimo por feature: `spec-funcional.md`, `spec-tecnica.md`, `spec-tareas.md`" conviene exponer los tres archivos, o al menos la carpeta de la feature.
11. Feature `001-bandeja-trabajo-expedientes` visible pero sin artefacto backend por capa. Los README en `src/backend/application/expedientes/`, `src/backend/domain/expedientes/`, `src/backend/infrastructure/expedientes/` y `src/backend/interfaces/expedientes/` titulan la feature como `001-bandeja-trabajo-expedientes`, pero solo contienen archivos `002-...md` y `003-...md`. Probablemente es por diseÃ±o (la bandeja es principalmente frontend y solo consulta casos existentes), pero hoy no se documenta. AÃ±adir una lÃ­nea en cada README del estilo "La feature 001 se cubre desde `interfaces/` como lectura sobre modelo existente; no requiere archivo por capa propio" cerrarÃ­a la duda.
12. Referencia abreviada imprecisa en la trazabilidad canÃ³nica. `docs/fase-0-iniciacion/00.06-ruta-guiada-caso-canonico.md:59` escribe "`src/backend/expedientes`" como ruta de ConstrucciÃ³n, pero la estructura real se divide en `src/backend/{domain|application|interfaces|infrastructure}/expedientes/`. El lector puede buscar una carpeta que no existe.
13. `docs/fase-5-construccion/05.00-plantilla-proyecto-base.md:43` dice "`tests/unit/` e `tests/integration/`". La conjunciÃ³n correcta delante de una "i" Ã¡tona en un backtick cerrado es "y" (la regla de "e" aplica al sonido /i/ inicial, pero aquÃ­ va entre comillas / backticks y se lee como "tests"). No es crÃ­tico, pero choca.

### Media â€” navegabilidad
14. Cierre del recorrido guiado poco formal. `docs/transversal/90.12-mapa-ia-por-fase.md` usa "Siguiente: Fin del recorrido guiado" como texto plano y luego aÃ±ade una lÃ­nea suelta con los enlaces de retorno en prosa. No se tipa como entrada de navegaciÃ³n del resto del recorrido. Una alternativa consistente: mantener la lÃ­nea "Siguiente: [Volver al Ã­ndice](../README.md)" o similar, para que el bloque `nav-guided` siempre contenga enlaces navegables.
15. `docs/fase-6-qa/README.md:19` incluye una "Regla de extensiÃ³n" explicando por quÃ© el nav-guided de la fase 6 salta directo a la fase 7. Es Ãºtil, pero es la Ãºnica fase con esa nota aunque la casuÃ­stica aplica igual a fase 2, 5 y 7 (que tambiÃ©n tienen un solo documento en la fase). O se formaliza la regla en `docs/transversal/README.md` / `90.07-convenciones-y-naming.md`, o se replica la nota en las otras fases para dejar de ser excepciÃ³n local.
16. Rutas por rol en `docs/README.md` incompletas:
    - Product Owner no incluye la ruta guiada del caso canÃ³nico ni la fase 2 (UX/UI), aunque el PO participa activamente en ambas segÃºn la matriz de roles de `docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md`.
    - Tech Lead no incluye `specs/README.md` ni `docs/fase-3-arquitectura/adr/README.md`, pese a que la fase 3 los liga directamente.
    - QA no incluye `qa/README.md` (el baseline vivo), solo las fases docs.
    - DevOps no incluye `ci/README.md` ni `ops/README.md` aunque ambos son claramente su home.
17. `ai/README.md` y los demÃ¡s README fuera de `docs/` no tienen breadcrumb de retorno. Es una decisiÃ³n aceptable (la ruta guiada no pasa por ahÃ­), pero en la prÃ¡ctica el lector que aterriza en `ai/ejemplos/README.md` desde un enlace cruzado no tiene un "volver al Ã­ndice" visible. Un breadcrumb simple ("[README principal](../../README.md) | [Indice docs](../../docs/README.md)") resolverÃ­a la orientaciÃ³n sin romper la filosofÃ­a.

### Media â€” contenido (oportunidades)
18. Falta ayuda para agentes sobre cÃ³mo interactuar con `likec4/`. `ai/README.md` lo menciona como parte del ecosistema, y `docs/fase-3-arquitectura/03.02-diagramas-c4-likec4.md` lo cubre, pero no hay un prompt o skill especÃ­fico para "actualizar likec4 desde un cambio de arquitectura". El prompt `ai/prompts/generar-c4.md` podrÃ­a cerrar ese hueco o al menos cruzarse explÃ­citamente con `likec4/README.md`.
19. No hay `CONTRIBUTING.md` ni guÃ­a mÃ­nima para mantenedores. Dada la cantidad de convenciones (fases, nomenclatura de features, nav-guided, artefactos por fase), un documento corto con las reglas de ediciÃ³n evitarÃ­a que futuras ediciones reintroduzcan los hallazgos 3, 4, 5 y 6.
20. No hay script de verificaciÃ³n. Comprobar enlaces, BOM y consistencia de nomenclatura cada release ahorrarÃ­a este tipo de auditorÃ­a manual.

### Baja â€” detalles
21. `docs/fase-4-sdd/README.md:16` explica por quÃ© la entrada a la fase 4 viene desde `adr/README.md`. El patrÃ³n se repite en otras fases pero sin nota. Si se considera una excepciÃ³n, se mantiene; si no, se puede borrar.
22. `docs/fase-0-iniciacion/00.00-guia-de-uso.md:43` usa el placeholder `ADR-XXX-nombre-corto.md` y `plantillas/fase-3-arquitectura/adr.md` no define un prefijo numÃ©rico explÃ­cito. `docs/fase-3-arquitectura/adr/README.md:15` usa `ADR-001-nombre-corto.md`. Conviene elegir uno (`XXX` o `001`) para no sembrar duda.
23. `releases/v10.1.0.md` usa la forma abreviada `specs/001`, `specs/002`, `specs/003`. El resto del repo usa el slug completo (`001-bandeja-trabajo-expedientes/`, etc.). Es solo estilo, pero incongruente.
24. `docs/transversal/90.07-convenciones-y-naming.md` cubre convenciones generales pero no fija la regla de acentuaciÃ³n ni la prohibiciÃ³n de BOM â€” precisamente los dos ejes donde hoy se rompe consistencia.

## QuÃ© estÃ¡ bien (para no perderlo al corregir)
- La cadena `nav-guided` recorre 45 documentos de `docs/` y cierra sin saltos rotos.
- 0 enlaces markdown rotos y 0 anclas internas rotas.
- El caso canÃ³nico (HU-02, HU-03, HU-04 â†” features 001, 002, 003) estÃ¡ trazado de extremo a extremo: vision â†’ requerimientos â†’ UX â†’ arquitectura â†’ specs â†’ src/tests â†’ qa â†’ ops â†’ IA.
- `plantillas/` y `ejemplos/` mantienen simetrÃ­a por fase, con fases 2 y 5 explÃ­citamente ausentes por diseÃ±o y documentadas en `plantillas/README.md`.
- Los READMEs raÃ­z de `ci/`, `qa/`, `ops/`, `src/`, `tests/`, `specs/`, `likec4/`, `diagramas/`, `escenarios/`, `stacks/` y `estimacion/` estÃ¡n al dÃ­a y cumplen su rol de puerta de entrada.

## Recomendaciones priorizadas

### Acciones rÃ¡pidas (â‰¤ 1 h, bajo riesgo)
1. Actualizar `README.md:1` a `# Project Template v10.4` (o a la convenciÃ³n `v10.4.0`, coherente con `releases/`).
2. AÃ±adir `v10.3.0` y `v10.4.0` a `releases/README.md`.
3. Corregir `docs/fase-4-sdd/README.md` para incluir `specs/000-ejemplo-feature/spec-tareas.md` en las rutas relacionadas.
4. Sustituir "Preconditions" por "Precondiciones" en `ops/fase-7-deploy/runbook.md`.
5. Reemplazar `src/backend/expedientes` por la forma real (`src/backend/{application,domain,interfaces,infrastructure}/expedientes/`) en `docs/fase-0-iniciacion/00.06-ruta-guiada-caso-canonico.md:59`.
6. Cambiar "`tests/unit/` e `tests/integration/`" por "`tests/unit/` y `tests/integration/`" en `docs/fase-5-construccion/05.00-plantilla-proyecto-base.md`.
7. Formalizar el cierre del recorrido guiado con un enlace, p. ej. "Siguiente: [Volver al Ã­ndice](../README.md)" en `docs/transversal/90.12-mapa-ia-por-fase.md`.

### Acciones de consistencia (Â½â€“1 dÃ­a, ediciones masivas)
8. Decidir una sola polÃ­tica de acentuaciÃ³n (recomendado: ASCII sin acentos en tÃ­tulos, rutas y breadcrumbs â€” donde ya domina â€” y acentos naturales dentro del cuerpo en espaÃ±ol). Dejarla escrita en `docs/transversal/90.07-convenciones-y-naming.md` como secciÃ³n nueva.
9. Una vez fijada la regla, normalizar en bloque: H1 de las fases, breadcrumb "Indice docs" y nav-guided labels.
10. Quitar el UTF-8 BOM de los 67 archivos afectados (un solo comando que reescriba sin BOM; es una ediciÃ³n sin cambios semÃ¡nticos). AÃ±adir nota en `90.07-convenciones-y-naming.md` prohibiendo el BOM.

### Acciones de contenido (1â€“2 dÃ­as)
11. AÃ±adir aclaraciÃ³n en los cuatro `src/backend/*/expedientes/README.md` sobre la ausencia intencional de archivo `001-*.md` y redirigir a `src/frontend/modules/bandeja-expedientes/README.md`.
12. Enriquecer las "Rutas por rol" de `docs/README.md`: PO â†’ aÃ±adir fase 2 y ruta guiada; Tech Lead â†’ aÃ±adir `adr/` y `specs/`; QA â†’ aÃ±adir `qa/`; DevOps â†’ aÃ±adir `ci/` y `ops/`.
13. AÃ±adir en `AGENTS.md` la lectura obligatoria de `docs/transversal/90.12-mapa-ia-por-fase.md` cuando el trabajo involucra IA.
14. AÃ±adir breadcrumbs simples ("README principal | Indice docs") a los README de `ai/`, `specs/`, `src/`, `tests/`, `qa/`, `ops/`, `plantillas/`, `ejemplos/`, `escenarios/`, `stacks/`, `estimacion/`, `likec4/`, `diagramas/`, `ci/`, `releases/`.

### Inversiones mÃ¡s grandes (si el equipo lo valora)
15. `CONTRIBUTING.md` con las reglas de ediciÃ³n (convenciones, BOM, nav-guided, rutas canÃ³nicas), enlazado desde el README principal.
16. Script de validaciÃ³n (por ejemplo en `ci/` o `.github/workflows/`) que verifique enlaces, anclas, BOM, nombres de fase y sincronizaciÃ³n `CHANGELOG` â†” `releases/` â†” `README.md`. Puede ser una ejecuciÃ³n manual al cerrar cada release.
17. "Primera lectura en 10 minutos": bloque en `README.md` que encadene visiÃ³n â†’ ruta guiada del caso canÃ³nico â†’ mapa IA por fase, con un Ãºnico recorrido mÃ­nimo para un lector nuevo.

## CÃ³mo verificar despuÃ©s de aplicar cambios
- Reejecutar la extracciÃ³n de enlaces y anclas: deben seguir en 0.
- Reextraer la cadena `nav-guided`: las parejas Anterior/Siguiente deben cerrar de punta a punta desde `README.md` hasta `docs/transversal/90.12-mapa-ia-por-fase.md`.
- Revisar con `grep` combinado las variantes `Indice|Ãndice`, `Operacion|OperaciÃ³n`, `Analisis|AnÃ¡lisis`, `Construccion|ConstrucciÃ³n`, `Estimacion|EstimaciÃ³n` y confirmar una sola forma.
- Revisar los tres primeros bytes de cada `.md` para asegurar que ninguno empieza con `EF BB BF` (BOM).
- Diffear `releases/README.md` contra `ls releases/*.md` y el encabezado de `README.md` contra la Ãºltima entrada del `CHANGELOG.md`.
- Ejecutar `node ci/scripts/check-docs.mjs` (disponible desde v10.5.0) como verificaciÃ³n integrada de los puntos anteriores.

## Resultado de las correcciones (v10.5.0)
- Todos los hallazgos listados arriba fueron atendidos en la release `v10.5.0`.
- Detalle consolidado en [`releases/v10.5.0.md`](../releases/v10.5.0.md) y en la entrada `v10.5.0` del [`CHANGELOG.md`](../CHANGELOG.md).
- Resumen de verificaciÃ³n:
  - `node ci/scripts/check-docs.mjs` finaliza con `OK` sobre `259` archivos markdown.
  - Recorrido `nav-guided` desde `README.md` recorre `46` nodos y cierra en `docs/README.md` sin rupturas.
  - 0 archivos markdown con `UTF-8 BOM`.
  - 0 enlaces markdown rotos y 0 anclas rotas.

