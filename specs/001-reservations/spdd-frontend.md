# SPDD Frontend - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Flujo UX
Recepción abre la agenda operativa, filtra reservas del día, selecciona una reserva crítica, revisa el detalle lateral, asigna o reasigna bungalow y confirma la acción viendo la auditoría en la misma superficie.

## Pantallas
- Agenda operativa con filtros rápidos.
- Detalle lateral persistente de la reserva seleccionada.
- Confirmación corta de asignación o cambio operativo.
- Timeline resumido de auditoría dentro del detalle.
- Empty.
- Error.
- Acción bloqueada por conflicto o regla.

## Estados UI
- Loading.
- Empty.
- Error.
- Success.
- Bloqueado.

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
- Mostrar acción bloqueada cuando la reserva no cumple la regla operativa.
- Confirmar visualmente la asignación y reflejarla en la auditoría reciente.
