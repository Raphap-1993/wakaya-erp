# Wakaya Public Source of Truth and Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Wakaya's approved service/contact catalog and make the ERP/public booking flow calculate real availability from 17 physical bungalows.

**Architecture:** Keep PostgreSQL as the runtime source of truth. Extend the existing bungalow catalog, unit inventory, availability service, and content hub rather than creating a second stock system. Use a dry-run/apply reconciliation command for persisted data, and keep public responses free of unit identifiers.

**Tech Stack:** Next.js 16, React 19, TypeScript, PostgreSQL, Zod, Vitest, Playwright, PM2/standalone runtime.

---

### Task 1: Lock the approved catalog in failing tests

**Files:**
- Modify: `src/lib/inventory/backfill.test.ts`
- Modify: `src/lib/inventory/availability.test.ts`
- Modify: `src/app/[locale]/localized-public-site.test.tsx`
- Modify: `src/lib/content/public-content.test.ts`

- [ ] Add assertions for five bungalow categories and exactly 17 active canonical units: Familiar 5, Matrimonial 4, Individual 5, Doble 2, Triple 1.
- [ ] Add public-catalog assertions for Individual and for exactly five approved services in Spanish and English.
- [ ] Run the four test files and verify RED failures report the old 4-category, 9-unit, 8-experience state.

### Task 2: Implement the 17-unit catalog and safe reconciliation

**Files:**
- Modify: `src/lib/reservations/wakaya-bungalows.ts`
- Modify: `src/lib/inventory/types.ts`
- Modify: `src/lib/inventory/backfill.ts`
- Modify: `scripts/backfill-bungalow-units.mjs`
- Modify: `scripts/seed.js`
- Modify: `src/lib/reservations/wakaya-bungalow-public-content.ts`
- Modify: `src/components/public-site/public-site-copy.ts`
- Modify: `src/app/[locale]/public-site-content.ts`
- Test: `src/lib/inventory/backfill.test.ts`
- Test: `src/lib/reservations/postgres-repository.test.ts`

- [ ] Add `individual` to the unit type and the public/operational bungalow catalog with bilingual public content.
- [ ] Replace the canonical blueprint with `FAM 5`, `MAT 4`, `IND 5`, `DOB 2`, `TRI 1`.
- [ ] Make the backfill report create/keep/archive/conflict actions. `--dry-run` must never mutate; `--apply` must abort when an obsolete unit has future blocking occupancy or an active block.
- [ ] Preserve referenced obsolete units as inactive audit records; delete only provably unreferenced extras.
- [ ] Run the focused tests and dry-run until GREEN, then inspect the JSON reconciliation report.

### Task 3: Publish exactly five services and correct contact channels

**Files:**
- Modify: `src/lib/content/default-experiences.ts`
- Modify: `scripts/backfill-public-content-hub.js`
- Modify: `src/components/public-site/figma-room-request-card.tsx`
- Modify: `src/components/public-site/play-footer.tsx`
- Modify: `src/app/[locale]/contact/page.tsx`
- Modify: `src/app/[locale]/complaints-book/page.tsx`
- Modify: `src/app/[locale]/bungalows/[slug]/page.tsx`
- Modify: `src/lib/mail/email-outbox.ts`
- Test: neighboring component/page/mail/content tests

- [ ] Write tests requiring the exact five localized service titles, both approved phone numbers, WhatsApp E.164 `51961508813`, and absence of `963 847 291`/`51963847291`.
- [ ] Run the tests and verify RED against current defaults and phone constants.
- [ ] Replace the default service dataset with Bodas, Eventos Corporativos, Full Day, Cenas Románticas, and Restaurante while reusing existing media where appropriate.
- [ ] Extend content reconciliation to upsert the five canonical services and archive every other published experience without destroying history.
- [ ] Centralize contact constants and update public pages, email, complaint content, and WhatsApp links.
- [ ] Run focused tests until GREEN.

### Task 4: Remove public implementation commentary and rebalance layout

**Files:**
- Modify: `src/components/public-site/public-company-content.ts`
- Modify: `src/components/public-site/public-site-copy.ts`
- Modify: `src/app/[locale]/public-site-content.ts`
- Modify: `src/components/public-site/page-hero.tsx`
- Modify: localized public page components only where empty copy wrappers remain
- Create: `src/app/[locale]/public-copy-governance.test.tsx`

- [ ] Add a rendered-copy regression test rejecting public phrases that reference architecture, prototypes, legacy/rescued content, developer intent, or redundant flow narration.
- [ ] Run the test and verify RED with the current public copy.
- [ ] Rewrite or remove the flagged copy in both locales, retaining only decision, policy, validation, and outcome information.
- [ ] Make optional support copy render conditionally and collapse empty wrappers; preserve existing tokens and responsive structure.
- [ ] Run public page tests until GREEN and inspect desktop/mobile routes for empty gaps or orphan headings.

### Task 5: Reframe the ERP around availability

**Files:**
- Modify: `src/app/admin/admin-navigation.ts`
- Modify: `src/app/admin/inventory/page.tsx`
- Modify: `src/app/admin/inventory/inventory-workbench.tsx`
- Modify: `src/app/admin/inventory/page.test.tsx`
- Modify: `e2e/bungalow-unit-inventory.spec.ts`

- [ ] Update tests to require `Disponibilidad de bungalows`, the five category summary, direct unit states, and no manual stock-decrement language.
- [ ] Run tests and verify RED on the old `Inventario de unidades` presentation.
- [ ] Rename and simplify the page hierarchy while keeping date filtering, unit editing, and manual blocks.
- [ ] Ensure confirmed reservations/manual blocks drive the summary and pending requests do not.
- [ ] Run unit and E2E inventory/booking availability tests until GREEN.

### Task 6: Rehearse data changes and run complete quality gates

**Files:**
- Update: `specs/007-bungalow-unit-inventory/*` only where the old 9-unit contract remains
- Update: `docs/fase-7-deploy/07.02-wakaya-reservations-env-checklist.md`
- Update: `docs/fase-8-operacion/08.03-wakaya-runbook-reservas-web.md`

- [ ] Run reconciliation against the local PostgreSQL database in dry-run mode and save the non-secret report.
- [ ] Back up the affected local tables, apply reconciliation, and verify five categories, 17 active units, and five visible services.
- [ ] Run focused Vitest suites, then full `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [ ] Start the production build locally and run Playwright for public availability, inventory, contact/WhatsApp, and public-copy smoke paths.
- [ ] Update specs/runbooks so deployment and rollback commands match the actual delivery path.

### Task 7: Deploy and verify production

**Files:**
- Create: `output/deploy/2026-07-10-wakaya-public-inventory-deploy.md`

- [ ] Discover and verify the current production host/process and capture a pre-deploy health baseline without exposing secrets.
- [ ] Create a production database backup and record the current application release for rollback.
- [ ] Sync/build the verified artifact, run migrations, execute reconciliation dry-run, review it, then apply it.
- [ ] Restart the existing Wakaya process with its current environment and verify process health.
- [ ] Smoke-test Spanish and English services, five bungalow categories including Individual, correct phones/WhatsApp, sold-out rejection, backoffice login, and `Disponibilidad de bungalows`.
- [ ] Confirm no obsolete public number or forbidden meta copy is served. Record rollback commands and evidence in the deploy log.
