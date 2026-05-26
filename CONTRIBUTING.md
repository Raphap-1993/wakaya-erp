# CONTRIBUTING

[README principal](README.md) | [Indice docs](docs/README.md)

Esta guia reune las reglas practicas para editar este repositorio sin romper su consistencia, navegabilidad ni trazabilidad.

## Contenido
- [Principios](#principios)
- [Antes de editar](#antes-de-editar)
- [Convenciones de escritura](#convenciones-de-escritura)
- [Breadcrumbs y nav-guided](#breadcrumbs-y-nav-guided)
- [Enlaces y rutas canonicas](#enlaces-y-rutas-canonicas)
- [Agregar o actualizar una fase](#agregar-o-actualizar-una-fase)
- [Agregar o actualizar una feature (SDD)](#agregar-o-actualizar-una-feature-sdd)
- [Agregar una release](#agregar-una-release)
- [Codificacion y formato de archivos](#codificacion-y-formato-de-archivos)
- [Verificacion antes de integrar](#verificacion-antes-de-integrar)
- [IA aplicada al repositorio](#ia-aplicada-al-repositorio)

<a id="principios"></a>
## Principios
- La documentacion es el producto: cada cambio en el repositorio debe dejar el documento legible, navegable y trazable.
- Un solo estandar: no se admiten nomenclaturas paralelas para fases, roles, features o artefactos.
- Sin artefactos huerfanos: cualquier salida (markdown, codigo, evidencia) debe terminar en una ruta canonica del repositorio.
- Pragmatismo: si un cambio aporta claridad, pequeno y con bajo riesgo es mejor que grande y perfecto.

<a id="antes-de-editar"></a>
## Antes de editar
1. Lee `AGENTS.md` y el bloque "Primera lectura en 10 minutos" del `README.md`.
2. Revisa `docs/fase-0-iniciacion/00.00-guia-de-uso.md` para entender el flujo general.
3. Revisa `docs/transversal/90.07-convenciones-y-naming.md` y esta guia.
4. Si el cambio afecta arquitectura o tecnologia, prepara o actualiza un `ADR` en `docs/fase-3-arquitectura/adr/`.

<a id="convenciones-de-escritura"></a>
## Convenciones de escritura
- Estilo directo, en tercera persona, sin marketing ni adjetivos vacios.
- Usa la forma ASCII en titulos, encabezados (H1, H2), breadcrumbs y etiquetas `nav-guided`. Ejemplos correctos: `Indice docs`, `Analisis`, `Operacion`, `Construccion`, `Adopcion`, `Produccion`, `Estimacion`.
- En prosa de cuerpo se admiten acentos cuando aportan claridad, siempre que el termino principal aparezca escrito igual en el resto del documento y en el indice.
- No mezcles la forma con y sin acentos del mismo termino dentro del mismo documento.
- Nombres de features: `NNN-nombre-feature` (tres digitos, minusculas, guiones). No abrevies a `001`, `002`, `003` fuera de tablas.
- Cuando nombres `Spec-Driven Development`, usa la forma completa `Spec-Driven Development (SDD)` en primera aparicion, luego `SDD`.

<a id="breadcrumbs-y-nav-guided"></a>
## Breadcrumbs y nav-guided
- Todo documento bajo `docs/` debe tener:
  - `# Titulo` en linea 1.
  - Breadcrumb en linea 3 con enlaces a README principal, Indice docs y, si corresponde, Volver a la fase.
  - Bloque `<!-- nav-guided:start -->`/`<!-- nav-guided:end -->` con `Anterior` y `Siguiente` como enlaces markdown navegables, nunca texto plano.
- Los README raiz fuera de `docs/` deben tener al menos una fila de breadcrumbs hacia el README principal y hacia el indice de documentacion en la segunda linea.
- Recorrido `nav-guided`:
  - Si una fase tiene varios documentos, el recorrido pasa por todos antes de saltar a la siguiente fase.
  - Si una fase tiene un solo documento, el `Siguiente` puede saltar al README de la fase siguiente.
  - Si agregas un documento nuevo a una fase, extiende el `nav-guided` dentro de la misma fase antes de saltar a la siguiente.
- El documento final del recorrido debe cerrar el ciclo enlazando al indice (`docs/README.md`) o al `README principal`.

<a id="enlaces-y-rutas-canonicas"></a>
## Enlaces y rutas canonicas
- Usa enlaces relativos. No hardcodees URLs absolutas del repo.
- No crees rutas nuevas para artefactos que ya tienen ubicacion canonica en `docs/transversal/90.10-entregables-minimos-por-fase.md`.
- Cuando un documento referencie codigo, pruebas o evidencia, usa la ruta real (`src/backend/{capa}/{dominio}/`, `tests/unit/`, `qa/fase-6-qa/`, `ops/fase-7-deploy/`, etc.), no abreviaturas.

<a id="agregar-o-actualizar-una-fase"></a>
## Agregar o actualizar una fase
1. Crea o ajusta el README de la fase en `docs/fase-N-<nombre>/README.md` con breadcrumb, nav-guided y objetivo.
2. Agrega los documentos `NN.00-...`, `NN.01-...`, etc., encadenados por `nav-guided`.
3. Actualiza `docs/README.md` si cambian los puntos de entrada por rol.
4. Si la fase introduce un nuevo entregable canonico, registra la ruta en `docs/transversal/90.10-entregables-minimos-por-fase.md` y el item en `docs/transversal/90.11-checklist-entregables.md`.

<a id="agregar-o-actualizar-una-feature-sdd"></a>
## Agregar o actualizar una feature (SDD)
1. Crea la carpeta `specs/NNN-nombre-feature/`.
2. Agrega los tres artefactos obligatorios: `spec-funcional.md`, `spec-tecnica.md`, `spec-tareas.md` usando `plantillas/fase-4-sdd/`.
3. Refleja el impacto en `src/backend/`, `src/frontend/` o `src/shared/` segun corresponda.
4. Agrega pruebas minimas en `tests/unit/`, `tests/integration/` o `tests/e2e/`.
5. Registra evidencia o casos de QA en `qa/fase-6-qa/` cuando la feature llegue a validacion.
6. Actualiza `specs/README.md` si la feature es una referencia canonica.

<a id="agregar-una-release"></a>
## Agregar una release
1. Crea `releases/vX.Y.Z.md` con resumen, cambios principales, snapshot y artefactos clave.
2. Agrega la entrada a `releases/README.md`.
3. Actualiza `CHANGELOG.md`.
4. Actualiza la version visible en `README.md:1`.

<a id="codificacion-y-formato-de-archivos"></a>
## Codificacion y formato de archivos
- Todos los archivos markdown deben guardarse como `UTF-8 sin BOM`.
- No se admite marca de orden de byte (`BOM`, bytes `EF BB BF`) al inicio.
- Prefiere finales de linea `LF`.
- Evita lineas en blanco multiples consecutivas.
- Evita espacios al final de linea.

<a id="verificacion-antes-de-integrar"></a>
## Verificacion antes de integrar
- Revisa que los enlaces markdown nuevos o modificados resuelvan a archivos existentes.
- Revisa que las anclas internas (`#...`) coincidan con los `<a id="..."></a>` del documento.
- Ejecuta el script de verificacion si esta disponible (`ci/scripts/check-docs.mjs`).
- Confirma que `nav-guided` sigue cerrando el ciclo: `README.md` -> `docs/README.md` -> fases -> `docs/transversal/` -> regreso al indice.
- Si el cambio toca IA, revisa `docs/transversal/90.12-mapa-ia-por-fase.md` para asegurar que la salida tenga ruta canonica.

<a id="ia-aplicada-al-repositorio"></a>
## IA aplicada al repositorio
- Cualquier salida producida con `agent`, `prompt` o `skill` debe terminar en una ruta canonica del repositorio.
- Una salida de IA nunca reemplaza un documento oficial; lo ayuda a producirse o actualizarse.
- Si la IA introduce un cambio arquitectonico, refleja la decision en `docs/fase-3-arquitectura/adr/` antes de cerrar el cambio.
