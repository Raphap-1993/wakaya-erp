# UI Test Cases - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

| Caso | Estado esperado |
|---|---|
| Carga inicial de agenda | carga breve y luego agenda visible con KPIs del día |
| Contexto de rol visible al abrir la agenda | la superficie identifica a Recepción como actor operativo del slice |
| Filtro `Sin bungalow` | lista reducida a reservas sin asignación |
| Selección de reserva | detalle lateral refleja huésped, fechas, pago y bungalow |
| Asignación válida desde una reserva sin bungalow | confirmación corta, toast de éxito y auditoría actualizada |
| Conflicto de bungalow con unidad ya ocupada en la misma fecha | estado de bloqueo con mensaje inline y sin mutar la fila |
| Error de agenda al activar la acción de demo | mensaje seguro y botón de reintento |
| Filtros sin coincidencias | estado vacío y acción para limpiar filtros |
