# Wakaya Public Content, Media and Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one bilingual content hub with cropped WebP media and replace type-level pseudo-inventory with physical bungalow units, safe blocking, editable assignment suggestions, and public alternatives.

> **Fuente de verdad posterior (2026-07-10):** los conteos de nueve unidades usados al redactar este plan quedaron reemplazados por `2026-07-10-wakaya-public-source-truth-and-availability.md`: 17 unidades, distribuidas en 5 Familiar, 4 Matrimonial, 5 Individual, 2 Doble y 1 Triple.

**Architecture:** Keep the Next.js monolith and add two bounded modules: `src/lib/content` owns publication/media, while `src/lib/inventory` owns units, half-open date intervals and availability. PostgreSQL remains authoritative; reservations orchestrate transactional assignment, and public routes consume sanitized published views and aggregate availability.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PostgreSQL, Zod, Vitest, Playwright, `sharp`, `react-easy-crop`, filesystem `MediaStorage` configured by `WAKAYA_MEDIA_STORAGE_PATH`.

---

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Wakaya Public Content, Media and Inventory Design](../specs/2026-07-09-wakaya-public-content-media-inventory-design.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->

## Delivery sequence and gates

0. **E0 - SPDD:** Task 0 crea prototipos navegables 006/007 y obtiene validación humana.
1. **E1 - Content and media:** Tasks 1-6, solo después de E0; salida con tests, build y `gate-4-6`.
2. **E2 - Unit inventory and OTA:** Tasks 7-10B, solo después de E0; migración `--dry-run`, sync OTA idempotente y `gate-4-6`.
3. **E3 - Public cutover:** Tasks 11-12; salida por `gate-7-8` con backup, roll-forward, e2e, healthcheck y monitoreo.

> **Bloqueo obligatorio:** ninguna Task 1+ de backend, frontend, migración o integración puede iniciar hasta que Task 0 registre `gate-spdd-approved` para `006-public-content-hub` y `007-bungalow-unit-inventory`. Los validadores automáticos no sustituyen la aprobación humana.

### Task 0: Create and approve the navigable prototypes

**Owner:** Aether (UX/UI Senior)

**Files:**
- Create: `specs/006-public-content-hub/prototype.md`
- Create: `specs/006-public-content-hub/prototype-validation.md`
- Create: `specs/006-public-content-hub/prototype-html5/index.html`
- Create: `specs/007-bungalow-unit-inventory/prototype.md`
- Create: `specs/007-bungalow-unit-inventory/prototype-validation.md`
- Create: `specs/007-bungalow-unit-inventory/prototype-html5/index.html`
- Create: `output/playwright/006-public-content-hub/prototype-desktop.png`
- Create: `output/playwright/006-public-content-hub/prototype-mobile.png`
- Create: `output/playwright/007-bungalow-unit-inventory/prototype-desktop.png`
- Create: `output/playwright/007-bungalow-unit-inventory/prototype-mobile.png`

- [ ] **Step 1: Record the failing prototype gate**

Run:
```bash
npm run check:prototype-html5 -- --strict
npm run check:prototype-contract
```

Expected: FAIL for 006/007 because the navigable prototypes and validation records do not exist.

- [ ] **Step 2: Build the 006 prototype**

Create a navigable desktop/mobile HTML prototype for Home, Experiencias, Galería, Bungalows, dual hero crop, validation/conflict states, URL-driven experience popup, form with `requestedExperienceId`, and booking-request detail.

- [ ] **Step 3: Build the 007 prototype**

Create a navigable desktop/mobile HTML prototype for type summary, nine units, manual block, editable suggestion, sold-out types/dates, OTA assigned/conflict states and responsive behavior.

- [ ] **Step 4: Validate artifacts**

Run:
```bash
npm run check:prototype-html5 -- --strict
npm run check:prototype-contract
npm run check:prototype-coverage
npm run check:prototype-mock-data
```

Expected: PASS for both feature artifacts and required scenarios.

- [ ] **Step 5: Obtain human approval and record gates**

Review both prototypes with the product owner, record reviewer/date/evidence in each `prototype-validation.md`, and set `gate-spdd-approved` only when explicitly approved. If either remains unapproved, stop; do not start Task 1.

- [ ] **Step 6: Commit prototype evidence**

```bash
git add specs/006-public-content-hub/prototype.md specs/006-public-content-hub/prototype-validation.md specs/006-public-content-hub/prototype-html5 specs/007-bungalow-unit-inventory/prototype.md specs/007-bungalow-unit-inventory/prototype-validation.md specs/007-bungalow-unit-inventory/prototype-html5 output/playwright/006-public-content-hub output/playwright/007-bungalow-unit-inventory
git commit -m "design: approve content and inventory prototypes"
```

### Task 1: Correct stay intervals to `[check-in, checkout)`

**Files:**
- Create: `src/lib/inventory/intervals.ts`
- Create: `src/lib/inventory/intervals.test.ts`
- Modify: `src/lib/reservations/availability.ts`
- Modify: `src/lib/reservations/public-availability.ts`
- Test: `src/lib/reservations/public-availability.test.ts`

- [ ] **Step 1: Write the failing interval tests**

```ts
expect(nightsForStay("2026-08-10", "2026-08-12")).toEqual(["2026-08-10", "2026-08-11"]);
expect(stayRangesOverlap("2026-08-10", "2026-08-12", "2026-08-12", "2026-08-13")).toBe(false);
expect(() => nightsForStay("2026-08-12", "2026-08-12")).toThrow("invalid_stay_range");
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/lib/inventory/intervals.test.ts src/lib/reservations/public-availability.test.ts`

Expected: FAIL because the helper is absent and current ranges are inclusive.

- [ ] **Step 3: Implement the minimal shared rule**

```ts
export function stayRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return compareDateOnly(aStart, bEnd) < 0 && compareDateOnly(bStart, aEnd) < 0;
}
```

Make both reservation availability files import this module; remove inclusive expansion.

- [ ] **Step 4: Verify Green**

Run: `npm test -- src/lib/inventory/intervals.test.ts src/lib/reservations/public-availability.test.ts && npm run typecheck`

Expected: PASS; checkout-day turnover is allowed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/inventory src/lib/reservations/availability.ts src/lib/reservations/public-availability.ts src/lib/reservations/public-availability.test.ts
git commit -m "fix: use checkout-exclusive stay intervals"
```

### Task 2: Add the content domain and additive migration

**Files:**
- Create: `db/migrations/009_public_content_hub.sql`
- Create: `src/lib/content/types.ts`
- Create: `src/lib/content/schema.ts`
- Create: `src/lib/content/schema.test.ts`
- Create: `src/lib/content/store.ts`
- Create: `src/lib/content/store.test.ts`
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/schemas.ts`
- Modify: `src/lib/reservations/postgres-repository.ts`
- Test: `src/lib/reservations/postgres-repository.test.ts`

- [ ] **Step 1: Write failing schema/store tests**

```ts
expect(() => experienceSchema.parse(incompleteEnglishExperience)).toThrow();
await expect(store.createExperience(validExperience)).resolves.toMatchObject({ slug: "paseo-laguna", version: 1 });
await expect(store.publishGallery({ expectedVersion: 7, items: duplicatedOrder })).rejects.toThrow("content_order_invalid");
await expect(store.createBookingRequest({ ...validRequest, requestedExperienceId: "exp_01" })).resolves.toMatchObject({ requestedExperienceId: "exp_01" });
await expect(store.updateBungalowContent(typeId, { expectedVersion: 3, ...payload })).resolves.toMatchObject({ revisionVersion: 4 });
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/lib/content/schema.test.ts src/lib/content/store.test.ts`

Expected: FAIL because `content` and its tables do not exist.

- [ ] **Step 3: Implement schema and storage**

```sql
create table content_experience (
  id text primary key,
  slug text not null unique,
  visible boolean not null,
  sort_order integer not null,
  locale_content jsonb not null,
  card_asset_id text,
  hero_asset_id text,
  version integer not null default 1,
  deleted_at timestamptz
);

create table content_gallery (
  id text primary key check (id = 'global'),
  version integer not null default 1,
  updated_by text,
  updated_at timestamptz not null
);
```

Create `content_gallery_item` with `gallery_id -> content_gallery(id)`, `media_asset`, `media_variant`, and additive asset columns plus `revision_version integer not null default 1` on `bungalow_public_content`. Add nullable FK `booking_request.requested_experience_id -> content_experience(id)`. Map Home `expectedVersion` to the latest `home_content_revision.version`, Experience to `content_experience.version`, Gallery to `content_gallery.version`, and Bungalow to `bungalow_public_content.revision_version`.

- [ ] **Step 4: Verify Green**

Run: `npm test -- src/lib/content/schema.test.ts src/lib/content/store.test.ts src/lib/reservations/postgres-repository.test.ts && npm run typecheck`

Expected: PASS for bilingual CRUD, singleton gallery and optimistic versions.

- [ ] **Step 5: Commit**

```bash
git add db/migrations/009_public_content_hub.sql src/lib/content
git commit -m "feat: add public content domain"
```

### Task 3: Build deterministic WebP media processing

**Files:**
- Create: `src/lib/content/media/media-storage.ts`
- Create: `src/lib/content/media/filesystem-media-storage.ts`
- Create: `src/lib/content/media/image-optimizer.ts`
- Create: `src/lib/content/media/image-optimizer.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing optimizer tests with image fixtures**

```ts
const result = await optimizeContentImage(source, dualHeroCrops);
expect(result.master).toMatchObject({ format: "webp", quality: 95, nearLossless: true });
expect(result.master.width).toBeLessThanOrEqual(3200);
expect(result.variants.heroDesktop).toMatchObject({ width: 1920, height: 1080, quality: 88 });
expect(result.variants.heroMobile).toMatchObject({ width: 1080, height: 1350, quality: 88 });
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/lib/content/media/image-optimizer.test.ts`

Expected: FAIL because optimizer, storage contract and configurable filesystem adapter are absent.

- [ ] **Step 3: Implement the pipeline**

```ts
const master = sharp(input).rotate().resize({ width: 3200, height: 3200, fit: "inside", withoutEnlargement: true });
const masterBuffer = await master.webp({ nearLossless: true, quality: 95, effort: 6 }).toBuffer();
```

Validate normalized crops, output q88/q86/q84 variants, strip metadata, checksum before storage, and clean partial writes on failure.
The production adapter writes under `WAKAYA_MEDIA_STORAGE_PATH`; keep `.data/wakaya-media` only as local default. Test configured root, traversal rejection and deterministic backup-visible paths. Do not provision object storage.

- [ ] **Step 4: Verify Green**

Run: `npm test -- src/lib/content/media/image-optimizer.test.ts && npm run typecheck`

Expected: PASS for valid dual crop and canonical errors for missing/too-small crop.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/content/media
git commit -m "feat: add cropped webp content media"
```

### Task 3B: Migrate Home to v2 and converge legacy media routes

**Files:**
- Modify: `src/lib/home-content/types.ts`
- Modify: `src/lib/home-content/schema.ts`
- Modify: `src/lib/home-content/default-content.ts`
- Modify: `src/lib/home-content/store.ts`
- Modify: `src/lib/home-content/public-view.ts`
- Modify: `src/app/api/admin/home-content/media/route.ts`
- Modify: `src/app/api/bungalows/[id]/media/hero/route.ts`
- Modify: `src/app/api/bungalows/[id]/media/gallery/route.ts`
- Modify: `src/lib/reservations/schemas.ts`
- Create: `src/lib/content/no-parallel-media-pipeline.test.ts`

- [ ] **Step 1: Write failing convergence tests**

```ts
expect(homeContentV2Schema.parse(migrateHomeV1ToV2(DEFAULT_HOME_CONTENT)).schemaVersion).toBe(2);
expect(homeContentV2Schema.parse(migrateHomeV1ToV2(DEFAULT_HOME_CONTENT)).sections.find((item) => item.type === "experiences")?.experienceIds).toEqual(expect.any(Array));
expect(contentMediaService.createAsset).toHaveBeenCalledTimes(3);
expect(() => bungalowContentMutationSchema.parse({ heroImageUrl: "https://manual.example/hero.jpg" })).toThrow();
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/lib/home-content/schema.test.ts src/lib/home-content/public-view.test.ts src/lib/home-content/store.test.ts src/app/api/admin/home-content/media/route.test.ts 'src/app/api/bungalows/[id]/media/hero/route.test.ts' 'src/app/api/bungalows/[id]/media/gallery/route.test.ts' src/lib/content/no-parallel-media-pipeline.test.ts`

Expected: FAIL because Home embeds experience items and the compatibility routes still call separate media functions.

- [ ] **Step 3: Implement one content source**

Introduce `schemaVersion: 2`, transform v1 to a new immutable v2 revision, replace embedded experience items with `experienceIds`, and make all three legacy media endpoints delegate to `contentMediaService`. Remove manual URL fields from mutation schemas while preserving URL columns as read-only fallback.

- [ ] **Step 4: Verify Green**

Run: `npm test -- src/lib/home-content/schema.test.ts src/lib/home-content/public-view.test.ts src/lib/home-content/store.test.ts src/app/api/admin/home-content/media/route.test.ts 'src/app/api/bungalows/[id]/media/hero/route.test.ts' 'src/app/api/bungalows/[id]/media/gallery/route.test.ts' src/lib/content/no-parallel-media-pipeline.test.ts && npm run typecheck`

Expected: PASS; architecture test finds no direct callers of legacy optimizers and all compatibility routes use one media service.

- [ ] **Step 5: Commit**

```bash
git add src/lib/home-content src/app/api/admin/home-content/media 'src/app/api/bungalows/[id]/media' src/lib/reservations/schemas.ts src/lib/content/no-parallel-media-pipeline.test.ts
git commit -m "refactor: converge public content sources"
```

### Task 4: Expose content and media Route Handlers

**Files:**
- Create: `src/app/api/admin/content/route.ts`
- Create: `src/app/api/admin/content/experiences/route.ts`
- Create: `src/app/api/admin/content/experiences/[id]/route.ts`
- Create: `src/app/api/admin/content/gallery/route.ts`
- Create: `src/app/api/admin/content/gallery/items/[id]/route.ts`
- Create: `src/app/api/admin/content/bungalows/[id]/route.ts`
- Create: `src/app/api/admin/content/media/route.ts`
- Create: `src/app/api/admin/content/media/[id]/crops/route.ts`
- Test: matching `route.test.ts` files
- Modify: `src/lib/rbac.ts`

- [ ] **Step 1: Write failing contract and RBAC tests**

```ts
expect((await POST(asViewer(validUpload))).status).toBe(403);
expect((await POST(asEditor(heroWithoutMobileCrop))).status).toBe(422);
expect((await PUT(asEditor(staleVersion))).status).toBe(409);
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/app/api/admin/content/route.test.ts src/app/api/admin/content/experiences/route.test.ts 'src/app/api/admin/content/experiences/[id]/route.test.ts' src/app/api/admin/content/gallery/route.test.ts 'src/app/api/admin/content/bungalows/[id]/route.test.ts' src/app/api/admin/content/media/route.test.ts src/middleware/authn.test.ts`

Expected: FAIL because handlers and `content:write` are absent.

- [ ] **Step 3: Implement handlers against the documented contract**

```ts
const auth = await requirePermission(request, "content:write");
if (!auth.ok) return auth.response;
const form = await request.formData();
return jsonResponse({ asset: await contentService.createAsset(form, auth.subject) }, 201);
```

Return canonical `400/403/409/413/422` errors and never publish `processing` assets.

- [ ] **Step 4: Verify Green**

Run: `npm test -- src/app/api/admin/content/route.test.ts src/app/api/admin/content/experiences/route.test.ts 'src/app/api/admin/content/experiences/[id]/route.test.ts' src/app/api/admin/content/gallery/route.test.ts 'src/app/api/admin/content/bungalows/[id]/route.test.ts' src/app/api/admin/content/media/route.test.ts src/middleware/authn.test.ts && npm run typecheck`

Expected: PASS for CRUD, crop, version conflicts and permissions.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/content src/lib/rbac.ts src/middleware/authn.ts
git commit -m "feat: expose public content admin APIs"
```

### Task 5: Build `/admin/content` after the SPDD gate

**Gate:** Task 0 must already have recorded `gate-spdd-approved` for both features.

**Files:**
- Create: `src/app/admin/content/page.tsx`
- Create: `src/app/admin/content/content-hub.tsx`
- Create: `src/app/admin/content/content-hub.test.tsx`
- Create: `src/app/admin/content/media/crop-dialog.tsx`
- Create: `src/app/admin/content/content-hub.module.css`
- Modify: `src/app/admin/admin-navigation.ts`
- Modify: `src/app/admin/home/page.tsx`
- Modify: `src/app/admin/bungalows/page.tsx`
- Modify: `package.json`

- [ ] **Step 1: Write failing UI tests**

```tsx
expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Home", "Experiencias", "Galería", "Bungalows"]);
expect(screen.getByRole("button", { name: "Aplicar recortes" })).toBeDisabled();
await completeCrop("Desktop");
expect(screen.getByRole("button", { name: "Aplicar recortes" })).toBeDisabled();
await completeCrop("Mobile");
expect(screen.getByRole("button", { name: "Aplicar recortes" })).toBeEnabled();
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/app/admin/content/content-hub.test.tsx src/app/admin/content/media/crop-dialog.test.tsx src/app/admin/admin-shell.test.tsx`

Expected: FAIL because the hub and crop dialog do not exist.

- [ ] **Step 3: Implement the approved UI**

Install `react-easy-crop`; build tab state, list-first screens, ES/EN forms, accessible reorder controls and dual hero crop. Redirect legacy admin routes into the matching tab.

- [ ] **Step 4: Verify Green**

Run: `npm test -- src/app/admin/content/content-hub.test.tsx src/app/admin/content/media/crop-dialog.test.tsx src/app/admin/admin-shell.test.tsx && npm run typecheck`

Expected: PASS desktop semantics, keyboard reorder, crop gating and permissions.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app/admin/content src/app/admin/admin-navigation.ts src/app/admin/home/page.tsx src/app/admin/bungalows/page.tsx
git commit -m "feat: add unified content hub"
```

### Task 6: Publish experiences, gallery and URL-driven dialog

**Files:**
- Create: `src/components/public-site/experience-dialog.tsx`
- Create: `src/components/public-site/experience-dialog.test.tsx`
- Modify: `src/app/[locale]/services/page.tsx`
- Modify: `src/app/[locale]/gallery/page.tsx`
- Modify: `src/app/[locale]/contact/page.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/lib/home-content/public-view.ts`
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/schemas.ts`
- Modify: `src/lib/reservations/postgres-repository.ts`
- Modify: `src/app/admin/reservations/requests/[id]/page.tsx`
- Modify: `src/app/api/public/booking-requests/route.ts`
- Modify: `src/app/api/public/booking-requests/route.test.ts`

- [ ] **Step 1: Write failing navigation tests**

```tsx
expect(renderRoute("/es/services?experience=paseo-laguna")).toHaveAccessibleDialog("Paseo por la laguna");
expect(screen.getByRole("link", { name: "Consultar" })).toHaveAttribute("href", "/es/contact?experience=paseo-laguna#booking-request");
expect(await loadBookingRequest(created.id)).toMatchObject({ requestedExperienceId: "exp_01" });
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/components/public-site/experience-dialog.test.tsx 'src/app/[locale]/localized-public-site.test.tsx' src/components/public-site/public-booking-request-form.test.tsx 'src/app/admin/reservations/requests/[id]/page.test.tsx'`

Expected: FAIL because public content is still embedded and no dialog follows the query.

- [ ] **Step 3: Implement localized public views**

Read experiences/gallery from `content`; make `experience` the only dialog state; preserve unrelated query params on close, resolve slug to ID, persist `requestedExperienceId` independently from editable notes, and show it in booking-request detail.

- [ ] **Step 4: Verify Green and E1 gate**

Run: `npm test -- src/lib/content/schema.test.ts src/lib/content/store.test.ts src/lib/content/no-parallel-media-pipeline.test.ts 'src/app/[locale]/localized-public-site.test.tsx' src/components/public-site/experience-dialog.test.tsx src/components/public-site/public-booking-request-form.test.tsx 'src/app/admin/reservations/requests/[id]/page.test.tsx' && npm run build`

Expected: PASS. Record feature 006 `gate-4-6` evidence before E2.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale] src/components/public-site src/lib/home-content/public-view.ts
git commit -m "feat: publish content hub views"
```

### Task 7: Add physical unit schema, seed and dry-run backfill

**Files:**
- Create: `db/migrations/010_bungalow_unit_inventory.sql`
- Create: `scripts/backfill-bungalow-units.mjs`
- Create: `src/lib/inventory/types.ts`
- Create: `src/lib/inventory/backfill.ts`
- Create: `src/lib/inventory/backfill.test.ts`

- [ ] **Step 1: Write failing seed/backfill tests**

```ts
expect(seedUnitsByType).toMatchObject({ double: 5, family: 2, matrimonial: 1, triple: 1 });
expect(assignHistoricalUnits(nonOverlappingReservations).conflicts).toEqual([]);
expect(assignHistoricalUnits(overCapacityReservations).conflicts).toHaveLength(1);
expect(await allocateConcurrentReservations({ type: "double", count: 6 })).toMatchObject({ assigned: 5, conflicts: 1 });
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/lib/inventory/backfill.test.ts`

Expected: FAIL because units/backfill are absent.

- [ ] **Step 3: Implement additive migration and deterministic allocator**

```sql
alter table bungalow_unit add column version integer not null default 1;
alter table reservation add column bungalow_unit_id text references bungalow_unit(id);
alter table reservation_occupancy add column bungalow_unit_id text references bungalow_unit(id);
alter table reservation_occupancy drop constraint if exists reservation_occupancy_bungalow_id_date_key;

-- Migration 010 backfills every occupancy row to a physical unit here.
alter table reservation_occupancy alter column bungalow_unit_id set not null;
create unique index reservation_occupancy_unit_night_uq
  on reservation_occupancy (bungalow_unit_id, date)
  where status <> 'released';
create unique index availability_conflict_open_assignment_uq
  on availability_conflict (reservation_id, conflict_type)
  where status = 'open' and reservation_id is not null;
```

Seed `DOB-01..05`, `FAM-01..02`, `MAT-01`, `TRI-01`. Migration 010 deterministically backfills `bungalow_unit_id` by type/range before `NOT NULL`, aborts on over-capacity, drops the historical type/date unique, and creates only unit/date temporal uniqueness. `bungalow_id` remains the type without temporal uniqueness. The rehearsal script defaults to dry-run and writes only with `--apply` inside a transaction.

- [ ] **Step 4: Verify Green and migration rehearsal**

Run: `npm test -- src/lib/inventory/backfill.test.ts && node scripts/backfill-bungalow-units.mjs --dry-run`

Expected: PASS and JSON summary with nine units, assigned count and zero migration conflicts. A concurrent same-range scenario assigns five Doble units and rejects the sixth without overwriting nights.

- [ ] **Step 5: Commit**

```bash
git add db/migrations/010_bungalow_unit_inventory.sql scripts/backfill-bungalow-units.mjs src/lib/inventory
git commit -m "feat: add bungalow unit inventory schema"
```

### Task 8: Implement availability, blocks and alternative ranking

**Files:**
- Create: `src/lib/inventory/availability.ts`
- Create: `src/lib/inventory/availability.test.ts`
- Create: `src/lib/inventory/unit-lock.ts`
- Create: `src/lib/inventory/unit-lock.test.ts`
- Create: `src/lib/inventory/repository.ts`
- Create: `src/lib/inventory/postgres-repository.ts`
- Test: `src/lib/reservations/postgres-repository.test.ts`

- [ ] **Step 1: Write failing policy tests**

```ts
expect(findAvailableUnits(inputWithManualBlock).map((unit) => unit.code)).not.toContain("DOB-03");
expect(suggestUnit(availableUnits)?.code).toBe("DOB-02");
expect(rankAlternativeTypes({ guests: 2, types }).slice(0, 3).map((item) => item.capacity)).toEqual([2, 3, 4]);
expect(findAlternativeDates(soldOutInput)).toHaveLength(3);
expect(findAlternativeDates(soldOutInput).every((range) => daysBetween(soldOutInput.checkIn, range.checkIn) <= 60)).toBe(true);
expect(await captureLockOrder(() => withUnitLock(client, {
  unitIds: ["unit_dob_03", "unit_dob_01"],
  lockOwnerRows: lockReservationRow,
}, operation))).toEqual(["reservation-row", "unit_dob_01", "unit_dob_03", "operation"]);
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/lib/inventory/availability.test.ts src/lib/reservations/postgres-repository.test.ts`

Expected: FAIL because blocks and unit-level availability are absent.

- [ ] **Step 3: Implement policy and PostgreSQL queries**

Implement `withUnitLock(client, { unitIds, lockOwnerRows }, operation)`: invoke `lockOwnerRows` first, normalize/deduplicate/sort unit IDs, acquire `pg_advisory_xact_lock(hashtext(unit_id))` in ascending order, then execute `operation`. Test order, deduplication and rollback release. Combine active units, occupancy nights and active blocks; cap alternative types at three and search later check-ins through day 60.

- [ ] **Step 4: Verify Green**

Run: `npm test -- src/lib/inventory/availability.test.ts src/lib/inventory/postgres-repository.test.ts src/lib/inventory/unit-lock.test.ts src/lib/reservations/postgres-repository.test.ts && npm run typecheck`

Expected: PASS for checkout turnover, blocks, inactive units, suggestions and alternatives.

- [ ] **Step 5: Commit**

```bash
git add src/lib/inventory src/lib/reservations/postgres-repository.test.ts
git commit -m "feat: add unit availability policy"
```

### Task 9: Expose inventory APIs and build admin UI after the gate

**Gate:** Task 0 must already have recorded `gate-spdd-approved` for both features.

**Files:**
- Create: `src/app/api/admin/inventory/**`
- Create: `src/app/admin/inventory/**`
- Modify: `src/lib/inventory/unit-lock.ts`
- Modify: `src/lib/inventory/postgres-repository.ts`
- Modify: `src/app/admin/admin-navigation.ts`
- Test: matching API and UI tests

- [ ] **Step 1: Write failing contract/UI tests**

```ts
expect((await createBlock({ checkIn: "2026-08-10", checkout: "2026-08-12" })).blockedNights).toEqual(["2026-08-10", "2026-08-11"]);
expect(await raceBlockAgainstAssignment("unit_dob_02")).toHaveExactlyOneWinner();
expect(screen.getByText("Doble").closest("tr")).toHaveTextContent("5");
expect(screen.getByRole("radio", { name: /DOB-02/ })).toHaveAttribute("data-suggested", "true");
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/app/api/admin/inventory/units/route.test.ts 'src/app/api/admin/inventory/units/[unitId]/route.test.ts' src/app/api/admin/inventory/blocks/route.test.ts 'src/app/api/admin/inventory/blocks/[blockId]/cancel/route.test.ts' src/app/admin/inventory/page.test.tsx src/app/admin/inventory/inventory-workbench.test.tsx`

Expected: FAIL because APIs and surfaces do not exist.

- [ ] **Step 3: Implement approved admin workflow**

Import and use `withUnitLock` in repository methods that create or cancel a manual block. Creation uses a no-op owner-row callback, then unit advisory lock, then conflict revalidation/insert. Cancellation locks the block row first through `lockOwnerRows`, then its unit, revalidates status and cancels. Build the approved UI and enforce permissions separately.

- [ ] **Step 4: Verify Green**

Run: `npm test -- src/app/api/admin/inventory/units/route.test.ts 'src/app/api/admin/inventory/units/[unitId]/route.test.ts' src/app/api/admin/inventory/blocks/route.test.ts 'src/app/api/admin/inventory/blocks/[blockId]/cancel/route.test.ts' src/app/admin/inventory/page.test.tsx src/app/admin/inventory/inventory-workbench.test.tsx && npm run typecheck`

Expected: PASS for permissions, interval summary, overlap, cancel and responsive semantics.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/inventory src/app/admin/inventory src/app/admin/admin-navigation.ts
git commit -m "feat: add unit inventory operations"
```

### Task 10: Make reservation assignment transactional and editable

**Files:**
- Modify: `src/lib/inventory/unit-lock.ts`
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/repository.ts`
- Modify: `src/lib/reservations/postgres-repository.ts`
- Modify: `src/app/api/reservations/[id]/assign/route.ts`
- Modify: `src/app/admin/reservations/reservation-editor-form.tsx`
- Test: `src/app/api/reservations/[id]/assign/route.test.ts`
- Test: `src/lib/reservations/postgres-temporal.test.ts`

- [ ] **Step 1: Write a failing concurrency test**

```ts
const [first, second] = await Promise.allSettled([
  assign("reservation-a", { unitId: "unit_dob_02" }),
  assign("reservation-b", { unitId: "unit_dob_02" }),
]);
expect([first.status, second.status].sort()).toEqual(["fulfilled", "rejected"]);

const sixDoubles = await Promise.allSettled(createSameRangeReservations(6));
expect(sixDoubles.filter((item) => item.status === "fulfilled")).toHaveLength(5);
expect(sixDoubles.filter((item) => item.status === "rejected")).toHaveLength(1);
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- 'src/app/api/reservations/[id]/assign/route.test.ts' src/lib/reservations/postgres-temporal.test.ts src/lib/inventory/unit-lock.test.ts`

Expected: FAIL because assignment is type-level and lacks unit locking.

- [ ] **Step 3: Implement transactional revalidation**

Import `withUnitLock` from `src/lib/inventory/unit-lock.ts`. Pass a `lockOwnerRows` callback that locks the reservation row first; the helper then locks distinct unit IDs ascending before assignment revalidates and writes. Never acquire a reservation row after a unit lock. Keep unique `(bungalow_unit_id, date)` as final defense. On conflict return `409 unit_unavailable` plus a recalculated suggestion.

- [ ] **Step 4: Verify Green and E2 gate**

Run: `npm test -- 'src/app/api/reservations/[id]/assign/route.test.ts' src/lib/reservations/postgres-temporal.test.ts src/lib/inventory/unit-lock.test.ts src/app/admin/reservations/reservation-editor-form.test.tsx`

Expected: PASS with five concurrent Doble assignments, sixth rejected, exactly one winner for block-vs-assignment and OTA-vs-assignment, and no duplicate unit/night. Record migration rehearsal and feature 007 `gate-4-6` evidence.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reservations src/app/api/reservations/[id]/assign src/app/admin/reservations
git commit -m "feat: assign reservations to physical units"
```

### Task 10B: Integrate OTA import and sync with physical units

**Files:**
- Modify: `src/lib/inventory/unit-lock.ts`
- Modify: `src/lib/reservations/postgres-repository.ts`
- Modify: `src/lib/reservations/postgres-repository.test.ts`
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/app/api/integrations/otas/**`
- Modify: `src/app/api/reservations/[id]/ota/resync/route.ts`
- Modify: `src/app/api/reservations/[id]/ota/resolve-conflict/route.ts`
- Test: matching OTA Route Handler tests

- [ ] **Step 1: Write failing OTA allocation and replay tests**

```ts
const first = await importOtaReservation(mappedConfirmedEvent);
const replay = await importOtaReservation(mappedConfirmedEvent);
expect(first.bungalowUnitId).toBe("unit_dob_02");
expect(replay).toMatchObject({ reservationId: first.reservationId, bungalowUnitId: first.bungalowUnitId, idempotentReplay: true });
expect(await countOccupancy(first.reservationId)).toBe(2);
```

Add a sold-out test asserting `bungalowUnitId: null`, zero inserted nights and exactly one open `availability_conflict`; repeat it and assert the same reservation/conflict IDs.

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/lib/reservations/postgres-repository.test.ts src/app/api/integrations/otas/booking/sync/route.test.ts src/app/api/integrations/otas/booking/recover/route.test.ts 'src/app/api/reservations/[id]/ota/resync/route.test.ts' 'src/app/api/reservations/[id]/ota/resolve-conflict/route.test.ts' src/lib/inventory/unit-lock.test.ts`

Expected: FAIL because OTA import maps only the bungalow type and does not allocate physical units idempotently.

- [ ] **Step 3: Implement the transactional OTA policy**

Import `withUnitLock` from `src/lib/inventory/unit-lock.ts`. OTA passes a `lockOwnerRows` callback that locks the OTA link/reservation identity first; the helper then locks candidate unit IDs ascending before revalidation/writes. On sold-out, preserve the link, write no nights and upsert one conflict. Replays are idempotent; later retry may assign/resolve. Date/type changes secure the new allocation before release; cancellation releases idempotently.

- [ ] **Step 4: Verify Green and idempotency**

Run: `npm test -- src/lib/reservations/postgres-repository.test.ts src/app/api/integrations/otas/booking/sync/route.test.ts src/app/api/integrations/otas/booking/recover/route.test.ts 'src/app/api/reservations/[id]/ota/resync/route.test.ts' 'src/app/api/reservations/[id]/ota/resolve-conflict/route.test.ts' src/lib/reservations/postgres-temporal.test.ts src/lib/inventory/unit-lock.test.ts`

Expected: PASS for assigned import, sold-out, same-event replay, resolved retry, concurrent import, date/type update and cancellation, with no duplicate nights or conflicts.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reservations src/app/api/integrations/otas src/app/api/reservations/[id]/ota
git commit -m "feat: allocate bungalow units during ota sync"
```

### Task 11: Block unavailable public requests and present alternatives

**Files:**
- Create: `src/app/api/public/availability/route.ts`
- Create: `src/app/api/public/availability/route.test.ts`
- Modify: `src/app/api/public/booking-requests/route.ts`
- Modify: `src/app/api/public/booking-requests/route.test.ts`
- Modify: `src/components/public-site/public-booking-request-form.tsx`
- Test: `src/components/public-site/public-booking-request-form.test.tsx`

- [ ] **Step 1: Write failing public safety tests**

```ts
const response = await postBookingRequest(soldOutInput);
const payload = await response.json();
expect(response.status).toBe(409);
expect(await bookingRequestCount()).toBe(0);
expect(payload.alternatives).toHaveLength(3);
expect(payload.alternativeDates).toHaveLength(3);
expect(payload.alternativeDates.every((range) => daysBetween(soldOutInput.checkIn, range.checkIn) <= 60)).toBe(true);
expect(JSON.stringify(payload)).not.toContain("unit_dob");
```

- [ ] **Step 2: Verify Red**

Run: `npm test -- src/app/api/public/availability/route.test.ts src/app/api/public/booking-requests/route.test.ts src/components/public-site/public-booking-request-form.test.tsx`

Expected: FAIL because the current public check treats a type as a single unit.

- [ ] **Step 3: Implement server-authoritative preflight**

Return aggregate counts only; repeat availability inside booking request creation; persist nothing on sold-out; return at most three alternative types and the first three later dates for the same type/duration through day 60; render localized choices and allow the visitor to retry.

- [ ] **Step 4: Verify Green**

Run: `npm test -- src/app/api/public/availability/route.test.ts src/app/api/public/booking-requests/route.test.ts src/components/public-site/public-booking-request-form.test.tsx src/lib/inventory/availability.test.ts && npm run typecheck`

Expected: PASS for available, sold-out, alternatives and `503` fail-closed behavior.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/public src/components/public-site/public-booking-request-form.tsx src/components/public-site/public-booking-request-form.test.tsx
git commit -m "feat: enforce public unit availability"
```

### Task 12: Run E3 QA, migration rehearsal and production cutover

**Files:**
- Create: `e2e/public-content-hub.spec.ts`
- Create: `e2e/bungalow-unit-inventory.spec.ts`
- Create: `docs/fase-7-deploy/07.03-content-inventory-cutover.md`
- Create: `docs/fase-8-operacion/08.04-content-media-inventory-runbook.md`
- Modify: `specs/006-public-content-hub/traceability.md`
- Modify: `specs/007-bungalow-unit-inventory/traceability.md`

- [ ] **Step 1: Write failing end-to-end journeys**

Cover ES/EN experience publish/dialog/CTA, persisted `requestedExperienceId` in booking detail, dual crop, gallery order, nine-unit counts, manual block, editable suggestion, sold-out type/date alternatives, OTA assigned/sold-out/retry/idempotency and browser back/forward.

- [ ] **Step 2: Verify Red in the target-like environment**

Run: `npm run test:e2e -- e2e/public-content-hub.spec.ts e2e/bungalow-unit-inventory.spec.ts`

Expected: FAIL until all delivery slices and seeded PostgreSQL data are active.

- [ ] **Step 3: Prepare and execute the reversible cutover**

Document PostgreSQL plus `WAKAYA_MEDIA_STORAGE_PATH` backups, migration apply, backfill report, feature flags, PM2 release switch, healthcheck, smoke paths, maintenance mode, roll-forward release/migration and owners. Do not delete legacy columns. Before activation a failed cutover may return to the prior release; after accepting new writes, never restore the old DB blindly or boot a binary that ignores units/content. Restore backups separately for reconciliation or disaster recovery under explicit RPO/RTO.

- [ ] **Step 4: Verify full release and gate**

Run:
```bash
node scripts/backfill-bungalow-units.mjs --dry-run
npm test
npm run typecheck
npm run build
npm run test:e2e -- e2e/public-content-hub.spec.ts e2e/bungalow-unit-inventory.spec.ts
npm run check:docs
npm run check:trace-coverage
```

Expected: all commands PASS; dry-run reports zero conflicts; post-deploy health, filesystem storage write/read/backup, admin content, public popup, OTA sync and availability smokes pass. Monitor `media_processing_failed`, `unit_unavailable`, `bungalow_type_unavailable`, `availability_unavailable` and open OTA conflicts; close `gate-7-8` only with evidence.

- [ ] **Step 5: Commit release evidence**

```bash
git add e2e docs/fase-7-deploy/07.03-content-inventory-cutover.md docs/fase-8-operacion/08.04-content-media-inventory-runbook.md specs/006-public-content-hub/traceability.md specs/007-bungalow-unit-inventory/traceability.md
git commit -m "test: verify content and inventory cutover"
```
