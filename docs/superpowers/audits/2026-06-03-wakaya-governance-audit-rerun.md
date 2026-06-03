# Wakaya Governance Audit - Rerun

[README principal](../../../README.md) | [Indice docs](../../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Volver al indice de documentacion](../../README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

Fecha: 2026-06-03
Agente: Viernes

## Objetivo

Re-ejecutar la auditoria de gobernanza sobre el foco activo vigente:
hardening corto del baseline antes de seguir construccion.

Este rerun extiende el follow-up del `2026-06-03` y confirma el estado real del
repo con evidencia fresca de validadores, pipeline y baseline local.

## Alcance

- Tooling canonico de roadmap y validadores del metodo.
- Coherencia entre gates declarados, contrato por fase y codigo ya existente.
- Trazabilidad global vs. trazabilidad por feature.
- Estado del baseline local antes de abrir nueva construccion.

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
```

## Hallazgos

### 1. Critico - El tooling canonico de roadmap sigue roto

Evidencia:

- `package.json` expone `roadmap:audit`, `roadmap:next`, `roadmap:sync`,
  `roadmap:prompt`, `roadmap:claim`, `roadmap:release` y `roadmap:status`.
- `scripts/` solo contiene:
  - `scripts/ai-framework-agent.mjs`
  - `scripts/migrate.js`
  - `scripts/seed.js`
- `npm run roadmap:audit` falla con `MODULE_NOT_FOUND` porque
  `scripts/roadmap-audit.mjs` no existe.

Impacto:

- El comando canonico para auditar touch-policy y fase no es ejecutable.
- Cualquier documentacion que remita a `roadmap:*` hoy promete un flujo que el
  repo no puede correr.

### 2. Critico - El canon de gates del repo no coincide con el de los validadores

Evidencia:

- `docs/README.md` usa `gate-4-6` para fases 4, 5 y 6, y `gate-7-8` para fases
  7 y 8.
- `docs/transversal/90.33-flujo-delivery-ia-proveedores.md` tambien declara
  `gate-4-6` y `gate-7-8` como gates reales del proyecto.
- `ci/scripts/check-phase-contract.mjs` infiere fase usando otro canon:
  `gate-sdd-approved`, `gate-build-ready`, `gate-qa-passed`,
  `gate-deploy-ready`, `gate-operations-ready`.
- `ci/scripts/_lib/phase-contracts.mjs` publica el mismo canon alterno.

Impacto:

- El pipeline puede dar verde sobre un modelo de fases distinto al que la
  documentacion oficial del repo declara.
- El contrato de ejecucion no es una sola fuente de verdad; hoy hay al menos
  dos constituciones en conflicto.

### 3. Critico - El pipeline principal sigue omitiendo un control que hoy falla

Evidencia:

- `npm run check:validation-coverage` reporta que `check-constitution.mjs` no
  participa en `check:project`.
- `package.json` no define `check:constitution`.
- `node ci/scripts/check-constitution.mjs` falla con:
  `CONSTITUTION.md:1: no existe en la raiz`.

Impacto:

- `check:project` puede quedar verde mientras el repo incumple un control
  estricto real.
- Falta tanto el artefacto raiz (`CONSTITUTION.md`) como su inclusion en el
  pipeline principal.

### 4. Alto - La trazabilidad global sigue contradiciendo el estado real

Evidencia:

- `TRACEABILITY_MATRIX.md` sigue anclada a una sola fila `RF-01`, con
  `reservationQueryService`, `reservationQueryTest` y estado `Spec inicial`.
- `specs/001-reservations/traceability.md` ya declara RF `01-06` y `RNF-01`
  como `Implementado y validado` con rutas reales de codigo y tests.
- `specs/002-public-site/traceability.md` sigue en diseno SPDD, lo que confirma
  que el rollup global tampoco refleja el split actual entre monitor interno y
  feature publica.

Impacto:

- La matriz global no sirve como vista consolidada confiable.
- La memoria derivada de trazabilidad queda expuesta a contradicciones entre el
  rollup y el detalle por feature.

### 5. Alto - Hallazgo historico previo a Task 4: `check:trace-drift` mezclaba drift real con falsos negativos

Actualizacion Task 4:

- Este hallazgo quedo resuelto en `HEAD d627a0a40162b0570f8c71a82e56796a7f0571db`.
- Ver addendum al final: `npm run check:trace-drift` ahora pasa con
  `60 trace links validados; cero drift`.

Evidencia del estado previo:

- `npm run check:trace-drift` reportaba `12` hallazgos.
- Drift real confirmado:
  - `reservationQueryService`
  - `reservationQueryTest`
- Falsos negativos confirmados:
  - varias celdas de `Codigo` y `Test` en
    `specs/001-reservations/traceability.md` contienen multiples rutas
    separadas por coma.
  - `ci/scripts/check-trace-drift.mjs` valida `target_ref` como una sola cadena
    y nunca separa multiples rutas antes de resolverlas.

Impacto:

- El validador no puede distinguir bien entre referencia rota y formato de
  trazabilidad multi-ruta.
- El ruido reduce el valor del check como evidencia de gobierno.

### 6. Alto - `check:trace-coverage` sigue ciego a la construccion real del repo

Evidencia:

- `npm run check:trace-coverage` responde:
  `OK. No hay features en fase >= 5`.
- La heuristica del script solo reconoce construccion por `phase` declarada en
  `ai_documents` o por existencia de `src/<feature>`.
- El codigo real vive en rutas operativas de Next.js como:
  - `src/app/admin/reservations/`
  - `src/app/api/reservations/`
  - `src/app/api/public/reservations/`
  - `src/lib/reservations/`
- `specs/001-reservations/traceability.md` sigue con `gate-spdd-approved`
  pendiente, de modo que el contrato documental tampoco empuja a fase 5.

Impacto:

- El check emite falso verde mientras ya existe construccion real en el repo.
- La cobertura automatica no esta gobernando el layout verdadero del proyecto.

### 7. Alto - Persisten residuos de stack y dominio en documentacion canonica

Evidencia:

- `docs/fase-3-arquitectura/03.00-arquitectura.md` sigue declarando
  `Angular`, `Nx` y `Quarkus`.
- `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md` sigue
  usando `expediente` en `RF-02` y `HU-02`.
- `docs/fase-3-arquitectura/adr/README.md` ya incluye `ADR-011` para Next.js,
  pero mantiene como primera entrada canonica `ADR-001 - Stack Quarkus Angular y Keycloak`.

Impacto:

- Se incumple la regla de `AGENTS.md` de limpiar residuos de
  `expedientes/bandeja` antes de avanzar.
- La arquitectura publicada sigue sin representar con claridad el baseline vivo.

### 8. Medio - Hallazgo historico previo a Task 4: el foco activo de hardening seguia abierto por baseline local

Actualizacion Task 4:

- `npm run typecheck` y `npm run build` quedaron verdes en el mismo `HEAD`
  verificado del addendum.
- El foco de hardening sigue abierto, pero el primer fallo actual de
  `npm run check:project` ya no es baseline local; ahora es
  `check:bd-documented`.

Evidencia del estado previo:

- `npm run test` pasa: `24/24` tests verdes.
- `npm run typecheck` fallaba en:
  - `src/app/api/public/reservations/route.ts`
  - `src/components/public-site/play-header.tsx`
  - `src/lib/i18n.ts`
  - `src/lib/pii-redact.ts`
  - `tests/contract/resource.pact.test.ts`
- `npm run build` compilaba, pero caia luego en TypeScript por el mismo error
  inicial de `src/app/api/public/reservations/route.ts`.

Impacto:

- El baseline todavia no esta listo para nueva construccion funcional.
- El foco correcto sigue siendo hardening de gobernanza minima + baseline local.

## Señales en verde

- `npm run check:status-coherence` paso.
- `npm run check:phase-contract` paso.
- `npm run check:phase-validator-sync` paso con `WARN`, pero sin desalineacion
  reportada por ese check.
- `npm run check:architecture-baseline` paso.
- `npm run test` paso.

Lectura correcta: los verdes actuales siguen siendo insuficientes porque varios
de ellos validan un modelo de gates/fases que no coincide con el canon operativo
que la documentacion principal del repo publica.

## Decision operativa

No abrir nueva construccion funcional. El repo sigue en hardening de
gobernanza minima; el baseline local minimo ya quedo verde en este slice.

## Siguiente paso recomendado

1. Documentar `rbac`, `leads` y `requests` en las specs tecnicas canonicas para
   cerrar el primer fallo actual de `npm run check:project`
   (`check:bd-documented`).
2. Corregir la deteccion de construccion real en `check:trace-coverage` para el
   layout actual de Next.js o declarar fase 5 donde ya corresponda.
3. Limpiar residuos de `expediente`, `Angular`, `Nx` y `Quarkus` en rutas
   canonicas antes de seguir construyendo.
4. Restaurar o retirar definitivamente el set `scripts/roadmap-*.mjs`.

## Backlog diferido fuera de este slice

- Decidir un solo canon de gates para el proyecto y alinear docs, scripts y
  checks al mismo modelo.
- Agregar `check:constitution` a `package.json`, incluirlo en `check:project`
  y restaurar `CONSTITUTION.md` si sigue siendo obligatorio.

## Addendum - Task 4 QA rerun

Fecha: 2026-06-03
HEAD verificado: `d627a0a40162b0570f8c71a82e56796a7f0571db`

Evidencia fresca:

- `npm run check:trace-drift` -> OK. `60 trace links validados; cero drift.`
- `npm run check:project` -> FAIL en `check:bd-documented`.
- `npm run typecheck` -> OK.
- `npm run build` -> OK con warning preexistente de multiple lockfiles.
- `npm run test` -> no rerun; no fue necesario tras el fallo de gobernanza.

Primer fallo actual en `npm run check:project`:

- `BD SIN DOCUMENTAR: 5 tabla(s) sin marca canonica en spec-tecnica.md`
- `rbac` declarada por `RNF-01` en `specs/001-reservations/traceability.md`
- `leads` declarada por `RF-04`, `RF-05` y `RF-06` en `specs/002-public-site/traceability.md`
- `requests` declarada por `RF-07` en `specs/002-public-site/traceability.md`

Nota:

- No fue necesario correr `npm run memory:sync:quick`; el fallo proviene de validacion directa sobre trazabilidad y specs canonicas.
- `CONSTITUTION.md`, `check:constitution` y la unificacion del canon de gates siguen intencionalmente fuera del alcance de este slice; el rerun solo confirma que el siguiente blocker veraz ahora es `check:bd-documented`.
