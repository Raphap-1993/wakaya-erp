# Ejemplos de skills sobre el caso canonico

## Mapa rapido
| Skill | Cuando usarla | Caso canonico |
|---|---|---|
| `spec-writer.skill.md` | bajar backlog a specs | `001`, `002`, `003` |
| `architecture.skill.md` | definir arquitectura y ADR | contratos y modulos canonicos |
| `backend.skill.md` | aterrizar implementacion de API y dominio | `002` y `003` |
| `frontend.skill.md` | aterrizar UI y estados | bandeja, acciones, historial visible |
| `qa.skill.md` | construir estrategia de pruebas | casos QA por feature |
| `devops.skill.md` | preparar despliegue y monitoreo | checks y metricas del slice canonico |
| `c4.skill.md` | reflejar arquitectura visualmente | contexto y contenedores del MVP |
| `estimacion.skill.md` | resumir esfuerzo y riesgos | roadmap del MVP canonico |

## Ejemplo 1 - spec-writer
### Uso sugerido
```
Usa spec-writer.skill.md
Toma HU-04 Historial de auditoria.
Produce spec funcional, tecnica y tareas para 003-historial-auditoria-expediente.
```

## Ejemplo 2 - backend
### Uso sugerido
```
Usa backend.skill.md
Implementa el backend derivado de la spec tecnica de 002-cambio-estado-expediente.
Incluye reglas de transicion, errores y auditoria.
```

## Ejemplo 3 - devops
### Uso sugerido
```
Usa devops.skill.md
Prepara checks de deploy y metricas operativas para 001, 002 y 003.
```
