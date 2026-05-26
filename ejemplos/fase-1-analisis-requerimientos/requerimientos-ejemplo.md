# Ejemplo de requerimientos

## Actores
- Operador
- Supervisor
- Auditor
- Administrador

## Módulos
- Registro de expedientes
- Seguimiento y bandeja
- Consulta y reportes
- Auditoría
- Administración

## Requerimientos funcionales
- RF-01 Registrar expediente con datos obligatorios y anexos.
- RF-02 Consultar expedientes por filtros operativos.
- RF-03 Cambiar estado del expediente con validaciones por rol.
- RF-04 Registrar trazabilidad de cada acción crítica.
- RF-05 Emitir reportes operativos por rango de fechas y estado.

## Requerimientos no funcionales
- RNF-01 Tiempo de respuesta menor a 2 segundos en consultas frecuentes.
- RNF-02 Disponibilidad objetivo de 99.5 por ciento en horario operativo.
- RNF-03 Auditoría obligatoria para altas, cambios de estado y anulaciones.
- RNF-04 Integración con IAM corporativo para autenticación.

## Reglas de negocio
- RN-01 Un expediente debe tener número único.
- RN-02 Solo supervisores pueden aprobar cierre de expediente.
- RN-03 Un expediente cerrado no puede reabrirse sin motivo y evidencia.
- RN-04 Todo anexo debe registrar usuario, fecha y tipo documental.

## Estados base del expediente
- Registrado
- En revision
- Cerrado

## Integraciones
- IAM corporativo.
- Servicio de correo interno para notificaciones.

## Casos de uso principales
- Registrar expediente.
- Consultar expediente.
- Cambiar estado.
- Revisar historial de auditoría.

## Backlog inicial
- HU-01 Registro de expediente.
- HU-02 Consulta por bandeja de trabajo.
- HU-03 Cambio de estado con validación.
- HU-04 Historial de auditoría.

## Trazabilidad canonica
- `HU-02` se implementa como `001-bandeja-trabajo-expedientes`.
- `HU-03` se implementa como `002-cambio-estado-expediente`.
- `HU-04` se implementa como `003-historial-auditoria-expediente`.

