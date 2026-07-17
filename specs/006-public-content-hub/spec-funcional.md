# Spec funcional - Wakaya Public Content Hub

[Specs](../README.md) | [Feature](README.md)

## Objetivo
Permitir que un editor mantenga contenido público ES/EN y media desde una sola entrada administrativa, sin editar código ni crear fuentes de verdad paralelas.

## Actores
- Editor de contenido: edita y publica.
- Administrador: publica, restaura y elimina activos no usados.
- Operador sin permiso: no puede mutar contenido.
- Visitante: consume únicamente contenido publicado.

## Requerimientos funcionales

| ID | Requerimiento | Resultado esperado |
|---|---|---|
| RF-006-01 | Abrir `/admin/content` | Tabs `Home`, `Experiencias`, `Galería`, `Bungalows` |
| RF-006-02 | Mantener Home | Reutiliza publicación atómica y revisiones de feature 005 |
| RF-006-03 | Crear, editar, ordenar, ocultar y eliminar experiencias | CRUD bilingüe con slug estable y media |
| RF-006-04 | Administrar una galería global | Lista única, ordenada y bilingüe; no hay álbums |
| RF-006-05 | Editar ficha pública por tipo de bungalow | Copy ES/EN, tarifa, área, visibilidad, orden y media |
| RF-006-06 | Subir imágenes | Valida source, crea maestro WebP y derivados |
| RF-006-07 | Recortar antes de publicar | Crop obligatorio; heroes exigen desktop y mobile |
| RF-006-08 | Publicar con control de versión | Escritura atómica o conflicto `409` |
| RF-006-09 | Abrir detalle público de experiencia | Popup controlado por `?experience=<slug>` |
| RF-006-10 | Continuar al formulario | CTA a `/{locale}/contact?experience=<slug>#booking-request` |
| RF-006-11 | Operar ES/EN sin duplicar estructura | Idiomas comparten slug, orden, estado y media |
| RF-006-12 | Mantener compatibilidad | URLs admin legadas redirigen; lectores legados funcionan durante el corte |
| RF-006-13 | Persistir la experiencia solicitada | Booking request guarda `requestedExperienceId` y el detalle lo muestra |
| RF-006-14 | Quitar o reemplazar media administrada | La referencia se elimina o reemplaza en BD después de publicar el módulo |
| RF-006-15 | Eliminar activos sin uso | Metadata y archivos optimizados se eliminan sin romper referencias vigentes o revisiones |
| RF-006-16 | Impedir falsos positivos de persistencia | Producción rechaza cargas si PostgreSQL o el storage durable no están configurados |
| RF-006-17 | Crear y eliminar slides del Home | El borrador permite agregar hasta 8 slides y conserva al menos uno al eliminar |
| RF-006-18 | Contactar por WhatsApp desde cualquier página pública | Botón flotante con identidad oficial usa el número publicado en `Contacto y horarios` y un mensaje localizado |
| RF-006-19 | Ordenar bungalows desde backoffice | Home y catálogo respetan `sortOrder`; si existen empates heredados usan Familiar, Matrimonial, Individual, Doble y Triple |
| RF-006-20 | Mostrar todos los bungalows en el Home | Carrusel responsive lista los cinco tipos, con controles accesibles y desplazamiento táctil |

## Reglas de negocio
- `slug` de experiencia es único, minúsculo y no cambia al editar traducciones.
- No se publica una experiencia visible sin título, resumen y CTA ES/EN.
- La galería es un singleton; sus items tienen `sortOrder` continuo desde `1`.
- Un activo publicado debe estar `ready` y tener variantes requeridas por su slot.
- Hero requiere crops `desktop 16:9` y `mobile 4:5`.
- Cerrar el popup elimina solo `experience`; back/forward restaura el popup.
- El CTA del popup conserva locale y no crea una booking request por sí mismo.
- El formulario resuelve el slug público a un ID vigente y envía `requestedExperienceId`; la API persiste el ID nullable y el backoffice lo muestra en el detalle de la solicitud.
- El contenido de bungalow se asocia al tipo `bungalow`, nunca a `bungalow_unit`.
- El botón global de WhatsApp no mantiene un número paralelo: deriva su destino de `corporate_content_revision.document.contact.whatsapp`.
- El Home no recorta el catálogo por cantidad: el carrusel recibe todos los tipos públicos ya ordenados.

## Requerimientos no funcionales
- Seguridad: mutaciones requieren `content:write`.
- Performance: payload público cacheable y variantes adecuadas por viewport.
- Accesibilidad: modal con foco atrapado, Escape, retorno de foco y alt localizado.
- Integridad: checksum evita duplicar binarios idénticos.
- Observabilidad: logs de upload, crop, publicación, restore y error.

## Criterios de aceptación
- Un editor completa el trabajo diario desde `/admin/content`.
- Upload inválido o crop incompleto no reemplaza el activo publicado.
- Maestro: WebP nearLossless 95 y lado mayor máximo 3200 px.
- Variantes WebP usan calidad 84-88.
- Experiencia ES/EN abre por URL compartible y su CTA llega al formulario.
- Home, galería y bungalow público no dependen de un deploy por cambio editorial.
- Experiencias, galería y bungalows muestran acciones explícitas para reemplazar
  y quitar media; la galería permite eliminar el item completo.
- Una carga exitosa en producción siempre tiene metadata en PostgreSQL y
  variantes WebP en el storage persistente configurado.
- Home permite crear y eliminar slides; cada cambio solo se vuelve público al
  ejecutar `Publicar cambios` y queda cubierto por la revisión recuperable.
- Cambiar el WhatsApp corporativo y publicar actualiza el destino global sin deploy.
- El orden publicado se refleja igual en ES/EN, Home y catálogo de bungalows.
- El Home renderiza cinco tarjetas en desktop y mobile; las tarjetas fuera del viewport son alcanzables por controles o gesto horizontal.

## Fuera de alcance
- page builder, HTML/CSS libre, DAM general, álbumes múltiples y workflow editorial multinivel.
