# Wakaya Home Media Crop Publication Fix Implementation Plan

<!-- nav-guided:start -->
## Navegación guiada
- Anterior: [Plan adaptativo de media](2026-07-14-wakaya-adaptive-public-image-optimization.md)
- Siguiente: [Índice de documentación](../../README.md)
<!-- nav-guided:end -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que las imágenes del Home abran el crop obligatorio, se procesen por el pipeline administrado y puedan publicarse sin error de URL inválida.

**Architecture:** `HomeEditor` reutiliza `CropDialog` y envía archivo, slot y crops a `/api/admin/content/media`; slider usa `hero` y secciones con imagen usan `detail`. El documento v2 conserva su campo string durante este bugfix, pero el schema admite únicamente HTTP(S) o rutas administradas `/media/...`, evitando persistir orígenes locales.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Zod 4, react-easy-crop, Vitest y Playwright.

---

### Task 1: Referencias internas seguras de media

**Files:**
- Modify: `src/lib/home-content/schema.ts`
- Modify: `src/lib/home-content/schema.test.ts`

- [x] **Step 1: Write the failing schema tests**

Agregar un caso que reemplace `slider.slides[0].image` por
`/media/assets/asset_home_01/heroDesktop.webp` y espere que
`homeContentDocumentSchema.parse` lo acepte. Agregar un segundo caso que use
`/uploads/manual.jpg` y espere `invalid_slide_image`.

- [x] **Step 2: Run the schema test and verify RED**

Run: `npm test -- src/lib/home-content/schema.test.ts`

Expected: FAIL porque Zod `url()` rechaza `/media/assets/...`.

- [x] **Step 3: Implement the safe image location schema**

Crear un refinamiento común que acepte:

```ts
function isSafePublicImageLocation(value: string) {
  if (/^\/media\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value) && !value.includes("..")) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
```

Reutilizarlo en imágenes de slides, secciones y experiencias legadas,
conservando los códigos `invalid_slide_image` e `invalid_section_image`.

- [x] **Step 4: Run the schema test and verify GREEN**

Run: `npm test -- src/lib/home-content/schema.test.ts`

Expected: PASS para HTTP(S) vigente y `/media/...`; rutas relativas arbitrarias
continúan rechazadas.

### Task 2: Crop administrado y publicación real del Home

**Files:**
- Create: `src/app/admin/home/home-media-upload.ts`
- Create: `src/app/admin/home/home-media-upload.test.ts`
- Modify: `src/app/admin/home/home-editor.tsx`
- Modify: `src/app/admin/home/home-editor.test.tsx`
- Create: `e2e/home-media-upload.spec.ts`
- Modify: `specs/010-content-editor-workbench/spec-tareas.md`
- Create: `docs/fase-6-qa/06.08-home-media-crop-publication-local-evidence.md`

- [x] **Step 1: Write failing helper and browser tests**

El helper debe exigir:

```ts
const form = buildHomeMediaUploadFormData(file, "hero", crops);
expect(form.get("slot")).toBe("hero");
expect(form.get("crops")).toBe(JSON.stringify(crops));
expect(resolveHomeMediaUrl(asset, "hero")).toBe("/media/assets/asset_home_01/heroDesktop.webp");
```

Playwright debe seleccionar una imagen del primer slide, comprobar dialog con
tabs `Desktop` y `Mobile`, aplicar recortes, observar `201` de
`/api/admin/content/media`, publicar y observar `200` de
`PUT /api/admin/home-content` sin alerta de validación.

- [x] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/app/admin/home/home-media-upload.test.ts src/app/admin/home/home-editor.test.tsx
E2E_BASE_URL=http://localhost:3212 npx playwright test e2e/home-media-upload.spec.ts
```

Expected: unit FAIL porque el helper no existe; E2E FAIL porque Home sube de
inmediato y no abre el crop.

- [x] **Step 3: Implement upload helper**

Definir `HomeMediaSlot = "hero" | "detail"`,
`buildHomeMediaUploadFormData(file, slot, crops)` y
`resolveHomeMediaUrl(asset, slot)`. Para hero exigir `heroDesktop.url`; para
detail exigir `detail.url`; si falta la variante lanzar `media_processing_failed`.

- [x] **Step 4: Integrate CropDialog in HomeEditor**

Al seleccionar archivo, guardar un intent con `file`, `fieldSlot`, `mediaSlot`
y callback; no llamar aún a la API. `CropDialog` usa `hero` para slides y
`detail` para secciones. Al aplicar, subir por `/api/admin/content/media`,
resolver la variante, actualizar el borrador y mostrar
`Imagen optimizada y lista para publicar en el home.`. Cancelar conserva la
referencia previa.

- [x] **Step 5: Preserve operational error messages**

Mapear `media_crop_required`, `media_crop_invalid`, `media_crop_too_small` y
`media_processing_failed` en `describeSaveError`. El estado de subida solo
aparece durante el POST posterior al crop.

- [x] **Step 6: Run focused verification and Playwright**

Run:

```bash
npm test -- src/lib/home-content/schema.test.ts src/app/admin/home/home-media-upload.test.ts src/app/admin/home/home-editor.test.tsx src/app/api/admin/content/media/route.test.ts
npm run typecheck
npx eslint src/lib/home-content/schema.ts src/lib/home-content/schema.test.ts src/app/admin/home/home-media-upload.ts src/app/admin/home/home-media-upload.test.ts src/app/admin/home/home-editor.tsx src/app/admin/home/home-editor.test.tsx e2e/home-media-upload.spec.ts
E2E_BASE_URL=http://localhost:3212 npx playwright test e2e/home-media-upload.spec.ts
npm run build
```

Expected: todos los comandos terminan con código 0; el E2E prueba POST 201 y
publicación PUT 200.

- [x] **Step 7: Record evidence and commit**

```bash
git add src/lib/home-content src/app/admin/home e2e/home-media-upload.spec.ts specs/010-content-editor-workbench/spec-tareas.md docs/fase-6-qa docs/superpowers/plans/2026-07-14-wakaya-home-media-crop-publication-fix.md
git commit -m "fix: crop and publish managed Home images"
```

## Self-review

- Spec coverage: crop obligatorio, pipeline único, referencia portable y
  publicación exitosa quedan cubiertos en Tasks 1-2.
- Placeholder scan: no existen `TBD`, `TODO` ni pasos ambiguos.
- Type consistency: `HomeMediaSlot`, `buildHomeMediaUploadFormData` y
  `resolveHomeMediaUrl` conservan los mismos nombres en tests y editor.
- Scope: no implementa todavía schema v3, HEIC ni compresión adaptativa completa;
  este plan resuelve únicamente el bug local reportado sobre el pipeline ya
  existente.
