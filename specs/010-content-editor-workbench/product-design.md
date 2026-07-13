# Product Design - Wakaya Content Editor Workbench

## Problema

El centro actual expone navegación, formularios, estilos técnicos, preview y
revisiones al mismo tiempo. Editar un texto o una imagen exige interpretar una
pantalla diseñada alrededor del documento técnico y no de la tarea diaria.

## Trabajo del usuario

- Encontrar rápidamente la página o elemento que necesita cambiar.
- Editar un solo elemento sin perder su ubicación.
- Cambiar ES/EN sin duplicar estructura.
- Reemplazar media y publicar con una acción clara.
- Acceder a preview, historial o estilo fino solo cuando lo necesita.

## Decisión

Usar un CMS estructurado de dos niveles:

1. índice de módulos;
2. lista de elementos más editor seleccionado.

No se implementa canvas, drag-and-drop libre, edición inline ni CMS externo.

## Métricas

- Una edición común requiere: elegir módulo, elegir elemento, cambiar y publicar.
- Un solo CTA primario por editor.
- Cero campos técnicos visibles por defecto.
- Cero tercera columna permanente.
- ES/EN se mantiene dentro del mismo contexto.

## Superficies

- Home: slider, secciones y configuración web.
- Páginas: Nosotros, FAQ, Testimonios, Términos, Privacidad y Contacto.
- Experiencias: colección y ficha.
- Galería: colección de imágenes.
- Bungalows: cinco fichas públicas; cupos permanecen fuera del editor.
