# ADR-013 - Cupos agregados de bungalows

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-012 - Centro de contenido, media e inventario por unidades](ADR-012-centro-contenido-media-inventario-unidades.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->

## Estado

Aprobado el 2026-07-12 para construcción local. Enmendado el 2026-07-13 para
retirar los bloqueos de la operación y del cálculo. Producción requiere la
aprobación posterior de la demostración integrada.

## Contexto

El inventario individual definido en ADR-012 introdujo códigos, nombres,
orden, archivo y asignación física sin que Wakaya opere housekeeping ni
necesite identificar una unidad concreta. Esa precisión accidental hace más
difícil configurar los cupos reales por categoría y entender la
disponibilidad.

## Decisión

- `bungalow` continúa representando la categoría comercial y su campo
  `capacity` continúa representando huéspedes.
- `bungalow_capacity` almacena únicamente el total físico vendible por
  categoría, con versión y auditoría.
- `bungalow_capacity_block` permanece como tabla histórica de auditoría y
  rollback, sin lectura ni mutación desde la aplicación.
- La disponibilidad es el mínimo nocturno de
  `total_units - reservas confirmadas`.
- Las solicitudes `pending_review` no consumen cupo. Consumen cupo
  `ota_imported_confirmed`, `confirmed`, `assigned`, `checked_in`,
  `checked_out` y `paid`.
- Toda mutación que pueda comprometer capacidad usa un lock transaccional por
  `bungalow_id` y vuelve a leer los compromisos antes de escribir.
- Reservas, solicitudes web, OTA y administración consumen el mismo cálculo
  agregado. Ninguna interfaz nueva acepta o devuelve `unitId`.
- Las tablas y referencias individuales quedan como legado de solo auditoría
  durante siete días estables; su eliminación física será una segunda etapa
  con aprobación explícita.

## Consecuencias

La operación administra cinco números comprensibles y no ofrece bloqueos por
cantidad mientras Wakaya no defina la identificación de la unidad física que
sale de servicio. Se pierde deliberadamente la asignación de una unidad exacta,
que no forma parte del proceso actual. Las reservas históricas conservan sus
referencias legadas, pero estas dejan de participar en disponibilidad y nuevas
escrituras.

## Migración y rollback

La migración 012 valida los conteos legados `5/4/5/2/1`, crea los cinco
agregados y copia cada bloqueo individual como cantidad `1`. Antes de nuevas
mutaciones se puede volver al binario anterior. Después de cambios reales de
cupos o bloqueos se prioriza roll-forward para no perder auditoría.

## Referencias

- [Spec 009 - Bungalow Capacity](../../../specs/009-bungalow-capacity/README.md)
- [Diseño aprobado](../../superpowers/specs/2026-07-12-wakaya-bungalow-capacity-design.md)
