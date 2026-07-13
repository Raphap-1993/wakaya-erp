# API Contract - Wakaya Bungalow Capacity

## GET `/api/admin/bungalow-capacity`

Query: `checkIn`, `checkOut`.

```json
{
  "items": [
    {
      "bungalowTypeId": "bungalow-family",
      "displayName": "Bungalow Familiar",
      "totalUnits": 5,
      "availableUnitsForStay": 3,
      "criticalDate": "2026-08-10",
      "confirmedOnCriticalDate": 1,
      "version": 1
    }
  ]
}
```

## PUT `/api/admin/bungalow-capacity/{bungalowTypeId}`

```json
{ "totalUnits": 4, "expectedVersion": 1 }
```

Conflicto `409`:

```json
{
  "error": "capacity_below_commitments",
  "minimumRequired": 5,
  "conflictDates": ["2026-08-20"]
}
```

Las rutas anteriores `/blocks` y `/blocks/{id}/cancel` están retiradas y
responden `404` al no existir route handler activo.

## Seguridad y errores

Las rutas administrativas requieren `inventory:manage`. Errores canónicos:
`invalid_stay_range`, `capacity_version_conflict`,
`capacity_below_commitments`, `forbidden` y
`availability_unavailable`.

La API pública conserva su respuesta agregada y no incluye ninguna propiedad
`totalUnits`, `unitId`, código o detalle de bloqueo.
