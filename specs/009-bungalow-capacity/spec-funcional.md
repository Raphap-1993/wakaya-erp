---
complexity: simple
---

# Spec funcional - Wakaya Bungalow Capacity

## Objetivo

Controlar cantidades físicas vendibles por categoría y fecha sin administrar
identidades individuales.

## Actores

- Administrador: consulta y modifica totales.
- Operación: consume disponibilidad derivada en reservas.
- Visitante: consulta disponibilidad pública agregada.
- Auditor: revisa cambios de total y el legado histórico.

## Requerimientos funcionales

| ID | Requerimiento | Resultado esperado |
|---|---|---|
| RF-009-01 | Consultar cupos por rango | Cinco categorías con noche crítica y disponibles |
| RF-009-02 | Editar total físico | Guarda con versión y auditoría |
| RF-009-05 | Descontar reservas confirmadas | Pendientes no consumen; confirmadas sí |
| RF-009-06 | Rechazar reducción incompatible | Devuelve mínimo y fechas conflictivas |
| RF-009-07 | Evitar carreras | Confirmaciones y cambios de total revalidan bajo lock |
| RF-009-08 | Proteger administración | Solo Administrador usa el módulo |
| RF-009-09 | Preservar contrato público | No expone totales, bloqueos ni identificadores internos |
| RF-009-10 | Preservar legado | Conserva 17 unidades y registros históricos sin efecto operativo |

## Reglas

- Los totales iniciales son Familiar 5, Matrimonial 4, Individual 5, Doble 2 y Triple 1.
- `bungalow.capacity` sigue representando huéspedes.
- El rango válido cumple `checkIn < checkOut` y checkout es exclusivo.
- La disponibilidad completa es el mínimo nocturno del rango.
- La fecha crítica es la primera noche que alcanza ese mínimo.
- Solo estados bloqueantes confirmados consumen cupo.
- Ninguna mutación puede producir disponibilidad negativa.
- Los bloqueos históricos no participan en el cálculo ni se exponen en UI/API.

## No alcance

Housekeeping, asignación de bungalow exacto, mantenimiento por unidad, códigos
físicos, tarifas por unidad, overbooking permitido y eliminación inmediata del legado.
