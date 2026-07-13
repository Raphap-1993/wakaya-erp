# SPDD Frontend - Wakaya Home Content Management

[README principal](../../README.md) | [Specs](../README.md)

## Objetivo
Cerrar la experiencia visual y operativa del editor `/admin/home` antes de
tocar implementacion productiva. El prototipo debe demostrar que el home
editable se entiende rapido, publica sin ambiguedad y no invade la logica de la
web publica.

## Estructura propuesta

### Barra sticky de publicacion
- breadcrumb `Contenido del home`
- estado `Publicado`
- version actual
- ultimo publish con usuario y fecha
- CTA secundaria `Ver home`
- CTA principal `Guardar y publicar`
- accesos de prueba para `Validacion`, `Conflicto 409` y `Restaurar`

### Rail de estructura
- bloque `Slider principal`
- lista de slides con orden, visible/oculto y estado de completitud
- lista de secciones del home
- controles mover arriba/abajo
- toggle visible/oculto
- seleccion del bloque activo sin salir del contexto

### Editor del bloque seleccionado
- tabs `ES` / `EN`
- grupo `Contenido`
- grupo `CTA`
- grupo `Presentacion`
- grupo `Media`
- labels cortos, estado inmediato y ayuda puntual

### Preview local
- toggle `Desktop` / `Mobile`
- preview del bloque editado dentro de la composicion del home
- nunca publica por si sola

### Panel de revisiones
- ultima version publicada
- lista corta de revisiones recientes
- accion `Restaurar version`
- mensaje de recuperacion ante conflicto o rollback

## Desktop
- layout de tres zonas: rail, editor, preview/revisiones
- la barra de publicacion queda sticky arriba
- el rail mantiene orden y visibilidad visibles siempre
- el editor ocupa el foco principal

## Tablet
- rail compacto arriba o a la izquierda segun ancho
- preview debajo del editor
- revisiones en card separada
- tabs de idioma y preview siguen visibles sin saturar

## Mobile
- la barra sticky se simplifica a estado, version y CTA principal
- rail se vuelve lista vertical plegable
- editor y preview pasan a una sola columna
- los toggles de idioma y preview quedan como segmented control
- no se mantiene una tercera columna comprimida

## Principios UX
- `status-first`: el operador ve si esta editando publicado, borrador local o
  conflicto antes de tocar campos.
- `structure-first`: slider y secciones se entienden como mapa del home.
- `bilingual-without-fork`: ES/EN cambia el contenido, no la estructura.
- `safe-presentation`: tipografia, destinos y autoplay usan presets y solo
  admiten ajuste fino dentro de rangos seguros
  controlados.
- `preview-without-cms`: preview realista sin convertir la pantalla en canvas.

## Componentes a mapear
- `admin-shell` actual para navegacion general
- `sticky publication bar`
- `structure rail`
- `section status row`
- `slider item manager`
- `localized copy form`
- `safe cta destination control`
- `typography segmented control`
- `preview frame`
- `revision restore panel`

## Estados que debe cubrir el prototipo
- version publicada sin cambios locales
- bloque oculto pero valido
- seccion con copy EN incompleto
- error de validacion por CTA o slide invisible
- exito de publicacion
- conflicto `409 home_content_version_conflict`
- restore de revision reciente
- preview mobile activo

## Criterio de aceptacion SPDD
- La pantalla se entiende por estructura, no por lista plana de campos.
- ES/EN se puede editar sin duplicar paneles o mezclar orden con texto.
- El preview ayuda a publicar mejor sin parecer un page builder.
- Los estados de validacion, exito y conflicto son visibles y accionables.
- Slider y secciones comparten un lenguaje operacional coherente.

## Estado del gate
- `gate-prototype-ready`: pendiente hasta revisar `prototype-html5/index.html`.
- `gate-spdd-approved`: pendiente hasta validacion humana del prototipo.
