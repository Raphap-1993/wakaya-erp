# UI Test Cases - Wakaya Content Editor Workbench

## UI-010-01 - Entrada

Sin `tab`, el editor ve cinco módulos y una acción directa por módulo.

## UI-010-02 - Deep link

Un link `?tab=experiences` abre directamente Experiencias.

## UI-010-03 - Home

El usuario selecciona una sección y solo edita ese bloque.

## UI-010-04 - Avanzado

Tipografía exacta y slug están plegados inicialmente.

## UI-010-05 - Preview

No ocupa una columna; se abre y cierra bajo demanda.

## UI-010-06 - Idiomas

ES/EN cambia copy y conserva media, orden y visibilidad.

## UI-010-07 - Configuración web

Menú y estilo global aparecen solo al seleccionar `Configuración web`.

## UI-010-08 - Mobile

A 390 px no hay scroll horizontal y la acción principal sigue alcanzable.

## UI-010-09 - Publicación inválida

Al publicar con varios errores, no se envía la mutación. El resumen muestra
bloque, idioma y campo para cada incidencia; el primer campo se abre y enfoca.

## UI-010-10 - Navegación de errores

Cada `Ir al campo` selecciona el bloque, activa el idioma, abre opciones
avanzadas cuando corresponde y marca el control con `aria-invalid`.
