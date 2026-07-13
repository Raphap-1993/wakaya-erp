# Product Design - Wakaya Home Content Management

[README principal](../../README.md) | [Specs](../README.md)

## Problema
El home publico localizado de Wakaya sigue dependiendo de codigo para editar
slider, textos, CTAs, imagenes, orden y visibilidad. El slider ademas toma copy
de otras secciones, asi que un cambio editorial pequeno puede alterar dos
superficies sin que el operador lo vea con claridad.

En el extremo opuesto, un editor demasiado libre resolveria autonomia pero
romperia rapido la logica publica: responsive inconsistente, CTAs inseguros,
tipografia arbitraria y secciones incompatibles con el home real.

## Jobs to be Done
- Cuando actualizo el home desde backoffice, quiero editar slider y secciones en
  una sola pantalla clara, para no depender de cambios de codigo.
- Cuando trabajo en dos idiomas, quiero cambiar ES/EN sin duplicar estructura ni
  perder el contexto del bloque que estoy editando.
- Cuando publico cambios, quiero saber que el home completo queda valido y
  atomico, para no romper la web visible.

## Hipotesis de valor
Si Wakaya convierte el home en un editor estructurado con publicacion inmediata,
revision recuperable y controles seguros de contenido, el equipo podra mantener
el home publico sin desplegar codigo y sin degradar la logica de la web.

## Metricas de exito
- Metrica primaria: publicar cambios visibles del home desde `/admin/home`
  sin tocar codigo.
- Metrica secundaria: editar ES/EN, slider, CTAs y visibilidad en menos de una
  sola lectura operacional de la pantalla.
- Anti-metrica: permitir HTML, CSS o destinos inseguros que rompan el home.

## Superficies del producto
- `publication surface`: estado publicado, version, ultima publicacion, accion
  principal y conflicto de concurrencia.
- `structure surface`: slider y secciones visibles del home con orden y estado.
- `editorial surface`: copy ES/EN, imagenes, CTAs y tipografia por
  bloque con presets seguros mas ajuste fino acotado.
- `preview surface`: vista local desktop/mobile del estado todavia no publicado.
- `recovery surface`: historial de revisiones y restore seguro.

## Flujos principales
1. Editor entra a `/admin/home` y ve version publicada, estructura y ultima
   publicacion.
2. Selecciona `Slider` o una seccion visible del home.
3. Ajusta copy ES/EN, visibilidad, orden, CTA, imagen y tipografia segura.
4. Previsualiza desktop o mobile sin alterar el home en produccion.
5. Publica con `Guardar y publicar`.
6. Si existe conflicto de version, recupera el ultimo payload y vuelve a
   publicar.
7. Si un cambio posterior sale mal, restaura una revision anterior.

## Requerimientos estables

| ID | Descripcion |
|---|---|
| RF-HOME-01 | Manage bilingual slider slides |
| RF-HOME-02 | Manage bilingual section content |
| RF-HOME-03 | Manage CTA labels and safe destinations |
| RF-HOME-04 | Manage section visibility and order |
| RF-HOME-05 | Select safe typography presets and bounded fine tuning |
| RF-HOME-06 | Publish immediately and atomically |
| RF-HOME-07 | Preserve and restore publication revisions |
| RF-HOME-08 | Preserve bungalow and booking logic |
| RF-HOME-09 | Restrict publishing to `content:write` |

## Decisiones de producto
- El home se administra como editor estructurado, no como page builder.
- ES y EN se editan en la misma pantalla con tabs de idioma, pero comparten
  orden, visibilidad, media y comportamiento.
- Los bloques permitidos son cerrados: slider, booking-band, stats, story,
  bungalows, quote-band, experiences, testimonials y closing-cta.
- La tipografia se controla con presets seguros del sistema y ajuste fino
  acotado de tamano/peso dentro de rangos definidos.
- Los CTAs admiten destinos internos, telefono, WhatsApp y HTTPS.
- La publicacion valida guarda y publica un documento completo de una sola vez.
- Cada publicacion genera revision recuperable; no existen drafts persistidos.
- Los bungalows destacados siguen tomando sus datos del modulo de bungalows.

## Restricciones
- Mantener el dominio real `reservations`.
- Reusar shell admin, patron visual y rutas actuales del backoffice.
- No duplicar la ficha publica de bungalows dentro del home.
- No permitir CSS libre, rich text, Markdown ni HTML arbitrario.
- Mantener responsive, accesibilidad, SEO y logica publica actual.

## No objetivos
- No construir un CMS generico para todas las paginas publicas.
- No reemplazar el modulo de bungalows como fuente de verdad.
- No introducir drafts, workflows de aprobacion editorial ni sandbox paralelo.
- No redisenar el home publico como una composicion distinta a la existente.
