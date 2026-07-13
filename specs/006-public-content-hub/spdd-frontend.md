# SPDD Frontend - Wakaya Public Content Hub

[Specs](../README.md) | [Feature](README.md)

## Objetivo
Definir la UI que debe validar un prototipo antes de construir `/admin/content` y el popup público.

## Estructura admin

### Cabecera
- breadcrumb `Contenido`;
- estado y última publicación;
- CTA contextual única: `Guardar`, `Publicar` o `Agregar`;
- link `Ver sitio`.

### Navegación interna
Tabs persistentes `Home`, `Experiencias`, `Galería`, `Bungalows`. En mobile se muestran como selector horizontal desplazable con label visible.

### Home
Reutiliza barra de publicación, rail, editor ES/EN, preview y revisiones aprobados por feature 005, dentro del nuevo shell.

### Experiencias
Lista primero: título, estado, orden, completitud ES/EN y acción `Editar`. Editor con datos base, tabs ES/EN, media card/hero y preview. Eliminar exige confirmación y explica el efecto público.

### Galería
Grid único con miniatura, estado, orden y alt ES/EN. Reordenamiento ofrece drag-and-drop y botones accesibles subir/bajar.

### Bungalows
Lista de cuatro tipos. El editor gestiona solo ficha pública; un enlace separado abre inventario de unidades.

## Crop dialog
- preview source;
- selector `Desktop 16:9` / `Mobile 4:5` para hero;
- `react-easy-crop` con zoom y posición;
- indicador de resolución suficiente;
- thumbnails de salida;
- CTA `Aplicar recortes` deshabilitada hasta completar ambos.

## Popup público
- controlado por query `experience`;
- dialog accesible con título, hero, duración, copy y CTA;
- cerrar por botón, Escape o backdrop seguro;
- conserva/restaura foco y no altera otros query params;
- CTA a `/{locale}/contact?experience=<slug>#booking-request`.

El formulario muestra la experiencia seleccionada como dato editable/removible antes de enviar. El detalle de booking request en backoffice muestra `Experiencia solicitada` con título, slug e ID; no depende de buscar texto dentro de notas.

## Estados
- loading/skeleton;
- vacío con CTA;
- error de validación;
- upload/procesamiento;
- crop incompleto o insuficiente;
- guardado exitoso;
- conflicto de versión;
- sin permiso;
- slug público inexistente.

## Responsive
- desktop: tabs + lista/editor en dos columnas cuando aplica;
- tablet: lista compacta y editor debajo;
- mobile: una columna, CTA principal sticky inferior solo durante edición; crop a pantalla completa.

## Accesibilidad
- tabs con roles y teclado;
- dialog con focus trap y `aria-labelledby`;
- reordenamiento no depende solo de arrastrar;
- errores asociados al campo;
- alt ES/EN obligatorio para media informativa.

## Gate
- `gate-prototype-ready`: **APROBADO**; cuatro tabs, crop dual, estados y popup en `prototype-html5/index.html`.
- `gate-spdd-approved`: **APROBADO** por el Product Owner mediante orden explícita del 2026-07-09, registrada en `prototype-validation.md`; no se afirma revisión de capturas posteriores.
