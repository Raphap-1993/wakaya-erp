# UI Test Cases - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

| Caso | Estado esperado |
|---|---|
| Carga inicial de agenda | loading breve y luego agenda visible con KPIs del día |
| Filtro `Sin bungalow` | lista reducida a reservas sin asignación |
| Selección de reserva | detalle lateral refleja huésped, fechas, pago y bungalow |
| Asignación válida | confirmación corta, toast success y auditoría actualizada |
| Conflicto de bungalow | estado blocked con mensaje inline y sin mutar la fila |
| Error de agenda | mensaje seguro y botón de reintento |
| Filtros sin coincidencias | empty state y acción para limpiar filtros |
