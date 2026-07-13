# Spec tecnica - Wakaya Guest Trust Layer

[README principal](../../README.md) | [Specs](../README.md)

## Modelo de datos

Tabla `complaint_entry`:

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| public_code | TEXT | correlativo visible y único |
| entry_type | TEXT | enum: queja\|reclamo |
| full_name | TEXT | NOT NULL |
| document_type | TEXT | DNI, CE, PASSPORT u otro |
| document_number | TEXT | NOT NULL |
| email | TEXT | NOT NULL |
| phone | TEXT | NULLABLE |
| address | TEXT | NULLABLE |
| contracted_service | TEXT | NOT NULL |
| complaint_detail | TEXT | NOT NULL |
| consumer_request | TEXT | NOT NULL |
| accepted_terms | BOOLEAN | NOT NULL |
| status | TEXT | enum: received\|in_review\|answered\|closed |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

Indices: `(status, created_at DESC)`, `(public_code)`, `(document_number)`.

## Dependencias
- BD: PostgreSQL
- Fallback local: snapshot JSON del store en memoria
- Auth admin: RBAC existente

## Migraciones
- `db/migrations/005_complaints_book.sql`

## Logging / Auditoria
- Toda creación registra `public_code`, tipo y timestamp.
- No exponer PII sensible en logs de error.

## Performance esperada
- Listado admin liviano por orden de creación descendente.
- Alta de reclamo: respuesta inmediata con código de seguimiento.
