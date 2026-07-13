# API Contract - Wakaya Home Content Management

[README principal](../../README.md) | [Specs](../README.md)

## GET /api/admin/home-content

### Response 200
```json
{
  "content": {
    "schemaVersion": 1,
    "version": 18,
    "slider": {
      "autoplay": true,
      "intervalMs": 4800,
      "slides": [
        {
          "id": "slide-hero",
          "visible": true,
          "order": 1,
          "textSizePreset": "display",
          "content": {
            "es": { "eyebrow": "Wakaya", "title": "Descansa junto a la laguna" },
            "en": { "eyebrow": "Wakaya", "title": "Stay by the lagoon" }
          },
          "cta": {
            "kind": "internal",
            "label": { "es": "Ver bungalows", "en": "View bungalows" },
            "href": "/bungalows"
          }
        }
      ]
    },
    "sections": []
  },
  "lastPublishedAt": "2026-07-09T23:10:00.000Z",
  "lastPublishedBy": "admin@wakaya.local",
  "permissions": {
    "canPublish": true
  }
}
```

## PUT /api/admin/home-content

### Request
```json
{
  "expectedVersion": 18,
  "content": {
    "schemaVersion": 1,
    "slider": {
      "autoplay": true,
      "intervalMs": 4800,
      "slides": []
    },
    "sections": []
  }
}
```

### Response 200
```json
{
  "content": {
    "schemaVersion": 1,
    "version": 19
  },
  "publishedAt": "2026-07-09T23:16:00.000Z",
  "publishedBy": "admin@wakaya.local"
}
```

### Response 409
```json
{
  "error": "home_content_version_conflict",
  "message": "La version publicada cambio mientras editabas.",
  "currentVersion": 19,
  "currentContent": {
    "schemaVersion": 1,
    "version": 19
  }
}
```

## GET /api/admin/home-content/revisions

### Response 200
```json
{
  "items": [
    {
      "version": 18,
      "createdAt": "2026-07-09T22:50:00.000Z",
      "createdBy": "admin@wakaya.local",
      "summary": "Slide hero + cierre CTA"
    },
    {
      "version": 17,
      "createdAt": "2026-07-08T18:22:00.000Z",
      "createdBy": "editor@wakaya.local",
      "summary": "Experiencias ES/EN"
    }
  ]
}
```

## POST /api/admin/home-content/revisions/{version}/restore

### Response 200
```json
{
  "restoredVersion": 17,
  "publishedVersion": 20,
  "publishedAt": "2026-07-09T23:25:00.000Z",
  "publishedBy": "admin@wakaya.local"
}
```

## POST /api/admin/home-content/media

### Request
- `Content-Type: multipart/form-data`
- campo `file`
- campo `slot` opcional (`slider`, `story`, `closing-cta`, etc.)

### Response 201
```json
{
  "asset": {
    "id": "home_media_01",
    "url": "/media/home/home_media_01.webp",
    "alt": {
      "es": "Atardecer en Wakaya",
      "en": "Sunset at Wakaya"
    },
    "width": 1600,
    "height": 900
  }
}
```

## Errores canonicos
- `home_content_validation_failed`
- `home_content_version_conflict`
- `home_content_revision_not_found`
- `home_content_media_invalid`
- `forbidden`
- `unauthorized`
