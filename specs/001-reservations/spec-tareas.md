# Spec tareas - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Contexto
- Feature: `001-reservations`.
- Spec funcional: `spec-funcional.md`.
- Spec tecnica: `spec-tecnica.md`.
- Reglas canonicas: `reglas-negocio-estados-criterios.md`.
- UX/prototipo: `spdd-frontend.md`, `prototype.md`, `prototype-validation.md`.
- Rama sugerida: `feat/001-reservations`.
- Worktree sugerido: `../worktrees/001-reservations`.
- Gate de entrada a construccion: `gate-4-6`.

## Regla
Cada tarea debe ser pequena, ejecutable y verificable. No usar tareas genericas. Cada tarea debe cerrar una pieza concreta del dominio.

## T-001 - Modelo de datos de reservas y ocupacion

Estado: completada

Objetivo:
Definir el esquema de datos canonico para reservas, bungalows, bloqueos de ocupacion y auditoria.

Entradas:
- `spec-tecnica.md`
- `reglas-negocio-estados-criterios.md`

Archivos permitidos:
- `src/app/api/**`
- `src/lib/**`
- `scripts/**`
- `prisma/**` o la capa de migraciones equivalente del proyecto
- `specs/001-reservations/spec-tecnica.md`

Ciclo TDD:
1. Red: prueba de esquema o contrato que falle si faltan `reservation`, `bungalow`, `reservation_occupancy` o `reservation_audit`.
2. Green: agregar el modelo minimo y la migracion inicial.
3. Refactor: alinear nombres, indices y restricciones unicas.

Comandos de verificacion:
```powershell
npm run typecheck
npm run test
npm run check:bd-documented
```

Evidencia esperada:
- esquema y capa de persistencia creados,
- test de persistencia y validacion de schema pasando,
- trazabilidad a las reglas del dominio.

Trazabilidad:
- RF-01, RF-03, RF-05
- Criterio de aceptacion: no solape de inventario por bungalow y fecha.

Evidencia:
- `src/lib/reservations/sqlite-persistence.ts`
- `src/lib/reservations/persistence.test.ts`

## T-002 - Servicio de disponibilidad y bloqueo atomico

Estado: completada

Objetivo:
Implementar la validacion de solape y el bloqueo atomico de noches por bungalow.

Entradas:
- `spec-tecnica.md`
- `reglas-negocio-estados-criterios.md`

Archivos permitidos:
- `src/lib/**`
- `src/app/api/reservations/**`
- `src/app/api/intake/**`
- `tests/**`

Ciclo TDD:
1. Red: prueba que falle cuando dos reservas intentan ocupar la misma noche.
2. Green: implementar bloqueo atomico y validacion de conflicto.
3. Refactor: extraer helper de disponibilidad y normalizar errores.

Comandos de verificacion:
```powershell
npm run test
npm run typecheck
```

Evidencia esperada:
- prueba de no solape pasando,
- bloqueo atomico aplicado,
- respuesta consistente ante conflicto.

Trazabilidad:
- RF-01, RF-03, RF-04
- Criterio de aceptacion: una sola fuente de verdad para disponibilidad.

Evidencia:
- `src/lib/reservations/store.ts`
- `tests/unit/reservations/store.test.ts`

## T-003 - Maquina de estados y auditoria de reservas

Estado: completada

Objetivo:
Definir y aplicar las transiciones permitidas de una reserva y dejar auditoria completa de cada cambio.

Entradas:
- `spec-funcional.md`
- `reglas-negocio-estados-criterios.md`

Archivos permitidos:
- `src/lib/**`
- `src/app/api/reservations/**`
- `src/app/api/audit/**`
- `tests/**`

Ciclo TDD:
1. Red: prueba de transicion invalida que deba fallar.
2. Green: implementar transiciones validas y escritura en audit log.
3. Refactor: separar regla de dominio de persistencia.

Comandos de verificacion:
```powershell
npm run test
npm run typecheck
```

Evidencia esperada:
- transiciones validas e invalidas cubiertas,
- auditoria con actor, accion, estado anterior, estado nuevo y motivo,
- trazabilidad estable.

Trazabilidad:
- RF-04, RF-05
- Criterio de aceptacion: toda transicion valida deja evidencia.

Evidencia:
- `src/lib/reservations/state-machine.ts`
- `src/lib/reservations/audit.ts`
- `src/lib/reservations/store.ts`

## T-004 - API de monitor interno de reservas

Estado: completada

Objetivo:
Exponer el listado, detalle, filtros y acciones operativas del mini monitor interno.

Entradas:
- `spec-funcional.md`
- `spec-tecnica.md`
- `spdd-frontend.md`

Archivos permitidos:
- `src/app/api/reservations/**`
- `src/app/api/reservations/[id]/**`
- `src/components/**`
- `tests/**`

Ciclo TDD:
1. Red: prueba de contrato para listado y detalle con permiso `reservation:read`.
2. Green: implementar respuesta minima con filtros por estado, fecha y responsable.
3. Refactor: separar DTO, handler y servicio si aplica.

Comandos de verificacion:
```powershell
npm run test:contract
npm run typecheck
npm run test
```

Evidencia esperada:
- contrato de API creado,
- filtros basicos funcionando,
- permisos aplicados en servidor.

Trazabilidad:
- RF-01, RF-02, RF-05
- Criterio de aceptacion: el monitor muestra la verdad operativa de la reserva.

Evidencia:
- `src/app/api/reservations/route.ts`
- `src/app/api/reservations/[id]/route.ts`
- `src/app/api/reservations/[id]/assign/route.ts`
- `src/app/api/reservations/[id]/status/route.ts`
- `src/app/api/reservations/[id]/audit/route.ts`
- `src/app/api/reservations/route.test.ts`
- `src/app/api/reservations/[id]/route.test.ts`
- `src/app/api/reservations/[id]/assign/route.test.ts`
- `src/app/api/reservations/[id]/status/route.test.ts`
- `src/app/api/reservations/[id]/audit/route.test.ts`

## T-005 - UI del mini monitor de reservas

Estado: completada

Objetivo:
Implementar la lista, detalle y acciones visibles del monitor interno en la app Next.js.

Entradas:
- `spdd-frontend.md`
- `prototype.md`
- `prototype-validation.md`

Archivos permitidos:
- `src/app/**`
- `src/components/**`
- `src/lib/**`
- `tests/**`

Ciclo TDD:
1. Red: prueba de componente para estados `loading`, `empty`, `error` y `success`.
2. Green: implementar el listado, detalle y estados visibles.
3. Refactor: extraer componentes reutilizables y nombres consistentes.

Comandos de verificacion:
```powershell
npm run typecheck
npm run test
npm run test:e2e
```

Evidencia esperada:
- pantalla funcional con filtros y detalle,
- estados UX visibles,
- coherencia con el prototipo.

Evidencia:
- `src/app/admin/reservations/page.tsx`
- `src/app/admin/reservations/page.test.tsx`
- `src/app/admin/reservations/reservations-monitor.tsx`
- `src/app/admin/reservations/reservations-monitor-detail-panel.tsx`
- `src/app/admin/reservations/reservations-monitor-table.tsx`
- `e2e/admin-reservations.spec.ts`
- `src/app/admin/reservations/[id]/page.tsx`
- `src/app/admin/reservations/[id]/page.test.tsx`

Trazabilidad:
- RF-01, RF-02, RF-03, RF-04, RF-05
- Criterio de aceptacion: recepcion puede operar reservas sin ambiguedad.

## T-006 - Validacion y evidencia de QA

Estado: completada

Objetivo:
Consolidar evidencia de pruebas y dejar listo el gate `gate-4-6`.

Entradas:
- T-001 a T-005 completadas.
- `docs/fase-6-qa/06.00-plan-pruebas.md`

Archivos permitidos:
- `qa/**`
- `specs/001-reservations/**`

Ciclo TDD:
1. Red: no aplica; es tarea de consolidacion.
2. Green: ejecutar pruebas de unidad, contrato y E2E.
3. Refactor: resumir hallazgos, defectos y riesgos.

Comandos de verificacion:
```powershell
npm run test
npm run test:contract
npm run test:e2e
npm run check:project
```

Evidencia esperada:
- evidencia QA consolidada,
- riesgos residuales documentados,
- estado del gate actualizado.

Evidencia:
- `qa/fase-6-qa/plan-pruebas.md`
- `qa/fase-6-qa/reservations-monitor-ui-evidence.md`
- `specs/001-reservations/prototype-validation.md`

Trazabilidad:
- RF-01 a RF-05
- Criterio de aceptacion: no cerrar el feature sin evidencia.

## Checklist de cierre
- [x] Todas las tareas tienen estado.
- [x] Tareas criticas tienen evidencia TDD.
- [x] Cambios de datos, contrato o seguridad tienen review antes de QA.
- [x] La UI coincide con el prototipo validado.
- [x] La disponibilidad no permite solape.
- [x] La auditoria registra toda transicion.
- [x] Pruebas ejecutadas y registradas.
- [x] Preguntas abiertas o bloqueantes documentadas.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
