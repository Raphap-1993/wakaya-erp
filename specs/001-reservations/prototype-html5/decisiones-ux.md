# Decisiones UX prototipo HTML5 — Wakaya ERP

## Decisión de patrón de producto

- Dominio del spec: consola operativa interna de reservas para Recepción.
- Actor principal: Recepción operando llegadas, salidas y asignaciones de bungalow día a día.
- Tarea principal navegable de inicio a fin: filtrar reservas críticas, abrir una reserva con llegada próxima, asignar o reasignar bungalow y validar la auditoría reciente en el mismo panel.
- Patrón visual elegido: split view operativo con topbar, franja de KPIs del día, agenda central y detalle lateral persistente.
- Por qué NO se usa una shell genérica sidenav+tabla: la asignación de bungalow necesita comparar lista y detalle sin cambiar de pantalla ni esconder la trazabilidad detrás de navegación secundaria.
- Interacciones del prototipo: filtrar reservas del día, seleccionar reserva, asignar bungalow, reasignar bungalow, registrar check-in, registrar check-out, revisar auditoría reciente.
- Limitaciones conocidas: no hay integración real con OIDC, motor de ocupación productivo ni persistencia real.

## Golden de referencia

- Path: `ejemplos/fase-2-ux-ui/prototype-html5-golden/saas-operativo/index.html`
- Por qué este golden: aporta densidad operativa, KPIs visibles y jerarquía útil para una consola interna, pero se reinterpretará con lenguaje hotelero y detalle lateral persistente.
- Patrones estructurales que voy a replicar: topbar persistente, franja de KPIs, filtros compactos, lista operativa y panel lateral accionable.
- Tokens base reutilizados de `:root`: `--brand`, `--brand-dark`, `--neutral-100`, `--neutral-200`, `--neutral-700`, `--success`, `--warning`, `--danger`.

## Estado del slice

Este prototipo deja de presentarse como seed genérico y pasa a una iteración visible de producto para revisión de stakeholders.
- Promesa del slice: Recepción puede detectar reservas críticas, validar contexto y asignar bungalow sin salir de la agenda.
- Señales obligatorias: lenguaje de reservas, bungalow visible, estado de pago, alertas operativas y auditoría reciente.

## Verificación

```sh
node ci/scripts/check-html5-prototype-quality.mjs --spec specs/001-reservations --strict
```
