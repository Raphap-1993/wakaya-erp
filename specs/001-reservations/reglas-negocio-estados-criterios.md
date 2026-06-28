# Reglas de negocio, estados y criterios de aceptacion - Wakaya Reservations

[README principal](../../README.md) | [Specs](../README.md)

## Proposito

Definir la verdad canonica del dominio `reservations` para Wakaya:

- como entran las reservas
- como se bloquea la disponibilidad
- como cambia el estado de una reserva
- quien puede hacer cada accion
- que criterios de aceptacion deben cumplirse antes de construir

## Principio rector

La disponibilidad y el estado de negocio no son lo mismo.

- El **estado de negocio** describe en que etapa esta la reserva.
- El **bloqueo de inventario** describe si un bungalow ya esta comprometido para una fecha.

Si se mezcla esto, el sistema puede sobre-vender aunque la UI parezca correcta.

## Fuentes de entrada

### 1. Reserva desde la web de Wakaya

- Entra desde la superficie publica.
- Se crea como `pending_review`.
- Bloquea disponibilidad de forma provisional desde el primer commit.
- Requiere revision interna antes de quedar lista para operacion final.
- El pago se registra por transferencia y no en la misma accion de reserva.

### 2. Reserva desde OTA

- Entra por integracion externa.
- Se crea como `ota_imported_confirmed`.
- Bloquea disponibilidad de forma inmediata.
- El sistema Wakaya sigue siendo la autoridad final para el estado interno.
- La OTA no escribe estados de negocio por fuera del sistema.

## Modelo de estados de negocio

### Estados para reservas de la web

| Estado | Significado | Quien puede moverlo |
|---|---|---|
| `pending_review` | Reserva creada desde la web y pendiente de revision interna | Sistema / Recepcion |
| `confirmed` | Reserva aceptada por Wakaya y lista para operacion | Recepcion / Administracion |
| `assigned` | Se asigno bungalow concreto | Recepcion |
| `checked_in` | El huesped ya ingreso | Recepcion |
| `checked_out` | La estadia termino | Recepcion |
| `paid` | El pago fue registrado al checkout | Recepcion / Administracion |
| `cancelled` | La reserva fue anulada | Recepcion / Administracion |
| `no_show` | El huesped no se presento | Recepcion |

### Estados para reservas desde OTA

| Estado | Significado | Quien puede moverlo |
|---|---|---|
| `ota_imported_confirmed` | Reserva importada desde OTA y aceptada por el sistema | Sistema |
| `assigned` | Se asigno bungalow concreto | Recepcion |
| `checked_in` | El huesped ya ingreso | Recepcion |
| `checked_out` | La estadia termino | Recepcion |
| `paid` | El pago fue registrado al checkout | Recepcion / Administracion |
| `cancelled` | La reserva fue anulada | Recepcion / Administracion |
| `no_show` | El huesped no se presento | Recepcion |

### Estados operativos opcionales

- `needs_assignment`
- `needs_attention`
- `on_hold`

## Modelo de disponibilidad

La disponibilidad se controla con un **ledger de ocupacion por bungalow y fecha**.

Reglas:

1. Cada bungalow tiene ocupacion por noche.
2. Antes de aceptar una reserva, el sistema valida solape de noches.
3. Si existe conflicto, la reserva no puede confirmar inventario.
4. La operacion de creacion debe ser atomica.
5. Toda reserva que entra, sea web u OTA, debe generar un bloqueo de inventario.

## Regla de no solape

Una misma combinacion de:

- `bungalow_id`
- `date`

solo puede existir una vez en el ledger de ocupacion.

Esto evita doble reserva aun si dos solicitudes llegan al mismo tiempo.

## Flujo canonico por canal

### Web de Wakaya

```text
entrada web
  -> pending_review
  -> bloqueo provisional de noches
  -> revision interna
  -> confirmed
  -> assigned
  -> checked_in
  -> checked_out
  -> paid
```

### OTA

```text
entrada OTA
  -> ota_imported_confirmed
  -> bloqueo inmediato de noches
  -> assigned
  -> checked_in
  -> checked_out
  -> paid
```

## Reglas de negocio canonicas

| ID | Regla | Resultado esperado |
|---|---|---|
| RN-01 | Toda reserva bloquea disponibilidad desde que entra al sistema | No existe sobreventa por canal |
| RN-02 | Web y OTA comparten la misma fuente de verdad de disponibilidad | No hay inventario paralelo |
| RN-03 | La OTA no confirma estados de negocio por fuera de Wakaya | Wakaya conserva autoridad |
| RN-04 | Las reservas de la web entran como `pending_review` | La operacion puede revisar antes de confirmar |
| RN-05 | Las reservas OTA entran como `ota_imported_confirmed` | La importacion se reconoce de inmediato |
| RN-06 | El bungalow se asigna por Recepcion | El monitoreo interno mantiene control operacional |
| RN-07 | El pago se registra al checkout | La reserva no exige pago previo para existir |
| RN-08 | Toda transicion deja auditoria | Se puede reconstruir quien hizo que y cuando |
| RN-09 | No se permite doble ocupacion por noche | La BD impide solape |
| RN-10 | Si una reserva expira o se cancela, su bloqueo se libera | La disponibilidad se recupera correctamente |

## Criterios de aceptacion

- Una reserva creada desde la web entra como `pending_review`.
- Una reserva importada desde OTA entra como `ota_imported_confirmed`.
- El sistema bloquea noches desde el primer commit de la reserva.
- No se pueden crear dos reservas para el mismo bungalow en la misma noche.
- Recepcion puede asignar bungalow sobre reservas validas.
- El checkout permite registrar el pago final.
- Toda transicion de estado deja actor, fecha, estado anterior, estado nuevo y motivo.
- La UI y la API muestran la misma verdad de disponibilidad.
- Si existe conflicto de inventario, la reserva no se confirma y el caso queda trazado.

## Notas de implementacion

- La disponibilidad debe resolverse en una sola transaccion.
- La asignacion de bungalow debe ser una accion explicita de Recepcion.
- El mini monitor debe priorizar listas, detalle, filtros, asignacion y seguimiento.
- La logica de negocio debe vivir en backend, no solo en la UI.

## Trazabilidad

- Vision: [00.01-vision-proyecto.md](../../docs/fase-0-iniciacion/00.01-vision-proyecto.md)
- Requerimientos: [01.00-analisis-requerimientos.md](../../docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md)
- Arquitectura: [03.00-arquitectura.md](../../docs/fase-3-arquitectura/03.00-arquitectura.md)
- Spec funcional: [spec-funcional.md](spec-funcional.md)
- Spec tecnica: [spec-tecnica.md](spec-tecnica.md)
- SPDD frontend: [spdd-frontend.md](spdd-frontend.md)
- Prototype validation: [prototype-validation.md](prototype-validation.md)
