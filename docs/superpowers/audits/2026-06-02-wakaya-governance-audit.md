# Wakaya Governance Audit

[README principal](../../../README.md) | [Indice docs](../../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Volver al indice de documentacion](../../README.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

Fecha: 2026-06-02
Agente: Viernes

## Objetivo

Auditar la gobernanza real del repo usando el foco activo documentado en
`AI_CONTEXT.md` y en
`docs/superpowers/plans/2026-06-02-wakaya-local-readiness-handoff.md`:
hardening corto del baseline antes de continuar construccion.

## Alcance

- Estado metodologico actual vs. codigo existente.
- Tooling de roadmap y validadores de gobernanza.
- Trazabilidad viva y coherencia documental.
- Drift de dominio y arquitectura en rutas canonicas del proyecto.

## Evidencia ejecutada

Comandos corridos en el repo:

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
```

## Hallazgos

### 1. Critico - El estado metodologico declarado no coincide con el codigo real

Evidencia:

- `AI_CONTEXT.md` declara fase activa `transicion 2 -> 5`, pero mantiene
  `001-reservations` y `002-public-site` bloqueadas por
  `gate-0-1`, `gate-prototype-ready` y `gate-spdd-approved`.
- `docs/transversal/90.33-flujo-delivery-ia-proveedores.md` prohíbe pasar a
  construccion mientras `gate-spdd-approved` siga pendiente.
- El repo ya contiene codigo productivo en:
  - `src/app/admin/reservations/`
  - `src/app/api/public/reservations/`
  - `src/app/api/reservations/`
  - `src/components/public-site/`
  - `src/lib/reservations/`
- `npm run check:trace-coverage` responde:
  `No hay features en fase >= 5`, lo que confirma que la gobernanza documental
  aun no reconoce la construccion ya existente.

Impacto:

- El contrato por fase no puede gobernar correctamente que esta permitido tocar.
- La memoria y los checks pueden sugerir acciones de fase equivocada.
- El repo queda en una zona gris: codigo de construccion con gates de UX/SPDD
  aun pendientes.

### 2. Critico - El comando canonico de auditoria de roadmap esta roto

Evidencia:

- `package.json` expone `roadmap:audit`, `roadmap:next`, `roadmap:sync`,
  `roadmap:status` y otros comandos que dependen de `scripts/roadmap-*.mjs`.
- `docs/transversal/90.36-roadmap-metodologico.md` y
  `docs/transversal/90.37-contrato-por-fase.md` los declaran como piezas
  operativas del metodo.
- En `scripts/` no existen esos archivos.
- `npm run roadmap:audit` falla con `MODULE_NOT_FOUND` para
  `scripts/roadmap-audit.mjs`.

Impacto:

- La red de seguridad principal del metodo no es ejecutable.
- No se puede auditar `touch_policy`, gates ni cumplimiento del contrato
  operativo que la documentacion exige.

### 3. Alto - La trazabilidad viva esta desalineada y hoy no es confiable

Evidencia:

- `TRACEABILITY_MATRIX.md` sigue mostrando `001-reservations` como `Spec inicial`
  y referencia artefactos viejos como `reservationQueryService`.
- `specs/001-reservations/traceability.md` ya declara RF implementados y
  validados con rutas reales del codigo actual.
- `npm run check:trace-drift` falla con 12 hallazgos.
- Parte del drift es real:
  - `reservationQueryService`
  - `reservationQueryTest`
- Otra parte es de formato:
  `check-trace-drift.mjs` y `scripts/ai-framework-agent.mjs` validan
  `target_ref` como una sola cadena; las celdas con multiples rutas separadas
  por comas se guardan como un solo `target_ref`, por lo que el check no puede
  resolverlas aunque los archivos existan.

Impacto:

- La memoria SQLite no puede distinguir con precision entre implementacion real,
  planned y drift.
- La matriz global y la matriz por feature se contradicen.
- Los validadores pierden valor como evidencia de gobierno.

### 4. Alto - Persisten residuos de dominio y arquitectura en documentacion viva

Evidencia:

- `docs/fase-3-arquitectura/03.00-arquitectura.md` todavia declara
  `Angular`, `Nx` y `Quarkus`, mientras el repo actual ejecuta `Next.js` +
  `Node` segun `package.json` y `src/app/`.
- `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`
  sigue hablando de `expediente` en RF-02 y HU-02.
- `docs/fase-3-arquitectura/adr/README.md` sigue publicando
  `ADR-001 - Stack Quarkus Angular y Keycloak` como entrada canónica.
- El scan textual encontro residuos relevantes en docs y ops de rutas canonicas
  del proyecto, no solo en `ejemplos/` o `plantillas/`.

Impacto:

- Viola la regla explicita de `AGENTS.md` de corregir residuos de
  `expedientes/bandeja` antes de avanzar.
- La arquitectura viva no representa el baseline real sobre el que se esta
  trabajando.

### 5. Medio - El pipeline de validacion de gobernanza no esta completo

Evidencia:

- `npm run check:validation-coverage` detecta
  `ci/scripts/check-constitution.mjs` como validador fisico no invocado por
  `check:project`.

Impacto:

- Existe al menos una regla de gobernanza presente en el repo que no participa
  del pipeline principal.
- Un `check:project` verde no garantiza cobertura completa de los validadores
  disponibles.

## Señales en verde

- `npm run check:status-coherence` paso.
- `npm run check:phase-contract` paso.
- `npm run check:feature-dependencies` paso.
- `npm run check:instantiation` paso.
- `npm run check:architecture-baseline` paso.

Lectura correcta: el baseline documental general existe, pero hay drift serio
entre metodo declarado, toolchain de roadmap, matrices de trazabilidad y stack
real en construccion.

## Decision operativa

No conviene abrir nueva construccion funcional hasta cerrar hardening de
gobernanza minima.

## Siguiente paso recomendado

1. Reparar o reinstalar el set `scripts/roadmap-*.mjs` para recuperar
   `roadmap:audit`, `roadmap:status` y `roadmap:next`.
2. Normalizar `TRACEABILITY_MATRIX.md` y `specs/*/traceability.md` para que
   reflejen el mismo estado y usen un formato compatible con los validadores.
3. Decidir con humano si el codigo actual queda reconocido como construccion
   valida o si debe reubicarse como prototipo/hardening previo a gates.
4. Actualizar la arquitectura y los residuos de dominio en docs canonicos
   antes de seguir tocando funcionalidad.
5. Agregar `check:constitution` al pipeline principal o documentar por que se
   excluye.
