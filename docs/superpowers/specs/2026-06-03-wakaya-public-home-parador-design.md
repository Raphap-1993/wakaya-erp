# Wakaya Public Home Parador Design

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Wakaya Public Site Prototype Design](2026-05-26-wakaya-public-site-design.md)
- Siguiente: [Wakaya Public Home Parador Design](2026-06-03-wakaya-public-home-parador-design.md)
<!-- nav-guided:end -->

Date: 2026-06-03
Status: Approved in conversation, pending written-spec review
Topic: Redireccion visual de la home publica de `002-public-site`

## Objetivo

Redefinir la `home` publica de Wakaya para que tome como referencia directa la
composicion, impacto visual, animaciones, ritmo de secciones y prominencia del
booking bar del template `Parador`, sin reutilizar el prototipo actual como
base visual.

La nueva home debe verse y sentirse cercana a `Parador` en esqueleto visual,
pero reinterpretada con:

- contenido real de Wakaya
- color de marca Wakaya
- fotografia propia o equivalente al ecolodge
- oferta real de hospedaje, servicios, eventos y full day

## Alcance

Este spec solo redefine la `home`.

No redefine en esta ronda:

- `habitaciones`
- `detalle de habitacion`
- `eventos`
- `full day`
- backend
- integracion real de reservas

Esas superficies conservan su alcance funcional actual, pero deberan alinearse
visual y compositivamente despues con la nueva direccion de la home.

## Regla principal

La home actual del prototipo HTML5 deja de ser referencia de diseno.

Queda descartada como base para:

- layout
- ritmo
- densidad visual
- jerarquia hero
- presencia del booking bar

La nueva referencia visual canonicamente aprobada es:

- `https://parador-next.netlify.app/?storefront=envato-elements`

La nueva referencia de negocio y contenido real es:

- `https://wakayaecolodge.com/es/index.php`

## Intencion de producto

La nueva home debe heredar de `Parador`:

- hero slider dominante
- booking bar flotante protagonica
- composicion ancha
- cards comerciales de habitaciones
- alternancia de bloques grandes
- motion hospitality visible

La nueva home debe heredar de Wakaya real:

- oferta real de bungalows
- servicios reales del ecolodge
- eventos y full day como lineas secundarias validas
- tono de hotel ecologico tropical
- mensajes de reserva y consulta alineados al negocio

## Direccion visual aprobada

### Base de referencia

- `Parador` casi completo como esqueleto visual

### Traduccion de marca

- posicionamiento: `eco-luxury tropical`
- hero: `mixto`
- animacion: `cinematica suave`
- booking bar: `si, protagonica`

### Traduccion concreta

La home debe parecerse a `Parador` en:

- distribucion general
- ritmo de scroll
- uso de hero slider
- presencia de CTA primario
- booking band bajo hero
- grid comercial de habitaciones
- bloques promo grandes
- cierre con CTA visible

La home debe cambiar respecto a `Parador` en:

- paleta hacia verdes Wakaya y neutros calidos
- fotografia hacia laguna, selva, bungalows y personas viviendo la experiencia
- copy hacia mensajes reales de Wakaya
- inventario hacia categorias reales del ecolodge
- oferta secundaria hacia servicios, eventos y full day reales

## Estructura canonica de la home

Orden aprobado:

1. `Hero slider`
2. `Booking bar` flotante inmediatamente debajo del hero
3. `Habitaciones destacadas`
4. `Bloque promo eco-luxury`
5. `Servicios`
6. `Eventos + Full Day`
7. `Galeria inmersiva`
8. `CTA final de reserva`

### Regla de jerarquia

- hospedaje manda la home
- eventos y full day aparecen como lineas visibles pero secundarias
- publicaciones salen completamente de la home

## Secciones y contenido esperado

### 1. Hero slider

Debe seguir la logica de `Parador`:

- slide visual dominante a pantalla amplia
- titular grande
- CTA principal claro
- transicion entre slides

Contenido Wakaya:

- slide de personas en laguna o recorrido acuatico
- slide de bungalows y descanso
- slide de experiencia natural premium

El hero no debe sentirse editorial minimalista; debe sentirse comercial,
hospitality y aspiracional.

### 2. Booking bar

Debe conservar el rol visual protagonista de `Parador`.

Campos visibles:

- habitacion o categoria
- check in
- check out
- personas
- noches o equivalente segun el flujo final
- CTA de consulta o disponibilidad

Regla funcional visible:

- la reserva sigue siendo manual o referencial en esta fase
- el copy del CTA no debe prometer confirmacion automatica si el backend no la
  soporta

### 3. Habitaciones destacadas

Debe aparecer inmediatamente despues del booking bar para conservar el empuje
comercial del template.

Formato:

- cards grandes
- imagen principal fuerte
- nombre de bungalow
- capacidad
- rasgos clave
- tarifa desde
- CTA visible

La oferta debe mapearse a habitaciones reales de Wakaya o a la estructura real
que negocio quiera presentar.

### 4. Bloque promo eco-luxury

Sustituye el promo generico del template por un bloque de atmosfera Wakaya.

Debe vender:

- naturaleza
- descanso
- agua
- madera
- desconexion

No debe parecer una promocion de paquete turistico generico. Debe reforzar la
percepcion de ecolodge premium.

### 5. Servicios

Servicios curados desde el negocio real:

- laguna natural
- piscina
- restaurante
- zona de juegos
- experiencias complementarias validas

La seccion debe seguir un ritmo visual fuerte y no una grilla institucional
plana.

### 6. Eventos + Full Day

Bloque secundario, pero todavia comercial.

Debe comunicar que Wakaya no solo vende estadia, sino tambien:

- bodas o celebraciones
- eventos corporativos
- cenas o momentos especiales cuando aplique
- full day

No debe desplazar a hospedaje como oferta principal.

### 7. Galeria inmersiva

Debe funcionar como bloque de confianza visual y atmosfera de destino.

Objetivo:

- reforzar el lugar
- mostrar vegetacion, agua, arquitectura y uso humano
- preparar el cierre comercial

### 8. CTA final

Debe cerrar como un ultimo empuje de reserva o solicitud.

Puede enlazar a:

- consulta de disponibilidad
- habitaciones
- solicitud de prereserva

La funcion es que la home cierre comercialmente, no solo esteticamente.

## Motion

Motion aprobado:

- `cinematica suave`

Esto significa:

- transiciones fluidas de hero slider
- reveals de scroll visibles pero no agresivos
- hover states claros en cards y CTA
- desplazamiento con sensacion premium

No significa:

- microinteracciones de app SaaS
- excesos de efectos
- tono marketplace ruidoso

## Responsive

### Desktop

- debe conservar el ancho y protagonismo del template de referencia
- debe evitar la sensacion de pagina angosta del prototipo actual
- el hero debe sostenerse como primera impresion dominante

### Mobile

- debe seguir sintiendose hero-first
- el slider debe mantenerse legible
- la booking bar debe apilarse con fuerza visual
- las cards deben conservar jerarquia y no caer en una lista debil

## Guardrails

- Si `Parador` choca con la oferta real de Wakaya, gana Wakaya.
- Si el prototipo actual choca con esta direccion, gana esta direccion.
- No se reutiliza la home actual como base compositiva.
- No se incluye `publicaciones` en la nueva home.
- No se degrada la web hacia una landing SaaS o una plantilla corporativa fria.

## Impacto esperado en artefactos

Este spec debera guiar cambios posteriores en:

- `specs/002-public-site/product-design.md`
- `specs/002-public-site/spdd-frontend.md`
- `specs/002-public-site/prototype-html5/index.html`
- `specs/002-public-site/prototype-validation.md`

No se actualizan en este paso. Este documento solo fija la direccion aprobada.

## Criterios de aprobacion de la home redisenada

- la home se siente visualmente cercana a `Parador`
- el color y el contenido la hacen reconocible como Wakaya
- la pagina se percibe ancha, impactante y comercial
- la booking bar domina el arranque de la experiencia
- habitaciones siguen siendo la primera linea de conversion
- eventos y full day aparecen, pero no compiten con hospedaje
- la home ya no depende del lenguaje visual del prototipo anterior

## Ruta canonica

Este documento define la nueva referencia oficial para la home publica de
`002-public-site`.

Siguiente paso obligatorio despues de tu revision escrita:

- escribir plan de implementacion
- reemplazar el prototipo actual de home por la nueva direccion
- dejar el hub de prototipos listo para revision humana
