# Prototype - Wakaya Bungalow Unit Inventory

[README principal](../../README.md) | [Specs](../README.md)

## Modo
HTML5-first, autocontenido y navegable.

## Ruta del prototipo
- `specs/007-bungalow-unit-inventory/prototype-html5/index.html`
- `specs/007-bungalow-unit-inventory/prototype-html5/decisiones-ux.md`
- `specs/007-bungalow-unit-inventory/prototype-html5/flujo.md`

## Superficies demostradas
- resumen de cinco tipos con capacidad agregada para el rango;
- inventario exacto de 17 unidades con códigos completos;
- detalle Doble con agenda por noches `[check-in, checkout)`;
- dialog de bloqueo manual con motivo, nota y dos noches calculadas;
- sugerencia de unidad editable y razón obligatoria al cambiar;
- respuesta pública agotada con tipos y fechas alternativas;
- estados OTA `Unidad asignada` y `Conflicto de disponibilidad OTA`;
- loading, sin rango, inactiva, carrera `409`, servicio `503`, éxito y cancelación auditada.

## Datos Wakaya representados
- Familiar: `FAM-01..05`;
- Matrimonial: `MAT-01..04`;
- Individual: `IND-01..05`;
- Doble: `DOB-01..02`;
- Triple: `TRI-01`;
- rango de prueba `10–12 ago 2026`, equivalente a noches 10 y 11.

## Alcance
- No conecta a PostgreSQL ni persiste cambios.
- No expone códigos de unidad en la superficie pública.
- Sí representa jerarquía, calendario, bloqueos, selección, conflicto e idempotencia OTA.
