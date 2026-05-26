# Gate: HTML5 Product Quality

## Objetivo
Bloquear prototipos HTML5 que parezcan documentación, maquetas pobres o shells genéricas, independientemente de la cobertura de RF declarada.

Este gate complementa `gate-prototype-ready`. Mientras que `gate-prototype-ready` verifica existencia y navegabilidad, `gate-html5-product-quality` verifica que la experiencia visual sea la de un producto real.

## Cuándo aplicarlo
- Después de generar cualquier `specs/<feature>/prototype-html5/index.html`.
- Antes de marcar `gate-prototype-ready` como `Listo para validación`.
- En cualquier revisión de prototipo cuando el resultado visual sea sospechoso.

## Verificación automática

Antes de la revisión humana, este gate se valida automáticamente con:

```sh
node ci/scripts/check-html5-prototype-quality.mjs --spec specs/<feature> --strict
```

El validador implementa B1, B2, B3, B4, B5, B6, B7, B9 como exit codes y reporta nivel rúbrica 0-3 según mínimos cuantitativos (líneas, tokens CSS, vistas, mocks, media queries, botones). B8 y B10 siguen requiriendo revisión humana — el validador no puede inferirlos con confianza.

## Rúbrica de referencia
Ver `docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`.

- **Nivel 0** → bloqueado, rehacerlo.
- **Nivel 1** → bloqueado, insuficiente para validación.
- **Nivel 2** → aprobado, puede avanzar.
- **Nivel 3** → aprobado, recomendado para enterprise.

---

## Checklist de calidad visual

### Bloqueo automático — si cualquiera aplica, el resultado es BLOQUEADO

| # | Criterio de bloqueo |
|---|---|
| B1 | El prototipo parece una especificación exportada a HTML, no un producto navegable. |
| B2 | El primer viewport no comunica qué producto es ni cuál es la acción principal. |
| B3 | Aparece cualquiera de estos textos como contenido visible en pantalla: `RF-`, `gate-`, `Contrato mock`, `Formulario-spec`, `Actividad de ejemplo`, `Recorrido simulado`, `Permiso activo`, `Ruta interna`, `Componente:`, `Spec técnica`, `Angular futuro:`. |
| B4 | No existe ninguna tarea principal navegable de inicio a fin. |
| B5 | No hay estados UI (loading, empty, error, success, permission denied). |
| B6 | El dominio es streaming y no hay topbar, catálogo visual ni acción de reproducción. |
| B7 | El dominio es player y no hay video 16:9 ni controles de playback. |
| B8 | El dominio tiene diferencias de perfil y todos los perfiles ven exactamente lo mismo. |
| B9 | Se usa la misma shell sidebar+tabla para un dominio de consumo (streaming, ecommerce, educación). |
| B10 | Los estados loading/empty/error aparecen como tabs de navegación o checklist visible, no como comportamiento natural de la pantalla. |

### Observaciones — pueden avanzar con nota

| # | Criterio de observación |
|---|---|
| O1 | El prototipo tiene flujo pero los datos mock son muy genéricos o escasos. |
| O2 | La responsividad está ausente o rota en mobile. |
| O3 | El sistema visual no es consistente con otros prototipos del mismo portafolio. |
| O4 | `decisiones-ux.md` no registra el patrón elegido ni justifica la estructura visual. |
| O5 | Falta enlace de vuelta al hub desde el prototipo de la spec. |
| O6 | El hub no enlaza a este prototipo. |
| O7 | El feedback (toast, modal) existe pero es demasiado genérico para el dominio. |

---

## Resultado esperado

| Resultado | Condición |
|---|---|
| `Aprobado — nivel 2` | Ningún bloqueante. Rúbrica nivel 2. Puede tener observaciones. |
| `Aprobado — nivel 3` | Ningún bloqueante. Rúbrica nivel 3. Sin observaciones críticas. |
| `Bloqueado` | Uno o más criterios B aplican. Se requiere rework antes de continuar. |

---

## Acción ante resultado BLOQUEADO

Si el resultado es `Bloqueado`, el agente debe:
1. Reportar qué criterios de bloqueo aplican (B1-B10).
2. Proponer el plan de corrección específico para cada criterio.
3. NO marcar `gate-prototype-ready` como `Listo para validación`.
4. NO avanzar a `gate-spdd-approved`.
5. Regenerar el prototipo corregido antes de reevaluar.

---

## Ejemplos de diagnóstico rápido

| Síntoma observado | Bloqueo |
|---|---|
| Sidenav + tabla para una app de streaming de contenido cristiano | B9 |
| Tabs llamadas "Error", "Sin resultados", "Loading" en la navegación principal | B10 |
| Panel con "RF-04 cubierto" como texto visible | B3 |
| Primer viewport es una lista de links sin identidad de producto | B2 |
| Player sin controles, solo botón "Simular reproducción" | B7 |
| Perfil adulto y perfil niño muestran exactamente el mismo catálogo | B8 |
| El agente dice "listo" pero no hay ningún clic navegable | B4 |

---

## Referencias
- `../../docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`
- `../../docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md`
- `../../docs/fase-2-ux-ui/02.14-html5-first-prototyping.md`
- `gate-prototype-ready.md`
- `../../ci/scripts/check-html5-prototype-quality.mjs`
