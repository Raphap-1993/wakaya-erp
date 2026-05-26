# Commands de IA

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ai](../README.md)

Esta carpeta materializa el mental model de comandos lifecycle de la capa de IA.

## Objetivo
Dar una interfaz simple para elegir la intencion operativa del trabajo:
- `/plan`
- `/document`
- `/ux`
- `/prototype`
- `/spec`
- `/build`
- `/test`
- `/review`
- `/ship`

## Regla de uso
- Un comando no reemplaza `agents`, `prompts` o `skills`; los orquesta.
- Todo comando debe terminar en una ruta canonica o en evidencia verificable.
- Si el trabajo no encaja claramente en un comando, usa `../skills/using-project-skills.skill.md`.

## Mapa rapido
| Command | Fases habituales | Objetivo |
|---|---|---|
| `/plan` | 0, 1, 2, 3 | estructurar, alinear y decidir siguiente paso |
| `/document` | 0, 1, 2, 3, 4, transversal | formalizar informacion en artefactos canonicos |
| `/ux` | 2 | generar Product Design y SPDD para tener algo validable antes de construir |
| `/prototype` | 2 | crear prototipo HTML5 o Penpot desde SPDD y dejar evidencia validable |
| `/spec` | 4 | bajar SPDD aprobado a specs tecnicas, contratos y tareas ejecutables |
| `/build` | 5 | implementar incremento minimo con worktree, TDD y trazabilidad |
| `/test` | 6 | verificar calidad, TDD, QA y evidencia |
| `/review` | 1, 2, 3, 5, 6, 8 | revisar consistencia, riesgo, codigo o salud |
| `/ship` | 7 | cerrar branch/PR y liberar con gates, rollback y monitoreo |

> **Regla clave:** `/ux` y `/document` no son equivalentes. `/document` formaliza informacion en artefactos del framework; `/ux` produce Product Design y SPDD para tener algo que mostrar y validar antes de construir. Para features visuales, `/ux` siempre precede a `/spec`.

## Commands disponibles
- [plan-command.md](plan-command.md)
- [document-command.md](document-command.md)
- [ux-command.md](ux-command.md)
- [prototype-command.md](prototype-command.md)
- [spec-command.md](spec-command.md)
- [build-command.md](build-command.md)
- [test-command.md](test-command.md)
- [review-command.md](review-command.md)
- [ship-command.md](ship-command.md)

## Flujo de delivery IA
Para ejecucion por proveedor IA, usa tambien [Feature Delivery Workflow](../references/feature-delivery-workflow.md) y [Flujo de delivery IA para proveedores](../../docs/transversal/90.33-flujo-delivery-ia-proveedores.md). El ciclo esperado es:

```text
/ux -> Product Design -> SPDD inicial -> /prototype -> gate-prototype-ready -> gate-spdd-approved -> /spec -> SDD front/back -> /build + TDD -> /review -> /test -> /ship
```

Para features visuales, `/spec` debe leer `gate-spdd-approved` antes de cerrar SDD. Ese tramo se gobierna con [Frontend SPDD Workflow](../references/frontend-spdd-workflow.md).
