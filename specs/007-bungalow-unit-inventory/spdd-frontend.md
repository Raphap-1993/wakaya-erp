# SPDD Frontend - Wakaya Bungalow Unit Inventory

[Specs](../README.md) | [Feature](README.md)

## Objetivo
Validar una operación clara de tipos, unidades, bloqueos y asignación antes de construir UI productiva.

## Superficies

### Resumen de tipos
Tabla/cards compactas con tipo, unidades totales, activas, disponibles en el rango y CTA `Ver unidades`. Selector de fechas arriba; sin texto ornamental.

### Detalle de tipo
Filas por unidad: código, nombre, estado, próxima ocupación/bloqueo y acciones `Editar`, `Bloquear`, `Ver agenda`. Los códigos seed deben verse completos.

### Dialog de bloqueo
Campos check-in, checkout, motivo y nota. Resumen calculado `2 noches: 10 y 11 ago`. Error inline si rango inválido o solapado. Confirmación devuelve foco a la unidad.

### Asignación de reserva
Muestra tipo, rango, huéspedes y chip `Sugerida` en la primera unidad. Solo lista unidades disponibles. Cambiar exige razón y el submit advierte que revalidará disponibilidad.

### Público agotado
No envía la solicitud. Muestra mensaje operativo, hasta tres tipos alternativos, hasta tres fechas alternativas dentro de 60 días y CTA para elegir una. No revela unidad sugerida ni bloqueos.

### Estado OTA
El detalle operativo muestra `Unidad asignada` o `Conflicto de disponibilidad OTA`. Un reintento idempotente no agrega alertas duplicadas; si se resuelve, el estado cambia en el mismo bloque y conserva historial.

## Estados
Sin rango, loading, disponible, agotado, unidad inactiva, bloqueo solapado, carrera `409`, servicio `503`, éxito y cancelación auditada.

## Responsive
- desktop: tabla de tipos/unidades y panel lateral de agenda;
- mobile: cards apiladas, filtros en drawer y dialogs full-screen;
- no usar una grilla calendario ilegible en móvil.

## Accesibilidad
Fechas con labels, resumen de noches anunciado, chips no dependientes de color, dialogs con foco, selección de unidad por radio y error `409` en live region.

## Gate
`gate-prototype-ready` está **APROBADO** con resumen, detalle, bloqueo, asignación y agotado responsive. `gate-spdd-approved` está **APROBADO** por orden explícita del Product Owner del 2026-07-09, registrada en `prototype-validation.md`; no se afirma revisión de capturas posteriores.
