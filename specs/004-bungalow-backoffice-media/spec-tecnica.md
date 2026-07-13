# Spec tecnica - Wakaya Bungalow Backoffice Media

[README principal](../../README.md) | [Specs](../README.md)

## Resumen técnico
La implementación introduce una capa de media persistida y optimizada para los
bungalows. La edición operativa sigue usando el dominio existente de bungalows,
pero la media deja de ser solo una colección de URLs crudas.

## Librería recomendada
- `sharp`

Razones:
- encaja con Node 20 y Route Handlers de Next.js;
- permite resize, WebP y stripping de metadata en un solo pipeline;
- evita depender de flujos cliente o de librerías menos robustas para fotos
  reales de 4 a 8 MB.

## Modelo de datos

Tabla `media_asset`:

| Columna | Tipo | Notas |
|---|---|---|
| id | TEXT | PK |
| storage_key | TEXT | NOT NULL |
| original_filename | TEXT | NOT NULL |
| mime_type | TEXT | NOT NULL |
| source_bytes | INTEGER | NOT NULL |
| width | INTEGER | NOT NULL |
| height | INTEGER | NOT NULL |
| checksum | TEXT | NOT NULL |
| variants_json | JSONB | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

Tabla `bungalow_public_media`:

| Columna | Tipo | Notas |
|---|---|---|
| id | TEXT | PK |
| bungalow_id | TEXT | FK -> bungalow(id) |
| media_asset_id | TEXT | FK -> media_asset(id) |
| kind | TEXT | enum: hero \| gallery |
| sort_order | INTEGER | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

## Variantes de imagen
- `hero`: `1600px` max ancho, WebP `quality 82`, `effort 5`, techo `600 KB`
- `detail`: `1280px` max ancho, WebP `quality 80`
- `card`: `960px` max ancho, WebP `quality 80`
- `thumb`: `320px` max ancho, WebP `quality 74`

Reglas:
- sin upscale
- remover metadata EXIF por defecto
- rechazar entradas mayores a `12 MB`
- rechazar imágenes por encima de `40 MP`
- si una variante supera su techo de bytes, recomprimir escalando calidad
  `82 -> 78 -> 74 -> 70`

## Storage
- dev/local: filesystem bajo `.data/media`
- producción: adapter S3-compatible

No guardar binarios en Postgres ni depender del filesystem efímero del
contenedor en producción.

## API y flujo
- `POST /api/bungalows/[id]/media/hero`
  - recibe `multipart/form-data`
  - procesa `file`
  - optimiza y reemplaza la portada actual
- `POST /api/bungalows/[id]/media/gallery`
  - recibe 1..n archivos
  - optimiza y agrega a la galería
- `PATCH /api/bungalows/[id]/media/gallery`
  - reordena la galería
- `DELETE /api/bungalows/[id]/media/gallery/[mediaId]`
  - elimina una imagen de galería

El `PUT /api/bungalows/[id]` queda centrado en datos operativos, comerciales y
editoriales; ya no debe ser la única vía para media.

## Cambios de tipos
- `BungalowPublicContent` mantiene compatibilidad durante la transición.
- Se agregan estructuras nuevas:
  - `BungalowMediaVariant`
  - `BungalowHeroImage`
  - `BungalowGalleryImage`
  - `BungalowMediaBundle`

## Validaciones
- tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
- máximo recomendado de galería: `8` imágenes por bungalow
- solo `reservation:write` muta media
- rechazar payload sin archivo o con media corrupta

## Compatibilidad transitoria
- mientras existan `heroImageUrl` y `galleryUrls`, el lector público debe poder
  resolver primero media estructurada y luego fallback a URLs legadas.
