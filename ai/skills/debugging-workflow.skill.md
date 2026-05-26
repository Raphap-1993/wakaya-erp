# Skill Debugging Workflow

## Objetivo
Investigar fallos de forma disciplinada, reproduciendo sintomas y reduciendo el espacio de causa probable.

## Aplicala cuando
- hay un bug reproducible o intermitente,
- falla una prueba, un build o un flujo,
- hace falta proponer una hipotesis tecnica con evidencia.

## No la apliques cuando
- la solicitud real es discovery o documentacion funcional,
- no existe ningun sintoma observable todavia.

## Entradas minimas
- sintoma o error,
- contexto de reproduccion,
- logs, pruebas o pasos disponibles.

## Flujo recomendado
1. Reproducir el fallo.
2. Reducir el caso al minimo.
3. Formular hipotesis.
4. Validar o descartar hipotesis con evidencia.
5. Aplicar fix minimo y volver a probar.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Seguro es flaky | Primero hay que intentar reproducir o aislar el patron |
| Meto un parche defensivo | Sin causa probable validada, el riesgo sigue abierto |

## Red flags
- No hay reproduccion del fallo.
- Se cambia demasiado codigo de una vez.
- El fix no agrega o ajusta pruebas.

## Verification evidence
- pasos de reproduccion,
- prueba o log que falla,
- prueba o evidencia que pasa tras el fix,
- archivos modificados y alcance del cambio.

## Referencias
- `../references/documentation-and-traceability.md`
- `../references/quality-release-and-operations.md`
