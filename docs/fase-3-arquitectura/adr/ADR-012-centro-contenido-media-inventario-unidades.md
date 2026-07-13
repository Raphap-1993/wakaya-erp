# ADR-012 - Centro de contenido, media e inventario por unidades

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-011 - Stack Next.js, PostgreSQL, Prisma y PM2](ADR-011-stack-nextjs-postgresql-prisma-pm2-vps-aislado.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->

## Estado
Aprobado para planificación. La construcción visual sigue condicionada por `gate-spdd-approved` de cada feature.

## Contexto
Wakaya ya administra el home y la ficha pública de bungalows, pero el contenido está distribuido entre `/admin/home`, `/admin/bungalows`, datos embebidos y URLs de imágenes. El modelo `bungalow` representa un tipo comercial y el inventario físico se administra por unidad. La fuente de verdad aprobada es: 5 familiares, 4 matrimoniales, 5 individuales, 2 dobles y 1 triple.

El siguiente incremento debe resolver contenido público, media e inventario sin introducir un CMS externo ni separar el monolito Next.js.

## Decisión

### 1. Dos módulos dentro del monolito
- `content`: home, experiencias, galería global, ficha pública de tipos de bungalow y activos de media.
- `inventory`: unidades físicas, bloqueos manuales, asignación, ocupación y disponibilidad.

El módulo `reservations` consume `inventory`; el sitio público consume vistas publicadas de `content` y consultas agregadas de disponibilidad. No se crean microservicios.

### 2. Entrada administrativa única
El backoffice tendrá una sola entrada `/admin/content` con navegación interna `Home`, `Experiencias`, `Galería` y `Bungalows`. Las rutas anteriores pueden redirigir durante la transición, pero no conservan fuentes de verdad paralelas.

### 3. Media persistida y derivada
Cada imagen se guarda como un activo trazable:
- maestro WebP con `nearLossless: true`, calidad `95` y lado mayor máximo de `3200 px`;
- metadatos y referencias en PostgreSQL;
- binarios mediante `MediaStorage` sobre el filesystem persistente actual, configurado con `WAKAYA_MEDIA_STORAGE_PATH` y cubierto por backups operativos;
- derivados WebP por uso, con calidad entre `84` y `88`;
- metadata sensible removida.

`MediaStorage` permanece como interfaz para aislar persistencia y pruebas. Un adapter de object storage queda fuera de este alcance y solo podrá evaluarse mediante una decisión futura.

El recorte es obligatorio y se realiza en cliente con `react-easy-crop`; el servidor valida rectángulos normalizados y genera las variantes con `sharp`. Los heroes requieren dos recortes independientes: desktop `16:9` y mobile `4:5`.

### 4. Contenido estructurado
- Experiencias: CRUD, orden, visibilidad y copy ES/EN; el sitio público abre detalle mediante `?experience=<slug>` y su CTA dirige a `/{locale}/contact?experience=<slug>#booking-request`.
- Galería: agregado singleton `content_gallery` con `version` persistida e items hijos ordenados; no existen álbums en este alcance.
- Bungalows: el contenido editorial continúa asociado al tipo comercial, no a cada unidad física.
- Home: `src/lib/home-content` migra a documento v2 y mantiene publicación atómica/revisiones, consumiendo IDs de experiencias, galería y tipos en lugar de duplicar contenido.

Las rutas legadas de media no conservan pipelines propios: `/api/admin/home-content/media` y `/api/bungalows/[id]/media/**` delegan al servicio común de `content`. Las mutaciones dejan de aceptar `heroImageUrl` y `galleryUrls`; esas columnas quedan temporalmente como fallback de solo lectura.

La concurrencia editorial usa tokens persistentes: `content_experience.version`, `content_gallery.version`, `bungalow_public_content.revision_version` y la última `home_content_revision.version`. Cada `expectedVersion` se compara e incrementa contra su columna exacta dentro de la transacción.

### 5. Tipo y unidad física
La tabla existente `bungalow` se conserva como tipo comercial. Se agrega `bungalow_unit`, con códigos únicos:
- `FAM-01` a `FAM-05`;
- `MAT-01` a `MAT-04`;
- `IND-01` a `IND-05`;
- `DOB-01` y `DOB-02`;
- `TRI-01`.

Reservas y ocupaciones obtienen `bungalow_unit_id`; `bungalow_id` se conserva como tipo. La migración histórica asigna unidades de forma determinista y falla de manera atómica si detecta una sobreventa que requiere resolución humana.

La migración 010 elimina explícitamente `reservation_occupancy_bungalow_id_date_key`, rellena `bungalow_unit_id`, lo vuelve obligatorio para filas de ocupación y crea unicidad por `(bungalow_unit_id, date)`. `bungalow_id` queda como referencia al tipo y no conserva unicidad temporal. `bungalow_unit.version integer not null default 1` es el token de edición de la unidad.

### 6. Semántica temporal
Toda estadía y bloqueo usa el intervalo semiabierto `[check-in, checkout)`. Se bloquean las noches desde check-in inclusive hasta checkout exclusivo. Un checkout y un nuevo check-in en la misma fecha no se solapan.

Los bloqueos manuales se registran por unidad, intervalo, motivo, usuario y estado. Cancelar un bloqueo conserva auditoría.

### 7. Selección y alternativas
El público solicita un tipo, no una unidad. El servidor:
1. calcula unidades disponibles para el rango;
2. sugiere la primera por orden operativo;
3. permite que recepción cambie la sugerencia antes de confirmar;
4. bloquea la solicitud cuando el tipo está agotado;
5. devuelve hasta tres tipos alternativos con capacidad suficiente y disponibilidad completa.

La asignación final se confirma dentro de una transacción. La UI nunca decide disponibilidad por sí sola.

Asignación directa, bloqueo manual y OTA usan el mismo helper de exclusión por unidad. Dentro de la transacción adquieren `pg_advisory_xact_lock(hashtext(unit_id))` antes de revalidar o insertar. Si intervienen varias unidades, se bloquean por `unit_id` ascendente; si existe una reserva/identidad OTA, su fila se bloquea primero y nunca después del advisory lock. La unicidad `(bungalow_unit_id, date)` es la defensa final ante cualquier camino que eluda el helper.

### 8. Integración OTA
El mapeo OTA existente continúa resolviendo `external_room_type_code` a `bungalow_id` como tipo comercial. Al importar o sincronizar una reserva OTA bloqueante, el servidor sugiere y asigna una unidad libre dentro de la misma transacción. Si el tipo está agotado, importa o actualiza el vínculo OTA sin escribir noches sobre otra unidad y registra un `availability_conflict` abierto.

Reintentos con el mismo proveedor, reserva externa, versión/checksum y fechas son idempotentes: no duplican reserva, ocupación, auditoría ni conflicto. Si un reintento posterior encuentra unidad, asigna las noches y resuelve el conflicto. Una actualización de fechas o tipo solo reemplaza la ocupación anterior después de asegurar la nueva; si falla, revierte la mutación de ocupación y conserva evidencia del conflicto. Una cancelación OTA libera noches y cierra conflictos de forma idempotente.

## Entregas y gates

| Entrega | Alcance | Gate de salida |
|---|---|---|
| E1 - Centro de contenido y media | `/admin/content`, media, Home, Experiencias, Galería y Bungalows | `gate-spdd-approved` de `006` antes de UI productiva; `gate-4-6` con contratos, TDD y QA |
| E2 - Inventario por unidades | modelo tipo/unidad, 17 unidades, bloqueos y asignación editable | `gate-spdd-approved` de `007`; migración ensayada y `gate-4-6` sin solapes |
| E3 - Integración pública y corte | popup de experiencias, CTA, disponibilidad, OTA y alternativas | `gate-7-8` con e2e, backup, roll-forward, healthcheck y monitoreo |

## Consecuencias

### Positivas
- una superficie editorial coherente;
- imágenes consistentes y optimizadas;
- inventario real sin duplicar fichas públicas;
- disponibilidad correcta y auditable;
- migración incremental sobre el monolito actual.

### Costos y riesgos
- migración delicada de ocupaciones históricas;
- más estados de media y recorte que una URL manual;
- necesidad de storage persistente en producción;
- compatibilidad temporal con `bungalow_public_content`, URLs legadas y rutas admin previas.

## Alternativas descartadas
- CMS headless: aumenta operación y duplica permisos/publicación.
- una ficha pública por unidad: repite copy y confunde tipo comercial con habitación física.
- guardar binarios en PostgreSQL: encarece backup y serving.
- disponibilidad solo por conteo: no soporta bloqueos ni asignación auditable.
- rangos inclusivos: impiden rotación checkout/check-in el mismo día.

## Rollback y recuperación
- conservar columnas y lectores legados durante una versión de transición;
- no eliminar `hero_image_url`, `gallery_urls` ni `bungalow_id` en la primera migración;
- antes de activar escrituras nuevas, un fallo permite volver al release anterior sobre el backup verificado;
- después de aceptar nuevas reservas, bloqueos, media u OTA, no se permite restaurar ciegamente la base ni arrancar un binario que desconozca esos datos;
- ante fallo post-activación, entrar en mantenimiento para mutaciones afectadas, conservar las lecturas seguras y ejecutar roll-forward con release/migración correctiva;
- el backup se restaura en una base separada para reconciliación selectiva o como recuperación ante desastre bajo RPO/RTO explícitos; el filesystem de `WAKAYA_MEDIA_STORAGE_PATH` se respalda y reconcilia junto con PostgreSQL.

## Referencias
- [Spec 006 - Public Content Hub](../../../specs/006-public-content-hub/README.md)
- [Spec 007 - Bungalow Unit Inventory](../../../specs/007-bungalow-unit-inventory/README.md)
- [Diseño integrado](../../superpowers/specs/2026-07-09-wakaya-public-content-media-inventory-design.md)
