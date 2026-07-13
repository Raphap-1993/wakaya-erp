# Flujo - Wakaya Public Content Hub

[README principal](../../../README.md) | [Specs](../../README.md)

## Recorrido editorial principal
1. Editor abre `/admin/content` y revisa estado, versión y última publicación.
2. Cambia entre Home, Experiencias, Galería y Bungalows.
3. Selecciona una entidad o agrega una experiencia.
4. Completa ES/EN sobre la misma estructura.
5. Selecciona media y completa recortes Desktop y Mobile.
6. Revisa preview y validación.
7. Guarda o publica con versión esperada.
8. Ante conflicto `409`, recarga la versión vigente sin mezclar cambios.

## Recorrido público de experiencia
1. Visitante abre una card en `/es/services`.
2. La URL agrega `?experience=<slug>` y abre el popup.
3. Cierra con botón o Escape, o usa back/forward.
4. `Consultar experiencia` abre `/es/contact?experience=<slug>#booking-request`.
5. El formulario muestra la experiencia seleccionada y la booking request conserva su ID.

## Estados cubiertos
- loading y procesamiento de media;
- empty de lista o idioma;
- error de validación, crop incompleto o resolución insuficiente;
- success de guardado/publicación;
- conflicto de versión `409`;
- acceso de solo lectura `403`;
- slug público inexistente.

## Salidas esperadas
- documento publicado con versión incrementada;
- activos `ready` con variantes requeridas;
- experiencia compartible por URL y trazable hasta el detalle operativo.
