# Wakaya Home Content Management Design

Date: 2026-07-09
Status: Approved in conversation, pending written-spec review
Topic: Administración completa y segura del home público de producción

## Objetivo

Convertir el home público de Wakaya en una superficie completamente administrable
desde el backoffice, manteniendo la composición, los componentes y la lógica pública
existentes.

El equipo autorizado debe poder editar y publicar inmediatamente:

- slider principal;
- textos en español e inglés;
- CTAs y destinos;
- imágenes;
- orden y visibilidad de las secciones;
- tamaños tipográficos mediante opciones seguras;
- cantidad de bungalows destacados, sin duplicar su ficha pública.

La implementación no debe permitir HTML, CSS o JavaScript libre, ni introducir un
page builder genérico que pueda romper responsive, accesibilidad, SEO o flujos de
reserva.

## Decisiones aprobadas

- Enfoque: editor estructurado del home, no constructor libre.
- Publicación: cada guardado válido publica inmediatamente.
- Idiomas: español e inglés se editan en la misma pantalla.
- Tipografía: se controla con presets del sistema, nunca con píxeles o CSS libre.
- Bungalows: conservan su fuente de datos y módulo actuales.
- Seguridad: solo usuarios con el permiso `content:write` pueden publicar.
- Resiliencia: el home conserva una configuración válida de respaldo.

## Estado actual verificado

El home localizado vive en `src/app/[locale]/page.tsx` y hoy define en código:

1. slider principal;
2. banda de solicitud rápida;
3. cifras clave;
4. historia;
5. bungalows destacados;
6. cita visual;
7. experiencias;
8. testimonios;
9. CTA final.

El slider se construye a partir de contenido de otras secciones, por lo que sus tres
slides no son unidades administrables independientes. Los textos, imágenes y CTAs
principales del home están hardcodeados en español e inglés.

Los bungalows ya cuentan con contenido público persistido, orden, visibilidad en el
home, imágenes y contenido localizado. La nueva feature debe reutilizar esa fuente
de verdad y no copiarla dentro de la configuración del home.

## Problema

Actualizar el home requiere hoy modificar código, ejecutar build y desplegar. Además,
el slider deriva sus textos de secciones distintas, por lo que una edición aislada
puede cambiar dos superficies sin que el operador lo advierta.

Un editor excesivamente libre resolvería el problema de autonomía, pero trasladaría
el riesgo a producción: tamaños arbitrarios, enlaces inseguros, estructuras rotas o
secciones incompatibles con el responsive actual.

## Usuarios y permisos

### Administrador de contenido

- consulta la configuración publicada;
- edita español e inglés;
- administra slides;
- ordena y oculta secciones;
- carga o reemplaza imágenes;
- publica mediante `Guardar y publicar`;
- consulta y restaura revisiones previas.

### Operador sin permiso de contenido

- no ve acciones de edición ni rutas de publicación;
- recibe `403` si intenta consumir la API administrativa directamente.

### Visitante

- consume únicamente la configuración publicada;
- nunca recibe información de auditoría, revisiones o permisos internos.

## Alternativas evaluadas

### 1. Editor estructurado del home — seleccionada

Mantiene tipos de sección y componentes cerrados, pero permite editar el contenido,
orden, visibilidad y presentación aprobada. Ofrece autonomía sin convertir el home en
un lienzo arbitrario.

### 2. Constructor libre de bloques

Permitiría agregar cualquier bloque y estilo, pero aumentaría considerablemente el
alcance, la complejidad responsive, el riesgo SEO y la posibilidad de romper la
identidad visual.

### 3. Formulario plano de configuraciones

Sería más rápido inicialmente, pero mezclaría decenas de campos sin jerarquía y se
volvería difícil de operar y mantener.

## Arquitectura

### Límite de dominio

La feature se implementará como un módulo de contenido público, separado de la lógica
de reservas. No se agregarán responsabilidades de CMS al repositorio de reservas.

Un servicio de home público será responsable de:

- obtener la configuración publicada;
- validar y normalizar actualizaciones;
- aplicar control optimista de versión;
- guardar una revisión;
- devolver el último estado válido ante fallos;
- invalidar las rutas públicas después de publicar.

### Persistencia

La configuración publicada se almacenará en una tabla dedicada con:

- identificador estable `home`;
- versión de concurrencia;
- versión del esquema de contenido;
- documento JSONB validado;
- usuario que publicó;
- fecha de actualización.

Cada publicación exitosa generará además una revisión inmutable con la configuración
anterior. Las revisiones no son borradores: existen únicamente para auditoría y
recuperación rápida.

La migración inicial insertará la configuración equivalente al home actual solo si no
existe una fila previa. Un redeploy no podrá sobrescribir contenido editado por el
usuario.

### Contrato conceptual

La configuración tendrá esta forma lógica:

```ts
type HomeContent = {
  schemaVersion: 1;
  version: number;
  slider: {
    autoplay: boolean;
    intervalMs: 4000 | 4800 | 6000 | 8000 | 10000;
    slides: HomeSlide[];
  };
  sections: HomeSection[];
  updatedAt: string;
  updatedBy: string;
};
```

Cada slide y sección tendrá:

- `id` estable;
- `visible`;
- `order`;
- campos compartidos de imagen y comportamiento;
- contenido localizado `es` y `en`;
- presets tipográficos permitidos.

Las secciones soportadas serán cerradas y únicas:

- `booking-band`;
- `stats`;
- `story`;
- `bungalows`;
- `quote-band`;
- `experiences`;
- `testimonials`;
- `closing-cta`.

El slider se administra como región independiente y debe conservar al menos un slide
visible.

## Diseño del backoffice

### Ruta y navegación

Se agregará el módulo `Contenido del home` en `/admin/home`. Solo aparecerá para roles
con `content:write`.

El encabezado mostrará:

- estado `Publicado`;
- fecha y usuario de la última publicación;
- versión actual;
- enlace `Ver home`;
- acción principal fija `Guardar y publicar`.

### Estructura de la pantalla

#### Columna de estructura

Lista compacta del slider y las ocho secciones. Cada fila mostrará:

- nombre operativo;
- indicador visible/oculto;
- estado completo/incompleto;
- controles subir/bajar;
- acceso a la edición.

En pantallas pequeñas la columna se convertirá en selector o drawer. No se mantendrán
tres columnas comprimidas.

#### Panel de edición

Edita solo el bloque seleccionado. Los campos se agrupan en:

- contenido;
- imagen o media;
- CTA;
- presentación;
- visibilidad.

Las pestañas `Español` e `Inglés` cambian únicamente el contenido localizado. Orden,
visibilidad, imágenes y comportamiento se comparten para evitar homes estructuralmente
distintos por idioma.

#### Vista previa

La vista previa representa el estado local aún no guardado. Tendrá modos desktop y
móvil. No constituye un borrador persistido ni altera el home hasta pulsar `Guardar y
publicar`.

## Herramientas de edición

### Texto

- input para títulos y etiquetas cortas;
- textarea para párrafos;
- contador de longitud;
- errores específicos bajo el campo;
- sin rich text, Markdown o HTML.

### Tipografía

Los controles visibles serán `Pequeño`, `Normal`, `Grande` y `Destacado`. El contrato
los traducirá a tokens CSS del sistema:

```ts
type TextSizePreset = "small" | "regular" | "large" | "display";
```

Cada tipo de campo limitará los presets disponibles. Por ejemplo, un cuerpo de texto
no podrá usar `display`, y una etiqueta auxiliar no podrá usar tamaños de hero.

### CTA

Cada CTA tendrá etiqueta localizada y destino compartido. Los destinos admitidos son:

- ruta pública interna seleccionada de una lista;
- número telefónico;
- WhatsApp;
- URL externa HTTPS.

No se permitirán protocolos arbitrarios, código ni rutas administrativas.

### Media

Las imágenes reutilizarán las reglas de carga, validación y optimización ya aplicadas
en el backoffice de bungalows. La vista previa anterior no se eliminará si falla una
carga.

### Slider

El operador podrá:

- agregar hasta ocho slides;
- duplicar un slide;
- ocultar o mostrar;
- eliminar, excepto si dejaría cero slides visibles;
- reordenar;
- editar imagen, textos y hasta dos CTAs;
- activar o desactivar autoplay;
- seleccionar un intervalo dentro de los presets seguros.

### Secciones

El operador podrá ocultar y reordenar todas las secciones posteriores al slider. La
reserva rápida conservará sus campos y comportamiento actuales; solo se editarán sus
textos, visibilidad y presentación permitida.

La sección de bungalows permitirá editar:

- eyebrow y título;
- CTA;
- cantidad visible entre dos y cuatro;
- visibilidad y orden.

La selección, ficha, tarifa, imágenes y orden relativo de cada bungalow seguirán en el
módulo `Bungalows`, con un enlace directo `Gestionar bungalows`.

## Flujo de publicación

1. El editor obtiene la configuración y su versión.
2. El usuario modifica el estado local y revisa la vista previa.
3. `Guardar y publicar` envía el documento completo junto con la versión leída.
4. El servidor valida permisos, versión y esquema.
5. Una transacción guarda la revisión anterior y actualiza la configuración publicada.
6. Se invalidan `/es`, `/en` y sus variantes relevantes de caché.
7. La API devuelve la nueva versión y fecha de publicación.
8. El editor confirma el éxito sin perder la sección seleccionada.

No habrá guardado parcial por sección: todas las relaciones de orden, visibilidad e
idiomas se publican de forma atómica.

## Concurrencia

Si otro usuario publica mientras el editor permanece abierto, la versión enviada será
obsoleta. El servidor responderá `409` y no sobrescribirá el contenido nuevo. La UI
mostrará quién publicó y permitirá recargar la configuración vigente antes de volver a
aplicar los cambios.

## Validación y seguridad

- al menos un slide visible;
- máximo ocho slides;
- IDs únicos y órdenes normalizados;
- tipos de sección permitidos, sin duplicados;
- título, imagen y CTA requeridos cuando el bloque activo lo necesite;
- longitudes máximas por tipo de texto;
- presets tipográficos incluidos en la lista permitida;
- destinos CTA seguros y normalizados;
- números telefónicos y WhatsApp en formato válido;
- imágenes con tipo, peso y dimensiones admitidas;
- contenido tratado como texto escapado;
- autorización `content:write` en página y API;
- usuario publicador tomado de la sesión, nunca del payload.

## Integración con el home público

`src/app/[locale]/page.tsx` dejará de construir el contenido editorial en el propio
archivo. Recibirá una vista localizada ya validada desde el servicio de home.

Los componentes actuales se conservarán siempre que representen correctamente el
tipo de sección. Los presets tipográficos se traducirán a clases CSS conocidas. Los
componentes nunca interpretarán estilos arbitrarios enviados desde la base de datos.

La sección de bungalows seguirá consultando `getLocalizedBungalows(locale)` y aplicará
el límite configurado después de respetar `featuredOnHome` y `sortOrder`.

## Resiliencia y recuperación

- La configuración se valida al escribir y al leer.
- Una lectura inválida no llega a React: se registra el fallo y se usa el último estado
  válido.
- Si todavía no existe contenido persistido, se usa el snapshot equivalente al home
  actual.
- Una carga de imagen fallida conserva la URL anterior.
- Una publicación fallida conserva el formulario local y muestra el error accionable.
- Restaurar una revisión crea una publicación nueva; nunca reescribe el historial.

## Mensajes operativos

El backoffice evitará párrafos explicativos permanentes. Usará:

- labels directos;
- estados `Visible`, `Oculto`, `Completo`, `Requiere contenido`;
- errores bajo demanda;
- tooltips breves para presets tipográficos, enlaces y publicación inmediata;
- confirmación compacta `Home publicado`.

## Accesibilidad y responsive

- todos los campos tendrán label;
- tabs, orden y visibilidad serán operables por teclado;
- los botones iconográficos tendrán nombre accesible;
- el contraste respetará el sistema actual;
- los tamaños públicos usarán `clamp()` y tokens responsive;
- la vista previa no sustituirá las pruebas reales en viewport;
- ocultar secciones no generará saltos semánticos inválidos en encabezados.

## Manejo de errores

| Escenario | Comportamiento |
|---|---|
| Campo inválido | No publica y enfoca el primer error |
| Conflicto de versión | Responde `409`, preserva el formulario y ofrece recargar |
| Fallo de imagen | Conserva la media previa y permite reintentar |
| Fallo de base al publicar | No invalida caché ni muestra éxito |
| Configuración inválida al leer | Usa el último estado válido y registra el incidente |
| Falta de permiso | Oculta el módulo y responde `403` en la API |

## Estrategia de pruebas

### Dominio

- validación de esquema;
- normalización de orden;
- unicidad de secciones;
- mínimo de slides visibles;
- límites de slider y textos;
- presets tipográficos permitidos;
- normalización y rechazo de CTAs inseguros;
- merge controlado con el snapshot inicial;
- creación y restauración de revisiones.

### Persistencia y API

- migración idempotente;
- publicación atómica;
- revisión anterior guardada;
- conflicto optimista `409`;
- autorización `content:write`;
- identidad del publicador tomada de sesión;
- invalidación de rutas solo después de guardar.

### Backoffice

- navegación y permiso del módulo;
- tabs ES/EN sin pérdida de contenido;
- selección, visibilidad y reordenamiento;
- gestión de slides;
- controles tipográficos limitados;
- validación y mensajes de error;
- vista previa desktop/móvil;
- confirmación de publicación.

### Home público

- render localizado ES/EN;
- orden y visibilidad de secciones;
- slider administrado;
- clases de tamaño correctas;
- CTAs válidos;
- bungalows obtenidos de la fuente actual;
- fallback ante contenido inválido o ausente;
- metadatos existentes sin regresión.

### E2E y release

- login con usuario autorizado;
- editar un texto ES y EN;
- cambiar tamaño de título;
- agregar o reordenar un slide;
- ocultar y volver a mostrar una sección;
- publicar y verificar inmediatamente `/es` y `/en`;
- restaurar una revisión;
- comprobar desktop y móvil;
- ejecutar tests, typecheck, build y smoke de producción.

## Despliegue y rollback

1. Aplicar migraciones aditivas.
2. Sembrar el snapshot actual solo si la configuración no existe.
3. Desplegar lectura con fallback y editor administrativo.
4. Verificar que el home no cambió antes de una edición.
5. Ejecutar una publicación controlada y revisar `/es` y `/en`.
6. Ante una regresión de contenido, restaurar la revisión anterior.
7. Ante una regresión de código, revertir la aplicación; las tablas aditivas pueden
   permanecer sin afectar el home anterior.

## Fuera de alcance

- constructor libre de páginas;
- creación de tipos de sección nuevos desde la UI;
- edición de header, footer o páginas internas;
- HTML, Markdown, rich text o CSS personalizado;
- traducción automática;
- edición de la ficha individual de bungalow desde `/admin/home`;
- cambios en la lógica de disponibilidad o solicitudes de reserva;
- calendarización de publicaciones o borradores persistidos.

## Criterios de aceptación

- Existe `/admin/home` con acceso restringido por `content:write`.
- El editor presenta una estructura clara y responsive.
- Slider, textos, imágenes, CTAs, secciones y tamaños son administrables.
- Todo contenido editorial se edita en español e inglés.
- Las secciones se pueden ocultar y reordenar.
- Los tamaños se limitan a presets que conservan responsive y diseño.
- `Guardar y publicar` actualiza el home de forma atómica e inmediata.
- Un conflicto concurrente no sobrescribe contenido ajeno.
- El home conserva su funcionamiento si la configuración persistida falla.
- Los bungalows continúan leyendo su fuente actual.
- Las revisiones permiten recuperar una publicación anterior.
- Tests automatizados y verificación visual prueban los flujos principales.

## Gates del proyecto

Este documento aprueba el diseño conceptual, pero no autoriza por sí solo la
construcción productiva. Antes de implementar frontend deben existir en una feature
canónica:

- `product-design.md`;
- `spdd-frontend.md`;
- `prototype.md`;
- prototipo HTML5 revisable;
- `prototype-validation.md` con validación humana;
- `gate-spdd-approved` aprobado;
- spec funcional, técnica, contrato API, tareas, casos UI y trazabilidad.

También debe normalizarse la documentación heredada que aún describe expedientes o un
stack Angular/Quarkus, porque contradice el dominio y la implementación real de Wakaya.
