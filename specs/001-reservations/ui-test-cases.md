# UI Test Cases - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

| Caso | Estado esperado |
|---|---|
| Carga inicial de agenda | carga breve y luego agenda visible con KPIs, foco `Llegadas hoy` y detalle lateral precargado con la primera reserva del filtro |
| Contexto de rol visible al abrir la agenda | la superficie identifica a Recepción como actor operativo del slice |
| Vista `Pendientes` | cambia el foco superior a cobros y alertas sin fingir una vista separada de auditoría |
| Filtro `Sin bungalow` | lista reducida a reservas sin asignación y el detalle cambia a la primera coincidencia visible |
| Selección de reserva | detalle lateral refleja huésped, resumen operativo, grid, acciones, estado inline y línea de auditoría |
| Asignación válida desde `RES-240606-071` | el modal confirma B-07, la fila muestra bungalow asignado, aparece toast de éxito y la auditoría prepende `Bungalow asignado` |
| Conflicto de bungalow desde `RES-240606-073` | el modal cierra con mensaje inline de bloqueo, la fila conserva `Sin asignar` y la auditoría no muta |
| Contingencia de agenda | la tabla entra en error, el detalle deja de mostrar datos previos y ambos paneles quedan listos para `Reintentar` |
| Filtros sin coincidencias | estado vacío y acción para limpiar filtros |
