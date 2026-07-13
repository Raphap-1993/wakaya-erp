# Wakaya Bungalow Capacity Design

<!-- nav-guided:start -->
## Navegación guiada
- Anterior: [Wakaya Public Source Truth and Availability](2026-07-10-wakaya-public-source-truth-and-availability-design.md)
- Siguiente: [Wakaya Content Workbench and Capacity Simplification](2026-07-13-wakaya-content-workbench-capacity-simplification-design.md)
<!-- nav-guided:end -->

> **Enmienda aprobada 2026-07-13:** los bloqueos agregados quedan fuera del
> alcance operativo porque Wakaya no ha modelado la identidad del bungalow
> físico en mantenimiento. La fuente canónica de esta reducción es
> [Content Workbench and Capacity Simplification](2026-07-13-wakaya-content-workbench-capacity-simplification-design.md).
> Las secciones de bloqueos siguientes se conservan únicamente como historial
> de la decisión anterior y no describen el comportamiento vigente.

## Objetivo

Reemplazar el inventario por unidades y códigos por un control simple de cupos
físicos por categoría, sin perder la prevención de overbooking ni los bloqueos
temporales por fechas.

## Decisión aprobada

- Familiar: 5 unidades físicas.
- Matrimonial: 4 unidades físicas.
- Individual: 5 unidades físicas.
- Doble: 2 unidades físicas.
- Triple: 1 unidad física.
- Las unidades de una categoría son intercambiables para reservar.
- `bungalow.capacity` continúa significando capacidad de huéspedes.
- El nuevo total físico vive en `bungalow_capacity.total_units`.
- Solo el Administrador modifica totales y bloqueos.
- Una solicitud web pendiente no consume cupo; una reserva confirmada sí.
- Los bloqueos retiran una cantidad de cupos por categoría y rango.
- Una reducción incompatible con compromisos futuros se rechaza y explica.

La decisión sigue el patrón de configuración por tipo y número de unidades que
documentan Cloudbeds, Mews y Oracle OPERA. La identificación física individual
queda fuera porque Wakaya no opera housekeeping ni asignación por habitación en
este alcance.

## Experiencia administrativa

La ruta canónica será `/admin/bungalow-capacity`, con el rótulo `Cupos de
bungalows`. `/admin/inventory` redirigirá a la nueva pantalla.

La vista comienza con check-in y checkout. Para cada categoría muestra:

- total físico;
- fecha crítica del rango;
- reservas confirmadas en esa fecha;
- cupos bloqueados en esa fecha;
- disponibles para la estadía completa.

Cada fila ofrece solo `Editar total` y `Bloquear cupos`. La sección inferior
lista bloqueos activos y permite cancelarlos. No aparecen códigos, nombres de
unidad, orden, alta, archivo, reactivación ni sugerencias de unidad.

## Arquitectura

`bungalow_capacity` guarda el total versionado por categoría.
`bungalow_capacity_block` guarda cantidad, rango semiabierto, motivo y auditoría.
Reservas, OTA y disponibilidad pública consumen un único servicio de capacidad.

Por cada noche:

```text
disponible = total_units - reservas_confirmadas - bloqueos_activos
```

La disponibilidad del rango es el menor valor nocturno. Confirmaciones,
bloqueos y cambios de total se serializan con un advisory lock por categoría y
se revalidan dentro de la transacción.

## Migración

La migración 012 crea el modelo agregado, valida los totales `5/4/5/2/1` y
convierte cada bloqueo legado en un bloqueo de cantidad `1`. Las reservas
conservan `bungalow_id`; los identificadores de unidad quedan sin uso.

La retirada se ejecuta en dos etapas. La primera elimina el uso operativo pero
mantiene tablas antiguas para auditoría y rollback. La eliminación física será
una migración posterior, tras siete días estables y aprobación explícita.

## Gates

- Diseño textual: aprobado por el Product Owner el 2026-07-12.
- `gate-prototype-ready`: pendiente hasta validar el prototipo HTML5.
- `gate-spdd-approved`: pendiente de revisión humana del prototipo.
- `gate-4-6`: bloqueado hasta aprobación SPDD y ejecución TDD.
