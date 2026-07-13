# Flujo - Wakaya Home Content Management

[README principal](../../../README.md) | [Specs](../../README.md)

## Recorrido principal
1. Editor abre `/admin/home`.
2. Revisa version publicada y ultima publicacion.
3. Selecciona un slide o una seccion del rail.
4. Cambia ES/EN segun el bloque activo.
5. Ajusta CTA, visibilidad, orden y tipografia segura.
6. Revisa preview desktop o mobile.
7. Valida y publica.
8. Si hay conflicto, recarga o restaura una revision.

## Estados cubiertos
- loading de preview
- empty / sin datos EN
- error de CTA insegura o conflicto 409
- success de publicacion y restore

## Salidas esperadas
- Home publicado con version incrementada
- Estructura consistente en ambos idiomas
- Revisiones disponibles para rollback
