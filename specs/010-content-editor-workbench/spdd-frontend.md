# SPDD Frontend - Wakaya Content Editor Workbench

## Jerarquía

1. Breadcrumb y nombre del módulo.
2. Estado, última actualización y `Guardar y publicar`.
3. Lista izquierda de secciones/items.
4. Formulario del único elemento seleccionado.
5. Preview e historial bajo demanda.

## Patrón de formulario

- `ES | EN` visible.
- `Contenido` abierto.
- `Imagen` abierta cuando aplica.
- visibilidad y orden accesibles sin detalles técnicos.
- `Opciones avanzadas` plegadas por defecto.

## Responsive

- Desktop: 240-280 px de lista y editor flexible.
- Tablet/mobile: lista plegable arriba, editor debajo y CTA alcanzable.
- Drawers de preview/historial ocupan el ancho disponible sin generar una
  tercera columna comprimida.

## Estados

Publicado, cambios sin publicar, guardando, validación, conflicto de versión,
sin elementos, permiso denegado, carga de media y error recuperable.

## Accesibilidad

Botones con nombre explícito, `aria-expanded` para paneles, foco devuelto al
disparador al cerrar, feedback anunciado y orden de tabulación predecible.
