# Prompt: Generar prototipo HTML5 desde SPDD (REDIRECCIÓN)

> **Este prompt fue consolidado.** Usa el ejecutable canónico:
>
> 👉 [`generar-prototipo-html5-ejecutable.md`](generar-prototipo-html5-ejecutable.md)

## Por qué se consolidó

Este prompt y el ejecutable competían y se contradecían en énfasis. El ejecutable es ahora la única fuente operativa: 6 pasos cerrados, lectura obligatoria del golden con cita verificable, auto-rating obligatorio y verificación con `ci/scripts/check-html5-prototype-quality.mjs --strict`.

## Si llegaste aquí desde una referencia antigua

- Lee primero: [`docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md`](../../docs/fase-2-ux-ui/02.15-estandar-prototipo-html5-producto-real.md)
- Lee la rúbrica: [`docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`](../../docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md)
- Ejecuta: [`generar-prototipo-html5-ejecutable.md`](generar-prototipo-html5-ejecutable.md)
- Goldens de referencia: [`ejemplos/fase-2-ux-ui/prototype-html5-golden/`](../../ejemplos/fase-2-ux-ui/prototype-html5-golden/)
- Anti-ejemplo (NO copiar): [`ejemplos/fase-2-ux-ui/prototype-html5-anti-ejemplo/`](../../ejemplos/fase-2-ux-ui/prototype-html5-anti-ejemplo/)

## Comando

```text
/prototype --mode html5
```

Definido en [`ai/commands/prototype-command.md`](../commands/prototype-command.md).

## Reglas críticas (resumen)

- Nivel mínimo exigido: 2 (rúbrica). Recomendado nivel 3 para enterprise.
- Cero términos prohibidos como texto visible: `RF-`, `gate-`, `Contrato mock`, etc.
- Patrón visual del dominio obligatorio. Sidenav + tabla en streaming/ecommerce/educación/kids = bloqueante B9.
- Auto-rating obligatorio antes de declarar "listo" (ver Paso 5.1 del ejecutable).
- Validador en modo strict obligatorio: `node ci/scripts/check-html5-prototype-quality.mjs --spec specs/<feature> --strict`.

## No lo uses cuando

- El SPDD aun no esta aprobado (`gate-spdd-approved`): el prototipo es una salida del SPDD, no un sustituto.
- La feature es 100% backend o solo API (sin pantallas reales): usa contract-first y `api-contract.md`.
- El equipo decidio Penpot como herramienta principal y este HTML5 solo seria duplicacion: usa `generar-prototipo-penpot-desde-spdd.md`.
- Estas generando un mock para una demo comercial que no debe pretender ser producto real: el HTML5 enterprise nivel 2-3 puede confundir a stakeholders. Usa un mock mas simple o el banner SPDD del hub.

## Verificacion minima

- [ ] El SPDD existe y `gate-spdd-approved` esta marcado (al menos "Aprobado con observaciones").
- [ ] `prototype/index.html` se abre sin errores en consola del navegador.
- [ ] `node ci/scripts/check-html5-prototype-quality.mjs --spec specs/<feature> --strict` retorna exit 0.
- [ ] El nivel reportado por el validador es >= 2 (recomendado 3).
- [ ] No hay terminos prohibidos como texto visible (`RF-`, `gate-`, "Contrato mock", "Spec funcional"...).
- [ ] El prototipo usa el patron visual del dominio (sidenav+tabla, dashboard, wizard, etc.) declarado en el SPDD.
- [ ] Hay registro del run en `specs/<feature>/prototype-validation.md` con auto-rating + 3 evidencias.
