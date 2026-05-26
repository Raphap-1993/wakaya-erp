# Command `/test`

## Objetivo
Validar calidad con evidencia antes de aprobar una feature o release.

## Fases donde aplica mejor
- `6 - QA`

## Required inputs
- specs o criterios de aceptacion,
- riesgos conocidos,
- componentes afectados.

## Process
1. Derivar escenarios criticos desde specs y riesgos.
2. Verificar que las tareas criticas dejaron evidencia TDD o justificacion.
3. Elegir tipos de prueba necesarios.
4. Si es frontend, comparar UX/prototipo/mapping contra implementacion.
5. Ejecutar pruebas y recolectar evidencia.
6. Registrar defectos y bloqueantes.
7. Comparar contra el gate correspondiente.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Paso QA porque el flujo feliz funciona | Hace falta evidencia y cobertura por riesgo |
| No hace falta e2e porque ya compila | Compilar no valida integracion ni UX |

## Red flags
- No hay evidencia verificable.
- Frontend sin evidencia de estados UX o consistencia con prototipo.
- Los riesgos no se reflejan en la estrategia de pruebas.
- No existe criterio de salida.

## Verification evidence
- pruebas ejecutadas,
- resultado y cobertura basica,
- defectos abiertos o aceptados,
- evidencia enlazada a la feature o release.

## Artefactos relacionados
- `../skills/qa.skill.md`
- `../skills/test-driven-development.skill.md`
- `../skills/browser-testing.skill.md`
- `../skills/spec-prototype-driven-frontend.skill.md`
- `../quality-gates/gate-frontend-spdd-ready.md`
- `../quality-gates/gate-4-6.md`
