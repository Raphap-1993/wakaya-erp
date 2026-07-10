# Wakaya Editable Public Home Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Wakaya Home Content Management Design](../specs/2026-07-09-wakaya-home-content-management-design.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished `/admin/home` editor that immediately publishes bilingual slider, text, CTA, media, section visibility/order, and safe typography changes without breaking the existing public-home or reservation logic.

**Architecture:** Add a dedicated `home-content` domain with Zod validation, PostgreSQL publication/revision persistence, optimistic concurrency, and a runtime fallback to the exact current home snapshot. The admin editor publishes a complete version atomically; the localized public home renders only validated section models and keeps bungalow content in the existing bungalow source of truth.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zod 4, PostgreSQL, CSS Modules, Vitest, Playwright, existing backoffice session/RBAC and Sharp media pipeline.

---

## Execution preflight

The current checkout contains authoritative modified and untracked public-site files.
A new worktree created from `HEAD` alone is not a valid implementation baseline.

- [ ] **Step 1: Inspect the current checkout without changing it**

Run:

```bash
git status --short --branch
git diff --name-only
git ls-files --others --exclude-standard
```

Expected: the checkout is dirty and includes scoped paths such as
`src/app/[locale]/**`, `src/components/public-site/**`, and bungalow backoffice files.

- [ ] **Step 2: Invoke `superpowers:using-git-worktrees` before implementation**

The isolation decision must preserve both tracked diffs and required untracked files.
Do not create a clean worktree and silently drop the current localized site. If the
skill cannot safely create a snapshot-overlay worktree, execute in the current checkout
with scoped edits and exact-file commits.

- [ ] **Step 3: Capture the scoped baseline**

Run:

```bash
git status --short -- 'src/app/[locale]' src/components/public-site src/app/admin src/lib db/migrations specs docs
npm test -- 'src/app/[locale]/localized-public-site.test.tsx' src/app/admin/admin-shell.test.tsx
npm run typecheck
```

Expected: record the existing pass/fail baseline before feature changes. Any existing
failure must be documented and not attributed to this feature.

## Task 1: Normalize the canonical project documentation

**Files:**
- Modify: `docs/fase-0-iniciacion/00.01-vision-proyecto.md`
- Modify: `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`
- Modify: `docs/fase-3-arquitectura/03.00-arquitectura.md`

- [ ] **Step 1: Replace residual template-domain language**

Update the three documents so they describe:

```text
Domain: reservations, bungalows, booking requests, public hospitality site
Frontend/backend: Next.js App Router application with route handlers
Persistence: PostgreSQL plus controlled local fallback
Security: backoffice session/OIDC compatibility and RBAC
Public content: bilingual ES/EN with admin-controlled publishing
```

Remove every reference to expedientes, bandeja documental, Angular, Nx, Quarkus and
Flyway when it claims to describe the current Wakaya implementation.

- [ ] **Step 2: Verify the domain cleanup**

Run:

```bash
rg -n -i 'expediente|bandeja documental|Angular|Quarkus|Flyway|workspace Nx' docs/fase-0-iniciacion/00.01-vision-proyecto.md docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md docs/fase-3-arquitectura/03.00-arquitectura.md
```

Expected: no matches.

- [ ] **Step 3: Run documentation checks**

Run:

```bash
npm run check:docs > /tmp/wakaya-check-docs.log 2>&1
rg -n '00.01-vision-proyecto|01.00-analisis-requerimientos|03.00-arquitectura' /tmp/wakaya-check-docs.log
npm run check:architecture-baseline
```

Expected: no findings for the three files changed in Task 1. The current full-repo
baseline contains 62 pre-existing documentation findings, including generated `.next`
copies and unrelated older plans; the count must not increase and none may be caused by
this feature.

- [ ] **Step 4: Commit the normalization**

```bash
git add docs/fase-0-iniciacion/00.01-vision-proyecto.md docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md docs/fase-3-arquitectura/03.00-arquitectura.md
git commit -m "docs: align Wakaya architecture with current stack"
```

## Task 2: Create the canonical feature specification and prototype

**Files:**
- Create: `specs/005-home-content-management/product-design.md`
- Create: `specs/005-home-content-management/spdd-frontend.md`
- Create: `specs/005-home-content-management/prototype.md`
- Create: `specs/005-home-content-management/prototype-validation.md`
- Create: `specs/005-home-content-management/prototype-html5/index.html`
- Create: `specs/005-home-content-management/spec-funcional.md`
- Create: `specs/005-home-content-management/spec-tecnica.md`
- Create: `specs/005-home-content-management/api-contract.md`
- Create: `specs/005-home-content-management/spec-tareas.md`
- Create: `specs/005-home-content-management/ui-test-cases.md`
- Create: `specs/005-home-content-management/traceability.md`
- Modify: `specs/README.md`

- [ ] **Step 1: Create the Product Design and SPDD documents**

Use the approved design document as the source of truth. The Product Design must include
these stable IDs:

```text
RF-HOME-01 Manage bilingual slider slides
RF-HOME-02 Manage bilingual section content
RF-HOME-03 Manage CTA labels and safe destinations
RF-HOME-04 Manage section visibility and order
RF-HOME-05 Select safe typography presets
RF-HOME-06 Publish immediately and atomically
RF-HOME-07 Preserve and restore publication revisions
RF-HOME-08 Preserve bungalow and booking logic
RF-HOME-09 Restrict publishing to content:write
```

The SPDD must define desktop, tablet and mobile behavior for:

```text
sticky publication bar
ES/EN language tabs
section structure rail
selected-section editor
desktop/mobile local preview
slider item manager
typography segmented control
CTA destination control
revision restore panel
validation and version-conflict states
```

- [ ] **Step 2: Build the HTML5 prototype**

Create a standalone accessible prototype that includes real Wakaya labels and these
interactive states:

```text
select a section
switch ES/EN
toggle section visibility
move a section up/down
select Normal/Grande/Destacado typography
add and reorder a slider item
switch desktop/mobile preview
show validation error
show publication success
show 409 conflict recovery
```

The prototype must not contain a generic CMS canvas, lorem ipsum, template-domain copy,
or controls for arbitrary HTML/CSS.

- [ ] **Step 3: Write the SDD artifacts**

The functional spec, technical spec, API contract, task spec, UI cases and traceability
must map every `RF-HOME-*` ID to implementation and evidence. The API contract must
define:

```http
GET /api/admin/home-content
PUT /api/admin/home-content
GET /api/admin/home-content/revisions
POST /api/admin/home-content/revisions/{version}/restore
POST /api/admin/home-content/media
```

`PUT` requires `expectedVersion` and returns `409 home_content_version_conflict` when
the stored version differs.

- [ ] **Step 4: Validate the prototype artifacts**

Run:

```bash
npm run check:prototype-html5 -- --strict
npm run check:prototype-visible-product -- --strict
npm run check:prototype-contract
npm run check:prototype-cross-links
npm run check:prototype-location
npm run check:prototype-domain-mismatch
npm run check:docs > /tmp/wakaya-check-docs.log 2>&1
rg -n 'specs/005-home-content-management' /tmp/wakaya-check-docs.log
```

Expected: prototype checks PASS and `check:docs` contains no finding under
`specs/005-home-content-management/`.

- [ ] **Step 5: Commit the reviewable SPDD package**

```bash
git add specs/005-home-content-management specs/README.md
git commit -m "docs: specify editable public home"
```

- [ ] **Step 6: Stop for human prototype validation**

Open `specs/005-home-content-management/prototype-html5/index.html`, capture desktop and
mobile evidence, and request explicit approval. Update
`prototype-validation.md` and `traceability.md` to `gate-spdd-approved: Aprobado` only
after the human response. Do not start Task 3 while the gate is pending.

## Task 3: Define and validate the home-content domain

**Files:**
- Create: `src/lib/home-content/types.ts`
- Create: `src/lib/home-content/default-content.ts`
- Create: `src/lib/home-content/schema.ts`
- Create: `src/lib/home-content/schema.test.ts`
- Create: `src/lib/home-content/public-view.ts`
- Create: `src/lib/home-content/public-view.test.ts`

- [ ] **Step 1: Write the failing schema tests**

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_HOME_CONTENT } from "./default-content";
import { homeContentDocumentSchema } from "./schema";

describe("homeContentDocumentSchema", () => {
  it("accepts the bilingual default home", () => {
    expect(homeContentDocumentSchema.parse(DEFAULT_HOME_CONTENT)).toEqual(DEFAULT_HOME_CONTENT);
  });

  it("rejects a home without a visible slide", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    input.slider.slides.forEach((slide) => {
      slide.visible = false;
    });
    expect(() => homeContentDocumentSchema.parse(input)).toThrow("visible_slide_required");
  });

  it("rejects unsafe CTA protocols", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    input.slider.slides[0].primaryCta.destination = {
      kind: "external",
      value: "javascript:alert(1)",
    };
    expect(() => homeContentDocumentSchema.parse(input)).toThrow("invalid_cta_destination");
  });

  it("rejects display typography for body copy", () => {
    const input = structuredClone(DEFAULT_HOME_CONTENT);
    input.sections[0].style.bodySize = "display";
    expect(() => homeContentDocumentSchema.parse(input)).toThrow("invalid_body_size");
  });
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- src/lib/home-content/schema.test.ts
```

Expected: FAIL because the home-content modules do not exist.

- [ ] **Step 3: Add the closed domain types**

Define discriminated unions instead of generic records:

```ts
export type PublicSiteLocale = "es" | "en";
export type HeadingSizePreset = "regular" | "large" | "display";
export type BodySizePreset = "small" | "regular" | "large";
export type HomeSectionType =
  | "booking-band"
  | "stats"
  | "story"
  | "bungalows"
  | "quote-band"
  | "experiences"
  | "testimonials"
  | "closing-cta";

export type CtaDestination =
  | { kind: "internal"; value: "about" | "bungalows" | "contact" | "services" }
  | { kind: "phone"; value: string }
  | { kind: "whatsapp"; value: string }
  | { kind: "external"; value: string };

export interface LocalizedText {
  es: string;
  en: string;
}

export interface LocalizedValue<T> {
  es: T;
  en: T;
}

export interface HomeTextStyle {
  headingSize: HeadingSizePreset;
  bodySize: BodySizePreset;
}

export interface HomeCta {
  label: LocalizedText;
  destination: CtaDestination;
}

export interface HomeSlide {
  id: string;
  visible: boolean;
  order: number;
  image: string;
  style: HomeTextStyle;
  content: LocalizedValue<{
    eyebrow: string;
    title: string;
    subtitle: string;
    copy: string;
    scrollLabel: string;
  }>;
  primaryCta: HomeCta;
  secondaryCta: HomeCta | null;
}

export interface HomeSlider {
  autoplay: boolean;
  intervalMs: 4000 | 4800 | 6000 | 8000 | 10000;
  slides: HomeSlide[];
}

export interface HomeSectionBase<TType extends HomeSectionType, TContent> {
  id: string;
  type: TType;
  visible: boolean;
  order: number;
  style: HomeTextStyle;
  content: LocalizedValue<TContent>;
  ctas: HomeCta[];
}

export type HomeSection =
  | HomeSectionBase<"booking-band", BookingBandContent>
  | HomeSectionBase<"stats", StatsContent>
  | HomeSectionBase<"story", StoryContent>
  | HomeSectionBase<"bungalows", BungalowsContent>
  | HomeSectionBase<"quote-band", QuoteBandContent>
  | HomeSectionBase<"experiences", ExperiencesContent>
  | HomeSectionBase<"testimonials", TestimonialsContent>
  | HomeSectionBase<"closing-cta", ClosingCtaContent>;

export interface HomeContentDocument {
  schemaVersion: 1;
  slider: HomeSlider;
  sections: HomeSection[];
}
```

Define `BookingBandContent`, `StatsContent`, `StoryContent`, `BungalowsContent`,
`QuoteBandContent`, `ExperiencesContent`, `TestimonialsContent`, and
`ClosingCtaContent` with the exact current fields used by their corresponding JSX.
`BungalowsContent` includes `visibleCount: 2 | 3 | 4`; each section stores zero, one or
two shared-destination `HomeCta` items according to its type. Do not use
`Record<string, unknown>` for editable content.

- [ ] **Step 4: Create the exact current-home default**

Move the current hardcoded `buildHomeExperience()` content into
`DEFAULT_HOME_CONTENT`, preserving every current ES/EN string, image, CTA, booking
label, stat, experience and testimonial. Define three independent slider items rather
than deriving slides from other sections.

- [ ] **Step 5: Implement the Zod schema and public mapper**

The schema must enforce:

```text
schemaVersion = 1
1..8 slider items
at least one visible slider item
unique IDs
unique section types
normalized order
allowed type-specific sizes
required localized text for visible content
safe internal/phone/WhatsApp/HTTPS destinations
bungalow visibleCount = 2..4
```

`toLocalizedHomeView(document, locale)` returns ordered visible slides and sections
with resolved text and safe `href` values.

- [ ] **Step 6: Run GREEN and the mapper tests**

Run:

```bash
npm test -- src/lib/home-content/schema.test.ts src/lib/home-content/public-view.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit the domain**

```bash
git add src/lib/home-content
git commit -m "feat: define public home content domain"
```

## Task 4: Add publication and revision persistence

**Files:**
- Create: `db/migrations/007_public_home_content.sql`
- Create: `src/lib/home-content/repository.ts`
- Create: `src/lib/home-content/memory-repository.ts`
- Create: `src/lib/home-content/postgres-repository.ts`
- Create: `src/lib/home-content/repository.test.ts`
- Create: `src/lib/home-content/postgres-repository.test.ts`
- Create: `src/lib/home-content/last-known-valid-cache.ts`
- Create: `src/lib/home-content/last-known-valid-cache.test.ts`
- Create: `src/lib/home-content/store.ts`
- Create: `src/lib/home-content/store.test.ts`

- [ ] **Step 1: Write failing repository contract tests**

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_HOME_CONTENT } from "./default-content";
import { MemoryHomeContentRepository } from "./memory-repository";

describe("HomeContentRepository contract", () => {
  it("publishes atomically and stores the previous revision", async () => {
    const repository = new MemoryHomeContentRepository(DEFAULT_HOME_CONTENT);
    const current = await repository.getPublished();
    const next = structuredClone(current.content);
    next.slider.autoplay = false;

    const published = await repository.publish({
      expectedVersion: current.version,
      content: next,
      actorId: "admin-1",
    });

    expect(published.version).toBe(current.version + 1);
    expect((await repository.listRevisions())[0].version).toBe(current.version);
  });

  it("rejects stale expectedVersion without overwriting", async () => {
    const repository = new MemoryHomeContentRepository(DEFAULT_HOME_CONTENT);
    await expect(repository.publish({
      expectedVersion: 999,
      content: DEFAULT_HOME_CONTENT,
      actorId: "admin-1",
    })).rejects.toThrow("home_content_version_conflict");
    expect((await repository.getPublished()).version).toBe(1);
  });
});
```

Add a separate cache test that stores version 2, simulates a failing repository read,
and asserts the store returns cached version 2 rather than a partially parsed document.
Add another test with an empty cache that asserts the validated version-1 default is
returned.

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- src/lib/home-content/repository.test.ts
```

Expected: FAIL because the repository does not exist.

- [ ] **Step 3: Create the additive migration**

```sql
create table if not exists public_home_content (
  id text primary key,
  schema_version integer not null,
  version integer not null,
  content jsonb not null,
  updated_by text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public_home_content_revision (
  id bigserial primary key,
  home_id text not null references public_home_content(id),
  version integer not null,
  schema_version integer not null,
  content jsonb not null,
  published_by text not null,
  published_at timestamptz not null,
  unique(home_id, version)
);

create index if not exists public_home_content_revision_home_published_idx
  on public_home_content_revision(home_id, published_at desc);
```

Bootstrap the exact default only when `id = 'home'` is absent. The application service
must also bootstrap on first access so a fresh environment remains operable if seed and
runtime start are separate.

- [ ] **Step 4: Implement the repository interface and memory repository**

```ts
export interface PublishedHomeContent {
  id: "home";
  schemaVersion: 1;
  version: number;
  content: HomeContentDocument;
  updatedBy: string;
  updatedAt: string;
}

export interface HomeContentRevision {
  version: number;
  schemaVersion: 1;
  content: HomeContentDocument;
  publishedBy: string;
  publishedAt: string;
}

export interface PublishHomeContentInput {
  expectedVersion: number;
  content: HomeContentDocument;
  actorId: string;
}

export interface RestoreHomeContentInput {
  expectedVersion: number;
  revisionVersion: number;
  actorId: string;
}

export interface HomeContentRepository {
  getPublished(): Promise<PublishedHomeContent>;
  publish(input: PublishHomeContentInput): Promise<PublishedHomeContent>;
  listRevisions(limit?: number): Promise<HomeContentRevision[]>;
  restore(input: RestoreHomeContentInput): Promise<PublishedHomeContent>;
}
```

`restore()` must publish the selected revision as a new version and preserve the current
state as another revision.

- [ ] **Step 5: Implement PostgreSQL optimistic concurrency**

Within one transaction:

```sql
select * from public_home_content where id = 'home' for update;
insert into public_home_content_revision(
  home_id, version, schema_version, content, published_by, published_at
)
select id, version, schema_version, content, updated_by, updated_at
from public_home_content where id = 'home';
update public_home_content
set content = $1::jsonb,
    schema_version = $2,
    version = version + 1,
    updated_by = $3,
    updated_at = now()
where id = 'home' and version = $4
returning *;
```

If the update returns zero rows, roll back and throw
`home_content_version_conflict`.

- [ ] **Step 6: Resolve the provider at access time**

`store.ts` must select PostgreSQL when `DATABASE_URL` exists at call time and use the
memory repository otherwise. Cache every successfully validated publication in
`last-known-valid-cache.ts`; if a PostgreSQL read fails, return that cached publication,
or `DEFAULT_HOME_CONTENT` when no successful read has happened in the current process.
Do not freeze provider selection at module import.

- [ ] **Step 7: Run GREEN**

Run:

```bash
npm test -- src/lib/home-content/repository.test.ts src/lib/home-content/postgres-repository.test.ts src/lib/home-content/last-known-valid-cache.test.ts src/lib/home-content/store.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Rehearse the migration**

Run against the local test database:

```bash
npm run migrate
psql "$DATABASE_URL" -c "select id, version, schema_version from public_home_content;"
```

Expected: one `home` row at version 1 and no destructive schema changes.

- [ ] **Step 9: Commit persistence**

```bash
git add db/migrations/007_public_home_content.sql src/lib/home-content
git commit -m "feat: persist published home revisions"
```

## Task 5: Add RBAC and administrative APIs

**Files:**
- Modify: `src/lib/rbac.ts`
- Create: `src/lib/rbac.test.ts`
- Modify: `src/app/admin/admin-navigation.ts`
- Modify: `src/app/admin/admin-shell.test.tsx`
- Create: `src/app/api/admin/home-content/route.ts`
- Create: `src/app/api/admin/home-content/route.test.ts`
- Create: `src/app/api/admin/home-content/revisions/route.ts`
- Create: `src/app/api/admin/home-content/revisions/route.test.ts`
- Create: `src/app/api/admin/home-content/revisions/[version]/restore/route.ts`
- Create: `src/app/api/admin/home-content/revisions/[version]/restore/route.test.ts`

- [ ] **Step 1: Write failing permission and API tests**

```ts
import { describe, expect, it } from "vitest";
import { hasPermission } from "./rbac";

describe("home content permissions", () => {
  it("allows only admin to publish home content", () => {
    expect(hasPermission(["admin"], "content:write")).toBe(true);
    expect(hasPermission(["editor"], "content:write")).toBe(false);
    expect(hasPermission(["viewer"], "content:write")).toBe(false);
  });
});
```

The route tests must prove `401`, `403`, successful `GET`, successful `PUT`, validation
failure, `409`, revision listing, and restore.

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- src/lib/rbac.test.ts src/app/api/admin/home-content/route.test.ts
```

Expected: FAIL because `content:write` and the routes do not exist.

- [ ] **Step 3: Add `content:write` and navigation**

Add `content:write` to `Permission` and only to the `admin` role. Add this module:

```ts
{
  href: "/admin/home",
  label: "Contenido del home",
  icon: "content",
  permission: "content:write",
}
```

Update the shell icon mapping and dashboard card with direct operational copy.

- [ ] **Step 4: Implement GET and PUT**

Both handlers call `requirePermission(request, "content:write")`. `PUT` parses:

```ts
const publishHomeContentSchema = z.object({
  expectedVersion: z.number().int().positive(),
  content: homeContentDocumentSchema,
});
```

The actor ID comes from `auth.subject`. After successful persistence only, call:

```ts
revalidatePath("/es");
revalidatePath("/en");
```

Map `home_content_version_conflict` to HTTP `409` with the current published metadata.

- [ ] **Step 5: Implement revision list and restore**

List at most 20 newest revisions. Restore accepts the URL version and
`expectedVersion`, publishes a new version, then revalidates `/es` and `/en`.

- [ ] **Step 6: Run GREEN**

Run:

```bash
npm test -- src/lib/rbac.test.ts src/app/admin/admin-shell.test.tsx src/app/api/admin/home-content/route.test.ts src/app/api/admin/home-content/revisions/route.test.ts 'src/app/api/admin/home-content/revisions/[version]/restore/route.test.ts'
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit APIs and permission**

```bash
git add src/lib/rbac.ts src/lib/rbac.test.ts src/app/admin/admin-navigation.ts src/app/admin/admin-shell.test.tsx src/app/api/admin/home-content
git commit -m "feat: expose secured home publishing api"
```

## Task 6: Add home media upload

**Files:**
- Create: `src/lib/home-content/media.ts`
- Create: `src/lib/home-content/media.test.ts`
- Create: `src/app/api/admin/home-content/media/route.ts`
- Create: `src/app/api/admin/home-content/media/route.test.ts`

- [ ] **Step 1: Write failing media tests**

The tests must prove:

```text
admin permission required
JPEG/PNG/WebP accepted
unsupported type rejected
oversized file rejected
oversized dimensions rejected
output stored as optimized WebP
storage path uses home-content/{asset-id}.webp
failed upload never changes published content
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- src/lib/home-content/media.test.ts src/app/api/admin/home-content/media/route.test.ts
```

Expected: FAIL because the media service and route do not exist.

- [ ] **Step 3: Implement a home-specific media service**

Reuse the established Sharp constraints from bungalow media, but keep the home storage
namespace separate. Return:

```ts
export interface StoredHomeImage {
  url: string;
  width: number;
  height: number;
  contentType: "image/webp";
  sizeBytes: number;
}
```

- [ ] **Step 4: Implement the multipart route**

Read the `file` form field, optimize, store, and return `{ media }`. The route must not
mutate home content; the client adds the returned URL to its local form and publishes
only through the atomic `PUT` route.

- [ ] **Step 5: Run GREEN and commit**

```bash
npm test -- src/lib/home-content/media.test.ts src/app/api/admin/home-content/media/route.test.ts
npm run typecheck
git add src/lib/home-content/media.ts src/lib/home-content/media.test.ts src/app/api/admin/home-content/media
git commit -m "feat: upload optimized home media"
```

## Task 7: Build the structured `/admin/home` editor

**Files:**
- Create: `src/app/admin/home/page.tsx`
- Create: `src/app/admin/home/page.test.tsx`
- Create: `src/app/admin/home/home-editor.tsx`
- Create: `src/app/admin/home/home-editor.test.tsx`
- Create: `src/app/admin/home/home-structure-panel.tsx`
- Create: `src/app/admin/home/home-slider-editor.tsx`
- Create: `src/app/admin/home/home-section-editor.tsx`
- Create: `src/app/admin/home/home-cta-editor.tsx`
- Create: `src/app/admin/home/home-preview.tsx`
- Create: `src/app/admin/home/home-revisions.tsx`
- Create: `src/app/admin/home/home-editor.module.css`

- [ ] **Step 1: Write failing page and editor tests**

```ts
it("renders a bilingual structured editor for authorized admins", async () => {
  const html = renderToStaticMarkup(await AdminHomePage());
  expect(html).toContain("Contenido del home");
  expect(html).toContain("Español");
  expect(html).toContain("Inglés");
  expect(html).toContain("Guardar y publicar");
  expect(html).toContain("Vista previa");
});

it("shows every fixed home region without offering arbitrary blocks", () => {
  const html = renderToStaticMarkup(
    <HomeEditor
      actorLabel="Admin Wakaya"
      initialPublished={{
        id: "home",
        schemaVersion: 1,
        version: 1,
        content: DEFAULT_HOME_CONTENT,
        updatedAt: "2026-07-09T12:00:00.000Z",
        updatedBy: "admin-1",
      }}
      initialRevisions={[]}
    />,
  );
  expect(html).toContain("Slider");
  expect(html).toContain("Reserva rápida");
  expect(html).toContain("Cifras");
  expect(html).toContain("Historia");
  expect(html).toContain("Bungalows");
  expect(html).toContain("Experiencias");
  expect(html).toContain("Testimonios");
  expect(html).toContain("CTA final");
  expect(html).not.toContain("HTML personalizado");
});
```

Additional tests must cover local language switching, slide add/duplicate/delete/order,
section visibility/order, type-specific size presets, CTA kinds, unsaved preview,
validation errors, publication success, `409` preservation, revision restore and mobile
layout class contracts.

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- src/app/admin/home/page.test.tsx src/app/admin/home/home-editor.test.tsx
```

Expected: FAIL because `/admin/home` does not exist.

- [ ] **Step 3: Implement the protected server page**

`page.tsx` calls:

```ts
const auth = await requireAdminPageAccess("/admin/home", "content:write");
const [published, revisions] = await Promise.all([
  homeContentStore.getPublished(),
  homeContentStore.listRevisions(20),
]);
```

Pass only required actor display metadata, published content and revisions to the
client editor.

- [ ] **Step 4: Implement editor state and publication**

`home-editor.tsx` owns:

```text
active locale
active section/slide
local editable document
server version
desktop/mobile preview mode
field errors
save/upload/restore pending state
409 conflict metadata
```

`Guardar y publicar` sends the complete local document. Disable it only while a request
is in flight or the local document is invalid. On success replace version/metadata but
keep the current editor location.

- [ ] **Step 5: Implement the structure panel**

Render fixed regions with `Visible`, `Oculto`, `Completo`, `Requiere contenido` states.
Use explicit up/down buttons with accessible labels and keyboard operation. Normalized
ordering happens in one pure helper covered by tests.

- [ ] **Step 6: Implement slide and section editors**

Use typed field renderers for each section union. Do not use one dynamic
`Record<string, unknown>` form. Slider actions enforce 1..8 items and at least one
visible item before publication.

- [ ] **Step 7: Implement typography and CTA controls**

Render segmented buttons from the allowed type-specific presets. CTA destination uses
a kind selector and a validated value field. Internal links use a route selector rather
than free text.

- [ ] **Step 8: Implement media upload and preview**

Upload first, then update the local URL only after a successful response. A failed
upload leaves the previous image and form state untouched. Preview uses the same typed
public mapper as the real home.

- [ ] **Step 9: Implement revision restore**

Show version, actor and timestamp. Require one compact confirmation. Restore through the
API and replace editor content/version with the new published response.

- [ ] **Step 10: Implement responsive CSS**

Desktop uses structure/editor/preview regions. Tablet collapses preview below the
editor. Mobile uses a section selector, stacked fields, and a sticky bottom publish
action. Reuse admin tokens from the existing shell; do not introduce a separate visual
theme.

- [ ] **Step 11: Run GREEN and focused accessibility checks**

Run:

```bash
npm test -- src/app/admin/home/page.test.tsx src/app/admin/home/home-editor.test.tsx src/app/admin/admin-shell.test.tsx
npm run typecheck
npm run lint -- --quiet
```

Expected: PASS with no new warnings.

- [ ] **Step 12: Commit the editor**

```bash
git add src/app/admin/home src/app/admin/admin-navigation.ts src/app/admin/admin-shell.test.tsx
git commit -m "feat: add structured public home editor"
```

## Task 8: Render published content on the public home

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/localized-public-site.test.tsx`
- Create: `src/components/public-site/home-sections.tsx`
- Create: `src/components/public-site/home-sections.test.tsx`
- Modify: `src/components/public-site/home-hero-slider.tsx`
- Create: `src/components/public-site/home-hero-slider.test.tsx`
- Modify: `src/components/public-site/home-prototype.module.css`

- [ ] **Step 1: Write failing public rendering tests**

```ts
function renderHome(locale: PublicSiteLocale, content: HomeContentDocument) {
  const view = toLocalizedHomeView(content, locale);
  return renderToStaticMarkup(
    <HomeSections
      locale={locale}
      sections={view.sections}
      rooms={[{
        slug: "bungalow-family",
        image: "/images/bungalow-family.webp",
        displayName: "Bungalow Familiar",
        displayPriceFrom: "Desde S/ 380",
        displayTagline: "Familias",
        displayDescription: "Espacio familiar entre naturaleza.",
        displayCapacity: "Hasta 5 huéspedes",
        displayArea: "42 m²",
      }]}
    />,
  );
}

it("renders published ES content in configured section order", () => {
  const content = structuredClone(DEFAULT_HOME_CONTENT);
  const story = content.sections.find((section) => section.type === "story");
  const stats = content.sections.find((section) => section.type === "stats");
  if (!story || !stats) throw new Error("required_home_sections_missing");
  story.order = 1;
  story.content.es.title = "Historia editable";
  stats.order = 2;
  stats.content.es.title = "Cifras editables";
  const html = renderHome("es", content);
  expect(html.indexOf("Historia editable")).toBeLessThan(html.indexOf("Cifras editables"));
});

it("omits hidden sections and applies safe size classes", () => {
  const content = structuredClone(DEFAULT_HOME_CONTENT);
  const stats = content.sections.find((section) => section.type === "stats");
  const story = content.sections.find((section) => section.type === "story");
  if (!stats || !story) throw new Error("required_home_sections_missing");
  stats.visible = false;
  stats.content.en.title = "Hidden statistics";
  story.style.headingSize = "display";
  const html = renderHome("en", content);
  expect(html).not.toContain("Hidden statistics");
  expect(html).toContain('data-heading-size="display"');
  expect(html).not.toContain("style=\"font-size");
});

it("renders bungalow cards supplied by the existing bungalow source", () => {
  const html = renderHome("es", DEFAULT_HOME_CONTENT);
  expect(html).toContain("Bungalow Familiar");
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- src/components/public-site/home-sections.test.tsx src/components/public-site/home-hero-slider.test.tsx 'src/app/[locale]/localized-public-site.test.tsx'
```

Expected: FAIL because the home still builds hardcoded content.

- [ ] **Step 3: Extract typed public section components**

`home-sections.tsx` receives localized section unions and renders the existing visual
structures. It maps size presets to CSS data attributes/classes only. It preserves the
booking form action, query parameter names and required fields.

- [ ] **Step 4: Make the slider consume independent published slides**

Export its slide prop type from the home-content public view. Preserve arrows, dots,
autoplay cleanup and accessible labels. Use the configured safe interval and stop the
timer when autoplay is false or only one slide is visible.

- [ ] **Step 5: Replace hardcoded page content**

`page.tsx` loads:

```ts
const [published, rooms] = await Promise.all([
  homeContentStore.getPublished(),
  getLocalizedBungalows(locale),
]);
const home = toLocalizedHomeView(published.content, locale);
```

On repository or validation failure, the store returns the validated default snapshot.
Apply the configured bungalow count after the existing `featuredOnHome` and
`sortOrder` behavior.

- [ ] **Step 6: Add safe responsive typography mappings**

Use `clamp()` in CSS for each preset. Do not set inline font sizes from persisted data.
Verify hero, section heading and body presets separately.

- [ ] **Step 7: Run GREEN and regression tests**

Run:

```bash
npm test -- src/lib/home-content src/components/public-site/home-sections.test.tsx src/components/public-site/home-hero-slider.test.tsx 'src/app/[locale]/localized-public-site.test.tsx'
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit public integration**

```bash
git add 'src/app/[locale]/page.tsx' 'src/app/[locale]/localized-public-site.test.tsx' src/components/public-site/home-sections.tsx src/components/public-site/home-sections.test.tsx src/components/public-site/home-hero-slider.tsx src/components/public-site/home-hero-slider.test.tsx src/components/public-site/home-prototype.module.css
git commit -m "feat: render published home content"
```

## Task 9: Add end-to-end publishing evidence

**Files:**
- Create: `e2e/admin-home-content.spec.ts`
- Create: `docs/fase-6-qa/06.03-home-content-management-evidence.md`
- Create: `docs/fase-7-deploy/07.03-home-content-management-runbook.md`
- Modify: `specs/005-home-content-management/traceability.md`
- Modify: `specs/005-home-content-management/spec-tareas.md`
- Modify: `specs/005-home-content-management/prototype-validation.md`

- [ ] **Step 1: Write the failing E2E flow**

The test must:

```text
log in as an admin
open /admin/home
edit one Spanish and one English title
change a title size preset
add or reorder a slide
hide the stats section
publish
open /es and /en and verify immediate content
verify the safe size class/data attribute
verify the hidden section is absent
restore the previous revision
verify the original public content returns
```

- [ ] **Step 2: Run RED**

Run:

```bash
npx playwright test e2e/admin-home-content.spec.ts --project=chromium
```

Expected: FAIL at the first unimplemented or incorrect behavior.

- [ ] **Step 3: Fix only behavior exposed by the E2E test**

Do not loosen assertions. Apply the smallest production fix needed for each failure,
rerunning the focused unit test first when the failure reveals a lower-level defect.

- [ ] **Step 4: Run GREEN on desktop and mobile viewports**

Add a second `test.describe` block with
`test.use({ viewport: { width: 390, height: 844 } })` inside the spec and run:

```bash
npx playwright test e2e/admin-home-content.spec.ts e2e/public-home-parity.spec.ts --project=chromium
```

Expected: PASS with screenshots/traces retained for failures only.

- [ ] **Step 5: Write QA evidence and deploy/rollback runbook**

Record exact commands, dates, results, screenshots, migration rehearsal, fallback check,
revision restore, `/es` and `/en` smoke results. The runbook must include:

```text
pre-deploy backup
additive migration
zero-change visual check before first edit
controlled publication
restore revision
application rollback
health and log monitoring
```

- [ ] **Step 6: Update traceability and task status**

Every `RF-HOME-*` row must point to a spec, implementation file, automated test and QA
evidence. Do not mark gates approved without the actual evidence.

- [ ] **Step 7: Commit E2E and operational evidence**

```bash
git add e2e/admin-home-content.spec.ts docs/fase-6-qa/06.03-home-content-management-evidence.md docs/fase-7-deploy/07.03-home-content-management-runbook.md specs/005-home-content-management
git commit -m "test: verify public home publishing flow"
```

## Task 10: Full verification and completion audit

**Files:**
- Verify all files changed by Tasks 1-9

- [ ] **Step 1: Invoke `superpowers:verification-before-completion`**

Do not claim completion from focused tests alone.

- [ ] **Step 2: Run the complete automated gates**

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run check:docs
npm run check:prototype-portfolio
npm run check:trace-drift
npm run check:trace-coverage
npm run check:api-documented
npm run check:test-documented
npm run check:gates-mentioned
npm run check:status-coherence
npm run check:instantiation
npx playwright test e2e/admin-home-content.spec.ts e2e/public-home-parity.spec.ts --project=chromium
```

Expected: PASS or an evidence note that clearly separates pre-existing failures from
feature regressions. No feature regression may remain.

- [ ] **Step 3: Verify the runtime against PostgreSQL**

With the local app on the validated project port:

```bash
curl -sSf http://127.0.0.1:3212/es > /tmp/wakaya-home-es.html
curl -sSf http://127.0.0.1:3212/en > /tmp/wakaya-home-en.html
psql "$DATABASE_URL" -c "select id, version, updated_by, updated_at from public_home_content;"
psql "$DATABASE_URL" -c "select version, published_by, published_at from public_home_content_revision order by published_at desc limit 5;"
```

Expected: both routes return `200`, published content is present, and revision history
contains the controlled publish/restore cycle.

- [ ] **Step 4: Audit every acceptance criterion**

Create a final table with evidence for:

```text
structured beautiful admin layout
slider CRUD and order
ES/EN text editing
CTA editing and validation
section visibility and order
safe text sizes
immediate atomic publishing
content:write authorization
optimistic concurrency
revision restore
public fallback
bungalow-source preservation
booking-logic preservation
desktop/mobile behavior
production build
```

- [ ] **Step 5: Invoke `superpowers:requesting-code-review` and perform the review locally**

Do not spawn a subagent unless the user explicitly requests delegation. Apply the
skill's review checklist locally and resolve all critical and high-priority findings
before completion.

- [ ] **Step 6: Finish the branch only after all gates pass**

Invoke `superpowers:finishing-a-development-branch`. Do not merge, push or deploy unless
the user explicitly authorizes that external state change.
