# Product Design - Wakaya Guest Trust Layer

[README principal](../../README.md) | [Specs](../README.md)

## Problema
El sitio publico de Wakaya vende la experiencia, pero hoy deja vacios de
confianza: no explica politicas clave, no comunica que es pet friendly, no
ofrece un Libro de Reclamaciones online y parte del copy sigue sonando a
documento interno o flujo operativo.

## Jobs to be Done
- Cuando evalúo hospedarme en Wakaya, quiero entender las condiciones de reserva
  y cambios antes de escribir, para sentirme seguro al tomar la decisión.
- Cuando viajo con mi mascota, quiero saber si Wakaya realmente es pet friendly
  y bajo qué condiciones, para evitar sorpresas.
- Cuando tengo un inconveniente con un servicio, quiero presentar un reclamo en
  línea y recibir una constancia, para dar seguimiento formal a mi caso.

## Hipotesis de valor
Si Wakaya expone una capa clara de confianza pública con políticas, señal pet
friendly y Libro de Reclamaciones online, los visitantes percibirán mayor
seriedad y cercanía antes de reservar.

## Metricas de exito
- Metrica primaria: mayor claridad de reserva y confianza percibida en la capa publica.
- Metrica secundaria: reclamos ingresados con código y seguimiento interno trazable.
- Anti-metrica: no introducir lenguaje interno o técnico visible para el huésped.

## Flujos principales
1. Home -> footer o links de confianza -> Políticas -> Contacto / reserva.
2. Home -> footer -> Pet Friendly -> Contacto / reserva.
3. Footer -> Libro de Reclamaciones -> formulario -> constancia enviada.
4. Admin -> Reclamos -> listado -> detalle -> seguimiento operativo.

## Restricciones
- El flujo de reserva sigue siendo manual y humano.
- No mezclar reclamos con la cola de reservas web.
- La política pet friendly debe ser flexible y coordinada, sin prometer reglas
  que operación no pueda sostener.

## Decisiones de producto
- `Libro de Reclamaciones` y `Pet Friendly` viven como señales de confianza visibles en footer.
- Las políticas públicas se publican en páginas claras y escaneables.
- La voz pública se reescribe para hablarle al huésped y no al equipo interno.
