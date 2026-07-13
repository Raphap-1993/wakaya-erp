# Wakaya Reservations Monitor UI Design

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


Date: 2026-06-06
Topic: `specs/001-reservations` monitor UI
Owner: Viernes

## Goal

Turn the internal reservations monitor into the primary day-to-day reception screen:
one list, one persistent detail panel, visible state, visible audit, and operational
actions without context switching.

## Scope

In scope:

- `src/app/admin/reservations/page.tsx`
- `src/app/admin/reservations/[id]/page.tsx` as fallback deep-link view
- `src/app/admin/reservations/reservations.module.css`
- `src/app/admin/reservations/page.test.tsx`
- `src/app/admin/reservations/[id]/page.test.tsx`

Out of scope:

- backend behavior changes
- new domain actions
- refactoring the reservation store beyond what the UI needs

## Proposed Structure

### Primary screen

Make `/admin/reservations` the operational surface. The page should contain:

- a top header with operational KPIs
- a filter bar for status, channel, responsible, and date
- a prioritized reservations table
- a fixed right-side detail panel for the selected reservation

### Fallback detail view

Keep `/admin/reservations/[id]` as a direct-link view for support and debugging, but
do not treat it as the main operational flow.

## Data Model Shown in UI

The table should expose at least:

- reservation number
- guest or reservation identifier
- stay range
- bungalow
- status
- channel
- responsible

The detail panel should expose:

- current status and channel
- bungalow assignment
- stay range
- responsible
- latest audit items
- operational actions

## Interaction Model

Selection does not navigate away from the list.

- clicking a row updates the side panel
- the selected row stays visibly active
- the current filter state remains visible
- the detail panel shows the current reservation truth, not a separate mock state

## UI States

The screen must explicitly cover:

- no selection
- reservation selected
- no bungalow assigned
- blocked action state
- empty result set
- inline action error

## Action Behavior

Use native forms and server actions already present in the repo.

- `Asignar bungalow` remains the primary action when the reservation lacks a bungalow
- status changes remain visible as short, direct actions
- if an action is blocked, the UI must explain why inline
- errors should not clear the list or destroy the selected context

## Styling Direction

Keep the established Wakaya language:

- warm neutral backgrounds
- dark green/olive operational accents
- clear badges for state
- dense, readable tables
- a calm but serious reception-console tone

Avoid:

- generic dashboard chrome
- decorative surfaces that reduce density
- extra navigation layers for normal operation

## Tests

Add or adjust tests so the monitor proves:

- the main page renders the operational list and filters
- filtering still works with the new date field
- the detail view renders the selected reservation actions
- the UI does not regress to scaffold language

## Acceptance Criteria

- Reception can understand and operate the monitor from the main screen.
- The selected reservation is visible without leaving the list.
- Filters, list, detail, and audit remain coherent.
- The UI reflects the same truth as the API and store.
- The page reads like a real reservations product, not a template.

