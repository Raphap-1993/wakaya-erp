# Diseño de optimización adaptativa de imágenes públicas

Fecha: 2026-07-14
Proyecto: Wakaya ERP
Estado: aprobado por el usuario para planificación

## Problema

El centro de contenido ya convierte cargas JPEG, PNG y WebP mediante `sharp`,
pero usa calidades fijas y no garantiza un peso máximo para las variantes que
consume el sitio público. El personal de Wakaya administrará las fotografías y
no debe preparar, redimensionar ni comprimir archivos antes de subirlos.

El resultado requerido es una carga operativa simple: el usuario selecciona
una imagen y el sistema se encarga de validar, orientar, recortar, convertir,
comprimir, almacenar y publicar una variante suficientemente liviana para la
web.

## Decisión

Se mantendrá un único pipeline de media dentro del monolito Next.js. Todas las
superficies editoriales delegarán en `ContentMediaService`; no existirán
optimizadores paralelos ni rutas que publiquen binarios originales.

El pipeline generará WebP mediante compresión adaptativa. Para cada variante:

1. normaliza orientación y elimina metadatos;
2. aplica el recorte y las dimensiones objetivo;
3. codifica con una calidad inicial alta;
4. reduce calidad gradualmente hasta alcanzar el presupuesto;
5. si no es suficiente, reduce dimensiones por escalones y vuelve a codificar;
6. acepta el resultado únicamente si cumple el presupuesto y el piso visual;
7. conserva la referencia publicada anterior si el procesamiento falla.

La publicación será atómica: ninguna referencia editorial cambia hasta que el
activo y todas sus variantes obligatorias estén listos.

## Presupuestos públicos

| Variante | Dimensión objetivo inicial | Peso máximo |
|---|---:|---:|
| `heroDesktop` | 1920 × 1080 | 250 KB |
| `heroMobile` | 1080 × 1350 | 160 KB |
| `detail` | 1600 × 1200 | 200 KB |
| `card` | 960 × 720 | 100 KB |
| `thumb` | 480 × 360 | 40 KB |

Los límites se medirán sobre el buffer binario almacenado, usando 1 KB = 1024
bytes. El peso máximo será una poscondición del servicio y no una recomendación
de interfaz.

La calidad WebP comenzará en 84 y podrá reducirse en pasos de 4 hasta 64. Si el
presupuesto todavía no se cumple, las dimensiones se reducirán al 90 % en cada
iteración, conservando la relación de aspecto y sin bajar de estos pisos:

| Variante | Dimensión mínima |
|---|---:|
| `heroDesktop` | 1440 × 810 |
| `heroMobile` | 800 × 1000 |
| `detail` | 1200 × 900 |
| `card` | 720 × 540 |
| `thumb` | 360 × 270 |

Si una variante no puede cumplir simultáneamente su presupuesto y sus pisos,
la carga falla con un error operativo claro y el contenido vigente no cambia.

## Formatos y límites de entrada

El selector administrativo admitirá JPEG/JPG, PNG, WebP, AVIF y HEIC/HEIF. La
validación efectiva ocurrirá en servidor mediante inspección y decodificación
del contenido; la extensión y el MIME declarado por el navegador no serán
suficientes por sí solos.

Antes de habilitar HEIC/HEIF se verificará que el runtime Linux de producción
pueda decodificarlo. Si el binario precompilado de `sharp` no ofrece soporte
estable, se incorporará un decoder aislado antes de `ContentMediaService`, sin
cambiar el contrato de las rutas administrativas.

Se aceptarán entradas de hasta 25 MB y 80 megapíxeles para cubrir fotografías
modernas de celulares. Nginx, Next.js y la validación de aplicación deberán
tener límites coherentes. Los archivos que excedan esos límites, estén dañados
o no puedan decodificarse se rechazarán antes de publicar.

El maestro interno también será WebP y tendrá lado máximo de 3200 px. No será
referenciado por las páginas públicas. Su presupuesto máximo será 1.5 MB; si no
puede cumplirse, se aplicará la misma estrategia adaptativa sin bajar de 2000
px en el lado mayor.

## Superficies incluidas

- Home: slider, heroes e imágenes de secciones. El documento guardará el activo
  y la vista pública usará `heroDesktop` o `heroMobile` según el viewport.
- Experiencias: portada, hero y futuras imágenes de detalle.
- Galería global: detalle y miniatura.
- Bungalows: hero desktop/móvil y galería.
- Páginas y testimonios: el campo libre de URL de imagen será reemplazado por
  el selector administrado. Las rutas existentes quedarán como fallback de
  lectura durante la transición, pero las nuevas escrituras usarán activos.

No se expondrán controles de calidad, formato, dimensiones ni peso al personal.
La UI mostrará únicamente selección, progreso, recorte cuando corresponda,
resultado y errores comprensibles.

## Entrega pública y almacenamiento

Las vistas públicas referenciarán exclusivamente variantes, nunca el maestro.
Los nombres continuarán siendo inmutables por activo y variante, por lo que se
mantendrá `Cache-Control: public, max-age=31536000, immutable`.

Los binarios seguirán almacenados mediante `MediaStorage` en
`WAKAYA_MEDIA_STORAGE_PATH`, fuera del release desplegable y dentro del plan de
backup. PostgreSQL conservará para cada activo y variante: formato, dimensiones,
calidad final, bytes, checksum, estado, crop y actor.

Se agregarán los metadatos de reducción necesarios para operación:

- bytes de entrada;
- bytes de salida por variante;
- porcentaje de reducción;
- calidad y dimensiones finales;
- cantidad de iteraciones de compresión.

## Errores y operación

- Tipo no soportado: explicar qué formatos puede subir el usuario.
- Archivo demasiado pesado o grande: mostrar límites de entrada.
- Archivo dañado: indicar que la imagen no pudo leerse.
- Presupuesto imposible: pedir otra imagen sin publicar un resultado pesado.
- Fallo de storage o base: no cambiar la referencia editorial anterior.
- Fallo de una variante: marcar el activo como fallido y no publicar ninguna.

Los errores de decodificación y compresión se mapearán a respuestas 4xx/422
controladas; no se devolverán mensajes internos de `sharp`.

## Validación

La implementación deberá probar como mínimo:

- JPEG, PNG, WebP y AVIF válidos;
- HEIC/HEIF válido usando el decoder confirmado para el runtime productivo;
- fotografía de celular de gran resolución y orientación EXIF;
- rechazo de archivo corrupto, MIME falso y formatos no admitidos;
- límites de 25 MB y 80 MP;
- cumplimiento exacto del presupuesto de cada variante con imágenes de alta
  entropía, no solo imágenes sintéticas de color plano;
- reducción adaptativa de calidad y dimensiones;
- maestro no referenciado desde HTML público;
- selección correcta de hero desktop/móvil en Home;
- Páginas/Testimonios usando el mismo pipeline;
- rollback de referencia ante cualquier fallo;
- persistencia de métricas y caché inmutable;
- smoke autenticado de carga y smoke público ES/EN antes del deploy.

El gate de QA no podrá cerrarse si alguna variante pública producida por los
fixtures supera su presupuesto o si existe una nueva escritura editorial que
acepte una URL/binario sin pasar por `ContentMediaService`.

## Despliegue

El cambio se desplegará con backup de PostgreSQL y
`WAKAYA_MEDIA_STORAGE_PATH`, verificación del decoder HEIC/HEIF en el VPS,
build standalone, migración aditiva si se requieren nuevas columnas, reinicio
PM2 y smoke autenticado. Las imágenes históricas no se reprocesarán durante el
arranque; se preparará un backfill independiente, reanudable e idempotente.

El rollback de código conservará activos y columnas nuevas. Después de aceptar
nuevas escrituras no se restaurará ciegamente la base ni el filesystem; se
corregirá hacia adelante o se reconciliará desde los backups aislados.

## Fuera de alcance

- Exponer ajustes técnicos de compresión al personal.
- Guardar binarios en PostgreSQL.
- Introducir un CMS o microservicio de imágenes.
- Generar AVIF y WebP simultáneamente para entrega pública.
- Reprocesar automáticamente toda la librería histórica durante el deploy.
