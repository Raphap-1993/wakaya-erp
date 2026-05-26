# Prompt Preparar Release

## Objetivo
Consolidar la documentacion y verificacion minima necesarias para una salida a produccion controlada.

## Usalo cuando
- una feature o release ya esta cerca de salir,
- el equipo necesita revisar readiness de deploy,
- hace falta dejar checklist, runbook o rollback mas claros.

## No lo uses cuando
- aun no hay evidencia QA minima,
- el trabajo sigue siendo de implementacion o arquitectura.

## Entradas minimas
- resultados QA,
- componentes afectados,
- plan de despliegue,
- riesgos operativos.

## Salida esperada
- checklist de salida mas claro,
- runbook y rollback mejor definidos,
- smoke checks y monitoreo asociados,
- puntos de bloqueo o dudas pendientes.

## Rutas destino
- `docs/fase-7-deploy/07.00-checklist-salida-produccion.md`
- `ops/fase-7-deploy/runbook.md`
- `ops/fase-7-deploy/rollback.md`

## Verificacion minima
- Se distinguen precondiciones, ejecucion y post-deploy.
- Hay evidencia requerida por item critico.
- Se identifican bloqueantes reales para no liberar.

## Pedido base
```md
Actua como DevOps Engineer orientado a release readiness.

Consolida la documentacion minima de salida a produccion usando la evidencia disponible del proyecto.

Obligatorio:
- revisa calidad, pipeline, rollback, runbook y monitoreo,
- identifica bloqueantes y riesgos,
- separa claramente pre-deploy, deploy y post-deploy,
- no marques items como aprobados si la evidencia no existe.

Entrega:
1. checklist refinada,
2. evidencias faltantes,
3. riesgos de release,
4. siguiente paso recomendado.
```
