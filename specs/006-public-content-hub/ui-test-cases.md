# UI Test Cases - Wakaya Public Content Hub

[Specs](../README.md) | [Feature](README.md)

## UI-006-01 - Navegación única
Dado un editor autorizado, cuando abre `/admin/content`, entonces ve Home, Experiencias, Galería y Bungalows y conserva el tab en navegación interna.

## UI-006-02 - CRUD bilingüe
Dada una experiencia nueva, cuando completa ES/EN, media y orden, entonces puede publicarla y verla en ambos locales con el mismo slug.

## UI-006-03 - Validación de idioma
Dada una experiencia visible sin resumen EN, cuando publica, entonces el campo EN recibe foco, se anuncia el error y no cambia la versión pública.

## UI-006-04 - Crop dual
Dado un hero, cuando completa solo Desktop, entonces `Aplicar recortes` permanece deshabilitado; al completar Mobile se habilita y muestra ambos previews.

## UI-006-05 - Source insuficiente
Dada una imagen pequeña, cuando el crop no soporta la variante, entonces se muestra `Resolución insuficiente` y se conserva el activo anterior.

## UI-006-06 - Galería única
Dada la galería, cuando reordena con botones de teclado y publica, entonces el orden persiste y coincide en ES/EN.

## UI-006-07 - Popup por URL
Dada `/es/services?experience=paseo-laguna`, cuando carga, entonces abre el dialog correcto; Escape lo cierra y devuelve foco a la card.

## UI-006-08 - Historial browser
Dado el popup abierto, cuando usa back/forward, entonces el estado del dialog sigue al query param sin perder scroll.

## UI-006-09 - CTA a formulario
Dado el popup EN, cuando pulsa CTA, entonces llega a `/en/contact?experience=paseo-laguna#booking-request` con resumen editable.

## UI-006-10 - Conflicto
Dadas dos sesiones, cuando la segunda publica una versión obsoleta, entonces ve `409`, puede recargar y no se mezclan cambios.

## UI-006-11 - Permiso
Dado un usuario sin `content:write`, cuando abre el centro, entonces no ve mutaciones y la API responde `403`.

## UI-006-12 - Mobile
Dado viewport 390x844, cuando edita crop y contenido, entonces no hay scroll horizontal, el dialog ocupa pantalla completa y la acción principal permanece alcanzable.

## UI-006-13 - Experiencia persistida
Dado que el visitante llega desde `?experience=paseo-laguna`, cuando envía el formulario, entonces la booking request persiste `requestedExperienceId` y su detalle muestra título, slug e ID aunque las notas se editen.
