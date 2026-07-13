# Wakaya Public Content, Media and Inventory Design

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Wakaya Home Content Management Design](2026-07-09-wakaya-home-content-management-design.md)
- Siguiente: [Wakaya Public Content, Media and Inventory Implementation Plan](../plans/2026-07-09-wakaya-public-content-media-inventory.md)
<!-- nav-guided:end -->

## Estado y alcance
Diseño aprobado para documentación y planificación. Incluye el centro de contenido, pipeline de media, experiencias, galería global, contenido de tipos de bungalow, unidades físicas, bloqueos, sugerencia de unidad y disponibilidad pública. No incluye page builder, DAM general, pricing dinámico ni channel manager nuevo.

La construcción se divide en `006-public-content-hub` y `007-bungalow-unit-inventory`. Ambas features visuales deben completar prototipo y validación humana antes de `gate-spdd-approved`.

## Problema
Contenido, imágenes y disponibilidad representan hoy conceptos distintos con modelos mezclados. El editor navega módulos separados y parte de la web sigue datos embebidos. Wakaya necesita operar una sola fuente editorial y 17 unidades reales sin convertir el ERP en un CMS o PMS genérico.

## Experiencia objetivo

### Backoffice de contenido
`/admin/content` abre una superficie list-first con cuatro tabs:
- `Home`: estructura y publicación del home existente;
- `Experiencias`: listado y CRUD bilingüe;
- `Galería`: colección global ordenada;
- `Bungalows`: ficha pública por tipo.

La cabecera muestra módulo, estado, última actualización y una sola acción principal. La ayuda extensa queda fuera de la superficie diaria.

### Gestor de media
El editor selecciona una imagen, completa el recorte obligatorio y ve las variantes antes de guardar. Un hero exige recorte desktop `16:9` y mobile `4:5`. El activo no puede publicarse hasta que ambos recortes sean válidos. El cliente usa `react-easy-crop`; el servidor conserva la autoridad sobre formato, tamaño, coordenadas y generación WebP.

### Experiencias públicas
Las cards de experiencias provienen del CRUD ES/EN. Abrir una card conserva la página y agrega `?experience=<slug>`. Cerrar el popup elimina solo ese parámetro y respeta los demás. Acceso directo, refresh, back/forward y cambio de idioma conservan el slug. El CTA lleva al formulario con `experience=<slug>` y un resumen precargado editable.

### Inventario
El admin ve primero tipos y disponibilidad agregada; al abrir un tipo ve sus unidades. El inventario inicial es:

| Tipo | Unidades |
|---|---|
| Familiar | `FAM-01` .. `FAM-05` |
| Matrimonial | `MAT-01` .. `MAT-04` |
| Individual | `IND-01` .. `IND-05` |
| Doble | `DOB-01`, `DOB-02` |
| Triple | `TRI-01` |

Una unidad puede activarse/desactivarse y recibir bloqueos manuales. El bloqueo captura intervalo `[check-in, checkout)`, motivo y nota. No se borra: se cancela con auditoría.

### Disponibilidad y asignación
El visitante elige tipo, fechas y huéspedes. Si hay disponibilidad completa, el servidor crea la solicitud y adjunta una unidad sugerida. Recepción puede cambiarla por otra unidad disponible antes de confirmar. Si el tipo está agotado, la API no crea una solicitud inválida y propone hasta tres alternativas ordenadas por capacidad suficiente, cercanía de capacidad y orden comercial.

El formulario persiste `requestedExperienceId` cuando el visitante llega desde una experiencia; el detalle operativo muestra esa referencia además de las notas editables. Si el rango está agotado, la respuesta pública ofrece hasta tres tipos alternativos y las tres primeras fechas posteriores disponibles para el mismo tipo y duración dentro de los siguientes 60 días.

## Arquitectura

```text
/admin/content ---> content services ---> PostgreSQL metadata
       |                  |                    |
       |                  +--> MediaStorage <--+--> WebP master/variants
       |
public ES/EN <--- published views

booking request ---> availability service ---> bungalow type + units
                           |                         |
                           +--> occupancy + manual blocks
```

- `src/lib/content/**`: tipos, schemas, store, vistas localizadas y media.
- `src/lib/inventory/**`: intervalos, disponibilidad, sugerencias, bloqueos y repositorio.
- `src/lib/reservations/**`: orquesta reservas y asignaciones; no vuelve a implementar disponibilidad.
- PostgreSQL es fuente operativa; fallback local no puede usarse para decidir disponibilidad productiva.
- `MediaStorage` usa el filesystem persistente configurado por `WAKAYA_MEDIA_STORAGE_PATH`; PostgreSQL y ese directorio participan del mismo plan de backup. Object storage queda fuera del incremento.

## Modelo de contenido
- `content_experience`: identidad, slug único, visibilidad, orden, copy ES/EN y referencias de media.
- `content_gallery`: agregado singleton `id='global'`, `version`, auditoría y relación con items.
- `content_gallery_item`: hijo del singleton, orden, activo, alt/caption ES/EN y activo de media.
- `media_asset`: maestro, checksum, dimensiones, storage key, estado y auditoría.
- `media_variant`: variante, dimensiones, calidad, crop normalizado, bytes y storage key.
- `bungalow_public_content`: se mantiene como ficha editorial por tipo, agrega `revision_version default 1` y migra de URLs a asset IDs.
- `home_content_revision`: conserva revisiones; el documento v2 referencia IDs de experiencias/tipos sin duplicarlos.
- `booking_request.requested_experience_id`: FK nullable a la experiencia que originó la solicitud; se expone en el detalle de backoffice.

`src/lib/home-content` se adapta al esquema v2. `/api/admin/home-content/media` y `/api/bungalows/[id]/media/**` delegan a `contentMediaService`; no optimizan ni almacenan por cuenta propia. `heroImageUrl` y `galleryUrls` quedan como fallback de lectura hasta el corte y se rechazan en mutaciones nuevas.

Tokens de concurrencia: `expectedVersion` de Home compara la última `home_content_revision.version`; Experiencias compara `content_experience.version`; Galería compara `content_gallery.version`; Bungalows compara `bungalow_public_content.revision_version`; Unidades compara `bungalow_unit.version`.

## Contrato de media
- entradas: JPEG, PNG o WebP; máximo 15 MB y 40 MP;
- maestro: WebP `nearLossless 95`, lado mayor `3200 px`, sin upscale;
- variantes: `heroDesktop 1920x1080 q88`, `heroMobile 1080x1350 q88`, `detail 1600x1200 q86`, `card 960x720 q86`, `thumb 480x360 q84`;
- crops: coordenadas normalizadas `x`, `y`, `width`, `height` entre `0` y `1`;
- se rechazan crop fuera de límites, source insuficiente, tipo falso o activo incompleto;
- una referencia publicada solo puede apuntar a un asset `ready`.

## Modelo de inventario
- `bungalow` continúa siendo el tipo.
- `bungalow_unit` representa la unidad física y tiene `version integer default 1`.
- `reservation.bungalow_id` conserva el tipo y agrega `bungalow_unit_id`.
- `reservation_occupancy` agrega `bungalow_unit_id`; cada fila representa una noche.
- `bungalow_unit_block` representa bloqueo manual por rango y conserva cancelación/auditoría.

`nights(checkIn, checkOut)` devuelve fechas `checkIn <= night < checkOut`. El mismo criterio se usa en UI, schema, SQL, pruebas y contratos.

Migration 010 elimina `reservation_occupancy_bungalow_id_date_key`, backfillea `bungalow_unit_id`, lo marca `NOT NULL` en ocupación y crea la unicidad nueva por unidad/noche. Dos reservas Doble simultáneas pueden ocupar dos unidades distintas; la tercera debe fallar o abrir conflicto sin escribir noches.

Asignación, bloqueo manual y OTA comparten `withUnitLock`: primero bloquean la fila de reserva/identidad OTA cuando existe, luego adquieren advisory locks por `unit_id` ordenado, revalidan ocupaciones/bloqueos y finalmente escriben. Nunca se toma una fila de reserva después del advisory lock. El índice único unidad/noche protege como última barrera.

## Errores y recuperación
- validación editorial: no publica y mantiene cambios locales;
- conflicto de versión: responde `409`, ofrece recarga y no mezcla payloads;
- fallo de media: no reemplaza la referencia vigente;
- conflicto de asignación: responde `409 unit_unavailable` y recalcula sugerencias;
- tipo agotado: responde `409 bungalow_type_unavailable` con alternativas;
- migración histórica imposible: aborta la transacción y genera reporte de conflictos.

La importación OTA mapeada a un tipo usa el mismo servicio transaccional de disponibilidad. Asigna una unidad libre para estados bloqueantes; si no existe, no ocupa noches y registra un único `availability_conflict`. Reintentos por identidad externa y checksum son idempotentes; una cancelación libera noches y resuelve el conflicto sin duplicar eventos.

## Seguridad
- lectura administrativa: sesión válida;
- mutación/publicación de contenido y media: `content:write`;
- inventario, bloqueo y asignación: `reservation:write` o `reservation:assign` según acción;
- toda mutación registra actor, timestamp y entidad;
- rutas públicas exponen solo contenido publicado y disponibilidad agregada.

## Entregas
1. Centro de contenido y media: dominio, migración, APIs y `/admin/content`; salida por `gate-spdd-approved` y `gate-4-6` de `006`.
2. Inventario físico: 17 unidades, bloqueos, migración histórica, sugerencia editable; salida por `gate-spdd-approved` y `gate-4-6` de `007`.
3. Integración pública, OTA y corte: popup/CTA, fechas/tipos alternativos, sync OTA y disponibilidad; salida por `gate-7-8`, con backup, roll-forward, e2e y monitoreo.

## Validación
- tests unitarios de schemas, crops, intervalos y ranking;
- tests de repositorio y transacciones PostgreSQL;
- tests de Route Handlers para RBAC, `409` y errores canónicos;
- tests UI de tabs, crop dual, popup URL-driven, bloqueos y cambio de sugerencia;
- Playwright ES/EN desktop/mobile;
- rehearsal de migración con copia de producción anonimizada;
- tests OTA de asignación, sold-out, reintento, idempotencia, cancelación y conflicto;
- smoke post-deploy de `/admin/content`, disponibilidad pública, healthcheck y filesystem configurado.

Tras activar nuevas escrituras, la recuperación prioriza modo mantenimiento y roll-forward. Un backup se usa en entorno separado para reconciliar o ante desastre; no se restaura ciegamente sobre datos nuevos.
