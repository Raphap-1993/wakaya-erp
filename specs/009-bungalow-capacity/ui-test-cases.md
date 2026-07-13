# UI Test Cases - Wakaya Bungalow Capacity

## UI-009-01 - Totales iniciales

Muestra Familiar 5, Matrimonial 4, Individual 5, Doble 2 y Triple 1.

## UI-009-02 - Disponibilidad completa

El disponible del rango corresponde a la noche con menor cupo y muestra su fecha.

## UI-009-03 - Editar total

Administrador cambia el total; éxito actualiza versión y tabla.

## UI-009-04 - Reducción conflictiva

Un `409` conserva el formulario y muestra mínimo y fechas de conflicto.

## UI-009-05 - Sin bloqueos operativos

La pantalla no muestra columna, acción, formulario ni lista de bloqueos.

## UI-009-06 - Legado sin efecto

Un registro histórico activo no modifica las cantidades de la pantalla.

## UI-009-07 - Permisos

Un usuario sin `inventory:manage` recibe acceso denegado.

## UI-009-08 - Sin códigos

La pantalla no muestra `FAM-01`, nombres individuales ni acciones por unidad.

## UI-009-09 - Mobile

En 390 px las categorías se muestran como tarjetas y las acciones mantienen foco.
