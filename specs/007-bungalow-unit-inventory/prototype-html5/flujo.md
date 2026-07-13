# Flujo - Wakaya Bungalow Unit Inventory

[README principal](../../../README.md) | [Specs](../../README.md)

## Recorrido de disponibilidad
1. Recepción define check-in, checkout y huéspedes.
2. Revisa disponibilidad agregada de los cinco tipos.
3. Abre un tipo y consulta unidades y agenda del rango.
4. El sistema ordena unidades activas y libres por orden operativo.

## Recorrido de bloqueo
1. Recepción abre `Bloquear` desde una unidad.
2. Completa rango, motivo y nota.
3. El dialog anuncia `2 noches: 10 y 11 ago`.
4. Confirmar revalida, registra el bloqueo y devuelve foco a la fila.
5. Cancelar un bloqueo futuro conserva ambos eventos en auditoría.

## Recorrido de asignación
1. La reserva muestra tipo, rango, huéspedes y unidad sugerida.
2. Recepción acepta o elige otra unidad disponible.
3. Al cambiar, escribe la razón.
4. Confirmar revalida disponibilidad.
5. Ante carrera `409`, el formulario permanece y recibe una nueva sugerencia.

## Recorrido público y OTA
1. Un tipo agotado no crea booking request.
2. El visitante recibe hasta tres tipos y tres fechas alternativas, sin códigos internos.
3. Una OTA mapeada queda `Unidad asignada` o `Conflicto de disponibilidad OTA`.
4. Un reintento idempotente actualiza el mismo bloque sin duplicar reserva, noches o conflicto.

## Estados cubiertos
- loading, sin rango y vacío;
- disponible, agotado e inactiva;
- bloqueo solapado, error `409` y servicio `503`;
- éxito, cancelación auditada y acceso denegado.
