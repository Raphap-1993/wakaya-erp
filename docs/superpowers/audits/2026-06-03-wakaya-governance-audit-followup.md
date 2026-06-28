# Wakaya Governance Audit - Follow-up

[README principal](../../../README.md) | [Indice docs](../../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Volver al indice de documentacion](../../README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

Fecha: 2026-06-03
Agente: Viernes

## Objetivo

Revalidar la gobernanza del repo usando el foco activo vigente:
hardening corto del baseline antes de seguir construccion.

Este follow-up compara el estado actual contra el audit del `2026-06-02`
documentado en `docs/superpowers/audits/2026-06-02-wakaya-governance-audit.md`.

## Alcance

- Delta del estado metodologico y del pipeline de gobernanza.
- Coherencia entre gates, trazabilidad y codigo realmente presente.
- Estado del foco activo de hardening local.

## Evidencia ejecutada

```sh
npm run roadmap:audit
npm run check:status-coherence
npm run check:trace-drift
npm run check:phase-contract
npm run check:feature-dependencies
npm run check:trace-coverage
npm run check:validation-coverage
npm run check:instantiation
npm run check:architecture-baseline
npm run check:phase-validator-sync
node ci/scripts/check-constitution.mjs
npm run test
npm run typecheck
npm run build
```

## Hallazgos

### 1. Critico - La gobernanza sigue ciega al estado real de construccion

Evidencia:

- `AI_CONTEXT.md` mantiene la fase activa como `transicion 2 -> 5`.
- `001-reservations` y `002-public-site` siguen con gates UX/SPDD pendientes.
- El repo ya tiene codigo ejecutable en:
  - `src/app/admin/reservations/`
  - `src/app/api/reservations/`
  - `src/app/api/public/reservations/`
  - `src/components/public-site/`
  - `src/lib/reservations/`
- `npm run check:trace-coverage` sigue respondiendo:
  `No hay features en fase >= 5`.
- La razon ya no es solo documental: `ci/scripts/check-trace-coverage.mjs`
  detecta construccion por fase declarada en Markdown o por existencia de
  una carpeta `src/<feature>`; el layout real de Next.js no usa una carpeta
  slugged por feature como `001-reservations` bajo `src/`
  sino rutas operativas bajo `src/app/...`, por lo que la heuristica no ve la
  construccion actual.
- `ci/scripts/check-phase-contract.mjs` infiere la fase solo desde gates
  aprobados en `traceability.md`; como `gate-spdd-approved` sigue pendiente,
  la feature permanece efectivamente en fase 2 para el contrato.

Impacto:

- El contrato de fase y la cobertura de trazabilidad pueden dar falso verde.
- La construccion real sigue fuera del perimetro que los checks creen gobernar.
- El foco activo de hardening existe, pero la automatizacion no lo representa.

### 2. Critico - El tooling canonico de roadmap sigue inexistente

Evidencia:

- `package.json` expone `roadmap:audit`, `roadmap:next`, `roadmap:sync`,
  `roadmap:prompt`, `roadmap:claim`, `roadmap:release` y `roadmap:status`.
- `scripts/` solo contiene:
  - `scripts/ai-framework-agent.mjs`
  - `scripts/migrate.js`
  - `scripts/seed.js`
- `npm run roadmap:audit` falla con `MODULE_NOT_FOUND` para
  el archivo faltante `roadmap-audit.mjs` dentro de `scripts/`.

Impacto:

- La ruta canonica para auditar touch-policy y transiciones de fase no existe.
- Los contratos descritos en `docs/transversal/90.36-roadmap-metodologico.md`
  y `ci/scripts/_lib/phase-contracts.mjs` no son ejecutables desde el repo actual.

### 3. Critico - El pipeline principal esta ocultando un incumplimiento constitucional real

Evidencia:

- `npm run check:validation-coverage` detecta que
  `ci/scripts/check-constitution.mjs` no participa en `check:project`.
- `package.json` no define `check:constitution`.
- La ejecucion directa `node ci/scripts/check-constitution.mjs` falla con:
  `CONSTITUTION.md:1: no existe en la raiz`.

Impacto:

- El pipeline principal puede declararse saludable mientras omite un control
  estricto que hoy falla de verdad.
- No solo falta cobertura de validadores; falta tambien el artefacto raiz que
  define principios del proyecto.

### 4. Alto - La trazabilidad viva sigue mezclando drift real con falsos negativos del parser

Evidencia:

- `TRACEABILITY_MATRIX.md` sigue anclada a `Spec inicial` y a referencias
  obsoletas como `reservationQueryService` y `reservationQueryTest`.
- `specs/001-reservations/traceability.md` ya declara codigo y tests reales.
- `npm run check:trace-drift` sigue reportando 12 links con drift.
- Parte del drift es real:
  - `reservationQueryService`
  - `reservationQueryTest`
- Parte del drift es falso negativo: los archivos reportados si existen, pero
  `ci/scripts/check-trace-drift.mjs` trata la celda completa como un solo
  `target_ref` y no separa multiples rutas por coma.

Impacto:

- La matriz global y la matriz por feature siguen contradiciendose.
- El validador no distingue bien entre inconsistencia real y formato invalido.
- La memoria derivada de trazabilidad pierde confiabilidad operativa.

### 5. Alto - Persisten residuos de dominio y stack en documentacion canonica

Evidencia:

- `docs/fase-3-arquitectura/03.00-arquitectura.md` sigue declarando
  `Angular`, `Nx` y `Quarkus`.
- `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`
  sigue hablando de `expediente` en `RF-02` y `HU-02`.
- `docs/fase-3-arquitectura/adr/README.md` sigue publicando como entrada
  principal `ADR-001 - Stack Quarkus Angular y Keycloak`.

Impacto:

- Sigue incumpliendose la regla explicita de `AGENTS.md` sobre corregir
  residuos de `expedientes/bandeja` antes de avanzar.
- La arquitectura viva publicada al equipo no coincide con el baseline real
  que hoy corre sobre Next.js + Node.

### 6. Medio - El foco activo de hardening sigue vigente y sin cierre

Evidencia:

- `npm run test` pasa: `24/24` tests verdes.
- `npm run typecheck` sigue fallando en:
  - `src/app/api/public/reservations/route.ts`
  - `src/components/public-site/play-header.tsx`
  - `src/lib/i18n.ts`
  - `src/lib/pii-redact.ts`
  - `tests/contract/resource.pact.test.ts`
- `npm run build` compila, pero cae en TypeScript por el mismo primer error.
- `next.config.mjs` todavia usa `experimental.typedRoutes`, y `next build`
  emite warning de migracion hacia `typedRoutes`.

Impacto:

- El foco operativo correcto sigue siendo hardening antes de nueva construccion.
- No existe evidencia para mover el baseline a un estado buildable y gobernado.

## Señales en verde

- `npm run check:status-coherence` paso.
- `npm run check:phase-contract` paso.
- `npm run check:feature-dependencies` paso.
- `npm run check:instantiation` paso.
- `npm run check:architecture-baseline` paso.
- `npm run check:phase-validator-sync` paso.
- `npm run test` paso.

Lectura correcta: estos verdes siguen siendo utiles, pero no alcanzan para
declarar gobernanza sana mientras el pipeline no detecta construccion real,
omite `check-constitution` y conserva tooling canonico roto.

## Decision operativa

No abrir nueva construccion funcional. El repo sigue en hardening de
gobernanza minima + baseline local.

## Siguiente paso recomendado

1. Restaurar o retirar el set `scripts/roadmap-*.mjs` para que el contrato de
   roadmap vuelva a ser ejecutable.
2. Agregar `check:constitution` a `package.json`, incluirlo en
   `check:project` y restaurar `CONSTITUTION.md` si sigue siendo parte del
   canon del framework.
3. Alinear la deteccion de fase/construccion con el layout real del proyecto
   en Next.js, o declarar explicitamente fase 5 donde ya existe codigo real.
4. Normalizar `TRACEABILITY_MATRIX.md` y ajustar `check-trace-drift.mjs` para
   soportar multiples rutas por celda sin perder el drift real.
5. Limpiar residuos de `expediente`, `Angular`, `Nx` y `Quarkus` en rutas
   canonicas antes de seguir construyendo.
6. Cerrar `typecheck` y `build`, luego rerun completo de validadores y
   sincronizacion de memoria.
