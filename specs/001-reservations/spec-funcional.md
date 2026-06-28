# Spec funcional - Wakaya ERP

[README principal](../../README.md) | [Specs](../README.md)

## Objetivo
Permitir que recepcion y operaciones gestionen reservas con trazabilidad, asignacion de bungalow, control de estadia y auditoria.

## Trazabilidad
- RF-01 Consultar reservas por estado, fecha y responsable.
- RF-02 Ver detalle de la reserva.
- RF-03 Asignar bungalow a una reserva.
- RF-04 Registrar check-in, check-out y pago.
- RF-05 Consultar historial de auditoria.
- RF-06 Crear prereserva desde la web publica y dejarla en revision.

## Actores
- Recepcion.
- Administracion.
- Auditor.
- Huesped o visitante desde la web publica.

## Flujo principal
1. El usuario inicia sesion.
2. El sistema obtiene roles desde OIDC.
3. El usuario abre el modulo de reservas.
4. El sistema lista reservas permitidas.
5. El usuario filtra por estado, fecha o responsable.
6. El usuario abre el detalle.
7. El usuario asigna bungalow o registra un cambio de estado permitido.
8. El huesped envia una prereserva desde la web publica.
9. El sistema deja auditoria visible de la accion.

## Criterios de aceptacion
- Solo se muestran reservas permitidas por rol.
- La lista permite filtros basicos.
- La respuesta de API incluye identificador, numero, estado, canal, bungalow asignado y responsable.
- El acceso sin token retorna 401.
- Toda transicion valida deja auditoria.
- La asignacion de bungalow no permite solape de inventario.
- La prereserva desde la web publica crea una reserva con estado `pending_review`.
- La prereserva publica devuelve el numero de reserva generado por el servidor.

## Reglas canonicas del dominio
- [Reglas de negocio, estados y criterios de aceptacion](reglas-negocio-estados-criterios.md)
