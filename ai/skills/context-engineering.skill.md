# Skill Context Engineering

## Objetivo
Elegir y recortar el contexto minimo necesario para que la IA trabaje con precision sin ruido.

## Aplicala cuando
- la solicitud toca varias fases,
- hay demasiados documentos posibles para cargar,
- hace falta reducir ambiguedad antes de usar un agent o prompt.

## No la apliques cuando
- ya existe un flujo obvio y corto con pocas entradas,
- el trabajo es un cambio local muy acotado.

## Entradas minimas
- objetivo del trabajo,
- fase o modulo afectado,
- rutas candidatas disponibles.

## Flujo recomendado
1. Identifica la pregunta real a responder.
2. Selecciona solo documentos, specs y referencias minimas.
3. Descarta contexto irrelevante o historico si no cambia la respuesta.
4. Declara que contexto se uso y por que.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Mejor cargar todo por si acaso | Mas contexto no siempre mejora; puede degradar foco |
| El agent ya entendera el repo | Debe recibir el contexto minimo correcto |

## Red flags
- Carga indiscriminada de documentos.
- Mezcla de fase actual con historico irrelevante.
- Hallazgos sin explicar de que contexto salen.

## Verification evidence
- contexto seleccionado declarado,
- referencias usadas justificadas,
- rutas descartadas por no aportar.

## Referencias
- `../references/documentation-and-traceability.md`
- `../references/requirements-and-discovery.md`
