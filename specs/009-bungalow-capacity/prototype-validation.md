# Prototype Validation - Wakaya Bungalow Capacity

## Estado

La versión original fue validada el 2026-07-12. La enmienda que elimina
bloqueos fue aprobada textualmente el 2026-07-13.

## Gates

- `gate-prototype-ready`: APROBADO para la enmienda mediante wireframe textual;
  el Product Owner pidió no mostrar un prototipo en navegador.
- `gate-spdd-approved`: APROBADO por el responsable de negocio el 2026-07-13.
- `gate-4-6`: REABIERTO para retirar bloqueos y renovar QA local.

## Evidencia

- Prototipo: `prototype-html5/index.html`.
- Decisiones: `prototype-html5/decisiones-ux.md`.
- Flujo: `prototype-html5/flujo.md`.
- Desktop: `../../output/playwright/009-bungalow-capacity/prototype-desktop.png`.
- Panel de bloqueo: `../../output/playwright/009-bungalow-capacity/prototype-block-panel.png`.
- Mobile 390 x 844: `../../output/playwright/009-bungalow-capacity/prototype-mobile.png`.

## Validación automática

- `npm run check:prototype-html5 -- --strict --spec specs/009-bungalow-capacity`: aprobado, nivel 3.
- `npm run check:prototype-contract -- --strict --feature 009-bungalow-capacity`: aprobado.
- `npm run check:prototype-coverage -- --strict --feature 009-bungalow-capacity`: aprobado.
- `npm run check:prototype-spa-coherence -- --strict --feature 009-bungalow-capacity`: aprobado, no aplica SPA multiarchivo.
- `npm run check:prototype-mock-data -- --strict --feature 009-bungalow-capacity`: aprobado, no aplica dataset externo.
- Métricas: 931 líneas HTML, 24 tokens CSS, 2 media queries, 4 vistas, 11 mocks, 18 botones.

## Validación en navegador

- Desktop 1440 x 1100: tabla, totales y bloques revisados.
- Mobile 390 x 844: filas apiladas sin desborde horizontal y acciones visibles.
- Panel `Bloquear cupos`: cantidad, rango, motivo, nota y CTA verificados.
- Panel `Editar total`: conflicto `capacity_below_commitments` representado con mínimo requerido y fecha.
- Consola: 0 errores y 0 advertencias después de recarga limpia.

## Criterios de revisión

- Se entienden los cinco totales físicos sin confundirlos con huéspedes.
- La disponibilidad por rango muestra una fecha crítica coherente.
- Editar total y bloquear cupos son las únicas acciones principales.
- No aparecen códigos ni unidades individuales.
- Mobile conserva lectura y acciones directas.

## Decisión humana original

El responsable de negocio aprobó el prototipo el 2026-07-12. Se autoriza la
construcción TDD local; el despliegue a producción requiere una aprobación
posterior sobre la demostración integrada.

## Enmienda humana 2026-07-13

El responsable de negocio retiró el alcance de mantenimiento/bloqueos porque no
selecciona un bungalow físico específico. Se aprobó conservar solo totales,
reservas confirmadas y disponibles, manteniendo registros históricos sin efecto.
