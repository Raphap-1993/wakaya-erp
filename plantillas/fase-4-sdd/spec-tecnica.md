> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.

# Spec tecnica - <Titulo de la feature>

## Modelo de datos

Tabla `<entidad>`:

| Columna | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| <campo_1> | TEXT | <descripcion + restriccion> |
| <campo_2> | TIMESTAMP | NOT NULL, default CURRENT_TIMESTAMP |
| <campo_fk> | UUID | FK -> <tabla_relacionada>.id |
| estado | TEXT | enum: pendiente|activo|inactivo |
| created_at | TIMESTAMP | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL, actualizado en cada UPDATE |

Indices: `(estado, updated_at DESC)` para listados; `(<campo_fk>)` para joins.

Restricciones: PRIMARY KEY (id); UNIQUE (<campo_si_aplica>).

## Dependencias
- BD: <PostgreSQL/MySQL/SQLite>
- Auth: <Keycloak/Cognito/JWT propio>
- Otras tablas: <listar FKs>

## Estimacion de volumen
- Filas estimadas: <miles/millones>
- Crecimiento mensual: <tasa>
- Particion: <none / por mes / por tenant>

## Migraciones
- `flyway/V001__create_<entidad>.sql` (o equivalente del stack)

## Logging / Auditoria
- Toda mutacion registra: correlationId, actor, operacion, entidad_id, timestamp.
- PII enmascarado en logs segun `docs/transversal/90.16-privacidad-compliance.md`.

## Performance esperada
- Latencia p95 lecturas: <=200ms con dataset operativo.
- Latencia p95 escrituras: <=500ms.
- Throughput esperado: <N rps en horario pico>.
