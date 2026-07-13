# Decisiones UX - Wakaya Bungalow Backoffice Media

[README principal](../../../README.md) | [Specs](../../README.md)

## Dominio del spec: backoffice operativo y editorial de bungalows, media pública y reservas Wakaya.

## Actor principal: administrador con permiso para editar operación y media del bungalow.

## Tarea principal navegable: alternar entre Operacion, Ficha web y Textos web; reemplazar media, revisar sus estados y guardar sin mezclar responsabilidades.

## Patrón visual elegido: editor por superficies con cabecera sticky, tabs de intención, panel focal y resumen contextual persistente.

## Justificación de no-shell-genérica: un formulario largo reproduce la estructura del payload y mezcla inventario, publicación y traducción. Las tres superficies mantienen el contexto del bungalow pero reducen lectura lateral, scroll y errores de edición.

## Interacciones mock obligatorias: cambiar tabs, simular loading de procesamiento, mostrar empty sin portada, mostrar error de archivo inválido, confirmar success, emitir toast notify y alternar ES/EN.

## Dirección visual

- Workbench administrativo compacto con ritmo de 8 px y jerarquía por tarea.
- Una única acción primaria `Guardar cambios` en la cabecera.
- Portada y galería se reconocen primero por preview, no por URL.
- El resumen lateral permanece estable para evitar pérdida de contexto.
- En móvil, tabs y acciones se apilan sin cambiar el orden de lectura.

## Estados y seguridad operativa

- `loading`: conserva la imagen anterior mientras genera variantes.
- `empty`: ofrece una siguiente acción directa, sin mostrar campos técnicos.
- `error`: explica formato permitido y no muta la media publicada.
- `success`: confirma que hero, card y thumb están listos.
- El modo manual de URLs se mantiene colapsado y fuera del recorrido principal.

## Contrato del prototipo

- Roles: Admin, Sistema, administrador, recepción, editor de contenido
- Entidades: bungalow, portada, galería, activo de galería, contenido localizado
- Estados: loading, empty, error, success, toast, notify
- RF representados: RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08, RF-09, RF-10, RNF-01, RNF-02, RNF-03, RNF-04, RNF-05
