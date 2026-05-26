# Ejemplo de plan de despliegue

## Objetivo
Liberar el MVP en ambiente on-premise con rollback controlado y monitoreo operativo.

## Ambientes
- Desarrollo
- QA
- Producción

## Pipeline y estrategia de release
- Build y pruebas automáticas al merge a `main`.
- Despliegue a QA en cada versión candidata.
- Release manual aprobada para producción.

## Configuración y secretos
- Variables de entorno por ambiente.
- Secretos gestionados fuera del repositorio.
- Cadenas de conexión segregadas por ambiente.

## Checklist previo a release
- Pruebas funcionales aprobadas.
- Migraciones verificadas.
- Runbook actualizado.
- Rollback validado.
- Checks de `GET /api/expedientes` y `PATCH /api/expedientes/{id}/estado` aprobados.

## Rollback
- Reversión de versión de frontend.
- Reversión de imagen backend anterior.
- Restauración de base de datos solo si aplica y está autorizada.

## Monitoreo y alertamiento
- Disponibilidad de API.
- Errores 5xx.
- Uso de CPU y memoria.
- Alertas por caída de integración IAM.

## Alcance canonico del release
- bandeja de trabajo de expedientes
- detalle resumido con historial reciente
- cambio de estado auditado
- historial y auditoria visible

## Responsables
- DevOps: ejecución del release.
- QA: validación final.
- Arquitecto y Tech Lead: soporte técnico.

