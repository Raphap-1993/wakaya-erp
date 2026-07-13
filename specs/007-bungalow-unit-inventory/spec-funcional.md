# Spec funcional - Wakaya Bungalow Unit Inventory

[Specs](../README.md) | [Feature](README.md)

## Objetivo
Administrar unidades reales y evitar sobreasignaciones, manteniendo la ficha pública en el tipo comercial.

## Actores
- Recepción: consulta disponibilidad y cambia unidad sugerida.
- Administrador: mantiene unidades y bloqueos.
- Visitante: consulta tipo y fechas; nunca elige número de unidad.
- Auditor: revisa asignaciones, bloqueos y cancelaciones.

## Requerimientos funcionales

| ID | Requerimiento | Resultado esperado |
|---|---|---|
| RF-007-01 | Ver tipos y unidades | Cinco tipos, 17 unidades y estado operativo |
| RF-007-02 | Crear/editar/desactivar unidad | Código único, tipo, orden y estado auditados |
| RF-007-03 | Registrar bloqueo manual | Unidad, `[check-in, checkout)`, motivo y nota |
| RF-007-04 | Cancelar bloqueo | Libera noches futuras y conserva auditoría |
| RF-007-05 | Calcular noches | Checkout no bloquea la noche de salida |
| RF-007-06 | Sugerir unidad | Primera unidad disponible por orden operativo |
| RF-007-07 | Cambiar sugerencia | Recepción selecciona otra unidad aún disponible |
| RF-007-08 | Confirmar asignación | Transacción rechaza carrera o solape |
| RF-007-09 | Bloquear solicitud pública agotada | No crea solicitud imposible |
| RF-007-10 | Sugerir alternativas | Hasta tres tipos con capacidad y rango completos |
| RF-007-11 | Migrar reservas actuales | Backfill determinista o aborto con reporte |
| RF-007-12 | Auditar mutaciones | Actor, timestamp, entidad, antes/después y motivo |
| RF-007-13 | Sugerir fechas alternativas | Hasta tres check-ins posteriores dentro de 60 días para el mismo tipo y duración |
| RF-007-14 | Integrar reservas OTA | Sync/import asigna unidad o registra conflicto idempotente sin pisar noches |

## Reglas
- Intervalo válido: `checkIn < checkOut`.
- Noches: `checkIn <= night < checkOut`.
- Checkout y check-in el mismo día son compatibles.
- Una unidad inactiva no se sugiere ni acepta nuevas asignaciones.
- Un bloqueo activo y una ocupación confirmada son indisponibilidad equivalente.
- Una solicitud pública pide tipo; `suggestedUnitId` es interno y editable.
- Ranking de unidad: `active`, sin conflicto, `sortOrder`, `code`.
- Alternativas: capacidad suficiente, disponibilidad completa, menor exceso de capacidad, orden comercial; máximo tres.
- Fechas alternativas: mismo tipo y duración, hasta tres check-ins disponibles estrictamente posteriores al solicitado y no más allá de `checkIn + 60 días`.
- Confirmar usa transacción y revalida disponibilidad.
- OTA mapeada a tipo usa la misma asignación transaccional. Un evento repetido no duplica reserva, ocupación, auditoría ni conflicto.
- OTA sold-out conserva la reserva/vínculo externo, deja la unidad sin asignar, no escribe noches y crea o actualiza un solo `availability_conflict` abierto.
- Cancelación OTA libera ocupación y resuelve conflictos de forma idempotente.

## Criterios de aceptación
- Inventario seed exacto: 5 familiares, 4 matrimoniales, 5 individuales, 2 dobles y 1 triple.
- Reserva `2026-08-10` a `2026-08-12` ocupa noches 10 y 11, no 12.
- Bloqueo manual impide sugerir esa unidad.
- Tipo agotado responde `409` con alternativas y no persiste booking request.
- La respuesta agotada incluye hasta tres tipos y hasta tres fechas alternativas dentro de 60 días.
- Recepción puede cambiar la sugerencia antes de confirmar.
- Dos confirmaciones concurrentes no asignan la misma unidad/noche.
- Dos reservas Doble simultáneas para el mismo rango ocupan dos unidades distintas; la tercera falla con conflicto y cero noches escritas.
- Reintentar el mismo evento OTA produce la misma reserva y como máximo un conflicto; si aparece disponibilidad, asigna y resuelve el conflicto.

## No alcance
Housekeeping, mantenimiento preventivo, tarifas por unidad, overbooking permitido y asignación automática definitiva sin revisión.
