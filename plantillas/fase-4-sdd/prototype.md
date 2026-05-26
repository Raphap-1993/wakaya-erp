> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.

# Prototipo - <Titulo de la feature>

## Objetivo del prototipo
<Que validar con el prototipo: flujos, estados, jerarquia visual, permisos.>

## Patron visual elegido
<Elegir uno: SaaS operativo / Streaming-catalogo / Dashboard / E-commerce / Educacion>

Referencia: `ejemplos/fase-2-ux-ui/prototype-html5-golden/<patron>/index.html` (el golden es REFERENCIA de nivel, NO plantilla a copiar tal cual).

## Sistema visual e identidad
> OBLIGATORIO: todos los prototipos pertenecen al MISMO producto y comparten marca,
> tokens, tipografia, botones, estados, modales y toasts. Lo que cambia por feature
> es la estructura: layout, jerarquia, flujo y componentes propios del dominio.
> `check:prototype-diversity` es CIEGO al color: recolorear el mismo esqueleto NO pasa.
> Si hay varias features del mismo dominio, varia el layout (o usa
> `scaffold:prototype --freeform`) sin cambiar el look and feel del producto.

- **Layout/shell propio**: <topbar+sidebar+tabla | hero+grid | dashboard de cards | wizard | catalogo+player | ...>
- **Tokens compartidos**: <brand_hue, tipografia, espaciado, radios, sombras y estados del producto>
- **Acento secundario opcional**: <solo si ayuda a identificar la vertical sin romper la marca>
- **Componentes caracteristicos**: <los 2-3 componentes que hacen RECONOCIBLE esta feature>
- **En que se DIFERENCIA estructuralmente** de las otras features del proyecto: <layout/jerarquia/densidad/flujo distintos>

## Anatomia
- **Topbar**: <logo + busqueda + perfil + notificaciones>
- **Sidebar/Nav**: <secciones principales>
- **Main content**: <cards / table / hero / grid segun dominio>
- **Detail panel / modal**: <si aplica>

## Estados UI que el prototipo debe cubrir
- loading (spinner / skeleton)
- empty (sin datos + CTA)
- error (mensaje recuperable + boton retry)
- success / populated (caso feliz)
- permission denied (rol sin permiso)

## Datos mock
- <N> registros del dominio (ej. 16 <entidad>s).
- Variedad: <al menos 3 estados distintos, 2-3 roles distintos>.
- IDs legibles (formato <ENTIDAD>-YYYY-NNNN).

## Roles representados
| Rol | Que ve | Que NO ve |
|---|---|---|
| <Rol-A> | <vistas + acciones> | <permisos restringidos> |
| <Rol-B> | <vistas> | <permisos restringidos> |

## Microinteracciones esperadas (nivel 3 de rubrica)
- Hover en filas: revela acciones contextuales (opacity 0 -> 1).
- Focus en inputs: border-color brand + box-shadow.
- Boton primario hover: darken + transform scale(1.02).
- Toast/modal con animacion suave (0.2s ease).

## Tokens CSS esperados (12+ para nivel 3)
- `--brand`, `--brand-light`, `--brand-dark`
- `--success`, `--warning`, `--danger`, `--info`
- `--neutral-50`...`--neutral-900` (escala 9 valores)
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- `--radius`, `--transition`, `--font`, `--font-mono`

## Responsive
- Desktop: <layout completo>
- Tablet (<=900px): <reflow>
- Mobile (<=480px): <stack vertical, sidebar oculto>
