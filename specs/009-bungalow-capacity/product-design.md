# Product Design - Wakaya Bungalow Capacity

## Problema

El módulo vigente obliga a administrar códigos, nombres, orden y estado de 17
unidades. Wakaya solo necesita controlar cuántos bungalows físicos existen por
categoría y cuántos están comprometidos por reservas confirmadas.

## Actores y trabajos

- Administrador: configura totales físicos.
- Operación: consume la disponibilidad calculada desde reservas.
- Visitante: consulta disponibilidad agregada sin datos internos.
- Sistema: descuenta reservas confirmadas y rechaza sobreventa.

## Experiencia objetivo

- Una sola pantalla con las cinco categorías.
- Filtro de check-in y checkout arriba.
- Resumen coherente de total, reservadas y disponibles.
- Edición de total con un solo campo.
- Ningún código ni unidad individual en la operación.

## Métricas

- Cero confirmaciones por encima del cupo de cualquier noche.
- Cero solicitudes pendientes descontadas del inventario.
- Cien por ciento de cambios de total auditados.
- Configuración inicial exacta de 17 cupos en cinco categorías.

## Bloqueos retirados

Los bloqueos agregados no identifican qué bungalow físico queda fuera de
servicio. Se retiran de operación hasta que ese proceso sea mapeado. Los
registros existentes permanecen solo para auditoría y no descuentan cupo.
