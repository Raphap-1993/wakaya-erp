# Spec funcional - Wakaya ERP Public Site

[README principal](../../README.md) | [Specs](../README.md)

## Objetivo
Definir la experiencia publica premium de Wakaya Ecolodge para captar interes,
mostrar disponibilidad referencial y conducir a una prereserva manual.

## Alcance
El feature cubre solo la superficie publica de alta fidelidad para:

- home
- habitaciones
- detalle de habitacion
- eventos
- full day

No cubre backoffice, pago online, ni confirmacion automatica.

## Actores
- Visitante web
- Huesped potencial
- Prospecto de evento
- Prospecto de full day

## Trazabilidad funcional
- RF-01 Ver una home premium con hospedaje como linea principal.
- RF-02 Consultar habitaciones por categoria con precio desde y capacidad.
- RF-03 Abrir el detalle de una habitacion y revisar amenidades, reglas y CTA.
- RF-04 Iniciar una prereserva desde hero, categoria o detalle.
- RF-05 Ver Eventos como linea secundaria editorial con CTA a solicitud.
- RF-06 Ver Full Day como linea secundaria editorial con CTA a solicitud.
- RF-07 Recibir confirmacion de solicitud, no confirmacion de reserva.
- RF-08 Ver mensajes claros sobre revision manual y coordinacion posterior.

## Flujo principal
1. El visitante entra a la Home.
2. El visitante revisa el hero y la barra flotante de booking.
3. El visitante baja a Habitaciones.
4. El visitante elige una categoria y abre el detalle.
5. El visitante revisa capacidad, galeria, tarifa base y observaciones.
6. El visitante inicia la prereserva.
7. El sistema muestra confirmacion de solicitud recibida.

## Flujos secundarios
- Home -> Eventos -> Solicitud de evento.
- Home -> Full Day -> Solicitud de full day.

## Reglas de negocio visibles
- La disponibilidad mostrada es referencial.
- La aprobacion final es manual.
- El pago se coordina despues con el equipo de Wakaya.
- La web no debe afirmar "reserva confirmada" en esta fase.

## Criterios de aceptacion
- La jerarquia publica deja claro que hospedaje es la linea principal.
- Eventos y Full Day se perciben como secundarios, pero visibles.
- El estilo visual se siente premium, tropical y humano, no generico.
- La prereserva puede iniciarse desde varios puntos del sitio.
- La confirmacion final del flujo usa lenguaje de solicitud recibida.
