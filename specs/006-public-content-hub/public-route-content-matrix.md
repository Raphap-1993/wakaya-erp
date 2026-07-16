# Matriz de contenido público administrable

Fecha de auditoría: 2026-07-16. La fuente editorial común es `corporate_content_revision.document.publicSite`; Home conserva su documento especializado y las colecciones repetibles conservan sus tablas propias. Los archivos optimizados y su metadata se registran en `media_asset` y `media_variant`.

| Ruta | Secciones públicas | Gestión desde `/admin/content` | Medio principal | API / persistencia |
| --- | --- | --- | --- | --- |
| `/{locale}` | slider, buscador, historia, bungalows, experiencias, testimonios, cierre | textos, CTA, orden, visibilidad, tipografía y medios | medios del documento Home | `/api/admin/home-content`, `/api/admin/home-content/media`; `home_content_revision`, `media_asset`, `media_variant` |
| `/{locale}/about` | hero, historia, propósito, valores, CTA | ES/EN, SEO, textos y hero/secundaria | `publicSite.media.aboutHero/aboutSecondary` | `/api/admin/corporate-content`; `corporate_content_revision`, medios |
| `/{locale}/bungalows` | hero, filtros, tarjetas y vacío | SEO, hero, microcopy; tarjetas desde fichas de bungalow | `bungalowsHero`, `heroAssetId`, `galleryAssetIds` | `/api/admin/corporate-content`, `/api/admin/content/bungalows/:id`; `corporate_content_revision`, `bungalow_public_content`, medios |
| `/{locale}/bungalows/{slug}` | breadcrumb, galería, ficha, amenidades, reseñas, solicitud | textos comunes, ficha ES/EN, orden/visibilidad, tarifa/área, hero y galería | IDs de la ficha; el hero no forma parte de la lista reordenable | mismas API/tablas de Bungalows; testimonios en revisión corporativa |
| `/{locale}/services` | hero, catálogo de experiencias, modal, CTA | SEO/copy de página; CRUD, orden, visibilidad, copy ES/EN y medios por experiencia | `servicesHero`, `content_experience` asset IDs | `/api/admin/corporate-content`, `/api/admin/content/experiences`; `corporate_content_revision`, `content_experience`, medios |
| `/{locale}/gallery` | hero y mosaico | SEO/copy; alta, eliminación, orden, visibilidad y metadata ES/EN | `galleryHero` y `content_gallery_item.asset_id` | `/api/admin/corporate-content`, `/api/admin/content/gallery`; `corporate_content_revision`, `content_gallery`, `content_gallery_item`, medios |
| `/{locale}/events` | hero, propuesta y CTA | SEO, textos ES/EN y hero | `eventsHero` | `/api/admin/corporate-content`; `corporate_content_revision`, medios |
| `/{locale}/publications` | hero, tarjetas y CTA final | SEO, textos ES/EN, artículos y hero | `publicationsHero` | `/api/admin/corporate-content`; `corporate_content_revision`, medios |
| `/{locale}/contact` | hero, canales y formulario | SEO, copy ES/EN, etiquetas principales y hero; datos del negocio en contacto corporativo | `contactHero` | `/api/admin/corporate-content`; `corporate_content_revision`, medios |
| `/{locale}/faq` | hero, preguntas y CTA | CRUD de preguntas ES/EN, SEO, textos y hero | `faqHero` | `/api/admin/corporate-content`; `corporate_content_revision`, medios |
| `/{locale}/testimonials` | hero y testimonios | CRUD ES/EN, SEO, textos y hero | `testimonialsHero`; las imágenes históricas siguen dentro del documento corporativo | `/api/admin/corporate-content`; `corporate_content_revision`, medios |
| `/{locale}/hotel-policies` | hero, términos y privacidad | secciones ES/EN, anclas obligatorias, SEO y hero | `policiesHero` | `/api/admin/corporate-content`; `corporate_content_revision`, medios |
| `/{locale}/pet-friendly` | hero, reglas y CTA | SEO, copy ES/EN, listas, CTA y hero | `petFriendlyHero` | `/api/admin/corporate-content`; `corporate_content_revision`, medios |
| `/{locale}/complaints-book` | hero, orientación y formulario legal | SEO, hero, tarjetas y encabezado del formulario ES/EN | `complaintsHero` | `/api/admin/corporate-content`; `corporate_content_revision`, medios; envío en API pública de reclamos |
| layout público | header, navegación y footer | marca, logo, etiquetas, orden y visibilidad del menú, intro y encabezados del footer, contacto | `logo` | `/api/admin/corporate-content`; `corporate_content_revision`, medios |

## Contenido funcional que permanece en código

No es contenido editorial de campaña y se mantiene estable por contrato de producto o legal:

- rutas internas y destinos de navegación;
- mensajes transaccionales de disponibilidad, envío de reservas y errores de red;
- etiquetas completas, opciones documentales y mensajes de éxito/error del formulario del Libro de Reclamaciones;
- iconos, unidades, horarios de check-in/check-out y etiquetas técnicas de la ficha de bungalow;
- nombres de redes sociales y sus URLs oficiales en el footer.

Las URLs visuales históricas solo son valores iniciales de compatibilidad. Cuando el administrador reemplaza una imagen, el documento guarda `{ kind: "asset", assetId }` y la URL pública se deriva del ID y la variante solicitada.

## Invariantes de medios

- `heroAssetId` es independiente de `galleryAssetIds`; reordenar la galería no modifica el hero.
- Al guardar se usa la respuesta real del servidor y su `version`, no una reconstrucción optimista del payload.
- El borrado consulta referencias de Home, contenido corporativo, experiencias, galería y bungalows antes de eliminar un asset.
- Los recortes se procesan una sola vez por interacción; el diálogo permanece abierto ante error y bloquea cierre, pestañas y reenvío durante el procesamiento.
