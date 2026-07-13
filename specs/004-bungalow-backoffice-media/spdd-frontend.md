# SPDD Frontend - Wakaya Bungalow Backoffice Media

[README principal](../../README.md) | [Specs](../README.md)

## Objetivo
Cerrar la experiencia visual y operativa del editor de bungalows antes de tocar
la implementación productiva del formulario y del pipeline de imágenes.

## Estructura propuesta

### Cabecera sticky
- `Bungalow: <nombre>`
- chip de estado
- chip de visibilidad pública
- CTA `Guardar`
- CTA secundaria `Cancelar`
- link `Ver ficha pública`

### Tabs de trabajo
- `Operacion`
- `Ficha web`
- `Textos web`

### Tab Operacion
- código interno
- nombre base del bungalow
- capacidad
- estado activo para asignación

### Tab Ficha web
- bloque `Portada web` con preview grande
- bloque `Galería` con miniaturas, orden y acciones por imagen
- visibilidad
- orden en listado web
- tarifa referencial
- área
- modo avanzado: `Editar URLs manualmente`

### Tab Textos web
- switch ES/EN
- badge de completitud por idioma
- nombre comercial
- antetítulo
- descripción corta
- frase destacada
- descripción larga
- puntos destacados
- comodidades
- incluye

## Principios UX
- `surface-first`: organizar por tarea, no por payload.
- `status-first`: estado y siguiente acción visibles arriba.
- `media-is-visual`: las imágenes se editan con previews y controles de
  reemplazo.
- `progressive disclosure`: datos técnicos y modo manual quedan colapsados.
- `operator-safe`: cambios simples de operación no dependen de completar copy.

## Estados que debe cubrir el prototipo
- bungalow activo con portada y galería pobladas
- bungalow sin portada cargada
- error de subida de imagen inválida
- tab de textos con idioma incompleto
- modo móvil con tabs apilados

## Componentes a mapear
- `admin-shell` actual para navegación general
- card system existente de `reservations.module.css`
- nuevo bloque `media-manager`
- nuevo `segmented tabs`
- nuevo badge de completitud por idioma

## Criterio de aceptación SPDD
- La reorganización debe reducir scroll y lectura lateral.
- La cabecera no debe repetir acciones en tres lugares.
- La zona de imágenes debe mostrar claramente portada, galería y acciones por
  imagen.
- El operador debe entender qué está editando sin leer texto largo.
- El prototipo HTML5 debe cubrir desktop y móvil.

## Estado del gate
- `gate-prototype-ready`: pendiente hasta revisar `prototype-html5/index.html`.
- `gate-spdd-approved`: pendiente hasta validación humana del flujo propuesto.
