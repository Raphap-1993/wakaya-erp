# Prompt: Generar prototipo Penpot desde SPDD

## Objetivo
Crear instrucciones completas para generar o actualizar un prototipo Penpot desde Product Design y SPDD.

## Usalo cuando
- una feature visual necesita diseno formal,
- existe `spdd-frontend.md`,
- se usara Penpot manualmente o mediante MCP,
- se requiere colaboracion, design system o handoff visual.

## No lo uses cuando
- no hay Product Design minimo,
- no existe flujo de usuario,
- el equipo solo necesita una primera validacion rapida HTML5,
- se pretende aprobar SPDD solo con un prompt.

## Entradas minimas
- `specs/<feature>/product-design.md`
- `specs/<feature>/spdd-frontend.md`
- `specs/<feature>/ui-test-cases.md`
- `ai/skills/spec-prototype-driven-frontend.skill.md`
- `ai/references/ux-accessibility-and-mocks.md`

## Salida esperada
```text
ai/prompts/generated/crear-prototipo-penpot-<feature>.md
```

Tambien debe proponer actualizacion de:
```text
specs/<feature>/prototype.md
specs/<feature>/prototype-validation.md
```

## Debe producir
1. Lista de pantallas.
2. Estructura de cada pantalla.
3. Componentes y variantes.
4. Estados UI.
5. Interacciones y links de navegacion.
6. Notas de accesibilidad.
7. Datos mock.
8. Criterios de validacion.
9. Nombres recomendados de paginas, frames y capas.

## Pedido base
```md
Usa:
- specs/<feature>/product-design.md
- specs/<feature>/spdd-frontend.md
- specs/<feature>/ui-test-cases.md

Crea instrucciones para un prototipo Penpot de la feature <feature>.

Incluye:
- paginas y frames
- componentes reutilizables
- variantes loading, empty, error y permission denied
- interacciones entre pantallas
- placeholders de datos mock
- notas de accesibilidad
- criterios de validacion
- convencion de nombres en kebab-case para frames y capas

Genera la salida en:
ai/prompts/generated/crear-prototipo-penpot-<feature>.md

No declares SPDD aprobado. Deja prototype-validation.md como PENDIENTE hasta validacion humana.
```

## Verificacion minima
- El prompt generado permite crear el prototipo sin ambiguedad.
- `prototype.md` puede registrar link/export Penpot y prompt usado.
- `prototype-validation.md` distingue pendiente, aprobado y aprobado con observaciones.
