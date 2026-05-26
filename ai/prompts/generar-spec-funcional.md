# Prompt Generar Spec Funcional

## Objetivo
Convertir una historia o requerimiento en una `spec funcional` lista para refinamiento tecnico.

## Usalo cuando
- una HU o feature ya esta priorizada,
- necesitas aterrizar actores, flujos y criterios de aceptacion,
- quieres preparar una fase 4 consistente.

## No lo uses cuando
- la idea aun no paso por fase 0 y fase 1,
- no hay actor, objetivo o regla de negocio minima,
- se intenta resolver una decision tecnica sin requerimiento funcional.

## Entradas minimas
- HU o requerimiento base,
- reglas de negocio,
- actores,
- alcance y fuera de alcance.

## Salida esperada
- actores y contexto,
- flujo principal y alternos,
- criterios de aceptacion,
- casos borde, exclusiones y trazabilidad.

## Rutas destino
- `specs/<nnn-feature>/spec-funcional.md`

## Verificacion minima
- La spec incluye actor, objetivo, flujo, criterios y fuera de alcance.
- Los criterios de aceptacion son verificables.
- La trazabilidad a HU, RF o regla queda explicita.

## Pedido base
```
Toma la historia o requerimiento priorizado.
Convierte el contenido en una spec funcional completa.
Incluye actores, flujo principal, criterios de aceptacion, fuera de alcance y casos borde.
Mantiene trazabilidad explicita con HU, RF y reglas de negocio.
```
