# Decisiones UX - Wakaya Bungalow Capacity

> Evidencia histórica de la versión aprobada el 2026-07-12. Los bloqueos fueron
> retirados del alcance el 2026-07-13; no usar este archivo como contrato vigente.

## Dominio del spec: cupos físicos por categoría, bloqueos temporales y disponibilidad Wakaya.

## Actor principal: Administrador de Wakaya con control exclusivo de totales y bloqueos.

## Tarea principal navegable: consultar un rango, editar el total de una categoría, bloquear una cantidad y cancelar el bloqueo.

## Patrón visual elegido

Patrón visual elegido: workbench administrativo list-first con tabla principal y panel contextual.

Workbench administrativo list-first con una tabla principal y panel contextual.
La disponibilidad responde primero cuánto se puede vender; la edición se abre
solo cuando el Administrador decide actuar.

## Justificación de no-shell-genérica: la noche crítica y la ecuación total-reservadas-bloqueadas-disponibles deben leerse en una sola fila.

## Interacciones mock obligatorias: consultar rango, editar total, guardar, provocar conflicto, crear bloqueo, cancelar bloqueo y simular acceso denegado.

## Ritmo

- escala de 8 px con medias de 4 px para controles compactos;
- una superficie dominante, sin tarjetas anidadas;
- filtros arriba, tabla central, bloqueos después;
- acciones secundarias agrupadas al final de cada fila;
- mobile convierte filas en tarjetas sin ocultar conteos.

## Contrato del prototipo

- Estados: loading, empty, error, success, unauthorized, conflicto de capacidad, sin bloqueos
- Roles: Administrador, Operación, Visitante, Auditor
- Entidades: Categoría, Total físico, Reservadas, Bloqueos activos, Auditoría
- RF representados: RF-009-01, RF-009-02, RF-009-03, RF-009-04, RF-009-05, RF-009-06, RF-009-07, RF-009-08, RF-009-09, RF-009-10
