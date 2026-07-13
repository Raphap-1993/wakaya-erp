# Decisiones UX - Wakaya Public Content Hub

[README principal](../../../README.md) | [Specs](../../README.md)

## Golden de referencia
- Wakaya backoffice shell actual.
- `004-bungalow-backoffice-media` para gestión visual de activos.
- `005-home-content-management` para publicación, editor ES/EN, preview y estados.

## Dominio del spec: centro editorial estructurado para Home, experiencias, galería y contenido público de tipos de bungalow de Wakaya.

## Actor principal: Editor de contenido con permiso `content:write`.

## Tarea principal navegable: mantener contenido ES/EN y media desde `/admin/content`, validar el resultado y publicar sin editar código.

## Patrón visual elegido
Workbench editorial list-first. La navegación por dominio queda en tabs persistentes; la lista y el editor comparten una grilla de dos zonas. La acción principal vive en la cabecera y, en mobile, queda sticky durante edición.

Patrón visual elegido: workbench editorial list-first con lista y editor en dos zonas.

Justificación de no-shell-genérica: esta feature debe mantener cuatro dominios, localización, media y preview sin convertir la superficie en un CRUD indiferenciado.

Interacciones mock obligatorias: cambiar tab, seleccionar y crear experiencia, editar ES/EN, completar crop dual, reordenar galería, abrir popup por URL, publicar y simular estados.

## Ritmo y jerarquía
- escala base de 8 px y medio paso de 4 px solo en metadata;
- 16 px dentro de grupos, 24-32 px entre subsecciones y 48 px entre cambios mayores;
- agrupación por espacio y divisores, no por cards anidadas;
- una sola acción primaria contextual;
- lista compacta y editor respirable; el preview no compite con los campos.

## Decisiones de interacción
- Home conserva rail, editor y preview de la feature 005, pero dentro del tab único.
- Experiencias abre list-first; agregar crea un borrador y editar conserva slug estable.
- El hero no puede aplicarse hasta completar ambos recortes. Cambiar de ratio conserva el avance visible.
- Galería permite reordenar por botones además de drag-and-drop.
- Bungalows edita la ficha del tipo; `Abrir inventario de unidades` sale del dominio editorial.
- El popup público usa el query param como estado y conserva los demás parámetros.

## Responsive
- desktop: lista de 304 px y editor flexible;
- tablet: lista arriba y editor debajo;
- mobile: tabs desplazables, una columna, formularios sin compresión y crop a pantalla completa.

## Anti-patrones evitados
- page builder libre;
- URLs manuales como flujo principal;
- cards dentro de cards;
- copy ornamental en backoffice;
- mezclar ficha pública del tipo con unidades físicas.

## Contrato del prototipo
- Estados: loading, empty, error, success, unauthorized, procesamiento, crop incompleto, resolución insuficiente, conflicto 409, slug inexistente
- Roles: Editor de contenido, Administrador, Operador, Visitante
- Entidades: Home, experiencia, galería, activo de media, tipo de bungalow, booking request
- RF representados: RF-006-01, RF-006-02, RF-006-03, RF-006-04, RF-006-05, RF-006-06, RF-006-07, RF-006-08, RF-006-09, RF-006-10, RF-006-11, RF-006-12, RF-006-13
