# Spec tareas - Wakaya Public Content Hub

[Specs](../README.md) | [Feature](README.md)

## Regla de ejecución
No iniciar tareas UI hasta `gate-spdd-approved`. Cada tarea usa Red, Green, Refactor, review y evidencia. Los commits descritos pertenecen a la futura ejecución, no a esta documentación.

## T-006-001 - Dominio y migración de contenido
Objetivo: crear tablas, tipos, schemas y repositorio.

Archivos permitidos:
- `db/migrations/009_public_content_hub.sql`
- `src/lib/content/**`

Ciclo TDD:
1. Red: schema rechaza traducción incompleta, slug duplicado y orden con huecos.
2. Green: modelos y repositorio CRUD con versión optimista.
3. Refactor: separar persistencia de vistas públicas.

Comando: `npm test -- src/lib/content/schema.test.ts src/lib/content/store.test.ts src/lib/reservations/postgres-repository.test.ts && npm run typecheck`

Trazabilidad: RF-006-03, RF-006-04, RF-006-08, RF-006-11, RF-006-13.

## T-006-002 - Pipeline de media y crop
Objetivo: crear maestro WebP y variantes exactas.

Archivos permitidos:
- `src/lib/content/media/**`
- `package.json`

Ciclo TDD:
1. Red: fixture verifica nearLossless 95, 3200 px, crops y calidades 84-88.
2. Green: optimizer `sharp` y `MediaStorage`.
3. Refactor: checksum, cleanup y errores canónicos.

Comando: `npm test -- src/lib/content/media/image-optimizer.test.ts src/lib/content/media/filesystem-media-storage.test.ts && npm run typecheck`

Trazabilidad: RF-006-06, RF-006-07.

## T-006-002B - Consolidar Home y endpoints de media existentes
Objetivo: migrar Home a documento v2, delegar tres rutas legadas al servicio común y retirar escritura manual de URLs.

Archivos permitidos:
- `src/lib/home-content/**`
- `src/app/api/admin/home-content/**`
- `src/app/api/bungalows/[id]/media/**`
- `src/lib/reservations/schemas.ts`
- `src/lib/content/**`

Ciclo TDD:
1. Red: tests prueban referencias `experienceIds`, delegación común y rechazo de URL manual.
2. Green: adapter v1->v2, `contentMediaService` compartido y schemas por asset ID.
3. Refactor: eliminar imports/callers de pipelines paralelos.

Comando: `npm test -- src/lib/home-content/schema.test.ts src/lib/home-content/public-view.test.ts src/lib/home-content/store.test.ts src/app/api/admin/home-content/media/route.test.ts src/app/api/bungalows/[id]/media/hero/route.test.ts src/app/api/bungalows/[id]/media/gallery/route.test.ts src/lib/content/no-parallel-media-pipeline.test.ts`

Trazabilidad: RF-006-02, RF-006-05, RF-006-06, RF-006-12.

## T-006-003 - APIs admin
Objetivo: exponer content, experiences, gallery, bungalows y media con RBAC.

Archivos permitidos:
- `src/app/api/admin/content/**`
- `src/lib/rbac.ts`
- `src/middleware/authn.ts`

Ciclo TDD:
1. Red: tests 401/403, CRUD, `409`, `413` y `422`.
2. Green: Route Handlers según `api-contract.md`.
3. Refactor: normalizar responses y auditoría.

Comando: `npm test -- src/app/api/admin/content/route.test.ts src/app/api/admin/content/experiences/route.test.ts 'src/app/api/admin/content/experiences/[id]/route.test.ts' src/app/api/admin/content/gallery/route.test.ts 'src/app/api/admin/content/bungalows/[id]/route.test.ts' src/app/api/admin/content/media/route.test.ts src/middleware/authn.test.ts`

Trazabilidad: RF-006-02 a RF-006-08.

## T-006-004 - Shell `/admin/content`
Objetivo: crear entrada única y redirects legados.

Archivos permitidos:
- `src/app/admin/content/**`
- `src/app/admin/admin-navigation.ts`
- `src/app/admin/home/**`
- `src/app/admin/bungalows/**`

Ciclo TDD:
1. Red: una entrada nav y cuatro tabs accesibles.
2. Green: shell, loaders y redirects.
3. Refactor: componentes de estado y cabecera compartidos.

Comando: `npm test -- src/app/admin/content/content-hub.test.tsx src/app/admin/admin-shell.test.tsx`

Trazabilidad: RF-006-01, RF-006-02, RF-006-05, RF-006-12.

## T-006-005 - Editor visual y crop dialog
Objetivo: implementar CRUD, galería y crop obligatorio con `react-easy-crop`.

Archivos permitidos:
- `src/app/admin/content/**`
- `package.json`

Ciclo TDD:
1. Red: hero no guarda con un solo crop y reordenar funciona por botones.
2. Green: formularios ES/EN, media manager y crop dialog.
3. Refactor: aislar state machines de upload/publicación.

Comando: `npm test -- src/app/admin/content/content-hub.test.tsx src/app/admin/content/media/crop-dialog.test.tsx && npm run typecheck`

Trazabilidad: RF-006-03 a RF-006-07, RF-006-11.

## T-006-006 - Integración pública
Objetivo: servir contenido publicado, popup query-driven, CTA y `requestedExperienceId` persistido/visible en detalle.

Archivos permitidos:
- `src/app/[locale]/**`
- `src/components/public-site/**`
- `src/lib/content/**`
- `src/lib/reservations/**`
- `src/app/api/public/booking-requests/**`
- `src/app/admin/reservations/requests/[id]/**`

Ciclo TDD:
1. Red: URL directa abre popup, CTA conserva locale/slug y request/detalle conservan el ID.
2. Green: loaders, dialog, formulario precargado, persistencia y detalle operativo.
3. Refactor: quitar copy duplicado de experiencias/galería.

Comando: `npm test -- 'src/app/[locale]/localized-public-site.test.tsx' src/components/public-site/experience-dialog.test.tsx src/components/public-site/public-booking-request-form.test.tsx 'src/app/admin/reservations/requests/[id]/page.test.tsx'`

Trazabilidad: RF-006-09, RF-006-10, RF-006-11, RF-006-13.

## T-006-007 - QA y corte de compatibilidad
Objetivo: probar desktop/mobile, readers duales y recuperación por roll-forward.

Archivos permitidos:
- `e2e/public-content-hub.spec.ts`
- `specs/006-public-content-hub/**`
- `docs/fase-7-deploy/**`
- `docs/fase-8-operacion/**`

Ciclo TDD:
1. Red: e2e falla contra el flujo legado.
2. Green: cerrar rutas, datos y media.
3. Refactor: registrar evidencia y riesgos residuales.

Comandos:
```bash
npm test
npm run typecheck
npm run build
npm run test:e2e -- e2e/public-content-hub.spec.ts
npm run check:docs
```

Trazabilidad: RF-006-01 a RF-006-13.

## T-006-008 - Cerrar CRUD y persistencia operativa de media

Objetivo: completar eliminación/reemplazo de referencias, borrado seguro de
activos sin uso y guardas que impidan confirmar uploads efímeros en producción.

Archivos permitidos:
- `src/lib/content/media/**`
- `src/app/api/admin/content/media/**`
- `src/app/api/admin/content/bungalows/**`
- `src/app/admin/content/**`
- `src/app/admin/home/**`
- `src/app/api/health/**`
- `.env.example`
- `docs/fase-7-deploy/**`

Ciclo TDD:
1. Red: servicio y API fallan por ausencia de DELETE, referencias en uso y
   configuración durable; UI no expone quitar/eliminar.
2. Green: DELETE transaccional, resolución runtime de DB/storage, health de
   persistencia y acciones CRUD por módulo.
3. Refactor: mantener compatibilidad de URLs legadas y centralizar errores.

Comando:
`npm test -- src/lib/content/media/content-media-service.test.ts src/app/api/admin/content/media/route.test.ts 'src/app/api/admin/content/media/[assetId]/route.test.ts' 'src/app/api/admin/content/bungalows/[id]/route.test.ts' src/app/admin/content/content-hub.test.tsx src/app/admin/home/home-editor.test.tsx src/app/api/health/route.test.ts && npm run typecheck`

Trazabilidad: RF-006-14, RF-006-15, RF-006-16, RF-006-17.
