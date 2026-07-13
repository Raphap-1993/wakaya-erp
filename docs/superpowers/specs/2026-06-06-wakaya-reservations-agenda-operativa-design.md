# Wakaya Reservations Agenda Operativa Design

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


Date: 2026-06-06
Status: Draft approved in conversation, pending final user review
Topic: Visible product pass for `specs/001-reservations/` focused on daily reception operations

## Objective

Define the next visible-product iteration for the reservations prototype so it
stops presenting as a generic operational seed and starts behaving like a real
Wakaya ERP reception console.

This design targets one clear promise:

- Reception can detect critical reservations for the day, review the context,
  assign a bungalow, and see immediate traceability without leaving a single
  screen.

## Active Context

The current feature remains in prototype/SPDD mode, not in construction mode.

Verified context from repo artifacts:

- `specs/001-reservations/prototype-html5/index.html` is still a level-2
  generic operational seed
- `specs/001-reservations/prototype-validation.md` still marks human review as
  pending
- `specs/001-reservations/prototype.md` still declares the HTML5 prototype as
  pending human validation
- `specs/001-reservations/product-design.md` and
  `specs/001-reservations/spdd-frontend.md` remain too generic for a product
  review

Conversation decisions already made:

- prioritized slice: `Agenda operativa + detalle lateral + auditoría`
- primary UX priority: `control y asignación`
- primary actor: `Recepción` operating day to day

## Scope

### In scope

1. Reframe the prototype around a daily hotel reservation operation console.
2. Replace generic case-management language with reservations language.
3. Define a fixed lateral detail panel for the selected reservation.
4. Keep audit visibility inside the same operational surface.
5. Make assignment and reassignment of bungalow the dominant action pattern.

### Out of scope

- public pre-reservation flow
- formal Penpot handoff
- final production component mapping
- real OIDC integration
- real persistence or inventory engine
- full multi-module navigation beyond the current slice

## Chosen Approach

Use a `split view operativo` instead of a generic sidenav plus table seed.

The screen is composed of three coordinated areas:

1. operational filters
2. prioritized reservation agenda
3. persistent lateral detail with actions and audit

This approach was selected over drawer-based or multi-step navigation because
Reception needs continuous context while validating data and assigning a
bungalow. Opening secondary screens or temporary overlays would slow down the
main daily task.

## Primary Product Promise

The prototype should communicate one product behavior clearly:

- users in Reception can identify reservations that need intervention today,
  select one, validate the guest and stay data, assign or reassign a bungalow,
  and confirm the action with visible traceability

If the prototype tries to communicate broader ERP scope in the same iteration,
it will dilute the visible value of this slice.

## Screen Structure

### Topbar

The topbar remains compact and task-oriented:

- product label: `Wakaya ERP`
- search by reservation number, guest, or bungalow
- current user identity for Reception role context

### Operational context strip

Below the topbar, the prototype should show same-day operating signals:

- operational date
- arrivals today
- departures today
- pending assignments
- occupancy or conflict alert

These KPIs must stop looking generic and become explicitly hotel-oriented.

### Left column: filters

The left zone is reserved for operational filtering. Priority quick filters:

- arrivals today
- departures today
- no bungalow assigned
- payment pending
- pending review
- currently in house

Secondary filters:

- date
- channel
- reservation status
- bungalow
- owner/responsible

### Center: agenda list

The center of the screen is a prioritized reservations agenda. Every row must
show data that supports assignment decisions fast:

- reservation code
- primary guest
- stay date range
- nights
- assigned bungalow or `sin asignar`
- operational status
- payment status
- channel
- concise alert markers

### Right column: persistent detail panel

The detail panel is fixed, not modal. It becomes the operational control tower
for the selected reservation.

The panel includes:

- guest summary
- occupancy and stay data
- current bungalow
- special requests
- payment summary
- allowed actions
- recent audit timeline

## Vocabulary and Data Model

The visible language must shift fully into the reservations domain.

Replace current generic seed terms such as:

- `registros`
- `asunto`
- `responsable`
- `agenda de casos`

With domain-specific labels such as:

- `reserva`
- `huésped principal`
- `estadía`
- `bungalow`
- `canal`
- `estado de pago`
- `llegada hoy`
- `salida hoy`

Suggested operational statuses for this visible pass:

- `pending_review`
- `confirmed`
- `in_house`
- `check_out_today`
- `completed`
- `cancelled`

Suggested payment statuses:

- `paid`
- `partial`
- `pending`

Suggested alert chips:

- `VIP`
- `late arrival`
- `special request`
- `inventory conflict`

## Action Model

The detail panel is not a passive summary. Its action model must reflect what
Reception actually does during day-to-day operation.

Primary actions:

- `Asignar bungalow`
- `Reasignar bungalow`
- `Registrar check-in`
- `Registrar check-out`
- `Ver historial completo`

Recommended behavior:

- if the reservation has no bungalow, `Asignar bungalow` is the dominant CTA
- if the reservation already has one, the primary action changes to
  `Reasignar bungalow`
- `Registrar check-in` is enabled only when the stay date and bungalow context
  make it valid
- `Registrar check-out` is enabled only for guests already in house
- each action uses a short confirmation step with context, not a multi-step
  wizard

## Audit Model

Audit must stay inside the same detail surface so traceability accompanies the
operation instead of being hidden in another screen.

The audit block should show a short timeline with:

- timestamp
- actor
- action
- before/after state
- reason when relevant

Example language:

- `Recepción asignó Bungalow B-12`
- `Check-in registrado`
- `Pago marcado como parcial`

## Visual Hierarchy

The hierarchy must push three signals first:

1. reservations with no bungalow
2. arrivals or departures that require action today
3. real operational conflicts

Color semantics:

- amber for attention
- red only for real conflict or blocking issue
- green for resolved state
- blue for informational context

This should feel operational and serious, not decorative or dashboard-noisy.

## Required States

The prototype must make these states visible within the chosen slice:

- loading
- success
- empty results
- recoverable error
- blocked action due to rule or inventory conflict

The ideal state behavior:

- table/list and detail stay stable during local actions
- errors appear inline in the affected block where possible
- success updates the selected row, detail panel, and recent audit entry

## Happy Path

1. Reception opens the daily agenda.
2. Reception filters by `sin bungalow`.
3. Reception selects a reservation with arrival today.
4. The right panel exposes guest, stay, payment, and bungalow context.
5. Reception assigns a bungalow.
6. The action is confirmed in a short confirmation interaction.
7. The reservation row updates immediately.
8. The audit timeline shows the new assignment event.

## Prototype Delta From Current Seed

The current HTML prototype should evolve in these concrete ways:

- remove or reduce generic placeholder module navigation
- replace generic KPIs with hotel operations KPIs
- replace generic records data with reservation-specific mock data
- add persistent lateral detail
- add visible assignment flow
- add embedded audit timeline
- keep the prototype openable without build and suitable for later hub review

## File Boundaries For The Next Step

Expected artifacts to update after this design is accepted:

- `specs/001-reservations/product-design.md`
- `specs/001-reservations/spdd-frontend.md`
- `specs/001-reservations/prototype.md`
- `specs/001-reservations/prototype-validation.md`
- `specs/001-reservations/prototype-html5/decisiones-ux.md`
- `specs/001-reservations/prototype-html5/flujo.md`
- `specs/001-reservations/prototype-html5/index.html`

This design does not authorize broader construction work yet.

## Risks and Guardrails

### Risk 1

The prototype could drift back into generic ERP/dashboard language.

Guardrail:

- every user-facing label should be checked against the reservations domain

### Risk 2

The screen could become visually dense without clarifying the main task.

Guardrail:

- assignment and stay validation must remain the dominant reading path

### Risk 3

Audit could turn into a separate placeholder screen again.

Guardrail:

- the visible audit summary must live in the detail panel for this slice

## Exit Criteria

This design is complete when the next prototype iteration clearly shows:

- daily reception context
- real reservation language
- a persistent detail panel
- bungalow assignment as the main operation
- visible traceability within the same screen

## Recommendation

Translate this design directly into a prototype-focused implementation plan and
keep the scope tight. Do not mix public-site, analytics, or broad ERP module
expansion into this pass.
