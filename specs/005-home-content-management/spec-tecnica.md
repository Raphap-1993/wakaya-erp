# Spec tecnica - Wakaya Home Content Management

[README principal](../../README.md) | [Specs](../README.md)

## Resumen tecnico
La implementacion agrega un dominio `home-content` separado de reservas pero
conectado al sitio publico localizado. El editor publica un documento completo
validado con concurrencia optimista y revisiones inmutables.

## Modelo de documento
- `schemaVersion`
- `version`
- `slider`
- `sections`
- `updatedAt`
- `updatedBy`

`slider` contiene:
- `autoplay`
- `intervalMs`
- `slides[]`

Cada `slide` y cada `section` contiene:
- `id`
- `kind`
- `visible`
- `order`
- `textSizePreset`
- `cta`
- `image`
- `content.es`
- `content.en`

## Persistencia

Tabla `home_content_publication`:

| Columna | Tipo | Notas |
|---|---|---|
| id | TEXT | PK, valor fijo `home` |
| schema_version | INTEGER | NOT NULL |
| version | INTEGER | NOT NULL |
| content_json | JSONB | NOT NULL |
| updated_by | TEXT | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

Tabla `home_content_revision`:

| Columna | Tipo | Notas |
|---|---|---|
| id | TEXT | PK |
| home_id | TEXT | FK -> home_content_publication(id) |
| version | INTEGER | version restaurable |
| content_json | JSONB | NOT NULL |
| created_by | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

## Reglas de validacion
- maximo `8` slides
- al menos `1` slide visible
- una sola instancia por `kind` de seccion
- `textSizePreset`: `small | regular | large | display`
- `sizeAdjustPx`: delta opcional en pasos de `0.5px` dentro del rango `-8px`
  a `8px`
- `weightValue`: override opcional de peso tipografico dentro del rango `350`
  a `650`
- autoplay seguro: `4000 | 4800 | 6000 | 8000 | 10000`
- CTA solo con destinos internos, `tel:`, `https:` o `https://wa.me/`
- orden secuencial sin huecos
- secciones fijas: `booking-band`, `stats`, `story`, `bungalows`,
  `quote-band`, `experiences`, `testimonials`, `closing-cta`

## Lectura y fallback
- lectura primaria desde PostgreSQL
- fallback al ultimo payload valido cacheado en memoria si la persistencia falla
- fallback final al snapshot equivalente al home actual si no existe fila aun
- el lector publico nunca deberia construir el home desde payload parcialmente
  invalido

## Publicacion
- `PUT /api/admin/home-content` exige `expectedVersion`
- si `expectedVersion !== version almacenada`, responder
  `409 home_content_version_conflict`
- una publicacion valida:
  1. valida el documento completo
  2. guarda revision con el payload previo
  3. incrementa version
  4. actualiza payload publicado
  5. invalida cache/rutas publicas

## Seguridad
- lectura administrativa requiere sesion valida de backoffice
- mutaciones requieren permiso `content:write`
- restore usa el mismo permiso
- la API publica nunca expone auditoria, permisos ni revisiones

## Integracion con la web publica
- `src/app/[locale]/page.tsx` consume `home-content` validado
- la seccion `bungalows` sigue resolviendo cards desde la fuente actual de
  bungalows y solo toma del documento del home sus labels, visibilidad y copy
  auxiliar
- booking requests, disponibilidad y demas logica publica no cambian su fuente
  de verdad

## Media
- `POST /api/admin/home-content/media` reutiliza pipeline server-side seguro
- el documento del home guarda referencias validadas a activos, no binarios
