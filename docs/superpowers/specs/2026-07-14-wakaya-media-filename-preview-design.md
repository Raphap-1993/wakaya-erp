# Diseño de nombre original y vista previa de imágenes públicas

Fecha: 2026-07-14
Proyecto: Wakaya ERP
Estado: aprobado por el usuario para especificación

## Problema

Las superficies de Contenido público permiten seleccionar, recortar, optimizar
y asociar imágenes, pero el Home reduce el resultado a `Imagen asociada`. El
operador no puede identificar qué archivo cargó ni abrirlo desde ese campo para
revisarlo. Experiencias, Galería y Bungalows muestran algunas miniaturas, pero
no aplican una identificación ni una interacción de vista previa uniforme.

El personal debe poder reconocer el archivo por su nombre original y extensión,
y abrir la imagen asociada en un popup sin abandonar el formulario.

## Decisión

Cada activo administrado conservará `original_filename` como metadata de
auditoría. La interfaz mostrará ese nombre como una acción clicable y reutilizará
un único popup accesible en todas las superficies de media de Contenido público.

El nombre visible será el nombre original elegido por el usuario, por ejemplo
`selva-wakaya.jpg`. No se mostrará como identificador principal el nombre de la
variante técnica (`heroDesktop.webp`, `detail.webp` o `thumb.webp`). La extensión
visible describe el archivo de entrada; la imagen entregada al sitio público
continuará siendo la variante WebP optimizada.

## Alcance de superficies

El comportamiento se aplicará a todas las superficies que permiten subir
imágenes dentro de `/admin/content`:

- Home: slides del slider, Historia, Frase destacada y Cierre;
- Experiencias: Cover / card y Hero;
- Galería global: imagen de cada registro;
- Bungalows: Hero y cada imagen de la galería pública.

Páginas no contiene actualmente un selector de imágenes y, por tanto, no
requiere cambios en este incremento.

La ficha operativa separada `/admin/bungalows/[id]` seguirá siendo una
superficie de compatibilidad. Como también permite subir portada y galería,
recibirá el mismo nombre clicable y popup para que no exista una segunda
experiencia administrativa incoherente. La unificación de su crop con
`/admin/content` permanece cubierta por el diseño adaptativo de media y no se
amplía dentro de este incremento.

## Persistencia y contrato de media

La migración será aditiva:

```sql
alter table media_asset
  add column if not exists original_filename text;
```

La columna será nullable para activos históricos. Toda carga nueva debe guardar
un nombre normalizado. La normalización:

- toma únicamente el basename que entrega `File.name`;
- elimina caracteres de control y separadores de ruta;
- conserva caracteres legibles, espacios y la extensión original;
- limita el resultado a 180 caracteres sin eliminar la extensión;
- usa `imagen` más la extensión detectada cuando el nombre queda vacío.

El nombre es metadata de presentación y auditoría. Nunca participa en la ruta
de storage ni se usa para resolver un archivo; los binarios mantienen claves
inmutables basadas en `assetId` y variante.

`ContentMediaAsset` agregará `originalFilename`. La respuesta de
`POST /api/admin/content/media` lo devolverá junto con el activo y sus variantes.
El servicio expondrá una lectura en lote de descriptores por `assetId` para que
la página administrativa hidrate nombres existentes sin una petición por campo.

## Resolución de metadata existente

`/admin/content` recopilará los IDs de media presentes en Home, Experiencias,
Galería y Bungalows. En Home, donde el documento v2 todavía guarda una URL, el
ID se extraerá únicamente de rutas administradas con la forma
`/media/assets/<assetId>/<variant>.webp`. Las URLs externas o legadas no se
interpretarán como IDs.

La página consultará esos IDs en un solo lote y pasará un mapa serializable:

```ts
type AdminMediaDescriptor = {
  assetId: string | null;
  originalFilename: string;
  previewUrl: string;
};
```

Después de una carga exitosa, el cliente incorporará el descriptor devuelto al
mapa local. El nombre aparecerá de inmediato y continuará visible al recargar.

Para activos históricos sin `original_filename`, la UI derivará un fallback
seguro desde el último segmento de la URL. El fallback puede ser
`heroDesktop.webp`; se reemplazará por el nombre original en la próxima carga,
sin reescribir revisiones históricas.

## Componente compartido

Se creará un componente de referencia visual con dos responsabilidades:

1. mostrar el nombre y extensión como botón de apariencia secundaria;
2. abrir el popup compartido con la URL de preview asociada.

El popup incluirá:

- encabezado `Vista previa de imagen`;
- nombre original completo;
- imagen contenida dentro del viewport, sin deformación;
- botón `Cerrar`;
- cierre con tecla `Escape` y clic en el backdrop;
- `role="dialog"`, `aria-modal="true"` y título accesible;
- foco inicial en `Cerrar` y devolución del foco al nombre que lo abrió.

El nombre tendrá truncamiento visual cuando sea largo, pero conservará el texto
completo en su nombre accesible y atributo `title`. No se abrirá una pestaña ni
se expondrán rutas internas adicionales.

## Flujo operativo

1. el operador selecciona una imagen;
2. completa el crop obligatorio vigente;
3. `ContentMediaService` procesa y guarda master/variantes WebP;
4. el servicio persiste `original_filename` en la misma creación del activo;
5. la API devuelve URL, variantes y nombre original;
6. el formulario asocia el activo y muestra el nombre clicable;
7. al pulsarlo, el popup muestra la variante apropiada para ese campo;
8. la publicación conserva el flujo de versión y validación existente.

Para Home se previsualiza `heroDesktop` en slides y `detail` en secciones. Para
Experiencias se usa `card` o `heroDesktop`; Galería y galería de Bungalows usan
`detail`; el Hero de Bungalows usa `heroDesktop`.

## Errores y compatibilidad

- Si falta metadata, se usa el basename seguro de la URL.
- Si no hay imagen asociada, se conserva `Sin imagen asociada` y no se abre el
  popup.
- Si la URL de preview falla, el popup muestra `No se pudo cargar la imagen`
  y permite cerrar normalmente.
- Una falla al guardar metadata falla la creación del activo; no se publica un
  activo `ready` sin el nombre en cargas nuevas.
- Activos históricos con columna nula continúan siendo válidos.
- La migración no modifica binarios, URLs ni documentos publicados.

## Validación

La implementación deberá demostrar:

- normalización del nombre, extensión, rutas falsas, caracteres de control y
  límite de longitud;
- persistencia y lectura en lote de `original_filename`;
- respuesta de upload con `originalFilename`;
- fallback estable para activos históricos y URLs externas;
- nombre visible inmediatamente después de cargar y después de recargar;
- popup accesible, cierre por botón, Escape y backdrop, y restauración de foco;
- integración en Home, Experiencias, Galería y Bungalows;
- integración en la ficha separada `/admin/bungalows/[id]`;
- no regresión del crop, optimización, publicación ni visualización pública;
- Playwright autenticado recorriendo al menos Home y una superficie de
  `ContentHub`, con captura visual del popup.

## Despliegue y rollback

Este incremento se validará primero en localhost y se detendrá antes de
producción. Un despliegue posterior requiere backup de PostgreSQL, migración
aditiva, build standalone, reinicio y smoke autenticado.

El rollback de código puede conservar la columna nullable. No se eliminará
`original_filename` ni se restaurará la base para revertir únicamente la UI.

## Fuera de alcance

- Renombrar archivos ya almacenados o cambiar sus claves públicas.
- Editar el nombre original desde el backoffice.
- Descargar originales desde el popup.
- Reprocesar activos históricos.
- Completar en este incremento el schema v3 adaptativo de Home.
