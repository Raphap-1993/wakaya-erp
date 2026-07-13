# UI Test Cases - Wakaya Bungalow Backoffice Media

[README principal](../../README.md) | [Specs](../README.md)

## Caso 1 - Cambio operativo rápido
- Dado un bungalow existente
- Cuando el admin entra al tab `Operación`
- Y cambia capacidad o estado
- Entonces puede guardar sin tocar textos ni media

## Caso 2 - Reemplazo de portada
- Dado un bungalow con portada existente
- Cuando el admin sube un JPG de 6 MB como nueva portada
- Entonces ve un preview actualizado
- Y el sistema guarda variantes WebP optimizadas

## Caso 3 - Alta de imagen de galería
- Dado un bungalow con galería poblada
- Cuando el admin agrega una nueva imagen
- Entonces la imagen aparece al final de la grilla con acciones visibles

## Caso 4 - Reordenamiento de galería
- Dado un bungalow con varias imágenes
- Cuando el admin reordena la galería
- Entonces el nuevo orden se conserva tras recargar

## Caso 5 - Idioma incompleto
- Dado el tab `Textos web`
- Cuando el contenido EN está incompleto
- Entonces la interfaz muestra ese estado sin bloquear el cambio operativo

## Caso 6 - Archivo inválido
- Dado el editor de media
- Cuando el admin intenta subir un PDF o una imagen mayor al límite
- Entonces recibe un error claro y el estado anterior no se pierde
