# Wakaya ERP Design

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Wakaya ERP Design](2026-05-26-wakaya-erp-design.md)
- Siguiente: [Wakaya ERP Design](2026-05-26-wakaya-erp-design.md)
<!-- nav-guided:end -->

Date: 2026-05-26
Status: Draft approved in conversation, pending final user review
Topic: Greenfield design for `wakaya-erp`

## Objective

Define the baseline architecture, scope, operational model, and implementation direction for `wakaya-erp`, a modular hospitality operations system for Wakaya Ecolodge.

The system must start as a single-company product, built from the canonical `node-next` stack template, with one Next.js application covering both:

- public website
- internal backoffice

The design must support current local-first development and a later deployment to the user's VPS with Hestia, Nginx proxy templates, PM2, and PostgreSQL.

## Product Baseline

Approved baseline:

- Project name: `wakaya-erp`
- Stack: `node-next`
- App model: one Next.js app
- Public/admin split: public website plus `/admin`
- Database: PostgreSQL
- Local port: `3015`
- Canonical domain: `wakayaecolodge.com`
- Current development mode: local only
- Production hosting target: VPS with Hestia user `wakaya`
- Process model in VPS: `nginx -> PM2 -> Next.js`

The existing production website on another hosting provider is not modified during this phase. It is only a business and content reference.

## Business Scope

### Contractual core

The signed contract covers:

- public bilingual website (`ES` / `EN`)
- proprietary reservation system
- internal operational dashboard
- OTA integrations for Booking.com, Expedia Group, and Tripadvisor
- basic automated emails
- manual payment tracking

### Approved V1 extension

The design extends the contractual baseline and includes in V1:

- hospitality reservations
- events module
- full day module
- extended internal roles
- shared contacts/customers
- shared commercial follow-up

### Out of scope for V1

- online payment gateway
- automatic bank reconciliation
- advanced channel manager behavior
- Airbnb and other OTAs not explicitly approved
- advanced reporting
- complete internal messaging inbox
- formal accounting module
- restaurant consumption/POS module

## Product Model

`wakaya-erp` is not designed as a generic ERP. It is a hospitality operations platform with modular business domains.

Main domains:

- `lodging`
- `events`
- `full_day`
- `customers_contacts`
- `sales_followup`
- `ota_inbox`
- `users_roles`
- `notifications`

These domains share identity, contact, and audit capabilities, but keep their own operational states and business rules.

## User-Facing Surfaces

### Public website

The public website must include:

- home
- bungalows / rooms listing
- room detail pages
- gallery
- location and contact
- policies and conditions
- bilingual content (`ES` / `EN`)

The public website also includes availability and pricing consultation and the ability to submit lodging, event, or full day requests.

### Backoffice

The backoffice lives under `/admin` and provides:

- reservation review and administration
- manual reservation entry
- OTA reservation visibility
- event and full day operations
- contact management
- commercial follow-up
- payment tracking
- internal notes
- basic operational catalog management

## Operational Modules

### 1. Public marketing and reservation experience

Responsibilities:

- render the bilingual public site
- present room inventory by category
- present pricing and availability supplied by the backend
- collect public requests

This surface creates pending pre-reservations for direct web-originated requests.

### 2. Lodging

Responsibilities:

- room categories
- room units
- availability
- rate plans
- reservations and pre-reservations
- guest registration
- manual payment tracking

Inventory model:

- internal inventory is managed by real unit
- public site can expose availability at category level

### 3. Events

Responsibilities:

- event request intake
- event booking lifecycle
- event spaces or allocatable areas
- event capacities and status tracking

Events are not modeled as room reservations and keep their own states and calendars.

### 4. Full Day

Responsibilities:

- full day products or offers
- schedule and capacity
- booking lifecycle

Full day remains separate from lodging and events but shares contact and follow-up context.

### 5. Customers and contacts

Responsibilities:

- person or company profile
- contact channels
- cross-module linkage
- history of commercial interaction

This is the shared customer layer across all business modules.

### 6. Sales follow-up

Responsibilities:

- internal notes
- responsible owner
- next action
- status of lead or commercial follow-up

This module is shared by lodging, events, and full day.

### 7. OTA inbox

Responsibilities:

- receive OTA data
- keep traceability of source and external IDs
- normalize payloads
- hand over to the destination module

This module does not act as a full channel manager and does not own global inventory synchronization.

### 8. Users and roles

Responsibilities:

- local users
- session-based access
- RBAC permissions
- auditability

## Channel Rules

### Web direct

Direct website requests create:

- `prereserva_pendiente`

The backoffice reviews these requests before operational confirmation.

### OTAs

Booking.com, Expedia Group, and Tripadvisor entries create:

- `reserva_confirmada`

Operational consequences:

- availability is blocked immediately
- the admin does not approve the OTA reservation
- the admin only manages, validates, or updates internal handling

### Manual channels

Internal staff can create reservations from:

- WhatsApp
- phone
- email
- front desk / walk-in

These entries may start as:

- `prereserva_pendiente`
- `reserva_confirmada`

Every manual reservation must preserve:

- channel
- responsible internal user
- timestamps

## Data Model Baseline

### Shared core

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `sessions`
- `audit_logs`
- `contacts`
- `contact_channels`
- `commercial_followups`

### Lodging

- `room_categories`
- `room_units`
- `rate_plans`
- `availability_blocks`
- `lodging_reservations`
- `lodging_guests`
- `lodging_payments_tracking`

### Events

- `event_types`
- `event_spaces`
- `event_bookings`
- `event_booking_status_history`
- `event_capacity_rules`

### Full day

- `full_day_products`
- `full_day_schedules`
- `full_day_bookings`
- `full_day_status_history`

### Channels and OTAs

- `booking_channels`
- `external_reservations_inbox`
- `external_channel_mappings`

## State Models

### Lodging states

- `prereserva_pendiente`
- `confirmada`
- `cancelada`
- `no_show`
- `check_in`
- `check_out`

### Events states

- `lead`
- `cotizando`
- `pendiente`
- `confirmado`
- `cerrado`
- `cancelado`

### Full day states

- `pendiente`
- `confirmado`
- `cancelado`
- `asistido`
- `no_show`

State models are intentionally separated by domain instead of using a single rigid global status table.

## Critical Flows

### Public lodging/event/full day request

1. User consults availability and rates.
2. User completes the request form.
3. System creates a pending pre-reservation or equivalent pending request.
4. System sends customer confirmation email and internal notification.
5. Backoffice reviews and decides next action.

### OTA confirmed reservation

1. OTA payload enters the system.
2. System stores source data in `external_reservations_inbox`.
3. System normalizes and links external identifiers.
4. System creates an internal confirmed reservation.
5. Inventory is blocked immediately.

### Manual reservation handling

1. Internal staff creates a reservation from an external channel.
2. Staff chooses pending or confirmed state.
3. System records user, channel, note, and timestamps.

### Payment tracking

The system never charges online in V1.

It only tracks manual status such as:

- pending
- advance received
- fully paid
- observed

Transfer validation remains a human-driven operational action.

## Security and Access Model

### V1 authentication

Recommended V1 model:

- local authentication
- email and password login
- strong password hashing
- secure server sessions
- recovery by email
- rate limit on login
- temporary lockout on repeated failed attempts

### V1 authorization

Authorization must be permission-based, not only role-labeled.

Representative permissions:

- `lodging.read`
- `lodging.write`
- `lodging.confirm`
- `events.read`
- `events.write`
- `events.confirm`
- `full_day.read`
- `full_day.write`
- `full_day.confirm`
- `contacts.read`
- `contacts.write`
- `followup.read`
- `followup.write`
- `payments_tracking.read`
- `payments_tracking.write`
- `ota.read`
- `admin.users_manage`
- `admin.roles_manage`
- `admin.settings_manage`

### Roles

Approved roles:

- `super_admin`
- `administrador`
- `recepcion`
- `ventas_reservas`
- `contabilidad`
- `marketing`
- `operaciones`

### IAM future-proofing

The design must separate:

- identity provider concerns
- session management
- authorization decisions

This enables later migration to external IAM without rewriting business modules.

Recommended internal separation:

- `identity adapter`
- `session service`
- `authorization service`

## Audit Requirements

Audit logging is required at minimum for:

- login and logout
- reservation creation
- reservation confirmation
- reservation cancellation
- reservation state transitions
- payment tracking changes
- OTA ingestion and normalization actions

Every critical action must preserve:

- user or system source
- timestamp
- module
- summarized change

## Testing and Quality

### Unit tests

Required for:

- availability calculations
- state transitions
- channel rules
- permission checks

### Integration tests

Required for:

- API with PostgreSQL
- direct web pre-reservations
- OTA confirmed reservation ingestion
- manual payment tracking

### End-to-end tests

Required for critical flows:

- public request flow
- admin login
- review and confirmation of a pending pre-reservation
- manual reservation entry

### OTA fixtures

The project should include OTA payload fixtures for Booking, Expedia, and Tripadvisor so development can progress before real integrations are activated.

## Local Development Strategy

Approved local model:

- app on `localhost:3015`
- PostgreSQL in local Docker
- local-first development

Docker is approved for local development support. This is recommended for:

- PostgreSQL
- optional service dependencies needed for dev/test isolation

Local development does not depend on the VPS.

## Deployment Strategy

### Current phase

- local development only
- no DNS cutover
- no modification to current production website

### Future production target

- VPS `192.99.43.76`
- Hestia user `wakaya`
- Nginx proxy template pointing to app port
- Next.js process managed with PM2
- PostgreSQL on the same VPS with isolated database and credentials

### Verified server assumptions

The VPS was inspected and the following was confirmed:

- Hestia is present
- `nginx`, `apache2`, and `postgresql` are active
- PM2 is already used on the server
- Hestia already has custom `*-next.tpl` templates that proxy to app-specific localhost ports
- user `wakaya` already exists in Hestia, without domains or databases yet

Apache does not need to be globally removed for Wakaya. The existing hosting pattern already supports Nginx proxy templates for PM2-backed Next.js services.

## Main Risks

### Scope expansion risk

The approved V1 is broader than the signed contract because it includes:

- events
- full day
- extra roles

This should be treated as a deliberate V1 extension and not confused with the contractual minimum.

### OTA complexity risk

OTA integrations are limited to ingestion and centralization of technically available data. Attempting to grow V1 into a full channel manager would materially change scope and implementation complexity.

### Domain mixing risk

Lodging, events, and full day must stay operationally separate. Sharing contacts and follow-up is acceptable; sharing state models and availability logic is not.

## Recommended Implementation Direction

Use a modular monolith in one Next.js app.

This is the recommended balance between:

- speed of delivery
- local development simplicity
- future VPS deployment compatibility
- future migration path toward external IAM or split services

The system should be implemented as a clean modular monolith first, not as a prematurely distributed architecture.

## Approval Summary

The following were explicitly approved during design:

- V1 extended modular scope
- one Next.js app
- PostgreSQL
- local port `3015`
- local Docker for development support
- Hestia + PM2 deployment target
- canonical domain `wakayaecolodge.com`
- public web + `/admin`
- OTA reservations entering as confirmed reservations
- local auth with future IAM-ready architecture

## Next Step

After user review of this design document, the next step is to write the implementation plan for instantiating `wakaya-erp` from the canonical template and building the first version incrementally.
