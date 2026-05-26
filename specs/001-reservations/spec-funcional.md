# Spec funcional - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Objetivo
Permitir que el operador consulte reservations asignados y priorice su trabajo diario.

## Trazabilidad
- RF-01 Consultar reservations asignados.
- RF-02 Ver detalle de la reserva.

## Actores
- Operador.
- Aprobador.

## Flujo principal
1. El usuario inicia sesion.
2. El sistema obtiene roles desde OIDC.
3. El usuario abre el modulo.
4. El sistema lista reservations permitidos.
5. El usuario filtra por estado, prioridad o responsable.
6. El usuario abre el detalle.

## Criterios de aceptacion
- Solo se muestran reservations permitidos por rol.
- La lista permite filtros basicos.
- La respuesta de API incluye identificador, estado, prioridad y responsable.
- El acceso sin token retorna 401.
