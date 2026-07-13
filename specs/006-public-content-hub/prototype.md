# Prototype - Wakaya Public Content Hub

[README principal](../../README.md) | [Specs](../README.md)

## Modo
HTML5-first, autocontenido y navegable.

## Ruta del prototipo
- `specs/006-public-content-hub/prototype-html5/index.html`
- `specs/006-public-content-hub/prototype-html5/decisiones-ux.md`
- `specs/006-public-content-hub/prototype-html5/flujo.md`

## Superficies demostradas
- entrada única con tabs `Home`, `Experiencias`, `Galería` y `Bungalows`;
- Home heredado de `005-home-content-management` dentro del nuevo shell;
- lista y editor ES/EN de experiencias con alta, edición, ocultamiento y archivo;
- ajuste obligatorio de hero en `Desktop 16:9` y `Mobile 4:5`;
- galería global ordenable con alt ES/EN;
- ficha pública por tipo de bungalow, separada del inventario de unidades;
- popup público controlado por `?experience=<slug>` y CTA al formulario;
- referencia de experiencia visible en el detalle de booking request;
- loading, vacío, validación, éxito, conflicto `409`, lectura `403` y slug inexistente.

## Datos Wakaya representados
- ocho experiencias públicas actuales, incluidas Kayak en el Río, Full Day en la Laguna, Avistamiento de Aves y Piscina & Relax;
- galería global de 18 activos;
- cuatro tipos públicos: Familiar, Matrimonial, Doble y Triple;
- Home publicado en versión 18 por `admin@wakaya.local`.

## Alcance
- No conecta a APIs ni persiste cambios.
- No procesa archivos reales.
- Sí representa navegación, jerarquía, estados, reglas de crop, edición bilingüe y comportamiento URL-driven.
