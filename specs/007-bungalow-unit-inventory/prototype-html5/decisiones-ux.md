# Decisiones UX - Wakaya Bungalow Unit Inventory

[README principal](../../../README.md) | [Specs](../../README.md)

## Golden de referencia
- Wakaya backoffice shell actual.
- `004-bungalow-backoffice-media` para densidad operativa.
- `005-home-content-management` para barra sticky, estados y acción principal.

## Dominio del spec: inventario operativo de tipos comerciales, unidades físicas, bloqueos, disponibilidad y asignación Wakaya.

## Actor principal: Recepción con lectura de reservas y capacidad de asignación según permiso.

## Tarea principal navegable: consultar capacidad real, abrir un tipo, bloquear una unidad y confirmar o cambiar una sugerencia segura.

## Patrón visual elegido
Workbench de inventario list-first. El resumen por tipos responde primero “cuánto queda”; el detalle por unidad responde después “qué unidad y por qué”. La agenda acompaña el rango activo y no se convierte en PMS general.

Patrón visual elegido: resumen operativo por tipos con drill-down a unidades y agenda del rango.

Justificación de no-shell-genérica: disponibilidad, bloqueo y asignación necesitan mostrar la semántica de noches y la capacidad real en la misma decisión.

Interacciones mock obligatorias: actualizar rango, abrir tipo, bloquear/cancelar, cambiar sugerencia, simular carrera, elegir alternativa y resolver conflicto OTA.

## Ritmo y jerarquía
- escala base de 8 px;
- filtros y métricas en una franja compacta;
- filas de 56-64 px para escaneo operativo;
- bloques separados por espacio y divisores, sin cards anidadas;
- acción primaria contextual y errores junto a la decisión afectada.

## Decisiones de interacción
- el visitante elige tipo, nunca unidad;
- recepción ve la unidad sugerida primero y solo alternativas disponibles;
- cambiar la sugerencia activa un motivo obligatorio;
- checkout es exclusivo: 10–12 ocupa 10 y 11;
- el bloqueo devuelve foco a la unidad y conserva auditoría;
- en mobile la agenda se convierte a lista por unidad, no a grilla comprimida;
- OTA asignada y conflicto comparten el mismo bloque para mostrar resolución sin duplicados.

## Anti-patrones evitados
- contar tipo como una sola habitación;
- crear reserva ficticia para mantenimiento;
- revelar códigos internos al visitante;
- calendario mensual ilegible en mobile;
- confirmar sin revalidar disponibilidad.

## Contrato del prototipo
- Estados: loading, empty, error, success, unauthorized, sin rango, unidad inactiva, bloqueo solapado, conflicto 409, servicio 503, agotado, cancelación auditada
- Roles: Recepción, Administrador, Visitante, Auditor
- Entidades: tipo de bungalow, unidad, bloqueo, reserva, ocupación, conflicto OTA
- RF representados: RF-007-01, RF-007-02, RF-007-03, RF-007-04, RF-007-05, RF-007-06, RF-007-07, RF-007-08, RF-007-09, RF-007-10, RF-007-11, RF-007-12, RF-007-13, RF-007-14
