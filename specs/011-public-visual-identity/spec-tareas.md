# Spec tareas - Identidad visual pública

## T-011-001 - Gobernanza visual

Objetivo: fijar por prueba los tokens, familias y retiro de dorados.

Ciclo TDD:
1. Red: `style-governance.test.ts` falla por ausencia de tokens y por estilos dorados.
2. Green: agregar fuentes, tokens y migrar módulos públicos.
3. Refactor: concentrar decisiones en variables semánticas.

Comando: `npm test -- --run src/app/style-governance.test.ts`

## T-011-002 - Integración pública

Objetivo: aplicar Lora/Montserrat y la paleta al shell y páginas públicas sin
alterar el backoffice.

Comandos: `npm run typecheck`, `npm run build` y pruebas públicas focalizadas.

## T-011-003 - QA y publicación

Objetivo: registrar evidencia, ejecutar suite proporcional al riesgo y publicar
el commit directamente en `main`, sin crear ramas.
