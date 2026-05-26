# Spec tareas - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Contexto
- Feature: 001-reservations.
- Product Design: product-design.md.
- SPDD: spdd-frontend.md y prototype-validation.md.
- Rama sugerida: feat/001-reservations.
- Worktree sugerido: ../worktrees/001-reservations.
- Gate previo visual: gate-spdd-approved.
- Gate construccion: gate-4-6.

## T-001 - Contrato de consulta de reservations
Estado: pendiente

Objetivo:
Definir y validar el contrato de consulta de reservations.

Entradas:
- spec-funcional.md.
- spec-tecnica.md.
- ADR-001.

Archivos permitidos:
- backend/.
- specs/001-reservations/spec-tecnica.md.

Ciclo TDD:
1. Red: crear prueba de contrato para GET /api/reservations con permiso reservation:read.
2. Green: implementar respuesta minima con campos id, numero, estado, prioridad y responsable.
3. Refactor: separar DTO, recurso y servicio si aplica.

Comandos de verificacion:
```powershell
cd backend
mvn test
```

Evidencia esperada:
- prueba de contrato creada,
- test pasando,
- trazabilidad a RF-01.

## T-002 - Frontend desde prototipo validado
Estado: pendiente

Objetivo:
Implementar o ajustar el modulo reservations Angular con filtros, tabla, detalle y estados UX.

Entradas:
- specs/001-reservations/prototype.md.
- specs/001-reservations/prototype-validation.md.
- docs/fase-5-construccion/05.01-spec-prototype-driven-development-frontend.md.
- spec-funcional.md.

Archivos permitidos:
- frontend/apps/web/.
- frontend/libs/feature-reservations/.

Ciclo TDD:
1. Red: crear prueba de componente para estado empty o filtro por estado.
2. Green: implementar comportamiento minimo.
3. Refactor: extraer datos mock y nombres consistentes con el prototipo validado.

Comandos de verificacion:
```powershell
cd frontend
npm run typecheck
npm run test
```

Evidencia esperada:
- prueba de componente o unit test,
- typecheck pasando,
- diferencias contra prototipo registradas si existen,
- trazabilidad a UX y RF-01.

## T-003 - Revision y evidencia QA
Estado: pendiente

Objetivo:
Revisar cambios criticos y registrar evidencia QA para gate-4-6.

Entradas:
- T-001 y T-002 completadas.
- qa/fase-6-qa/plan-pruebas.md.

Archivos permitidos:
- qa/fase-6-qa/.
- specs/001-reservations/spec-tareas.md.

Ciclo TDD:
1. Red: no aplica; tarea de evidencia.
2. Green: ejecutar pruebas definidas.
3. Refactor: consolidar defectos y observaciones.

Comandos de verificacion:
```powershell
cd backend
mvn test

cd ..\frontend
npm run typecheck
npm run test
```

Evidencia esperada:
- resultado de pruebas,
- code review de cambios criticos,
- defectos o riesgos residuales,
- gate-4-6 aprobado, aprobado con observaciones o bloqueado.
