# Product Design - Wakaya Bungalow Backoffice Media

[README principal](../../README.md) | [Specs](../README.md)

## Problema
La edición de bungalows en backoffice ya centraliza inventario y ficha pública,
pero la experiencia sigue organizada como payload técnico: demasiados bloques
con el mismo peso visual, demasiada repetición de acciones y una zona de
imágenes basada en URLs manuales en lugar de reemplazo operativo rápido.

Eso genera tres fricciones para el uso diario:

- cambiar datos operativos simples exige recorrer una pantalla larga;
- reemplazar portada y galería requiere manipular texto y no activos visuales;
- la web pública termina expuesta a imágenes pesadas o inconsistentes porque no
  existe optimización automática al subir archivos.

## Jobs to be Done
- Cuando administro bungalows desde backoffice, quiero editar operación,
  publicación web y textos sin mezclar tareas, para trabajar más rápido y con
  menos errores.
- Cuando reemplazo una portada o una imagen de galería, quiero verla, moverla y
  confirmarla sin tocar URLs manuales, para no romper la ficha pública.
- Cuando subo fotos grandes desde recepción o marketing, quiero que el sistema
  las optimice automáticamente para web, para mantener velocidad sin perder
  calidad perceptible.

## Hipótesis de valor
Si Wakaya separa el editor de bungalow por superficies de trabajo y convierte la
zona de medios en un flujo de subida y reemplazo real con optimización
automática, el backoffice será más intuitivo para operación diaria y la web
servirá imágenes más ligeras y consistentes.

## Métricas de éxito
- Métrica primaria: reducir el esfuerzo operativo para editar un bungalow a una
  lectura por superficies claras: `Operación`, `Ficha web`, `Textos web`.
- Métrica secundaria: toda imagen subida desde backoffice queda convertida a
  WebP y expuesta en variantes aptas para web pública y miniaturas internas.
- Anti-métrica: no bloquear cambios operativos simples por campos editoriales o
  media aún no completados.

## Superficies del producto
- `ops surface`: inventario y operación del bungalow.
- `public surface`: portada, galería, visibilidad, tarifa, área y orden web.
- `editorial surface`: copy ES/EN para la ficha pública.

La decisión central es que la pantalla deje de agruparse por estructura del
payload y pase a agruparse por intención de trabajo.

## Flujos principales
1. Admin abre un bungalow y aterriza en `Operación`.
2. Cambia código, capacidad o estado y guarda sin depender del copy público.
3. Cambia a `Ficha web`, reemplaza portada o agrega imágenes a la galería.
4. El sistema optimiza cada imagen subida y guarda variantes para web y
   miniatura.
5. Admin pasa a `Textos web` y ajusta contenido ES/EN con estado visible de
   completitud por idioma.
6. Admin revisa la vista pública antes de salir.

## Decisiones de producto
- La pantalla se reorganiza en tres tabs: `Operación`, `Ficha web`,
  `Textos web`.
- La cabecera superior debe ser compacta y sticky, con estado, visibilidad,
  acción principal y enlace a vista pública.
- La zona de imágenes se trata como gestor de activos, no como campos de texto.
- El modo avanzado para URLs manuales queda disponible, pero colapsado.
- El copy ES/EN queda fuera del flujo primario de operación.
- El guardado operativo no se debe bloquear porque falte copy EN o media
  editorial.

## Restricciones
- Mantener el dominio real `reservations`.
- Reusar el shell admin y el lenguaje visual ya existente en `/admin`.
- La fuente de verdad sigue viviendo en persistencia real, no en mock local del
  navegador.
- El optimizador debe correr en servidor y no depender del navegador del
  operador.

## No objetivos
- No construir una librería global de DAM para todo Wakaya.
- No rediseñar la web pública completa en este slice.
- No introducir AVIF ni variantes experimentales antes de estabilizar WebP.
- No convertir el editor en un CMS genérico.
