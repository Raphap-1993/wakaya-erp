# Wakaya Reservations Occupancy Design

Date: 2026-06-08
Topic: `specs/001-reservations` occupancy view
Owner: Viernes

## Objective

Define a hybrid occupancy view for reservations operations that complements the
daily agenda with a weekly bungalow map and a daily detail panel. The goal is to
let reception and administration understand inventory, conflicts, and active
stays without leaving the same product family.

This slice is intentionally limited to **bungalows only**. Services, housekeeping
queues, and other operational overlays stay out of scope for this iteration.

## Scope

### In scope

- Add a new operational view for bungalow occupancy.
- Present a weekly grid with one row per bungalow and one column per day.
- Add a right-side daily detail panel for the selected cell or reservation.
- Reuse the existing reservations truth as the source of occupancy.
- Surface check-in, check-out, no-show, cancellation, balance, and conflict
  signals only as they relate to bungalow occupancy.
- Keep the existing agenda as a sibling view, not a replacement.

### Out of scope

- Public site work.
- Service inventory or non-bungalow resources.
- Multi-property inventory.
- Housekeeping planning board.
- Mass edits or bulk operations.

## Chosen Approach

Use a **Semana + detalle diario** layout:

1. `Agenda` remains the list-first operational surface.
2. `Ocupación` becomes a sibling route that shows the bungalow inventory by week.
3. Clicking a cell or block opens the selected bungalow/day context in a detail panel.

This was selected over a day-only view because reception needs to see the
inventory shape across the week, not only the current day. It was selected over a
month calendar because month density hides the daily operational detail that
matters for assignments and check-outs.

## Primary Product Promise

The occupancy view should make it obvious whether a bungalow is:

- free
- occupied
- blocked by conflict
- about to be released
- associated with a reservation that needs action today

If the user still needs to bounce between multiple screens to answer those
questions, the design is not doing its job.

## Navigation Model

The occupancy view is a sibling of the current reservations agenda:

- `/admin/reservations` = agenda operativa
- `/admin/reservations/occupancy` = calendario de ocupación

Both views share the same permission model and the same reservations truth.

Recommended top navigation:

- `Agenda`
- `Ocupación`

The active route should remain obvious at all times so users do not confuse the
calendar with the list-based agenda.

## Screen Structure

### Topbar

Reuse the operational topbar language already established in the monitor:

- product label: `Wakaya ERP`
- search by reservation number, guest, or bungalow
- role context for reception or administration

### Operational context strip

The header should communicate same-week or same-day context:

- current week
- check-ins today
- check-outs today
- bungalows occupied
- conflicts or alerts

### Main grid: weekly bungalow map

The central surface is a weekly grid:

- rows = bungalows
- columns = days of the selected week
- each cell = the status of that bungalow on that date

Each cell should be readable at a glance and must not try to replace the detail
panel. Its job is to answer:

- is this bungalow free?
- who is using it?
- is there a state that requires attention?

### Right panel: daily detail

The right panel is fixed and context-aware. It expands the selected cell or
reservation with:

- bungalow name and code
- selected day or range
- reservation number
- guest summary
- status
- payment state
- alerts
- last audit event
- action buttons

## Data Model Shown in UI

### Cell level

Each occupancy cell should show only the minimum needed to operate:

- bungalow code or short name
- reservation number or short identifier
- occupancy state
- balance or alert chip if relevant
- check-in/check-out signal if the day is special

### Detail level

The daily detail panel should show:

- bungalow selected
- reservation associated
- exact blocked range
- guest main contact
- operational status
- payment status and balance
- alerts
- recent audit items

## Interaction Model

### Weekly navigation

- The user can move between weeks.
- The user can return to the current week quickly.
- The selected day should be highlighted so the detail panel feels anchored.

### Cell selection

- Clicking a cell opens the corresponding bungalow/day detail.
- Clicking an occupied block opens the reservation context.
- Clicking a free cell opens availability context, not a fake reservation.

### Cross-navigation

- `Ver reserva` opens the existing reservation detail path or jumps back to the
  agenda with the selected reservation.
- `Abrir agenda operativa` returns the user to the list-based monitor with the
  same selected reservation when possible.

## UI States

The occupancy view must explicitly handle:

- loading
- empty inventory
- no selection
- selected occupied cell
- selected free cell
- conflict state
- inline action error

The empty state should distinguish between:

- no bungalows configured
- no reservations in the selected week
- no matching filters

## Action Model

The detail panel is the place for action, not the grid itself.

Allowed actions in this slice:

- `Ver reserva`
- `Abrir agenda operativa`
- `Reasignar bungalow`
- `Registrar check-in`
- `Registrar check-out`
- `Marcar no show`
- `Cancelar estadía`
- `Exportar reporte del bungalow`

Action rules:

- `Reasignar bungalow` only appears when the reservation is eligible for it.
- `Registrar check-in` only appears when the reservation and date allow it.
- `Registrar check-out` only appears when the reservation is currently in house.
- `Marcar no show` and `Cancelar estadía` follow the same state rules as the
  existing backoffice.
- `Exportar reporte del bungalow` is for support and administration, not for
  public use.

## Styling Direction

Keep the existing Wakaya operational language:

- warm neutral surfaces
- dark green / olive operational accents
- dense but readable grid
- restrained badges for state
- clear separation between free, occupied, blocked, and attention-needed cells

Avoid:

- a month-calendar aesthetic
- a public booking look
- decorative gradients that make the grid harder to scan
- extra controls that do not support daily operations

## Tests

Add or adjust tests so the new view proves:

- the occupancy route renders the weekly grid
- the selected day/detail state is visible
- free and occupied cells render differently
- filters and navigation do not desynchronize the selected context
- conflict and blocked states are explicit

## Acceptance Criteria

- Reception can understand bungalow availability at week level without losing
  the daily context.
- The view uses only bungalow inventory in this slice.
- The daily detail panel explains the selected cell clearly.
- The sibling navigation between agenda and occupancy is obvious.
- The same reservations truth powers both views.
- The page reads like an operational inventory tool, not a generic calendar.

