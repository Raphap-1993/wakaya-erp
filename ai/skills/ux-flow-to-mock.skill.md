# Skill UX Flow To Mock

## Objetivo
Guiar el paso desde UX escrito en Markdown hasta prototipo HTML5 y Penpot sin perder trazabilidad.

## Aplicala cuando
- negocio o UX definen la experiencia primero en texto,
- se necesita validar rapidamente journeys y pantallas,
- el equipo quiere bajar UX a un mock navegable antes del frontend final.

## No la apliques cuando
- la solicitud solo pide una decision visual menor,
- todavia no hay journeys, pantallas ni reglas visibles minimas.

## Entradas minimas
- documento base de UX,
- backlog o actores,
- reglas funcionales visibles.

## Flujo recomendado
1. Ordena journeys, pantallas y estados UX.
2. Deriva mapa de pantallas y componentes clave.
3. Deja la salida lista para `/prototype` HTML5 o Penpot.
4. Si el flujo se valida, prepara la estructura para SDD y frontend real posterior.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El flujo se ve en el mock | Debe estar trazado desde Markdown UX |
| Accesibilidad se revisa luego | El criterio minimo se revisa antes del mock clickable |
| HTML5 ya es Angular | HTML5 valida flujo; Angular real se construye despues de gates |

## Red flags
- No hay journey principal.
- No hay estados de error, vacio o confirmacion.
- El prototipo y el frontend real posterior no comparten nombres de pantalla.
- El mock no se vincula con backlog o criterios de aceptacion.

## Verificacion minima
- Hay trazabilidad entre Markdown UX, prototipo HTML5/Penpot y criterios de aceptacion.
- Se cubren happy path, vacios, errores y confirmaciones.
- Se respetan criterios base de accesibilidad.

## Verification evidence
- journeys y pantallas enumeradas,
- link o referencia al prototipo HTML5/Penpot,
- estructura del prototipo HTML5,
- checklist de accesibilidad inicial.

## Referencias
- `../references/ux-accessibility-and-mocks.md`
- `../references/documentation-and-traceability.md`
- `../prompts/estructurar-ux-desde-markdown.md`
