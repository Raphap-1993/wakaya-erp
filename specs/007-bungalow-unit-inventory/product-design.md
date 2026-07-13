# Product Design - Wakaya Bungalow Unit Inventory

[Specs](../README.md) | [Feature](README.md)

## Problema
Cinco categorías públicas representan 17 bungalows físicos. Recepción necesita saber qué unidad está libre, bloquear mantenimiento y cambiar una sugerencia sin exponer números al visitante.

## Jobs to be Done
- Ver capacidad real por tipo y unidad.
- Bloquear una unidad por fechas sin crear una reserva ficticia.
- Recibir una sugerencia segura y poder cambiarla.
- Detener solicitudes imposibles y ofrecer alternativas útiles.

## Experiencia
- Resumen list-first por tipo: total, activas, ocupadas, bloqueadas, disponibles.
- Detalle del tipo: 17 unidades en total del sistema, calendario/rango y acciones directas.
- Dialog `Bloquear unidad`: fechas, motivo, nota y noches afectadas.
- Panel de asignación: sugerida primero, alternativas disponibles y razón obligatoria al cambiar.
- Público: mensaje claro de agotado y cards de alternativas; sin códigos internos.
- Público agotado: hasta tres tipos alternativos y hasta tres fechas posteriores dentro de 60 días para el mismo tipo/duración.
- Operación OTA: reservas importadas muestran unidad asignada o conflicto accionable, sin duplicar filas en reintentos.

## Métricas
- 0 doble asignación de unidad/noche.
- 100% de bloqueos y cambios auditados.
- 100% de intervalos con checkout exclusivo.
- 0 booking requests persistidas para un tipo agotado al momento del POST.

## Estado
`gate-ux-ready`, `gate-prototype-ready` y `gate-spdd-approved` están aprobados con evidencia en `prototype-validation.md`. La orden humana fue textual; no se afirma revisión de capturas posteriores.
