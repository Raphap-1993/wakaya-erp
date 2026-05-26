# ANTI-EJEMPLO — Prototipo HTML5 nivel 1 (NO copiar)

> Este directorio contiene un **prototipo de calidad insuficiente** que ilustra exactamente lo que el agente NO debe entregar.
> Permanece versionado solo como contraste pedagógico contra los goldens en `../prototype-html5-golden/`.

## Por qué este prototipo está bloqueado

Aplicando la rúbrica `docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md` y el gate `ai/quality-gates/gate-html5-product-quality.md`:

| Síntoma | Bloqueo |
|---|---|
| Solo 150 líneas, sin tokens de diseño, paleta gris plana | Nivel 1 visual, no parece producto real |
| Shell `sidenav + tabla` reusada para todo | B9 si el dominio fuese de consumo |
| 3 registros mock, sin avatares, badges, prioridades, fechas reales | Datos mock pobres (O1) |
| Una sola media query, layout no responsive de verdad | O2 |
| `decisiones-ux.md` no declara dominio, actor, patrón, justificación | O4 |
| Sin diferencias visuales reales por rol (solo `denied()` genérico) | Insuficiente para Nivel 3 |

## Qué hacer en su lugar

1. Leer obligatoriamente `../prototype-html5-golden/README.md`.
2. Elegir el golden del dominio más cercano (`saas-operativo-bandeja/` o `streaming-catalogo-player/`) y usarlo como **piso visual**.
3. Seguir `ai/prompts/generar-prototipo-html5-ejecutable.md` (6 pasos + auto-rating obligatorio).
4. Pasar `node ci/scripts/check-html5-prototype-quality.mjs --strict` antes de declarar listo.

## Comparación rápida

| Métrica | Anti-ejemplo (este) | Golden saas | Golden streaming |
|---|---|---|---|
| Líneas HTML | 150 | 1311 | 639 |
| Custom properties en `:root` | 7 | 25+ | 18+ |
| Vistas distinguibles | 6 (todas iguales) | 8 (con detalle lateral) | 7 (hero, grid, modal, player) |
| Registros mock | 3 | 30+ | 20+ |
| Media queries | 1 | 4+ | 3+ |
| Sistema de badges/estados visuales | No | Sí (6 tipos) | Sí (edad, progreso) |

## Regla operativa

Si tu borrador se parece más a este anti-ejemplo que al golden del dominio, **no lo entregues**. Reabre `decisiones-ux.md`, vuelve al paso 2 del prompt ejecutable y regenera.
