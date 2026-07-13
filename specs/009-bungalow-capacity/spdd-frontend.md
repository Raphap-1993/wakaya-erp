# SPDD Frontend - Wakaya Bungalow Capacity

## Superficie

`/admin/bungalow-capacity` es un workbench administrativo compacto. No mezcla
contenido público ni reserva individual.

## Jerarquía

1. Título `Cupos de bungalows`.
2. Rango check-in/checkout y acción `Consultar`.
3. Tabla de cinco categorías.
4. Acción contextual `Editar total`.

## Tabla

Cada fila muestra `Categoría`, `Total físico`, `Fecha crítica`, `Reservadas`,
`Disponibles` y `Acciones`. La fecha crítica es la primera noche
del rango con menor disponibilidad; todos los conteos de la fila corresponden
a esa misma fecha.

## Formularios

- Editar total: cantidad y versión esperada.

## Estados

Cargando, sin categorías, error, guardado, acceso denegado y reducción en
conflicto.

## Responsive y accesibilidad

- Desktop: tabla y panel lateral contextual.
- Mobile: categorías en tarjetas y formulario a ancho completo.
- Labels explícitos, foco visible, feedback anunciado y estados no dependientes
  solo del color.

## Gate

La construcción productiva permanece bloqueada hasta aprobación humana de
`prototype-html5/index.html`.
