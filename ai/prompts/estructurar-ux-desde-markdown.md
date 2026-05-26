# Prompt Estructurar UX Desde Markdown

## Objetivo
Tomar una descripcion UX en Markdown y convertirla en una estructura lista para validacion, prototipo HTML5 y Penpot si aplica.

## Usalo cuando
- el Product Owner ya describio pantallas o journeys en texto,
- se quiere ordenar la experiencia antes del prototipo navegable,
- hace falta detectar estados faltantes o huecos UX.

## No lo uses cuando
- aun no existe descripcion funcional minima,
- la necesidad real es implementar frontend productivo y no estructurar UX.

## Entradas minimas
- documento UX base,
- actores o journeys,
- reglas visibles.

## Salida esperada
- mapa de pantallas,
- componentes clave,
- estados de interfaz,
- preguntas abiertas,
- trazabilidad hacia prototipo HTML5, Penpot y frontend real posterior.

## Rutas destino
- `docs/fase-2-ux-ui/02.00-ux-ui.md`
- `docs/fase-2-ux-ui/02.09-spec-driven-product-design.md`
- `docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md`
- `docs/fase-2-ux-ui/02.14-html5-first-prototyping.md`
- `docs/fase-2-ux-ui/journeys/*`
- `docs/fase-2-ux-ui/pantallas/*`

## Verificacion minima
- Se cubren happy path, vacio, error y confirmacion.
- La salida distingue UX base de implementacion frontend.
- El resultado es compatible con prototipo HTML5, Penpot si aplica y frontend real posterior.

## Pedido base
```md
Actua como UX Designer AI-first con foco en trazabilidad.

Toma la descripcion UX en Markdown y conviertela en una estructura navegable para negocio, prototipo HTML5 y Penpot si aplica.

Obligatorio:
- separa journeys, pantallas, componentes y estados,
- incluye errores, estados vacios y confirmaciones,
- marca preguntas abiertas y dependencias funcionales,
- no conviertas esto en codigo final,
- deja trazabilidad con requerimientos y reglas visibles.

Entrega:
1. estructura UX propuesta,
2. mapa de pantallas,
3. componentes y estados,
4. huecos por validar,
5. siguiente paso hacia HTML5-first o Penpot.
```
