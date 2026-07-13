# API Contract - Wakaya Bungalow Unit Inventory

[Specs](../README.md) | [Feature](README.md)

## GET /api/admin/inventory/bungalow-types

### Response 200
```json
{
  "items": [
    { "id": "bungalow-family", "name": "Familiar", "capacity": 4, "unitCount": 5, "activeUnitCount": 5, "availableUnitCount": 3 },
    { "id": "bungalow-matrimonial", "name": "Matrimonial", "capacity": 2, "unitCount": 4, "activeUnitCount": 4, "availableUnitCount": 4 },
    { "id": "bungalow-individual", "name": "Individual", "capacity": 1, "unitCount": 5, "activeUnitCount": 5, "availableUnitCount": 5 },
    { "id": "bungalow-double", "name": "Doble", "capacity": 2, "unitCount": 2, "activeUnitCount": 2, "availableUnitCount": 2 },
    { "id": "bungalow-triple", "name": "Triple", "capacity": 3, "unitCount": 1, "activeUnitCount": 1, "availableUnitCount": 1 }
  ]
}
```

## GET|POST /api/admin/inventory/units
GET filtra por `bungalowTypeId`, `active`, `availableFrom`, `availableTo`.

### POST request
```json
{ "bungalowTypeId": "bungalow-individual", "code": "IND-05", "name": "Individual 05", "active": true, "sortOrder": 5, "notes": "Ala laguna" }
```

### Response 201
```json
{ "unit": { "id": "unit_ind_05", "code": "IND-05", "version": 1 } }
```

## GET|PUT /api/admin/inventory/units/{unitId}
PUT requiere `expectedVersion`, comparado con `bungalow_unit.version`; éxito incrementa y devuelve esa columna. Desactivar no borra ocupaciones ni bloqueos.

## GET|POST /api/admin/inventory/blocks

### POST request
```json
{ "unitId": "unit_dob_03", "checkIn": "2026-08-10", "checkout": "2026-08-12", "reasonCode": "maintenance", "notes": "Revisión de aire acondicionado" }
```

### Response 201
```json
{
  "block": {
    "id": "block_01",
    "unitId": "unit_dob_03",
    "checkIn": "2026-08-10",
    "checkout": "2026-08-12",
    "blockedNights": ["2026-08-10", "2026-08-11"],
    "status": "active"
  }
}
```

## POST /api/admin/inventory/blocks/{blockId}/cancel
```json
{ "reason": "Mantenimiento completado antes de fecha" }
```
Conserva el registro y auditoría.

## POST /api/admin/inventory/availability

### Request
```json
{ "bungalowTypeId": "bungalow-double", "checkIn": "2026-08-10", "checkout": "2026-08-12", "guests": 2 }
```

### Response 200 admin
```json
{
  "available": true,
  "availableUnitCount": 2,
  "suggestedUnitId": "unit_dob_02",
  "units": [
    { "id": "unit_dob_02", "code": "DOB-02", "available": true },
    { "id": "unit_dob_01", "code": "DOB-01", "available": true }
  ]
}
```

## POST /api/public/availability
Mismo input. Nunca expone IDs/códigos físicos.

### Response 200 disponible
```json
{ "available": true, "bungalowTypeId": "bungalow-double", "availableUnitCount": 2, "alternatives": [] }
```

### Response 200 agotado
```json
{
  "available": false,
  "bungalowTypeId": "bungalow-double",
  "availableUnitCount": 0,
  "alternatives": [
    { "bungalowTypeId": "bungalow-triple", "displayName": "Triple", "capacity": 3, "availableUnitCount": 1 }
  ],
  "alternativeDates": [
    { "checkIn": "2026-08-13", "checkout": "2026-08-15", "availableUnitCount": 1 },
    { "checkIn": "2026-08-18", "checkout": "2026-08-20", "availableUnitCount": 2 }
  ]
}
```

`alternatives` contiene hasta tres tipos. `alternativeDates` contiene hasta tres rangos del mismo tipo y duración, con check-in estrictamente posterior al solicitado y dentro de los siguientes 60 días. Ninguna lista expone unidades.

## POST /api/public/booking-requests
Extiende el request actual con tipo/fechas. La respuesta exitosa puede incluir `inventorySuggestionToken` opaco para operación interna; nunca incluye código de unidad.

### Response 409 agotado
```json
{
  "error": "bungalow_type_unavailable",
  "message": "No hay unidades disponibles para todo el rango.",
  "alternatives": [
    { "bungalowTypeId": "bungalow-triple", "displayName": "Triple", "capacity": 3, "availableUnitCount": 1 }
  ],
  "alternativeDates": [
    { "checkIn": "2026-08-13", "checkout": "2026-08-15", "availableUnitCount": 1 }
  ]
}
```
No persiste booking request.

## POST /api/reservations/{reservationId}/assign

### Request
```json
{ "bungalowTypeId": "bungalow-double", "unitId": "unit_dob_04", "reason": "Recepción eligió unidad cercana a piscina" }
```

Omitir `unitId` acepta la sugerencia recalculada por servidor. La transacción revalida.

### Response 409
```json
{ "error": "unit_unavailable", "message": "La unidad dejó de estar disponible.", "suggestedUnitId": "unit_dob_02" }
```

## OTA import/sync - extensión de inventario
Los contratos existentes de sync/import conservan la identidad `(providerKey, externalReservationId)`. Para una reserva mapeada a tipo y con estado bloqueante, la respuesta incluye:
```json
{
  "reservationId": "reservation_ota_01",
  "bungalowTypeId": "bungalow-double",
  "bungalowUnitId": "unit_dob_02",
  "inventoryStatus": "assigned",
  "availabilityConflictId": null,
  "idempotentReplay": false
}
```

Sold-out no pisa ocupaciones existentes:
```json
{
  "reservationId": "reservation_ota_01",
  "bungalowTypeId": "bungalow-double",
  "bungalowUnitId": null,
  "inventoryStatus": "conflict",
  "availabilityConflictId": "conflict_ota_01",
  "idempotentReplay": false
}
```

Repetir el mismo evento/checksum devuelve los mismos IDs con `idempotentReplay: true`, sin duplicar noches o conflicto. Un reintento posterior puede pasar de `conflict` a `assigned` y resolver el conflicto. Cancelar libera noches y retorna `inventoryStatus: "released"` de forma idempotente.

## Errores HTTP
- `400 invalid_stay_range` o payload inválido;
- `401/403` autenticación/autorización;
- `404` tipo/unidad/bloque;
- `409` conflicto de unidad/bloque/tipo;
- `503 availability_unavailable` cuando PostgreSQL no puede decidir de forma segura.
