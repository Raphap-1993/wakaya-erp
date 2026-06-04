# Wakaya Public Site Parador System Design

Date: 2026-06-04
Status: Approved in conversation, pending written-spec review
Topic: Capa publica multipagina de `002-public-site` con arquitectura real de Wakaya y lenguaje visual tipo `Parador`

## Objective

Redefinir toda la capa publica de Wakaya para que:

- conserve la arquitectura real del sitio actual de Wakaya,
- use el lenguaje visual, el motion, el ritmo, el header, el footer y la
  sensacion general del template `Parador`,
- deje una experiencia multipagina coherente y validable antes de cualquier
  implementacion productiva final.

Este spec reemplaza la idea de una sola home aislada. La referencia ya no es
solo el home. La referencia es el sistema publico completo.

## Reference Model

### Source of truth for architecture and business content

- `https://wakayaecolodge.com/es/index.php`
- `https://wakayaecolodge.com/es/aboutus.php`
- `https://wakayaecolodge.com/es/roomlist.php`
- `https://wakayaecolodge.com/es/services.php`

### Source of truth for visual language and interaction behavior

- `https://parador-next.netlify.app/?storefront=envato-elements`
- `https://parador-next.netlify.app/room-single/Luxery-Twin-Room`
- `https://parador-next.netlify.app/about`
- `https://parador-next.netlify.app/service`
- `https://parador-next.netlify.app/contact`

## Main Rule

La capa publica final debe sentirse tan cuidada y cohesionada como `Parador`,
pero sin romper la arquitectura publica real de Wakaya.

Traduccion operativa:

- la estructura base y las secciones nacen de Wakaya,
- el esqueleto visual, el movimiento, la composicion, el comportamiento del
  header y el cierre visual nacen de `Parador`,
- la experiencia no debe verse como un template viejo maquillado ni como una
  copia ciega sin contenido real.

## Public Information Architecture

La capa publica aprobada queda como sitio multipagina:

1. `Home`
2. `Nosotros`
3. `Listado de bungalows`
4. `Detalle de bungalow`
5. `Servicios`
6. `Eventos`
7. `Galeria`
8. `Publicaciones`
9. `Contacto`
10. `Resultados de busqueda / disponibilidad`

## Navigation Model

### Main menu

- `Inicio`
- `Nosotros`
- `Bungalows`
- `Servicios`
- `Eventos`
- `Galeria`
- `Publicaciones`
- `Contacto`

### Recommended dropdowns

`Nosotros`
- `Acerca de Wakaya`
- `Testimonios`
- `Preguntas frecuentes`
- `Terminos y condiciones`

`Bungalows`
- `Bungalow Familiar`
- `Bungalow Matrimonial`
- `Bungalow Doble`
- `Bungalow Triple`

`Servicios`
- `Bodas`
- `Eventos corporativos`
- `Cenas romanticas`
- `Laguna natural`
- `Full Day`
- `Restaurante`
- `Piscina`
- `Zona de juegos`

### Secondary navigation rule

- `Intranet` no vive como item protagonista del menu publico.
- Si se conserva, debe aparecer como acceso secundario discreto en footer o en
  utilidades de baja jerarquia.

### Primary CTA

- CTA fijo a la derecha del header:
  `Reservar ahora` o `Consultar disponibilidad`

## Shared Shell Rules

Toda la capa publica comparte:

- un solo header global,
- un solo footer global,
- una misma familia de botones, cards y surfaces,
- una misma escala de espaciado,
- una misma familia de motion,
- la misma paleta Wakaya reinterpretada con acabado premium.

No todas las paginas comparten el mismo arranque visual.

La `home` es la unica que usa un hero slider grande y dominante.
Las paginas internas usan `page hero` o `inner hero` mas corto.

## Home Rule

### Non-negotiable behavior

La `home` debe replicar el efecto fuerte de `Parador` en la fusion entre menu
y slider.

Eso significa:

- header transparente o visualmente fundido sobre el hero,
- menu integrado dentro del fondo del slider,
- logo, navegacion y CTA viviendo dentro del primer impacto visual,
- cambio a estado sticky solido o glass al hacer scroll,
- booking band anclada al borde inferior del hero, no como modulo separado y
  desconectado.

### Home section order

1. `Hero slider`
2. `Booking bar`
3. `Habitaciones destacadas`
4. `Bloque promo eco-luxury`
5. `Servicios`
6. `Eventos + Full Day`
7. `Testimonios`
8. `Publicaciones`
9. `Galeria`
10. `Newsletter`
11. `CTA final`
12. `Footer`

### Home hierarchy rules

- hospedaje domina la home,
- eventos y full day siguen visibles, pero secundarios,
- testimonios, publicaciones, galeria y newsletter se mantienen porque existen
  en la arquitectura real de Wakaya,
- la pagina debe cerrar comercialmente, no solo verse bonita.

## Internal Page Rule

Las paginas internas deben pertenecer a la misma familia visual del home, pero
sin convertirse en otra home.

Cada pagina interna usa:

- hero corto o page hero,
- breadcrumb,
- titulo principal,
- contenido especifico de la pagina,
- ritmo visual amplio,
- footer compartido.

No usan:

- slider gigante de home,
- header blanco viejo separado,
- layouts estrechos tipo landing SaaS,
- hero sin identidad.

## Search Results / Availability Page

### Purpose

Faltaba una pieza critica en el flujo publico: la salida del filtro del home.

La busqueda desde hero y booking band debe enviar a una pagina publica
idempotente de resultados.

### Rule

La pagina de resultados se controla por query params y debe sobrevivir:

- recarga,
- compartir URL,
- volver atras,
- abrir en nueva pestana.

Ejemplo:

`/bungalows?checkIn=2026-07-10&checkOut=2026-07-12&guests=2&category=familiar`

### Expected content

- filtros visibles,
- disponibilidad referencial,
- categorias compatibles,
- precio desde,
- capacidad,
- highlights,
- CTA a detalle,
- CTA a prereserva o consulta.

### States

- resultados encontrados,
- empty state elegante,
- error suave o recuperable,
- recordatorio visible de que la aprobacion final sigue siendo manual.

### Architecture note

Esta pagina es la evolucion directa de `roomlist.php`, pero redisenada con el
lenguaje visual de `Parador`.

## Page-by-Page Content Intent

### `Nosotros`

Debe tomar:

- historia real de Wakaya,
- proposito,
- valores,
- narrativa de naturaleza y descanso,
- soporte fotografico amplio.

Debe sentirse como una pagina premium de marca, no como texto institucional
plano.

### `Listado de bungalows`

Debe funcionar como catalogo comercial:

- cards o listados amplios,
- foto protagonista,
- capacidad,
- tarifa desde,
- rasgos clave,
- CTA a detalle.

No debe parecer una tabla operativa ni un inventario frio.

### `Detalle de bungalow`

Debe ser el destino profundo principal:

- hero o gallery hero,
- resumen rapido,
- amenities,
- capacidad,
- observaciones,
- tarifa desde,
- CTA a prereserva.

### `Servicios`

Debe recoger los servicios reales de Wakaya:

- bodas,
- eventos corporativos,
- cenas romanticas,
- laguna natural,
- full day,
- restaurante,
- piscina,
- zona de juegos.

La composicion debe parecer editorial y hospitality, no una grilla institucional
seca.

### `Eventos`

Debe posicionar Wakaya como venue y experiencia:

- celebraciones,
- corporativo,
- reuniones especiales,
- CTA de solicitud.

### `Galeria`

Debe reforzar:

- agua,
- vegetacion,
- arquitectura,
- uso humano del lugar,
- atmosfera de destino.

### `Publicaciones`

Se conserva por arquitectura real del sitio, pero debe integrarse
visualmente al sistema nuevo y no quedar como isla vieja.

### `Contacto`

Debe consolidar:

- telefonos,
- correo,
- ubicacion,
- redes,
- formulario o CTA de contacto,
- mapa cuando aplique.

Aunque la pagina actual de Wakaya no quede limpia como ruta unica, la nueva
superficie publica debe resolver `Contacto` como pagina clara del sistema.

## Typography Rule

La tipografia publica no debe sentirse tan pesada en los titulos como el
prototipo actual.

Regla aprobada:

- bajar uno o dos puntos de grosor visual en los títulos principales,
- mantener presencia editorial,
- evitar headings demasiado negros o demasiado bloque.

Traduccion de diseno:

- titulares con menos peso que la version actual del prototipo,
- suficiente contraste para seguir sintiendose premium,
- mejor balance entre elegancia, aire y presencia comercial.

## Motion Rule

Motion aprobado:

- `cinematica suave`

Debe incluir:

- slider con transicion hospitality,
- sticky header con cambio de estado elegante,
- reveals suaves de bloques,
- hover lift en cards,
- dropdowns refinados,
- transiciones de hero a booking band,
- cambio natural entre home e interiores.

No debe incluir:

- motion agresivo,
- exceso de lujo artificial,
- microinteracciones innecesarias,
- efectos que compitan con la lectura.

## Visual Boundaries

### Must feel close to Parador in

- header fusionado al hero,
- slider dominante,
- booking band,
- footer,
- ritmo de secciones,
- interiores con hero propio,
- transiciones,
- densidad de lujo hospitality.

### Must stay Wakaya in

- contenido,
- categorias de bungalow,
- servicios,
- eventos,
- publicaciones,
- tono del negocio,
- arquitectura general del sitio.

## Validation Criteria

El diseno se considera correcto si:

- la home se siente 1:1 en impacto con `Parador`,
- el menu vive integrado en el hero del home,
- la arquitectura real de Wakaya se mantiene,
- existe una pagina idempotente de resultados desde el filtro del home,
- las internas no parecen otra home, pero si parte de la misma familia,
- los titulos dejan de sentirse excesivamente gruesos,
- el sistema completo se siente premium, tropical, humano y cohesionado.

## Non-Goals

- no redisenar el monitor interno `001-reservations` como Parador,
- no convertir todo en one-page,
- no depender de una confirmacion automatica de reserva que el negocio no
  soporte,
- no copiar a Parador de forma literal si eso rompe la arquitectura real de
  Wakaya.

## Canonical Output

Este spec gobierna la siguiente iteracion de la capa publica en:

- `specs/002-public-site/`
- `src/app/prototype/public-site/`
- `src/components/public-site/`
