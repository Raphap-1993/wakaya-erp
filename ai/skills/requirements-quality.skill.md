# Skill Requirements Quality

## Objetivo
Revisar y mejorar la calidad de requerimientos para que la fase 1 quede clara, trazable y lista para UX, arquitectura y SDD.

## Aplicala cuando
- hay RF o RNF ambiguos,
- el backlog inicial no esta bien cortado,
- hace falta validar consistencia entre actores, reglas e integraciones,
- hace falta detectar huecos antes de gate 0-1.

## No la apliques cuando
- todavia no existe ni siquiera una idea estructurada,
- el trabajo ya esta en implementacion y falta una `spec tecnica`, no requerimientos.

## Entradas minimas
- vision o idea estructurada,
- analisis de requerimientos,
- restricciones y backlog disponible.

## Flujo recomendado
1. Revisa ambiguedades, duplicados y vacios de RF/RNF.
2. Separa problema, regla, requerimiento y backlog.
3. Construye o actualiza la matriz de huecos de fase 1.
4. Marca reglas sin RF/RNF, RF sin backlog, RNF sin criterio, integraciones sin dueno, datos sensibles no clasificados y features visuales sin candidato SPDD.
5. Reescribe el contenido con lenguaje verificable.
6. Deja riesgos, dependencias y preguntas abiertas.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| El equipo ya sabe que significa | Debe quedar entendible fuera de la conversacion |
| El RNF es obvio | Debe tener criterio verificable |
| El backlog se ordena despues | La prioridad minima debe quedar visible para pasar a UX y arquitectura |

## Red flags
- RF sin actor o resultado observable.
- RNF genericos como "rapido" o "seguro" sin metrica.
- Reglas de negocio mezcladas con solucion tecnica.
- Integraciones o dependencias sin dueno.
- Reglas de negocio consolidadas sin RF/RNF asociado.
- Huecos abiertos sin responsable o decision de diferimiento.

## Verificacion minima
- RF numerados y entendibles.
- RNF verificables y no genericos.
- Backlog trazable a actores, reglas y objetivos.
- Matriz de huecos actualizada en `docs/fase-1-analisis-requerimientos/01.01-matriz-huecos-fase-1.md`.

## Verification evidence
- requerimientos revisados,
- ambiguedades resueltas o marcadas,
- backlog priorizado,
- riesgos y preguntas abiertas,
- matriz de huecos con responsables, impacto y estado.

## Referencias
- `../references/requirements-and-discovery.md`
- `../references/documentation-and-traceability.md`
- `../prompts/refinar-requerimientos.md`
