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

## T-010-005 - Validación guiada del Home

Red: tests exigen traducción de rutas Zod, resumen completo, conteo por bloque,
ausencia de `PUT` inválido, navegación y foco accesible.
Green: adaptador puro de incidencias, preflight local, lista `Ir al campo`, salto
automático, estado lateral y marcado del control.
Refactor: reutilizar el schema vigente y preservar errores de red/media/versión.

Comando: `npm test -- src/app/admin/home/home-validation.test.ts src/app/admin/home/home-editor.test.tsx && npm run typecheck`

## T-010-006 - Media administrada del Home

Red: el helper de media no existe y Playwright comprueba que elegir una imagen
no abre los recortes obligatorios.
Green: slides usan recortes `Desktop` y `Mobile`; Historia, Frase destacada y
Cierre usan recorte fijo. El editor sube por `/api/admin/content/media`, asocia
la variante WebP administrada y admite solo HTTP(S) o rutas internas
`/media/...` al publicar.
Refactor: reutilizar `CropDialog` y el pipeline compartido; no persistir URLs
con host local ni mantener la subida legada del Home.

Comando: `npm test -- src/lib/home-content/schema.test.ts src/app/admin/home/home-media-upload.test.ts src/app/admin/home/home-editor.test.tsx src/app/api/admin/content/media/route.test.ts && E2E_BASE_URL=http://localhost:3212 E2E_MUTATION_ALLOWED=1 npx playwright test e2e/home-media-upload.spec.ts`

## T-010-007 - Nombre y popup de media pública

Objetivo: persistir el nombre original de cada imagen y mostrarlo como una
acción accesible que abre la vista previa en Home, Experiencias, Galería y
Bungalows; Páginas no debe exponer un selector de media.

Archivos permitidos: `src/lib/content/media/`,
`src/app/admin/content/`, `src/app/admin/home/`, `src/app/api/admin/content/media/`,
`e2e/home-media-upload.spec.ts`, `e2e/media-filename-preview.spec.ts`,
`e2e/content-media-filename-preview.spec.ts` y la migración local
`db/migrations/013_media_original_filename.sql`.

Ciclo TDD:

1. **Red:** los tests de normalización, migración, servicio, resolver,
   componente y superficies administrativas fallaban porque no existían
   `originalFilename`, la carga en lote ni el trigger/popup compartido.
2. **Green:** `original_filename` nullable se normaliza y persiste; el
   backoffice hidrata metadata en un lote; el botón muestra el nombre
   inmediatamente y después de recargar; el diálogo permite `Cerrar`,
   `Escape` y backdrop, devuelve el foco y expone el error de carga controlado.
3. **Refactor:** Home y ContentHub comparten `MediaFilenamePreview` y el
   resolver isomórfico; la galería de Bungalows conserva miniaturas, ordenar,
   quitar y reemplazar; las rutas `/media/...` siguen siendo portables.

Alcance y gates:

- Commits de implementación y hardening: `673926d..88df083` (persistencia,
  metadata, popup, Home, ContentHub y guardas E2E locales).
- Gate de entrada: `gate-spdd-approved` continúa pendiente según el estado del
  proyecto; esta tarea no abre un gate de construcción nuevo.
- Gate de QA: la evidencia queda en
  [`06.09-media-filename-preview-local-evidence.md`](../../docs/fase-6-qa/06.09-media-filename-preview-local-evidence.md).
- Gate de deploy: `gate-7-8` permanece pendiente; no se ejecutó despliegue.

Comandos de verificación y resultados exactos (ambiente local):

```bash
npm test
# Test Files 153 passed | 2 skipped (155)
# Tests 502 passed | 3 skipped (505)

npm test -- src/lib/content/media/media-filename.test.ts \
  src/lib/content/media/media-original-filename-migration.test.ts \
  src/lib/content/media/admin-media-metadata.test.ts \
  src/lib/content/media/content-media-service.test.ts \
  src/app/admin/content/media/media-filename-preview.test.tsx \
  src/app/admin/home/home-editor.test.tsx \
  src/app/admin/content/content-hub.test.tsx \
  src/app/admin/content/page.test.tsx \
  src/app/api/admin/content/media/route.test.ts
# Test Files 9 passed (9) · Tests 77 passed (77)

npm run typecheck
# exit 0

npx eslint src/lib/content/media/admin-media-metadata.ts \
  src/lib/content/media/content-media-service.ts \
  src/lib/content/media/filesystem-media-storage.ts \
  src/lib/content/media/image-optimizer.test.ts \
  src/lib/content/media/media-filename.ts \
  src/app/admin/content/content-hub.tsx src/app/admin/content/page.tsx \
  src/app/admin/content/media/media-filename-preview.tsx \
  src/app/admin/home/home-editor.tsx src/app/admin/home/home-media-upload.ts \
  src/app/admin/home/home-validation.ts \
  src/app/api/admin/content/media/route.test.ts \
  e2e/content-media-filename-preview.spec.ts e2e/home-media-upload.spec.ts \
  e2e/home-validation.spec.ts e2e/media-filename-preview.spec.ts
# exit 0
npx eslint src/lib/content/media src/app/admin/content src/app/admin/home \
  e2e/home-media-upload.spec.ts e2e/media-filename-preview.spec.ts \
  e2e/content-media-filename-preview.spec.ts
# baseline existente: crop-dialog.tsx:74 react-hooks/set-state-in-effect

git diff --check
# exit 0

E2E_BASE_URL=http://localhost:3212 E2E_MUTATION_ALLOWED=1 npx playwright test \
  e2e/home-media-upload.spec.ts e2e/home-validation.spec.ts \
  e2e/media-filename-preview.spec.ts e2e/content-media-filename-preview.spec.ts \
  --project=chromium
# 4 passed (15.4s)

npm run build
# exit 0; 69 páginas generadas; standalone actualizado
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3212/api/health
# 200

E2E_BASE_URL=http://localhost:3212 E2E_MUTATION_ALLOWED=1 npx playwright test \
  e2e/home-media-upload.spec.ts e2e/content-media-filename-preview.spec.ts \
  --project=chromium
# 2 passed (9.2s)
```

La ESLint focalizada que excluye el archivo baseline `crop-dialog.tsx` terminó
con código 0; el único error del comando por directorios es preexistente y no
pertenece a este incremento.
