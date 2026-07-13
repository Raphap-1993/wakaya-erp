# API Contract - Wakaya Bungalow Backoffice Media

[README principal](../../README.md) | [Specs](../README.md)

## POST /api/bungalows/[id]/media/hero

### Request
- `Content-Type: multipart/form-data`
- campo `file`

### Response 200
```json
{
  "heroImage": {
    "assetId": "media_hero_01",
    "alt": "Bungalow Doble portada",
    "variants": {
      "hero": { "url": "/media/hero.webp", "width": 1600, "height": 900, "bytes": 412000 },
      "card": { "url": "/media/card.webp", "width": 960, "height": 540, "bytes": 168000 },
      "thumb": { "url": "/media/thumb.webp", "width": 320, "height": 180, "bytes": 28000 }
    }
  }
}
```

## POST /api/bungalows/[id]/media/gallery

### Request
- `Content-Type: multipart/form-data`
- campo `files`

### Response 201
```json
{
  "galleryImages": [
    {
      "id": "gallery_01",
      "sortOrder": 1,
      "variants": {
        "detail": { "url": "/media/detail-1.webp", "width": 1280, "height": 720, "bytes": 236000 },
        "thumb": { "url": "/media/thumb-1.webp", "width": 320, "height": 180, "bytes": 24000 }
      }
    }
  ]
}
```

## PATCH /api/bungalows/[id]/media/gallery

### Request
```json
{
  "items": [
    { "id": "gallery_02", "sortOrder": 1 },
    { "id": "gallery_01", "sortOrder": 2 }
  ]
}
```

### Response 200
```json
{
  "galleryImages": [
    { "id": "gallery_02", "sortOrder": 1 },
    { "id": "gallery_01", "sortOrder": 2 }
  ]
}
```

## DELETE /api/bungalows/[id]/media/gallery/[mediaId]

### Response 200
```json
{
  "deleted": true,
  "mediaId": "gallery_01"
}
```

## Errores
- `invalid_media_type`
- `media_too_large`
- `media_dimensions_too_large`
- `media_processing_failed`
- `media_not_found`
- `bungalow_not_found`
- `forbidden`
