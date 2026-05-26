# Skill Browser Testing

## Objetivo
Validar comportamiento navegador a navegador, e2e, a11y y estados visibles con evidencia reproducible.

## Aplicala cuando
- una feature toca flujos visibles al usuario,
- hace falta validar UX real, e2e o accesibilidad,
- se prepara QA o release de frontend.

## No la apliques cuando
- el cambio es puramente backend sin superficie visible,
- no existe un flujo o ambiente navegable minimo.

## Entradas minimas
- flujo UX o feature,
- criterios de aceptacion,
- ambiente o mock navegable.

## Flujo recomendado
1. Identifica escenarios criticos visibles.
2. Ejecuta pruebas e2e y, si aplica, a11y.
3. Verifica happy path, errores, vacios y confirmaciones.
4. Registra evidencia y defectos.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Si paso unit tests, no hace falta navegador | UI real y e2e validan otra capa de riesgo |
| A11y la vemos despues | Flujos criticos deben nacer con baseline accesible |

## Red flags
- No hay prueba del flujo visible.
- No se revisaron errores o estados vacios.
- La accesibilidad se omite en flujos criticos.

## Verification evidence
- pruebas e2e ejecutadas,
- evidencias de navegador o reportes,
- defectos visibles registrados.

## Referencias
- `../references/ux-accessibility-and-mocks.md`
- `../references/quality-release-and-operations.md`
