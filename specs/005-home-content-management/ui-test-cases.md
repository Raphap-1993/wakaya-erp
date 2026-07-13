# UI Test Cases - Wakaya Home Content Management

[README principal](../../README.md) | [Specs](../README.md)

## Caso 1 - Cambiar idioma sin perder contexto
- Dado el editor en la seccion `Story`
- Cuando el operador cambia de `ES` a `EN`
- Entonces sigue editando la misma seccion y solo cambia el contenido localizado

## Caso 2 - Reordenar seccion visible
- Dado el rail del home
- Cuando el operador mueve `Experiences` una posicion arriba
- Entonces el orden visible cambia sin salir del bloque activo

## Caso 3 - Ocultar una seccion
- Dado el home con `Quote band` visible
- Cuando el operador la oculta
- Entonces la interfaz marca el bloque como `Oculto` y el preview deja de
  mostrarlo

## Caso 4 - Administrar slide bilingue
- Dado el slider principal
- Cuando el operador agrega un nuevo slide y completa ES/EN
- Entonces el slide aparece en el manager con orden, visibilidad y CTA

## Caso 5 - CTA insegura
- Dado un bloque con CTA editable
- Cuando el operador intenta guardar un destino `javascript:`
- Entonces recibe error de validacion y no publica

## Caso 6 - Tipografia segura
- Dado un titular del home
- Cuando el operador cambia de `Normal` a `Destacado`
- Entonces el preview actualiza el token tipografico sin exponer pixeles o CSS

## Caso 7 - Publicacion exitosa
- Dado un documento valido y sin conflicto
- Cuando el operador pulsa `Guardar y publicar`
- Entonces ve mensaje de exito, nueva version y fecha actualizada

## Caso 8 - Conflicto de version
- Dado que otro usuario publico primero
- Cuando el operador intenta guardar con `expectedVersion` desactualizada
- Entonces la UI muestra conflicto `409` y ofrece recargar o restaurar
