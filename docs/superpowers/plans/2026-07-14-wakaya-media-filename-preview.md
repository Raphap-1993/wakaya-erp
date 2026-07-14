# Wakaya Media Filename Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persistir el nombre original de cada imagen y mostrarlo como una acción que abre un popup accesible en todas las superficies administrativas de media pública.

**Architecture:** `ContentMediaService` normaliza y persiste `original_filename`, devuelve esa metadata al subir y la consulta en lote al cargar `/admin/content`. Un resolver isomórfico combina metadata administrada con fallbacks de URL, y un componente cliente compartido presenta el nombre y el popup. Home y `ContentHub` consumen el mismo mapa de metadata; `/admin/bungalows/[id]` mantiene su redirect hacia el módulo unificado.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, PostgreSQL, Sharp, Vitest y Playwright.

---

### Task 1: Normalizar y persistir el nombre original

**Files:**
- Create: `db/migrations/013_media_original_filename.sql`
- Create: `src/lib/content/media/media-filename.ts`
- Create: `src/lib/content/media/media-filename.test.ts`
- Create: `src/lib/content/media/media-original-filename-migration.test.ts`
- Modify: `src/lib/content/media/content-media-service.ts`
- Create: `src/lib/content/media/content-media-service.test.ts`

- [x] **Step 1: Write the failing filename tests**

Crear casos que exijan basename, caracteres de control, fallback y límite de
180 caracteres sin perder extensión:

```ts
import { describe, expect, it } from "vitest";
import { normalizeOriginalFilename } from "./media-filename";

describe("normalizeOriginalFilename", () => {
  it("keeps the original readable basename and extension", () => {
    expect(normalizeOriginalFilename("C:\\fakepath\\Selva Wakaya.JPG", "image/jpeg"))
      .toBe("Selva Wakaya.JPG");
  });

  it("removes control characters and path separators", () => {
    expect(normalizeOriginalFilename("../carpeta/foto\u0000 final.png", "image/png"))
      .toBe("foto final.png");
  });

  it("uses a format-aware fallback", () => {
    expect(normalizeOriginalFilename("\u0000", "image/webp")).toBe("imagen.webp");
  });

  it("caps long names without dropping their extension", () => {
    const result = normalizeOriginalFilename(`${"a".repeat(240)}.jpeg`, "image/jpeg");
    expect(result).toHaveLength(180);
    expect(result.endsWith(".jpeg")).toBe(true);
  });
});
```

- [x] **Step 2: Run the filename test and verify RED**

Run: `npm test -- src/lib/content/media/media-filename.test.ts`

Expected: FAIL porque `media-filename.ts` no existe.

- [x] **Step 3: Implement the minimal normalizer**

Crear:

```ts
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

export function normalizeOriginalFilename(fileName: string, mimeType: string) {
  const basename = fileName.split(/[\\/]/).at(-1) ?? "";
  const readable = basename
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const fallback = `imagen${EXTENSION_BY_MIME[mimeType] ?? ".webp"}`;
  const value = readable || fallback;
  if (value.length <= 180) return value;

  const extensionMatch = value.match(/(\.[a-zA-Z0-9]{1,10})$/);
  const extension = extensionMatch?.[1] ?? "";
  return `${value.slice(0, 180 - extension.length)}${extension}`;
}
```

- [x] **Step 4: Run the filename test and verify GREEN**

Run: `npm test -- src/lib/content/media/media-filename.test.ts`

Expected: 4/4 PASS.

- [x] **Step 5: Write the failing migration and service tests**

El test de migración debe leer el SQL y exigir una columna aditiva nullable:

```ts
const sql = readFileSync(resolve(process.cwd(), "db/migrations/013_media_original_filename.sql"), "utf8");
expect(sql).toContain("add column if not exists original_filename text");
expect(sql).not.toContain("original_filename text not null");
```

El test de servicio debe construir un PNG real pequeño con `sharp`, inyectar
storage y pool falsos, ejecutar `createAsset` y comprobar:

```ts
expect(result.asset.originalFilename).toBe("Selva Wakaya.png");
expect(String(insertAssetCall?.[0])).toContain("original_filename");
expect(insertAssetCall?.[1]).toContain("Selva Wakaya.png");
```

- [x] **Step 6: Run the migration and service tests and verify RED**

Run:

```bash
npm test -- \
  src/lib/content/media/media-original-filename-migration.test.ts \
  src/lib/content/media/content-media-service.test.ts
```

Expected: FAIL por migración ausente y `originalFilename` inexistente.

- [x] **Step 7: Add the migration and service contract**

Crear la migración:

```sql
alter table media_asset
  add column if not exists original_filename text;
```

Extender el activo:

```ts
export type ContentMediaAsset = {
  id: string;
  originalFilename: string;
  status: "ready";
  master: {
    url: string;
    width: number;
    height: number;
    format: "webp";
    quality: 95;
    nearLossless: true;
  };
  variants: Partial<Record<MediaVariantKey, PersistedVariant>>;
};
```

Agregar `original_filename` a `PersistedAssetRow`, al `insert`/`upsert` y a sus
parámetros. En `createAsset`, calcularlo antes del procesamiento:

```ts
const originalFilename = normalizeOriginalFilename(input.file.name, input.file.type);
```

Devolver `originalFilename` dentro de `asset`. Si existe pool, no ocultar errores
`42P01`: una base configurada sin migración debe fallar, no crear metadata
incompleta.

- [x] **Step 8: Run Task 1 tests and verify GREEN**

Run:

```bash
npm test -- \
  src/lib/content/media/media-filename.test.ts \
  src/lib/content/media/media-original-filename-migration.test.ts \
  src/lib/content/media/content-media-service.test.ts \
  src/app/api/admin/content/media/route.test.ts
```

Expected: todos PASS; actualizar fixtures de `ContentMediaAsset` con
`originalFilename` cuando TypeScript lo exija.

- [x] **Step 9: Commit Task 1**

```bash
git add db/migrations/013_media_original_filename.sql src/lib/content/media src/app/api/admin/content/media/route.test.ts
git commit -m "feat: persist original media filenames"
```

### Task 2: Resolver metadata administrativa en un solo lote

**Files:**
- Create: `src/lib/content/media/admin-media-metadata.ts`
- Create: `src/lib/content/media/admin-media-metadata.test.ts`
- Modify: `src/lib/content/media/content-media-service.ts`
- Modify: `src/lib/content/media/content-media-service.test.ts`
- Modify: `src/app/admin/content/page.tsx`
- Modify: `src/app/admin/content/page.test.tsx`

- [x] **Step 1: Write the failing resolver tests**

Definir el contrato:

```ts
export type AdminMediaMetadata = {
  assetId: string;
  originalFilename: string;
};

export type AdminMediaMetadataMap = Record<string, AdminMediaMetadata>;
```

Los tests deben exigir:

```ts
expect(extractManagedAssetId("/media/assets/asset_123/heroDesktop.webp"))
  .toBe("asset_123");
expect(extractManagedAssetId("https://cdn.example.com/hero.jpg")).toBeNull();
expect(fallbackMediaFilename("https://cdn.example.com/photos/selva.jpg?x=1"))
  .toBe("selva.jpg");
expect(collectAdminMediaAssetIds(["asset_1", "/media/assets/asset_2/detail.webp", "asset_1"]))
  .toEqual(["asset_1", "asset_2"]);
expect(resolveAdminMediaDescriptor("/media/assets/asset_2/detail.webp", {
  asset_2: { assetId: "asset_2", originalFilename: "Selva original.png" },
})).toEqual({
  assetId: "asset_2",
  originalFilename: "Selva original.png",
  previewUrl: "/media/assets/asset_2/detail.webp",
});
```

- [x] **Step 2: Run the resolver test and verify RED**

Run: `npm test -- src/lib/content/media/admin-media-metadata.test.ts`

Expected: FAIL porque el módulo no existe.

- [x] **Step 3: Implement the resolver helpers**

Implementar `extractManagedAssetId`, `fallbackMediaFilename`,
`collectAdminMediaAssetIds`, `toAdminMediaMetadataMap` y
`resolveAdminMediaDescriptor`. Las rutas administradas deben coincidir con:

```ts
const MANAGED_MEDIA_PATTERN = /^\/media\/assets\/([a-zA-Z0-9_-]+)\/[a-zA-Z0-9._-]+$/;
```

El fallback nunca queda vacío: usa `imagen.webp`.

- [x] **Step 4: Run the resolver test and verify GREEN**

Run: `npm test -- src/lib/content/media/admin-media-metadata.test.ts`

Expected: todos PASS.

- [x] **Step 5: Write the failing batch-query and page tests**

El servicio debe consultar una vez:

```ts
const result = await service.listAssetMetadata(["asset_2", "asset_1", "asset_2"]);
expect(pool.query).toHaveBeenCalledTimes(1);
expect(result).toEqual([
  { assetId: "asset_1", originalFilename: "uno.jpg" },
  { assetId: "asset_2", originalFilename: "dos.png" },
]);
```

El test de página debe mockear `contentMediaService.listAssetMetadata` y exigir
que `ContentHub` reciba `initialMediaMetadata` con IDs encontrados en Home,
Experiencias, Galería y Bungalows.

- [x] **Step 6: Run the batch-query and page tests and verify RED**

Run:

```bash
npm test -- \
  src/lib/content/media/content-media-service.test.ts \
  src/app/admin/content/page.test.tsx
```

Expected: FAIL porque `listAssetMetadata` y la prop no existen.

- [x] **Step 7: Implement batch loading and page hydration**

En `ContentMediaService`:

```ts
async listAssetMetadata(assetIds: string[]): Promise<AdminMediaMetadata[]> {
  const ids = [...new Set(assetIds)].sort();
  if (!this.pool || ids.length === 0) return [];
  const result = await this.pool.query<{
    id: string;
    original_filename: string | null;
  }>(
    `select id, original_filename from media_asset where id = any($1::text[]) order by id asc`,
    [ids],
  );
  return result.rows.map((row) => ({
    assetId: row.id,
    originalFilename: row.original_filename ?? "",
  }));
}
```

En `page.tsx`, recopilar:

- URLs de slides y secciones de Home que tengan `content.image`;
- `cardAssetId`, `heroAssetId` y `galleryAssetIds` de Experiencias;
- `assetId` de Galería;
- `heroAssetId` y `galleryAssetIds` de Bungalows.

Consultar una sola vez, convertir a mapa y pasar:

```tsx
<ContentHub initialMediaMetadata={mediaMetadataMap} /* props vigentes */ />
```

Una falla `42P01` se trata como error de migración; no se silencia. Un entorno
sin `DATABASE_URL` devuelve mapa vacío y usa fallback de URL.

- [x] **Step 8: Run Task 2 tests and verify GREEN**

Run:

```bash
npm test -- \
  src/lib/content/media/admin-media-metadata.test.ts \
  src/lib/content/media/content-media-service.test.ts \
  src/app/admin/content/page.test.tsx
```

Expected: todos PASS.

- [x] **Step 9: Commit Task 2**

```bash
git add src/lib/content/media/admin-media-metadata.ts src/lib/content/media/admin-media-metadata.test.ts src/lib/content/media/content-media-service.ts src/lib/content/media/content-media-service.test.ts src/app/admin/content/page.tsx src/app/admin/content/page.test.tsx
git commit -m "feat: hydrate admin media metadata"
```

### Task 3: Crear el nombre clicable y popup accesible compartido

**Files:**
- Create: `src/app/admin/content/media/media-filename-preview.tsx`
- Create: `src/app/admin/content/media/media-filename-preview.test.tsx`
- Create: `src/app/admin/content/media/media-filename-preview.module.css`

- [ ] **Step 1: Write the failing component test**

Usar render estático para exigir el estado cerrado:

```tsx
const html = renderToStaticMarkup(
  <MediaFilenamePreview
    originalFilename="Selva Wakaya.JPG"
    previewUrl="/media/assets/asset_1/heroDesktop.webp"
  />,
);
expect(html).toContain("Selva Wakaya.JPG");
expect(html).toContain('title="Selva Wakaya.JPG"');
expect(html).toContain('aria-haspopup="dialog"');
expect(html).not.toContain('role="dialog"');
```

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test -- src/app/admin/content/media/media-filename-preview.test.tsx`

Expected: FAIL porque el componente no existe.

- [ ] **Step 3: Implement the shared component**

El API será:

```ts
type MediaFilenamePreviewProps = {
  originalFilename: string;
  previewUrl: string;
};
```

El trigger usa `aria-haspopup="dialog"` y texto truncado solo por CSS. El modal
usa `role="dialog"`, `aria-modal`, título `Vista previa de imagen`, nombre
completo, imagen con `object-fit: contain`, mensaje de error y botón `Cerrar`.

Implementar un único `closeDialog()` que:

```ts
setOpen(false);
window.requestAnimationFrame(() => triggerRef.current?.focus());
```

Al abrir, enfocar `Cerrar`. Registrar `keydown` únicamente mientras está abierto
y cerrar con `Escape`. El backdrop cierra solo si
`event.target === event.currentTarget` y expone
`data-testid="media-preview-backdrop"` para la prueba de navegador.

- [ ] **Step 4: Run the component test and verify GREEN**

Run: `npm test -- src/app/admin/content/media/media-filename-preview.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/app/admin/content/media/media-filename-preview.tsx src/app/admin/content/media/media-filename-preview.test.tsx src/app/admin/content/media/media-filename-preview.module.css
git commit -m "feat: add accessible media preview dialog"
```

### Task 4: Integrar Home y conservar metadata después de subir

**Files:**
- Modify: `src/app/admin/home/home-editor.tsx`
- Modify: `src/app/admin/home/home-editor.test.tsx`
- Modify: `src/app/admin/home/home-media-upload.test.ts`
- Modify: `src/app/admin/content/content-hub.tsx`
- Modify: `src/app/admin/content/content-hub.test.tsx`
- Modify: `e2e/home-media-upload.spec.ts`
- Create: `e2e/media-filename-preview.spec.ts`

- [ ] **Step 1: Write the failing Home tests**

Actualizar el fixture de media con:

```ts
originalFilename: "gallery01.jpg",
```

Renderizar `HomeEditor` con:

```ts
initialMediaMetadata: {
  asset_home_01: { assetId: "asset_home_01", originalFilename: "Selva Wakaya.jpg" },
}
```

Y exigir `Selva Wakaya.jpg`, `aria-haspopup="dialog"` y ausencia de
`Imagen asociada` para el campo con valor.

El E2E de upload debe exigir, después del POST 201:

```ts
const filenameButton = page.getByRole("button", { name: "gallery01.jpg" });
await expect(filenameButton).toBeVisible();
await filenameButton.click();
await expect(page.getByRole("dialog", { name: "Vista previa de imagen" })).toBeVisible();
```

Crear `e2e/media-filename-preview.spec.ts` con autenticación local y este
contrato de interacción:

```ts
await filenameButton.click();
const dialog = page.getByRole("dialog", { name: "Vista previa de imagen" });
await expect(dialog).toBeVisible();
await expect(dialog.getByRole("img", { name: "gallery01.jpg" })).toBeVisible();
await dialog.getByRole("button", { name: "Cerrar" }).click();
await expect(filenameButton).toBeFocused();
await filenameButton.click();
await page.keyboard.press("Escape");
await expect(dialog).toHaveCount(0);
await expect(filenameButton).toBeFocused();
```

Después de comprobar la imagen válida, interceptar su URL de preview con 404,
recargar el editor, abrir el popup y exigir `No se pudo cargar la imagen`. Esto
prueba el error controlado sin alterar la referencia persistida.

- [ ] **Step 2: Run Home tests and verify RED**

Run:

```bash
npm test -- \
  src/app/admin/home/home-media-upload.test.ts \
  src/app/admin/home/home-editor.test.tsx \
  src/app/admin/content/content-hub.test.tsx
```

Expected: FAIL por props, metadata y componente aún no integrados.

- [ ] **Step 3: Integrate Home with the shared metadata map**

Extender props:

```ts
type HomeEditorProps = {
  initialItem: HomeContentRevisionRecord;
  initialRevisions: HomeContentRevisionRecord[];
  mediaMetadata?: AdminMediaMetadataMap;
  onMediaAssetCreated?: (asset: ContentMediaAsset) => void;
};
```

En `ImageField`, resolver el valor y reemplazar el pill genérico:

```tsx
{value ? (
  <MediaFilenamePreview
    originalFilename={resolveAdminMediaDescriptor(value, mediaMetadata).originalFilename}
    previewUrl={value}
  />
) : (
  <span className={styles.metaPill}>Sin imagen asociada</span>
)}
```

Después de resolver el asset del POST, ejecutar
`onMediaAssetCreated?.(asset)` antes de actualizar el documento.

En `ContentHub`, mantener `mediaMetadata` como estado, implementar:

```ts
function rememberMediaAsset(asset: ContentMediaAsset) {
  setMediaMetadata((current) => ({
    ...current,
    [asset.id]: { assetId: asset.id, originalFilename: asset.originalFilename },
  }));
}
```

Y pasarlo a `HomeEditor`. Esto conserva el nombre al cambiar de tab sin recargar.

- [ ] **Step 4: Run Home unit tests and verify GREEN**

Run:

```bash
npm test -- \
  src/app/admin/home/home-media-upload.test.ts \
  src/app/admin/home/home-editor.test.tsx \
  src/app/admin/content/content-hub.test.tsx
```

Expected: todos PASS.

- [ ] **Step 5: Apply the local migration and run Home Playwright**

Run:

```bash
npm run migrate
E2E_BASE_URL=http://localhost:3212 npx playwright test \
  e2e/home-media-upload.spec.ts \
  e2e/media-filename-preview.spec.ts
```

Expected: crop, POST 201, nombre `gallery01.jpg`, popup, recarga, publicación
PUT 200 y vista pública aprobados.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/app/admin/home src/app/admin/content/content-hub.tsx src/app/admin/content/content-hub.test.tsx e2e/home-media-upload.spec.ts e2e/media-filename-preview.spec.ts
git commit -m "feat: show Home media filenames and previews"
```

### Task 5: Integrar Experiencias, Galería y Bungalows

**Files:**
- Modify: `src/app/admin/content/content-hub.tsx`
- Modify: `src/app/admin/content/content-hub.test.tsx`
- Modify: `src/app/admin/content/content-hub.module.css`
- Modify: `src/app/admin/bungalows/page.test.tsx`
- Create: `e2e/content-media-filename-preview.spec.ts`

- [ ] **Step 1: Write failing surface coverage tests**

Agregar fixtures con metadata y probar cada tab:

```ts
const initialMediaMetadata = {
  asset_card: { assetId: "asset_card", originalFilename: "experiencia-card.jpg" },
  asset_hero: { assetId: "asset_hero", originalFilename: "experiencia-hero.png" },
  asset_gallery: { assetId: "asset_gallery", originalFilename: "galeria-rio.jpeg" },
  asset_bungalow_hero: { assetId: "asset_bungalow_hero", originalFilename: "bungalow-portada.jpg" },
  asset_bungalow_gallery: { assetId: "asset_bungalow_gallery", originalFilename: "bungalow-interior.webp" },
};
```

Exigir por tab:

- Experiencias: `experiencia-card.jpg` y `experiencia-hero.png`;
- Galería: `galeria-rio.jpeg`;
- Bungalows: `bungalow-portada.jpg` y `bungalow-interior.webp`;
- Páginas: cero botones `aria-haspopup="dialog"` de media.

Mantener el test de `/admin/bungalows/[id]` que demuestra redirect a
`/admin/content?tab=bungalows&bungalowId=<id>`.

- [ ] **Step 2: Run ContentHub tests and verify RED**

Run:

```bash
npm test -- \
  src/app/admin/content/content-hub.test.tsx \
  src/app/admin/bungalows/page.test.tsx \
  'src/app/admin/bungalows/[id]/page.test.tsx'
```

Expected: FAIL porque las superficies todavía muestran preview inline o texto
genérico sin el componente compartido.

- [ ] **Step 3: Integrate every ContentHub media surface**

Modificar `AssetField` para recibir `mediaMetadata`, resolver `previewUrl` y
mostrar `MediaFilenamePreview` en lugar de `Imagen asociada`.

Después de cada upload de `ContentHub`, ejecutar `rememberMediaAsset(asset)`
antes de `uploadHandlerRef.current(asset)`.

En la galería del bungalow, agregar `MediaFilenamePreview` debajo de cada
miniatura administrada. Para `galleryUrls` legadas, resolver el basename de URL
y ofrecer el mismo popup. El Hero de Bungalows usa `AssetField`, por lo que
queda cubierto por el componente común.

Conservar las miniaturas inline existentes: el nuevo nombre/popup complementa
la revisión visual y no elimina ordenar, quitar ni reemplazar.

- [ ] **Step 4: Run ContentHub tests and verify GREEN**

Run:

```bash
npm test -- \
  src/app/admin/content/content-hub.test.tsx \
  src/app/admin/bungalows/page.test.tsx \
  'src/app/admin/bungalows/[id]/page.test.tsx'
```

Expected: todos PASS.

- [ ] **Step 5: Write and run authenticated ContentHub E2E**

El E2E debe abrir Galería, pulsar `Agregar imagen`, seleccionar
`public/images/wakaya/gallery/gallery01.jpg`, completar el recorte fijo y
comprobar `POST /api/admin/content/media` 201. Después debe comprobar el nombre
`gallery01.jpg`, guardar/publicar la galería, recargar la página y verificar que
el nombre persiste. Finalmente abre el popup, valida que el `src` termina en
`/detail.webp` y cierra mediante:

```ts
await page.getByTestId("media-preview-backdrop").click({ position: { x: 5, y: 5 } });
```

Experiencias y Bungalows quedan cubiertos por los tests renderizados de Step 1;
el E2E de Galería prueba el comportamiento compartido dentro de `ContentHub`.

Run:

```bash
E2E_BASE_URL=http://localhost:3212 npx playwright test e2e/content-media-filename-preview.spec.ts
```

Expected: PASS con captura
`output/playwright/content-media-filename-preview.png`.

- [ ] **Step 6: Commit Task 5**

```bash
git add src/app/admin/content src/app/admin/bungalows e2e/content-media-filename-preview.spec.ts
git commit -m "feat: unify public media filename previews"
```

### Task 6: Trazabilidad, regresión completa y build local

**Files:**
- Modify: `specs/010-content-editor-workbench/spec-tareas.md`
- Modify: `docs/fase-6-qa/README.md`
- Modify: `docs/fase-6-qa/06.08-home-media-crop-publication-local-evidence.md`
- Create: `docs/fase-6-qa/06.09-media-filename-preview-local-evidence.md`
- Modify: `docs/fase-7-deploy/README.md`
- Modify: `docs/superpowers/plans/2026-07-14-wakaya-media-filename-preview.md`

- [ ] **Step 1: Record TDD and surface evidence**

Agregar `T-010-007 - Nombre y popup de media pública` con Red, Green, Refactor
y comandos. Crear evidencia 06.09 con:

- matriz Home / Experiencias / Galería / Bungalows / Páginas;
- migración local aplicada;
- nombre inmediato y posterior a recarga;
- cierre por botón, Escape y backdrop;
- crop/publicación sin regresión;
- producción no modificada;
- rutas de capturas Playwright.

Actualizar navegación 06.08 → 06.09 → Fase 7.

- [ ] **Step 2: Run focused verification**

Run:

```bash
npm test -- \
  src/lib/content/media/media-filename.test.ts \
  src/lib/content/media/media-original-filename-migration.test.ts \
  src/lib/content/media/admin-media-metadata.test.ts \
  src/lib/content/media/content-media-service.test.ts \
  src/app/admin/content/media/media-filename-preview.test.tsx \
  src/app/admin/home/home-editor.test.tsx \
  src/app/admin/content/content-hub.test.tsx \
  src/app/admin/content/page.test.tsx \
  src/app/api/admin/content/media/route.test.ts
npm run typecheck
npx eslint \
  src/lib/content/media \
  src/app/admin/content \
  src/app/admin/home \
  e2e/home-media-upload.spec.ts \
  e2e/media-filename-preview.spec.ts \
  e2e/content-media-filename-preview.spec.ts
git diff --check
```

Expected: código 0 en cada comando.

- [ ] **Step 3: Run the complete regression suite**

Run: `npm test`

Expected: cero fallos; omisiones existentes documentadas, no nuevas.

- [ ] **Step 4: Run authenticated browser verification**

Run:

```bash
E2E_BASE_URL=http://localhost:3212 npx playwright test \
  e2e/home-media-upload.spec.ts \
  e2e/home-validation.spec.ts \
  e2e/media-filename-preview.spec.ts \
  e2e/content-media-filename-preview.spec.ts
```

Expected: cero fallos y capturas visuales presentes.

- [ ] **Step 5: Rebuild and restore localhost:3212**

Detener únicamente el proceso que escucha 3212, ejecutar:

```bash
npm run build
npm run dev -- --port 3212
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3212/api/health
```

Expected: build con código 0, servidor `Ready` y health `200`. Restaurar
`next-env.d.ts` si `next dev` cambia la referencia a `.next/dev/types`.

- [ ] **Step 6: Re-run the critical E2E after the rebuild**

Run:

```bash
E2E_BASE_URL=http://localhost:3212 npx playwright test \
  e2e/home-media-upload.spec.ts \
  e2e/content-media-filename-preview.spec.ts
```

Expected: ambos PASS contra el servidor reiniciado.

- [ ] **Step 7: Complete the plan and commit evidence**

Marcar todos los checkbox como completados y ejecutar:

```bash
git add specs/010-content-editor-workbench/spec-tareas.md docs/fase-6-qa docs/fase-7-deploy/README.md docs/superpowers/plans/2026-07-14-wakaya-media-filename-preview.md
git commit -m "test: verify media filename previews locally"
```

## Self-review

- Spec coverage: Tasks 1-2 cubren persistencia, normalización, fallback y carga
  en lote; Task 3 cubre popup y accesibilidad; Tasks 4-5 cubren todas las
  superficies; Task 6 cubre trazabilidad, regresión, build y localhost.
- Scope: `/admin/bungalows/[id]` redirige a `ContentHub`, por lo que hereda el
  comportamiento sin duplicar UI en `BungalowForm`; Páginas no tiene selector.
- Type consistency: `AdminMediaMetadata`, `AdminMediaMetadataMap`,
  `ContentMediaAsset.originalFilename`, `MediaFilenamePreview` y
  `resolveAdminMediaDescriptor` conservan los mismos nombres en todas las tareas.
- Placeholder scan: aprobado; cada cambio tiene firma, ruta, comando y resultado
  esperado.
- Deployment boundary: se aplica la migración únicamente a la base local y se
  detiene antes de producción.
