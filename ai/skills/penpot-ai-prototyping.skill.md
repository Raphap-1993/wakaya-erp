# Skill: Penpot AI Prototyping

## Objetivo
Convertir artefactos Product Design y SPDD en instrucciones, prompts o cambios directos en Penpot para crear prototipos formales validables.

## Aplicala cuando
- una feature visual requiere prototipo formal,
- existe `spdd-frontend.md`,
- se necesita crear wireframe, mockup o prototipo navegable,
- se usara Penpot manualmente o via MCP,
- el proyecto requiere colaboracion UX, design system o aprobacion visual.

## No la apliques cuando
- no hay Product Design minimo,
- no hay flujo de usuario,
- la feature no tiene superficie visual,
- se quiere saltar validacion de prototipo,
- un prototipo HTML5 rapido es suficiente para la iteracion actual.

## Entradas minimas
- `product-design.md`,
- `spdd-frontend.md`,
- `prototype.md`,
- `ui-test-cases.md` si existe,
- design system o tokens si existen.

## Flujo recomendado
1. Leer Product Design.
2. Leer SPDD.
3. Identificar pantallas.
4. Identificar estados UI.
5. Definir componentes y variantes.
6. Generar prompt Penpot.
7. Si hay MCP, crear o actualizar frames en Penpot.
8. Registrar link/export en `prototype.md`.
9. Preparar `prototype-validation.md`.
10. Aplicar `gate-prototype-ready`.
11. Aplicar `gate-spdd-approved` solo despues de validacion humana.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Penpot existe, entonces SPDD esta aprobado | No. Falta validacion humana registrada |
| El MCP puede decidir el diseno final | La IA propone o edita; negocio/UX valida |
| El prompt generado basta | El prompt no es evidencia de prototipo |

## Red flags
- SPDD sin pantallas.
- Estados UI incompletos.
- Prototipo sin validacion.
- IA modificando Penpot sin revision humana.
- Componentes sin nombres consistentes o sin mapping a Angular.

## Verification evidence
- prompt Penpot generado o cambios MCP registrados,
- link Penpot o export,
- `prototype.md` actualizado,
- `prototype-validation.md` actualizado,
- gate de prototipo aplicado,
- gate SPDD aplicado solo con aprobacion.

## Referencias
- `../../docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md`
- `../commands/prototype-command.md`
- `../quality-gates/gate-prototype-ready.md`
- `../quality-gates/gate-spdd-approved.md`
