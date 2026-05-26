# Skill: Design System Mapping

## Objetivo
Asegurar que Penpot, tokens UX, prototipo HTML5 y frontend productivo usen componentes reutilizables, nombres consistentes y estados equivalentes.

## Aplicala cuando
- se crea o actualiza un prototipo Penpot,
- se prepara frontend real desde UX validado,
- se implementa frontend desde prototipo,
- aparece un componente visual nuevo.

## No la apliques cuando
- el trabajo no toca UX, UI ni frontend,
- solo se corrige texto sin impacto visual,
- el sistema de componentes ya fue validado y no hay cambios.

## Entradas minimas
- prototipo HTML5/Penpot o evidencia SPDD,
- sistema de componentes UX,
- criterios de componentes para frontend posterior,
- spec funcional o criterios UX.

## Flujo recomendado
1. Identifica componentes repetidos.
2. Normaliza nombres entre prototipo, Penpot si aplica y frontend posterior.
3. Declara variantes y estados obligatorios.
4. Relaciona cada componente con su uso previsto y ruta frontend sugerida si ya existe SDD.
5. Registra decisiones pendientes de libreria UI como ADR si aplica.
6. Valida que no existan pantallas con elementos sueltos repetidos.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Es solo prototipo | El prototipo define lenguaje visual y componentes candidatos para el frontend. |
| Luego se ordena en Angular | Si no hay mapping ahora, el frontend hereda inconsistencias. |
| El design system no aplica aun | Al menos deben existir nombres, estados y variantes minimas. |

## Red flags
- inputs, botones o cards duplicados como formas sueltas,
- variantes sin estado focus, disabled, error o loading,
- componente frontend sin origen en prototipo o sistema de componentes,
- nombres distintos sin justificacion,
- decision de Angular Material, PrimeNG, Tailwind UI o libreria propia sin ADR.

## Verification evidence
- tabla de componentes Penpot,
- tabla de componentes y rutas frontend sugeridas cuando aplique,
- estados cubiertos,
- desviaciones registradas,
- ADR o decision tecnica si se adopta una libreria UI.

## Referencias
- `../references/ux-accessibility-and-mocks.md`
- `../references/product-design-workflow.md`
- `../references/frontend-spdd-workflow.md`
