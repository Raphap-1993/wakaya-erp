# Prototype Validation - Wakaya Bungalow Backoffice Media

[README principal](../../README.md) | [Specs](../README.md)

## Estado
Pendiente de validación humana

## Evidencia disponible
- Prototipo HTML5: `prototype-html5/index.html`
- Product Design: `product-design.md`
- SPDD: `spdd-frontend.md`
- Captura desktop: `../../output/playwright/004-bungalow-backoffice-media/prototype-desktop.png`
- Captura móvil: `../../output/playwright/004-bungalow-backoffice-media/prototype-mobile.png`

## Checklist de revisión
- [ ] La pantalla se entiende mejor que la actual en menos de 10 segundos.
- [ ] La operación diaria queda separada de publicación y textos.
- [ ] La zona de imágenes parece un gestor de activos y no un textarea técnico.
- [ ] La cabecera reduce duplicación de acciones.
- [ ] El tab de textos evita ruido para el operador operativo.
- [ ] La versión móvil mantiene el orden de lectura correcto.

## Observaciones abiertas
- Validar si `Textos web` debe quedar como tab o como acordeón secundario.
- Validar si el modo avanzado de URLs manuales queda visible solo para admin.
- Validar si la acción `Ver ficha pública` abre la ruta pública localizada o una
  preview interna.

## Observaciones de la pasada visual actual
- La densidad desktop mejora de forma clara frente a la captura original:
  portada y galería ya se entienden como gestor visual y no como campos
  dispersos.
- La cabecera compacta reduce duplicación de CTAs y concentra estado,
  visibilidad y acción principal.
- La superficie `Operación` queda visualmente separada del trabajo editorial.
- En móvil, el orden de lectura se conserva y la portada sigue siendo prioritaria
  antes de la galería.
- En móvil todavía conviene revisar si `Guardar cambios` debe quedar más cerca
  del selector de tabs o fijarse al borde inferior en implementación productiva.
