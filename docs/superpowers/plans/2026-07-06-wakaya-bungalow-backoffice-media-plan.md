# Wakaya Bungalow Backoffice Media Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the bungalow editor for daily backoffice use and add real image uploads with automatic WebP optimization and persisted media variants.

**Architecture:** Keep bungalow operation/public copy in the current domain, but introduce a dedicated persisted media layer for hero and gallery assets. The admin editor becomes a tabbed workflow with a visual media manager, while new Route Handlers and repository methods process uploads server-side with `sharp` and return structured variants for admin and public consumers.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, PostgreSQL, Route Handlers, `sharp`, Vitest.

---

### Task 1: Add persisted media types, schema, and repository coverage

**Files:**
- Create: `db/migrations/006_bungalow_public_media.sql`
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/schemas.ts`
- Modify: `src/lib/reservations/repository.ts`
- Modify: `src/lib/reservations/postgres-repository.ts`
- Modify: `src/lib/reservations/store.ts`
- Test: `src/lib/reservations/postgres-repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("persists bungalow hero and gallery assets separately from legacy urls", async () => {
  const hero = await store.replaceBungalowHero("bungalow-suite", sampleHeroAsset);
  const gallery = await store.addBungalowGalleryImages("bungalow-suite", [sampleGalleryAsset]);

  expect(hero.assetId).toBe("asset-hero-1");
  expect(gallery).toHaveLength(1);
  expect(gallery[0].variants.thumb.url).toContain(".webp");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/lib/reservations/postgres-repository.test.ts
```
Expected: FAIL because the repository does not expose media persistence methods yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
export interface BungalowMediaVariant {
  url: string;
  width: number;
  height: number;
  bytes: number;
}

export interface BungalowMediaAsset {
  assetId: string;
  originalFilename: string;
  mimeType: string;
  variants: Record<string, BungalowMediaVariant>;
}
```

```sql
create table if not exists media_asset (
  id text primary key,
  storage_key text not null,
  original_filename text not null,
  mime_type text not null,
  source_bytes integer not null,
  width integer not null,
  height integer not null,
  checksum text not null,
  variants_json jsonb not null,
  created_at timestamptz not null
);
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/lib/reservations/postgres-repository.test.ts src/lib/reservations/persistence.test.ts
```
Expected: PASS with persisted hero and gallery media records.

- [ ] **Step 5: Commit**

```bash
git add db/migrations/006_bungalow_public_media.sql src/lib/reservations/types.ts src/lib/reservations/schemas.ts src/lib/reservations/repository.ts src/lib/reservations/postgres-repository.ts src/lib/reservations/store.ts src/lib/reservations/postgres-repository.test.ts
git commit -m "feat: add bungalow media persistence"
```

### Task 2: Add server-side image optimization and storage adapters

**Files:**
- Create: `src/lib/reservations/media-storage.ts`
- Create: `src/lib/reservations/image-optimizer.ts`
- Create: `src/lib/reservations/image-optimizer.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```ts
it("converts a large jpeg into webp variants without enlargement", async () => {
  const result = await optimizeBungalowImage(sampleJpegBuffer, {
    originalFilename: "suite.jpg",
    mimeType: "image/jpeg",
    kind: "hero",
  });

  expect(result.variants.hero.url.endsWith(".webp")).toBe(true);
  expect(result.variants.hero.width).toBeLessThanOrEqual(1600);
  expect(result.variants.thumb.bytes).toBeLessThan(result.sourceBytes);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/lib/reservations/image-optimizer.test.ts
```
Expected: FAIL because the optimizer and `sharp` dependency do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
import sharp from "sharp";

export async function optimizeBungalowImage(input: Buffer, options: OptimizeOptions) {
  const hero = await sharp(input)
    .resize({ width: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer({ resolveWithObject: true });
```

```ts
export interface MediaStorage {
  put(key: string, data: Buffer, contentType: string): Promise<string>;
  remove(key: string): Promise<void>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/lib/reservations/image-optimizer.test.ts
npm run typecheck
```
Expected: PASS with deterministic WebP variants and typed storage adapter interfaces.

- [ ] **Step 5: Commit**

```bash
git add package.json src/lib/reservations/media-storage.ts src/lib/reservations/image-optimizer.ts src/lib/reservations/image-optimizer.test.ts
git commit -m "feat: add bungalow image optimizer"
```

### Task 3: Create media upload endpoints and gallery mutation routes

**Files:**
- Create: `src/app/api/bungalows/[id]/media/hero/route.ts`
- Create: `src/app/api/bungalows/[id]/media/hero/route.test.ts`
- Create: `src/app/api/bungalows/[id]/media/gallery/route.ts`
- Create: `src/app/api/bungalows/[id]/media/gallery/route.test.ts`
- Create: `src/app/api/bungalows/[id]/media/gallery/[mediaId]/route.ts`
- Create: `src/app/api/bungalows/[id]/media/gallery/[mediaId]/route.test.ts`
- Modify: `src/lib/reservations/http.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("accepts multipart hero upload and returns structured variants", async () => {
  const formData = new FormData();
  formData.set("file", new File([sampleJpegBytes], "hero.jpg", { type: "image/jpeg" }));

  const response = await POST(new Request("http://localhost/api/bungalows/bungalow-suite/media/hero", {
    method: "POST",
    body: formData,
  }), { params: Promise.resolve({ id: "bungalow-suite" }) });

  expect(response.status).toBe(200);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/app/api/bungalows/[id]/media/hero/route.test.ts src/app/api/bungalows/[id]/media/gallery/route.test.ts
```
Expected: FAIL because the new route files and multipart handling do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
const formData = await request.formData();
const file = formData.get("file");
if (!(file instanceof File)) {
  throw new Error("invalid_media_payload");
}
```

```ts
return jsonResponse({
  heroImage: media,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/app/api/bungalows/[id]/media/hero/route.test.ts src/app/api/bungalows/[id]/media/gallery/route.test.ts src/app/api/bungalows/[id]/media/gallery/[mediaId]/route.test.ts
npm run typecheck
```
Expected: PASS with multipart upload, reorder, and delete behavior covered.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/bungalows/[id]/media/hero/route.ts src/app/api/bungalows/[id]/media/hero/route.test.ts src/app/api/bungalows/[id]/media/gallery/route.ts src/app/api/bungalows/[id]/media/gallery/route.test.ts src/app/api/bungalows/[id]/media/gallery/[mediaId]/route.ts src/app/api/bungalows/[id]/media/gallery/[mediaId]/route.test.ts src/lib/reservations/http.ts
git commit -m "feat: add bungalow media upload routes"
```

### Task 4: Reorganize the admin bungalow form and add visual media manager

**Files:**
- Modify: `src/app/admin/bungalows/bungalow-form.tsx`
- Modify: `src/app/admin/bungalows/[id]/page.test.tsx`
- Modify: `src/app/admin/bungalows/new/page.test.tsx`
- Modify: `src/app/admin/reservations/reservations.module.css`

- [ ] **Step 1: Write the failing test**

```ts
it("renders tabs for operation, web sheet, and web text instead of a long mixed form", async () => {
  const html = renderToStaticMarkup(await AdminBungalowEditPage({ params: { id: "bungalow-familiar" } }));

  expect(html).toContain("Operación");
  expect(html).toContain("Ficha web");
  expect(html).toContain("Textos web");
  expect(html).toContain("Reemplazar portada");
  expect(html).not.toContain("Ficha pública · medios");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/app/admin/bungalows/[id]/page.test.tsx src/app/admin/bungalows/new/page.test.tsx
```
Expected: FAIL because the current form still renders the mixed legacy sections.

- [ ] **Step 3: Write the minimal implementation**

```tsx
const [activeSurface, setActiveSurface] = useState<"operations" | "public" | "copy">("operations");
```

```tsx
<button type="button" onClick={() => setActiveSurface("public")}>Ficha web</button>
```

```tsx
<section aria-label="Imágenes">
  <button type="button">Reemplazar portada</button>
  <button type="button">Agregar imagen</button>
</section>
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/app/admin/bungalows/[id]/page.test.tsx src/app/admin/bungalows/new/page.test.tsx
npm run typecheck
```
Expected: PASS with the reorganized editor and media manager controls visible.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/bungalows/bungalow-form.tsx src/app/admin/bungalows/[id]/page.test.tsx src/app/admin/bungalows/new/page.test.tsx src/app/admin/reservations/reservations.module.css
git commit -m "feat: reorganize bungalow editor"
```

### Task 5: Route public consumers to optimized media variants

**Files:**
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/app/[locale]/public-site-content.ts`
- Modify: `src/app/[locale]/bungalows/page.tsx`
- Modify: `src/app/[locale]/bungalows/[slug]/page.tsx`
- Test: `src/app/[locale]/localized-public-site.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
it("prefers optimized card and detail variants over legacy raw urls", async () => {
  const bungalow = await getLocalizedBungalow("es", "bungalow-doble");

  expect(bungalow.heroImageUrl).toContain(".webp");
  expect(bungalow.gallery[0]).toContain(".webp");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/app/[locale]/localized-public-site.test.tsx
```
Expected: FAIL because the public mapper still reads only `heroImageUrl` and `galleryUrls`.

- [ ] **Step 3: Write the minimal implementation**

```ts
const heroUrl =
  mediaBundle?.heroImage?.variants.card.url ??
  publicContent.heroImageUrl;
```

```ts
const detailGallery =
  mediaBundle?.galleryImages.map((item) => item.variants.detail.url) ??
  publicContent.galleryUrls;
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/app/[locale]/localized-public-site.test.tsx
npm run typecheck
```
Expected: PASS with optimized variants preferred and legacy URLs preserved as fallback.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reservations/types.ts src/app/[locale]/public-site-content.ts src/app/[locale]/bungalows/page.tsx src/app/[locale]/bungalows/[slug]/page.tsx src/app/[locale]/localized-public-site.test.tsx
git commit -m "feat: serve optimized bungalow media"
```

### Task 6: Final verification sweep

**Files:**
- No code changes expected

- [ ] **Step 1: Run focused test sweep**

Run:
```bash
npm test -- src/lib/reservations/image-optimizer.test.ts src/lib/reservations/postgres-repository.test.ts src/app/api/bungalows/[id]/media/hero/route.test.ts src/app/api/bungalows/[id]/media/gallery/route.test.ts src/app/admin/bungalows/[id]/page.test.tsx src/app/[locale]/localized-public-site.test.tsx
```
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run:
```bash
npm run typecheck
```
Expected: PASS

- [ ] **Step 3: Run build-level confidence check**

Run:
```bash
npm run build
```
Expected: PASS

- [ ] **Step 4: Commit verification notes**

```bash
git status --short
```
Expected: no unexpected changes introduced by verification.
