# API Contract - Wakaya Public Content Hub

[Specs](../README.md) | [Feature](README.md)

## Convenciones
- APIs admin requieren sesión; mutaciones, `content:write`.
- JSON salvo upload `multipart/form-data`.
- Fechas ISO-8601 UTC; orden entero desde `1`.
- Todo PUT de publicación incluye `expectedVersion`.

## GET /api/admin/content

### Response 200
```json
{
  "tabs": ["home", "experiences", "gallery", "bungalows"],
  "permissions": { "canWrite": true },
  "counts": { "experiences": 6, "galleryItems": 18, "bungalowTypes": 4 }
}
```

## GET|PUT /api/admin/content/home
Mantiene el contrato de `005-home-content-management` migrado a documento v2. PUT acepta `{ "expectedVersion": 18, "content": {} }`; `expectedVersion` compara la última `home_content_revision.version` y una publicación exitosa crea la siguiente revisión.

## GET|POST /api/admin/content/experiences

### POST request
```json
{
  "slug": "paseo-laguna",
  "visible": true,
  "sortOrder": 1,
  "content": {
    "es": { "title": "Paseo por la laguna", "summary": "Recorrido guiado", "body": "Una experiencia pausada.", "duration": "45 min", "ctaLabel": "Consultar" },
    "en": { "title": "Lagoon walk", "summary": "Guided walk", "body": "A calm experience.", "duration": "45 min", "ctaLabel": "Enquire" }
  },
  "cardAssetId": "asset_exp_card_01",
  "heroAssetId": "asset_exp_hero_01"
}
```

### Response 201
```json
{ "experience": { "id": "exp_01", "slug": "paseo-laguna", "version": 1 } }
```

## GET|PUT|DELETE /api/admin/content/experiences/{id}
PUT envía el documento anterior más `expectedVersion`, comparado con `content_experience.version`; éxito incrementa esa columna. DELETE hace soft delete y responde `409 asset_in_use` solo si una referencia publicada impide la operación.

## GET /api/admin/content/gallery

### Response 200
```json
{
  "version": 8,
  "items": [
    { "id": "gallery_01", "assetId": "asset_01", "visible": true, "sortOrder": 1, "alt": { "es": "Laguna", "en": "Lagoon" }, "caption": { "es": "Atardecer", "en": "Sunset" } }
  ]
}
```
`version` proviene de `content_gallery.version` del singleton `global`; los items son hijos y no tienen token independiente.

## POST /api/admin/content/gallery/items
Acepta `assetId`, `visible`, `alt.es/en`, `caption.es/en`; agrega al final.

## PUT /api/admin/content/gallery
```json
{
  "expectedVersion": 8,
  "items": [{ "id": "gallery_01", "visible": true, "sortOrder": 1 }]
}
```
La lista debe incluir todos los items activos y orden continuo. `expectedVersion` compara e incrementa `content_gallery.version`.

## DELETE /api/admin/content/gallery/items/{id}
Elimina la referencia de la galería, no el activo compartido.

## GET|PUT /api/admin/content/bungalows/{bungalowTypeId}
Gestiona contenido público localizado, tarifa, área, orden, `featuredOnHome`, `heroAssetId` y `galleryAssetIds`; no expone unidades físicas. PUT exige `expectedVersion` contra `bungalow_public_content.revision_version` y devuelve el valor incrementado. `heroImageUrl` y `galleryUrls` se rechazan en request.

## Rutas de compatibilidad de media
`POST /api/admin/home-content/media` y `POST /api/bungalows/{id}/media/hero|gallery` mantienen su URL durante la transición, pero delegan a la misma operación de `/api/admin/content/media`. No aceptan URLs manuales ni ejecutan optimizadores/stores propios.

## POST /api/admin/content/media
`multipart/form-data`:
- `file`: JPEG/PNG/WebP;
- `slot`: `hero | detail | card | gallery`;
- `crops`: JSON con rectángulos normalizados.

Hero:
```json
{
  "desktop": { "x": 0.02, "y": 0.10, "width": 0.96, "height": 0.54 },
  "mobile": { "x": 0.30, "y": 0.02, "width": 0.40, "height": 0.50 }
}
```

### Response 201
```json
{
  "asset": {
    "id": "asset_01",
    "status": "ready",
    "master": { "width": 3200, "height": 2133, "format": "webp", "quality": 95, "nearLossless": true },
    "variants": {
      "heroDesktop": { "url": "/media/asset_01/hero-desktop.webp", "width": 1920, "height": 1080, "quality": 88 },
      "heroMobile": { "url": "/media/asset_01/hero-mobile.webp", "width": 1080, "height": 1350, "quality": 88 }
    }
  }
}
```

## PATCH /api/admin/content/media/{assetId}/crops
Regenera derivados desde el maestro. Si el asset está referenciado, el cambio crea nueva revisión antes de reemplazar URLs.

## DELETE /api/admin/content/media/{assetId}
Solo elimina activos sin referencias; en uso responde `409 asset_in_use`.
La operación elimina la metadata en PostgreSQL y después limpia el maestro y sus
variantes del `MediaStorage`. Si la metadata ya fue eliminada pero queda una
limpieza física pendiente, responde `200` con `cleanupPending: true` y deja
evidencia en logs para reconciliación.

```json
{ "deleted": true, "assetId": "asset_01", "cleanupPending": false }
```

La UI primero quita o reemplaza la referencia y publica el documento dueño;
solo después puede solicitar la eliminación del activo que quedó sin uso.

## Invariantes de persistencia de media

- En producción, `POST` y `DELETE` requieren `DATABASE_URL` y
  `WAKAYA_MEDIA_STORAGE_PATH`; nunca se confirma una carga solo en memoria o en
  el filesystem efímero del release.
- El servicio resuelve PostgreSQL y la raíz de storage al ejecutar la petición,
  no al importar el módulo.
- El healthcheck informa si DB y storage durable están configurados sin exponer
  credenciales ni rutas privadas.

## GET /api/public/content/experiences?locale=es
Devuelve experiencias visibles sin auditoría ni permisos.

## POST /api/public/booking-requests - extensión de experiencia
El formulario que llega desde el popup envía el ID persistible además de sus campos actuales:
```json
{
  "requestedExperienceId": "exp_01",
  "notes": "Nos interesa el paseo al atardecer."
}
```

`requestedExperienceId` es nullable, debe referir una experiencia existente y se guarda en `booking_request.requested_experience_id`. La respuesta incluye el mismo ID. `GET /api/booking-requests/{id}` y el detalle admin incluyen:
```json
{
  "requestedExperience": {
    "id": "exp_01",
    "slug": "paseo-laguna",
    "title": "Paseo por la laguna"
  }
}
```

## Errores
```json
{ "error": "content_version_conflict", "message": "La versión publicada cambió.", "currentVersion": 9 }
```

Estados: `400` validación/media, `401` sin sesión, `403` sin permiso, `404` entidad, `409` conflicto/in-use, `413` archivo grande, `422` crop inválido, `500` procesamiento.
