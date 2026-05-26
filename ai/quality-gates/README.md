# Quality Gates de IA

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ai](../README.md)

Esta carpeta convierte los gates del repositorio en artefactos AI-first reutilizables.

## Objetivo
Permitir que agentes, prompts y skills trabajen contra gates explicitos y no solo contra texto narrativo.

## Gates disponibles
- [gate-documentation-ready.md](gate-documentation-ready.md)
- [gate-0-1.md](gate-0-1.md)
- [gate-ux-ready.md](gate-ux-ready.md)
- [gate-prototype-ready.md](gate-prototype-ready.md) — existencia y navegabilidad del prototipo
- [gate-html5-product-quality.md](gate-html5-product-quality.md) — **calidad visual HTML5** (B1-B10, aplicar antes de gate-prototype-ready)
- [gate-spdd-approved.md](gate-spdd-approved.md)
- [gate-2-3.md](gate-2-3.md)
- [gate-frontend-spdd-ready.md](gate-frontend-spdd-ready.md)
- [gate-4-6.md](gate-4-6.md)
- [gate-7-8.md](gate-7-8.md)

## Orden de gates para prototipos HTML5

```
generar HTML5
  → gate-html5-product-quality   (calidad visual, B1-B10)
  → gate-prototype-ready         (existencia, navegacion, evidencia)
  → validacion humana
  → gate-spdd-approved
```

`gate-html5-product-quality` debe evaluarse ANTES de `gate-prototype-ready`. Si hay bloqueantes B, no se puede avanzar a `gate-prototype-ready`.

## Que validador confirma cada gate (fuente unica, v12.87)

Los validadores `check:*` que respaldan cada gate **no se listan a mano aqui** (driftaban).
Viven en el contrato ejecutable de la fase (`ci/scripts/_lib/phase-contracts.mjs` >
`debeValidar`) y se publican, ya sincronizados, en el bloque **"Contrato ejecutable de la
fase (auto)"** del checklist de cada fase (zona `auto:start name=fase-N-contrato`, generada
por `npm run roadmap:sync`). Consulta tambien `npm run roadmap:next` (incluye el contrato de
la fase actual con sus validadores y gates).

- `check:phase-validator-sync` verifica que esa lista y el pipeline real (`check:project`)
  no se desincronicen.

## Regla de uso
- Un gate no aprueba automaticamente el trabajo; exige evidencia.
- Si falla un gate, la salida debe listar bloqueantes y siguiente paso.
- Los gates complementan `docs/transversal/90.11-checklist-entregables.md`.
