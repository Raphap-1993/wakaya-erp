# Skill Frontend

## Objetivo
Mantener una forma consistente de bajar UX y specs a modulos frontend claros y verificables.

## Aplicala cuando
- una pantalla o flujo ya fue priorizado,
- existe una definicion UX suficientemente clara,
- se necesita revisar estados, mensajes y navegacion.

## No la apliques cuando
- el flujo UX aun no esta claro,
- el trabajo principal es de arquitectura o backend.

## Entradas minimas
- UX/UI,
- `spec funcional`,
- contratos o `spec tecnica`.

## Criterios que debe reforzar
- coherencia con UX,
- estados de carga, vacio y error,
- separacion SOLID entre UI, estado, servicios y adaptadores,
- trazabilidad con criterios de aceptacion.

## Flujo recomendado
1. Revisa UX, `spec funcional` y `spec tecnica`.
2. Separa rutas, componentes, estados y mensajes.
3. Define impacto en datos mock o contratos.
4. Verifica pruebas UI, accesibilidad y e2e.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El happy path ya funciona | Faltan vacios, errores y validaciones |
| A11y la vemos luego | Los flujos criticos salen con baseline accesible |
| No hace falta e2e porque compila | Compilar no valida UX real ni integracion |

## Red flags
- No hay journey o pantalla base clara.
- Faltan estados de carga, vacio o error.
- No existe prueba visible del flujo critico.
- Componentes, stores y servicios mezclan responsabilidades sin boundary claro.
- La UI contradice criterios de aceptacion o contratos.

## Verification evidence
- pruebas frontend o e2e ejecutadas,
- resultado de build o test,
- archivos modificados,
- evidencia de responsabilidades y dependencias revisadas contra SOLID,
- trazabilidad feature -> UX -> codigo -> test.

## Salidas tipicas
- modulos UI,
- validaciones y mensajes,
- pruebas frontend y e2e.

## Referencias
- `../references/ux-accessibility-and-mocks.md`
- `../references/documentation-and-traceability.md`
- `../../docs/transversal/90.30-principios-solid-diseno-modular.md`
