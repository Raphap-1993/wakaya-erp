# Ejemplo de runbook

## Objetivo
Describir los pasos operativos para desplegar, verificar y recuperar el sistema de expedientes.

## Servicio o componente
Frontend web, API backend, PostgreSQL y Keycloak.

## Responsables y contactos
- DevOps: ejecución.
- Tech Lead: soporte técnico.
- DBA: soporte de base de datos.

## Preconditions
- Release aprobado.
- Backup reciente verificado.
- Ventana de despliegue coordinada.

## Despliegue paso a paso
1. Publicar frontend.
2. Actualizar imagen del backend.
3. Ejecutar migraciones.
4. Verificar salud de servicios.

## Verificaciones posteriores
- Login funcional.
- Consulta de bandeja exitosa.
- Cambio de estado valido por supervisor.
- Historial visible consistente con los cambios recientes.
- Monitoreo sin alertas críticas.

## Incidentes frecuentes
- Error de conexión a base de datos.
- Timeout con IAM.

## Rollback o recuperación
- Revertir versión del backend y frontend.
- Restaurar respaldo si la migración no es reversible.

