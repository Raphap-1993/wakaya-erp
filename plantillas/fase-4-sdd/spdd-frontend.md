> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.

# SPDD Frontend - <Titulo de la feature>

## Componentes principales
- `<NombreComponente>` — <responsabilidad>
- `<NombreComponente>` — <responsabilidad>

## Estados UI

| Estado | Trigger | Comportamiento esperado |
|---|---|---|
| loading | fetch inicial | spinner centrado, skeleton si tabla |
| empty | API devuelve [] | mensaje + CTA primaria |
| error | API devuelve 4xx/5xx | mensaje recuperable + boton retry |
| success | datos cargados | render contenido |
| permission-denied | API devuelve 403 | mensaje rol y contacto |
| validation-error | input invalido | mensaje inline en campo |

## Permisos visibles

| Rol | Componentes visibles | Acciones permitidas |
|---|---|---|
| <Rol-A> | <componentes> | <acciones> |
| <Rol-B> | <componentes> | <acciones> |

## Feedback UX
- Toast: <para cuando> (ej. "Cambios guardados")
- Modal: <para cuando> (ej. confirmar borrado)
- Confirm: <para cuando> (ej. accion destructiva)
- Progress: <para cuando> (ej. carga de archivo)

## Accesibilidad
- Focus rings visibles (`:focus { outline: 2px solid var(--brand); }`)
- Labels asociados a inputs
- aria-label en botones icon-only
- Contraste >= 4.5:1 para texto principal

## Responsive
- Breakpoints: 480px (mobile), 768px (tablet), 1024px (desktop)
- Layout: <stack mobile, grid 2 cols tablet, grid 3-4 cols desktop>

## Trazabilidad hacia codigo
- Cada componente lleva comentario `// @trace RF-NN` (o el RF que implementa).
- Test correspondiente: `<componente>.test.tsx` con `// @trace RF-NN`.
