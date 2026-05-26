# Referencia: Quality, Release And Operations

## Usala cuando
- el trabajo ya entra en pruebas, release o post-release,
- estas validando evidencias antes de un gate,
- necesitas revisar runbook, rollback o metricas operativas.

## Checklist rapido
- Criterios de aceptacion y riesgos visibles.
- Evidencia QA trazable a specs o RF.
- Release con precondiciones, smoke checks y rollback.
- Runbook y responsables documentados.
- Monitoreo, alertas y metricas activas para el cambio.
- Post-release con verificacion de salud y backlog evolutivo.

## Red flags
- "Paso QA" sin evidencia concreta.
- Release checklist sin pipeline ni rollback real.
- Deploy sin smoke checks posteriores.
- Operacion descrita solo en `docs/` y no en `ops/`.

## Rutas relacionadas
- `docs/fase-6-qa/06.00-plan-pruebas.md`
- `docs/fase-7-deploy/07.00-checklist-salida-produccion.md`
- `docs/fase-8-operacion/08.00-operacion-continua.md`
- `ops/fase-7-deploy/`
- `ops/fase-8-operacion/`
