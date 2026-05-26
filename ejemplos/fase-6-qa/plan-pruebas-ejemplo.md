# Ejemplo de plan de pruebas

## Objetivo
Validar que el MVP canonico de expedientes cubre los flujos criticos de consulta por bandeja, cambio de estado, historial visible y auditoria.

## Alcance
- Bandeja de trabajo con filtros y detalle.
- Cambio de estado por rol.
- Historial de auditoria visible.
- Restricciones por ambito y permisos.

## Tipos de prueba
- Pruebas funcionales.
- Pruebas de integración.
- Pruebas de regresión.
- Pruebas básicas de rendimiento.

## Criterios de entrada
- Build estable.
- Ambiente QA operativo.
- Datos de prueba disponibles.

## Criterios de salida
- Cero defectos críticos abiertos.
- Criterios de aceptación cubiertos.
- Evidencia cargada y aprobada.

## Casos o escenarios críticos
- Consulta filtrada con respuesta dentro del objetivo.
- Rechazo de cambio de estado por permisos.
- Reapertura rechazada sin motivo y evidencia.
- Consulta de historial reciente desde detalle.
- Consulta de historial visible por auditor.

## Ambiente de pruebas
QA on-premise con IAM integrado.

## Responsables
- QA líder.
- Soporte de FE y BE.

