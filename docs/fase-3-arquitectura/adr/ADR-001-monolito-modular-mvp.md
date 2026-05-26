# ADR-001 - Monolito modular para el MVP

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR](README.md)
- Siguiente: [ADR-001 - Stack Quarkus Angular y Keycloak](ADR-001-stack-quarkus-angular-keycloak.md)
<!-- nav-guided:end -->

## Decision
Usar una arquitectura de monolito modular con frontend separado para la primera version del caso canonico de gestion de expedientes.

## Contexto
El equipo es pequeno, el dominio aun puede evolucionar y la prioridad del negocio es reducir el tiempo de salida sin crear complejidad operativa innecesaria. El slice MVP se centra en `HU-02 Consulta por bandeja de trabajo`, `HU-03 Cambio de estado con validacion` y `HU-04 Historial de auditoria`, por lo que conviene mantener juntas la bandeja, la logica de transiciones, el historial visible y la auditoria.

## Opciones consideradas
- Monolito modular con frontend separado.
- Microservicios por dominio (expedientes, auditoria, autenticacion).
- Monolito clasico sin modularidad explicita.

## Consecuencias
- Se acelera la construccion y el despliegue inicial.
- Se reduce el costo operativo respecto a microservicios.
- Se exige disciplina modular para separar consulta, transiciones y auditoria sin perder consistencia.
- La evolucion a microservicios queda abierta: un modulo bien aislado puede extraerse cuando el dominio lo justifique.

## Trazabilidad
- Fase que origina la decision: `docs/fase-3-arquitectura/03.00-arquitectura.md`.
- Features afectadas: [`specs/001-reservations`](../../../specs/001-reservations/) y las futuras specs operativas del dominio Wakaya que se creen en este repo.
- Plan de despliegue relacionado: [`docs/fase-3-arquitectura/03.03-plan-despliegue.md`](../03.03-plan-despliegue.md).
