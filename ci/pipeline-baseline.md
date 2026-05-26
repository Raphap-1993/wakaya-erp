# Pipeline baseline

Este archivo define el baseline documental del pipeline mientras el proyecto no tenga workflows ejecutables versionados.

## Objetivo
Describir como se valida, aprueba y libera el software desde merge hasta salida a produccion.

## Flujo minimo esperado
1. Validar formato y checks basicos.
2. Ejecutar pruebas automatizadas relevantes.
3. Generar build candidata.
4. Aprobar release para el entorno objetivo.
5. Ejecutar deploy controlado.
6. Verificar salida y activar monitoreo.

## Gates minimos
- Build verde.
- Pruebas criticas aprobadas.
- Evidencia QA disponible.
- Runbook y rollback vigentes.
- Aprobacion de release registrada.

## Relacion con otras rutas
- `docs/fase-3-arquitectura/03.03-plan-despliegue.md`
- `ops/fase-7-deploy/runbook.md`
- `ops/fase-7-deploy/rollback.md`

