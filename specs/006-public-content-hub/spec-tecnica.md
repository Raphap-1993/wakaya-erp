# Spec técnica - Wakaya Public Content Hub

[Specs](../README.md) | [Feature](README.md) | [ADR-012](../../docs/fase-3-arquitectura/adr/ADR-012-centro-contenido-media-inventario-unidades.md)

## Módulo
Crear `src/lib/content/` para tipos, schemas, repositorio, publicación, media y vistas localizadas. `src/lib/home-content/` se integra mediante adapter y no mantiene un segundo editor. El dominio `reservations` conserva la ficha de bungalow durante la transición y delega media al módulo `content`.

## Persistencia

### `media_asset`
| Columna | Tipo | Regla |
|---|---|---|
| id | text PK | identificador estable |
| checksum | text unique | SHA-256 del source |
| master_storage_key | text | WebP maestro |
| original_filename | text | auditado |
| source_mime_type | text | jpeg/png/webp |
| source_bytes | integer | máximo 15 MB |
| master_width/master_height | integer | lado mayor <= 3200 |
| status | text | `processing`, `ready`, `failed` |
| created_by/created_at | text/timestamptz | auditoría |

### `media_variant`
PK compuesta `(asset_id, variant_key)`, con `storage_key`, `width`, `height`, `quality`, `bytes`, `crop_json` y FK a `media_asset`.

### `content_experience`
`id`, `slug` unique, `visible`, `sort_order`, `locale_content jsonb`, `card_asset_id`, `hero_asset_id`, `version`, auditoría y soft delete.

### `content_gallery`
Agregado singleton con `id text primary key check (id = 'global')`, `version integer not null default 1`, `updated_by` y `updated_at`.

### `content_gallery_item`
`id`, `gallery_id text not null references content_gallery(id)`, `asset_id`, `visible`, `sort_order`, `locale_content jsonb`, auditoría. No existe tabla album.

`bungalow_public_content` agrega `revision_version integer not null default 1`, `hero_asset_id` y `gallery_asset_ids`; las URLs existentes se conservan durante una versión de compatibilidad de solo lectura.

`booking_request` agrega `requested_experience_id text references content_experience(id)`. El ID se persiste separado de `notes`; el detalle operativo carga la experiencia incluso si luego queda oculta. El slug público se resuelve a ID antes de enviar el request.

## Media
- dependencia UI: `react-easy-crop`;
- procesamiento: `sharp` en Route Handler Node runtime;
- maestro: `webp({ nearLossless: true, quality: 95, effort: 6 })`, resize dentro de 3200 sin upscale;
- `heroDesktop`: 1920x1080, q88;
- `heroMobile`: 1080x1350, q88;
- `detail`: 1600x1200, q86;
- `card`: 960x720, q86;
- `thumb`: 480x360, q84;
- EXIF removido; auto-rotate antes del crop.

Los crops se envían normalizados. El servidor valida `0 <= x,y < 1`, `0 < width,height <= 1`, límites, aspect ratio y resolución mínima. Heroes requieren `desktop` y `mobile`; otros slots requieren `standard`.

## Storage
Interfaz `MediaStorage` con `put`, `getPublicUrl` y `remove`. El adapter vigente usa filesystem persistente bajo `WAKAYA_MEDIA_STORAGE_PATH` y conserva `.data/wakaya-media` como default local. Producción debe montar una ruta persistente, incluirla en backups, probar restore y monitorear capacidad/permisos. PostgreSQL guarda metadata, no binarios. Object storage y su provisioning quedan fuera de alcance.

## Publicación
- Home usa `expectedVersion` contra la última `home_content_revision.version`;
- Experiencias usa `expectedVersion` contra `content_experience.version`;
- Galería usa `expectedVersion` contra `content_gallery.version`;
- Bungalows usa `expectedVersion` contra `bungalow_public_content.revision_version`;
- una transacción valida documento y referencias `ready`, guarda revisión e incrementa versión;
- tras commit se revalida cache/rutas públicas;
- falla de storage nunca deja una referencia publicada a un activo incompleto.

## Vista pública
- `/[locale]/services` carga experiencias visibles y ordenadas;
- `experience` se resuelve server-side por slug y locale;
- un slug inexistente no abre modal y deja la página en estado base;
- Home referencia IDs de experiencias; no duplica su copy;
- `/[locale]/gallery` consume la colección global;
- bungalows consumen variantes nuevas y luego fallback legado.
- `/[locale]/contact` resuelve `experience=<slug>`, envía `requestedExperienceId` y el detalle de booking request muestra experiencia localizada e ID.

## Convergencia con fuentes existentes
- migrar `src/lib/home-content/types.ts`, `schema.ts`, `default-content.ts`, `store.ts` y `public-view.ts` a documento v2 con `schemaVersion: 2` y `experienceIds`; el copy de experiencias deja de vivir embebido en Home;
- conservar revisiones v1 inmutables y publicar una revisión v2 transformada; el lector acepta v1 solo durante la migración y siempre emite v2;
- `/api/admin/home-content/media` delega a `contentMediaService`;
- `/api/bungalows/[id]/media/hero` y `/api/bungalows/[id]/media/gallery` delegan al mismo servicio;
- retirar `uploadHomeContentImage` y `optimizeAndStoreUploadedBungalowImage` como pipelines independientes después de migrar sus callers;
- los schemas de mutación rechazan `heroImageUrl` y `galleryUrls`; las columnas legadas solo alimentan fallback de lectura;
- una prueba de arquitectura impide imports directos a los optimizadores legados y exige que los tres endpoints usen el servicio común.

## Seguridad y errores
- `content:write` para POST/PUT/PATCH/DELETE;
- sesión admin para GET administrativo;
- MIME real, dimensiones y checksum se inspeccionan server-side;
- códigos: `content_version_conflict`, `invalid_media_type`, `media_too_large`, `media_crop_required`, `media_crop_invalid`, `media_crop_too_small`, `asset_in_use`, `experience_slug_conflict`, `forbidden`.

## Migración
1. crear tablas y columnas aditivas;
2. importar URLs legadas como referencias externas compatibles;
3. activar escritura nueva con lectores duales;
4. migrar activos a storage administrado;
5. activar lectura nueva;
6. retirar fallback en una release posterior con evidencia.

## Pruebas
Vitest para schemas/optimizer/repositorio/API/UI; Playwright para `/admin/content`, popup URL-driven, locale, crop desktop/mobile y publicación; `npm run typecheck`, `npm run build`, `npm run check:docs`.
