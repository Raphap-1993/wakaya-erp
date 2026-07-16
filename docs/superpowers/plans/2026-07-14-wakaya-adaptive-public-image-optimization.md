# Wakaya Adaptive Public Image Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que el personal de Wakaya pueda subir fotos comunes de celular y que el sistema las valide, recorte, convierta a WebP y comprima automáticamente dentro de presupuestos estrictos antes de publicarlas.

**Architecture:** Conservar un solo pipeline dentro del monolito Next.js. `ContentMediaService` recibe entradas validadas por contenido, genera en memoria un maestro y todas las variantes mediante compresión adaptativa, persiste estados y métricas, y solo devuelve un activo publicable cuando todo quedó `ready`. Home, Experiencias, Galería, Bungalows y Testimonios guardan referencias de activos; las URLs históricas quedan únicamente como fallback de lectura. HEIC/HEIF se normaliza transparentemente para que el navegador pueda mostrar el recorte y también se valida en servidor.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, PostgreSQL, Sharp 0.35, `heic-convert` 2.1, Zod 4, Vitest 4, Playwright 1.60, Nginx y PM2 standalone.

---

## Preconditions and fixed decisions

- Base de diseño aprobada: `docs/superpowers/specs/2026-07-14-wakaya-adaptive-image-optimization-design.md`, commit `e63f0c3`.
- Antes de Task 1, crear un worktree/rama `codex/wakaya-adaptive-public-media` mediante `superpowers:using-git-worktrees`; no implementar directamente sobre `main`.
- Pesos en bytes binarios, con `1 KB = 1024 bytes`.
- Presupuestos públicos: `heroDesktop <= 256000`, `heroMobile <= 163840`, `detail <= 204800`, `card <= 102400`, `thumb <= 40960` bytes.
- Maestro interno WebP: lado mayor inicial `3200`, piso `2000`, peso máximo `1572864` bytes; nunca se referencia desde HTML público.
- Calidad: inicia en `84`, baja de `4` en `4` hasta `64`; luego las dimensiones bajan al `90 %` y se repite el ciclo.
- Límites de entrada: `25 * 1024 * 1024` bytes y `80_000_000` píxeles.
- Formatos admitidos por contenido: JPEG, PNG, WebP, AVIF y HEIC/HEIF. La extensión y el MIME declarado solo ayudan a la UX; no autorizan el archivo.
- El runtime productivo actual de Sharp decodifica AVIF, pero no ofrece HEIC/HEVC estable. Se usará `heic-convert@2.1.0`, serializado a una conversión a la vez, antes de Sharp.
- El deploy habilita el nuevo pipeline para nuevas cargas. El reprocesamiento histórico se entrega y ensaya en `--dry-run`, pero su `--apply` en producción ocurre en una ventana separada.

### Task 1: Cerrar SDD, contratos y gates de la feature 011

**Files:**

- Create: `specs/011-adaptive-public-media/README.md`
- Create: `specs/011-adaptive-public-media/spec-funcional.md`
- Create: `specs/011-adaptive-public-media/spec-tecnica.md`
- Create: `specs/011-adaptive-public-media/api-contract.md`
- Create: `specs/011-adaptive-public-media/product-design.md`
- Create: `specs/011-adaptive-public-media/prototype.md`
- Create: `specs/011-adaptive-public-media/prototype-validation.md`
- Create: `specs/011-adaptive-public-media/spdd-frontend.md`
- Create: `specs/011-adaptive-public-media/spec-tareas.md`
- Create: `specs/011-adaptive-public-media/ui-test-cases.md`
- Create: `specs/011-adaptive-public-media/traceability.md`
- Modify: `specs/README.md`

- [ ] Registrar RF-011-01 a RF-011-12: formatos, límites, presupuestos, maestro privado, publicación atómica, métricas, Home responsive, Testimonios administrados, compatibilidad histórica, backfill y rollback.
- [ ] Registrar `gate-ux-ready`, `gate-prototype-ready` y `gate-spdd-approved` como aprobados el 2026-07-14 por la aprobación explícita del diseño. La excepción visual debe indicar que se reutilizan el selector, progreso, error y crop dialog ya aprobados en features 006/010; no se agrega un control técnico nuevo.
- [ ] Fijar en `api-contract.md`:

```text
POST /api/admin/content/media
  multipart: file, slot, crops
  201: { asset: { id, status: "ready", master, variants } }
  400 invalid_media_type | invalid_media_payload
  413 media_too_large
  422 media_dimensions_too_large | media_decode_failed |
      media_budget_unreachable | media_crop_required | media_crop_invalid

POST /api/admin/content/media/normalize
  multipart: file
  200 image/webp solo para HEIC/HEIF autenticado
  mismos errores controlados de entrada/decodificación
```

- [ ] Añadir la matriz requisito → prueba → evidencia → rollback y declarar que `gate-4-6` solo cierra con presupuestos medidos sobre buffers de alta entropía.
- [ ] Ejecutar validación documental focalizada.

Run:

```bash
npm run check:docs
npm run check:trace-coverage
npm run check:gates-mentioned
```

Expected: los tres comandos terminan con código `0`; feature 011 aparece en el índice y no hay rutas canónicas rotas.

- [ ] Commit.

```bash
git add specs/011-adaptive-public-media specs/README.md
git commit -m "docs: specify adaptive public media"
```

### Task 2: Crear el contrato único de política, errores y fixtures

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/content/media/image-policy.ts`
- Create: `src/lib/content/media/media-errors.ts`
- Create: `src/lib/content/media/test-image-factory.ts`
- Create: `tests/fixtures/media/README.md`
- Create: `tests/fixtures/media/iphone-portrait.heic`
- Create: `tests/fixtures/media/generate-heic-fixture.mjs`
- Create: `src/lib/content/media/image-policy.test.ts`

- [ ] Instalar versiones exactas y conservar `package-lock.json` como lockfile canónico del repositorio.

```bash
npm install heic-convert@2.1.0
npm install --save-dev @types/heic-convert@2.1.1 tsx@4.23.1
```

Expected: `package.json` contiene esas tres versiones exactas y `npm ls heic-convert @types/heic-convert tsx` termina con código `0`.

- [ ] Escribir primero `image-policy.test.ts` con aserciones exactas para todos los presupuestos, dimensiones objetivo, pisos, calidades y límites de entrada. Ejecutarlo y comprobar RED porque el módulo aún no existe.
- [ ] Implementar el contrato sin imports de Node para que también pueda usarse en inputs del cliente:

```ts
export const PUBLIC_MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif";

export const MEDIA_INPUT_LIMITS = {
  maxBytes: 25 * 1024 * 1024,
  maxPixels: 80_000_000,
} as const;

export const PUBLIC_VARIANT_POLICY = {
  heroDesktop: {
    target: [1920, 1080],
    floor: [1440, 810],
    maxBytes: 250 * 1024,
  },
  heroMobile: {
    target: [1080, 1350],
    floor: [800, 1000],
    maxBytes: 160 * 1024,
  },
  detail: { target: [1600, 1200], floor: [1200, 900], maxBytes: 200 * 1024 },
  card: { target: [960, 720], floor: [720, 540], maxBytes: 100 * 1024 },
  thumb: { target: [480, 360], floor: [360, 270], maxBytes: 40 * 1024 },
} as const;

export const ADAPTIVE_WEBP_POLICY = {
  initialQuality: 84,
  minimumQuality: 64,
  qualityStep: 4,
  dimensionFactor: 0.9,
  effort: 6,
} as const;
```

- [ ] Crear `MediaProcessingError` con códigos cerrados y detalles opcionales (`variant`, `maxBytes`) para evitar filtrar mensajes internos de Sharp.
- [ ] Crear un generador determinista de imágenes de alta entropía con PRNG sembrado y raw RGB; no usar únicamente fondos planos.
- [ ] Generar una vez el fixture HEIC desde una imagen determinista propia usando el encoder de macOS y dejar documentado que el binario es generado, no descargado:

```bash
node tests/fixtures/media/generate-heic-fixture.mjs
sips -s format heic tests/fixtures/media/iphone-portrait-source.png \
  --out tests/fixtures/media/iphone-portrait.heic
rm tests/fixtures/media/iphone-portrait-source.png
```

Expected: `file tests/fixtures/media/iphone-portrait.heic` identifica un contenedor HEIF/HEIC y el archivo queda por debajo de 25 MB.

- [ ] Ejecutar el test hasta GREEN y comprobar que el factory produce datos reproducibles.

```bash
npm test -- src/lib/content/media/image-policy.test.ts
```

Expected: código `0`; ninguna política usa calidad fija distinta por variante.

- [ ] Commit.

```bash
git add package.json package-lock.json src/lib/content/media tests/fixtures/media
git commit -m "feat: define adaptive media policy"
```

### Task 3: Implementar validación real y decodificación AVIF/HEIC con TDD

**Files:**

- Create: `src/lib/content/media/heic-decoder.ts`
- Create: `src/lib/content/media/input-normalizer.ts`
- Create: `src/lib/content/media/input-normalizer.test.ts`
- Create: `src/app/api/admin/content/media/normalize/route.ts`
- Create: `src/app/api/admin/content/media/normalize/route.test.ts`
- Modify: `src/lib/reservations/http.ts`
- Create: `src/lib/reservations/http.test.ts`
- Modify: `next.config.mjs`

- [ ] Escribir tests RED para JPEG, PNG, WebP y AVIF válidos; HEIC válido; orientación EXIF; archivo corrupto; SVG/GIF; JPEG con MIME PNG; archivo mayor a 25 MB y metadata mayor a 80 MP.
- [ ] Probar que MIME falso no modifica el formato detectado y que SVG/GIF siguen rechazados aunque su extensión sea `.jpg`.
- [ ] Implementar detección por metadata/contenido. Sharp debe recibir `limitInputPixels: 80_000_000`, `failOn: "error"` y auto-orientación antes del crop:

```ts
const image = sharp(buffer, {
  failOn: "error",
  limitInputPixels: MEDIA_INPUT_LIMITS.maxPixels,
});
const metadata = await image.metadata();
```

- [ ] Detectar HEIC/HEIF por marcas ISO-BMFF (`heic`, `heix`, `hevc`, `hevx`, `mif1`, `msf1`), no solo por nombre. Serializar `heic-convert` mediante una cola de concurrencia `1`; convertir a JPEG en memoria, revalidar formato/dimensiones con Sharp y mapear cualquier fallo a `media_decode_failed`.
- [ ] Mantener AVIF dentro de Sharp. Para `metadata.format === "heif"`, distinguir AVIF mediante `metadata.compression === "av1"`; HEVC usa el decoder aislado.
- [ ] Implementar `POST /api/admin/content/media/normalize` con `content:write`. La ruta solo transforma HEIC/HEIF a un WebP de previsualización auto-orientado, con lado mayor `<= 3200` y peso `<= 1.5 MB`; no crea registros ni publica contenido.
- [ ] Añadir a `next.config.mjs` el paquete nativo/externo del servidor para evitar que el standalone intente empaquetarlo de forma incompatible:

```js
serverExternalPackages: ["heic-convert"],
```

- [ ] Mapear errores sin texto interno:

```ts
media_decode_failed       -> 422 "No se pudo leer la imagen. Prueba con otra foto."
media_budget_unreachable  -> 422 "La imagen no pudo optimizarse al peso requerido."
invalid_media_type        -> 400 "Usa JPG, PNG, WebP, AVIF, HEIC o HEIF."
media_too_large           -> 413 "La imagen supera 25 MB."
media_dimensions_too_large-> 422 "La imagen supera 80 megapíxeles."
```

- [ ] Ejecutar tests hasta GREEN.

```bash
npm test -- \
  src/lib/content/media/input-normalizer.test.ts \
  src/app/api/admin/content/media/normalize/route.test.ts \
  src/lib/reservations/http.test.ts
```

Expected: código `0`; el fixture HEIC se decodifica realmente, AVIF no usa el fallback HEIC y los errores no contienen `sharp`, `libheif` ni stack traces.

- [ ] Commit.

```bash
git add src/lib/content/media src/app/api/admin/content/media/normalize src/lib/reservations next.config.mjs
git commit -m "feat: normalize modern image uploads"
```

### Task 4: Sustituir calidad fija por compresión adaptativa verificable

**Files:**

- Modify: `src/lib/content/media/image-optimizer.ts`
- Modify: `src/lib/content/media/image-optimizer.test.ts`
- Create: `src/lib/content/media/image-budget-corpus.test.ts`

- [ ] Reescribir primero las expectativas actuales de dimensiones/calidad fija. Añadir RED para cada variante con alta entropía, reducción de calidad, reducción de dimensiones, maestro `<= 1.5 MB` y error al alcanzar simultáneamente calidad/dimensión mínimas sin cumplir peso.
- [ ] Separar normalización de codificación. `optimizeContentImage` debe aceptar también un buffer normalizado para que API, seed y backfill usen exactamente la misma función.
- [ ] Implementar el bucle puro `encodeWebpToBudget`:

```ts
for (let width = targetWidth, height = targetHeight; ; ) {
  for (let quality = 84; quality >= 64; quality -= 4) {
    iterations += 1;
    const candidate = await encode({ width, height, quality });
    if (candidate.byteLength <= maxBytes)
      return toArtifact(candidate, quality, iterations);
  }
  if (width === floorWidth && height === floorHeight) break;
  width = Math.max(floorWidth, Math.floor(width * 0.9));
  height = Math.max(floorHeight, Math.floor(height * 0.9));
}
throw new MediaProcessingError("media_budget_unreachable", {
  variant,
  maxBytes,
});
```

- [ ] Calcular `reductionPercent` desde bytes de entrada mediante `((sourceBytes - outputBytes) / sourceBytes) * 100`, redondeado a dos decimales. El artefacto debe incluir `bytes`, `quality`, `width`, `height`, `compressionIterations` y `reductionPercent`.
- [ ] El maestro usa el mismo ciclo, conserva relación de aspecto, no amplía, inicia con lado mayor `min(3200, sourceLongSide)` y nunca baja de `min(2000, sourceLongSide)`.
- [ ] Eliminar `nearLossless: true` y toda poscondición que permita devolver un buffer por encima del presupuesto.
- [ ] Verificar el resultado exacto, no solo la configuración solicitada:

```ts
if (artifact.bytes > policy.maxBytes) {
  throw new MediaProcessingError("media_budget_unreachable", {
    variant,
    maxBytes: policy.maxBytes,
  });
}
```

- [ ] Ejecutar pruebas focalizadas.

```bash
npm test -- \
  src/lib/content/media/image-optimizer.test.ts \
  src/lib/content/media/image-budget-corpus.test.ts
```

Expected: código `0`; el reporte de test muestra cada variante dentro de su límite y al menos un fixture registra `compressionIterations > 6` o dimensiones menores al objetivo.

- [ ] Commit.

```bash
git add src/lib/content/media/image-optimizer.ts src/lib/content/media/image-optimizer.test.ts src/lib/content/media/image-budget-corpus.test.ts
git commit -m "feat: enforce adaptive webp budgets"
```

### Task 5: Persistir métricas y hacer atómica la creación del activo

**Files:**

- Create: `db/migrations/013_adaptive_public_media.sql`
- Modify: `src/lib/content/media/media-storage.ts`
- Modify: `src/lib/content/media/filesystem-media-storage.ts`
- Create: `src/lib/content/media/filesystem-media-storage.test.ts`
- Modify: `src/lib/content/media/content-media-service.ts`
- Create: `src/lib/content/media/content-media-service.test.ts`

- [ ] Crear migración aditiva compatible con activos existentes:

```sql
alter table media_asset
  add column if not exists original_filename text,
  add column if not exists source_byte_size bigint,
  add column if not exists source_format text,
  add column if not exists quality integer,
  add column if not exists compression_iterations integer,
  add column if not exists reduction_percent numeric(6,2),
  add column if not exists failure_code text;

alter table media_asset
  alter column width drop not null,
  alter column height drop not null,
  alter column byte_size drop not null;

alter table media_variant
  add column if not exists compression_iterations integer,
  add column if not exists reduction_percent numeric(6,2);

create table if not exists media_reprocess_job (
  source_asset_id text primary key references media_asset(id) on delete cascade,
  target_asset_id text references media_asset(id) on delete set null,
  policy_version text not null,
  status text not null check (status in ('processing', 'ready', 'failed')),
  attempts integer not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);
```

- [ ] Mantener la migración solo hacia adelante: el runner aplica todo archivo `.sql` del directorio y no soporta down migrations. Documentar SQL de rollback manual en el registro de deploy, sin colocarlo en `db/migrations/`, y no ejecutarlo después de aceptar nuevas escrituras sin una revisión de datos.
- [ ] Extender `MediaStorage` con `remove(pathSegments)` idempotente y probar que no permite traversal.
- [ ] Agregar un constraint idempotente: un activo `ready` exige `width`, `height` y `byte_size` no nulos; `processing/failed` puede mantenerlos nulos. Esto permite registrar un procesamiento válido antes de conocer el resultado comprimido.
- [ ] Escribir tests RED del servicio con storage/pool falsos para estos órdenes:
  1. valida y normaliza la entrada;
  2. inserta `media_asset.status='processing'` con source metadata y rutas previstas;
  3. optimiza todas las variantes en memoria;
  4. escribe maestro/variantes;
  5. en una transacción inserta variantes, completa métricas del maestro y cambia activo a `ready`;
  6. ante fallo de compresión, write o finalización, intenta limpiar binarios, marca `failed`, no devuelve asset.
- [ ] Refactorizar persistencia en funciones explícitas:

```ts
const normalized = await normalizeImageInput(input.file);
await insertProcessingAsset(pool, toProcessingRow(assetId, input, normalized));
try {
  const optimized = await optimizeNormalizedContentImage(
    normalized,
    optimizationOptions,
  );
  const stored = await writeAllArtifacts(storage, assetId, optimized);
  await finalizeReadyAsset(pool, assetId, stored, optimized, crops);
  return { asset: toReadyAsset({ assetId, stored, optimized }) };
} catch (error) {
  await Promise.allSettled(
    writtenKeys.map((key) => storage.remove(key.split("/"))),
  );
  await markAssetFailed(pool, assetId, toMediaFailureCode(error));
  throw error;
}
```

- [ ] Eliminar el catch que ignora PostgreSQL `42P01` cuando existe `DATABASE_URL`; una migración faltante debe fallar de forma visible.
- [ ] Incluir métricas completas en la respuesta admin, pero conservar maestro fuera de las vistas públicas.
- [ ] Ejecutar migración y tests contra PostgreSQL local, incluidos fallo de storage y fallo de commit.

```bash
npm run migrate
npm test -- \
  src/lib/content/media/filesystem-media-storage.test.ts \
  src/lib/content/media/content-media-service.test.ts
```

Expected: código `0`; una variante fallida deja `media_asset.status='failed'`, cero referencias editoriales nuevas y ningún archivo parcial restante en el storage falso.

- [ ] Commit.

```bash
git add db/migrations/013_adaptive_public_media.sql src/lib/content/media
git commit -m "feat: persist atomic media optimization"
```

### Task 6: Unificar selector, normalización previa y APIs administrativas

**Files:**

- Create: `src/app/admin/content/prepare-managed-image.ts`
- Create: `src/app/admin/content/prepare-managed-image.test.ts`
- Modify: `src/app/admin/content/media/crop-dialog.tsx`
- Modify: `src/app/admin/content/content-hub.tsx`
- Modify: `src/app/admin/content/content-hub.test.tsx`
- Modify: `src/app/admin/home/home-editor.tsx`
- Modify: `src/app/admin/home/home-editor.test.tsx`
- Modify: `src/app/admin/bungalows/bungalow-form.tsx`
- Modify: `src/app/api/admin/content/media/route.ts`
- Modify: `src/app/api/admin/content/media/route.test.ts`
- Modify: `src/app/api/admin/home-content/media/route.test.ts`
- Modify: `src/app/api/bungalows/[id]/media/hero/route.test.ts`
- Modify: `src/app/api/bungalows/[id]/media/gallery/route.test.ts`

- [ ] Escribir tests RED que exijan el mismo `accept` en Content Hub, Home y formulario legado de Bungalows, y que HEIC se normalice antes de crear el Object URL del crop dialog.
- [ ] Implementar helper cliente único:

```ts
export async function prepareManagedImage(file: File): Promise<File> {
  if (!isHeicOrHeif(file)) return file;
  const form = new FormData();
  form.set("file", file);
  const response = await fetch("/api/admin/content/media/normalize", {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw await readMediaApiError(response);
  const blob = await response.blob();
  return new File([blob], replaceExtension(file.name, ".webp"), {
    type: "image/webp",
  });
}
```

- [ ] Usar `PUBLIC_MEDIA_ACCEPT` en todos los inputs; no duplicar strings MIME.
- [ ] En Content Hub, hacer `beginUpload` asíncrono: deshabilitar input, normalizar, abrir crop sobre el File preparado y solo después llamar a `/api/admin/content/media`.
- [ ] En Home y Bungalows legados, normalizar antes de las rutas de compatibilidad. Las rutas siguen delegando en `ContentMediaService`; no contienen Sharp ni una compresión propia.
- [ ] Actualizar `/api/admin/content/media` para trabajar con `MediaProcessingError`, devolver métricas y conservar crops obligatorios. Probar que, si el servicio falla, responde 4xx/422 y nunca 201 parcial.
- [ ] Mantener la interacción simple: `Subir/Reemplazar`, progreso, crop cuando ya existe, resultado y error. No agregar calidad, KB, dimensiones o formato como campos editables.
- [ ] Ejecutar tests focalizados.

```bash
npm test -- \
  src/app/admin/content/prepare-managed-image.test.ts \
  src/app/admin/content/content-hub.test.tsx \
  src/app/admin/home/home-editor.test.tsx \
  src/app/api/admin/content/media/route.test.ts \
  src/app/api/admin/home-content/media/route.test.ts \
  'src/app/api/bungalows/[id]/media/hero/route.test.ts' \
  'src/app/api/bungalows/[id]/media/gallery/route.test.ts'
```

Expected: código `0`; el test de HEIC observa primero `/normalize` y luego la ruta final con `image/webp`; JPEG/PNG/WebP/AVIF no hacen la llamada extra.

- [ ] Commit.

```bash
git add src/app/admin src/app/api/admin/content/media src/app/api/admin/home-content/media 'src/app/api/bungalows/[id]/media'
git commit -m "feat: unify managed image uploads"
```

### Task 7: Migrar Home a referencias de activos y servir hero mobile real

**Files:**

- Modify: `src/lib/home-content/types.ts`
- Modify: `src/lib/home-content/schema.ts`
- Modify: `src/lib/home-content/schema.test.ts`
- Modify: `src/lib/home-content/default-content.ts`
- Modify: `src/lib/home-content/store.ts`
- Create: `src/lib/home-content/store.test.ts`
- Modify: `src/lib/home-content/public-view.ts`
- Modify: `src/lib/home-content/public-view.test.ts`
- Modify: `src/app/api/admin/home-content/route.ts`
- Modify: `src/app/api/admin/home-content/route.test.ts`
- Modify: `src/app/admin/home/home-editor.tsx`
- Modify: `src/components/public-site/home-hero-slider.tsx`
- Create: `src/components/public-site/home-hero-slider.test.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/localized-public-site.test.tsx`

- [ ] Crear schema v3 con referencia administrada y mantener v1/v2 únicamente como formatos almacenados de lectura:

```ts
export type ManagedImageReference = {
  assetId: string | null;
  fallbackUrl: string;
};

export type HomeContentDocument = {
  schemaVersion: 3;
  // slider/sections usan ManagedImageReference en los campos de imagen
};
```

- [ ] Migrar strings v1/v2 en lectura. Si coinciden con `/media/assets/<id>/<variant>.webp`, inferir `assetId`; de lo contrario usar `assetId: null` y conservar `fallbackUrl`.
- [ ] Crear un schema de escritura que solo acepte v3. Dentro de la transacción de publish, comparar con la revisión vigente: un fallback legado sin asset puede conservarse sin cambios, pero un URL nuevo/reemplazado sin `assetId` falla con `managed_media_required`.
- [ ] Actualizar Home Editor para guardar `{ assetId: body.asset.id, fallbackUrl: body.media.url }`, manteniendo la referencia publicada anterior si el upload falla.
- [ ] Resolver vistas públicas:

```ts
function resolveHeroImage(image: ManagedImageReference) {
  if (!image.assetId)
    return { desktop: image.fallbackUrl, mobile: image.fallbackUrl };
  return {
    desktop: `/media/assets/${image.assetId}/heroDesktop.webp`,
    mobile: `/media/assets/${image.assetId}/heroMobile.webp`,
  };
}
```

- [ ] Renderizar hero con `<picture>` y fallback desktop:

```tsx
<picture>
  <source media="(max-width: 767px)" srcSet={slide.image.mobile} />
  <img src={slide.image.desktop} alt="" />
</picture>
```

- [ ] Las imágenes no hero de Home resuelven `detail.webp`; OpenGraph usa `heroDesktop.webp`; ningún HTML contiene `master.webp`.
- [ ] Probar migración, publicación con fallback intacto, rechazo de URL inyectada, upload con asset, source mobile y compatibilidad ES/EN.

```bash
npm test -- \
  src/lib/home-content/schema.test.ts \
  src/lib/home-content/store.test.ts \
  src/lib/home-content/public-view.test.ts \
  src/app/api/admin/home-content/route.test.ts \
  src/components/public-site/home-hero-slider.test.tsx \
  'src/app/[locale]/localized-public-site.test.tsx'
```

Expected: código `0`; la salida renderizada incluye `heroMobile.webp` en `<source>`, `heroDesktop.webp` en `<img>` y no incluye `master.webp`.

- [ ] Commit.

```bash
git add src/lib/home-content src/app/api/admin/home-content src/app/admin/home src/components/public-site/home-hero-slider* 'src/app/[locale]'
git commit -m "feat: serve responsive managed home media"
```

### Task 8: Reemplazar URL libre de Testimonios por media administrada

**Files:**

- Modify: `src/components/public-site/public-company-content.ts`
- Modify: `src/lib/corporate-content/types.ts`
- Modify: `src/lib/corporate-content/schema.ts`
- Modify: `src/lib/corporate-content/schema.test.ts`
- Modify: `src/lib/corporate-content/default-content.ts`
- Modify: `src/lib/corporate-content/store.ts`
- Modify: `src/lib/corporate-content/store.test.ts`
- Modify: `src/lib/corporate-content/public-view.ts`
- Modify: `src/lib/corporate-content/public-view.test.ts`
- Modify: `src/app/api/admin/corporate-content/route.ts`
- Modify: `src/app/api/admin/corporate-content/route.test.ts`
- Modify: `src/app/admin/content/corporate-content-editor.tsx`
- Modify: `src/app/admin/content/corporate-content-editor.test.tsx`
- Modify: `src/app/[locale]/testimonials/page.tsx`
- Modify: `src/app/[locale]/localized-public-site.test.tsx`

- [ ] Introducir Corporate schema v2. Cada testimonio recibe `id` estable compartido entre ES/EN e `image: ManagedImageReference`. Migrar v1 por posición usando IDs deterministas `testimonial-01`, `testimonial-02`, etc.; inferir asset ID desde URLs administradas cuando sea posible.
- [ ] Separar schema de lectura y escritura. Al publicar, permitir fallback v1 sin cambios, rechazar URLs nuevas sin asset y aceptar referencias `ready`.
- [ ] Reemplazar el `Field label="Imagen"` por selector administrado. Debe llamar `prepareManagedImage`, abrir el `CropDialog` compartido con crop `standard`, subir por `/api/admin/content/media` con slot `detail` y, al completar, actualizar la misma referencia por `testimonial.id` en ES y EN sin pedir dos uploads.
- [ ] Crear nuevos testimonios en ambos locales con el mismo ID y sin URL libre. No exponer ningún input de texto para `fallbackUrl`.
- [ ] La vista pública resuelve `detail.webp` y conserva la URL histórica solo si `assetId` es null.
- [ ] Actualizar metadata de Testimonios para usar la primera imagen resuelta, sin maestro.
- [ ] Probar migración v1→v2, alineación ES/EN por ID, fallo de upload conservando referencia, rechazo de URL directa y render público.

```bash
npm test -- \
  src/lib/corporate-content/schema.test.ts \
  src/lib/corporate-content/store.test.ts \
  src/lib/corporate-content/public-view.test.ts \
  src/app/api/admin/corporate-content/route.test.ts \
  src/app/admin/content/corporate-content-editor.test.tsx \
  'src/app/[locale]/localized-public-site.test.tsx'
```

Expected: código `0`; el editor no renderiza un input de URL de imagen, una sola carga actualiza ES/EN y la página pública usa `/media/assets/<id>/detail.webp`.

- [ ] Commit.

```bash
git add src/components/public-site/public-company-content.ts src/lib/corporate-content src/app/api/admin/corporate-content src/app/admin/content/corporate-content-editor* 'src/app/[locale]/testimonials' 'src/app/[locale]/localized-public-site.test.tsx'
git commit -m "feat: manage testimonial images as assets"
```

### Task 9: Blindar todas las superficies públicas y eliminar pipelines paralelos

**Files:**

- Modify: `src/lib/content/public-content.ts`
- Modify: `src/lib/content/public-content.test.ts`
- Modify: `src/lib/content/no-parallel-media-pipeline.test.ts`
- Modify: `src/lib/home-content/media.ts`
- Modify: `src/lib/reservations/bungalow-media.ts`
- Modify: `src/lib/content/media/image-optimizer.ts`
- Modify: `scripts/backfill-public-content-hub.js`
- Create: `scripts/backfill-public-content-hub.ts`
- Modify: `package.json`

- [ ] Ampliar el test de arquitectura para revisar APIs, wrappers, Home, Corporate y scripts. Solo `image-optimizer.ts`, `input-normalizer.ts` y `heic-decoder.ts` pueden importar Sharp/decoder.
- [ ] Hacer fallar el test si aparece `.webp({ quality:` fuera del optimizador compartido, si un documento nuevo declara imagen como string libre o si el seed genera variantes por su cuenta.
- [ ] Confirmar Experiencias, Galería y Bungalows siempre resuelven `card/detail/thumb/heroDesktop/heroMobile`; no `master`.
- [ ] Migrar `scripts/backfill-public-content-hub.js` a TypeScript ejecutado con `tsx`, importando `ContentMediaService`/optimizer compartido. Conservar flags `--apply`, `--force`, `--verbose` y eliminar la tabla local `VARIANT_DIMENSIONS` y los helpers Sharp duplicados.
- [ ] Añadir script canónico:

```json
"content:backfill": "tsx scripts/backfill-public-content-hub.ts"
```

- [ ] Eliminar el `.js` solo después de verificar que la documentación/comandos apuntan al `.ts`.
- [ ] Ejecutar prueba de arquitectura y dry-run local.

```bash
npm test -- \
  src/lib/content/no-parallel-media-pipeline.test.ts \
  src/lib/content/public-content.test.ts
npm run content:backfill -- --verbose
```

Expected: tests con código `0`; dry-run no cambia conteos/archivos y cada asset propuesto reporta pesos dentro de política.

- [ ] Commit.

```bash
git add src/lib/content src/lib/home-content/media.ts src/lib/reservations/bungalow-media.ts scripts package.json package-lock.json
git commit -m "refactor: keep one public media pipeline"
```

### Task 10: Construir backfill histórico reanudable e idempotente

**Files:**

- Create: `src/lib/content/media/media-reprocess.ts`
- Create: `src/lib/content/media/media-reprocess.test.ts`
- Create: `scripts/reprocess-public-media.ts`
- Modify: `package.json`
- Modify: `src/lib/content/media/content-media-service.ts`
- Modify: `src/lib/home-content/store.ts`
- Modify: `src/lib/corporate-content/store.ts`

- [ ] Crear un planificador puro que seleccione únicamente activos `ready` cuyo maestro o alguna variante exceda la política vigente, o que carezcan de métricas nuevas.
- [ ] Derivar ID objetivo determinista desde `source_asset_id + policyVersion`, por ejemplo `asset_repack_<sha256[:24]>`. Una repetición antes de publicar puede reescribir ese target no referenciado; después de `media_reprocess_job.status='ready'` debe saltarlo.
- [ ] Leer el maestro WebP vigente y los `crop_spec`; inferir slot por conjunto de variantes. Llamar al mismo `ContentMediaService.createAssetFromBuffer`, sin otra implementación de Sharp.
- [ ] Tras dejar el target `ready`, actualizar en transacción referencias relacionales:

```sql
update content_experience
set card_asset_id = case when card_asset_id = $1 then $2 else card_asset_id end,
    hero_asset_id = case when hero_asset_id = $1 then $2 else hero_asset_id end,
    gallery_asset_ids = array_replace(gallery_asset_ids, $1, $2);

update content_gallery_item set asset_id = $2 where asset_id = $1;

update bungalow_public_content
set hero_asset_id = case when hero_asset_id = $1 then $2 else hero_asset_id end,
    gallery_asset_ids = array_replace(gallery_asset_ids, $1, $2);
```

- [ ] Al terminar el lote, crear una nueva revisión Home/Corporate solo si el documento vigente todavía contiene un source ID sustituido. No reescribir revisiones históricas. Si el proceso cae después de actualizar tablas pero antes de publicar revisiones, el siguiente run debe completar únicamente lo faltante.
- [ ] Conservar activos antiguos para rollback e historial; el backfill no borra masters/variantes viejos.
- [ ] Implementar CLI:

```json
"media:reprocess": "tsx scripts/reprocess-public-media.ts"
```

Flags obligatorios: default dry-run, `--apply`, `--limit=<n>`, `--resume`; salida JSON sin secretos con source, target, bytes before/after, referencias actualizadas, skipped y failures.

- [ ] Probar: dry-run sin mutación; primer apply; reanudación tras fallo inyectado; segundo apply sin cambios; revisión Home/Corporate única; antiguo activo retenido.

```bash
npm test -- src/lib/content/media/media-reprocess.test.ts
npm run media:reprocess -- --limit=10
```

Expected: test con código `0`; dry-run devuelve candidatos y `mutations: 0`; una segunda ejecución aplicada sobre el mismo fixture devuelve `processed: 0` y `skippedReady > 0`.

- [ ] Commit.

```bash
git add src/lib/content/media src/lib/home-content/store.ts src/lib/corporate-content/store.ts scripts/reprocess-public-media.ts package.json package-lock.json
git commit -m "feat: add resumable media reprocessing"
```

### Task 11: Ejecutar QA integral, corpus y smoke local

**Files:**

- Create: `e2e/adaptive-public-media.spec.ts`
- Modify: `e2e/public-content-hub.spec.ts`
- Modify: `e2e/public-home-parity.spec.ts`
- Create: `docs/fase-6-qa/06.07-adaptive-public-media-evidence.md`
- Modify: `docs/fase-8-operacion/08.03-wakaya-runbook-reservas-web.md`

- [ ] E2E autenticado: subir JPEG, AVIF y HEIC; comprobar progreso/recorte, publicar Home/Testimonio en un entorno de prueba, cambiar viewport y verificar desktop/mobile.
- [ ] E2E de fallo: cargar corrupto, >25 MB simulado y presupuesto imposible; comprobar que UI conserva preview/referencia anterior.
- [ ] Inspeccionar por API/storage todos los buffers generados por el corpus y registrar tabla de bytes, dimensiones, calidad, iteraciones y reducción.
- [ ] Probar headers públicos: `Content-Type: image/webp` y `Cache-Control: public, max-age=31536000, immutable`.
- [ ] Ejecutar gates en este orden:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run check:docs
npm run check:project
npx playwright test e2e/adaptive-public-media.spec.ts e2e/public-content-hub.spec.ts e2e/public-home-parity.spec.ts
```

Expected: todos terminan con código `0`; cero variante del corpus excede presupuesto; build standalone incluye `heic-convert`; HTML ES/EN no referencia `master.webp`.

- [ ] Ejecutar el servidor standalone local y smoke de rutas:

```bash
PORT=3212 node .next/standalone/server.js
```

Expected: `/api/health`, `/es`, `/en`, `/es/gallery`, `/en/gallery`, `/es/testimonials` y `/en/testimonials` responden `200`; una carga admin autenticada devuelve asset `ready` con métricas.

- [ ] Documentar comandos, resultados, tamaño de fixtures y cualquier excepción en `06.07-adaptive-public-media-evidence.md`. Actualizar runbook con límites, mensajes operativos, dry-run del backfill y restauración de media.
- [ ] Usar `superpowers:requesting-code-review`; corregir hallazgos y volver a correr los gates afectados.
- [ ] Commit.

```bash
git add e2e docs/fase-6-qa/06.07-adaptive-public-media-evidence.md docs/fase-8-operacion/08.03-wakaya-runbook-reservas-web.md
git commit -m "test: verify adaptive public media end to end"
```

### Task 12: Preparar y desplegar sin mezclar el backfill histórico

**Files:**

- Create: `output/deploy/2026-07-14-wakaya-adaptive-public-media-deploy.md`
- Modify: `docs/fase-7-deploy/07.02-wakaya-reservations-env-checklist.md`

- [ ] Usar `superpowers:verification-before-completion` antes de declarar el release listo y seguir el runbook real de Wakaya.
- [ ] Capturar baseline sin imprimir variables/secretos: SHA actual, health, PM2, conteos/status de media, uso de storage, tamaño máximo de variantes, Nginx efectivo y soporte Sharp.
- [ ] Crear backup separado de PostgreSQL y de `/home/wakaya/apps/wakaya-erp/shared/wakaya-media`, con checksums y prueba de lectura.
- [ ] Elevar `client_max_body_size` de Nginx a `30m`, ejecutar `nginx -t` y recargar. La aplicación mantiene el límite real en 25 MB para dejar margen al multipart.
- [ ] Verificar en el VPS antes del corte:

```bash
node -e "const sharp=require('sharp'); console.log(sharp.versions, sharp.format.heif)"
node -e "require('heic-convert'); console.log('heic-convert=ok')"
```

Expected: Sharp/WebP/AVIF disponibles y `heic-convert=ok`; no se exige que Sharp anuncie HEIC.

- [ ] Desplegar un `git archive` limpio del commit verificado, instalar con `npm ci`, compilar standalone, aplicar migración 013 y reiniciar PM2 `wakaya-erp`.
- [ ] No ejecutar `npm run media:reprocess -- --apply` durante este deploy.
- [ ] Smoke autenticado con un JPEG/AVIF/HEIC de prueba: verificar respuesta `ready`, budgets/metrics en PostgreSQL, archivos WebP y error controlado para corrupto. Evitar cambiar contenido público durante este smoke.
- [ ] Smoke público ES/EN: Home desktop/mobile, Experiencias, Galería, Bungalows y Testimonios; revisar headers inmutables y ausencia de `master.webp`.
- [ ] Ejecutar solo el inventario histórico en dry-run:

```bash
npm run media:reprocess -- --limit=100
```

Expected: reporte JSON sin mutaciones, con candidatos/bytes estimados y ningún secreto. Adjuntarlo al deploy record para una ventana separada.

- [ ] Verificar health, PM2 online, logs nuevos sin OOM/decoder/Sharp errors, espacio libre, checksums de backup y versión exacta servida.
- [ ] Registrar rollback:
  1. restaurar symlink/release y reiniciar PM2;
  2. volver Nginx al valor anterior solo si se necesita;
  3. conservar migración 013 y activos nuevos porque es aditiva;
  4. no restaurar ciegamente DB/storage después de nuevas cargas;
  5. si el error afecta media, deshabilitar temporalmente el upload y corregir hacia adelante usando backups aislados.
- [ ] Obtener aprobación separada antes de `media:reprocess -- --apply`; aplicar en lotes pequeños, revisar health/espacio/errores entre lotes y conservar los assets antiguos.
- [ ] Commit del registro de deploy desde el estado final verificado.

```bash
git add output/deploy/2026-07-14-wakaya-adaptive-public-media-deploy.md docs/fase-7-deploy/07.02-wakaya-reservations-env-checklist.md
git commit -m "docs: record adaptive media deployment"
```

## Final acceptance checklist

- [ ] Personal selecciona JPG/PNG/WebP/AVIF/HEIC/HEIF sin preparar el archivo manualmente.
- [ ] Toda variante pública es WebP y cumple su presupuesto medido sobre el archivo almacenado.
- [ ] Maestro `<= 1.5 MB`, privado y ausente de HTML público.
- [ ] Home usa `heroMobile` bajo `767px` y `heroDesktop` en desktop.
- [ ] Testimonios ya no tienen campo libre de URL; una carga sirve ES/EN.
- [ ] Experiencias, Galería, Bungalows, Home y Páginas delegan en el mismo servicio.
- [ ] Fallo de decoder, compresión, storage o DB conserva la referencia editorial anterior.
- [ ] PostgreSQL registra source bytes, output bytes, reducción, calidad, dimensiones, iteraciones, checksum, crop, estado y actor.
- [ ] Nginx acepta el multipart de 25 MB con margen y la aplicación rechaza por encima del límite.
- [ ] Tests, typecheck, lint, build, docs y Playwright están verdes con evidencia fresca.
- [ ] Deploy tiene backup, rollback, health, smoke autenticado/público y logs revisados.
- [ ] Backfill histórico es reanudable/idempotente y no se aplica durante el deploy principal.

## External implementation references

- Sharp constructor/input safety and `limitInputPixels`: https://sharp.pixelplumbing.com/api-constructor/
- Sharp metadata/content detection: https://sharp.pixelplumbing.com/api-input/
- HEIC decoder selected for the production fallback: https://github.com/catdad-experiments/heic-convert
