# Spec tareas - Wakaya Content Editor Workbench

## T-010-001 - Inicio editorial

Red: test exige cinco módulos cuando no existe `tab`.
Green: vista overview y deep links.
Refactor: microcopy y estados breves.

Comando: `npm test -- src/app/admin/content/page.test.tsx src/app/admin/content/content-hub.test.tsx`

## T-010-002 - Home enfocado

Red: preview/historial no visibles inicialmente y opciones avanzadas plegadas.
Green: dos columnas, drawers y configuración web separada.
Refactor: preservar dominio y helpers existentes.

Comando: `npm test -- src/app/admin/home/home-editor.test.tsx && npm run typecheck`

## T-010-003 - Consistencia de módulos

Red: tests de Experiencias, Galería, Páginas y Bungalows verifican lista/editor,
idiomas y una acción primaria.
Green: jerarquía y grupos comunes.
Refactor: compartir componentes presentacionales solo cuando reduce duplicación.

Comando: `npm test -- src/app/admin/content/content-hub.test.tsx src/app/admin/content/corporate-content-editor.test.tsx`

## T-010-004 - QA

Suite, typecheck, lint focalizado, build y Playwright autenticado. Registrar
evidencia y detenerse antes de producción.
