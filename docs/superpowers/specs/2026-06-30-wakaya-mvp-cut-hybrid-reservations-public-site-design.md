# Wakaya MVP Cut: Hybrid Reservations Flow and Public Site Continuity Design

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


Date: 2026-06-30
Status: Approved in conversation, pending final written-spec review
Topic: First executable MVP cut for `wakaya-erp` covering `booking_request`,
hybrid mail with Resend plus Zoho, PostgreSQL-only operations, back office
review flow, and public-site continuity beyond the approved home style

## Objective

Define the first real MVP cut that closes the operational reservation flow end
to end and keeps the public site moving in the same direction without mixing
both concerns into an undefined implementation.

This cut must produce one clear operational result:

- a public user submits a request,
- Wakaya replies automatically from `reservas@wakayaecolodge.com`,
- the same thread remains usable for human follow-up and attachments,
- back office reviews the proof of transfer without leaving the ERP,
- the team confirms the transfer,
- the request becomes a real reservation,
- the reservation continues to assignment,
- OTA imports remain preapproved reservations,
- public forms point to the same flow,
- the public site keeps the visual language of the current home and improves the
  key internal pages without losing SEO discipline.

## Active Context

The repo already has an implemented reservations baseline, but its current
behavior no longer matches the approved business model.

Verified contradictions in the current codebase and specs:

- `specs/001-reservations/reglas-negocio-estados-criterios.md` still says web
  reservations enter as `pending_review` and block inventory provisionally.
- `specs/001-reservations/spec-tecnica.md` still documents local SQLite as the
  current operational persistence.
- `src/lib/reservations/store.ts` still seeds demo reservations and occupancies.
- `src/app/api/public/reservations/route.ts` and the current public flow still
  behave as if the web creates a reservation directly.
- `src/app/prototype/public-site/page.tsx` and related public pages already
  carry the approved visual direction for the home, but the interior pages and
  forms still need a cohesive follow-through.
- No explicit SEO baseline is currently documented for the public surfaces.

This design replaces those assumptions for the next executable MVP cut.

## Scope Split

The work is intentionally decomposed into two coordinated subprojects and one
reference layer.

### Subproject A: Operational reservations inside `wakaya-erp`

In scope:

- `booking_request` as the web-origin entry entity
- `reservation` as the real operational stay entity
- Resend transactional outbound mail
- Zoho-hosted human inbox and thread history
- PostgreSQL as the only operational database
- back office review of threads, attachments, conflicts, and conversion
- OTA imports as preapproved reservations
- removal of demo data and SQLite-backed operational behavior

Out of scope:

- automated online payment gateway
- automatic approval without human verification
- extracting a shared mail service for other products
- cross-repo runtime coupling

### Subproject B: Public-site continuity inside `wakaya-erp`

In scope:

- preserve the approved home direction
- redesign `Nosotros`, `Contacto`, public forms, and product detail pages so
  they belong to the same visual family as the home
- connect public forms to the new `booking_request` flow
- add an explicit SEO baseline, prioritizing the home and keeping minimum
  structural discipline for the interior pages

Out of scope:

- total content strategy across every public page
- multilingual SEO program
- blog/publications expansion as a separate SEO machine

### Reference layer: other repos

`joia-pe`, `agingenieros-erp`, and `ERP-HUELEHUELE` are reference sources for
patterns only.

They are not part of the runtime architecture of this MVP cut.

Permitted reuse:

- mail and outbox discipline
- modular split between web, admin, API, and worker
- deterministic backend closure patterns
- back office layout and flow ideas

Forbidden in this cut:

- shared runtime dependencies between repos
- shared databases between products
- a multi-product mail orchestration platform

## Chosen Approach

Use a clean domain split:

1. web creates a `booking_request`
2. only approved or OTA-origin stays become `reservation`
3. mail uses a hybrid split:
   - `Resend` for transactional outbound
   - `Zoho Mail` for the real human inbox and thread continuity
4. `wakaya-erp` remains the single source of truth for operational state
5. `PostgreSQL` remains the single source of truth for operational persistence

This approach was chosen over a single-entity reservation model because the new
business rules clearly distinguish:

- a request that still needs review and transfer confirmation
- a real reservation that already belongs to hotel operations

Keeping those as one entity would make conflict handling, traceability, and
inventory rules fragile.

## Ownership Model

### Repo ownership

- `wakaya-erp` is the only implementation repo for this cut
- `joia-pe`, `agingenieros-erp`, and `ERP-HUELEHUELE` remain references only

### Internal surface ownership in `wakaya-erp`

- `specs/001-reservations`, `src/lib/reservations`, `src/app/api/reservations`,
  `src/app/api/public/*`, `src/app/admin/reservations`
  own the operational request-to-reservation flow
- `specs/002-public-site`, `src/app/prototype/public-site`,
  `src/components/public-site`
  own the public visual continuity and forms

### Agent ownership

- `Jarvis`: architecture, boundaries, ADR-level decisions, sequence of cuts
- `Patroclo`: business rules, states, acceptance criteria, conflict semantics
- `Vulcan`: PostgreSQL, APIs, persistence, conversion logic, integrations
- `Orion`: Resend, Zoho, thread correlation, attachments, retries, notifications
- `Neon`: back office UI, public forms, page integrations
- `Aether`: public-site continuity and page-level UX hierarchy
- `Pulse`: sliders, galleries, transitions, reduced-motion safety
- `Echo`: QA matrix, smoke, regression, ready-to-run evidence
- `Delta`: architecture notes, env docs, runbook, final handoff

## Canonical Domain Model

### Main entities

#### `booking_request`

Represents a web-originated request that still needs human review and transfer
verification.

Suggested core fields:

- `id`
- `public_ref`
- `status`
- `guest_name`
- `guest_email`
- `guest_phone`
- `requested_check_in`
- `requested_check_out`
- `requested_guests`
- `requested_bungalow_type`
- `source_channel = web_public`
- `notes`
- `thread_id`
- `last_message_at`
- `sync_status`
- `created_at`
- `updated_at`

#### `reservation`

Represents a real operational stay.

Suggested core fields:

- `id`
- `reservation_number`
- `status`
- `source_channel`
- `source_request_id`
- `guest_name`
- `guest_email`
- `guest_phone`
- `check_in`
- `check_out`
- `guest_count`
- `bungalow_id`
- `amount_total_cents`
- `currency_code`
- `confirmed_at`
- `assigned_at`
- `created_at`
- `updated_at`

#### `reservation_occupancy`

Represents real occupancy per bungalow and date.

Critical rule:

- requests do not block occupancy
- confirmed reservations do block occupancy

#### `message_thread`

Represents the local ERP view of the inbox thread.

Suggested fields:

- `id`
- `mailbox_address`
- `provider`
- `provider_thread_id`
- `subject`
- `thread_key`
- `linked_entity_type`
- `linked_entity_id`
- `last_synced_at`
- `sync_status`
- `created_at`
- `updated_at`

#### `message_item`

Represents one message inside a thread.

Suggested fields:

- `id`
- `thread_id`
- `direction`
- `provider_message_id`
- `from_address`
- `to_addresses`
- `cc_addresses`
- `subject`
- `body_text`
- `body_html`
- `sent_at`
- `received_at`
- `ingested_at`

#### `message_attachment`

Represents attachments tied to a message.

Suggested fields:

- `id`
- `message_id`
- `file_name`
- `content_type`
- `file_size_bytes`
- `storage_key`
- `file_hash`
- `is_supported`
- `created_at`

#### `availability_conflict`

Represents an active date conflict or occupancy decision that requires human
coordination.

Suggested fields:

- `id`
- `status`
- `conflict_type`
- `request_id`
- `reservation_id`
- `notes`
- `created_by`
- `resolved_by`
- `created_at`
- `resolved_at`

#### `audit_log`

Represents traceability for critical changes.

It must record:

- actor
- action
- target type
- target id
- previous status
- next status
- metadata
- timestamp

## Canonical State Model

### `booking_request` states

- `request_received`
- `awaiting_initial_email`
- `awaiting_transfer`
- `proof_received`
- `needs_attention`
- `converted_to_reservation`
- `cancelled`

### `reservation` states

- `confirmed`
- `assigned`
- `checked_in`
- `checked_out`
- `cancelled`
- `no_show`

### State rule simplification

`ota_imported_confirmed` is removed as a business status.

OTA reservations enter as:

- `reservation.status = confirmed`
- `reservation.source_channel = ota`

This keeps one operational state machine and uses source metadata to preserve
channel semantics.

## Availability and Conflict Rules

### Core rule

Availability belongs to real reservations, not to web requests.

### Implications

- A `booking_request` never blocks inventory directly.
- A `reservation` blocks occupancy only after it exists as a real confirmed
  operational stay.
- OTA stays continue entering as already confirmed reservations.

### Conflict rule

If a web request overlaps a confirmed reservation or any operationally sensitive
occupancy situation, the system must not auto-close the case.

It must:

- create `availability_conflict`
- surface a visible alert in back office
- preserve the thread with the guest
- let operations coordinate alternative dates manually

### Conversion rule

When back office confirms the transfer:

1. validate the request can still become a reservation
2. if there is no blocking rule, convert the request
3. create `reservation.status = confirmed`
4. generate occupancy records
5. keep audit continuity from request to reservation

If a conflict prevents conversion, the transaction must abort and only the
conflict record should remain.

## Hybrid Mail Architecture

### Canonical mailbox

- `reservas@wakayaecolodge.com`

### Provider split

#### `Resend`

Used for:

- initial transfer-instructions email
- automatic request receipt confirmation
- operational notifications derived from business events
- explicit transactional messages generated by the system

#### `Zoho Mail`

Used for:

- the real mailbox behind `reservas@wakayaecolodge.com`
- receiving guest replies
- preserving human thread continuity
- reading messages and attachments inside back office
- sending operational follow-ups from the same business conversation

### Operational rule

Back office remains the primary operator surface.

Staff should not need to leave the ERP to:

- review the conversation
- inspect a PDF or image proof
- reply to the guest
- confirm the transfer
- move the case forward

### Thread correlation

The system must keep a stable local `thread_key` that links:

- `booking_request`
- `message_thread`
- outbound transactional email
- inbound guest replies
- final converted `reservation`

### Attachment support

Attachments are required from day 1 of the MVP.

Supported MVP attachment categories:

- image files used as transfer proof
- PDF proof of transfer

Required handling:

- validate MIME type
- validate file size
- store a durable reference
- preserve audit visibility
- prevent duplicate ingestion for the same provider message

## Back Office Product Behavior

The reservation team must be able to operate the full manual-payment flow in a
single internal product surface.

### Required capabilities

- list web requests
- list OTA reservations
- open a request detail
- see thread history
- inspect attachments
- manually reply in the same thread
- confirm transfer
- convert request to reservation
- detect and manage conflicts
- continue to bungalow assignment

### Product principle

The system is not a payment gateway.

It is a request-review-confirmation workspace with traceable email-assisted
operations.

## Public Site Continuity

### Main rule

The approved home remains the visual reference.

The next public pages must feel like the same product family without becoming a
second home.

### Pages prioritized in this cut

- `Nosotros`
- `Contacto`
- public request forms
- bungalow or product detail pages

### Visual direction

These pages should inherit from the home:

- typography quality
- stronger image-led composition
- premium spacing rhythm
- richer section sequencing
- gallery and slider behavior where relevant
- more intentional iconography
- a refined editorial tone

They should not inherit:

- the exact oversized hero structure of the home
- duplicated home section order
- unnecessary motion in dense forms

### Form behavior rule

Public forms are no longer isolated lead boxes.

They must point to the operational `booking_request` flow and make the response
promise explicit:

- request received
- Wakaya will contact the guest
- final reservation is not confirmed yet

## SEO Baseline

SEO is part of this cut, but the explicit priority is the home.

### Home SEO priorities

- strong title and meta description aligned with Wakaya's hospitality offer
- canonical URL discipline
- stable heading hierarchy
- structured internal linking toward accommodation and contact paths
- image alt discipline on hero and featured accommodation blocks
- Open Graph and share metadata
- performance discipline that does not destroy the first visual impression

### Minimum SEO baseline for interior pages

- unique page titles
- unique meta descriptions
- one clear H1
- canonical URL
- semantic sections
- clean internal links
- indexable contact and accommodation detail pages

### Out of scope for this cut

- full content-led SEO program
- multilingual metadata strategy
- large schema.org content expansion beyond what is needed immediately

## Error Handling

The MVP must absorb operational failures without losing traceability.

### Required failure behaviors

- if request creation fails, no partial request survives
- if initial mail send fails, the request remains visible for retry and
  intervention
- if Zoho sync fails, the thread remains linked and marked as degraded
- if attachment validation fails, the message remains visible with attachment
  failure context
- if request conversion fails due to occupancy or concurrency, no half-created
  reservation survives
- if two operators act at once, one action wins and the other sees a concurrency
  response

### Transaction rule

The following actions must be transactional:

- create booking request
- convert request to reservation
- create occupancy
- create conflict
- write audit

## Idempotency Rules

Idempotency is mandatory for this cut.

### Required unique keys

- `booking_request.public_ref`
- `reservation.source_request_id` when derived from web
- `message_item.provider_message_id`
- `message_thread.thread_key`
- `message_attachment.file_hash` per message context
- occupancy uniqueness per bungalow and date

### Required idempotent operations

- resend initial email retry
- inbound message resync
- attachment reprocessing
- request-to-reservation conversion retry
- conflict creation retry

### Recommended pattern

- PostgreSQL source of truth
- explicit outbox for outbound operations
- sync checkpoint for inbound Zoho reads
- optimistic locking or equivalent versioning for sensitive human actions

## Test Strategy

### Slice A: domain and persistence

- unit tests for `booking_request` state logic
- unit tests for request-to-reservation conversion
- unit tests for conflict generation
- data tests for uniqueness and idempotency
- tests proving operational behavior no longer depends on SQLite or demo seeds

### Slice B: mail adapters

- contract tests for Resend adapter
- contract tests for Zoho adapter
- outbox retry tests
- inbound deduplication tests
- attachment validation tests

### Slice C: back office

- end-to-end request review test
- thread visibility test
- attachment inspection test
- transfer confirmation test
- conversion to reservation test
- conflict alert test
- assignment continuation test

### Slice D: public site

- public form submission test
- success state test using request language, not confirmed-reservation language
- integration test against the new public intake route
- smoke tests for redesigned internal public pages

### Slice E: regression

- existing reservation monitor does not collapse
- OTA flow remains operational
- reports and RBAC remain intact

## Exact MVP Ready Criteria

The cut is considered executable only if all of the following are true:

1. the operational reservations flow no longer depends on SQLite
2. demo data is removed from the real operational path
3. PostgreSQL is the only operational database for this module
4. a public request creates a real `booking_request`
5. the initial transactional email is sent from
   `reservas@wakayaecolodge.com`
6. the guest reply and attachment become visible in back office
7. staff can review and reply without leaving the ERP
8. transfer confirmation converts the request into
   `reservation.status = confirmed`
9. conflicts become operational alerts instead of silent failures
10. OTA reservations still enter as preapproved confirmed reservations
11. public forms point to the new request flow
12. the agreed test suite for this cut is green
13. documentation exists for architecture, env, mailbox setup, runbook, and
    residual risks

## Execution Order

The implementation order for the next phase is:

1. formalize this spec and derive the implementation plan
2. migrate the domain model and persistence to PostgreSQL-only behavior
3. remove SQLite-backed operational behavior and demo seeds
4. implement `booking_request`
5. implement Resend transactional outbound
6. implement Zoho inbox synchronization and attachment ingestion
7. implement back office review and conversion flow
8. connect public forms to the new request flow
9. redesign prioritized public interior pages with home continuity
10. run full verification and document the cut

## Non-Goals for This Cut

- building an automated payment gateway
- turning mail into a separate platform for other products
- implementing all public pages before the operational flow is closed
- solving long-term SEO strategy beyond the home-first baseline

## Approval Outcome

Conversation approval already obtained for:

- separating `booking_request` from `reservation`
- using Resend plus Zoho as a hybrid mail architecture
- making `reservas@wakayaecolodge.com` the canonical mailbox
- requiring attachment handling from day 1
- treating conflicts as operational alerts instead of auto-rejections
- using PostgreSQL as the only real operational database
- preserving the approved home style while improving public interior pages
- including SEO, with explicit priority on the home

This file becomes the governing design for the next planning and implementation
cycle of this MVP cut.
