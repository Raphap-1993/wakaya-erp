# Spec funcional - Wakaya Guest Trust Layer

[README principal](../../README.md) | [Specs](../README.md)

## Origen
- Product Design: `product-design.md`
- SPDD: `spdd-frontend.md`, `prototype-validation.md`

## Objetivo
Agregar una capa pública de confianza y un flujo formal de reclamos online para
Wakaya Ecolodge, con continuidad interna en el back office.

## Requerimientos
- **RF-01**: El footer público muestra accesos visibles a `Libro de Reclamaciones` y `Pet Friendly`.
- **RF-02**: El sitio público expone políticas de reserva, pagos, cancelaciones, no-show, reembolsos, cambios, check-in/check-out, capacidad y terceros.
- **RF-03**: El sitio público expone una página `Pet Friendly` con condiciones de viaje claras.
- **RF-04**: El usuario puede registrar una `queja` o `reclamo` online desde una página pública.
- **RF-05**: El sistema devuelve una constancia o código de seguimiento al registrar el caso.
- **RF-06**: El back office lista y muestra el detalle de los reclamos registrados.
- **RNF-01**: El copy público evita lenguaje interno y mantiene tono cálido, claro y comercial.
- **RNF-02**: La capa pública sigue siendo usable en mobile, en especial la booking band y el footer.

## Reglas de negocio
- El flujo de reclamos es independiente del flujo de reservas.
- El Libro de Reclamaciones distingue `queja` y `reclamo`.
- La respuesta operativa al reclamo no se modela como confirmación de reserva.
- La política pet friendly es con coordinación previa y sujeta a condiciones del bungalow.

## Actores

| Actor | Permisos | Caso de uso principal |
|---|---|---|
| Visitante | acceso público | leer políticas, viajar con mascota, registrar reclamo |
| Operador interno | reservation:read | revisar listado y detalle de reclamos |

## Criterios de aceptacion
- [ ] Dado un visitante en cualquier página pública, cuando baja al footer, entonces encuentra `Libro de Reclamaciones` y `Pet Friendly` sin buscarlos.
- [ ] Dado un visitante, cuando abre `Políticas`, entonces entiende condiciones básicas de reserva y cambios sin lenguaje técnico interno.
- [ ] Dado un visitante con una incidencia, cuando envía el formulario, entonces recibe un código de seguimiento.
- [ ] Dado un operador interno, cuando abre la bandeja de reclamos, entonces puede listar y abrir cada caso.

## Fuera de alcance
- Respuesta automatizada legal al reclamo.
- Integración con correo transaccional compleja o firma digital.
- Panel de analítica de reclamos.
