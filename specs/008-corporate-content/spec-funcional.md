# Especificación funcional

## Actores y permisos

- Un usuario con `content:write` puede consultar, editar, publicar y restaurar contenido corporativo.
- Una persona visitante solo puede leer la última revisión publicada.

## Requisitos

- RF-CC-01: importar el contenido relevante recuperado de `aboutus.php`, `terms.php`, `faq.php` y `testimonial.php`.
- RF-CC-02: administrar por separado Nosotros, FAQ, Testimonios, Términos, Privacidad y Contacto.
- RF-CC-03: editar contenido en español e inglés.
- RF-CC-04: publicar mediante una acción explícita y conservar historial inmutable.
- RF-CC-05: restaurar una versión previa creando una versión nueva.
- RF-CC-06: impedir que una edición desactualizada sobrescriba una publicación más reciente.
- RF-CC-07: alimentar desde esta fuente `/about`, `/faq`, `/testimonials`, `/hotel-policies`, `/contact` y el footer.
- RF-CC-08: mantener teléfonos `+51 961 508 813` y `+51 977 419 468`, usando el primero para WhatsApp.
- RF-CC-09: publicar inicialmente atención de lunes a domingo, 07:00–20:00.
- RF-CC-10: mostrar check-in 14:00, checkout 12:00, early check-in 50 % desde 06:00 y late checkout 50 % hasta 18:00.
- RF-CC-11: no exponer notas internas, rutas de archivos, advertencias legales ni instrucciones de desarrollo.
- RF-CC-12: conservar en el ERP la redacción completa extraída de cada página histórica como archivo de consulta no público.

## Reglas

- La reserva se paga dentro de las 24 horas posteriores a la confirmación de disponibilidad.
- Cancelaciones o modificaciones se comunican con al menos 48 horas, salvo promociones con condiciones distintas.
- El no-show genera el cargo de la primera noche sin reembolso.
- La ampliación se solicita con al menos seis horas y depende de disponibilidad.
- Los menores ingresan acompañados por padres o tutores acreditados.
- Los campos obligatorios no pueden publicarse vacíos.

## Criterios de aceptación

- El detalle histórico puede localizarse y editarse desde el ERP sin modificar código.
- La web pública refleja inmediatamente la última revisión publicada.
- Las páginas dejan de mostrar resúmenes ambiguos cuando existe contenido detallado.
- Un conflicto de versión produce una respuesta 409 y conserva la publicación vigente.
- Una restauración aparece como una revisión nueva con referencia a su origen.
