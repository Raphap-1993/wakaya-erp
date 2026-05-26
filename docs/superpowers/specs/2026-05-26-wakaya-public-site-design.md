# Wakaya Public Site Prototype Design

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Wakaya Public Site Prototype Design](2026-05-26-wakaya-public-site-design.md)
- Siguiente: [Wakaya Public Site Prototype Design](2026-05-26-wakaya-public-site-design.md)
<!-- nav-guided:end -->

Date: 2026-05-26
Status: Draft approved in conversation, pending final user review
Topic: Public premium multi-page prototype for `wakaya-erp`

## Objective

Define the first high-fidelity public-site prototype for Wakaya Ecolodge before any real frontend implementation begins.

The prototype must validate:

- premium hospitality visual direction
- public information architecture
- lodging-first conversion model
- public pre-reservation flow
- the role of Events and Full Day as secondary but visible business lines

This is a prototype subproject, not the whole product.

## Why This Is a Separate Subproject

The current scaffold under `specs/001-reservations` is not the right home for the public website work.

The public website is a different surface from:

- the future lodging reservation domain
- the future backoffice
- OTA handling and operational administration

To avoid polluting the domain model and to preserve traceability, the public prototype is modeled as:

- `specs/002-public-site/`

This feature owns public UX, public narrative, and public prototype artifacts only.

## Business Intent

The public website must help Wakaya look premium, warm, and credible without becoming:

- a generic luxury template
- a startup landing page
- a backoffice-looking public shell
- a pure storytelling site with weak booking intent

The website must sell lodging first.

Events and Full Day are visible and important, but clearly secondary to lodging in the home hierarchy.

## Approved Visual Direction

### Chosen concept

- Stitch variant: `C`
- Direction label: `Tropical Modern Warmth`

### Approved visual decisions

- hero led by people living the experience
- floating booking bar integrated into the hero
- serif editorial headlines plus clean sans UI/body type
- warm premium hospitality tone
- no SaaS patterns
- no cold corporate hotel look
- no generic three-up startup marketing formulas

### Atmosphere

The website should feel:

- tropical
- warm
- premium
- human
- curated
- contemporary

Not solemn to the point of stiffness, and not mass-market to the point of cheapness.

## Prototype Scope

The first public prototype is a navigable multi-page concept with five pages:

1. `Home`
2. `Habitaciones`
3. `Detalle de habitacion`
4. `Eventos`
5. `Full Day`

This round is Spanish-only.

It is intentionally prototype-first:

- mock data allowed
- no backend integration yet
- no payment integration
- no OTA integration
- no production booking engine wiring

## Page Architecture

### 1. Home

Purpose:

- establish visual identity
- communicate Wakaya as a premium Amazon lodge
- move users into the lodging flow
- surface Events and Full Day without diluting hierarchy

Required blocks:

- immersive human hero
- floating booking bar
- three featured room categories
- editorial teaser for Events
- editorial teaser for Full Day
- compact trust/closing section with gallery, location, contact, and policy cues

### 2. Habitaciones

Purpose:

- show lodging categories as a curated commercial catalog
- let the visitor compare options without a cold inventory table

Required blocks:

- category cards
- price-from framing
- capacity
- highlights and amenity summary
- CTA to room detail

### 3. Detalle de habitacion

Purpose:

- reduce decision friction
- move the visitor from interest to public pre-reservation

Required blocks:

- gallery
- capacity
- amenity list
- rules and practical notes
- base tariff framing
- CTA to pre-reservation

### 4. Eventos

Purpose:

- position Wakaya as a desirable venue, not just a form page

Required blocks:

- visual atmosphere
- event types or scenarios
- spatial or experiential value
- CTA to submit a request

### 5. Full Day

Purpose:

- present a shorter, more accessible product line without breaking the premium brand

Required blocks:

- what the experience includes
- who it fits
- restrictions or conditions
- CTA to submit a request

## Conversion Model

### Primary flow

`Home -> Habitaciones -> Detalle de habitacion -> Prereserva`

### Secondary flows

- `Home -> Eventos -> Solicitud`
- `Home -> Full Day -> Solicitud`

### Commercial rule

The public site may show availability and tariff references, but it does not confirm the reservation automatically.

Public messaging must make clear that:

- availability displayed is referential
- approval is manual
- payment is coordinated later by the Wakaya team

## Public Pre-Reservation Flow

### Entry points

The flow can begin from:

- hero booking bar
- room category card
- room detail CTA

### Step 1: Intent context

Before the long form, the user should still see:

- dates
- guests
- room category or selected product
- price-from context
- reminder that final confirmation is manual

### Step 2: Request form

Minimum fields for lodging:

- nombres y apellidos
- telefono
- correo
- fechas
- cantidad de huespedes
- categoria solicitada
- observaciones

Minimum fields for Events and Full Day:

- nombre
- telefono
- correo
- fecha tentativa
- cantidad estimada
- experiencia solicitada
- observaciones

### Step 3: Confirmation state

The success state must say request received, not reservation confirmed.

## Component and Content Rules

The prototype should favor these component families:

- editorial hero
- floating booking bar
- large hospitality cards
- image-led teaser sections
- compact trust and closure blocks

Avoid:

- KPI strips
- dashboard modules
- dense filter chrome
- startup feature grids
- fake operational UI patterns on the public site

## Canonical Repo Artifacts

The public prototype subproject should live under:

- `specs/002-public-site/spec-funcional.md`
- `specs/002-public-site/product-design.md`
- `specs/002-public-site/spdd-frontend.md`
- `specs/002-public-site/prototype.md`
- `specs/002-public-site/prototype-validation.md`
- `specs/002-public-site/traceability.md`
- `specs/002-public-site/prototype-html5/`

Expected prototype HTML files for the next build phase:

- `home.html`
- `habitaciones.html`
- `habitacion-detalle.html`
- `eventos.html`
- `full-day.html`

## Obsidian Mirror

The design should also be reflected in Obsidian under:

- `20_Projects/WAKAYA-ERP/12 Public Prototype Direction 2026-05-26.md`

That note should record:

- chosen direction
- approved public IA
- approved conversion model
- canonical repo paths
- next prototype tasks

## Out of Scope for This Prototype Round

- bilingual copy implementation
- backend data wiring
- email integration
- payment flow
- OTA sync behavior
- backoffice screens
- full production content inventory

## Success Criteria

This design round succeeds when:

- the public site no longer feels generic
- the user approves the public visual direction
- the lodging-first hierarchy is obvious
- the five-page public prototype scope is stable
- repo and Obsidian both point to the same canonical direction

## Open Questions for Later

- final bilingual copy strategy
- whether restaurant or gastronomy deserves a dedicated public page
- exact source of pricing and availability data once the backend exists
- whether testimonials become a dedicated section in the next public iteration
