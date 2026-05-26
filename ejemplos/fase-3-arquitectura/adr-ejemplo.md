# ADR-001 - Monolito modular para el MVP

## Decisión
Usar una arquitectura de monolito modular con frontend separado para la primera versión.

## Contexto
El equipo es pequeño, el dominio aún puede cambiar y la prioridad del negocio es reducir tiempo de salida sin crear complejidad operacional innecesaria.

El MVP canonico se centra en `HU-02`, `HU-03` y `HU-04`, por lo que se requiere mantener juntas la bandeja, la logica de transiciones, el historial visible y la auditoria.

## Opciones consideradas
- Monolito modular.
- Microservicios por dominio.
- Monolito clásico sin modularidad explícita.

## Consecuencias
- Se acelera la construcción y despliegue inicial.
- Se reduce el costo operativo respecto a microservicios.
- Se exige una buena disciplina modular para separar consulta, transiciones y auditoria sin perder consistencia.

