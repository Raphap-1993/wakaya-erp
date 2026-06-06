# SPDD Frontend - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Flujo UX
Recepción abre la agenda operativa, filtra reservas del día, selecciona una reserva crítica, revisa el detalle lateral, asigna o reasigna bungalow y confirma la acción viendo la auditoría en la misma superficie.

## Pantallas
- Agenda operativa de reservas del día.

## Estados UI
- Loading.
- Empty.
- Error.
- Success.
- Bloqueado por conflicto o regla.

## Regiones embebidas
- Filtros rápidos y filtros secundarios dentro de la agenda.
- Detalle lateral persistente de la reserva seleccionada.
- Timeline resumido de auditoría dentro del detalle.
- Confirmación corta de asignación o cambio operativo dentro de la misma superficie.

## Componentes previstos
- TopbarSearch.
- OperationsKpiStrip.
- QuickFilterBar.
- ReservationsAgendaList.
- ReservationRowBadge.
- ReservationDetailPanel.
- BungalowAssignmentModal.
- AuditTimeline.
- Toast.

## Validaciones visibles
- No permitir asignación si el bungalow entra en conflicto.
- Mostrar estado bloqueado por conflicto o regla cuando la reserva no cumple la regla operativa.
- Confirmar visualmente la asignación y reflejarla en la auditoría reciente.
