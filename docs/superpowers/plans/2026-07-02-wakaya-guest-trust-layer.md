# Wakaya Guest Trust Layer Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Wakaya's public trust layer across the public site and back office, including policies, pet-friendly communication, online complaints, and internal complaint handling.

**Architecture:** Extend the existing public-site shell for guest-facing trust content, add a separate complaint entity and public intake endpoint in the reservations domain layer, and expose a dedicated admin inbox without coupling complaints to reservation confirmation flows.

**Tech Stack:** Next.js App Router, React, Vitest, CSS modules, in-memory fallback store, PostgreSQL-backed repository, SQL migrations.

---

### Task 1: Create feature specs for the guest trust layer

**Files:**
- Create: `specs/003-guest-trust-layer/product-design.md`
- Create: `specs/003-guest-trust-layer/spdd-frontend.md`
- Create: `specs/003-guest-trust-layer/prototype.md`
- Create: `specs/003-guest-trust-layer/prototype-validation.md`
- Create: `specs/003-guest-trust-layer/ui-test-cases.md`
- Create: `specs/003-guest-trust-layer/spec-funcional.md`
- Create: `specs/003-guest-trust-layer/spec-tecnica.md`
- Create: `specs/003-guest-trust-layer/api-contract.md`
- Create: `specs/003-guest-trust-layer/spec-tareas.md`
- Create: `specs/003-guest-trust-layer/traceability.md`

- [ ] **Step 1: Write the feature spec files**

Document:
- public policies and pet-friendly communication
- complaint intake and admin inbox
- separation between reservation requests and complaints

- [ ] **Step 2: Review the specs for scope and consistency**

Check that:
- public copy work belongs to this feature
- admin complaint handling is covered
- policy routes and intake routes are traceable

### Task 2: Add public trust surfaces with tests first

**Files:**
- Modify: `src/components/public-site/play-footer.tsx`
- Modify: `src/components/public-site/play-footer.test.tsx`
- Modify: `src/components/public-site/booking-band.tsx`
- Modify: `src/components/public-site/public-site-theme.module.css`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/app/[locale]/public-site-content.ts`
- Create: `src/app/[locale]/policies/page.tsx`
- Create: `src/app/[locale]/pet-friendly/page.tsx`
- Test: `src/components/public-site/play-footer.test.tsx`

- [ ] **Step 1: Write failing tests for footer trust links**
- [ ] **Step 2: Implement footer trust links and icons**
- [ ] **Step 3: Improve booking band mobile CTA**
- [ ] **Step 4: Add public policies and pet-friendly pages**
- [ ] **Step 5: Run focused tests**

### Task 3: Rewrite guest-facing copy on key public pages

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/about/page.tsx`
- Modify: `src/app/[locale]/bungalows/page.tsx`
- Modify: `src/app/[locale]/bungalows/[slug]/page.tsx`
- Modify: `src/app/[locale]/services/page.tsx`
- Modify: `src/app/[locale]/events/page.tsx`
- Modify: `src/app/[locale]/gallery/page.tsx`
- Modify: `src/app/[locale]/publications/page.tsx`
- Modify: `src/app/[locale]/contact/page.tsx`
- Modify: `src/app/[locale]/public-site-content.ts`

- [ ] **Step 1: Replace internal/system language with guest-facing language**
- [ ] **Step 2: Add pet-friendly and trust context where relevant**
- [ ] **Step 3: Strengthen route-level SEO copy and image text**
- [ ] **Step 4: Run focused public-page tests**

### Task 4: Add complaint model and public intake endpoint with TDD

**Files:**
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/repository.ts`
- Modify: `src/lib/reservations/store.ts`
- Modify: `src/lib/reservations/postgres-repository.ts`
- Modify: `src/lib/reservations/schemas.ts`
- Create: `src/app/api/public/complaints/route.ts`
- Create: `src/app/api/public/complaints/route.test.ts`
- Create: `db/migrations/005_complaints_book.sql`

- [ ] **Step 1: Write a failing test for public complaint creation**
- [ ] **Step 2: Implement complaint schema and tracking code generation**
- [ ] **Step 3: Persist complaints in fallback store and PostgreSQL**
- [ ] **Step 4: Implement the public POST endpoint**
- [ ] **Step 5: Run focused API/domain tests**

### Task 5: Add public Libro de Reclamaciones page with form

**Files:**
- Create: `src/app/[locale]/libro-de-reclamaciones/page.tsx`
- Create: `src/components/public-site/public-complaint-form.tsx`
- Create: `src/components/public-site/public-complaint-form.test.tsx`

- [ ] **Step 1: Write a failing form test**
- [ ] **Step 2: Implement the public complaint form**
- [ ] **Step 3: Connect it to the public complaints endpoint**
- [ ] **Step 4: Run focused form tests**

### Task 6: Add admin complaints inbox and detail view

**Files:**
- Modify: `src/app/admin/admin-navigation.ts`
- Create: `src/app/admin/complaints/page.tsx`
- Create: `src/app/admin/complaints/page.test.tsx`
- Create: `src/app/admin/complaints/[id]/page.tsx`
- Create: `src/app/admin/complaints/[id]/page.test.tsx`
- Modify: `src/lib/rbac.ts`

- [ ] **Step 1: Write failing tests for admin complaints listing**
- [ ] **Step 2: Expose complaint list/detail reads from the store layer**
- [ ] **Step 3: Add the admin complaints list page**
- [ ] **Step 4: Add the admin complaints detail page**
- [ ] **Step 5: Wire navigation and permissions**
- [ ] **Step 6: Run focused admin tests**

### Task 7: Verify the full slice

**Files:**
- Verify only

- [ ] **Step 1: Run targeted Vitest commands for public/footer/form/API/admin**
- [ ] **Step 2: Run `npm run typecheck`**
- [ ] **Step 3: Run `npm run test` if scope/time permits**
- [ ] **Step 4: Summarize residual risks if any verification remains out of scope**
