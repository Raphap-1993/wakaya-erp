# Wakaya Content Workbench and Capacity Simplification Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Diseño aprobado](../specs/2026-07-13-wakaya-content-workbench-capacity-simplification-design.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->

> Ejecutar con `superpowers:executing-plans`, TDD y verificación fresca. El
> checkout actual contiene la base no versionada de las features 005-009; se
> trabaja en la rama `codex/wakaya-public-inventory-source-truth` sin
> `stash/reset` y sin commits automáticos.

**Goal:** Simplificar la edición diaria de contenido y retirar los bloqueos de
cupos sin perder prevención de sobreventa por reservas confirmadas.

**Architecture:** Conservar el monolito Next.js, los documentos editoriales y
la publicación versionada. La UI editorial pasa a un workbench de dos columnas
con navegación por módulos y acciones secundarias bajo demanda. Capacidad se
calcula únicamente con totales y reservas confirmadas; las tablas de bloqueos
quedan legadas y desconectadas.

**Tech Stack:** Next.js 16, React 19, TypeScript, PostgreSQL, Vitest y Playwright.

## Task 1 - Cerrar specs y gate textual

**Files:** `specs/010-content-editor-workbench/**`, `specs/009-bungalow-capacity/**`,
`docs/superpowers/specs/**`, `specs/README.md`.

- [ ] Registrar diseño aprobado y wireframe textual.
- [ ] Actualizar 009 para que bloques sean legado sin efecto.
- [ ] Validar coherencia documental focalizada.

## Task 2 - Retirar bloqueos con TDD

**Files:** `src/lib/bungalow-capacity/**`, `src/app/api/admin/bungalow-capacity/**`,
`src/app/api/public/availability/**`, `src/app/admin/bungalow-capacity/**`.

- [ ] Red: tests exigen que bloques activos no descuenten, que GET no exponga
  bloqueos y que la UI no permita crearlos/cancelarlos.
- [ ] Green: retirar los route handlers, lecturas y campos operativos de bloqueos.
- [ ] Refactor: conservar tipos/store legado solo donde sea necesario para
  auditoría y migración.
- [ ] Verificar tests focalizados y typecheck.

## Task 3 - Crear entrada editorial operativa con TDD

**Files:** `src/app/admin/content/**`.

- [ ] Red: `/admin/content` sin tab muestra los cinco módulos con estado y CTA.
- [ ] Green: agregar vista de inicio y conservar deep links existentes.
- [ ] Refactor: eliminar copy redundante y mantener una acción principal.

## Task 4 - Simplificar Home con TDD

**Files:** `src/app/admin/home/**`.

- [ ] Red: preview e historial no se renderizan inicialmente; existen botones
  bajo demanda; `Configuración web` está separada y `Opciones avanzadas` plegada.
- [ ] Green: layout de dos columnas, drawers accesibles y selector global.
- [ ] Refactor: conservar documento, validación y publicación sin cambios.

## Task 5 - Homogeneizar módulos restantes

**Files:** `src/app/admin/content/**`.

- [ ] Aplicar encabezado, lista izquierda, formulario seleccionado y grupos
  `Contenido`, `Imagen`, `Configuración` donde corresponda.
- [ ] Ocultar datos técnicos y ajustar microcopy de uso diario.
- [ ] Verificar Experiencias, Galería, Páginas y Bungalows.

## Task 6 - QA local

- [ ] Tests focalizados.
- [ ] Suite completa.
- [ ] Typecheck y lint focalizado.
- [ ] Build.
- [ ] Playwright autenticado de contenido y cupos.
- [ ] Registrar evidencia y detenerse antes de producción.
