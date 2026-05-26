# Ejemplo de spec tecnica

## Feature
Cambio de estado de expediente

## Requerimiento o backlog item relacionado
HU-03 Cambio de estado con validacion

## Arquitectura objetivo o impacto en arquitectura
Impacta el modulo de transiciones, historial y auditoria.

## Endpoint, evento o interfaz
`PATCH /api/expedientes/{id}/estado`

## Datos de entrada
- estadoDestino
- motivo
- evidenciaAdjunta

## Datos de salida
- id
- estado
- historialReciente
- auditEventId

## Modelo de datos
- tabla `expediente`
- tabla `expediente_estado_evento`
- tabla `auditoria_evento`

## Reglas tecnicas y validaciones
- Solo supervisor puede aprobar cierre.
- Reapertura exige motivo y evidencia.
- La actualizacion de estado e historial debe ser atomica.

## Errores
- `400` por validacion.
- `403` por rol no autorizado.
- `409` por transicion invalida.
- `500` por error interno.

## Observabilidad
- Log estructurado por operacion.
- Metrica de latencia y tasa de error.

## Seguridad
- Requiere rol `OPERADOR` o `SUPERVISOR` segun la transicion.
- Auditoria obligatoria del usuario autenticado.

## Dependencias
- PostgreSQL
- IAM corporativo
- Servicio de auditoria

## Riesgos
- Inconsistencia si falla auditoria durante la transicion.
- Reglas duplicadas entre frontend y backend.

## Estrategia de pruebas
- Unitarias para reglas de transicion y autorizacion.
- Integracion para persistencia de historial, auditoria y codigos de error.
- E2E para cierre y reapertura desde la interfaz.
- QA para validar criterios de aceptacion, evidencia y trazabilidad del cambio.
