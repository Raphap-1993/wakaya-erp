# Flujo - Wakaya Bungalow Backoffice Media

[README principal](../../../README.md) | [Specs](../../README.md)

## Recorrido principal

1. El administrador abre la edición de `Bungalow Doble` y aterriza en `Operación`.
2. Revisa código, capacidad y estado sin depender del contenido editorial.
3. Cambia a `Ficha web` para revisar portada y galería como activos visuales.
4. Reemplaza una imagen; el gestor muestra el estado loading mientras procesa.
5. Si el archivo es inválido, el gestor conserva la media publicada y muestra el error.
6. Si el procesamiento termina, muestra success y una notificación toast.
7. Cambia a `Textos web`, revisa ES y detecta el empty de contenido EN.
8. Guarda los cambios desde la única acción principal de la cabecera.

## Estados cubiertos

- loading durante la optimización de una imagen
- empty cuando no hay portada o el idioma EN no tiene descripción
- error cuando la imagen no cumple formato o tamaño
- success cuando las variantes WebP están listas
- toast de confirmación después de guardar o completar una carga

## Salidas esperadas

- Operación, ficha pública y textos quedan separados por intención.
- El cambio de tab conserva una cabecera y un resumen comunes.
- La media publicada no se reemplaza si el procesamiento falla.
- El administrador recibe feedback visible y accionable en cada estado.
