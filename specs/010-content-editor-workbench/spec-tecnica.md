# Spec técnica - Wakaya Content Editor Workbench

## Arquitectura

Refactor de presentación sobre stores y contratos existentes. No se agregan
tablas ni servicios de contenido.

## Estado UI

- `overview | home | company | experiences | gallery | bungalows`.
- selección de sección/item conservada en estado y query param donde ya existe.
- preview e historial controlados por paneles temporales accesibles.
- configuración del menú global seleccionable como nodo independiente.
- validación local derivada de `homeContentV2Schema`, con incidencias traducidas
  a nodo, idioma, grupo y control enfocable.
- resumen de validación reactivo al documento mientras permanezca visible.

## Compatibilidad

- `/admin/content?tab=...` sigue funcionando.
- `/admin/home` y redirects existentes se conservan.
- documentos `home-content`, `corporate-content` y `content` no cambian de
  schema en esta feature.
- APIs actuales de publicación permanecen iguales.
- `issues` del servidor se preservan como respaldo y no se reducen al código de
  error general.

## Estilos

CSS Module con layout de dos columnas. A 960 px pasa a una columna. Los paneles
temporales usan backdrop, foco y cierre explícito.
