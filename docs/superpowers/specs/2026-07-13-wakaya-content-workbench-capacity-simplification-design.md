# Wakaya Content Workbench and Capacity Simplification Design

<!-- nav-guided:start -->
## Navegación guiada
- Anterior: [Wakaya Bungalow Capacity Design](2026-07-12-wakaya-bungalow-capacity-design.md)
- Siguiente: [Plan de implementación](../plans/2026-07-13-wakaya-content-workbench-capacity-simplification.md)
<!-- nav-guided:end -->

## Objetivo

Convertir `Contenido público` en un backoffice editorial rápido para tareas
diarias y retirar temporalmente los bloqueos agregados de cupos, porque Wakaya
todavía no ha modelado qué bungalow físico entra en mantenimiento.

## Decisión aprobada

El Product Owner aprobó el 2026-07-13 un editor estructurado inspirado en el rol
de contenido de Webflow, las secciones de Shopify y la separación entre páginas,
estructura y estilos globales de WordPress.

No se construirá un page builder, edición inline sobre la web ni preview fijo.
La revisión se realizó como wireframe textual por decisión explícita del Product
Owner; no se abrirá un prototipo en navegador para este incremento.

## Superficie editorial

`/admin/content` comienza con cinco accesos: Home, Páginas, Experiencias,
Galería y Bungalows. Cada acceso muestra estado, última modificación y una sola
acción `Editar` o `Gestionar`.

Dentro de un módulo se usa el mismo patrón:

```text
Contenido público > Home

Home                         Publicado
Última actualización         [Vista previa] [Guardar y publicar]

┌────────────────────┐  ┌──────────────────────────────────┐
│ Secciones o items  │  │ Elemento seleccionado            │
│                    │  │ [ES] [EN]                        │
│ Slider principal   │  │ Contenido                        │
│ Reserva            │  │ Imagen                           │
│ Historia           │  │ Visibilidad y orden              │
│ Bungalows          │  │ ▸ Opciones avanzadas             │
│ ...                │  │                                  │
│ Configuración web  │  │                                  │
└────────────────────┘  └──────────────────────────────────┘
```

## Jerarquía de uso

1. Contenido: título, descripción y CTA.
2. Imagen o galería.
3. Visibilidad y orden.
4. Opciones avanzadas plegadas: tipografía, pesos, píxeles y slug.

IDs, asset IDs, URLs legadas y detalles de persistencia no forman parte de la
interfaz. ES y EN comparten media, orden y visibilidad y se editan de uno en uno.

La vista previa y el historial se abren bajo demanda. El menú público y sus
estilos globales viven en `Configuración web`; no se repiten en cada sección.

## Cupos sin bloqueos

`/admin/bungalow-capacity` conserva filtro de rango, total físico, fecha crítica,
reservadas, disponibles y `Editar total`.

Se retiran de UI, API activa y cálculo:

- `Bloquear cupos`;
- columna `Bloqueadas`;
- lista y cancelación de bloqueos;
- descuento de bloqueos históricos.

La regla vigente queda:

```text
disponibles = total físico - reservas confirmadas
```

`bungalow_capacity_block` y los registros migrados permanecen como legado de
solo auditoría y rollback. Ningún registro legado reduce disponibilidad de forma
oculta. No se eliminan tablas en este incremento.

## Alcance técnico

- Reusar rutas, stores y documentos existentes; no agregar CMS externo.
- Mantener publicación inmediata con versión optimista y revisiones.
- Mantener contratos públicos sanitizados y el cálculo agregado por categoría.
- Retirar route handlers de creación/cancelación de bloqueos.
- No cambiar `bungalow.capacity`, que continúa representando huéspedes.

## Gates

- `gate-ux-ready`: aprobado textualmente el 2026-07-13.
- `gate-prototype-ready`: aprobado mediante wireframe textual; excepción de
  prototipo en navegador solicitada por el Product Owner.
- `gate-spdd-approved`: aprobado textualmente el 2026-07-13.
- `gate-4-6`: abierto para TDD, implementación y QA local.
- Producción: bloqueada hasta demostración local y aprobación posterior.
