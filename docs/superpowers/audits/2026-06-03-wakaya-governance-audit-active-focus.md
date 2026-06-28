# Wakaya Governance Audit - Active Focus Continuation

[README principal](../../../README.md) | [Indice docs](../../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Volver al indice de documentacion](../../README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

Fecha: 2026-06-03
Agente: Viernes

## Objetivo

Continuar desde el foco activo vigente documentado en `AI_CONTEXT.md` y en el
handoff `docs/superpowers/plans/2026-06-02-wakaya-local-readiness-handoff.md`:
hardening corto del baseline y de la gobernanza antes de abrir nueva
construccion funcional.

Este audit no reemplaza los artefactos previos del `2026-06-03`; fija el
estado actual del repo con evidencia fresca y aclara el delta operativo
relevante.

## Alcance

- Revalidacion del tooling canonico de roadmap y pipeline de gobernanza.
- Estado real de trazabilidad, contrato de fases y residuos documentales.
- Estado actual del baseline local (`test`, `typecheck`, `build`).

## Evidencia ejecutada

```sh
npm run roadmap:audit
npm run check:trace-drift
npm run check:trace-coverage
npm run check:validation-coverage
npm run check:phase-contract
npm run check:phase-validator-sync
npm run check:architecture-baseline
npm run check:status-coherence
node ci/scripts/check-constitution.mjs
npm run test
npm run typecheck
npm run build
npm run check:project
```

## Resultado ejecutivo

No hay cierre material del foco activo. El repo sigue en hardening de
gobernanza minima + baseline local. La novedad del rerun actual es que
`check:project` no llega ni siquiera al tramo donde faltaria `check:constitution`,
porque hoy cae de inmediato en `check:trace-drift`; el hueco constitucional
sigue siendo real, pero el pipeline no esta dando un falso verde completo en su
estado actual.

## Hallazgos

### 1. Critico - El tooling canonico de roadmap sigue publicado pero no existe

Evidencia:

- `package.json` sigue exponiendo `roadmap:next`, `roadmap:sync`,
  `roadmap:prompt`, `roadmap:audit`, `roadmap:claim`, `roadmap:release` y
  `roadmap:status`.
- `npm run roadmap:audit` sigue fallando con `MODULE_NOT_FOUND` porque
  `scripts/roadmap-audit.mjs` no existe.
- El arbol `scripts/` presente en el repo no contiene el set `roadmap-*.mjs`.

Impacto:

- El comando canonico para auditar touch-policy, transiciones y contrato de
  fase no es ejecutable.
- La documentacion operativa del repo sigue prometiendo una superficie de
  gobierno que hoy no esta implementada.

### 2. Critico - El contrato de gates/fases sigue partido entre docs y validadores

Evidencia:

- `docs/README.md` mantiene `gate-4-6` para fases 4, 5 y 6, y `gate-7-8` para
  fases 7 y 8.
- `docs/transversal/90.33-flujo-delivery-ia-proveedores.md` sigue reforzando
  `gate 4-6` y `gate 7-8` como canon operativo.
- `ci/scripts/check-phase-contract.mjs` infiere fase con
  `gate-sdd-approved`, `gate-build-ready`, `gate-qa-passed`,
  `gate-deploy-ready` y `gate-operations-ready`.
- `ci/scripts/_lib/phase-contracts.mjs` sigue publicando ese canon alterno como
  "fuente unica de verdad".

Impacto:

- El repo mantiene dos constituciones de fase simultaneas.
- Los checks pueden pasar sobre un modelo distinto al que la documentacion
  principal instruye a usar.

### 3. Alto - El control constitucional sigue fuera del pipeline canonico y el artefacto raiz falta

Evidencia:

- `npm run check:validation-coverage` sigue reportando que
  `check-constitution.mjs` no participa en `check:project`.
- `package.json` no define `check:constitution`.
- `node ci/scripts/check-constitution.mjs` sigue fallando porque
  `CONSTITUTION.md` no existe en la raiz.
- `npm run check:project` hoy falla antes, en `check:trace-drift`, por lo que
  el hueco constitucional no esta siendo la primera causa visible del rojo.

Impacto:

- El control existe fisicamente, pero no forma parte del pipeline canonico del
  proyecto.
- Aun si se sanea `trace-drift`, quedaria un hueco metodologico real mientras
  falten `CONSTITUTION.md` y su wiring en `package.json`.

### 4. Alto - La trazabilidad sigue bloqueando el pipeline y mezclando drift real con falsos negativos

Evidencia:

- `npm run check:trace-drift` sigue reportando `12` hallazgos.
- `TRACEABILITY_MATRIX.md` raiz sigue anclada a una sola fila `RF-01`, con
  placeholders viejos como `reservationQueryService` y `reservationQueryTest`.
- `specs/001-reservations/traceability.md` ya declara multiples rutas reales
  por RF/RNF en las columnas `Codigo` y `Test`.
- `ci/scripts/check-trace-drift.mjs` sigue validando `target_ref` como una sola
  cadena; no separa multiples rutas por coma antes de resolverlas.
- `npm run check:project` cae inmediatamente en este check.

Impacto:

- La matriz global y la matriz por feature siguen contradiciendose.
- El ruido del parser tapa drift real y al mismo tiempo bloquea el pipeline
  principal.

### 5. Alto - `check:trace-coverage` sigue ciego a la construccion real del layout Next.js

Evidencia:

- `npm run check:trace-coverage` sigue respondiendo:
  `OK. No hay features en fase >= 5`.
- `ci/scripts/check-trace-coverage.mjs` solo eleva a construccion por fase
  declarada en `ai_documents` o por existencia de `src/<feature>`.
- El codigo real vive bajo rutas operativas como:
  - `src/app/admin/reservations/`
  - `src/app/api/reservations/`
  - `src/app/api/public/reservations/`
  - `src/lib/reservations/`
- `AI_CONTEXT.md` y el handoff de readiness siguen describiendo una app ya
  construida parcialmente, con monitor interno, sitio publico y APIs locales.

Impacto:

- El check emite falso verde frente a construccion real ya presente.
- La cobertura automatica no gobierna el layout vivo del proyecto.

### 6. Alto - Persisten residuos de dominio y stack en rutas canonicas

Evidencia:

- `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md` sigue
  usando `expediente` en `RF-02` y `HU-02`.
- `docs/fase-3-arquitectura/03.00-arquitectura.md` sigue declarando
  `Angular`, `Nx` y `Quarkus`.
- `docs/fase-3-arquitectura/adr/README.md` sigue publicando primero
  `ADR-001 - Stack Quarkus Angular y Keycloak`, aunque ya existe `ADR-011`
  para el baseline Next.js.

Impacto:

- Se sigue incumpliendo la regla explicita de `AGENTS.md` sobre limpiar
  residuos de `expedientes/bandeja` antes de avanzar.
- La arquitectura y el analisis oficial publicados no representan con
  claridad el baseline real.

### 7. Medio - El baseline local sigue sin estar listo para nueva construccion

Evidencia:

- `npm run test` sigue verde: `16/16` suites, `24/24` tests.
- `npm run typecheck` sigue fallando con `7` errores, incluyendo:
  - spread sobre `unknown` en `src/app/api/public/reservations/route.ts`
  - `Link` con anchors hash incompatible con typed routes en
    `src/components/public-site/play-header.tsx`
  - dependencia faltante `next-intl/server` en `src/lib/i18n.ts`
  - firma incompatible del redactor PII en `src/lib/pii-redact.ts`
  - matcher inexistente `iso8601DateTime` en `tests/contract/resource.pact.test.ts`
- `npm run build` vuelve a compilar y luego cae en TypeScript por el mismo
  error inicial de `src/app/api/public/reservations/route.ts`.
- `next.config.mjs` sigue usando `experimental.typedRoutes`, que Next 16 ya
  reporta como movido a `typedRoutes`.

Impacto:

- El foco correcto sigue siendo hardening, no nueva construccion funcional.
- El baseline todavia no es buildable ni metodologicamente confiable.

## Señales en verde

- `npm run check:status-coherence` paso.
- `npm run check:phase-contract` paso.
- `npm run check:phase-validator-sync` paso con `WARN`, pero sin desalineacion
  detectada por ese script.
- `npm run check:architecture-baseline` paso.
- `npm run test` paso.

Lectura correcta:

Estos verdes siguen siendo utiles, pero no autorizan mover el foco a nueva
construccion mientras persistan el split de canon de gates, el drift de
trazabilidad, el hueco constitucional y el baseline rojo de TypeScript/build.

## Decision operativa

Mantener el foco activo en hardening de gobernanza minima + baseline local.
No abrir nueva construccion funcional todavia.

## Siguiente paso recomendado

1. Decidir un solo canon de gates para el proyecto y alinear docs, scripts y
   checks al mismo modelo.
2. Restaurar o retirar definitivamente el set `scripts/roadmap-*.mjs`.
3. Normalizar `TRACEABILITY_MATRIX.md` y ajustar `check-trace-drift.mjs` para
   soportar celdas multi-ruta sin perder drift real.
4. Agregar `check:constitution` a `package.json` y decidir si `CONSTITUTION.md`
   sigue siendo obligatorio o debe salir del contrato del repo.
5. Corregir `typecheck` y `build`, incluyendo la migracion de `typedRoutes` y
   las dependencias/tipos rotos del baseline actual.
6. Reejecutar `npm run check:project`, `node ci/scripts/check-constitution.mjs`,
   `npm run typecheck` y `npm run build` para cerrar el rerun de hardening.
