# Product Design - Wakaya Public Content Hub

[Specs](../README.md) | [Feature](README.md)

## Problema
El editor debe saltar entre módulos y todavía encuentra URLs, copy embebido y controles técnicos. El visitante recibe experiencias y galería sin una fuente editorial única.

## Jobs to be Done
- Mantener el contenido público desde una sola entrada.
- Editar ES/EN sin duplicar estructura.
- Reemplazar una imagen viendo exactamente sus recortes desktop/mobile.
- Publicar una experiencia y compartir su popup mediante URL.

## Decisión de producto
Construir un centro estructurado, no un CMS libre. `/admin/content` usa tabs por dominio y formularios controlados. La media se gestiona visualmente; las URLs manuales quedan solo como compatibilidad de migración y no como flujo principal.

## Flujo principal
1. Editor abre `/admin/content`.
2. Elige Home, Experiencias, Galería o Bungalows.
3. Edita estructura compartida y copy ES/EN.
4. Sube media, completa crops requeridos y revisa previews.
5. Guarda/publica con versión esperada.
6. Abre la vista pública localizada.

## Métricas
- 100% de contenido del alcance editable sin deploy.
- 100% de heroes publicados con crops desktop/mobile.
- 0 activos `processing/failed` referenciados públicamente.
- popup de experiencia reproducible por URL, locale y navegación browser.

## Restricciones
- labels y acciones directas; sin párrafos ornamentales en backoffice.
- no mezclar unidades físicas con ficha pública del tipo.
- no permitir HTML, CSS, Markdown o links inseguros.
- responsive desktop/mobile y WCAG 2.2 AA en controles críticos.

## Estado
`gate-ux-ready`, `gate-prototype-ready` y `gate-spdd-approved` están aprobados con evidencia en `prototype-validation.md`. La orden humana fue textual; no se afirma revisión de capturas posteriores.
