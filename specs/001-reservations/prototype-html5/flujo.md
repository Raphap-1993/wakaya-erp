# Flujo prototipo HTML5 — Wakaya ERP

> SEED nivel 2 — generado automáticamente como punto de partida.
> Antes de validar con stakeholders, regenera con `/prototype --mode html5` siguiendo
> el golden de tu dominio en `ejemplos/fase-2-ux-ui/prototype-html5-golden/`.

## Tarea principal recorrible (happy path)

```
Agenda de reservas
  └─ Filtrar por estado / prioridad
      └─ Click en fila
          └─ (panel de detalle — pendiente, regenerar para nivel 3)
```

## Pantallas y estados cubiertos

| Vista | Cómo se llega | Estados cubiertos |
|---|---|---|
| Agenda | URL inicial, sidebar "Agenda" | success, loading, empty, error |
| Mis registros | Sidebar | placeholder con toast |
| Archivo | Sidebar | placeholder con toast |
| Seguimiento | Sidebar | placeholder con toast |
| Auditoría | Sidebar | placeholder con toast |

## Estados UI

| Estado | Cómo se dispara |
|---|---|
| Loading | Carga inicial (700 ms) |
| Empty | Combinación de filtros sin coincidencias |
| Error | Doble-click en el avatar del topbar (disparador de demo) |
| Success | Toast verde tras exportar |

## Datos mock

8 registros con variedad de prioridades (alta/media/baja) y estados (pendiente / en revisión / aprobado / cerrado). Datos planos — al regenerar incluir tipos de dominio, fechas reales y descripciones específicas.

## Limitaciones del seed

- Sin panel de detalle.
- Sin diferencias por rol/perfil.
- Sin historial / auditoría reales.
- Sin transiciones de estado entre acciones.
- Sin modal de confirmación.

Estas piezas se completan al regenerar con el prompt ejecutable y el golden del dominio.
