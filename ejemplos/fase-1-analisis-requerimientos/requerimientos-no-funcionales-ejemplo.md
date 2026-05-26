# Ejemplo de requerimientos no funcionales

## Contexto
Ejemplo aplicado al caso canonico de gestion de expedientes.

## Rendimiento
- `RNF-01` Tiempo de respuesta menor a 2 segundos en consultas frecuentes de bandeja.
- `RNF-02` Exportacion de reportes operativos en menos de 30 segundos para volumen base definido.

## Disponibilidad y continuidad
- `RNF-03` Disponibilidad objetivo de 99.5 por ciento en horario operativo.
- `RNF-04` Recuperacion del servicio critico en menos de 2 horas ante falla controlada.

## Seguridad
- `RNF-05` Integracion obligatoria con IAM corporativo para autenticacion.
- `RNF-06` Auditoria obligatoria para altas, cambios de estado y anulaciones.

## Observabilidad y operacion
- `RNF-07` Toda transaccion critica debe generar logs y trazabilidad suficiente para auditoria.
- `RNF-08` La solucion debe exponer metricas operativas minimas para monitoreo y alertamiento.

## Cumplimiento
- `RNF-09` Los anexos y eventos del expediente deben conservar trazabilidad de usuario, fecha y tipo documental.

## RNF vs riesgos
- `RNF`: "La consulta de bandeja debe responder en menos de 2 segundos."
- `Riesgo`: "El volumen historico podria degradar la consulta si no se definen indices y paginacion."

- `RNF`: "La autenticacion debe usar IAM corporativo."
- `Riesgo`: "La integracion con IAM corporativo podria retrasarse por dependencia externa."
