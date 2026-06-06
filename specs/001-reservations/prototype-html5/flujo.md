# Flujo prototipo HTML5 — Wakaya ERP

## Tarea principal recorrible (happy path)

```text
Agenda operativa del día
  └─ Filtro "Sin bungalow"
      └─ Selección de reserva con llegada hoy
          └─ Revisión de detalle lateral
              └─ Asignar bungalow
                  └─ Confirmar acción
                      └─ Ver auditoría actualizada
```

## Pantallas y estados cubiertos

| Vista | Cómo se llega | Estados cubiertos |
|---|---|---|
| Agenda operativa | URL inicial | success, loading, empty, error |
| Detalle lateral | click en una reserva | success, blocked |
| Confirmación de asignación | CTA principal del detalle | success, blocked |
| Auditoría embebida | bloque inferior del detalle | success |

## Estados UI

| Estado | Cómo se dispara |
|---|---|
| Loading | carga inicial de agenda |
| Empty | filtros sin coincidencias |
| Error | acción de demo para fallo de agenda |
| Success | asignación o cambio operativo confirmado |
| Blocked | conflicto de bungalow o regla operativa |

## Datos mock

12 reservas con mezcla de llegadas hoy, salidas hoy, reservas sin bungalow, huéspedes VIP, pagos pendientes y conflictos operativos.
