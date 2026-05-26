# Prompt Refinar Requerimientos

## Objetivo
Revisar y mejorar requerimientos para que queden claros, trazables y listos para UX, arquitectura y SDD.

## Usalo cuando
- existen RF o RNF ambiguos,
- el backlog inicial mezcla problemas, reglas y soluciones,
- necesitas ordenar la fase 1 antes de seguir.

## No lo uses cuando
- todavia no existe una idea minimamente estructurada,
- ya estas en una `spec tecnica` de una feature puntual.

## Entradas minimas
- vision o idea estructurada,
- documento de requerimientos actual,
- backlog o historias disponibles.

## Salida esperada
- RF y RNF depurados,
- reglas de negocio mas claras,
- backlog inicial mas trazable,
- supuestos, riesgos y preguntas abiertas,
- matriz de huecos de fase 1 actualizada.

## Rutas destino
- `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`
- `docs/fase-1-analisis-requerimientos/01.01-matriz-huecos-fase-1.md`

## Verificacion minima
- Los RF y RNF quedan verificables.
- Se distinguen reglas, dependencias y preguntas abiertas.
- La matriz de huecos muestra impacto, decision requerida, responsable y estado.
- La salida usa lenguaje del dominio real y no instructivo.

## Pedido base
```md
Actua como Business Analyst senior orientado a discovery AI-first.

Revisa el contenido actual de fase 1 y reescribelo para que quede claro, trazable y util para UX, arquitectura y SDD.

Obligatorio:
- separa problema, actor, regla, RF, RNF e integracion,
- elimina ambiguedad y duplicados,
- deja supuestos y preguntas abiertas,
- actualiza la matriz de huecos de fase 1,
- marca reglas sin RF/RNF, RF sin backlog, RNF debiles, integraciones sin dueno, datos sensibles sin clasificar y features visuales sin candidato SPDD,
- conserva trazabilidad al dominio y objetivos del proyecto,
- no escribas codigo ni cierres decisiones tecnicas prematuras.

Entrega:
1. hallazgos principales,
2. version refinada del analisis,
3. riesgos y huecos por validar,
4. matriz de huecos actualizada,
5. siguiente paso recomendado.
```
