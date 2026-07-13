# Especificación técnica

## Persistencia

Tabla `corporate_content_revision`:

- `version bigserial primary key`;
- `document jsonb not null`;
- `published_by_user_id text null`;
- `restored_from_version bigint null`;
- `created_at timestamptz not null default now()`.

## Módulos

- `src/lib/corporate-content/types.ts`: contrato del documento y revisiones.
- `src/lib/corporate-content/schema.ts`: validación Zod.
- `src/lib/corporate-content/default-content.ts`: importación normalizada ES/EN.
- `src/lib/corporate-content/store.ts`: store versionado PostgreSQL y fallback local.
- `src/lib/corporate-content/public-view.ts`: lectura localizada y aislamiento de notas internas.

`internal.legacyPages` conserva títulos, encabezados y párrafos exactos de los JSON del scraping. `public-view.ts` nunca entrega ese nodo a la web pública.

## API

- `GET /api/admin/corporate-content`
- `PUT /api/admin/corporate-content`
- `GET /api/admin/corporate-content/revisions`
- `POST /api/admin/corporate-content/revisions/:version/restore`

Todas requieren `content:write`. El `PUT` valida `expectedVersion` y el documento completo.

## Frontend

El Centro de Contenido acepta `tab=company`. El editor trabaja sobre un borrador local del documento completo y alterna ES/EN sin perder cambios. Las notas internas son de solo lectura.

## Fallback

Si PostgreSQL no está configurado se usa snapshot local; en tests se usa memoria. Si la relación aún no existe, la lectura devuelve el documento inicial y la escritura responde `corporate_content_store_not_ready`.
