# Decisiones UX - Wakaya Home Content Management

[README principal](../../../README.md) | [Specs](../../README.md)

## Golden de referencia
- Wakaya backoffice shell actual
- `004-bungalow-backoffice-media` como referencia de densidad operativa
- Home publico localizado actual como referencia de secciones reales

## Dominio del spec: editor de backoffice para administrar el home publico bilingue de Wakaya sin romper la logica del sitio.

## Actor principal: editor de contenido con permiso `content:write`.

## Tarea principal navegable: editar slider y secciones del home, validar el resultado en preview local y publicar o restaurar una revision desde la misma pantalla.

## Patron visual elegido: workspace operativo de tres zonas con rail de estructura, editor focal y preview con revisiones. La barra sticky concentra estado, version y accion principal.

## Justificacion de no-shell-generica: la feature necesita estructura del home, localizacion ES/EN y estados de publicacion visibles al mismo tiempo. Un shell CRUD generico no permite ver orden, visibilidad y preview sin saltar entre tabs o modales.

## Interacciones mock obligatorias: seleccionar slide o seccion, cambiar idioma ES/EN, cambiar preview desktop/mobile, mover elementos arriba/abajo, ocultar o mostrar bloque, simular loading, validacion, success y conflicto 409, restaurar una revision.

## Direccion visual
- Superficie administrativa clara, no marketing.
- Jerarquia por estado, estructura y siguiente accion.
- Tres zonas legibles en desktop: estructura, editor y preview/revisiones.
- En mobile se preserva una sola columna con CTA principal sticky.

## Anti-patrones evitados
- canvas tipo CMS
- panel infinito de inputs sin estructura
- texto ornamental para explicar lo obvio
- preview mezclada con campos de forma que parezca editor libre

## Contrato del prototipo
- Estados: success, error
- Roles: Editor de contenido, Administrador, Operador sin permiso, Visitante
- Entidades: home, slide, seccion, revision
- RF representados: RF-HOME-01, RF-HOME-02, RF-HOME-03, RF-HOME-04, RF-HOME-05, RF-HOME-06, RF-HOME-07, RF-HOME-08, RF-HOME-09
