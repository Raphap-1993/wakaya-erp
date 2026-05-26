# Ejemplos de agentes sobre el caso canonico

## Mapa rapido por fase
| Fase | Agente recomendado | Uso tipico | Salida esperada |
|---|---|---|---|
| 0 | `planner-agent.md` | ordenar roadmap, estimacion y riesgos | roadmap, estimacion, staffing |
| 3 | `architect-agent.md` | definir arquitectura del MVP canonico | arquitectura, ADR, C4 |
| 5 backend | `backend-agent.md` | aterrizar `002` y `003` en backend | contratos, componentes, pruebas |
| 5 frontend | `frontend-agent.md` | aterrizar bandeja, cambio de estado e historial visible | modulos UI, estados, pruebas |
| 6 | `qa-agent.md` | convertir specs en casos de prueba | casos QA, criterios de salida |
| 7 y 8 | `devops-agent.md` | preparar checks, rollout y monitoreo | deploy checks, runbook, metricas |

## Ejemplo 1 - Planner para el MVP canonico
### Entrada
- vision del sistema de expedientes
- backlog `HU-02`, `HU-03`, `HU-04`
- restricciones on-premise e IAM

### Pedido sugerido
```
Actua como planner-agent.
Organiza un roadmap corto para el MVP canonico de expedientes.
Prioriza las historias HU-02, HU-03 y HU-04.
Entrega roadmap por fases, riesgos y estimacion resumida.
```

### Salida esperada
- roadmap con foco en bandeja, cambio de estado e historial visible
- riesgos operativos y de auditoria
- staffing minimo por fase

## Ejemplo 2 - Architect para el MVP canonico
### Pedido sugerido
```
Actua como architect-agent.
Usa el caso canonico de expedientes.
Propone arquitectura del MVP, contratos principales y ADR inicial.
```

### Salida esperada
- monolito modular con frontend separado
- contratos `GET /api/expedientes`, `PATCH /api/expedientes/{id}/estado`, `GET /api/expedientes/{id}/historial`
- ADR de estructura modular

## Ejemplo 3 - QA para la feature 003
### Pedido sugerido
```
Actua como qa-agent.
Convierte la spec 003-historial-auditoria-expediente en casos QA priorizados y criterios de salida.
```

### Salida esperada
- casos de integracion y e2e
- evidencia esperada
- gates de salida para release
