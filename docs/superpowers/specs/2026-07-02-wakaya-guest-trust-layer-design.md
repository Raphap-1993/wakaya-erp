# Wakaya Guest Trust Layer Design

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


Date: 2026-07-02
Status: approved in conversation
Topic: Public trust layer for `wakaya-erp`

## Objective

Add a public trust layer to Wakaya Ecolodge so guests can clearly understand:

- how reservations are coordinated,
- what happens with cancellations, no-shows, and refunds,
- how pet-friendly stays work,
- how to file an online complaint through the Libro de Reclamaciones,
- and how the internal team receives and tracks those complaints.

## Why this exists

The current public site sells the experience, but leaves visible gaps in trust and operational clarity:

- legal/public policies are missing,
- pet-friendly status is not communicated,
- the footer lacks trust signals,
- the complaint flow is absent,
- and part of the copy still sounds like internal product or system language.

This creates friction at the exact point where hospitality websites should reduce uncertainty.

## Approved direction

The trust layer will be implemented as two coordinated slices:

1. `002-public-site`
- mobile usability fix for the booking band CTA
- footer trust signals
- public policies page
- public pet-friendly page
- public copy rewrite for clarity, warmth, and SEO

2. `003-guest-trust-layer`
- online Libro de Reclamaciones form
- persistence and tracking code
- admin inbox for complaints

## Product decisions

- Reservation handling remains manual and human-led. The site must never imply instant confirmation.
- Public policies must be clear and hotel-friendly, not legalistic or verbose.
- Pet-friendly messaging must be positive, but conditional on prior coordination.
- Libro de Reclamaciones must be visible and easy to reach from the public site.
- Internal operational language must not leak into guest-facing copy.
- Complaint intake and reservation intake must remain separate flows.

## User-facing outcomes

- Guests can find reservation, payment, cancellation, refund, check-in, capacity, and third-party booking policies in one place.
- Guests can clearly see that Wakaya is pet friendly and under what conditions.
- Guests can file a formal complaint online and receive a tracking code/copy.
- The internal team can review all complaints from a dedicated admin surface.

## Content direction

Tone:

- warm
- clear
- hospitality-first
- trustworthy
- easy to scan
- SEO-aware without sounding robotic

Avoid:

- back office language
- queue/provider/system language
- framework or internal product phrasing
- generic luxury filler

## Key pages and surfaces

- footer
- home booking band
- public policies page
- public pet-friendly page
- public Libro de Reclamaciones page
- admin complaints inbox
- admin complaint detail

## Risks

- Mixing complaint logic into reservation logic would create poor boundaries.
- Publishing overly specific operational rules before validation could create support debt.
- Rewriting public copy without preserving route-level SEO intent would weaken discoverability.

## Success criteria

- footer exposes clear trust signals
- public site explains reservation conditions without friction
- pet-friendly policy is visible and credible
- complaint flow works end-to-end
- admin can list and inspect complaints
- public copy no longer reads like internal implementation text
