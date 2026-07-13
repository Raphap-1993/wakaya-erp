# Wakaya Public Source of Truth and Bungalow Availability Design

## Goal

Align the public website and the ERP with Wakaya's approved source of truth: five public services, five bungalow categories backed by 17 physical units, correct contact numbers, assisted booking guarded by real date availability, and concise guest-facing copy without implementation commentary.

## Approved public content

- Public services are exactly: Bodas, Eventos Corporativos, Full Day, Cenas Románticas, and Restaurante.
- The same five services are published in Spanish and English. Existing public experiences outside this list are archived from public view.
- Public bungalow categories are Familiar, Matrimonial, Individual, Doble, and Triple.
- The website never exposes physical unit counts, internal IDs, or unit codes.
- Public phone numbers are `+51 961 508 813` and `+51 977 419 468`.
- WhatsApp buttons, generated links, and follow-up copy use only `+51 961 508 813` (`51961508813`).
- The obsolete number `+51 963 847 291` and its E.164 form are absent from public pages, transactional email, complaints content, and tests.

## Availability and booking behavior

- Physical inventory is: 5 Familiar, 4 Matrimonial, 5 Individual, 2 Doble, and 1 Triple.
- Initial editable unit codes are `FAM-01..05`, `MAT-01..04`, `IND-01..05`, `DOB-01..02`, and `TRI-01`.
- Availability is calculated for the complete half-open stay interval `[check-in, checkout)`.
- A unit is unavailable when inactive, manually blocked, or assigned to a confirmed blocking reservation for any requested night.
- Pending web requests do not consume inventory.
- The public form checks availability before persistence and rechecks it on submit.
- When available, the website creates an assisted booking request; confirmation remains a staff action.
- When sold out, no request is created. The response offers available categories and later dates without exposing unit data.
- Confirming a reservation suggests the first free physical unit by operational order. Staff may select another still-free unit before saving.

## ERP experience

- Rename the navigation item and page from `Inventario` to `Disponibilidad de bungalows`.
- The page starts with a date range and category summary showing active total, confirmed occupied, manually blocked, and available units.
- Selecting a category shows each physical unit with a direct state: Disponible, Reservada, Bloqueada, or Inactiva.
- Unit administration remains available for authorized staff: create, edit, reactivate/archive, and create/cancel date blocks.
- Availability is derived from units, reservations, and blocks. Staff never decrement a stock counter manually.
- Reconciliation is safe: new canonical units are created; obsolete excess units are archived only after a dry-run proves they have no blocking future assignment or active block. Historical referenced units remain inactive for auditability.
- Housekeeping, per-unit pricing, and a full PMS calendar remain out of scope.

## Public microcopy rule

- Remove developer-facing, template-facing, and migration-facing prose such as references to architecture, prototypes, the legacy site, rescued content, or how the page was designed.
- Remove paragraphs that narrate the UI flow or repeat a visible title, field, state, or CTA.
- Keep facts needed to decide or complete an action: service and bungalow facts, prices, dates, availability, contact details, policies, field validation, submission outcome, and sold-out alternatives.
- Apply the cleanup to every localized public route in Spanish and English, not only the pages touched by the catalog changes.
- Components must omit empty support-copy wrappers so the cleanup does not leave visual gaps. Preserve the existing brand and spacing system.

## Acceptance criteria

- The public services query returns exactly five approved services in both locales.
- The active unit source of truth returns exactly 17 units with counts `5/4/5/2/1`.
- A fully occupied category is rejected publicly without persisting a request; an available category permits an assisted request.
- Pending requests do not reduce availability; confirmed assignments and manual blocks do.
- The admin availability page uses the approved label and exposes category and physical-unit status for a date range.
- Both approved phones render where appropriate, every WhatsApp link targets `51961508813`, and the obsolete number is absent from served output.
- Public source and rendered pages contain no forbidden implementation/meta copy and no empty explanatory sections.
- Unit/integration tests, typecheck, production build, focused Playwright flows, migration rehearsal, deployment smoke tests, and rollback evidence are green before completion.
