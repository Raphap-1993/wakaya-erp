# Wakaya Design Split

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


Date: 2026-05-29
Status: Draft approved in conversation, pending final user review
Topic: Visual direction and UX split for Wakaya public site and internal reservations monitor

## Objective

Define the visual and interaction direction for Wakaya before final frontend implementation.

This brief covers two different product surfaces:

- the public hospitality website
- the internal reservations monitor for reception and administration

The two surfaces must share the same brand foundation, but they must not feel like the same interface.

## Context

Wakaya is a small hospitality business with real users already in production. The product must move quickly, stay safe on the existing VPS, and avoid generic hotel-template design.

The current direction is already clear at a product level:

- public reservations come in as `pending_review`
- OTA reservations come in as confirmed import events
- reception assigns the bungalow
- payment is settled at checkout
- availability must never double-book a bungalow night

That product model affects the interface. The public site must sell the experience and drive pre-reservation. The internal monitor must support operational clarity, status changes, assignment, and auditability.

## Design Principle

Use a **split visual system**:

- **Public site**: premium editorial hospitality
- **Internal monitor**: operational, dense, calm, readable

The brand should stay coherent, but the surfaces should not share the same composition logic.

## Public Site Direction

### Intent

The public site must feel:

- warm
- tropical
- premium
- human
- curated
- contemporary

It must sell Wakaya as a destination, not as a generic booking widget.

### Composition rules

- Hero leads with atmosphere and real hospitality imagery.
- Booking is visible early, but it does not dominate the page.
- Lodging is the primary line of business.
- Events and Full Day are visible, but secondary.
- Editorial rhythm matters more than dense UI repetition.

### Typography

- Use an editorial serif for major headlines.
- Use a clean sans-serif for body copy and controls.
- Keep the type contrast strong enough to feel premium, not decorative.

### Color and surface language

- Warm neutrals, sand, foliage, water, and wood-inspired accents.
- Avoid cold SaaS blues as the primary tone.
- Avoid over-saturated luxury gradients.
- Let photography carry part of the atmosphere.

### Motion

- Motion should be restrained and purposeful.
- Use soft reveal, hover lift, and gentle transitions.
- No exaggerated parallax or aggressive animation.

### Content hierarchy

1. Home
2. Habitaciones
3. Detalle de habitacion
4. Eventos
5. Full Day

The public experience must guide the visitor toward lodging first, then into pre-reservation.

## Internal Monitor Direction

### Intent

The internal monitor is for reception and administration. It must help users:

- scan reservation status quickly
- assign bungalows
- move reservations through valid transitions
- audit what happened and who did it

### Composition rules

- Prefer dense information over decorative spacing.
- Keep status, bungalow, dates, and action affordances visible at all times.
- Use one primary list view and one detail view.
- Avoid making the internal tool feel like marketing or hospitality storytelling.

### Typography

- Use the same sans-serif family as the public site body copy if possible.
- Prioritize legibility, tabular alignment, and compact labels.

### Color and status language

- Use status badges with explicit semantic colors.
- Keep the palette restrained.
- Reserve strong accent colors for errors, warnings, or operational state changes.

Recommended status mapping:

- `pending_review` and `ota_imported_confirmed` -> amber
- `confirmed`, `assigned`, `checked_in` -> green
- `checked_out`, `paid` -> blue
- `cancelled`, `no_show` -> red

### Layout

- Left-to-right reading should identify reservation number, status, bungalow, dates, and responsible actor without drilling into details.
- Detail view should keep operational actions and audit trail visible together.
- Forms should be simple HTML controls or equivalent components, not heavy wizard flows.

## Shared Design System

The two surfaces should share:

- typography scale
- spacing tokens
- neutral surface palette
- rounded corner language
- button primitives
- status badge semantics

The two surfaces should differ in:

- composition rhythm
- density
- use of imagery
- amount of whitespace
- emotional tone

## Component Families

### Public site components

- hero
- booking bar
- room card
- room gallery
- editorial section
- trust band
- request form

### Internal monitor components

- reservation table
- status badge
- detail summary card
- assignment form
- status transition form
- audit trail timeline
- compact stats cards

## Non-Goals

- No microfrontend architecture.
- No separate design system per app.
- No hotel-template mimicry.
- No generic SaaS admin styling.
- No motion-heavy luxury chrome.
- No redesign of the product rules.

## Success Criteria

The design is successful if:

- the public site feels like Wakaya, not a template
- lodging is clearly the primary commercial line
- the internal monitor is fast to scan and operate
- the two surfaces feel related but intentionally different
- the interface supports the reservation rules already approved for the project

## Implementation Guidance

This brief informs the next frontend work:

- public site polish
- internal reservations monitor
- shared component foundations
- future responsive tuning and accessibility review

It does not prescribe exact implementation details. Those belong in the implementation plan.
