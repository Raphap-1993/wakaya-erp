# Decisiones UX prototipo HTML5 — Wakaya ERP

> SEED nivel 2 — los campos están en blanco para forzar al agente a rellenarlos
> ANTES de regenerar el prototipo. El validador exige los seis primeros campos
> con su label exacto para validar B6/B7/B9.

## Decisión de patrón de producto

- Dominio del spec: <COMPLETAR — streaming / saas-operativo / ecommerce / educación / salud / dashboard / otro>
- Actor principal: <COMPLETAR — operador / supervisor / cliente / paciente / etc.>
- Tarea principal navegable de inicio a fin: <COMPLETAR>
- Patrón visual elegido: <COMPLETAR>
- Por qué NO se usa una shell genérica sidenav+tabla: <COMPLETAR>
- Interacciones del prototipo (mínimo 3, expresadas como acciones reales del producto): <COMPLETAR>
- Limitaciones conocidas: <COMPLETAR>

## Golden de referencia

- Path: `ejemplos/fase-2-ux-ui/prototype-html5-golden/<elegido>/index.html`
- Por qué este golden: <COMPLETAR>
- Patrones estructurales que voy a replicar (cita o anclaje): <COMPLETAR>
- Tokens base reutilizados de `:root` (≥ 8): <COMPLETAR>

## Estado del seed

Este archivo describe un seed nivel 2 emitido automáticamente por el generador del template.
- Patrón visual del seed: saas-operativo (topbar + sidebar + KPI + filtros + tabla + estados).
- Si tu dominio NO es saas-operativo, **regenera** con `/prototype --mode html5` siguiendo el golden adecuado.
- Si tu dominio sí es saas-operativo, valida el pre-flight de arriba y luego sube a nivel 3 añadiendo: panel de detalle lateral, diferencias por rol, historial completo, modal de confirmación.

## Verificación

```sh
node ci/scripts/check-html5-prototype-quality.mjs --spec specs/001-reservations --strict
```

Sin completar la sección "Decisión de patrón de producto" arriba, el validador reporta observaciones O4. Sin alcanzar nivel 2, queda BLOQUEADO.
