# Spec técnica - Identidad visual pública

## Implementación

- Dependencias: `@fontsource-variable/lora` y
  `@fontsource-variable/montserrat`.
- Carga global desde `src/app/layout.tsx` para incluir los archivos WOFF2 en el
  bundle.
- Tokens de familia y color en `src/app/globals.css`.
- Override del stack tipográfico dentro de `.page` del shell público.
- Encabezados semánticos con Lora y controles/copy con Montserrat.
- Migración de los colores públicos retirados a variables CSS aprobadas.

## Riesgos

- Cambio de métricas tipográficas: validar build y páginas responsive.
- Contraste del lima: usar `--wakaya-lime-ink` sobre superficies claras.
- Regresión administrativa: no sustituir `--wakaya-font-sans` en `:root`.
