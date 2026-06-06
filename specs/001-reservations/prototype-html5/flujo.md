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
| Agenda operativa | URL inicial | exito, carga, vacio, error |
| Detalle lateral | click en una reserva | exito, bloqueo |
| Confirmación de asignación | CTA principal del detalle | exito, bloqueo |
| Auditoría embebida | bloque inferior del detalle | exito |

## Estados UI

| Estado | Cómo se dispara |
|---|---|
| Carga | carga inicial de agenda |
| Vacio | filtros sin coincidencias |
| Error | acción de demo para fallo de agenda |
| Exito | asignación o reasignación confirmada |
| Bloqueo | conflicto de bungalow o regla operativa |

## Datos mock

12 reservas con mezcla de llegadas hoy, salidas hoy, reservas sin bungalow, huéspedes VIP, pagos pendientes y conflictos operativos.
