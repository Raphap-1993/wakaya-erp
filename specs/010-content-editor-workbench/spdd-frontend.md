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

En validación, el resumen enumera todas las incidencias con el patrón
`Bloque · Idioma · Campo`, una acción `Ir al campo` y salto automático al
primer error. La fila afectada muestra `Revisar · N campos`.

## Accesibilidad

Botones con nombre explícito, `aria-expanded` para paneles, foco devuelto al
disparador al cerrar, feedback anunciado y orden de tabulación predecible.
El campo elegido recibe foco programático solo después de publicar con errores
o usar `Ir al campo`, además de `aria-invalid` y asociación con su mensaje.
